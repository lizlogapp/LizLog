/**
 * IoT 感測器服務層
 * 
 * 負責管理 ESP32 溫濕度感測器的即時數據讀取、
 * 感測器綁定/共用/解綁，以及歷史數據存取。
 * 
 * 即時數據使用 Firebase Realtime Database（低延遲）
 * 歷史摘要使用 Firestore（結構化查詢）
 */

import { ref, onValue, off, get } from 'firebase/database';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { rtdb, db } from '../config/firebase';
import { PetDoc, petService } from './firestoreService';

// ===== 型別定義 =====

/** 感測器即時數據（來自 Realtime DB） */
export interface SensorData {
  temperature: number;
  humidity: number;
  lastUpdated: number;  // Unix timestamp (秒)
  status: 'online' | 'offline';
}

/** 每日摘要（儲存在 Firestore） */
export interface DailySummary {
  date: string;         // YYYY-MM-DD
  sensorId: string;
  tempHigh: number;
  tempLow: number;
  tempAvg: number;
  humidHigh: number;
  humidLow: number;
  humidAvg: number;
  readings: number;     // 當天收到的資料筆數
}

/** 異常警報紀錄（儲存在 Firestore） */
export interface SensorAlert {
  id?: string;
  sensorId: string;
  petName: string;
  type: 'temperature_high' | 'temperature_low' | 'humidity_high' | 'humidity_low';
  value: number;
  threshold: number;
  timestamp: any;
}

// ===== 感測器即時數據服務 =====

export const sensorService = {

  /**
   * 解析寵物應該使用的 sensorId
   * 如果有 sharedSensorPetId，就去找那隻寵物的 sensorId
   */
  async resolveSensorId(
    pet: PetDoc & { id: string },
    allPets: (PetDoc & { id: string })[]
  ): Promise<string | null> {
    // 優先使用共用的感測器
    if (pet.sharedSensorPetId) {
      const sharedPet = allPets.find(p => p.id === pet.sharedSensorPetId);
      if (sharedPet?.sensorId) {
        return sharedPet.sensorId;
      }
    }
    // 否則使用自己的
    return pet.sensorId || null;
  },

  /**
   * 即時監聽某個感測器的數據
   * @returns 取消監聽的函式
   */
  onSensorDataChanged(
    sensorId: string,
    callback: (data: SensorData | null) => void
  ): () => void {
    const sensorRef = ref(rtdb, `sensors/${sensorId}`);

    const handler = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.val();
        const now = Math.floor(Date.now() / 1000);
        const lastUpdated = raw.lastUpdated || 0;
        // 超過 5 分鐘未更新，視為離線
        const isOffline = (now - lastUpdated) > 300;

        callback({
          temperature: raw.temperature ?? 0,
          humidity: raw.humidity ?? 0,
          lastUpdated,
          status: isOffline ? 'offline' : 'online',
        });
      } else {
        callback(null);
      }
    });

    // 回傳取消訂閱的函式
    return () => off(sensorRef, 'value', handler);
  },

  /**
   * 一次性讀取感測器數據
   */
  async getSensorData(sensorId: string): Promise<SensorData | null> {
    const sensorRef = ref(rtdb, `sensors/${sensorId}`);
    const snapshot = await get(sensorRef);
    if (!snapshot.exists()) return null;

    const raw = snapshot.val();
    const now = Math.floor(Date.now() / 1000);
    const lastUpdated = raw.lastUpdated || 0;

    return {
      temperature: raw.temperature ?? 0,
      humidity: raw.humidity ?? 0,
      lastUpdated,
      status: (now - lastUpdated) > 300 ? 'offline' : 'online',
    };
  },

  // ===== 感測器綁定管理 =====

  /**
   * 將感測器綁定到寵物
   */
  async bindSensor(userId: string, petId: string, sensorId: string): Promise<void> {
    await petService.update(userId, petId, {
      sensorId,
      sharedSensorPetId: undefined, // 綁定自己的感測器時，清除共用設定
    });
  },

  /**
   * 設定寵物共用另一隻寵物的感測器
   */
  async shareSensor(userId: string, petId: string, targetPetId: string): Promise<void> {
    await petService.update(userId, petId, {
      sharedSensorPetId: targetPetId,
      sensorId: undefined, // 共用時清除自己的 sensorId
    });
  },

  /**
   * 解除感測器綁定（包含自有與共用）
   */
  async unbindSensor(userId: string, petId: string): Promise<void> {
    await petService.update(userId, petId, {
      sensorId: undefined,
      sharedSensorPetId: undefined,
    });
  },

  // ===== 安全範圍設定 =====

  /**
   * 更新寵物的安全範圍
   */
  async updateSafetyRange(
    userId: string,
    petId: string,
    ranges: { tempMin?: number; tempMax?: number; humidMin?: number; humidMax?: number }
  ): Promise<void> {
    await petService.update(userId, petId, ranges);
  },

  /**
   * 取得寵物的安全範圍（帶預設值）
   */
  getSafetyRange(pet: PetDoc): { tempMin: number; tempMax: number; humidMin: number; humidMax: number } {
    return {
      tempMin: pet.tempMin ?? 25,
      tempMax: pet.tempMax ?? 35,
      humidMin: pet.humidMin ?? 30,
      humidMax: pet.humidMax ?? 50,
    };
  },

  // ===== 歷史數據（每日摘要） =====

  /**
   * 取得某感測器的每日摘要（用於圖表）
   */
  async getDailySummaries(
    sensorId: string,
    days: number = 30
  ): Promise<DailySummary[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];

    const colRef = collection(db, 'sensorHistory', sensorId, 'daily');
    const q = query(
      colRef,
      where('date', '>=', startStr),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as DailySummary);
  },

  /**
   * 取得異常警報紀錄
   */
  async getAlerts(
    sensorId: string,
    maxCount: number = 20
  ): Promise<SensorAlert[]> {
    const colRef = collection(db, 'sensorAlerts', sensorId, 'alerts');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SensorAlert[];
  },
};
