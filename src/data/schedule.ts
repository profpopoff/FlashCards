import { Card, Rating } from "@/data/types";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

/** Anki-style learning steps before graduating to review. */
const LEARNING_STEPS_MS = [1 * MINUTE, 10 * MINUTE];
const GRADUATING_INTERVAL_DAYS = 1;
const EASY_INTERVAL_DAYS = 4;
const STARTING_EASE = 2.5;
const MIN_EASE = 1.3;
const EASY_BONUS = 1.3;
const HARD_FACTOR = 1.2;

export const DEFAULT_EASE = STARTING_EASE;

export type RatingOption = { id: Rating; label: string };

export const RATINGS: RatingOption[] = [
  { id: "again", label: "Again" },
  { id: "hard", label: "Hard" },
  { id: "good", label: "Good" },
  { id: "easy", label: "Easy" },
];

export function createNewCardFields(now = Date.now()) {
  return {
    state: "new" as const,
    dueAt: now,
    intervalDays: 0,
    ease: STARTING_EASE,
    repetitions: 0,
    lapses: 0,
    learningStep: 0,
  };
}

export function normalizeCard(card: Card): Card {
  return {
    ...card,
    intervalDays: Number.isFinite(card.intervalDays) ? card.intervalDays : 0,
    ease: Number.isFinite(card.ease) ? Math.max(MIN_EASE, card.ease) : STARTING_EASE,
    repetitions: Number.isFinite(card.repetitions) ? card.repetitions : 0,
    lapses: Number.isFinite(card.lapses) ? card.lapses : 0,
    learningStep: Number.isFinite(card.learningStep) ? card.learningStep : 0,
  };
}

function clampEase(ease: number) {
  return Math.max(MIN_EASE, Math.round(ease * 100) / 100);
}

function daysToMs(days: number) {
  return Math.max(1, days) * DAY;
}

export function formatInterval(ms: number) {
  if (ms < MINUTE) return "< 1 min";
  if (ms < DAY) {
    const minutes = Math.max(1, Math.round(ms / MINUTE));
    return minutes === 1 ? "1 min" : `${minutes} min`;
  }
  const days = Math.max(1, Math.round(ms / DAY));
  return days === 1 ? "1 day" : `${days} days`;
}

function learningAgain(card: Card, now: number): Card {
  return {
    ...card,
    state: "learning",
    learningStep: 0,
    repetitions: 0,
    dueAt: now + LEARNING_STEPS_MS[0],
  };
}

function graduate(card: Card, intervalDays: number, ease: number, now: number): Card {
  return {
    ...card,
    state: "review",
    learningStep: 0,
    intervalDays,
    ease: clampEase(ease),
    repetitions: Math.max(1, card.repetitions + 1),
    dueAt: now + daysToMs(intervalDays),
  };
}

function applyLearning(card: Card, rating: Rating, now: number): Card {
  const step = Math.min(card.learningStep, LEARNING_STEPS_MS.length - 1);
  const currentStepMs = LEARNING_STEPS_MS[step];

  switch (rating) {
    case "again":
      return learningAgain(card, now);
    case "hard": {
      const nextMs =
        step + 1 < LEARNING_STEPS_MS.length
          ? (currentStepMs + LEARNING_STEPS_MS[step + 1]) / 2
          : currentStepMs * 1.5;
      return {
        ...card,
        state: "learning",
        dueAt: now + Math.max(MINUTE, Math.round(nextMs)),
      };
    }
    case "good": {
      if (step + 1 < LEARNING_STEPS_MS.length) {
        return {
          ...card,
          state: "learning",
          learningStep: step + 1,
          dueAt: now + LEARNING_STEPS_MS[step + 1],
        };
      }
      return graduate(card, GRADUATING_INTERVAL_DAYS, card.ease, now);
    }
    case "easy":
      return graduate(card, EASY_INTERVAL_DAYS, card.ease + 0.15, now);
  }
}

function applyReview(card: Card, rating: Rating, now: number): Card {
  const interval = Math.max(card.intervalDays, 1);

  switch (rating) {
    case "again":
      return {
        ...learningAgain(card, now),
        ease: clampEase(card.ease - 0.2),
        lapses: card.lapses + 1,
        intervalDays: 0,
      };
    case "hard": {
      const nextInterval = Math.max(1, Math.round(interval * HARD_FACTOR * 10) / 10);
      return {
        ...card,
        state: "review",
        intervalDays: nextInterval,
        ease: clampEase(card.ease - 0.15),
        repetitions: card.repetitions + 1,
        dueAt: now + daysToMs(nextInterval),
      };
    }
    case "good": {
      const nextInterval = Math.max(interval + 1, Math.round(interval * card.ease * 10) / 10);
      return {
        ...card,
        state: "review",
        intervalDays: nextInterval,
        repetitions: card.repetitions + 1,
        dueAt: now + daysToMs(nextInterval),
      };
    }
    case "easy": {
      const nextInterval = Math.max(interval + 1, Math.round(interval * card.ease * EASY_BONUS * 10) / 10);
      return {
        ...card,
        state: "review",
        intervalDays: nextInterval,
        ease: clampEase(card.ease + 0.15),
        repetitions: card.repetitions + 1,
        dueAt: now + daysToMs(nextInterval),
      };
    }
  }
}

export function applyRating(card: Card, rating: Rating, now = Date.now()): Card {
  const current = normalizeCard(card);
  if (current.state === "review") return applyReview(current, rating, now);
  return applyLearning(current, rating, now);
}

/** Preview the interval label shown under each rating button. */
export function previewInterval(card: Card, rating: Rating, now = Date.now()) {
  return formatInterval(applyRating(card, rating, now).dueAt - now);
}

export function isDue(card: Card, now = Date.now()) {
  return card.dueAt <= now;
}

export function dueCards(cards: Card[], tagId = "all", now = Date.now()) {
  return cards.filter((card) => {
    if (!isDue(card, now)) return false;
    if (tagId !== "all" && !card.tagIds.includes(tagId)) return false;
    return true;
  });
}

export function countByState(cards: Card[]) {
  return {
    total: cards.length,
    new: cards.filter((card) => card.state === "new").length,
    learning: cards.filter((card) => card.state === "learning").length,
    review: cards.filter((card) => card.state === "review").length,
  };
}

/** About 20 seconds per card, matching the “24 words · about 8 min” design. */
export function estimateMinutes(count: number) {
  if (count === 0) return 0;
  return Math.max(1, Math.round((count * 20) / 60));
}

export function wordCountLabel(count: number) {
  return count === 1 ? "1 word" : `${count} words`;
}
