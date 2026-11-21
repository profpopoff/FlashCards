import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurTargetView, BlurView } from "expo-blur";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState, type ComponentRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { useSessionSettings } from "@/components/session-settings";
import { TagPill } from "@/components/tag-pill";
import { useTheme, useThemedStyles } from "@/components/theme-provider";
import { Palette, tagAppearance } from "@/constants/theme";
import { applyRating, dueCards, previewInterval, RATINGS } from "@/data/schedule";
import { limitSessionIds, type SessionSize } from "@/data/session-size";
import type { StudyMode } from "@/data/study-mode";
import { useLibrary } from "@/data/store";
import { Card, Rating, Tag } from "@/data/types";

type Side = "word" | "translation";
type WaitingCard = { id: string; dueAt: number };
type StudySession = {
  tag: string;
  size: SessionSize;
  ids: string[];
  cursor: number;
  waiting: WaitingCard[];
  currentId: string | null;
  completed: number;
  passedIds: string[];
};

export default function StudyScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const params = useLocalSearchParams<{ tag?: string }>();
  const tag = typeof params.tag === "string" ? params.tag : "all";
  const { cards, tags, rateCard } = useLibrary();
  const { sessionSize, studyMode } = useSessionSettings();
  const [session, setSession] = useState(() => startSession(tag, sessionSize, cards));
  const [revealed, setRevealed] = useState(false);

  if (session.tag !== tag || session.size !== sessionSize) {
    setSession(startSession(tag, sessionSize, cards));
    setRevealed(false);
  }

  const reviewedCount = new Set(session.ids).size;

  if (!session.currentId) {
    return (
      <Screen edges={["top", "bottom"]} contentStyle={styles.doneScreen}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={leaveStudy} style={styles.close}>
          <Ionicons name="close" size={26} color={colors.ink} />
        </Pressable>
        <View style={styles.doneBody}>
          <Text style={styles.doneTitle}>{session.ids.length === 0 ? "Nothing due" : "Nice work"}</Text>
          <Text style={styles.doneCopy}>
            {session.ids.length === 0
              ? "This set has no words to review right now."
              : `You reviewed ${reviewedCount} ${reviewedCount === 1 ? "word" : "words"}.`}
          </Text>
          <Pressable accessibilityRole="button" onPress={leaveStudy} style={styles.primary}>
            <Text style={styles.primaryLabel}>Back to study</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const card = cards.find((item) => item.id === session.currentId);
  if (!card) {
    return (
      <Screen edges={["top", "bottom"]}>
        <View />
      </Screen>
    );
  }

  const currentCard = card;
  const total = session.ids.length;
  const position = session.passedIds.length;
  const progress = position / total;
  const side = sideFor(currentCard, session.completed, studyMode);

  function rate(rating: Rating) {
    const now = Date.now();
    const next = applyRating(currentCard, rating, now);
    rateCard(currentCard.id, rating);
    setRevealed(false);
    setSession((current) => {
      const advanced = advanceSession(current, currentCard.id, next.state === "learning" ? next.dueAt : null, now);
      const scheduledForLater = next.dueAt - now >= 24 * 60 * 60 * 1000;
      if (!scheduledForLater || advanced.passedIds.includes(currentCard.id)) return advanced;
      return { ...advanced, passedIds: [...advanced.passedIds, currentCard.id] };
    });
  }

  return (
    <Screen edges={["top", "bottom"]} contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={leaveStudy} hitSlop={8}>
          <Ionicons name="close" size={26} color={colors.ink} />
        </Pressable>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.count}>
          {position} / {total}
        </Text>
      </View>

      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.cardContent} showsVerticalScrollIndicator={false}>
          <StudyFace key={`${session.currentId}-${session.completed}`} card={currentCard} tags={tags} side={side} revealed={revealed} />
        </ScrollView>
      </View>

      {revealed ? (
        <View>
          <Text style={styles.question}>How well did you remember it?</Text>
          <View style={styles.ratings}>
            {RATINGS.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => rate(item.id)}
                style={({ pressed }) => [styles.rating, { backgroundColor: ratingColor(colors, item.id).bg }, pressed && styles.pressed]}
              >
                <Text style={[styles.ratingLabel, { color: ratingColor(colors, item.id).text }]}>{item.label}</Text>
                <Text style={[styles.ratingHint, { color: ratingColor(colors, item.id).text }]}>
                  {previewInterval(currentCard, item.id)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setRevealed(true)} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryLabel}>{side === "word" ? "Show translation" : "Show word"}</Text>
        </Pressable>
      )}
    </Screen>
  );
}

function StudyFace({ card, tags, side, revealed }: { card: Card; tags: Tag[]; side: Side; revealed: boolean }) {
  const { colors, scheme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const cardTags = tags.filter((tag) => card.tagIds.includes(tag.id));

  return (
    <View style={styles.face}>
      {side === "word" ? (
        <>
          {revealed ? null : <Text style={styles.eyebrow}>Word</Text>}
          <Text style={styles.word}>{card.word}</Text>
          <PronunciationSpoiler key={`${card.id}-${side}`} value={card.pronunciation} revealed={revealed} />
          {revealed ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.eyebrow}>Translation</Text>
              <Text style={styles.answer}>{card.translation}</Text>
            </>
          ) : null}
        </>
      ) : revealed ? (
        <>
          <Text style={styles.prompt}>{card.translation}</Text>
          <View style={styles.divider} />
          <Text style={styles.eyebrow}>Word</Text>
          <Text style={styles.answer}>{card.word}</Text>
          <PronunciationSpoiler key={`${card.id}-${side}`} value={card.pronunciation} revealed={revealed} />
        </>
      ) : (
        <>
          <Text style={styles.eyebrow}>Translation</Text>
          <Text style={styles.word}>{card.translation}</Text>
        </>
      )}
      {cardTags.length === 0 ? null : revealed ? (
        <View style={styles.pills}>
          {cardTags.map((tag) => (
            <TagPill key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </View>
      ) : (
        <View style={styles.dots} accessibilityLabel={`${cardTags.length} ${cardTags.length === 1 ? "tag" : "tags"}`}>
          {cardTags.map((tag) => (
            <View
              key={tag.id}
              style={[styles.dot, { backgroundColor: tagAppearance(tag.color, scheme, colors.surface).color }]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function PronunciationSpoiler({ value, revealed }: { value: string; revealed: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const targetRef = useRef<ComponentRef<typeof View>>(null);
  const [shown, setShown] = useState(false);
  const text = value.trim();
  if (!text) return null;
  const visible = shown || revealed;

  if (visible) {
    return (
      <View style={styles.spoiler}>
        <View style={styles.spoilerTarget}>
          <Text style={styles.spoilerText}>{text}</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Show pronunciation" onPress={() => setShown(true)} style={styles.spoiler}>
      <BlurTargetView ref={targetRef} collapsable={false} style={styles.spoilerTarget}>
        <Text style={styles.spoilerText} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {text}
        </Text>
      </BlurTargetView>
      <BlurView
        blurTarget={targetRef}
        intensity={70}
        blurMethod="dimezisBlurView"
        pointerEvents="none"
        style={styles.spoilerBlur}
      />
    </Pressable>
  );
}

function leaveStudy() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

function startSession(tag: string, size: SessionSize, cards: Card[]): StudySession {
  const ids = limitSessionIds(shuffle(dueCards(cards, tag).map((card) => card.id)), size);
  return {
    tag,
    size,
    ids,
    cursor: ids.length > 0 ? 1 : 0,
    waiting: [],
    currentId: ids[0] ?? null,
    completed: 0,
    passedIds: [],
  };
}

function soonest(waiting: WaitingCard[]) {
  return waiting.reduce((best, item) => (item.dueAt < best.dueAt ? item : best));
}

function pickStudyCard(cursor: number, ids: string[], waiting: WaitingCard[], now: number) {
  const due = waiting.filter((item) => item.dueAt <= now);
  if (due.length > 0) return { id: soonest(due).id, fromWaiting: true };
  if (cursor < ids.length) return { id: ids[cursor], fromWaiting: false };
  if (waiting.length > 0) return { id: soonest(waiting).id, fromWaiting: true };
  return null;
}

function advanceSession(session: StudySession, cardId: string, dueAt: number | null, now: number): StudySession {
  const waiting = session.waiting.filter((item) => item.id !== cardId);
  if (dueAt !== null) waiting.push({ id: cardId, dueAt });
  const picked = pickStudyCard(session.cursor, session.ids, waiting, now);
  if (!picked) {
    return { ...session, waiting, currentId: null, completed: session.completed + 1 };
  }
  if (picked.fromWaiting) {
    return {
      ...session,
      waiting: waiting.filter((item) => item.id !== picked.id),
      currentId: picked.id,
      completed: session.completed + 1,
    };
  }
  return {
    ...session,
    waiting,
    currentId: picked.id,
    cursor: session.cursor + 1,
    completed: session.completed + 1,
  };
}

function sideFor(card: Card, appearance: number, mode: StudyMode): Side {
  if (mode === "word") return "word";
  if (mode === "translation") return "translation";
  if (card.state !== "review") return "word";
  let hash = appearance + 1;
  for (let index = 0; index < card.id.length; index += 1) {
    hash = (hash * 33 + card.id.charCodeAt(index)) >>> 0;
  }
  return hash % 2 === 0 ? "word" : "translation";
}

function shuffle(ids: string[]) {
  const next = [...ids];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swap];
    next[swap] = current;
  }
  return next;
}

function ratingColor(colors: Palette, rating: Rating) {
  switch (rating) {
    case "again":
      return { text: colors.again, bg: colors.againBg };
    case "hard":
      return { text: colors.hard, bg: colors.hardBg };
    case "good":
      return { text: colors.good, bg: colors.goodBg };
    case "easy":
      return { text: colors.easy, bg: colors.easyBg };
  }
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: {
    paddingTop: 8,
    paddingBottom: 12,
    gap: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.track,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.indigoFill,
  },
  count: {
    minWidth: 52,
    textAlign: "right",
    color: colors.muted,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 28,
    overflow: "hidden",
  },
  cardContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  face: {
    alignItems: "center",
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  word: {
    color: colors.ink,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "700",
    textAlign: "center",
  },
  prompt: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600",
    textAlign: "center",
  },
  answer: {
    color: colors.indigo,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    textAlign: "center",
  },
  divider: {
    width: 36,
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 18,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  spoiler: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
  },
  spoilerTarget: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  spoilerText: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    fontStyle: "italic",
    textAlign: "center",
  },
  spoilerBlur: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  question: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 14,
    marginBottom: 10,
  },
  ratings: {
    flexDirection: "row",
    gap: 8,
  },
  rating: {
    flex: 1,
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  ratingHint: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  primary: {
    backgroundColor: colors.indigoFill,
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 16,
  },
  primaryLabel: {
    color: colors.onIndigo,
    fontSize: 17,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.86,
  },
  close: {
    alignSelf: "flex-start",
  },
  doneScreen: {
    paddingTop: 8,
  },
  doneBody: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },
  doneTitle: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "700",
  },
  doneCopy: {
    color: colors.muted,
    fontSize: 16,
    marginBottom: 12,
  },
});
