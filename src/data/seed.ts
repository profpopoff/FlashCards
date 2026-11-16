import { Card, CardState, Library, Tag } from "@/data/types";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const TAGS: Tag[] = [
  { id: "work", name: "Work", color: "#4F3DFF" },
  { id: "travel", name: "Travel", color: "#14988D" },
  { id: "idioms", name: "Idioms", color: "#E15B8C" },
  { id: "food", name: "Food", color: "#E08A22" },
  { id: "verbs", name: "Verbs", color: "#6B7280" },
];

type Draft = {
  word: string;
  pronunciation: string;
  translation: string;
  tag: string;
  state: CardState;
  dueIn: number;
};

const DUE_NEW = -HOUR;
const DUE_LEARNING = -10 * MINUTE;
const DUE_REVIEW = -2 * HOUR;
const LATER = 6 * DAY;

const DRAFTS: Draft[] = [
  { word: "ubiquitous", pronunciation: "/juːˈbɪkwɪtəs/", translation: "вездесущий", tag: "work", state: "new", dueIn: DUE_NEW },
  { word: "itinerary", pronunciation: "/aɪˈtɪnəreri/", translation: "маршрут", tag: "travel", state: "new", dueIn: DUE_NEW },
  { word: "break the ice", pronunciation: "/breɪk ðə aɪs/", translation: "растопить лёд", tag: "idioms", state: "new", dueIn: DUE_NEW },
  { word: "negotiate", pronunciation: "/nɪˈɡoʊʃieɪt/", translation: "вести переговоры", tag: "work", state: "new", dueIn: DUE_NEW },
  { word: "luggage", pronunciation: "/ˈlʌɡɪdʒ/", translation: "багаж", tag: "travel", state: "new", dueIn: DUE_NEW },
  { word: "once in a blue moon", pronunciation: "/wʌns ɪn ə bluː muːn/", translation: "очень редко", tag: "idioms", state: "new", dueIn: DUE_NEW },
  { word: "deadline", pronunciation: "/ˈdedlaɪn/", translation: "крайний срок", tag: "work", state: "learning", dueIn: DUE_LEARNING },
  { word: "stakeholder", pronunciation: "/ˈsteɪkhoʊldər/", translation: "заинтересованная сторона", tag: "work", state: "learning", dueIn: DUE_LEARNING },
  { word: "agenda", pronunciation: "/əˈdʒendə/", translation: "повестка", tag: "work", state: "learning", dueIn: DUE_LEARNING },
  { word: "feedback", pronunciation: "/ˈfiːdbæk/", translation: "обратная связь", tag: "work", state: "learning", dueIn: DUE_LEARNING },
  { word: "boarding pass", pronunciation: "/ˈbɔːrdɪŋ pæs/", translation: "посадочный талон", tag: "travel", state: "learning", dueIn: DUE_LEARNING },
  { word: "departure", pronunciation: "/dɪˈpɑːrtʃər/", translation: "отправление", tag: "travel", state: "learning", dueIn: DUE_LEARNING },
  { word: "customs", pronunciation: "/ˈkʌstəmz/", translation: "таможня", tag: "travel", state: "learning", dueIn: DUE_LEARNING },
  { word: "souvenir", pronunciation: "/ˌsuːvəˈnɪr/", translation: "сувенир", tag: "travel", state: "learning", dueIn: DUE_LEARNING },
  { word: "piece of cake", pronunciation: "/piːs əv keɪk/", translation: "проще простого", tag: "idioms", state: "learning", dueIn: DUE_LEARNING },
  { word: "hit the road", pronunciation: "/hɪt ðə roʊd/", translation: "отправиться в путь", tag: "idioms", state: "learning", dueIn: DUE_LEARNING },
  { word: "under the weather", pronunciation: "/ˈʌndər ðə ˈweðər/", translation: "нездоровиться", tag: "idioms", state: "learning", dueIn: DUE_LEARNING },
  { word: "meeting", pronunciation: "/ˈmiːtɪŋ/", translation: "встреча", tag: "work", state: "review", dueIn: DUE_REVIEW },
  { word: "budget", pronunciation: "/ˈbʌdʒɪt/", translation: "бюджет", tag: "work", state: "review", dueIn: DUE_REVIEW },
  { word: "reservation", pronunciation: "/ˌrezərˈveɪʃn/", translation: "бронь", tag: "travel", state: "review", dueIn: DUE_REVIEW },
  { word: "passport", pronunciation: "/ˈpæspɔːrt/", translation: "паспорт", tag: "travel", state: "review", dueIn: DUE_REVIEW },
  { word: "layover", pronunciation: "/ˈleɪoʊvər/", translation: "пересадка", tag: "travel", state: "review", dueIn: DUE_REVIEW },
  { word: "spill the beans", pronunciation: "/spɪl ðə biːnz/", translation: "проболтаться", tag: "idioms", state: "review", dueIn: DUE_REVIEW },
  { word: "cost an arm and a leg", pronunciation: "/kɔːst ən ɑːrm ənd ə leɡ/", translation: "влететь в копеечку", tag: "idioms", state: "review", dueIn: DUE_REVIEW },
  { word: "recipe", pronunciation: "/ˈresəpi/", translation: "рецепт", tag: "food", state: "review", dueIn: LATER },
  { word: "appetite", pronunciation: "/ˈæpətaɪt/", translation: "аппетит", tag: "food", state: "review", dueIn: LATER },
  { word: "ingredient", pronunciation: "/ɪnˈɡriːdiənt/", translation: "ингредиент", tag: "food", state: "review", dueIn: LATER },
  { word: "dessert", pronunciation: "/dɪˈzɜːrt/", translation: "десерт", tag: "food", state: "review", dueIn: LATER },
  { word: "spicy", pronunciation: "/ˈspaɪsi/", translation: "острый", tag: "food", state: "review", dueIn: LATER },
  { word: "achieve", pronunciation: "/əˈtʃiːv/", translation: "достигать", tag: "verbs", state: "review", dueIn: LATER + DAY },
  { word: "borrow", pronunciation: "/ˈbɒroʊ/", translation: "одалживать", tag: "verbs", state: "review", dueIn: LATER + DAY },
  { word: "consider", pronunciation: "/kənˈsɪdər/", translation: "рассматривать", tag: "verbs", state: "review", dueIn: LATER + DAY },
  { word: "discover", pronunciation: "/dɪˈskʌvər/", translation: "обнаруживать", tag: "verbs", state: "review", dueIn: LATER + DAY },
  { word: "explain", pronunciation: "/ɪkˈspleɪn/", translation: "объяснять", tag: "verbs", state: "review", dueIn: LATER + DAY },
  { word: "improve", pronunciation: "/ɪmˈpruːv/", translation: "улучшать", tag: "verbs", state: "review", dueIn: LATER + DAY },
  { word: "manage", pronunciation: "/ˈmænɪdʒ/", translation: "управлять", tag: "verbs", state: "review", dueIn: LATER + DAY },
  { word: "notice", pronunciation: "/ˈnoʊtɪs/", translation: "замечать", tag: "verbs", state: "review", dueIn: LATER + DAY },
  { word: "prepare", pronunciation: "/prɪˈpeər/", translation: "готовить", tag: "verbs", state: "review", dueIn: LATER + DAY },
  { word: "suggest", pronunciation: "/səˈdʒest/", translation: "предлагать", tag: "verbs", state: "review", dueIn: LATER + DAY },
  { word: "remind", pronunciation: "/rɪˈmaɪnd/", translation: "напоминать", tag: "verbs", state: "review", dueIn: LATER + DAY },
  { word: "choose", pronunciation: "/tʃuːz/", translation: "выбирать", tag: "verbs", state: "review", dueIn: LATER + DAY },
  { word: "develop", pronunciation: "/dɪˈveləp/", translation: "развивать", tag: "verbs", state: "review", dueIn: LATER + DAY },
  { word: "forget", pronunciation: "/fərˈɡet/", translation: "забывать", tag: "verbs", state: "review", dueIn: LATER + DAY },
];

function slug(word: string, index: number) {
  const base = word
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `card-${index}`;
}

export function createSeed(now = Date.now()): Library {
  const cards: Card[] = DRAFTS.map((draft, index) => ({
    id: slug(draft.word, index),
    word: draft.word,
    pronunciation: draft.pronunciation,
    translation: draft.translation,
    tagIds: [draft.tag],
    state: draft.state,
    dueAt: now + draft.dueIn,
  }));

  return { tags: TAGS.map((tag) => ({ ...tag })), cards };
}

export const TAG_PALETTE = ["#4F3DFF", "#14988D", "#E15B8C", "#E08A22", "#6B7280", "#3B82F6", "#16A34A", "#9333EA"];
