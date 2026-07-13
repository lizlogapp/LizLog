import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ReminderDoc } from './firestoreService';

const PREFERENCES_KEY = 'lizlog.notification.preferences.v1';
const SCHEDULES_KEY = 'lizlog.notification.schedules.v1';
const CHANNEL_ID = 'lizlog-reminders';

export interface NotificationPreferences {
  reminderEnabled: boolean;
  systemEnabled: boolean;
}

type ScheduleMap = Record<string, string[]>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
    return JSON.parse(value) as ScheduleMap;
  } catch {
    return {};
  }
}

async function writeScheduleMap(value: ScheduleMap) {
  await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(value));
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const value = await AsyncStorage.getItem(PREFERENCES_KEY);
  if (!value) return { reminderEnabled: true, systemEnabled: false };
  try {
    return { reminderEnabled: true, systemEnabled: false, ...JSON.parse(value) };
  } catch {
    return { reminderEnabled: true, systemEnabled: false };
  }
}

export async function saveNotificationPreferences(preferences: NotificationPreferences) {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelReminderNotification(ownerId: string, reminderId: string) {
  const key = `${ownerId}:${reminderId}`;
  const scheduleMap = await readScheduleMap();
  await Promise.all((scheduleMap[key] || []).map(identifier =>
    Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
  ));
  delete scheduleMap[key];
  await writeScheduleMap(scheduleMap);
}

function nextDate(startDate: string | undefined, hour: number, minute: number): Date {
  const normalized = startDate?.replace(/\//g, '-');
  const base = normalized ? new Date(`${normalized}T00:00:00`) : new Date();
  const result = Number.isNaN(base.getTime()) ? new Date() : base;
  result.setHours(hour, minute, 0, 0);
  if (result.getTime() <= Date.now()) result.setDate(result.getDate() + 1);
  return result;
}

export async function scheduleReminderNotification(
  ownerId: string,
  reminder: ReminderDoc & { id: string },
): Promise<boolean> {
  await cancelReminderNotification(ownerId, reminder.id);
  const preferences = await getNotificationPreferences();
  if (!preferences.reminderEnabled || !preferences.systemEnabled || !reminder.isOn) return false;
  if (!(await requestNotificationPermission())) return false;

  const [hourValue, minuteValue] = reminder.time.split(':').map(Number);
  const hour = Number.isFinite(hourValue) ? hourValue : 9;
  const minute = Number.isFinite(minuteValue) ? minuteValue : 0;
  const content: Notifications.NotificationContentInput = {
    title: reminder.type || '蜥日日記照護提醒',
    body: reminder.note || '該照顧寵物囉！',
    sound: 'default',
    data: { ownerId, reminderId: reminder.id, petId: reminder.petId },
  };
  const triggers: Notifications.NotificationTriggerInput[] = [];

  if (reminder.frequencyType === 'daily') {
    triggers.push({ type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL_ID });
  } else if (reminder.frequencyType === 'weekly') {
    (reminder.selectedWeekDays || []).forEach(day => triggers.push({
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: day + 1,
      hour,
      minute,
      channelId: CHANNEL_ID,
    }));
  } else if (reminder.frequencyType === 'everyN') {
    const interval = Math.max(1, Number(reminder.everyNDays) || 1);
    const first = nextDate(reminder.startDate, hour, minute);
    for (let index = 0; index < 12; index += 1) {
      const date = new Date(first);
      date.setDate(first.getDate() + index * interval);
      triggers.push({ type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID });
    }
  } else {
    const date = nextDate(reminder.startDate, hour, minute);
    triggers.push({ type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID });
  }

  if (triggers.length === 0) return false;
  const identifiers = await Promise.all(triggers.map(trigger =>
    Notifications.scheduleNotificationAsync({ content, trigger }),
  ));
  const scheduleMap = await readScheduleMap();
  scheduleMap[`${ownerId}:${reminder.id}`] = identifiers;
  await writeScheduleMap(scheduleMap);
  return true;
}

export async function cancelAllLizLogNotifications() {
  const scheduleMap = await readScheduleMap();
  await Promise.all(Object.values(scheduleMap).flat().map(identifier =>
    Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
  ));
  await writeScheduleMap({});
}
