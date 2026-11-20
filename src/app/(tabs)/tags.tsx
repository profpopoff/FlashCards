import { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { useTheme, useThemedStyles } from "@/components/theme-provider";
import { Palette, tagAppearance } from "@/constants/theme";
import { wordCountLabel } from "@/data/schedule";
import { useLibrary } from "@/data/store";
import { Tag } from "@/data/types";

export default function TagsScreen() {
  const { colors, scheme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { tags, cards, addTag, renameTag, deleteTag } = useLibrary();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Tag | null>(null);
  const [draft, setDraft] = useState("");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const card of cards) {
      for (const tagId of card.tagIds) {
        map.set(tagId, (map.get(tagId) ?? 0) + 1);
      }
    }
    return map;
  }, [cards]);

  function commit() {
    if (!addTag(name)) return;
    setName("");
  }

  function openEditor(tag: Tag) {
    setEditing(tag);
    setDraft(tag.name);
  }

  function saveRename() {
    if (!editing) return;
    renameTag(editing.id, draft);
    setEditing(null);
  }

  function confirmDelete(tag: Tag) {
    const count = counts.get(tag.id) ?? 0;
    Alert.alert(
      "Delete tag",
      count > 0
        ? `Remove “${tag.name}”? It will be unlinked from ${wordCountLabel(count)}.`
        : `Remove “${tag.name}”?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTag(tag.id);
            if (editing?.id === tag.id) setEditing(null);
          },
        },
      ],
    );
  }

  return (
    <Screen scroll contentStyle={styles.scroll}>
      <Text style={styles.title}>Tags</Text>
      <Text style={styles.subtitle}>Group words to study them together.</Text>

      <View style={styles.createRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="New tag name"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="words"
          onSubmitEditing={commit}
          style={[styles.input, styles.createInput]}
          accessibilityLabel="New tag name"
        />
        <Pressable
          accessibilityRole="button"
          disabled={name.trim().length === 0}
          onPress={commit}
          style={({ pressed }) => [
            styles.add,
            name.trim().length === 0 && styles.addDisabled,
            pressed && name.trim().length > 0 && styles.pressed,
          ]}
        >
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>
      </View>

      {tags.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.empty}>No tags yet. Create one to organize your words.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {tags.map((tag, index) => (
            <Pressable
              key={tag.id}
              accessibilityRole="button"
              accessibilityLabel={tag.name}
              accessibilityHint="Opens rename and delete"
              onLongPress={() => openEditor(tag)}
              style={[styles.row, index < tags.length - 1 && styles.rowBorder]}
            >
              <View style={[styles.dot, { backgroundColor: tagAppearance(tag.color, scheme, colors.surface).color }]} />
              <Text style={styles.name}>{tag.name}</Text>
              <Text style={styles.count}>{wordCountLabel(counts.get(tag.id) ?? 0)}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Modal visible={editing !== null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView style={styles.backdrop} behavior="padding" keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}>
          <Pressable style={styles.backdropFill} onPress={() => setEditing(null)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Rename tag</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              autoCapitalize="words"
              onSubmitEditing={saveRename}
              style={styles.sheetInput}
              accessibilityLabel="Tag name"
            />
            <Pressable accessibilityRole="button" onPress={saveRename} style={styles.save}>
              <Text style={styles.saveLabel}>Save</Text>
            </Pressable>
            {editing ? (
              <Pressable accessibilityRole="button" onPress={() => confirmDelete(editing)} style={styles.delete}>
                <Text style={styles.deleteLabel}>Delete tag</Text>
              </Pressable>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  scroll: {
    paddingTop: 12,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 16,
  },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  createInput: {
    flex: 1,
  },
  sheetInput: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    color: colors.ink,
    fontSize: 17,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  add: {
    backgroundColor: colors.indigoFill,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  addDisabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
  addLabel: {
    color: colors.onIndigo,
    fontSize: 16,
    fontWeight: "700",
  },
  list: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: "hidden",
  },
  emptyCard: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  empty: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    flex: 1,
    color: colors.ink,
    fontSize: 17,
    fontWeight: "600",
  },
  count: {
    color: colors.muted,
    fontSize: 15,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: "center",
    padding: 24,
  },
  backdropFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700",
  },
  save: {
    backgroundColor: colors.indigoFill,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
  },
  saveLabel: {
    color: colors.onIndigo,
    fontSize: 16,
    fontWeight: "700",
  },
  delete: {
    alignItems: "center",
    paddingVertical: 8,
  },
  deleteLabel: {
    color: colors.again,
    fontSize: 16,
    fontWeight: "700",
  },
});
