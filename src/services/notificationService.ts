import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PetDoc, ReminderDoc } from './firestoreService';

const PREFERENCES_KEY = 'lizlog.notification.preferences.v1';
const SCHEDULES_KEY = 'lizlog.notification.schedules.v1';
const GUIDE_SHOWN_KEY = 'lizlog.notification.guide-shown.v1';
const CHANNEL_ID = 'lizlog-reminders';

export interface NotificationPreferences {
  reminderEnabled: boolean;
  systemEnabled: boolean;
  reminderConfigured: boolean;
  systemConfigured: boolean;
}

export interface NotificationPermissionState {
  granted: boolean;
  appGranted: boolean;
  canAskAgain: boolean;
  channelEnabled: boolean;
  status: string;
}

export type NotificationScheduleFailureReason =
  | 'reminders-disabled'
  | 'system-disabled'
  | 'permission-denied'
  | 'channel-disabled'
  | 'invalid-time'
  | 'invalid-frequency'
  | 'state-read-failed'
  | 'schedule-failed'
  | 'verification-failed';

export interface NotificationScheduleResult {
  scheduled: boolean;
  reason?: NotificationScheduleFailureReason;
  errorCode?: string;
  scheduledNotificationCount: number;
}

export type ReminderNotificationInput = ReminderDoc & {
  id: string;
  types?: string[];
};

export interface NotificationSyncResult {
  scheduledReminderCount: number;
  failedReminderIds: string[];
  failureReasons: Record<string, NotificationScheduleFailureReason>;
  permissionGranted: boolean;
  preferencesEnabled: boolean;
}

type ScheduleMap = Record<string, string[]>;

let notificationOperationQueue: Promise<void> = Promise.resolve();
let scheduleGeneration = 0;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function runNotificationOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = notificationOperationQueue.then(operation, operation);
  notificationOperationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: '照護提醒',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function readScheduleMap(): Promise<ScheduleMap> {
  const value = await AsyncStorage.getItem(SCHEDULES_KEY);
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as ScheduleMap;
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string[]] => Array.isArray(entry[1])),
    );
  } catch {
    return {};
  }
}

async function writeScheduleMap(value: ScheduleMap) {
  await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(value));
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const value = await AsyncStorage.getItem(PREFERENCES_KEY);
  if (!value) {
    return {
      reminderEnabled: true,
      systemEnabled: false,
      reminderConfigured: false,
      systemConfigured: false,
    };
  }

  try {
    const parsed = JSON.parse(value) as Partial<NotificationPreferences>;
    return {
      reminderEnabled: parsed.reminderEnabled ?? true,
      systemEnabled: parsed.systemEnabled ?? false,
      // 舊資料沒有 configured 欄位時，不可誤判成使用者已主動關閉；
      // Build 8 可在 OS 已授權時安全地重新對齊狀態。
      reminderConfigured: parsed.reminderConfigured ?? false,
      systemConfigured: parsed.systemConfigured ?? false,
    };
  } catch {
    return {
      reminderEnabled: true,
      systemEnabled: false,
      reminderConfigured: false,
      systemConfigured: false,
    };
  }
}

export async function saveNotificationPreferences(preferences: NotificationPreferences) {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

/** 只有第一次需要協助設定通知時回傳 true，後續啟動不再重複彈窗。 */
export async function claimNotificationSetupGuide(): Promise<boolean> {
  const hasShown = await AsyncStorage.getItem(GUIDE_SHOWN_KEY);
  if (hasShown === 'true') return false;
  await AsyncStorage.setItem(GUIDE_SHOWN_KEY, 'true');
  return true;
}

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  await ensureAndroidChannel();
  const permission = await Notifications.getPermissionsAsync();
  let channelEnabled = true;

  if (Platform.OS === 'android') {
    const channel = await Notifications.getNotificationChannelAsync(CHANNEL_ID);
    channelEnabled = !channel || channel.importance !== Notifications.AndroidImportance.NONE;
  }

  const appGranted = permission.status === 'granted' && permission.granted;
  return {
    granted: appGranted && channelEnabled,
    appGranted,
    canAskAgain: permission.canAskAgain,
    channelEnabled,
    status: permission.status,
  };
}

export async function requestNotificationPermissionState(): Promise<NotificationPermissionState> {
  const current = await getNotificationPermissionState();
  if (current.appGranted || !current.canAskAgain) return current;

  await Notifications.requestPermissionsAsync();
  return getNotificationPermissionState();
}

export async function requestNotificationPermission(): Promise<boolean> {
  return (await requestNotificationPermissionState()).granted;
}

export function getNotificationScheduleFailureCopy(
  result: NotificationScheduleResult,
): { title: string; message: string; shouldOpenSystemSettings: boolean } {
  switch (result.reason) {
    case 'permission-denied':
      return {
        title: '尚未授權通知',
        message: '提醒資料已儲存。請到手機設定開啟蜥日日記的通知權限。',
        shouldOpenSystemSettings: true,
      };
    case 'channel-disabled':
      return {
        title: '照護提醒通知已關閉',
        message: 'App 通知權限已開啟，但「照護提醒」通知類別仍為關閉，請到手機設定開啟該類別。',
        shouldOpenSystemSettings: true,
      };
    case 'reminders-disabled':
    case 'system-disabled':
      return {
        title: '提醒已儲存',
        message: '請先在 App 的「設定 > 通知設定」開啟提醒與系統通知，之後會自動排程。',
        shouldOpenSystemSettings: false,
      };
    case 'invalid-time':
    case 'invalid-frequency':
      return {
        title: '提醒已儲存，但時間設定不完整',
        message: '手機通知權限已開啟；請重新檢查提醒日期、時間與頻率。',
        shouldOpenSystemSettings: false,
      };
    case 'verification-failed':
    case 'schedule-failed':
      return {
        title: '提醒已儲存，但本機排程失敗',
        message: '手機通知權限已開啟，這次失敗不是權限問題。請稍後重新切換提醒開關再試。',
        shouldOpenSystemSettings: false,
      };
    case 'state-read-failed':
    default:
      return {
        title: '提醒已儲存，但通知狀態讀取失敗',
        message: '提醒資料已儲存；App 暫時無法讀取本機通知狀態，請稍後回到提醒頁重試，不需要重複開啟系統權限。',
        shouldOpenSystemSettings: false,
      };
  }
}

export function getReminderTypes(reminder: { type?: string; types?: string[] }): string[] {
  const rawTypes = reminder.types?.length
    ? reminder.types
    : (reminder.type || '').split(/[、,，]/);
  return Array.from(new Set(rawTypes.map(type => type.trim()).filter(Boolean)));
}

export function buildReminderNotificationBody(reminder: ReminderNotificationInput): string {
  const petNames = Array.from(new Set((reminder.petNames || []).map(name => name.trim()).filter(Boolean)));
  const reminderItem = reminder.note?.trim() || getReminderTypes(reminder).join('、') || '照護';
  const petLabel = petNames.length > 0 ? petNames.join('、') : '寵物';
  return `${petLabel}的${reminderItem}時間到囉！`;
}

export function filterMutedReminders<T extends ReminderDoc>(
  userId: string,
  reminders: T[],
  pets: Array<Pick<PetDoc, 'id' | 'coParents'>>,
): T[] {
  const mutedPetIds = new Set(pets
    .filter(pet => pet.coParents?.some(member => member.uid === userId && member.muteReminders))
    .map(pet => pet.id)
    .filter((petId): petId is string => Boolean(petId)));
  return reminders.filter(reminder => {
    const targetPetIds = reminder.pets?.length ? reminder.pets : [reminder.petId];
    return !targetPetIds.some(petId => mutedPetIds.has(petId));
  });
}

async function cancelScheduledIdentifiers(identifiers: string[]): Promise<string[]> {
  const results = await Promise.all(
    identifiers.map(async identifier => {
      try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
        return null;
      } catch {
        return identifier;
      }
    }),
  );
  return results.filter((identifier): identifier is string => Boolean(identifier));
}

async function cancelReminderNotificationUnlocked(ownerId: string, reminderId: string) {
  const key = `${ownerId}:${reminderId}`;
  const scheduleMap = await readScheduleMap();
  const identifiers = scheduleMap[key] || [];
  const failedIdentifiers = await cancelScheduledIdentifiers(identifiers);
  if (failedIdentifiers.length > 0) scheduleMap[key] = failedIdentifiers;
  else delete scheduleMap[key];
  await writeScheduleMap(scheduleMap);
}

export async function cancelReminderNotification(ownerId: string, reminderId: string) {
  return runNotificationOperation(() => cancelReminderNotificationUnlocked(ownerId, reminderId));
}

async function cancelSchedulesExceptUnlocked(keepKeys: Set<string>) {
  const scheduleMap = await readScheduleMap();
  let changed = false;
  for (const [key, identifiers] of Object.entries(scheduleMap)) {
    if (keepKeys.has(key)) continue;
    const failedIdentifiers = await cancelScheduledIdentifiers(identifiers);
    if (failedIdentifiers.length > 0) scheduleMap[key] = failedIdentifiers;
    else delete scheduleMap[key];
    changed = true;
  }
  if (changed) await writeScheduleMap(scheduleMap);
}

function dateAtReminderTime(startDate: string | undefined, hour: number, minute: number): Date | null {
  const match = startDate?.trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  const today = new Date();
  const year = match ? Number(match[1]) : today.getFullYear();
  const month = match ? Number(match[2]) - 1 : today.getMonth();
  const day = match ? Number(match[3]) : today.getDate();
  const result = new Date(year, month, day, hour, minute, 0, 0);

  if (Number.isNaN(result.getTime())
    || result.getFullYear() !== year
    || result.getMonth() !== month
    || result.getDate() !== day) {
    return null;
  }
  return result;
}

function localDateStringFromValue(value: unknown): string | undefined {
  let date: Date | undefined;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'number' || typeof value === 'string') {
    date = new Date(value);
  } else if (value && typeof value === 'object') {
    const timestamp = value as { seconds?: number; toDate?: () => Date };
    if (typeof timestamp.toDate === 'function') {
      try {
        date = timestamp.toDate();
      } catch {
        date = undefined;
      }
    } else if (typeof timestamp.seconds === 'number') {
      date = new Date(timestamp.seconds * 1000);
    }
  }

  if (!date || Number.isNaN(date.getTime())) return undefined;
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('/');
}

function getReminderStartDate(reminder: ReminderNotificationInput): string | undefined {
  return reminder.startDate?.trim() || localDateStringFromValue(reminder.createdAt);
}

function localCalendarDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

function nextIntervalDate(
  startDate: string | undefined,
  hour: number,
  minute: number,
  intervalDays: number,
): Date | null {
  const base = dateAtReminderTime(startDate, hour, minute);
  if (!base) return null;
  const now = new Date();
  if (base.getTime() > now.getTime()) return base;

  const elapsedCalendarDays = Math.max(
    0,
    localCalendarDayNumber(now) - localCalendarDayNumber(base),
  );
  const elapsedIntervals = Math.floor(elapsedCalendarDays / intervalDays);
  const candidate = new Date(base);
  candidate.setDate(base.getDate() + elapsedIntervals * intervalDays);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + intervalDays);
  }
  return candidate;
}

function buildReminderTriggers(
  reminder: ReminderNotificationInput,
  hour: number,
  minute: number,
  maxEveryNOccurrences = Platform.OS === 'ios' ? 12 : 60,
): Notifications.NotificationTriggerInput[] {
  const triggers: Notifications.NotificationTriggerInput[] = [];

  if (reminder.frequencyType === 'daily') {
    triggers.push({
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    });
  } else if (reminder.frequencyType === 'weekly') {
    (reminder.selectedWeekDays || []).forEach(day => triggers.push({
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: day + 1,
      hour,
      minute,
      channelId: CHANNEL_ID,
    }));
  } else if (reminder.frequencyType === 'everyN') {
    const interval = Math.max(1, Math.floor(Number(reminder.everyNDays) || 1));
    const startDate = getReminderStartDate(reminder);
    if (!startDate) return triggers;
    const first = nextIntervalDate(startDate, hour, minute, interval);
    if (!first) return triggers;
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 366);
    const maximumOccurrences = Math.max(1, maxEveryNOccurrences);
    for (let index = 0; index < maximumOccurrences; index += 1) {
      const date = new Date(first);
      date.setDate(first.getDate() + index * interval);
      if (date.getTime() > horizon.getTime()) break;
      triggers.push({
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: CHANNEL_ID,
      });
    }
  } else {
    const startDate = getReminderStartDate(reminder);
    if (!startDate) return triggers;
    const date = dateAtReminderTime(startDate, hour, minute);
    // 單次提醒若已過期就不應自動延到隔天。
    if (date && date.getTime() > Date.now()) {
      triggers.push({
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: CHANNEL_ID,
      });
    }
  }

  return triggers;
}

function notificationErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return 'unknown';
  const candidate = error as { code?: unknown; name?: unknown };
  if (typeof candidate.code === 'string' && candidate.code) return candidate.code;
  if (typeof candidate.name === 'string' && candidate.name) return candidate.name;
  return 'unknown';
}

async function scheduleReminderNotificationUnlocked(
  ownerId: string,
  reminder: ReminderNotificationInput,
  knownState?: {
    preferences: NotificationPreferences;
    permissionState: NotificationPermissionState;
    maxEveryNOccurrences?: number;
  },
): Promise<NotificationScheduleResult> {
  const preferences = knownState?.preferences ?? await getNotificationPreferences();
  if (!preferences.reminderEnabled || !reminder.isOn) {
    await cancelReminderNotificationUnlocked(ownerId, reminder.id);
    return {
      scheduled: false,
      reason: 'reminders-disabled',
      scheduledNotificationCount: 0,
    };
  }
  if (!preferences.systemEnabled) {
    await cancelReminderNotificationUnlocked(ownerId, reminder.id);
    return {
      scheduled: false,
      reason: 'system-disabled',
      scheduledNotificationCount: 0,
    };
  }

  const permissionState = knownState?.permissionState ?? await requestNotificationPermissionState();
  if (!permissionState.appGranted) {
    return {
      scheduled: false,
      reason: 'permission-denied',
      scheduledNotificationCount: 0,
    };
  }
  if (!permissionState.channelEnabled) {
    return {
      scheduled: false,
      reason: 'channel-disabled',
      scheduledNotificationCount: 0,
    };
  }

  const [hour, minute] = (reminder.time || '').split(':').map(Number);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23
    || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    await cancelReminderNotificationUnlocked(ownerId, reminder.id);
    return {
      scheduled: false,
      reason: 'invalid-time',
      scheduledNotificationCount: 0,
    };
  }
  const triggers = buildReminderTriggers(
    reminder,
    hour,
    minute,
    knownState?.maxEveryNOccurrences,
  );
  const reminderTypes = getReminderTypes(reminder);
  if (triggers.length === 0 || reminderTypes.length === 0) {
    await cancelReminderNotificationUnlocked(ownerId, reminder.id);
    return {
      scheduled: false,
      reason: 'invalid-frequency',
      scheduledNotificationCount: 0,
    };
  }
  const reminderTitle = reminderTypes.join('、');

  const scheduleKey = `${ownerId}:${reminder.id}`;
  let scheduleMap: ScheduleMap;
  try {
    scheduleMap = await readScheduleMap();
  } catch (error) {
    const errorCode = notificationErrorCode(error);
    console.warn('[notification] reminder schedule state read failed', {
      reason: 'state-read-failed',
      errorCode,
    });
    return {
      scheduled: false,
      reason: 'state-read-failed',
      errorCode,
      scheduledNotificationCount: 0,
    };
  }
  const previousIdentifiers = Array.from(new Set(scheduleMap[scheduleKey] || []));
  scheduleGeneration += 1;
  const scheduleRunId = `${Date.now().toString(36)}-${scheduleGeneration.toString(36)}`;
  const identifiers: string[] = [];
  try {
    for (let triggerIndex = 0; triggerIndex < triggers.length; triggerIndex += 1) {
      const identifier = `${ownerId}:${reminder.id}:${scheduleRunId}:${triggerIndex}`;
      const scheduledIdentifier = await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: reminderTitle,
          body: buildReminderNotificationBody(reminder),
          sound: 'default',
          data: {
            ownerId,
            reminderId: reminder.id,
            petId: reminder.petId,
            petIds: reminder.pets || [reminder.petId],
            petNames: reminder.petNames || [],
            reminderType: reminderTitle,
            reminderTypes,
          },
        },
        trigger: triggers[triggerIndex],
      });
      identifiers.push(scheduledIdentifier);
    }

    const scheduledRequests = await Notifications.getAllScheduledNotificationsAsync();
    const scheduledIds = new Set(scheduledRequests.map(request => request.identifier));
    if (!identifiers.every(identifier => scheduledIds.has(identifier))) {
      const failedCleanup = await cancelScheduledIdentifiers(identifiers);
      if (failedCleanup.length > 0) {
        scheduleMap[scheduleKey] = Array.from(new Set([
          ...previousIdentifiers,
          ...failedCleanup,
        ]));
        await writeScheduleMap(scheduleMap).catch(() => undefined);
      }
      console.warn('[notification] reminder schedule verification failed', {
        reason: 'verification-failed',
      });
      return {
        scheduled: false,
        reason: 'verification-failed',
        scheduledNotificationCount: 0,
      };
    }

    // 先將新舊排程一併記錄，再清理舊排程。任何中段失敗都保留至少一套
    // 可追蹤且可觸發的既有通知，不會因重建失敗留下空排程。
    scheduleMap[scheduleKey] = Array.from(new Set([
      ...previousIdentifiers,
      ...identifiers,
    ]));
    await writeScheduleMap(scheduleMap);
  } catch (error) {
    const failedCleanup = await cancelScheduledIdentifiers(identifiers);
    if (failedCleanup.length > 0) {
      scheduleMap[scheduleKey] = Array.from(new Set([
        ...previousIdentifiers,
        ...failedCleanup,
      ]));
      await writeScheduleMap(scheduleMap).catch(() => undefined);
    }
    const errorCode = notificationErrorCode(error);
    console.warn('[notification] reminder schedule failed', {
      reason: 'schedule-failed',
      errorCode,
    });
    return {
      scheduled: false,
      reason: 'schedule-failed',
      errorCode,
      scheduledNotificationCount: 0,
    };
  }

  const failedPreviousCleanup = await cancelScheduledIdentifiers(previousIdentifiers);
  scheduleMap[scheduleKey] = Array.from(new Set([
    ...failedPreviousCleanup,
    ...identifiers,
  ]));
  await writeScheduleMap(scheduleMap).catch(error => {
    // 上一步已把新舊識別碼共同寫入；此處只是在縮減舊識別碼。
    // 寫回失敗不影響新排程，也不可回頭刪除已驗證成功的新通知。
    console.warn('[notification] reminder schedule cleanup state write failed', {
      reason: 'schedule-failed',
      errorCode: notificationErrorCode(error),
    });
  });
  return {
    scheduled: true,
    scheduledNotificationCount: identifiers.length,
  };
}

export async function scheduleReminderNotificationDetailed(
  ownerId: string,
  reminder: ReminderNotificationInput,
): Promise<NotificationScheduleResult> {
  return runNotificationOperation(
    () => scheduleReminderNotificationUnlocked(ownerId, reminder),
  );
}

export async function scheduleReminderNotification(
  ownerId: string,
  reminder: ReminderNotificationInput,
): Promise<boolean> {
  return (await scheduleReminderNotificationDetailed(ownerId, reminder)).scheduled;
}

async function cancelAllLizLogNotificationsUnlocked() {
  // LizLog 目前只有照護提醒會使用本機排程；直接清除 native store 可一併修復舊版遺留的孤兒通知。
  await Notifications.cancelAllScheduledNotificationsAsync();
  await writeScheduleMap({});
}

export async function cancelAllLizLogNotifications() {
  return runNotificationOperation(cancelAllLizLogNotificationsUnlocked);
}

export async function synchronizeReminderNotifications(
  fallbackOwnerId: string,
  reminders: ReminderNotificationInput[],
): Promise<NotificationSyncResult> {
  return runNotificationOperation(async () => {
    // 先確認偏好與 OS 狀態都可讀。若狀態讀取暫時失敗，函式會在任何
    // native 變更前中止，既有通知不會被清空。
    const [storedPreferences, permissionState] = await Promise.all([
      getNotificationPreferences(),
      getNotificationPermissionState(),
    ]);
    let preferences = storedPreferences;
    if (permissionState.granted
      && !storedPreferences.systemConfigured
      && !storedPreferences.systemEnabled) {
      // 舊版未記錄「是否由使用者設定」。OS 已授權時只自動採用一次；
      // systemConfigured=true 的明確關閉偏好永遠不會被覆寫。
      preferences = {
        ...storedPreferences,
        systemEnabled: true,
        systemConfigured: true,
      };
      await saveNotificationPreferences(preferences);
    }
    const preferencesEnabled = preferences.reminderEnabled && preferences.systemEnabled;
    if (!preferencesEnabled) {
      const explicitlyDisabled =
        (preferences.reminderConfigured && !preferences.reminderEnabled)
        || (preferences.systemConfigured && !preferences.systemEnabled);
      // 只有使用者偏好明確關閉時才全面清除 LizLog 排程。舊版尚未設定
      // systemEnabled 且 OS 權限仍不可用時，保留既有通知等待下次重新對齊。
      if (explicitlyDisabled) await cancelAllLizLogNotificationsUnlocked();
      return {
        scheduledReminderCount: 0,
        failedReminderIds: [],
        failureReasons: {},
        permissionGranted: permissionState.granted,
        preferencesEnabled: false,
      };
    }

    if (!permissionState.granted) {
      // OS 權限或 Android channel 暫時不可用時保留原排程；返回 App 且
      // 權限恢復後，Root AppState listener 會強制重新同步。
      return {
        scheduledReminderCount: 0,
        failedReminderIds: [],
        failureReasons: {},
        permissionGranted: false,
        preferencesEnabled: true,
      };
    }

    const activeReminders = reminders.filter(item => item.isOn);
    const everyNCount = activeReminders.filter(item => item.frequencyType === 'everyN').length;
    // iOS 全 App 僅保留約 64 筆排程；Android 廠牌也常設 alarm 上限。
    // 將固定日期型 everyN 提醒控制在共用預算內，App 每次啟動都會向後延展。
    const everyNBudget = Platform.OS === 'ios' ? 32 : 240;
    const perReminderEveryNLimit = everyNCount > 0
      ? Math.max(1, Math.floor(everyNBudget / everyNCount))
      : 1;
    const cappedEveryNLimit = Math.min(
      Platform.OS === 'ios' ? 12 : 60,
      perReminderEveryNLimit,
    );

    let scheduledReminderCount = 0;
    const failedReminderIds: string[] = [];
    const failureReasons: Record<string, NotificationScheduleFailureReason> = {};
    for (const reminder of reminders.filter(item => !item.isOn)) {
      try {
        await cancelReminderNotificationUnlocked(
          reminder.ownerId || fallbackOwnerId,
          reminder.id,
        );
      } catch {
        failedReminderIds.push(reminder.id);
        failureReasons[reminder.id] = 'schedule-failed';
      }
    }
    for (const reminder of activeReminders) {
      try {
        const scheduleResult = await scheduleReminderNotificationUnlocked(
          reminder.ownerId || fallbackOwnerId,
          reminder,
          {
            preferences,
            permissionState,
            maxEveryNOccurrences: cappedEveryNLimit,
          },
        );
        if (scheduleResult.scheduled) {
          scheduledReminderCount += 1;
        } else {
          failedReminderIds.push(reminder.id);
          failureReasons[reminder.id] = scheduleResult.reason || 'schedule-failed';
        }
      } catch {
        failedReminderIds.push(reminder.id);
        failureReasons[reminder.id] = 'schedule-failed';
      }
    }

    if (failedReminderIds.length === 0) {
      const activeScheduleKeys = new Set(activeReminders.map(reminder =>
        `${reminder.ownerId || fallbackOwnerId}:${reminder.id}`));
      await cancelSchedulesExceptUnlocked(activeScheduleKeys);
    }

    return {
      scheduledReminderCount,
      failedReminderIds,
      failureReasons,
      permissionGranted: true,
      preferencesEnabled: true,
    };
  });
}

/**
 * 唯一可供畫面層使用的完整同步入口：先套用共同飼育勿擾，再以全域預算重建排程。
 * 避免單筆新增／切換在 Root 同步後又把靜音提醒或過量 everyN 排程加回來。
 */
export async function synchronizeEligibleReminderNotifications(
  userId: string,
  reminders: ReminderNotificationInput[],
  pets: Array<Pick<PetDoc, 'id' | 'name' | 'coParents'>>,
): Promise<NotificationSyncResult> {
  const petNamesById = new Map(pets.map(pet => [pet.id, pet.name]));
  const remindersWithPetNames = reminders.map(reminder => ({
    ...reminder,
    petNames: reminder.petNames?.filter(Boolean).length
      ? reminder.petNames
      : (reminder.pets?.length ? reminder.pets : [reminder.petId])
          .map(petId => petNamesById.get(petId))
          .filter((name): name is string => Boolean(name)),
  }));
  return synchronizeReminderNotifications(
    userId,
    filterMutedReminders(userId, remindersWithPetNames, pets),
  );
}
