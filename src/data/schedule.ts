import { Card, Rating } from "@/data/types";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

export const RATINGS: { id: Rating; label: string; hint: string }[] = [
  { id: "again", label: "Again", hint: "1 min" },
  { id: "hard", label: "Hard", hint: "2 days" },
  { id: "good", label: "Good", hint: "4 days" },
  { id: "easy", label: "Easy", hint: "9 days" },
];

const INTERVALS: Record<Rating, number> = {
  again: MINUTE,
  hard: 2 * DAY,
  good: 4 * DAY,
  easy: 9 * DAY,
};

export function applyRating(card: Card, rating: Rating, now = Date.now()): Card {
  return {
    ...card,
    state: rating === "again" ? "learning" : "review",
    dueAt: now + INTERVALS[rating],
  };
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
