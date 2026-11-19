import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import { useLibrary } from "@/data/store";
import {
  areStudyRemindersSupported,
  clearStudyReminders,
  configureStudyReminderHandler,
  getStudyRemindersEnabled,
  requestStudyReminderPermissions,
  setStudyRemindersEnabled,
  syncStudyReminders,
} from "@/data/study-reminders";

type StudyRemindersContextValue = {
  supported: boolean;
  ready: boolean;
  enabled: boolean;
  setEnabled: (enabled: boolean) => Promise<boolean>;
};

const StudyRemindersContext = createContext<StudyRemindersContextValue | null>(null);

configureStudyReminderHandler();

export function StudyRemindersProvider({ children }: { children: ReactNode }) {
  const { ready, cards } = useLibrary();
  const supported = areStudyRemindersSupported();
  const [preferenceReady, setPreferenceReady] = useState(!supported);
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    if (!supported) return;
    let active = true;
    getStudyRemindersEnabled()
      .then((value) => {
        if (active) {
          setEnabledState(value);
          setPreferenceReady(true);
        }
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
    syncStudyReminders(cards, enabled).catch(() => {});
  }, [supported, ready, preferenceReady, cards, enabled]);

  useEffect(() => {
    if (!supported || !ready || !preferenceReady || !enabled) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncStudyReminders(cards, true).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [supported, ready, preferenceReady, enabled, cards]);

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
      await syncStudyReminders(cards, next);
      return next;
    },
    [supported, cards],
  );

  const value = useMemo(
    () => ({
      supported,
      ready: preferenceReady,
      enabled,
      setEnabled,
    }),
    [supported, preferenceReady, enabled, setEnabled],
  );

  return <StudyRemindersContext.Provider value={value}>{children}</StudyRemindersContext.Provider>;
}

export function useStudyReminders() {
  const value = useContext(StudyRemindersContext);
  if (!value) throw new Error("useStudyReminders must be used within StudyRemindersProvider");
  return value;
}
