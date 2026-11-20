import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FilterChip } from "@/components/filter-chip";
import { Screen } from "@/components/screen";
import { useSessionSettings } from "@/components/session-settings";
import { useThemedStyles } from "@/components/theme-provider";
import { formatStudyDate, Palette } from "@/constants/theme";
import { countByState, dueCards, estimateMinutes } from "@/data/schedule";
import { sessionCountFor } from "@/data/session-size";
import { useLibrary } from "@/data/store";

export default function StudyHomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const { cards, tags } = useLibrary();
  const { sessionSize } = useSessionSettings();
  const [selectedTag, setSelectedTag] = useState("all");
  const selected = tags.some((tag) => tag.id === selectedTag) ? selectedTag : "all";
  const queue = useMemo(() => dueCards(cards, selected), [cards, selected]);
  const counts = countByState(queue);
  const sessionCount = sessionCountFor(counts.total, sessionSize);
  const minutes = estimateMinutes(sessionCount);
  const isEmptyLibrary = cards.length === 0;
  const isCapped = sessionSize !== null && counts.total > sessionSize;

  const chips = tags
    .map((tag) => ({ tag, count: dueCards(cards, tag.id).length }))
    .filter((item) => item.count > 0 || item.tag.id === selected);

  return (
    <Screen scroll contentStyle={styles.scroll}>
      <Text style={styles.date}>{formatStudyDate()}</Text>
      <Text style={styles.title}>{isEmptyLibrary ? "Start your deck" : "Ready to study?"}</Text>

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>{isEmptyLibrary ? "Your library" : "Due today"}</Text>
            <Text style={styles.heroCount}>{counts.total}</Text>
          </View>
          <View style={styles.heroMetaBlock}>
            {isEmptyLibrary ? (
              <Text style={styles.heroMeta}>Add words to begin</Text>
            ) : counts.total === 0 ? (
              <Text style={styles.heroMeta}>All caught up</Text>
            ) : isCapped ? (
              <>
                <Text style={styles.heroMeta}>studying {sessionCount} of {counts.total}</Text>
                <Text style={styles.heroMeta}>about {minutes} min</Text>
              </>
            ) : (
              <Text style={styles.heroMeta}>words · about {minutes} min</Text>
            )}
          </View>
        </View>
        {isEmptyLibrary ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/words", params: { compose: "1" } })}
            style={({ pressed }) => [styles.start, pressed && styles.startPressed]}
          >
            <Text style={styles.startLabel}>Add your first word</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={counts.total === 0}
            onPress={() => router.push({ pathname: "/study", params: { tag: selected } })}
            style={({ pressed }) => [
              styles.start,
              counts.total === 0 && styles.startDisabled,
              pressed && counts.total > 0 && styles.startPressed,
            ]}
          >
            <Text style={[styles.startLabel, counts.total === 0 && styles.startLabelDisabled]}>Start studying</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.stats}>
        <Stat value={counts.new} label="New" />
        <Stat value={counts.learning} label="Learning" />
        <Stat value={counts.review} label="Review" />
      </View>

      <Text style={styles.section}>Study by tag</Text>
      {isEmptyLibrary ? (
        <Text style={styles.emptyHint}>Tags you create will show up here for focused study sessions.</Text>
      ) : (
        <View style={styles.chips}>
          <FilterChip
            label={`All · ${dueCards(cards).length}`}
            selected={selected === "all"}
            tone="indigo"
            onPress={() => setSelectedTag("all")}
          />
          {chips.map(({ tag, count }) => (
            <FilterChip
              key={tag.id}
              label={`${tag.name} · ${count}`}
              selected={selected === tag.id}
              tone="indigo"
              onPress={() => setSelectedTag(tag.id)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  scroll: {
    paddingTop: 12,
  },
  date: {
    color: colors.muted,
    fontSize: 16,
  },
  title: {
    marginTop: 6,
    color: colors.ink,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  hero: {
    marginTop: 22,
    borderRadius: 28,
    backgroundColor: colors.indigoFill,
    padding: 20,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 16,
    fontWeight: "600",
  },
  heroCount: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 64,
    lineHeight: 68,
    fontWeight: "700",
    letterSpacing: -1.5,
  },
  heroMetaBlock: {
    flexShrink: 1,
    marginBottom: 12,
    alignItems: "flex-end",
    gap: 2,
  },
  heroMeta: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    textAlign: "right",
  },
  start: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: colors.heroButton,
    alignItems: "center",
    paddingVertical: 16,
  },
  startPressed: {
    opacity: 0.86,
  },
  startDisabled: {
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  startLabel: {
    color: colors.indigoFill,
    fontSize: 17,
    fontWeight: "700",
  },
  startLabelDisabled: {
    color: "rgba(79,61,255,0.55)",
  },
  stats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  statValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "700",
  },
  statLabel: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 14,
  },
  section: {
    marginTop: 26,
    marginBottom: 12,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  emptyHint: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
