import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "flashcards.studyMode.v1";

export type StudyMode = "default" | "word" | "translation";

export const DEFAULT_STUDY_MODE: StudyMode = "default";

export const STUDY_MODE_OPTIONS: { value: StudyMode; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "word", label: "Word first" },
  { value: "translation", label: "Translation first" },
];

export function studyModeCopy(mode: StudyMode): string {
  if (mode === "word") return "Every card shows the word first.";
  if (mode === "translation") return "Every card shows the translation first.";
  return "New words stay word first. Later reviews show a random side.";
}

export function parseStudyMode(raw: string | null): StudyMode {
  if (raw === "word" || raw === "translation" || raw === "default") return raw;
  return DEFAULT_STUDY_MODE;
}

export async function getStudyMode(): Promise<StudyMode> {
  return parseStudyMode(await AsyncStorage.getItem(STORAGE_KEY));
}

export async function setStudyMode(mode: StudyMode) {
  await AsyncStorage.setItem(STORAGE_KEY, mode);
}
