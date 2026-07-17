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
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { getRandomBytes } from 'expo-crypto';
import { auth, db, storage } from '../config/firebase';
import {
  closeLocalBlob,
  createImageVariants,
  IMAGE_POLICY,
  readLocalBlob,
} from './imageService';
import {
  cancelReminderNotification,
} from './notificationService';

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
  thumbnailUrl?: string;
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
  types?: string[];
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
    imageThumbnailUrls?: string[];
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
  petId?: string;
  name: string;
  temp: string;
  humid: string;
  states: {
    bask: boolean;
    feed: boolean;
    bath: boolean;
    poop: boolean;
    molt?: boolean;
  };
}

export interface DiaryDoc {
  id?: string;
  status?: 'pending' | 'published';
  aclRevisionPetId?: string;
  date: string;
  title: string;
  content?: string;
  weatherIcon: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  imageUrls?: string[];
  thumbnailUrls?: string[];
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
    molt?: string;
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
  const blob = await readLocalBlob(uri);
  const storageRef = ref(storage, path);
  try {
    await uploadBytes(storageRef, blob, contentType ? { contentType } : undefined);
  } finally {
    closeLocalBlob(blob);
  }
  return getDownloadURL(storageRef);
}

export type UploadedImage = { imageUrl: string; thumbnailUrl: string };

function localDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function reserveDailyImageUpload(userId: string): Promise<void> {
  const day = localDayKey();
  const usageRef = doc(db, 'users', userId, 'uploadUsage', day);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(usageRef);
    const current = Number(snapshot.data()?.imageCount || 0);
    if (current >= IMAGE_POLICY.dailyUploadLimit) {
      throw new Error(`今日圖片上傳已達 ${IMAGE_POLICY.dailyUploadLimit} 張上限`);
    }
    transaction.set(usageRef, {
      ownerId: userId,
      day,
      imageCount: current + 1,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}

async function uploadImagePair(
  folder: string,
  uri: string,
  quotaUserId: string,
  baseName = 'photo',
): Promise<UploadedImage> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('登入狀態已失效，請重新登入後再試');
  }

  // React Native 使用 Firebase Web SDK 時，確保 Storage request 取得最新登入 token。
  await currentUser.getIdToken(true);
  const variants = await createImageVariants(uri);
  await reserveDailyImageUpload(quotaUserId);

  // 循序上傳，避免 Android 上兩個 uploadBytes 同時取得 token 時發生競態。
  const imageUrl = await uploadUri(
    `${folder}/${baseName}.jpg`,
    variants.displayUri,
    'image/jpeg',
  );

  let thumbnailUrl = imageUrl;
  try {
    thumbnailUrl = await uploadUri(
      `${folder}/${baseName}-thumb.jpg`,
      variants.thumbnailUri,
      'image/jpeg',
    );
  } catch (error) {
    // 縮圖是顯示最佳化；主圖成功時不應因縮圖失敗阻斷資料建立。
    if (__DEV__) console.warn('Thumbnail upload fallback:', (error as { code?: string })?.code ?? 'unknown');
  }

  return { imageUrl, thumbnailUrl };
}

async function deleteStorageFolder(path: string): Promise<void> {
  const result = await listAll(ref(storage, path));
  await Promise.all([
    ...result.items.map(item => deleteObject(item)),
    ...result.prefixes.map(prefix => deleteStorageFolder(prefix.fullPath)),
  ]);
}

async function deleteKnownPetImages(path: string): Promise<void> {
  await Promise.all(['photo.jpg', 'photo-thumb.jpg'].map(async fileName => {
    try {
      await deleteObject(ref(storage, `${path}/${fileName}`));
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: string }).code || '')
        : '';
      if (code !== 'storage/object-not-found') throw error;
    }
  }));
}

type StorageCleanupTask = {
  ownerId: string;
  paths: string[];
  type: 'pet-delete';
  createdAt?: unknown;
};

function safeCleanupPaths(ownerId: string, paths: string[]): string[] {
  const prefix = `users/${ownerId}/`;
  return Array.from(new Set(paths.filter(path => path.startsWith(prefix) && !path.includes('..'))));
}

async function runStorageCleanup(ownerId: string, paths: string[]): Promise<void> {
  const safePaths = safeCleanupPaths(ownerId, paths);
  if (safePaths.length !== paths.length) throw new Error('偵測到無效的清理路徑。');
  await Promise.all(safePaths.map(path => deleteStorageFolder(path)));
}

async function processPendingStorageCleanup(ownerId: string): Promise<void> {
  const snapshot = await getDocs(query(getUserCollection(ownerId, 'cleanupTasks'), limit(10)));
  for (const taskSnapshot of snapshot.docs) {
    const task = taskSnapshot.data() as StorageCleanupTask;
    if (task.ownerId !== ownerId || !Array.isArray(task.paths)) continue;
    try {
      await runStorageCleanup(ownerId, task.paths);
      await deleteDoc(taskSnapshot.ref);
    } catch {
      // 保留工作文件；下次啟動或重新載入寵物時再試。
    }
  }
}

/** 取得使用者的子集合路徑 */
function getUserCollection(userId: string, collectionName: string) {
  return collection(db, 'users', userId, collectionName);
}

/** 取得使用者的子集合中的文件路徑 */
function getUserDoc(userId: string, collectionName: string, docId: string) {
  return doc(db, 'users', userId, collectionName, docId);
}

async function getSharedPetsForUser(userId: string): Promise<(PetDoc & { id: string })[]> {
  try {
    const sharedQuery = query(collectionGroup(db, 'pets'), where('coParentIds', 'array-contains', userId));
    const snapshot = await getDocs(sharedQuery);
    return snapshotToArray<PetDoc>(snapshot).filter(pet => pet.ownerId !== userId);
  } catch (error) {
    // 共同飼育查詢不可用時，仍須顯示使用者自己的寵物，不能讓整個列表空白。
    if (__DEV__) console.warn('Shared pets query fallback:', (error as { code?: string })?.code ?? 'unknown');
    return [];
  }
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

async function diaryAccessFields(ownerId: string, petIds: string[]) {
  if (petIds.length === 0) return { accessUserIds: [ownerId], editorIds: [ownerId] };
  // Firestore Rules 每次請求最多讀取 10 個不同寵物 ACL；更多寵物時安全降級為 owner-only。
  if (petIds.length > 10) return { accessUserIds: [ownerId], editorIds: [ownerId] };
  const accessByPet = await Promise.all(petIds.map(petId => recordAccessFields(ownerId, petId)));
  const accessUserIds = accessByPet[0].accessUserIds.filter(userId =>
    accessByPet.every(access => access.accessUserIds.includes(userId)));
  const editorIds = accessByPet[0].editorIds.filter(userId =>
    accessByPet.every(access => access.editorIds.includes(userId)));
  return {
    accessUserIds: Array.from(new Set([ownerId, ...accessUserIds])),
    editorIds: Array.from(new Set([ownerId, ...editorIds])),
  };
}

async function diaryAccessFieldsWithOverride(
  ownerId: string,
  petIds: string[],
  overridePetId: string,
  overrideAccess: { accessUserIds: string[]; editorIds: string[] },
) {
  if (petIds.length === 0 || petIds.length > 10) {
    return { accessUserIds: [ownerId], editorIds: [ownerId] };
  }
  const accessByPet = await Promise.all(petIds.map(petId => (
    petId === overridePetId ? overrideAccess : recordAccessFields(ownerId, petId)
  )));
  const accessUserIds = accessByPet[0].accessUserIds.filter(userId =>
    accessByPet.every(access => access.accessUserIds.includes(userId)));
  const editorIds = accessByPet[0].editorIds.filter(userId =>
    accessByPet.every(access => access.editorIds.includes(userId)));
  return {
    accessUserIds: Array.from(new Set([ownerId, ...accessUserIds])),
    editorIds: Array.from(new Set([ownerId, ...editorIds])),
  };
}

function sameStringSet(left?: string[], right?: string[]): boolean {
  if (!left || !right || left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every(value => rightSet.has(value));
}

type BatchMutation = (batch: ReturnType<typeof writeBatch>) => void;

/**
 * 清除寵物及直接關聯資料。寵物文件放在最後一批，任何前置清理失敗都不會先顯示刪除成功。
 */
async function deletePetAndRelatedData(ownerId: string, petId: string): Promise<void> {
  const [primaryReminderSnapshot, targetedReminderSnapshot, medicalSnapshot, diarySnapshot, inviteSnapshot] = await Promise.all([
    getDocs(query(getUserCollection(ownerId, 'reminders'), where('petId', '==', petId))),
    getDocs(query(getUserCollection(ownerId, 'reminders'), where('pets', 'array-contains', petId))),
    getDocs(query(getUserCollection(ownerId, 'medical'), where('petId', '==', petId))),
    getDocs(query(getUserCollection(ownerId, 'diaries'), where('petIds', 'array-contains', petId))),
    getDocs(query(collection(db, 'invites'), where('ownerId', '==', ownerId))),
  ]);

  const reminderDocuments = [...primaryReminderSnapshot.docs, ...targetedReminderSnapshot.docs]
    .filter((snapshot, index, all) => all.findIndex(item => item.id === snapshot.id) === index);
  const reminderPlans = await Promise.all(reminderDocuments.map(async snapshot => {
    const reminder = snapshot.data() as ReminderDoc;
    const originalPets = reminder.pets?.length ? reminder.pets : [reminder.petId];
    const nextPets = originalPets.filter(id => id !== petId);
    const original = { id: snapshot.id, ...reminder } as ReminderDoc & { id: string };
    if (nextPets.length === 0) {
      return {
        original,
        updated: null,
        mutation: ((batch) => batch.delete(snapshot.ref)) satisfies BatchMutation,
      };
    }

    const nextPetId = reminder.petId === petId ? nextPets[0] : reminder.petId;
    const access = await recordAccessFields(ownerId, nextPetId);
    const updated = {
      ...original,
      petId: nextPetId,
      pets: nextPets,
      ...access,
    };
    return {
      original,
      updated,
      mutation: ((batch) => batch.update(snapshot.ref, {
        petId: nextPetId,
        pets: nextPets,
        ...access,
        updatedAt: serverTimestamp(),
      })) satisfies BatchMutation,
    };
  }));
  const removedReminderEntries = reminderPlans
    .filter(plan => !plan.updated)
    .map(plan => ({ id: plan.original.id, data: plan.original }));
  const diaryMutations = await Promise.all(diarySnapshot.docs.map(async snapshot => {
    const diary = snapshot.data() as DiaryDoc;
    const originalPetIds = diary.petIds || [];
    const nextPetIds = originalPetIds.filter(id => id !== petId);
    if (nextPetIds.length === 0) {
      return ((batch) => batch.delete(snapshot.ref)) satisfies BatchMutation;
    }

    const nextPets = (diary.pets || []).filter((entry, index) => {
      const entryPetId = entry.petId || originalPetIds[index];
      return entryPetId !== petId;
    });
    const access = await diaryAccessFields(ownerId, nextPetIds);
    return ((batch) => batch.update(snapshot.ref, {
      petIds: nextPetIds,
      pets: nextPets,
      ...access,
      updatedAt: serverTimestamp(),
    })) satisfies BatchMutation;
  }));

  const mutations: BatchMutation[] = [
    ...reminderPlans.map(plan => plan.mutation),
    ...medicalSnapshot.docs.map(snapshot =>
      ((batch) => batch.delete(snapshot.ref)) satisfies BatchMutation),
    ...diaryMutations,
    ...inviteSnapshot.docs
      .filter(snapshot => snapshot.data().petId === petId)
      .map(snapshot =>
        ((batch) => batch.delete(snapshot.ref)) satisfies BatchMutation),
    // 同一原子批次的最後一項刪 pet。
    batch => batch.delete(getUserDoc(ownerId, 'pets', petId)),
  ];

  const storagePaths = safeCleanupPaths(ownerId, [
    `users/${ownerId}/pets/${petId}`,
    ...medicalSnapshot.docs.map(snapshot => `users/${ownerId}/medical/${snapshot.id}`),
    ...diarySnapshot.docs
      .filter(snapshot => ((snapshot.data() as DiaryDoc).petIds || [])
        .filter(id => id !== petId).length === 0)
      .map(snapshot => `users/${ownerId}/diaries/${snapshot.id}`),
  ]);
  const cleanupTaskRef = getUserDoc(ownerId, 'cleanupTasks', `pet-${petId}`);

  if (mutations.length > 498) {
    throw new Error('此寵物的關聯資料量過多，為避免只刪除部分資料，請先聯絡支援人員協助處理。');
  }
  const batch = writeBatch(db);
  mutations.forEach(mutation => mutation(batch));
  batch.set(cleanupTaskRef, {
    ownerId,
    paths: storagePaths,
    type: 'pet-delete',
    createdAt: serverTimestamp(),
  } satisfies StorageCleanupTask);
  await batch.commit();

  // 清理由舊版或其他畫面競態留下的排程識別碼。
  await Promise.all(removedReminderEntries.map(entry =>
    cancelReminderNotification(ownerId, entry.id).catch(() => undefined)));

  // Firestore 與持久清理工作已在同一批次提交；只有 Storage 清理與工作文件移除都完成才回報成功。
  try {
    await runStorageCleanup(ownerId, storagePaths);
    await deleteDoc(cleanupTaskRef);
  } catch {
    throw new Error('寵物資料已移除，但照片清理尚未完成；App 之後會自動重試，完成前不會顯示刪除成功。');
  }
}

// ===== 寵物服務 =====

export const petService = {
  /** 取得所有寵物 (包含自己擁有的與別人分享的) */
  async getAll(userId: string): Promise<(PetDoc & { id: string })[]> {
    void processPendingStorageCleanup(userId);
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
    const sharedPets = await getSharedPetsForUser(userId);

    return [...ownPets, ...sharedPets];
  },

  /** 同時即時監聽自有與共同飼育寵物；任一查詢暫時失敗時保留另一來源與最後成功資料。 */
  onPetsChanged(
    userId: string,
    callback: (pets: (PetDoc & { id: string })[]) => void
  ) {
    void processPendingStorageCleanup(userId);
    let ownPets: (PetDoc & { id: string })[] = [];
    let sharedPets: (PetDoc & { id: string })[] = [];
    let ownReady = false;
    let sharedReady = false;
    let ownFailed = false;
    let sharedFailed = false;

    const emitWhenReady = () => {
      if (!ownReady || !sharedReady || (ownFailed && sharedFailed)) return;
      const merged = new Map<string, PetDoc & { id: string }>();
      [...ownPets, ...sharedPets].forEach(pet => {
        merged.set(`${pet.ownerId || userId}:${pet.id}`, pet);
      });
      callback(Array.from(merged.values()));
    };

    const ownQuery = query(getUserCollection(userId, 'pets'), orderBy('createdAt', 'desc'));
    const sharedQuery = query(collectionGroup(db, 'pets'), where('coParentIds', 'array-contains', userId));
    const unsubscribeOwn = onSnapshot(ownQuery, snapshot => {
      ownReady = true;
      ownFailed = false;
      ownPets = snapshotToArray<PetDoc>(snapshot).map(pet => ({
        ...pet,
        ownerId: pet.ownerId || userId,
      }));
      emitWhenReady();
    }, error => {
      ownReady = true;
      ownFailed = true;
      if (__DEV__) console.warn('Own pets listener error:', error.code);
      emitWhenReady();
    });
    const unsubscribeShared = onSnapshot(sharedQuery, snapshot => {
      sharedReady = true;
      sharedFailed = false;
      sharedPets = snapshotToArray<PetDoc>(snapshot)
        .filter(pet => pet.ownerId !== userId);
      emitWhenReady();
    }, error => {
      sharedReady = true;
      sharedFailed = true;
      if (__DEV__) console.warn('Shared pets listener error:', error.code);
      emitWhenReady();
    });

    return () => {
      unsubscribeOwn();
      unsubscribeShared();
    };
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
    if (!data.coParents) {
      await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
      return;
    }

    const currentSnapshot = await getDoc(docRef);
    if (!currentSnapshot.exists()) throw new Error('找不到寵物資料。');
    const currentPet = currentSnapshot.data() as PetDoc;
    const sharingFields = petAccessFields({ ...currentPet, ...data, coParents: data.coParents }, userId);
    const actorId = auth.currentUser?.uid;
    if (!actorId) throw new Error('尚未登入。');
    const isOwnerActor = actorId === userId;
    const [reminderSnapshot, medicalSnapshot, diarySnapshot] = await Promise.all(isOwnerActor ? [
      getDocs(query(getUserCollection(userId, 'reminders'), where('petId', '==', petId))),
      getDocs(query(getUserCollection(userId, 'medical'), where('petId', '==', petId))),
      getDocs(query(getUserCollection(userId, 'diaries'), where('petIds', 'array-contains', petId))),
    ] : [
      getDocs(query(getUserCollection(userId, 'reminders'), where('accessUserIds', 'array-contains', actorId))),
      getDocs(query(getUserCollection(userId, 'medical'), where('accessUserIds', 'array-contains', actorId))),
      getDocs(query(getUserCollection(userId, 'diaries'), where('accessUserIds', 'array-contains', actorId))),
    ]);
    const reminderDocuments = reminderSnapshot.docs.filter(snapshot =>
      (snapshot.data() as ReminderDoc).petId === petId);
    const medicalDocuments = medicalSnapshot.docs.filter(snapshot =>
      (snapshot.data() as MedicalDoc).petId === petId);
    const diaryDocuments = diarySnapshot.docs.filter(snapshot =>
      ((snapshot.data() as DiaryDoc).petIds || []).includes(petId));
    const diaryAccess = await Promise.all(diaryDocuments.map(async snapshot => ({
      ref: snapshot.ref,
      access: await diaryAccessFieldsWithOverride(
        userId,
        ((snapshot.data() as DiaryDoc).petIds || []),
        petId,
        { accessUserIds: sharingFields.coParentIds, editorIds: sharingFields.editorIds },
      ),
    })));
    const mutationCount = 1 + reminderDocuments.length + medicalDocuments.length + diaryAccess.length;
    if (mutationCount > 499) {
      throw new Error('共同飼育關聯資料量過多，為避免只更新部分權限，請先聯絡支援人員。');
    }
    const batch = writeBatch(db);
    batch.update(docRef, {
      ...data,
      ...sharingFields,
      updatedAt: serverTimestamp(),
    });
    reminderDocuments.forEach(snapshot => batch.update(snapshot.ref, {
      accessUserIds: sharingFields.coParentIds,
      editorIds: sharingFields.editorIds,
      updatedAt: serverTimestamp(),
    }));
    medicalDocuments.forEach(snapshot => batch.update(snapshot.ref, {
      accessUserIds: sharingFields.coParentIds,
      editorIds: sharingFields.editorIds,
      updatedAt: serverTimestamp(),
    }));
    diaryAccess.forEach(entry => batch.update(entry.ref, {
      ...entry.access,
      aclRevisionPetId: petId,
      updatedAt: serverTimestamp(),
    }));
    await batch.commit();
  },

  /** 刪除寵物 */
  async delete(userId: string, petId: string): Promise<void> {
    await deletePetAndRelatedData(userId, petId);
  },

  /** 上傳寵物照片至 Firebase Storage */
  async uploadImage(userId: string, petId: string, uri: string, quotaUserId = userId): Promise<UploadedImage> {
    return uploadImagePair(`users/${userId}/pets/${petId}`, uri, quotaUserId);
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
    let ownReady = false;
    let sharedReady = false;
    let ownFailed = false;
    let sharedFailed = false;
    const emit = () => {
      if (!ownReady || !sharedReady || (ownFailed && sharedFailed)) return;
      const merged = new Map<string, ReminderDoc & { id: string }>();
      Array.from(sources.values()).flat().forEach(item => merged.set(`${item.ownerId || userId}:${item.id}`, item));
      callback(Array.from(merged.values()).sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt)));
    };
    unsubscribes.push(onSnapshot(query(getUserCollection(userId, 'reminders'), orderBy('createdAt', 'desc')), snapshot => {
      ownReady = true;
      ownFailed = false;
      const own = snapshotToOwnedArray<ReminderDoc>(snapshot, userId);
      sources.set('own', own);
      void Promise.all(own.filter(item => !item.accessUserIds).map(async item => {
        const access = await recordAccessFields(userId, item.petId);
        await updateDoc(getUserDoc(userId, 'reminders', item.id), access);
      }));
      emit();
    }, error => {
      ownReady = true;
      ownFailed = true;
      if (__DEV__) console.warn('Own reminders listener error:', error.code);
      emit();
    }));
    unsubscribes.push(onSnapshot(query(collectionGroup(db, 'reminders'), where('accessUserIds', 'array-contains', userId)), snapshot => {
      sharedReady = true;
      sharedFailed = false;
      sources.set('shared', snapshotToArray<ReminderDoc>(snapshot));
      emit();
    }, error => {
      sharedReady = true;
      sharedFailed = true;
      if (__DEV__) console.warn('Shared reminders listener error:', error.code);
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
    await deleteStorageFolder(`users/${userId}/medical/${medicalId}`);
    const docRef = getUserDoc(userId, 'medical', medicalId);
    await deleteDoc(docRef);
  },

  /** 上傳醫療紀錄照片。 */
  async uploadImage(
    userId: string,
    medicalId: string,
    uri: string,
    index: number,
    quotaUserId = userId,
  ): Promise<UploadedImage> {
    return uploadImagePair(
      `users/${userId}/medical/${medicalId}`,
      uri,
      quotaUserId,
      `${Date.now()}-${index}`,
    );
  },
};

// ===== 日記服務 =====

export const diaryService = {
  /** 只取得自己擁有或 accessUserIds 明確包含自己的日記。 */
  async getAll(userId: string): Promise<(DiaryDoc & { id: string })[]> {
    const ownSnapshot = await getDocs(query(getUserCollection(userId, 'diaries'), orderBy('date', 'desc')));
    const own = snapshotToOwnedArray<DiaryDoc>(ownSnapshot, userId);
    await Promise.all(own.filter(item => item.petIds?.length).map(async item => {
      const access = await diaryAccessFields(userId, item.petIds!);
      if (!sameStringSet(item.accessUserIds, access.accessUserIds)
        || !sameStringSet(item.editorIds, access.editorIds)) {
        await updateDoc(getUserDoc(userId, 'diaries', item.id), access);
        Object.assign(item, access);
      }
    }));
    const sharedSnapshot = await getDocs(query(collectionGroup(db, 'diaries'), where('accessUserIds', 'array-contains', userId)))
      .catch(() => null);
    const merged = new Map<string, DiaryDoc & { id: string }>();
    const visibleOwn = own.filter(item => item.status !== 'pending');
    const visibleShared = sharedSnapshot
      ? snapshotToArray<DiaryDoc>(sharedSnapshot).filter(item => item.status !== 'pending')
      : [];
    [...visibleOwn, ...visibleShared].forEach(item => merged.set(`${item.ownerId || userId}:${item.id}`, item));
    const stalePending = own.filter(item => item.status === 'pending'
      && timestampToMillis(item.createdAt) > 0
      && Date.now() - timestampToMillis(item.createdAt) > 30 * 60 * 1000);
    void Promise.all(stalePending.map(item => diaryService.rollbackCreate(userId, item.id))).catch(() => undefined);
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
      sources.set('own', own.filter(item => item.status !== 'pending'));
      void Promise.all(own.filter(item => item.petIds?.length).map(async item => {
        const access = await diaryAccessFields(userId, item.petIds!);
        if (!sameStringSet(item.accessUserIds, access.accessUserIds)
          || !sameStringSet(item.editorIds, access.editorIds)) {
          await updateDoc(getUserDoc(userId, 'diaries', item.id), access);
        }
      }));
      const stalePending = own.filter(item => item.status === 'pending'
        && timestampToMillis(item.createdAt) > 0
        && Date.now() - timestampToMillis(item.createdAt) > 30 * 60 * 1000);
      void Promise.all(stalePending.map(item => diaryService.rollbackCreate(userId, item.id))).catch(() => undefined);
      emit();
    }, () => {
      sources.set('own', []);
      emit();
    }));
    unsubscribes.push(onSnapshot(query(collectionGroup(db, 'diaries'), where('accessUserIds', 'array-contains', userId)), snapshot => {
      sources.set('shared', snapshotToArray<DiaryDoc>(snapshot).filter(item => item.status !== 'pending'));
      emit();
    }, () => {
      // 舊版 ACL 尚未由 owner 遷移時，不讓單筆拒絕使自有日記頁整體失敗。
      sources.set('shared', []);
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
    const access = data.petIds?.length
      ? await diaryAccessFields(userId, data.petIds)
      : { accessUserIds: [userId], editorIds: [userId] };
    const docRef = await addDoc(colRef, {
      ...data,
      status: 'pending',
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
    const petIds = data.petIds?.length
      ? data.petIds
      : (current.data() as DiaryDoc | undefined)?.petIds;
    const access = petIds?.length ? await diaryAccessFields(userId, petIds) : {};
    await updateDoc(docRef, {
      ...data,
      ...access,
      updatedAt: serverTimestamp(),
    });
  },

  /** 刪除日記 */
  async delete(userId: string, diaryId: string): Promise<void> {
    await deleteStorageFolder(`users/${userId}/diaries/${diaryId}`);
    const docRef = getUserDoc(userId, 'diaries', diaryId);
    await deleteDoc(docRef);
  },

  /** 新增流程失敗時清除暫存文件；Storage 清理失敗也不可留下半成品卡片。 */
  async rollbackCreate(userId: string, diaryId: string): Promise<void> {
    try {
      await deleteStorageFolder(`users/${userId}/diaries/${diaryId}`);
    } catch (error) {
      if (__DEV__) console.warn('Diary rollback storage cleanup failed:', (error as { code?: string })?.code ?? 'unknown');
    }
    await deleteDoc(getUserDoc(userId, 'diaries', diaryId));
  },

  /** 上傳日記照片 */
  async uploadImage(
    userId: string,
    diaryId: string,
    uri: string,
    index: number,
    quotaUserId = userId,
  ): Promise<UploadedImage> {
    return uploadImagePair(`users/${userId}/diaries/${diaryId}`, uri, quotaUserId, `photo-${Date.now()}-${index}`);
  },

  /** 編輯完成或失敗後，只保留目前文件仍引用的日記主圖與縮圖。 */
  async pruneImages(userId: string, diaryId: string, retainedUrls: string[]): Promise<void> {
    const retained = new Set(retainedUrls.filter(Boolean));
    const result = await listAll(ref(storage, `users/${userId}/diaries/${diaryId}`));
    await Promise.all(result.items.map(async item => {
      const url = await getDownloadURL(item);
      if (!retained.has(url)) await deleteObject(item);
    }));
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
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const code = Array.from(getRandomBytes(10), byte => alphabet[byte % alphabet.length]).join('');
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
    const inviteRef = doc(db, 'invites', normalizedCode);
    return runTransaction(db, async transaction => {
      const inviteSnapshot = await transaction.get(inviteRef);
      if (!inviteSnapshot.exists()) {
        return { success: false, message: '無效的邀請碼或邀請碼已過期' };
      }
      const data = inviteSnapshot.data() as InviteDoc;
      if (data.expiresAt.toDate() < new Date()) {
        return { success: false, message: '邀請碼已過期' };
      }

      const petRef = getUserDoc(data.ownerId, 'pets', data.petId);
      const petSnapshot = await transaction.get(petRef);
      if (!petSnapshot.exists()) {
        return { success: false, message: '找不到該寵物資料' };
      }
      const petData = petSnapshot.data() as PetDoc;
      const coParents = [...(petData.coParents || [])];
      if (coParents.some(member => member.uid === userId)) {
        return { success: false, message: '您已經是該寵物的共同飼育者' };
      }

      const permission = data.permission || 'edit';
      coParents.push({ uid: userId, name: userName, isMainOwner: false, permission, muteReminders: false });
      const sharingFields = petAccessFields({ ...petData, coParents }, data.ownerId);
      transaction.update(petRef, {
        coParents,
        ...sharingFields,
        lastInviteCode: normalizedCode,
        updatedAt: serverTimestamp(),
      });
      transaction.delete(inviteRef);
      return { success: true, message: '成功加入共同飼育！' };
    });
  }
};
