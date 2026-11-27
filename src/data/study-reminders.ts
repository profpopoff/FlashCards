import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { Card } from "@/data/types";

const PREFERENCE_KEY = "flashcards.studyReminders.enabled";
const TIME_KEY = "flashcards.studyReminders.time.v1";
const CHANNEL_ID = "study-due";
const NOTIFICATION_ID = "study-due-daily";

export type ReminderTime = { hour: number; minute: number };

export const DEFAULT_REMINDER_TIME: ReminderTime = { hour: 9, minute: 0 };

export function areStudyRemindersSupported() {
  return Platform.OS === "ios" || Platform.OS === "android";
}

export async function getStudyRemindersEnabled() {
  const raw = await AsyncStorage.getItem(PREFERENCE_KEY);
  return raw === "1";
}

export async function setStudyRemindersEnabled(enabled: boolean) {
  await AsyncStorage.setItem(PREFERENCE_KEY, enabled ? "1" : "0");
}

export function parseReminderTime(raw: string | null): ReminderTime {
  if (!raw) return DEFAULT_REMINDER_TIME;
  try {
    const parsed = JSON.parse(raw) as Partial<ReminderTime>;
    const hour = Number(parsed.hour);
    const minute = Number(parsed.minute);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return DEFAULT_REMINDER_TIME;
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) return DEFAULT_REMINDER_TIME;
    return { hour, minute };
  } catch {
    return DEFAULT_REMINDER_TIME;
  }
}

export async function getReminderTime(): Promise<ReminderTime> {
  return parseReminderTime(await AsyncStorage.getItem(TIME_KEY));
}

export async function setReminderTime(time: ReminderTime) {
  const next = {
    hour: Math.min(23, Math.max(0, Math.floor(time.hour))),
    minute: Math.min(59, Math.max(0, Math.floor(time.minute))),
  };
  await AsyncStorage.setItem(TIME_KEY, JSON.stringify(next));
}

export function formatReminderTime(time: ReminderTime) {
  const date = new Date();
  date.setHours(time.hour, time.minute, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function nextDailyOccurrence(time: ReminderTime, after = Date.now()) {
  const date = new Date(after);
  date.setSeconds(0, 0);
  date.setHours(time.hour, time.minute, 0, 0);
  if (date.getTime() <= after) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

/** Next daily fire, with how many cards are due by then. */
export function nextStudyReminder(cards: Card[], time: ReminderTime, now = Date.now()) {
  const dueAt = nextDailyOccurrence(time, now).getTime();
  const count = cards.filter((card) => card.dueAt <= dueAt).length;
  return { dueAt, count };
}

export function reminderCopy(count: number) {
  if (count <= 0) {
    return {
      title: "Nothing due today",
      body: "You're all caught up — add a few new words to keep learning.",
      dataType: "study-idle" as const,
    };
  }
  return {
    title: "Ready to study?",
    body: count === 1 ? "1 word is due for review." : `${count} words are due for review.`,
    dataType: "study-due" as const,
  };
}

export async function ensureStudyReminderChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Study reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function requestStudyReminderPermissions() {
  if (!areStudyRemindersSupported()) return false;

  await ensureStudyReminderChannel();

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  return status === "granted";
}

export async function clearStudyReminders() {
  if (!areStudyRemindersSupported()) return;
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => {});
}

export async function syncStudyReminders(cards: Card[], enabled: boolean, time: ReminderTime) {
  if (!areStudyRemindersSupported()) return;

  await clearStudyReminders();
  if (!enabled) return;

  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== "granted") return;

  await ensureStudyReminderChannel();

  const next = nextStudyReminder(cards, time);
  const copy = reminderCopy(next.count);

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: copy.title,
      body: copy.body,
      data: { type: copy.dataType },
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(next.dueAt),
      ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
    },
  });
}

export function configureStudyReminderHandler() {
  if (!areStudyRemindersSupported()) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
