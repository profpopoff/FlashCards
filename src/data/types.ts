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
