import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_SESSION_SIZE,
  getSessionSize,
  SessionSize,
  setSessionSize as persistSessionSize,
} from "@/data/session-size";

type SessionSettingsContextValue = {
  ready: boolean;
  sessionSize: SessionSize;
  setSessionSize: (size: SessionSize) => Promise<void>;
};

const SessionSettingsContext = createContext<SessionSettingsContextValue | null>(null);

export function SessionSettingsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [sessionSize, setSessionSizeState] = useState<SessionSize>(DEFAULT_SESSION_SIZE);

  useEffect(() => {
    let active = true;
    getSessionSize()
      .then((value) => {
        if (!active) return;
        setSessionSizeState(value);
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

  const value = useMemo(
    () => ({
      ready,
      sessionSize,
      setSessionSize,
    }),
    [ready, sessionSize, setSessionSize],
  );

  return <SessionSettingsContext.Provider value={value}>{children}</SessionSettingsContext.Provider>;
}

export function useSessionSettings() {
  const value = useContext(SessionSettingsContext);
  if (!value) throw new Error("useSessionSettings must be used within SessionSettingsProvider");
  return value;
}
