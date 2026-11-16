import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";

import { FilterChip } from "@/components/filter-chip";
import { Screen } from "@/components/screen";
import { Pronunciation, TagPill } from "@/components/tag-pill";
import { colors } from "@/constants/theme";
import { Card, Tag } from "@/data/types";
import { useLibrary } from "@/data/store";

export default function WordsScreen() {
  const { cards, tags } = useLibrary();
  const [query, setQuery] = useState("");
  const [tagId, setTagId] = useState("all");
  const selected = tags.some((tag) => tag.id === tagId) ? tagId : "all";
  const tagsById = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return cards.filter((card) => {
      if (selected !== "all" && !card.tagIds.includes(selected)) return false;
      if (!needle) return true;
      return card.word.toLowerCase().includes(needle) || card.translation.toLowerCase().includes(needle);
    });
  }, [cards, query, selected]);

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Words</Text>
        <Text style={styles.total}>{cards.length} total</Text>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.placeholder} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search word or translation"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
          accessibilityLabel="Search word or translation"
        />
      </View>

      <View style={styles.filters}>
        <FilterChip label="All" selected={selected === "all"} bordered onPress={() => setTagId("all")} />
        {tags.map((tag) => (
          <FilterChip key={tag.id} label={tag.name} selected={selected === tag.id} bordered onPress={() => setTagId(tag.id)} />
        ))}
      </View>

      <View style={styles.table}>
        <View style={styles.tableHead}>
          <Text style={[styles.columnLabel, styles.wordCol]}>Word</Text>
          <Text style={[styles.columnLabel, styles.translationCol]}>Translation</Text>
          <Text style={[styles.columnLabel, styles.tagCol]}>Tags</Text>
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={filtered.length === 0 ? styles.emptyList : undefined}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <WordRow card={item} tagsById={tagsById} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<Text style={styles.empty}>No words match.</Text>}
        />
      </View>
    </Screen>
  );
}

function WordRow({ card, tagsById }: { card: Card; tagsById: Map<string, Tag> }) {
  const rowTags = card.tagIds.map((id) => tagsById.get(id)).filter((tag): tag is Tag => Boolean(tag));

  return (
    <View style={styles.row}>
      <View style={styles.wordCol}>
        <Text style={styles.word}>{card.word}</Text>
        <Pronunciation value={card.pronunciation} />
      </View>
      <Text style={[styles.translation, styles.translationCol]}>{card.translation}</Text>
      <View style={[styles.tagCol, styles.tagList]}>
        {rowTags.map((tag) => (
          <TagPill key={tag.id} name={tag.name} color={tag.color} size="sm" />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  total: {
    marginBottom: 6,
    color: colors.muted,
    fontSize: 15,
  },
  search: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    paddingVertical: 12,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  table: {
    flex: 1,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.tableHead,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  columnLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  list: {
    flex: 1,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  wordCol: {
    flex: 1.15,
  },
  translationCol: {
    flex: 1,
  },
  tagCol: {
    flex: 0.85,
  },
  word: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  translation: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "flex-start",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
    marginLeft: 14,
  },
  empty: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 15,
    padding: 24,
  },
});
