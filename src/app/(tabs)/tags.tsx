import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { colors } from "@/constants/theme";
import { wordCountLabel } from "@/data/schedule";
import { useLibrary } from "@/data/store";
import { Tag } from "@/data/types";

export default function TagsScreen() {
  const { tags, cards, addTag, renameTag } = useLibrary();
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
          style={styles.input}
          accessibilityLabel="New tag name"
        />
        <Pressable
          accessibilityRole="button"
          disabled={name.trim().length === 0}
          onPress={commit}
          style={({ pressed }) => [styles.add, name.trim().length === 0 && styles.addDisabled, pressed && name.trim().length > 0 && styles.pressed]}
        >
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {tags.map((tag, index) => (
          <View key={tag.id} style={[styles.row, index < tags.length - 1 && styles.rowBorder]}>
            <View style={[styles.dot, { backgroundColor: tag.color }]} />
            <Text style={styles.name}>{tag.name}</Text>
            <Text style={styles.count}>{wordCountLabel(counts.get(tag.id) ?? 0)}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Rename ${tag.name}`} onPress={() => openEditor(tag)} hitSlop={8}>
              <Ionicons name="pencil" size={18} color="#B0ACA4" />
            </Pressable>
          </View>
        ))}
      </View>

      <Modal visible={editing !== null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <Pressable style={styles.backdrop} onPress={() => setEditing(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Rename tag</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              autoCapitalize="words"
              onSubmitEditing={saveRename}
              style={styles.input}
              accessibilityLabel="Tag name"
            />
            <Pressable accessibilityRole="button" onPress={saveRename} style={styles.save}>
              <Text style={styles.saveLabel}>Save</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  add: {
    backgroundColor: colors.indigo,
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
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  list: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: "hidden",
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
    backgroundColor: "rgba(28,28,30,0.35)",
    justifyContent: "center",
    padding: 24,
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
    backgroundColor: colors.indigo,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
  },
  saveLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
