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
  collectionGroup,
  where,
  limit,
  setDoc,
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
  ownerId?: string;
  coParents?: { uid: string; name: string; isMainOwner: boolean; permission?: 'edit' | 'view'; muteReminders?: boolean }[];
  coParentIds?: string[];
  editorIds?: string[];
  lastInviteCode?: string;
  // IoT 感測器欄位
  sensorId?: string;            // 綁定的 ESP32 感測器裝置 ID
  sharedSensorPetId?: string;   // 共用另一隻寵物的感測器（優先於 sensorId）
  // 安全範圍（異常警報閾值）
  tempMin?: number;             // 溫度下限，預設 25
  tempMax?: number;             // 溫度上限，預設 35
  humidMin?: number;            // 濕度下限，預設 30
  humidMax?: number;            // 濕度上限，預設 50
  createdAt?: any;
  updatedAt?: any;
}

export interface InviteDoc {
  id?: string;
  code: string;
  petId: string;
  ownerId: string;
  expiresAt: any;
  permission: 'edit' | 'view';
  createdAt?: any;
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
  ownerId?: string;
  accessUserIds?: string[];
  editorIds?: string[];
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
  ownerId?: string;
  accessUserIds?: string[];
  editorIds?: string[];
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
  content?: string;
  weatherIcon: string;
  imageUrl?: string;
  attachments?: { name: string; url: string; mimeType?: string }[];
  pets: DiaryPetEntry[];
  petIds?: string[];
  ownerId?: string;
  accessUserIds?: string[];
  editorIds?: string[];
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

/** 合併跨使用者子集合時保留文件實際擁有者，供共育權限與後續路由使用。 */
function snapshotToOwnedArray<T extends { ownerId?: string }>(
  snapshot: QuerySnapshot<DocumentData>,
  ownerId: string,
): (T & { id: string })[] {
  return snapshotToArray<T>(snapshot).map(item => ({
    ...item,
    ownerId: item.ownerId || ownerId,
  }));
}

function timestampToMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function safeStorageName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || `file-${Date.now()}`;
}

async function uploadUri(path: string, uri: string, contentType?: string): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error('無法讀取選取的檔案');
  const blob = await response.blob();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, contentType ? { contentType } : undefined);
  return getDownloadURL(storageRef);
}

/** 取得使用者的子集合路徑 */
function getUserCollection(userId: string, collectionName: string) {
  return collection(db, 'users', userId, collectionName);
}

/** 取得使用者的子集合中的文件路徑 */
function getUserDoc(userId: string, collectionName: string, docId: string) {
  return doc(db, 'users', userId, collectionName, docId);
}

function petAccessFields(pet: PetDoc, ownerId: string) {
  const coParents = pet.coParents || [];
  const coParentIds = Array.from(new Set([ownerId, ...coParents.map(member => member.uid)]));
  const editorIds = Array.from(new Set([
    ownerId,
    ...coParents
      .filter(member => member.isMainOwner || member.permission !== 'view')
      .map(member => member.uid),
  ]));
  return { coParentIds, editorIds };
}

async function recordAccessFields(ownerId: string, petId: string) {
  const snapshot = await getDoc(getUserDoc(ownerId, 'pets', petId));
  if (!snapshot.exists()) return { accessUserIds: [ownerId], editorIds: [ownerId] };
  const fields = petAccessFields(snapshot.data() as PetDoc, ownerId);
  return { accessUserIds: fields.coParentIds, editorIds: fields.editorIds };
}

// ===== 寵物服務 =====

export const petService = {
  /** 取得所有寵物 (包含自己擁有的與別人分享的) */
  async getAll(userId: string): Promise<(PetDoc & { id: string })[]> {
    // 取得自己的寵物
    const q1 = query(getUserCollection(userId, 'pets'), orderBy('createdAt', 'desc'));
    const snap1 = await getDocs(q1);
    const ownPets = snapshotToArray<PetDoc>(snap1).map(pet => ({
      ...pet,
      ...petAccessFields(pet, userId),
      ownerId: pet.ownerId || userId,
    }));
    await Promise.all(ownPets
      .filter(pet => !snap1.docs.find(item => item.id === pet.id)?.data().coParentIds)
      .map(pet => updateDoc(getUserDoc(userId, 'pets', pet.id), {
        ownerId: userId,
        coParentIds: pet.coParentIds,
        editorIds: pet.editorIds,
        updatedAt: serverTimestamp(),
      })));

    // 取得別人分享的寵物 (利用 collectionGroup)
    // 注意: 這需要 Firestore 建立複合索引 (pets 集合的 coParents 欄位)
    // 在這裡我們先使用前端過濾，若沒有設定 collectionGroup 索引的話
    const q2 = query(collectionGroup(db, 'pets'), where('coParentIds', 'array-contains', userId));
    const snap2 = await getDocs(q2);
    const sharedPets = snapshotToArray<PetDoc>(snap2).filter(pet => pet.ownerId !== userId);

    return [...ownPets, ...sharedPets];
  },

  /** 即時監聽寵物列表變更 (這裡為了簡化，僅監聽自己的寵物集合。若要監聽所有，需結合多個 onSnapshot) */
  onPetsChanged(
    userId: string,
    callback: (pets: (PetDoc & { id: string })[]) => void
  ) {
    const q = query(getUserCollection(userId, 'pets'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, async (snapshot) => {
      const ownPets = snapshotToArray<PetDoc>(snapshot);
      
      // 簡單起見，當自己的寵物變更時，順便重新拉取一次分享的寵物
      const q2 = query(collectionGroup(db, 'pets'), where('coParentIds', 'array-contains', userId));
      const snap2 = await getDocs(q2);
      const sharedPets = snapshotToArray<PetDoc>(snap2).filter(pet => pet.ownerId !== userId);

      callback([...ownPets, ...sharedPets]);
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
  async add(userId: string, data: Omit<PetDoc, 'id'>, userName: string = '主人'): Promise<string> {
    const colRef = getUserCollection(userId, 'pets');
    const docRef = await addDoc(colRef, {
      ...data,
      ownerId: userId,
      coParents: [{ uid: userId, name: userName, isMainOwner: true }],
      coParentIds: [userId],
      editorIds: [userId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /** 更新寵物 */
  async update(userId: string, petId: string, data: Partial<PetDoc>): Promise<void> {
    const docRef = getUserDoc(userId, 'pets', petId);
    const sharingFields = data.coParents ? petAccessFields({ ...data, coParents: data.coParents } as PetDoc, userId) : {};
    await updateDoc(docRef, {
      ...data,
      ...sharingFields,
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
    return uploadUri(`users/${userId}/pets/${petId}/photo.jpg`, uri, 'image/jpeg');
  },
};

// ===== 提醒服務 =====

export const reminderService = {
  /** 只取得自己擁有或 accessUserIds 明確包含自己的提醒。 */
  async getAll(userId: string): Promise<(ReminderDoc & { id: string })[]> {
    const ownSnapshot = await getDocs(query(getUserCollection(userId, 'reminders'), orderBy('createdAt', 'desc')));
    const own = snapshotToOwnedArray<ReminderDoc>(ownSnapshot, userId);
    await Promise.all(own.filter(item => !item.accessUserIds).map(async item => {
      const access = await recordAccessFields(userId, item.petId);
      await updateDoc(getUserDoc(userId, 'reminders', item.id), access);
      Object.assign(item, access);
    }));
    const sharedSnapshot = await getDocs(query(collectionGroup(db, 'reminders'), where('accessUserIds', 'array-contains', userId)));
    const merged = new Map<string, ReminderDoc & { id: string }>();
    [...own, ...snapshotToArray<ReminderDoc>(sharedSnapshot)].forEach(item => merged.set(`${item.ownerId || userId}:${item.id}`, item));
    return Array.from(merged.values()).sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));
  },

  async getById(userId: string, reminderId: string): Promise<(ReminderDoc & { id: string }) | null> {
    const snapshot = await getDoc(getUserDoc(userId, 'reminders', reminderId));
    if (!snapshot.exists()) return null;

    return {
      id: snapshot.id,
      ...snapshot.data(),
      ownerId: userId,
    } as ReminderDoc & { id: string };
  },

  /** 即時監聽多個使用者提醒列表變更 */
  onRemindersChanged(
    userId: string,
    callback: (reminders: (ReminderDoc & { id: string })[]) => void
  ) {
    const unsubscribes: (() => void)[] = [];
    const sources = new Map<string, (ReminderDoc & { id: string })[]>();
    const emit = () => {
      const merged = new Map<string, ReminderDoc & { id: string }>();
      Array.from(sources.values()).flat().forEach(item => merged.set(`${item.ownerId || userId}:${item.id}`, item));
      callback(Array.from(merged.values()).sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt)));
    };
    unsubscribes.push(onSnapshot(query(getUserCollection(userId, 'reminders'), orderBy('createdAt', 'desc')), snapshot => {
      const own = snapshotToOwnedArray<ReminderDoc>(snapshot, userId);
      sources.set('own', own);
      void Promise.all(own.filter(item => !item.accessUserIds).map(async item => {
        const access = await recordAccessFields(userId, item.petId);
        await updateDoc(getUserDoc(userId, 'reminders', item.id), access);
      }));
      emit();
    }));
    unsubscribes.push(onSnapshot(query(collectionGroup(db, 'reminders'), where('accessUserIds', 'array-contains', userId)), snapshot => {
      sources.set('shared', snapshotToArray<ReminderDoc>(snapshot));
      emit();
    }));
    return () => unsubscribes.forEach(unsub => unsub());
  },

  /** 新增提醒 */
  async add(userId: string, data: Omit<ReminderDoc, 'id'>): Promise<string> {
    const colRef = getUserCollection(userId, 'reminders');
    const access = await recordAccessFields(userId, data.petId);
    const docRef = await addDoc(colRef, {
      ...data,
      ...access,
      ownerId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /** 更新提醒 */
  async update(userId: string, reminderId: string, data: Partial<ReminderDoc>): Promise<void> {
    const docRef = getUserDoc(userId, 'reminders', reminderId);
    const current = await getDoc(docRef);
    const petId = data.petId || (current.data() as ReminderDoc | undefined)?.petId;
    const access = petId ? await recordAccessFields(userId, petId) : {};
    await updateDoc(docRef, {
      ...data,
      ...access,
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
  /** 只取得自己擁有或 accessUserIds 明確包含自己的醫護紀錄。 */
  async getAll(userId: string): Promise<(MedicalDoc & { id: string })[]> {
    const ownSnapshot = await getDocs(query(getUserCollection(userId, 'medical'), orderBy('createdAt', 'desc')));
    const own = snapshotToOwnedArray<MedicalDoc>(ownSnapshot, userId);
    await Promise.all(own.filter(item => !item.accessUserIds).map(async item => {
      const access = await recordAccessFields(userId, item.petId);
      await updateDoc(getUserDoc(userId, 'medical', item.id), access);
      Object.assign(item, access);
    }));
    const sharedSnapshot = await getDocs(query(collectionGroup(db, 'medical'), where('accessUserIds', 'array-contains', userId)));
    const merged = new Map<string, MedicalDoc & { id: string }>();
    [...own, ...snapshotToArray<MedicalDoc>(sharedSnapshot)].forEach(item => merged.set(`${item.ownerId || userId}:${item.id}`, item));
    return Array.from(merged.values()).sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));
  },

  /** 即時監聽多個使用者醫護列表 */
  onMedicalChanged(
    userId: string,
    callback: (records: (MedicalDoc & { id: string })[]) => void
  ) {
    const unsubscribes: (() => void)[] = [];
    const sources = new Map<string, (MedicalDoc & { id: string })[]>();
    const emit = () => {
      const merged = new Map<string, MedicalDoc & { id: string }>();
      Array.from(sources.values()).flat().forEach(item => merged.set(`${item.ownerId || userId}:${item.id}`, item));
      callback(Array.from(merged.values()).sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt)));
    };
    unsubscribes.push(onSnapshot(query(getUserCollection(userId, 'medical'), orderBy('createdAt', 'desc')), snapshot => {
      const own = snapshotToOwnedArray<MedicalDoc>(snapshot, userId);
      sources.set('own', own);
      void Promise.all(own.filter(item => !item.accessUserIds).map(async item => {
        const access = await recordAccessFields(userId, item.petId);
        await updateDoc(getUserDoc(userId, 'medical', item.id), access);
      }));
      emit();
    }));
    unsubscribes.push(onSnapshot(query(collectionGroup(db, 'medical'), where('accessUserIds', 'array-contains', userId)), snapshot => {
      sources.set('shared', snapshotToArray<MedicalDoc>(snapshot));
      emit();
    }));
    return () => unsubscribes.forEach(unsub => unsub());
  },

  /** 取得單一醫護紀錄 */
  async getById(userId: string, medicalId: string): Promise<(MedicalDoc & { id: string }) | null> {
    const docRef = getUserDoc(userId, 'medical', medicalId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data(), ownerId: userId } as MedicalDoc & { id: string };
  },

  /** 新增醫護紀錄 */
  async add(userId: string, data: Omit<MedicalDoc, 'id'>): Promise<string> {
    const colRef = getUserCollection(userId, 'medical');
    const access = await recordAccessFields(userId, data.petId);
    const docRef = await addDoc(colRef, {
      ...data,
      ...access,
      ownerId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /** 更新醫護紀錄 */
  async update(userId: string, medicalId: string, data: Partial<MedicalDoc>): Promise<void> {
    const docRef = getUserDoc(userId, 'medical', medicalId);
    const current = await getDoc(docRef);
    const petId = data.petId || (current.data() as MedicalDoc | undefined)?.petId;
    const access = petId ? await recordAccessFields(userId, petId) : {};
    await updateDoc(docRef, {
      ...data,
      ...access,
      updatedAt: serverTimestamp(),
    });
  },

  /** 刪除醫護紀錄 */
  async delete(userId: string, medicalId: string): Promise<void> {
    const docRef = getUserDoc(userId, 'medical', medicalId);
    await deleteDoc(docRef);
  },

  /** 上傳醫療紀錄照片。 */
  async uploadImage(userId: string, medicalId: string, uri: string, index: number): Promise<string> {
    return uploadUri(
      `users/${userId}/medical/${medicalId}/${Date.now()}-${index}.jpg`,
      uri,
      'image/jpeg',
    );
  },
};

// ===== 日記服務 =====

export const diaryService = {
  /** 只取得自己擁有或 accessUserIds 明確包含自己的日記。 */
  async getAll(userId: string): Promise<(DiaryDoc & { id: string })[]> {
    const ownSnapshot = await getDocs(query(getUserCollection(userId, 'diaries'), orderBy('date', 'desc')));
    const own = snapshotToOwnedArray<DiaryDoc>(ownSnapshot, userId);
    await Promise.all(own.filter(item => !item.accessUserIds && item.petIds?.[0]).map(async item => {
      const access = await recordAccessFields(userId, item.petIds![0]);
      await updateDoc(getUserDoc(userId, 'diaries', item.id), access);
      Object.assign(item, access);
    }));
    const sharedSnapshot = await getDocs(query(collectionGroup(db, 'diaries'), where('accessUserIds', 'array-contains', userId)));
    const merged = new Map<string, DiaryDoc & { id: string }>();
    [...own, ...snapshotToArray<DiaryDoc>(sharedSnapshot)].forEach(item => merged.set(`${item.ownerId || userId}:${item.id}`, item));
    return Array.from(merged.values()).sort((a, b) => b.date.localeCompare(a.date));
  },

  /** 即時監聽多個使用者日記列表 */
  onDiariesChanged(
    userId: string,
    callback: (diaries: (DiaryDoc & { id: string })[]) => void
  ) {
    const unsubscribes: (() => void)[] = [];
    const sources = new Map<string, (DiaryDoc & { id: string })[]>();
    const emit = () => {
      const merged = new Map<string, DiaryDoc & { id: string }>();
      Array.from(sources.values()).flat().forEach(item => merged.set(`${item.ownerId || userId}:${item.id}`, item));
      callback(Array.from(merged.values()).sort((a, b) => b.date.localeCompare(a.date)));
    };
    unsubscribes.push(onSnapshot(query(getUserCollection(userId, 'diaries'), orderBy('date', 'desc')), snapshot => {
      const own = snapshotToOwnedArray<DiaryDoc>(snapshot, userId);
      sources.set('own', own);
      void Promise.all(own.filter(item => !item.accessUserIds && item.petIds?.[0]).map(async item => {
        const access = await recordAccessFields(userId, item.petIds![0]);
        await updateDoc(getUserDoc(userId, 'diaries', item.id), access);
      }));
      emit();
    }));
    unsubscribes.push(onSnapshot(query(collectionGroup(db, 'diaries'), where('accessUserIds', 'array-contains', userId)), snapshot => {
      sources.set('shared', snapshotToArray<DiaryDoc>(snapshot));
      emit();
    }));
    return () => unsubscribes.forEach(unsub => unsub());
  },

  /** 取得單一日記；ownerId 必須是該文件所屬使用者。 */
  async getById(ownerId: string, diaryId: string): Promise<(DiaryDoc & { id: string }) | null> {
    const docSnap = await getDoc(getUserDoc(ownerId, 'diaries', diaryId));
    if (!docSnap.exists()) return null;
    return {
      id: docSnap.id,
      ...docSnap.data(),
      ownerId,
    } as DiaryDoc & { id: string };
  },

  /** 新增日記 */
  async add(userId: string, data: Omit<DiaryDoc, 'id'>): Promise<string> {
    const colRef = getUserCollection(userId, 'diaries');
    const access = data.petIds?.[0]
      ? await recordAccessFields(userId, data.petIds[0])
      : { accessUserIds: [userId], editorIds: [userId] };
    const docRef = await addDoc(colRef, {
      ...data,
      ...access,
      ownerId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /** 更新日記 */
  async update(userId: string, diaryId: string, data: Partial<DiaryDoc>): Promise<void> {
    const docRef = getUserDoc(userId, 'diaries', diaryId);
    const current = await getDoc(docRef);
    const petId = data.petIds?.[0] || (current.data() as DiaryDoc | undefined)?.petIds?.[0];
    const access = petId ? await recordAccessFields(userId, petId) : {};
    await updateDoc(docRef, {
      ...data,
      ...access,
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
    return uploadUri(`users/${userId}/diaries/${diaryId}/photo.jpg`, uri, 'image/jpeg');
  },

  /** 上傳日記附件。 */
  async uploadAttachment(
    userId: string,
    diaryId: string,
    asset: { uri: string; name: string; mimeType?: string },
  ): Promise<{ name: string; url: string; mimeType?: string }> {
    const name = safeStorageName(asset.name);
    const url = await uploadUri(
      `users/${userId}/diaries/${diaryId}/attachments/${Date.now()}-${name}`,
      asset.uri,
      asset.mimeType,
    );
    return { name: asset.name, url, mimeType: asset.mimeType };
  },
};

// ===== 邀請服務 (共育) =====

export const inviteService = {
  /** 產生邀請碼 */
  async createInvite(petId: string, ownerId: string, permission: 'edit' | 'view' = 'edit'): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const inviteRef = doc(db, 'invites', code);
    
    // 設定 7 天後過期
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await setDoc(inviteRef, {
      code,
      petId,
      ownerId,
      permission,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: serverTimestamp(),
    });
    return code;
  },

  /** 使用邀請碼 */
  async consumeInvite(code: string, userId: string, userName: string): Promise<{ success: boolean; message: string }> {
    const normalizedCode = code.toUpperCase();
    const inviteDoc = await getDoc(doc(db, 'invites', normalizedCode));
    if (!inviteDoc.exists()) {
      return { success: false, message: '無效的邀請碼或邀請碼已過期' };
    }
    const data = inviteDoc.data() as InviteDoc;

    if (data.expiresAt.toDate() < new Date()) {
      return { success: false, message: '邀請碼已過期' };
    }

    // 將使用者加入寵物的 coParents 陣列
    const petRef = getUserDoc(data.ownerId, 'pets', data.petId);
    const petSnap = await getDoc(petRef);
    
    if (!petSnap.exists()) {
      return { success: false, message: '找不到該寵物資料' };
    }

    const petData = petSnap.data() as PetDoc;
    const coParents = petData.coParents || [];
    
    if (coParents.some(cp => cp.uid === userId)) {
      return { success: false, message: '您已經是該寵物的共同飼育者' };
    }

    const permission = data.permission || 'edit';

    coParents.push({ uid: userId, name: userName, isMainOwner: false, permission, muteReminders: false });
    const sharingFields = petAccessFields({ ...petData, coParents } as PetDoc, data.ownerId);
    
    await updateDoc(petRef, { coParents, ...sharingFields, lastInviteCode: normalizedCode, updatedAt: serverTimestamp() });

    // 使用完畢後刪除邀請碼
    await deleteDoc(inviteDoc.ref);

    return { success: true, message: '成功加入共同飼育！' };
  }
};
