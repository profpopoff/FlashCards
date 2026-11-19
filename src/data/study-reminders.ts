import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { Card } from "@/data/types";

const PREFERENCE_KEY = "flashcards.studyReminders.enabled";
const CHANNEL_ID = "study-due";
const NOTIFICATION_ID = "study-due-next";

/** Skip very near-term due times so 1-minute learning steps don't spam. */
const MIN_LEAD_MS = 2 * 60 * 1000;

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

export function nextStudyReminder(cards: Card[], now = Date.now()) {
  const futureDueAts = cards
    .map((card) => card.dueAt)
    .filter((dueAt) => dueAt > now + MIN_LEAD_MS)
    .sort((a, b) => a - b);

  const dueAt = futureDueAts[0];
  if (dueAt === undefined) return null;

  const count = cards.filter((card) => card.dueAt <= dueAt).length;
  return { dueAt, count };
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

export async function syncStudyReminders(cards: Card[], enabled: boolean) {
  if (!areStudyRemindersSupported()) return;

  await clearStudyReminders();
  if (!enabled) return;

  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== "granted") return;

  await ensureStudyReminderChannel();

  const next = nextStudyReminder(cards);
  if (!next) return;

  const wordLabel = next.count === 1 ? "1 word is" : `${next.count} words are`;

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: "Ready to study?",
      body: `${wordLabel} due for review.`,
      data: { type: "study-due" },
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
