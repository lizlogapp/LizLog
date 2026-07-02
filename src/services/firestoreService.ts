/**
 * Firestore 服務層
 * 
 * 統一管理所有 Firestore CRUD 操作，
 * 各頁面透過此服務存取資料庫，不再直接操作 mock 物件。
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

// ===== 型別定義 =====

export interface PetDoc {
  id?: string;
  name: string;
  species: string;
  birthDate: string;
  homeDate?: string;
  gender?: string;
  tag: string;
  imageUrl?: string;
  weight?: string;
  length?: string;
  nextReminder?: string;
  reminderNote?: string;
  lastVisit?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface ReminderDoc {
  id?: string;
  petId: string;         // 所屬寵物 ID
  type: string;
  freq: string;
  frequencyType: string;
  time: string;
  pets: string[];        // 關聯的寵物 ID 列表
  note: string;
  isOn: boolean;
  tagColor: string;
  everyNDays?: string;
  startDate?: string;
  selectedWeekDays?: number[];
  createdAt?: any;
  updatedAt?: any;
}

export interface MedicalDoc {
  id?: string;
  petId: string;
  title: string;
  date: string;
  type: string;
  hospital: string;
  note: string;
  tagColor: string;
  visit?: {
    date: string;
    hospital: string;
    doctor: string;
    reason: string;
    diagnosis: string;
    advice: string[];
    imageUrls: string[];
  };
  medication?: {
    startDate: string;
    endDate: string;
    medicine: string;
    method: string;
    frequency: string;
    dosage: string;
    note: string[];
  };
  createdAt?: any;
  updatedAt?: any;
}

export interface DiaryPetEntry {
  name: string;
  temp: string;
  humid: string;
  states: {
    bask: boolean;
    feed: boolean;
    bath: boolean;
    poop: boolean;
  };
}

export interface DiaryDoc {
  id?: string;
  date: string;
  title: string;
  weatherIcon: string;
  imageUrl?: string;
  pets: DiaryPetEntry[];
  records?: {
    temp?: string;
    humid?: string;
    bask?: string;
    feed?: string;
    appetite?: number;
    bath?: string;
    poop?: string;
    weight?: string;
    length?: string;
  };
  createdAt?: any;
  updatedAt?: any;
}

// ===== 工具函式 =====

/** 將 Firestore snapshot 轉換為帶有 id 的物件陣列 */
function snapshotToArray<T>(snapshot: QuerySnapshot<DocumentData>): (T & { id: string })[] {
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as (T & { id: string })[];
}

/** 取得使用者的子集合路徑 */
function getUserCollection(userId: string, collectionName: string) {
  return collection(db, 'users', userId, collectionName);
}

/** 取得使用者的子集合中的文件路徑 */
function getUserDoc(userId: string, collectionName: string, docId: string) {
  return doc(db, 'users', userId, collectionName, docId);
}

// ===== 寵物服務 =====

export const petService = {
  /** 取得所有寵物 */
  async getAll(userId: string): Promise<(PetDoc & { id: string })[]> {
    const q = query(
      getUserCollection(userId, 'pets'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshotToArray<PetDoc>(snapshot);
  },

  /** 即時監聽寵物列表變更 */
  onPetsChanged(
    userId: string,
    callback: (pets: (PetDoc & { id: string })[]) => void
  ) {
    const q = query(
      getUserCollection(userId, 'pets'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshotToArray<PetDoc>(snapshot));
    });
  },

  /** 取得單一寵物 */
  async getById(userId: string, petId: string): Promise<(PetDoc & { id: string }) | null> {
    const docRef = getUserDoc(userId, 'pets', petId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as PetDoc & { id: string };
  },

  /** 新增寵物 */
  async add(userId: string, data: Omit<PetDoc, 'id'>): Promise<string> {
    const colRef = getUserCollection(userId, 'pets');
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /** 更新寵物 */
  async update(userId: string, petId: string, data: Partial<PetDoc>): Promise<void> {
    const docRef = getUserDoc(userId, 'pets', petId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  /** 刪除寵物 */
  async delete(userId: string, petId: string): Promise<void> {
    const docRef = getUserDoc(userId, 'pets', petId);
    await deleteDoc(docRef);
  },

  /** 上傳寵物照片至 Firebase Storage */
  async uploadImage(userId: string, petId: string, uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `users/${userId}/pets/${petId}/photo.jpg`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  },
};

// ===== 提醒服務 =====

export const reminderService = {
  /** 取得使用者所有提醒 */
  async getAll(userId: string): Promise<(ReminderDoc & { id: string })[]> {
    const q = query(
      getUserCollection(userId, 'reminders'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshotToArray<ReminderDoc>(snapshot);
  },

  /** 即時監聽提醒列表變更 */
  onRemindersChanged(
    userId: string,
    callback: (reminders: (ReminderDoc & { id: string })[]) => void
  ) {
    const q = query(
      getUserCollection(userId, 'reminders'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshotToArray<ReminderDoc>(snapshot));
    });
  },

  /** 新增提醒 */
  async add(userId: string, data: Omit<ReminderDoc, 'id'>): Promise<string> {
    const colRef = getUserCollection(userId, 'reminders');
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /** 更新提醒 */
  async update(userId: string, reminderId: string, data: Partial<ReminderDoc>): Promise<void> {
    const docRef = getUserDoc(userId, 'reminders', reminderId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  /** 刪除提醒 */
  async delete(userId: string, reminderId: string): Promise<void> {
    const docRef = getUserDoc(userId, 'reminders', reminderId);
    await deleteDoc(docRef);
  },
};

// ===== 醫護服務 =====

export const medicalService = {
  /** 取得使用者所有醫護紀錄 */
  async getAll(userId: string): Promise<(MedicalDoc & { id: string })[]> {
    const q = query(
      getUserCollection(userId, 'medical'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshotToArray<MedicalDoc>(snapshot);
  },

  /** 即時監聽醫護列表 */
  onMedicalChanged(
    userId: string,
    callback: (records: (MedicalDoc & { id: string })[]) => void
  ) {
    const q = query(
      getUserCollection(userId, 'medical'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshotToArray<MedicalDoc>(snapshot));
    });
  },

  /** 新增醫護紀錄 */
  async add(userId: string, data: Omit<MedicalDoc, 'id'>): Promise<string> {
    const colRef = getUserCollection(userId, 'medical');
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /** 更新醫護紀錄 */
  async update(userId: string, medicalId: string, data: Partial<MedicalDoc>): Promise<void> {
    const docRef = getUserDoc(userId, 'medical', medicalId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  /** 刪除醫護紀錄 */
  async delete(userId: string, medicalId: string): Promise<void> {
    const docRef = getUserDoc(userId, 'medical', medicalId);
    await deleteDoc(docRef);
  },
};

// ===== 日記服務 =====

export const diaryService = {
  /** 取得所有日記 */
  async getAll(userId: string): Promise<(DiaryDoc & { id: string })[]> {
    const q = query(
      getUserCollection(userId, 'diaries'),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshotToArray<DiaryDoc>(snapshot);
  },

  /** 即時監聽日記列表 */
  onDiariesChanged(
    userId: string,
    callback: (diaries: (DiaryDoc & { id: string })[]) => void
  ) {
    const q = query(
      getUserCollection(userId, 'diaries'),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshotToArray<DiaryDoc>(snapshot));
    });
  },

  /** 新增日記 */
  async add(userId: string, data: Omit<DiaryDoc, 'id'>): Promise<string> {
    const colRef = getUserCollection(userId, 'diaries');
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /** 更新日記 */
  async update(userId: string, diaryId: string, data: Partial<DiaryDoc>): Promise<void> {
    const docRef = getUserDoc(userId, 'diaries', diaryId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  /** 刪除日記 */
  async delete(userId: string, diaryId: string): Promise<void> {
    const docRef = getUserDoc(userId, 'diaries', diaryId);
    await deleteDoc(docRef);
  },

  /** 上傳日記照片 */
  async uploadImage(userId: string, diaryId: string, uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `users/${userId}/diaries/${diaryId}/photo.jpg`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  },
};
