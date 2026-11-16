import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { FilterChip } from "@/components/filter-chip";
import { Screen } from "@/components/screen";
import { Pronunciation, TagPill } from "@/components/tag-pill";
import { colors } from "@/constants/theme";
import { Card, Tag } from "@/data/types";
import { useLibrary } from "@/data/store";

type Field = "word" | "pronunciation" | "translation" | "tag";

export default function WordsScreen() {
  const { cards, tags, updateCard, deleteCard, addTag } = useLibrary();
  const [query, setQuery] = useState("");
  const [tagId, setTagId] = useState("all");
  const [editing, setEditing] = useState<Card | null>(null);
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
      <View style={styles.top}>
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

        {tags.length > 0 ? (
          <View style={styles.filters}>
            <FilterChip label="All" selected={selected === "all"} bordered onPress={() => setTagId("all")} />
            {tags.map((tag) => (
              <FilterChip key={tag.id} label={tag.name} selected={selected === tag.id} bordered onPress={() => setTagId(tag.id)} />
            ))}
          </View>
        ) : null}
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
          renderItem={({ item }) => (
            <WordRow card={item} tagsById={tagsById} onLongPress={() => setEditing(item)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyBlock}>
              <Text style={styles.empty}>{cards.length === 0 ? "No words yet." : "No words match."}</Text>
              {cards.length === 0 ? (
                <Pressable accessibilityRole="button" onPress={() => router.push("/add")} style={styles.emptyAction}>
                  <Text style={styles.emptyActionLabel}>Add a word</Text>
                </Pressable>
              ) : null}
            </View>
          }
        />
      </View>

      <EditWordModal
        card={editing}
        tags={tags}
        onClose={() => setEditing(null)}
        onSave={(input) => {
          if (!editing) return;
          updateCard(editing.id, input);
          setEditing(null);
        }}
        onDelete={() => {
          if (!editing) return;
          const id = editing.id;
          const label = editing.word;
          setEditing(null);
          Alert.alert("Delete word", `Remove “${label}” from your library?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteCard(id) },
          ]);
        }}
        onAddTag={addTag}
      />
    </Screen>
  );
}

function WordRow({
  card,
  tagsById,
  onLongPress,
}: {
  card: Card;
  tagsById: Map<string, Tag>;
  onLongPress: () => void;
}) {
  const rowTags = card.tagIds.map((id) => tagsById.get(id)).filter((tag): tag is Tag => Boolean(tag));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Long press to edit"
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
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
    </Pressable>
  );
}

function EditWordModal({
  card,
  tags,
  onClose,
  onSave,
  onDelete,
  onAddTag,
}: {
  card: Card | null;
  tags: Tag[];
  onClose: () => void;
  onSave: (input: { word: string; pronunciation: string; translation: string; tagIds: string[] }) => void;
  onDelete: () => void;
  onAddTag: (name: string) => string | null;
}) {
  const [word, setWord] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [translation, setTranslation] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [focused, setFocused] = useState<Field | null>(null);
  const [creatingTag, setCreatingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState("");

  useEffect(() => {
    if (!card) return;
    setWord(card.word);
    setPronunciation(card.pronunciation);
    setTranslation(card.translation);
    setTagIds(card.tagIds);
    setFocused(null);
    setCreatingTag(false);
    setTagDraft("");
  }, [card]);

  const canSave = word.trim().length > 0 && translation.trim().length > 0;

  function toggleTag(id: string) {
    setTagIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function commitTag() {
    const id = onAddTag(tagDraft);
    if (!id) return;
    setTagIds((current) => (current.includes(id) ? current : [...current, id]));
    setTagDraft("");
    setCreatingTag(false);
  }

  return (
    <Modal visible={card !== null} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Edit word</Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Word</Text>
            <TextInput
              value={word}
              onChangeText={setWord}
              onFocus={() => setFocused("word")}
              onBlur={() => setFocused(null)}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, focused === "word" && styles.inputFocused]}
            />

            <Text style={styles.fieldLabel}>Pronunciation</Text>
            <TextInput
              value={pronunciation}
              onChangeText={setPronunciation}
              onFocus={() => setFocused("pronunciation")}
              onBlur={() => setFocused(null)}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, focused === "pronunciation" && styles.inputFocused]}
            />

            <Text style={styles.fieldLabel}>Translation</Text>
            <TextInput
              value={translation}
              onChangeText={setTranslation}
              onFocus={() => setFocused("translation")}
              onBlur={() => setFocused(null)}
              style={[styles.input, focused === "translation" && styles.inputFocused]}
            />

            <Text style={styles.fieldLabel}>Tags</Text>
            <View style={styles.tags}>
              {tags.map((tag) => {
                const selected = tagIds.includes(tag.id);
                return (
                  <Pressable
                    key={tag.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => toggleTag(tag.id)}
                    style={[styles.tag, selected ? styles.tagSelected : styles.tagIdle]}
                  >
                    {selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                    <Text style={[styles.tagLabel, selected && styles.tagLabelSelected]}>{tag.name}</Text>
                  </Pressable>
                );
              })}
            </View>

            {creatingTag ? (
              <View style={styles.newTagRow}>
                <TextInput
                  value={tagDraft}
                  onChangeText={setTagDraft}
                  onFocus={() => setFocused("tag")}
                  onBlur={() => setFocused(null)}
                  placeholder="Tag name"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="words"
                  onSubmitEditing={commitTag}
                  style={[styles.input, styles.newTagInput, focused === "tag" && styles.inputFocused]}
                />
                <Pressable accessibilityRole="button" onPress={commitTag} style={styles.newTagAdd}>
                  <Text style={styles.newTagAddLabel}>Add</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setCreatingTag(true)} style={styles.newTag}>
                <Text style={styles.newTagLabel}>+ New tag</Text>
              </Pressable>
            )}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            disabled={!canSave}
            onPress={() => onSave({ word, pronunciation, translation, tagIds })}
            style={({ pressed }) => [styles.save, !canSave && styles.saveDisabled, pressed && canSave && styles.pressed]}
          >
            <Text style={styles.saveLabel}>Save changes</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onDelete} style={styles.delete}>
            <Text style={styles.deleteLabel}>Delete word</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 12,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  top: {
    paddingHorizontal: 20,
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
  },
  tableHead: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.tableHead,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
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
    alignItems: "center",
  },
  rowPressed: {
    backgroundColor: colors.tableHead,
  },
  wordCol: {
    flex: 1.15,
  },
  translationCol: {
    flex: 1,
  },
  tagCol: {
    flex: 0.9,
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
  emptyBlock: {
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  empty: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 15,
  },
  emptyAction: {
    backgroundColor: colors.indigo,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyActionLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(28,28,30,0.35)",
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    maxHeight: "88%",
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "700",
  },
  cancel: {
    marginBottom: 4,
    color: colors.indigo,
    fontSize: 16,
    fontWeight: "600",
  },
  fieldLabel: {
    marginTop: 12,
    marginBottom: 8,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputFocused: {
    borderColor: colors.indigo,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tagIdle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tagSelected: {
    backgroundColor: colors.indigo,
  },
  tagLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  tagLabelSelected: {
    color: "#FFFFFF",
  },
  newTag: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C8C4BC",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  newTagLabel: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "600",
  },
  newTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  newTagInput: {
    flex: 1,
  },
  newTagAdd: {
    backgroundColor: colors.indigo,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  newTagAddLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  save: {
    marginTop: 12,
    backgroundColor: colors.indigo,
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 16,
  },
  saveDisabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
  saveLabel: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  delete: {
    alignItems: "center",
    paddingVertical: 12,
  },
  deleteLabel: {
    color: colors.again,
    fontSize: 16,
    fontWeight: "700",
  },
});
