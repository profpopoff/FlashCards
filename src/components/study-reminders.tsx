import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import { useLibrary } from "@/data/store";
import {
  ReminderTime,
  areStudyRemindersSupported,
  clearStudyReminders,
  configureStudyReminderHandler,
  DEFAULT_REMINDER_TIME,
  getReminderTime,
  getStudyRemindersEnabled,
  requestStudyReminderPermissions,
  setReminderTime as persistReminderTime,
  setStudyRemindersEnabled,
  syncStudyReminders,
} from "@/data/study-reminders";

type StudyRemindersContextValue = {
  supported: boolean;
  ready: boolean;
  enabled: boolean;
  time: ReminderTime;
  setEnabled: (enabled: boolean) => Promise<boolean>;
  setTime: (time: ReminderTime) => Promise<void>;
};

const StudyRemindersContext = createContext<StudyRemindersContextValue | null>(null);

configureStudyReminderHandler();

export function StudyRemindersProvider({ children }: { children: ReactNode }) {
  const { ready, cards } = useLibrary();
  const supported = areStudyRemindersSupported();
  const [preferenceReady, setPreferenceReady] = useState(!supported);
  const [enabled, setEnabledState] = useState(false);
  const [time, setTimeState] = useState<ReminderTime>(DEFAULT_REMINDER_TIME);

  useEffect(() => {
    if (!supported) return;
    let active = true;
    Promise.all([getStudyRemindersEnabled(), getReminderTime()])
      .then(([enabledValue, timeValue]) => {
        if (!active) return;
        setEnabledState(enabledValue);
        setTimeState(timeValue);
        setPreferenceReady(true);
      })
      .catch(() => {
        if (active) setPreferenceReady(true);
      });
    return () => {
      active = false;
    };
  }, [supported]);

  useEffect(() => {
    if (!supported || !ready || !preferenceReady) return;
    syncStudyReminders(cards, enabled, time).catch(() => {});
  }, [supported, ready, preferenceReady, cards, enabled, time]);

  useEffect(() => {
    if (!supported || !ready || !preferenceReady || !enabled) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncStudyReminders(cards, true, time).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [supported, ready, preferenceReady, enabled, cards, time]);

  const setEnabled = useCallback(
    async (next: boolean) => {
      if (!supported) return false;
      if (next) {
        const granted = await requestStudyReminderPermissions();
        if (!granted) {
          await setStudyRemindersEnabled(false);
          setEnabledState(false);
          await clearStudyReminders();
          return false;
        }
      }
      await setStudyRemindersEnabled(next);
      setEnabledState(next);
      await syncStudyReminders(cards, next, time);
      return next;
    },
    [supported, cards, time],
  );

  const setTime = useCallback(
    async (next: ReminderTime) => {
      setTimeState(next);
      await persistReminderTime(next);
      if (enabled) await syncStudyReminders(cards, true, next);
    },
    [cards, enabled],
  );

  const value = useMemo(
    () => ({
      supported,
      ready: preferenceReady,
      enabled,
      time,
      setEnabled,
      setTime,
    }),
    [supported, preferenceReady, enabled, time, setEnabled, setTime],
  );

  return <StudyRemindersContext.Provider value={value}>{children}</StudyRemindersContext.Provider>;
}

export function useStudyReminders() {
  const value = useContext(StudyRemindersContext);
  if (!value) throw new Error("useStudyReminders must be used within StudyRemindersProvider");
  return value;
}
