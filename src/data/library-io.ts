import { normalizeCard } from "@/data/schedule";
import { Card, Library, Tag } from "@/data/types";

export const LIBRARY_EXPORT_VERSION = 1;

export type LibraryExport = {
  version: typeof LIBRARY_EXPORT_VERSION;
  exportedAt: string;
  tags: Tag[];
  cards: Card[];
};

export type ImportMode = "replace" | "merge";

export type ImportPreview = {
  library: Library;
  wordCount: number;
  tagCount: number;
};

function isTag(value: unknown): value is Tag {
  if (!value || typeof value !== "object") return false;
  const tag = value as Tag;
  return typeof tag.id === "string" && typeof tag.name === "string" && typeof tag.color === "string";
}

function isCardState(value: unknown): value is Card["state"] {
  return value === "new" || value === "learning" || value === "review";
}

export function coerceCard(value: unknown): Card | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<Card>;
  if (
    typeof raw.id !== "string" ||
    typeof raw.word !== "string" ||
    typeof raw.pronunciation !== "string" ||
    typeof raw.translation !== "string" ||
    !Array.isArray(raw.tagIds) ||
    !raw.tagIds.every((id) => typeof id === "string") ||
    !isCardState(raw.state) ||
    typeof raw.dueAt !== "number"
  ) {
    return null;
  }

  return normalizeCard({
    id: raw.id,
    word: raw.word,
    pronunciation: raw.pronunciation,
    translation: raw.translation,
    tagIds: raw.tagIds,
    state: raw.state,
    dueAt: raw.dueAt,
    intervalDays: typeof raw.intervalDays === "number" ? raw.intervalDays : 0,
    ease: typeof raw.ease === "number" ? raw.ease : 2.5,
    repetitions: typeof raw.repetitions === "number" ? raw.repetitions : 0,
    lapses: typeof raw.lapses === "number" ? raw.lapses : 0,
    learningStep: typeof raw.learningStep === "number" ? raw.learningStep : 0,
  });
}

export function parseLibrary(value: unknown): Library | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { tags?: unknown; cards?: unknown };
  if (!Array.isArray(raw.tags) || !Array.isArray(raw.cards)) return null;
  if (!raw.tags.every(isTag)) return null;
  if (!raw.cards.every((card) => coerceCard(card) !== null)) return null;
  return {
    tags: raw.tags,
    cards: raw.cards.map((card) => coerceCard(card)!),
  };
}

export function createLibraryExport(library: Library, exportedAt = new Date()): LibraryExport {
  return {
    version: LIBRARY_EXPORT_VERSION,
    exportedAt: exportedAt.toISOString(),
    tags: library.tags,
    cards: library.cards,
  };
}

export function parseLibraryExport(raw: string): ImportPreview | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const payload = parsed as { version?: unknown };
    // Missing version is allowed for hand-edited files that still match the library shape.
    if (typeof payload.version === "number" && payload.version !== LIBRARY_EXPORT_VERSION) {
      return null;
    }
    const library = parseLibrary(parsed);
    if (!library) return null;
    return {
      library,
      wordCount: library.cards.length,
      tagCount: library.tags.length,
    };
  } catch {
    return null;
  }
}

/** File wins on id conflicts; local-only entries stay. */
export function mergeLibraries(local: Library, incoming: Library): Library {
  const tagsById = new Map(local.tags.map((tag) => [tag.id, tag]));
  for (const tag of incoming.tags) {
    tagsById.set(tag.id, tag);
  }

  const cardsById = new Map(local.cards.map((card) => [card.id, card]));
  for (const card of incoming.cards) {
    cardsById.set(card.id, card);
  }

  return {
    tags: Array.from(tagsById.values()),
    cards: Array.from(cardsById.values()),
  };
}

export function exportFileName(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10);
  return `flashcards-${stamp}.json`;
}

export function librarySummary(library: Library) {
  const words = library.cards.length;
  const tags = library.tags.length;
  const wordLabel = words === 1 ? "1 word" : `${words} words`;
  const tagLabel = tags === 1 ? "1 tag" : `${tags} tags`;
  return `${wordLabel} · ${tagLabel}`;
}
