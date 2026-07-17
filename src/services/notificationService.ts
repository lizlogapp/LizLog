import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PetDoc, ReminderDoc } from './firestoreService';

const PREFERENCES_KEY = 'lizlog.notification.preferences.v1';
const SCHEDULES_KEY = 'lizlog.notification.schedules.v1';
const CHANNEL_ID = 'lizlog-reminders';

export interface NotificationPreferences {
  reminderEnabled: boolean;
  systemEnabled: boolean;
  reminderConfigured: boolean;
  systemConfigured: boolean;
}

export interface NotificationPermissionState {
  granted: boolean;
  canAskAgain: boolean;
  channelEnabled: boolean;
  status: string;
}

export type ReminderNotificationInput = ReminderDoc & {
  id: string;
  types?: string[];
};

export interface NotificationSyncResult {
  scheduledReminderCount: number;
  failedReminderIds: string[];
  permissionGranted: boolean;
  preferencesEnabled: boolean;
}

type ScheduleMap = Record<string, string[]>;

let notificationOperationQueue: Promise<void> = Promise.resolve();

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
      // 舊版只有在使用者操作設定後才會寫入此 key，因此視為已主動設定。
      reminderConfigured: parsed.reminderConfigured ?? true,
      systemConfigured: parsed.systemConfigured ?? true,
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

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  await ensureAndroidChannel();
  const permission = await Notifications.getPermissionsAsync();
  let channelEnabled = true;

  if (Platform.OS === 'android') {
    const channel = await Notifications.getNotificationChannelAsync(CHANNEL_ID);
    channelEnabled = !channel || channel.importance !== Notifications.AndroidImportance.NONE;
  }

  return {
    granted: permission.status === 'granted' && permission.granted && channelEnabled,
    canAskAgain: permission.canAskAgain,
    channelEnabled,
    status: permission.status,
  };
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await getNotificationPermissionState();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  await Notifications.requestPermissionsAsync();
  return (await getNotificationPermissionState()).granted;
}

export function getReminderTypes(reminder: { type?: string; types?: string[] }): string[] {
  const rawTypes = reminder.types?.length
    ? reminder.types
    : (reminder.type || '').split(/[、,，]/);
  return Array.from(new Set(rawTypes.map(type => type.trim()).filter(Boolean)));
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

async function cancelReminderNotificationUnlocked(ownerId: string, reminderId: string) {
  const key = `${ownerId}:${reminderId}`;
  const scheduleMap = await readScheduleMap();
  const identifiers = scheduleMap[key] || [];

  await Promise.all(
    identifiers.map(identifier =>
      Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
    ),
  );
  delete scheduleMap[key];
  await writeScheduleMap(scheduleMap);
}

export async function cancelReminderNotification(ownerId: string, reminderId: string) {
  return runNotificationOperation(() => cancelReminderNotificationUnlocked(ownerId, reminderId));
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

async function scheduleReminderNotificationUnlocked(
  ownerId: string,
  reminder: ReminderNotificationInput,
  knownState?: {
    preferences: NotificationPreferences;
    permissionGranted: boolean;
    maxEveryNOccurrences?: number;
  },
): Promise<boolean> {
  await cancelReminderNotificationUnlocked(ownerId, reminder.id);

  const preferences = knownState?.preferences ?? await getNotificationPreferences();
  if (!preferences.reminderEnabled || !preferences.systemEnabled || !reminder.isOn) return false;

  const permissionGranted = knownState?.permissionGranted ?? await requestNotificationPermission();
  if (!permissionGranted) return false;

  const [hour, minute] = (reminder.time || '').split(':').map(Number);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23
    || !Number.isInteger(minute) || minute < 0 || minute > 59) return false;
  const triggers = buildReminderTriggers(
    reminder,
    hour,
    minute,
    knownState?.maxEveryNOccurrences,
  );
  const reminderTypes = getReminderTypes(reminder);
  if (triggers.length === 0 || reminderTypes.length === 0) return false;
  const reminderTitle = reminderTypes.join('、');

  const identifiers: string[] = [];
  try {
    for (let triggerIndex = 0; triggerIndex < triggers.length; triggerIndex += 1) {
      const identifier = `${ownerId}:${reminder.id}:${triggerIndex}`;
      const scheduledIdentifier = await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: reminderTitle,
          body: reminder.note || '該照顧寵物囉！',
          sound: 'default',
          data: {
            ownerId,
            reminderId: reminder.id,
            petId: reminder.petId,
            petIds: reminder.pets || [reminder.petId],
            reminderType: reminderTitle,
            reminderTypes,
          },
        },
        trigger: triggers[triggerIndex],
      });
      identifiers.push(scheduledIdentifier);
    }

    const scheduleMap = await readScheduleMap();
    scheduleMap[`${ownerId}:${reminder.id}`] = identifiers;
    await writeScheduleMap(scheduleMap);
    return true;
  } catch (error) {
    await Promise.all(
      identifiers.map(identifier =>
        Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
      ),
    );
    throw error;
  }
}

export async function scheduleReminderNotification(
  ownerId: string,
  reminder: ReminderNotificationInput,
): Promise<boolean> {
  return runNotificationOperation(
    () => scheduleReminderNotificationUnlocked(ownerId, reminder),
  );
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
    await cancelAllLizLogNotificationsUnlocked();

    const preferences = await getNotificationPreferences();
    const preferencesEnabled = preferences.reminderEnabled && preferences.systemEnabled;
    if (!preferencesEnabled) {
      return {
        scheduledReminderCount: 0,
        failedReminderIds: [],
        permissionGranted: false,
        preferencesEnabled: false,
      };
    }

    const permissionGranted = (await getNotificationPermissionState()).granted;
    if (!permissionGranted) {
      return {
        scheduledReminderCount: 0,
        failedReminderIds: [],
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
    for (const reminder of activeReminders) {
      try {
        const scheduled = await scheduleReminderNotificationUnlocked(
          reminder.ownerId || fallbackOwnerId,
          reminder,
          {
            preferences,
            permissionGranted,
            maxEveryNOccurrences: cappedEveryNLimit,
          },
        );
        if (scheduled) scheduledReminderCount += 1;
        else failedReminderIds.push(reminder.id);
      } catch {
        failedReminderIds.push(reminder.id);
      }
    }

    return {
      scheduledReminderCount,
      failedReminderIds,
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
  pets: Array<Pick<PetDoc, 'id' | 'coParents'>>,
): Promise<NotificationSyncResult> {
  return synchronizeReminderNotifications(
    userId,
    filterMutedReminders(userId, reminders, pets),
  );
}
