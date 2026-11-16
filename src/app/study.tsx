import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { Pronunciation, TagPill } from "@/components/tag-pill";
import { colors } from "@/constants/theme";
import { dueCards, previewInterval, RATINGS } from "@/data/schedule";
import { useLibrary } from "@/data/store";
import { Card, Rating, Tag } from "@/data/types";

type Side = "word" | "translation";

export default function StudyScreen() {
  const params = useLocalSearchParams<{ tag?: string }>();
  const tag = typeof params.tag === "string" ? params.tag : "all";
  const { cards, tags, rateCard } = useLibrary();
  const [session, setSession] = useState(() => ({
    tag,
    ids: dueCards(cards, tag).map((card) => card.id),
  }));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [side, setSide] = useState<Side>("word");

  if (session.tag !== tag) {
    setSession({ tag, ids: dueCards(cards, tag).map((card) => card.id) });
    setIndex(0);
    setRevealed(false);
  }

  const queue = session.ids;

  if (queue.length === 0 || index >= queue.length) {
    return (
      <Screen edges={["top", "bottom"]} contentStyle={styles.doneScreen}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.close}>
          <Ionicons name="close" size={26} color={colors.ink} />
        </Pressable>
        <View style={styles.doneBody}>
          <Text style={styles.doneTitle}>{queue.length === 0 ? "Nothing due" : "Nice work"}</Text>
          <Text style={styles.doneCopy}>
            {queue.length === 0
              ? "This set has no words to review right now."
              : `You reviewed ${queue.length} ${queue.length === 1 ? "word" : "words"}.`}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.primary}>
            <Text style={styles.primaryLabel}>Back to study</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const card = cards.find((item) => item.id === queue[index]);
  if (!card) {
    return (
      <Screen edges={["top", "bottom"]}>
        <View />
      </Screen>
    );
  }

  const currentCard = card;
  const progress = (index + 1) / queue.length;

  function chooseSide(next: Side) {
    setSide(next);
    setRevealed(false);
  }

  function rate(rating: Rating) {
    rateCard(currentCard.id, rating);
    setRevealed(false);
    setIndex((current) => current + 1);
  }

  return (
    <Screen edges={["top", "bottom"]} contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={26} color={colors.ink} />
        </Pressable>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.count}>
          {index + 1} / {queue.length}
        </Text>
      </View>

      <View style={styles.segment}>
        <SegmentButton label="Word first" selected={side === "word"} onPress={() => chooseSide("word")} />
        <SegmentButton label="Translation first" selected={side === "translation"} onPress={() => chooseSide("translation")} />
      </View>

      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.cardContent} showsVerticalScrollIndicator={false}>
          <StudyFace card={currentCard} tags={tags} side={side} revealed={revealed} />
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
                style={({ pressed }) => [styles.rating, { backgroundColor: ratingColor(item.id).bg }, pressed && styles.pressed]}
              >
                <Text style={[styles.ratingLabel, { color: ratingColor(item.id).text }]}>{item.label}</Text>
                <Text style={[styles.ratingHint, { color: ratingColor(item.id).text }]}>
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

function SegmentButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.segmentItem, selected && styles.segmentItemOn]}>
      <Text style={[styles.segmentLabel, selected && styles.segmentLabelOn]}>{label}</Text>
    </Pressable>
  );
}

function StudyFace({ card, tags, side, revealed }: { card: Card; tags: Tag[]; side: Side; revealed: boolean }) {
  const cardTags = tags.filter((tag) => card.tagIds.includes(tag.id));

  return (
    <View style={styles.face}>
      {side === "word" ? (
        <>
          {revealed ? null : <Text style={styles.eyebrow}>Word</Text>}
          <Text style={styles.word}>{card.word}</Text>
          <Pronunciation value={card.pronunciation} centered />
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
          <Pronunciation value={card.pronunciation} centered />
        </>
      ) : (
        <>
          <Text style={styles.eyebrow}>Translation</Text>
          <Text style={styles.word}>{card.translation}</Text>
        </>
      )}
      <View style={styles.pills}>
        {cardTags.map((tag) => (
          <TagPill key={tag.id} name={tag.name} color={tag.color} />
        ))}
      </View>
    </View>
  );
}

function ratingColor(rating: Rating) {
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

const styles = StyleSheet.create({
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
    backgroundColor: colors.indigo,
  },
  count: {
    minWidth: 52,
    textAlign: "right",
    color: colors.muted,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.segment,
    borderRadius: 14,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    borderRadius: 11,
    paddingVertical: 10,
  },
  segmentItemOn: {
    backgroundColor: colors.surface,
  },
  segmentLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  segmentLabelOn: {
    color: colors.ink,
    fontWeight: "700",
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
    backgroundColor: colors.indigo,
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 16,
  },
  primaryLabel: {
    color: "#FFFFFF",
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
