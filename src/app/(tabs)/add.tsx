import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { useTheme, useThemedStyles } from "@/components/theme-provider";
import { Palette } from "@/constants/theme";
import { useLibrary } from "@/data/store";

type Field = "word" | "pronunciation" | "translation" | "tag";

export default function AddWordScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { tags, addCard, addTag } = useLibrary();
  const [word, setWord] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [translation, setTranslation] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [focused, setFocused] = useState<Field | null>(null);
  const [creatingTag, setCreatingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState("");

  const canSave = word.trim().length > 0 && translation.trim().length > 0;

  function resetForm(keepTags: boolean) {
    setWord("");
    setPronunciation("");
    setTranslation("");
    setFocused(null);
    setCreatingTag(false);
    setTagDraft("");
    if (!keepTags) setTagIds([]);
  }

  function save(keepTags: boolean) {
    if (!canSave) return;
    addCard({ word, pronunciation, translation, tagIds });
    resetForm(keepTags);
  }

  function toggleTag(id: string) {
    setTagIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function commitTag() {
    const id = addTag(tagDraft);
    if (!id) return;
    setTagIds((current) => (current.includes(id) ? current : [...current, id]));
    setTagDraft("");
    setCreatingTag(false);
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>New word</Text>
            <Pressable accessibilityRole="button" onPress={() => resetForm(false)} hitSlop={8}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </View>

          <FieldLabel label="Word" />
          <TextInput
            value={word}
            onChangeText={setWord}
            onFocus={() => setFocused("word")}
            onBlur={() => setFocused(null)}
            placeholder="serendipity"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, focused === "word" && styles.inputFocused]}
          />

          <FieldLabel label="Pronunciation" />
          <TextInput
            value={pronunciation}
            onChangeText={setPronunciation}
            onFocus={() => setFocused("pronunciation")}
            onBlur={() => setFocused(null)}
            placeholder="/ˌserənˈdɪpəti/"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, focused === "pronunciation" && styles.inputFocused]}
          />

          <FieldLabel label="Translation" />
          <TextInput
            value={translation}
            onChangeText={setTranslation}
            onFocus={() => setFocused("translation")}
            onBlur={() => setFocused(null)}
            placeholder="Type the translation"
            placeholderTextColor={colors.placeholder}
            style={[styles.input, focused === "translation" && styles.inputFocused]}
          />

          <FieldLabel label="Tags" />
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
                  {selected ? <Ionicons name="checkmark" size={14} color={colors.onIndigo} /> : null}
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

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            disabled={!canSave}
            onPress={() => save(false)}
            style={({ pressed }) => [styles.save, !canSave && styles.saveDisabled, pressed && canSave && styles.pressed]}
          >
            <Text style={styles.saveLabel}>Save word</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={!canSave} onPress={() => save(true)} style={styles.another}>
            <Text style={[styles.anotherLabel, !canSave && styles.anotherDisabled]}>Save and add another</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function FieldLabel({ label }: { label: string }) {
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  cancel: {
    marginBottom: 8,
    color: colors.indigo,
    fontSize: 16,
    fontWeight: "600",
  },
  fieldLabel: {
    marginTop: 16,
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
    backgroundColor: colors.indigoFill,
  },
  tagLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  tagLabelSelected: {
    color: colors.onIndigo,
  },
  newTag: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.dashed,
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
    marginTop: 0,
  },
  newTagAdd: {
    backgroundColor: colors.indigoFill,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  newTagAddLabel: {
    color: colors.onIndigo,
    fontSize: 15,
    fontWeight: "700",
  },
  footer: {
    paddingBottom: 8,
    gap: 4,
  },
  save: {
    backgroundColor: colors.indigoFill,
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
    color: colors.onIndigo,
    fontSize: 17,
    fontWeight: "700",
  },
  another: {
    alignItems: "center",
    paddingVertical: 12,
  },
  anotherLabel: {
    color: colors.indigo,
    fontSize: 16,
    fontWeight: "700",
  },
  anotherDisabled: {
    opacity: 0.4,
  },
});
