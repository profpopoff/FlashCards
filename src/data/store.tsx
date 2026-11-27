import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { mergeLibraries, parseLibrary } from "@/data/library-io";
import { TAG_PALETTE } from "@/data/palette";
import { applyRating, createNewCardFields } from "@/data/schedule";
import { Card, Library, NewCardInput, Rating, Tag, UpdateCardInput } from "@/data/types";

const STORAGE_KEY = "flashcards.library.v3";
const EMPTY_LIBRARY: Library = { tags: [], cards: [] };

type LibraryContextValue = {
  ready: boolean;
  tags: Tag[];
  cards: Card[];
  addCard: (input: NewCardInput) => void;
  updateCard: (id: string, input: UpdateCardInput) => void;
  deleteCard: (id: string) => void;
  addTag: (name: string) => string | null;
  renameTag: (id: string, name: string) => void;
  deleteTag: (id: string) => void;
  rateCard: (id: string, rating: Rating) => void;
  restoreCard: (card: Card) => void;
  replaceLibrary: (library: Library) => void;
  mergeLibrary: (library: Library) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

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
          const parsed = parseLibrary(JSON.parse(raw) as unknown);
          setLibrary(parsed ?? EMPTY_LIBRARY);
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
      ...createNewCardFields(),
    };

    setLibrary((current) => (current ? { ...current, cards: [card, ...current.cards] } : current));
  }, []);

  const updateCard = useCallback((id: string, input: UpdateCardInput) => {
    const word = input.word.trim();
    const translation = input.translation.trim();
    if (!word || !translation) return;

    setLibrary((current) => {
      if (!current) return current;
      return {
        ...current,
        cards: current.cards.map((card) =>
          card.id === id
            ? {
                ...card,
                word,
                pronunciation: input.pronunciation.trim(),
                translation,
                tagIds: input.tagIds,
              }
            : card,
        ),
      };
    });
  }, []);

  const deleteCard = useCallback((id: string) => {
    setLibrary((current) => {
      if (!current) return current;
      return { ...current, cards: current.cards.filter((card) => card.id !== id) };
    });
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

  const deleteTag = useCallback((id: string) => {
    setLibrary((current) => {
      if (!current) return current;
      return {
        tags: current.tags.filter((tag) => tag.id !== id),
        cards: current.cards.map((card) => ({
          ...card,
          tagIds: card.tagIds.filter((tagId) => tagId !== id),
        })),
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

  const restoreCard = useCallback((snapshot: Card) => {
    setLibrary((current) => {
      if (!current) return current;
      return {
        ...current,
        cards: current.cards.map((card) => (card.id === snapshot.id ? snapshot : card)),
      };
    });
  }, []);

  const replaceLibrary = useCallback((next: Library) => {
    libraryRef.current = next;
    setLibrary(next);
  }, []);

  const mergeLibrary = useCallback((incoming: Library) => {
    setLibrary((current) => {
      if (!current) return current;
      const next = mergeLibraries(current, incoming);
      libraryRef.current = next;
      return next;
    });
  }, []);

  const value = useMemo<LibraryContextValue>(
    () => ({
      ready: library !== null,
      tags: library?.tags ?? [],
      cards: library?.cards ?? [],
      addCard,
      updateCard,
      deleteCard,
      addTag,
      renameTag,
      deleteTag,
      rateCard,
      restoreCard,
      replaceLibrary,
      mergeLibrary,
    }),
    [
      library,
      addCard,
      updateCard,
      deleteCard,
      addTag,
      renameTag,
      deleteTag,
      rateCard,
      restoreCard,
      replaceLibrary,
      mergeLibrary,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("useLibrary must be used within LibraryProvider");
  return value;
}
