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
  /** 取得所有寵物 (包含自己擁有的與別人分享的) */
  async getAll(userId: string): Promise<(PetDoc & { id: string })[]> {
    // 取得自己的寵物
    const q1 = query(getUserCollection(userId, 'pets'), orderBy('createdAt', 'desc'));
    const snap1 = await getDocs(q1);
    const ownPets = snapshotToArray<PetDoc>(snap1);

    // 取得別人分享的寵物 (利用 collectionGroup)
    // 注意: 這需要 Firestore 建立複合索引 (pets 集合的 coParents 欄位)
    // 在這裡我們先使用前端過濾，若沒有設定 collectionGroup 索引的話
    const q2 = query(collectionGroup(db, 'pets'));
    const snap2 = await getDocs(q2);
    const sharedPets = snapshotToArray<PetDoc>(snap2).filter(pet => 
      pet.ownerId !== userId && 
      pet.coParents?.some(cp => cp.uid === userId)
    );

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
      const q2 = query(collectionGroup(db, 'pets'));
      const snap2 = await getDocs(q2);
      const sharedPets = snapshotToArray<PetDoc>(snap2).filter(pet => 
        pet.ownerId !== userId && 
        pet.coParents?.some(cp => cp.uid === userId)
      );

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
  /** 取得多個使用者所有提醒 */
  async getAll(ownerIds: string[]): Promise<(ReminderDoc & { id: string })[]> {
    const promises = ownerIds.map(async (uid) => {
      const q = query(getUserCollection(uid, 'reminders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshotToArray<ReminderDoc>(snapshot);
    });
    const results = await Promise.all(promises);
    return results.flat().sort((a, b) => b.createdAt - a.createdAt);
  },

  /** 即時監聽多個使用者提醒列表變更 */
  onRemindersChanged(
    ownerIds: string[],
    callback: (reminders: (ReminderDoc & { id: string })[]) => void
  ) {
    const unsubscribes: (() => void)[] = [];
    const allReminders = new Map<string, (ReminderDoc & { id: string })[]>();
    
    ownerIds.forEach(uid => {
      const q = query(getUserCollection(uid, 'reminders'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        allReminders.set(uid, snapshotToArray<ReminderDoc>(snapshot));
        const merged = Array.from(allReminders.values()).flat().sort((a, b) => b.createdAt - a.createdAt);
        callback(merged);
      });
      unsubscribes.push(unsub);
    });
    
    return () => unsubscribes.forEach(unsub => unsub());
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
  /** 取得多個使用者所有醫護紀錄 */
  async getAll(ownerIds: string[]): Promise<(MedicalDoc & { id: string })[]> {
    const promises = ownerIds.map(async (uid) => {
      const q = query(getUserCollection(uid, 'medical'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshotToArray<MedicalDoc>(snapshot);
    });
    const results = await Promise.all(promises);
    return results.flat().sort((a, b) => b.createdAt - a.createdAt);
  },

  /** 即時監聽多個使用者醫護列表 */
  onMedicalChanged(
    ownerIds: string[],
    callback: (records: (MedicalDoc & { id: string })[]) => void
  ) {
    const unsubscribes: (() => void)[] = [];
    const allRecords = new Map<string, (MedicalDoc & { id: string })[]>();
    
    ownerIds.forEach(uid => {
      const q = query(getUserCollection(uid, 'medical'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        allRecords.set(uid, snapshotToArray<MedicalDoc>(snapshot));
        const merged = Array.from(allRecords.values()).flat().sort((a, b) => b.createdAt - a.createdAt);
        callback(merged);
      });
      unsubscribes.push(unsub);
    });
    
    return () => unsubscribes.forEach(unsub => unsub());
  },

  /** 取得單一醫護紀錄 */
  async getById(userId: string, medicalId: string): Promise<(MedicalDoc & { id: string }) | null> {
    const docRef = getUserDoc(userId, 'medical', medicalId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as MedicalDoc & { id: string };
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
  /** 取得多個使用者所有日記 */
  async getAll(ownerIds: string[]): Promise<(DiaryDoc & { id: string })[]> {
    const promises = ownerIds.map(async (uid) => {
      const q = query(getUserCollection(uid, 'diaries'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshotToArray<DiaryDoc>(snapshot);
    });
    const results = await Promise.all(promises);
    return results.flat().sort((a, b) => b.date.localeCompare(a.date));
  },

  /** 即時監聽多個使用者日記列表 */
  onDiariesChanged(
    ownerIds: string[],
    callback: (diaries: (DiaryDoc & { id: string })[]) => void
  ) {
    const unsubscribes: (() => void)[] = [];
    const allDiaries = new Map<string, (DiaryDoc & { id: string })[]>();
    
    ownerIds.forEach(uid => {
      const q = query(getUserCollection(uid, 'diaries'), orderBy('date', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        allDiaries.set(uid, snapshotToArray<DiaryDoc>(snapshot));
        // Merge and sort
        const merged = Array.from(allDiaries.values()).flat().sort((a, b) => b.date.localeCompare(a.date));
        callback(merged);
      });
      unsubscribes.push(unsub);
    });
    
    return () => unsubscribes.forEach(unsub => unsub());
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

// ===== 邀請服務 (共育) =====

export const inviteService = {
  /** 產生邀請碼 */
  async createInvite(petId: string, ownerId: string, permission: 'edit' | 'view' = 'edit'): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const invitesCol = collection(db, 'invites');
    
    // 設定 7 天後過期
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await addDoc(invitesCol, {
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
    const invitesCol = collection(db, 'invites');
    const q = query(invitesCol, where('code', '==', code.toUpperCase()), limit(1));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      return { success: false, message: '無效的邀請碼或邀請碼已過期' };
    }

    const inviteDoc = snap.docs[0];
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
    
    await updateDoc(petRef, { coParents });

    // 使用完畢後刪除邀請碼
    await deleteDoc(inviteDoc.ref);

    return { success: true, message: '成功加入共同飼育！' };
  }
};
