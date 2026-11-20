import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "flashcards.sessionSize.v1";
const CUSTOM_STORAGE_KEY = "flashcards.sessionSize.custom.v1";

/** `null` means study every due card. */
export type SessionSize = number | null;

export const DEFAULT_SESSION_SIZE: SessionSize = 20;
export const DEFAULT_CUSTOM_SESSION_SIZE = 15;
export const SESSION_SIZE_PRESETS = [10, 20, 30, 50] as const;

export const SESSION_SIZE_OPTIONS: { value: SessionSize; label: string }[] = [
  { value: null, label: "All" },
  ...SESSION_SIZE_PRESETS.map((value) => ({ value, label: String(value) })),
];

export function isSessionSizePreset(size: SessionSize): boolean {
  return typeof size === "number" && (SESSION_SIZE_PRESETS as readonly number[]).includes(size);
}

export function isCustomSessionSize(size: SessionSize): boolean {
  return size !== null && !isSessionSizePreset(size);
}

export function clampSessionSize(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_CUSTOM_SESSION_SIZE;
  return Math.min(999, Math.max(1, Math.floor(value)));
}

export function parseSessionSize(raw: string | null): SessionSize {
  if (raw === null) return DEFAULT_SESSION_SIZE;
  if (raw === "all" || raw === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_SESSION_SIZE;
  return Math.floor(value);
}

export async function getSessionSize(): Promise<SessionSize> {
  return parseSessionSize(await AsyncStorage.getItem(STORAGE_KEY));
}

export async function setSessionSize(size: SessionSize) {
  await AsyncStorage.setItem(STORAGE_KEY, size === null ? "all" : String(size));
  if (isCustomSessionSize(size)) {
    await AsyncStorage.setItem(CUSTOM_STORAGE_KEY, String(size));
  }
}

export async function getLastCustomSessionSize(): Promise<number> {
  const raw = await AsyncStorage.getItem(CUSTOM_STORAGE_KEY);
  if (raw === null) return DEFAULT_CUSTOM_SESSION_SIZE;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_CUSTOM_SESSION_SIZE;
  return clampSessionSize(value);
}

export function limitSessionIds<T>(ids: T[], size: SessionSize): T[] {
  if (size === null) return ids;
  return ids.slice(0, size);
}

export function sessionCountFor(dueTotal: number, size: SessionSize) {
  if (dueTotal <= 0) return 0;
  if (size === null) return dueTotal;
  return Math.min(dueTotal, size);
}
