import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, Platform, useColorScheme } from "react-native";

import { AppearancePreference, Palette, paletteFor, Scheme } from "@/constants/theme";

const STORAGE_KEY = "flashcards.appearance";

type ThemeContextValue = {
  colors: Palette;
  scheme: Scheme;
  preference: AppearancePreference;
  setPreference: (preference: AppearancePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemScheme();
  const [preference, setPreferenceState] = useState<AppearancePreference>("system");

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) return;
        if (raw === "light" || raw === "dark" || raw === "system") {
          setPreferenceState(raw);
          applyNativeScheme(raw);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback((next: AppearancePreference) => {
    setPreferenceState(next);
    applyNativeScheme(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const scheme: Scheme = preference === "system" ? systemScheme : preference;
  const colors = paletteFor(scheme);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.shell).catch(() => {});
  }, [colors.shell]);

  const value = useMemo(
    () => ({ colors, scheme, preference, setPreference }),
    [colors, scheme, preference, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}

export function useThemedStyles<T>(factory: (colors: Palette) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}

function applyNativeScheme(preference: AppearancePreference) {
  if (typeof Appearance.setColorScheme !== "function") return;
  Appearance.setColorScheme(preference === "system" ? "auto" : preference);
}

function useSystemScheme(): Scheme {
  const reported = useColorScheme();
  const [webScheme, setWebScheme] = useState<Scheme | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    function apply(next: string | null | undefined) {
      const resolved: Scheme = next === "dark" ? "dark" : "light";
      setWebScheme((current) => (current === resolved ? current : resolved));
    }

    apply(Appearance.getColorScheme());
    const subscription = Appearance.addChangeListener(({ colorScheme }) => apply(colorScheme));
    return () => subscription.remove();
  }, []);

  if (Platform.OS === "web") return webScheme ?? "light";
  return reported === "dark" ? "dark" : "light";
}
