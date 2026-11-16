import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { applyRating } from "@/data/schedule";
import { TAG_PALETTE } from "@/data/seed";
import { Card, Library, NewCardInput, Rating, Tag } from "@/data/types";

const STORAGE_KEY = "flashcards.library.v2";
const EMPTY_LIBRARY: Library = { tags: [], cards: [] };

type LibraryContextValue = {
  ready: boolean;
  tags: Tag[];
  cards: Card[];
  addCard: (input: NewCardInput) => void;
  addTag: (name: string) => string | null;
  renameTag: (id: string, name: string) => void;
  rateCard: (id: string, rating: Rating) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

function isTag(value: unknown): value is Tag {
  if (!value || typeof value !== "object") return false;
  const tag = value as Tag;
  return typeof tag.id === "string" && typeof tag.name === "string" && typeof tag.color === "string";
}

function isCard(value: unknown): value is Card {
  if (!value || typeof value !== "object") return false;
  const card = value as Card;
  return (
    typeof card.id === "string" &&
    typeof card.word === "string" &&
    typeof card.pronunciation === "string" &&
    typeof card.translation === "string" &&
    Array.isArray(card.tagIds) &&
    card.tagIds.every((id) => typeof id === "string") &&
    (card.state === "new" || card.state === "learning" || card.state === "review") &&
    typeof card.dueAt === "number"
  );
}

function isLibrary(value: unknown): value is Library {
  if (!value || typeof value !== "object") return false;
  const library = value as Library;
  return Array.isArray(library.tags) && Array.isArray(library.cards) && library.tags.every(isTag) && library.cards.every(isCard);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<Library | null>(null);
  const libraryRef = useRef(library);
  libraryRef.current = library;

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) return;
        if (!raw) {
          setLibrary(EMPTY_LIBRARY);
          return;
        }
        try {
          const parsed = JSON.parse(raw) as unknown;
          setLibrary(isLibrary(parsed) ? parsed : EMPTY_LIBRARY);
        } catch {
          setLibrary(EMPTY_LIBRARY);
        }
      })
      .catch(() => {
        if (active) setLibrary(EMPTY_LIBRARY);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!library) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(library)).catch(() => {});
  }, [library]);

  const addCard = useCallback((input: NewCardInput) => {
    const word = input.word.trim();
    const translation = input.translation.trim();
    if (!word || !translation) return;

    const card: Card = {
      id: uid("card"),
      word,
      pronunciation: input.pronunciation.trim(),
      translation,
      tagIds: input.tagIds,
      state: "new",
      dueAt: Date.now(),
    };

    setLibrary((current) => (current ? { ...current, cards: [card, ...current.cards] } : current));
  }, []);

  const addTag = useCallback((name: string) => {
    const current = libraryRef.current;
    const nextName = normalizeName(name);
    if (!current || !nextName) return null;

    const existing = current.tags.find((tag) => tag.name.toLowerCase() === nextName.toLowerCase());
    if (existing) return existing.id;

    const tag: Tag = {
      id: uid("tag"),
      name: nextName,
      color: TAG_PALETTE[current.tags.length % TAG_PALETTE.length],
    };
    const next = { ...current, tags: [...current.tags, tag] };
    libraryRef.current = next;
    setLibrary(next);
    return tag.id;
  }, []);

  const renameTag = useCallback((id: string, name: string) => {
    const nextName = normalizeName(name);
    if (!nextName) return;
    setLibrary((current) => {
      if (!current) return current;
      const taken = current.tags.some((tag) => tag.id !== id && tag.name.toLowerCase() === nextName.toLowerCase());
      if (taken) return current;
      return {
        ...current,
        tags: current.tags.map((tag) => (tag.id === id ? { ...tag, name: nextName } : tag)),
      };
    });
  }, []);

  const rateCard = useCallback((id: string, rating: Rating) => {
    const now = Date.now();
    setLibrary((current) => {
      if (!current) return current;
      return {
        ...current,
        cards: current.cards.map((card) => (card.id === id ? applyRating(card, rating, now) : card)),
      };
    });
  }, []);

  const value = useMemo<LibraryContextValue>(
    () => ({
      ready: library !== null,
      tags: library?.tags ?? [],
      cards: library?.cards ?? [],
      addCard,
      addTag,
      renameTag,
      rateCard,
    }),
    [library, addCard, addTag, renameTag, rateCard],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("useLibrary must be used within LibraryProvider");
  return value;
}
