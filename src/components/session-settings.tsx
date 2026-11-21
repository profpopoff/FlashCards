import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_SESSION_SIZE,
  getSessionSize,
  SessionSize,
  setSessionSize as persistSessionSize,
} from "@/data/session-size";
import {
  DEFAULT_STUDY_MODE,
  getStudyMode,
  StudyMode,
  setStudyMode as persistStudyMode,
} from "@/data/study-mode";

type SessionSettingsContextValue = {
  ready: boolean;
  sessionSize: SessionSize;
  setSessionSize: (size: SessionSize) => Promise<void>;
  studyMode: StudyMode;
  setStudyMode: (mode: StudyMode) => Promise<void>;
};

const SessionSettingsContext = createContext<SessionSettingsContextValue | null>(null);

export function SessionSettingsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [sessionSize, setSessionSizeState] = useState<SessionSize>(DEFAULT_SESSION_SIZE);
  const [studyMode, setStudyModeState] = useState<StudyMode>(DEFAULT_STUDY_MODE);

  useEffect(() => {
    let active = true;
    Promise.all([getSessionSize(), getStudyMode()])
      .then(([size, mode]) => {
        if (!active) return;
        setSessionSizeState(size);
        setStudyModeState(mode);
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setSessionSize = useCallback(async (size: SessionSize) => {
    setSessionSizeState(size);
    await persistSessionSize(size);
  }, []);

  const setStudyMode = useCallback(async (mode: StudyMode) => {
    setStudyModeState(mode);
    await persistStudyMode(mode);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      sessionSize,
      setSessionSize,
      studyMode,
      setStudyMode,
    }),
    [ready, sessionSize, setSessionSize, studyMode, setStudyMode],
  );

  return <SessionSettingsContext.Provider value={value}>{children}</SessionSettingsContext.Provider>;
}

export function useSessionSettings() {
  const value = useContext(SessionSettingsContext);
  if (!value) throw new Error("useSessionSettings must be used within SessionSettingsProvider");
  return value;
}
