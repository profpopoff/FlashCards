export type CardState = "new" | "learning" | "review";

export type Rating = "again" | "hard" | "good" | "easy";

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type Card = {
  id: string;
  word: string;
  pronunciation: string;
  translation: string;
  tagIds: string[];
  state: CardState;
  dueAt: number;
  /** Current review interval in days (0 while new/learning). */
  intervalDays: number;
  /** SM-2 ease factor; starts at 2.5, floored at 1.3. */
  ease: number;
  /** Successful review streak used by SM-2. */
  repetitions: number;
  /** Times the card has lapsed back into learning. */
  lapses: number;
  /** Index into learning steps while state is learning. */
  learningStep: number;
};

export type Library = {
  tags: Tag[];
  cards: Card[];
};

export type NewCardInput = {
  word: string;
  pronunciation: string;
  translation: string;
  tagIds: string[];
};
