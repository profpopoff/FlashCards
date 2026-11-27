import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { Screen } from "@/components/screen";
import { useSessionSettings } from "@/components/session-settings";
import { useStudyReminders } from "@/components/study-reminders";
import { useTheme, useThemedStyles } from "@/components/theme-provider";
import { AppearancePreference, Palette } from "@/constants/theme";
import { ImportPreview, librarySummary } from "@/data/library-io";
import {
  clampSessionSize,
  getLastCustomSessionSize,
  isCustomSessionSize,
  SESSION_SIZE_OPTIONS,
} from "@/data/session-size";
import { useLibrary } from "@/data/store";
import { STUDY_MODE_OPTIONS, studyModeCopy } from "@/data/study-mode";
import { formatReminderTime } from "@/data/study-reminders";
import { exportLibraryFile, isLibraryTransferSupported, pickLibraryImport } from "@/data/transfer";

const OPTIONS: { id: AppearancePreference; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function SettingsScreen() {
  const { preference, setPreference, colors } = useTheme();
  const { tags, cards, replaceLibrary, mergeLibrary } = useLibrary();
  const reminders = useStudyReminders();
  const { sessionSize, setSessionSize, studyMode, setStudyMode, ready: sessionReady } = useSessionSettings();
  const styles = useThemedStyles(makeStyles);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [pickingTime, setPickingTime] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [customFocused, setCustomFocused] = useState(false);
  const transferSupported = isLibraryTransferSupported();
  const customSelected = isCustomSessionSize(sessionSize);
  const reminderDate = useMemo(() => {
    const date = new Date();
    date.setHours(reminders.time.hour, reminders.time.minute, 0, 0);
    return date;
  }, [reminders.time.hour, reminders.time.minute]);

  useEffect(() => {
    if (!sessionReady) return;
    if (isCustomSessionSize(sessionSize)) {
      setCustomDraft(String(sessionSize));
      return;
    }
    let active = true;
    getLastCustomSessionSize().then((value) => {
      if (active) setCustomDraft(String(value));
    });
    return () => {
      active = false;
    };
  }, [sessionReady, sessionSize]);

  async function selectCustom() {
    if (customSelected) return;
    const fromDraft = Number(customDraft);
    const next = clampSessionSize(Number.isFinite(fromDraft) && fromDraft > 0 ? fromDraft : await getLastCustomSessionSize());
    setCustomDraft(String(next));
    await setSessionSize(next);
  }

  function onCustomDraftChange(text: string) {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 3);
    setCustomDraft(cleaned);
    const value = Number(cleaned);
    if (Number.isFinite(value) && value > 0) {
      void setSessionSize(clampSessionSize(value));
    }
  }

  function onCustomBlur() {
    setCustomFocused(false);
    const value = Number(customDraft);
    const fallback = typeof sessionSize === "number" ? sessionSize : 15;
    const next = clampSessionSize(Number.isFinite(value) && value > 0 ? value : fallback);
    setCustomDraft(String(next));
    void setSessionSize(next);
  }

  async function onToggleReminders(next: boolean) {
    if (reminderBusy) return;
    setReminderBusy(true);
    try {
      const enabled = await reminders.setEnabled(next);
      if (next && !enabled) {
        Alert.alert(
          "Notifications disabled",
          "Allow notifications for Flashcards in system settings to get study reminders.",
        );
      }
    } finally {
      setReminderBusy(false);
    }
  }

  function onReminderTimeChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === "android") setPickingTime(false);
    if (event.type === "dismissed" || !date) return;
    void reminders.setTime({ hour: date.getHours(), minute: date.getMinutes() });
  }

  async function onExport() {
    if (busy) return;
    setBusy("export");
    try {
      await exportLibraryFile({ tags, cards });
    } catch (error) {
      Alert.alert("Export failed", error instanceof Error ? error.message : "Could not export the library.");
    } finally {
      setBusy(null);
    }
  }

  async function onImport() {
    if (busy) return;
    setBusy("import");
    try {
      const preview = await pickLibraryImport();
      if (!preview) return;
      askImportMode(preview);
    } catch (error) {
      Alert.alert("Import failed", error instanceof Error ? error.message : "Could not import the library.");
    } finally {
      setBusy(null);
    }
  }

  function askImportMode(preview: ImportPreview) {
    Alert.alert(
      "Import library?",
      `This file has ${librarySummary(preview.library)}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Replace all",
          style: "destructive",
          onPress: () => confirmReplace(preview),
        },
        {
          text: "Merge",
          onPress: () => {
            mergeLibrary(preview.library);
            Alert.alert("Imported", `Merged ${librarySummary(preview.library)}.`);
          },
        },
      ],
      { cancelable: true },
    );
  }

  function confirmReplace(preview: ImportPreview) {
    Alert.alert("Replace library?", "This deletes your current words and tags, then loads the file.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Replace",
        style: "destructive",
        onPress: () => {
          replaceLibrary(preview.library);
          Alert.alert("Imported", `Replaced with ${librarySummary(preview.library)}.`);
        },
      },
    ]);
  }

  return (
    <Screen scroll contentStyle={styles.scroll}>
      <Text style={styles.title}>Settings</Text>

      <Text style={[styles.section, styles.sectionFirst]}>Theme</Text>
      <Text style={styles.sectionCopy}>Appearance follows your phone until you choose.</Text>
      <View accessibilityLabel="Theme" style={styles.segment}>
        {OPTIONS.map((option) => {
          const selected = preference === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setPreference(option.id)}
              style={[styles.option, selected && styles.optionOn]}
            >
              <Text style={[styles.optionLabel, selected && styles.optionLabelOn]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>Study mode</Text>
      <View accessibilityLabel="Study mode" style={styles.segment}>
        {STUDY_MODE_OPTIONS.map((option) => {
          const selected = studyMode === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              disabled={!sessionReady}
              onPress={() => setStudyMode(option.value)}
              style={[styles.option, selected && styles.optionOn]}
            >
              <Text style={[styles.optionLabel, selected && styles.optionLabelOn]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.sectionCopy}>{studyModeCopy(studyMode)}</Text>

      <Text style={styles.section}>Session size</Text>
      <Text style={styles.sectionCopy}>Limit how many due words each session includes.</Text>
      <View accessibilityLabel="Session size" style={styles.segment}>
        {SESSION_SIZE_OPTIONS.map((option) => {
          const selected = sessionSize === option.value;
          return (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              disabled={!sessionReady}
              onPress={() => setSessionSize(option.value)}
              style={[styles.option, selected && styles.optionOn]}
            >
              <Text style={[styles.optionLabel, selected && styles.optionLabelOn]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {customSelected ? (
        <View style={[styles.customRow, customFocused && styles.customRowFocused]}>
          <Text style={styles.customLabel}>Custom</Text>
          <TextInput
            accessibilityLabel="Custom session size"
            value={customDraft}
            onChangeText={onCustomDraftChange}
            onFocus={() => setCustomFocused(true)}
            onBlur={onCustomBlur}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={3}
            selectTextOnFocus
            placeholder="15"
            placeholderTextColor={colors.placeholder}
            style={styles.customInput}
          />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: false }}
          disabled={!sessionReady}
          onPress={selectCustom}
          style={({ pressed }) => [styles.customRow, pressed && styles.pressed]}
        >
          <Text style={styles.customLabel}>Custom</Text>
          <Text style={styles.customHint}>Set your own</Text>
        </Pressable>
      )}

      {reminders.supported ? (
        <>
          <Text style={styles.section}>Study reminders</Text>
          <Text style={styles.sectionCopy}>
            Daily nudge at your chosen time. If nothing is due, it suggests adding new words.
          </Text>
          <View style={styles.reminderRow}>
            <Text style={styles.reminderLabel}>Notifications</Text>
            <Switch
              value={reminders.enabled}
              onValueChange={onToggleReminders}
              disabled={!reminders.ready || reminderBusy}
              trackColor={{ false: colors.track, true: colors.indigoFill }}
              thumbColor={colors.heroButton}
            />
          </View>
          {reminders.enabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reminder time"
              disabled={!reminders.ready}
              onPress={() => setPickingTime(true)}
              style={({ pressed }) => [styles.reminderRow, styles.reminderTimeRow, pressed && styles.pressed]}
            >
              <Text style={styles.reminderLabel}>Reminder time</Text>
              <Text style={styles.reminderTimeValue}>{formatReminderTime(reminders.time)}</Text>
            </Pressable>
          ) : null}
          {pickingTime && Platform.OS === "android" ? (
            <DateTimePicker
              value={reminderDate}
              mode="time"
              display="default"
              onChange={onReminderTimeChange}
            />
          ) : null}
          {Platform.OS === "ios" ? (
            <Modal visible={pickingTime} transparent animationType="fade" onRequestClose={() => setPickingTime(false)}>
              <View style={styles.timeSheetRoot}>
                <Pressable style={styles.timeSheetBackdrop} onPress={() => setPickingTime(false)} />
                <View style={styles.timeSheet}>
                  <View style={styles.timeSheetHeader}>
                    <Text style={styles.timeSheetTitle}>Reminder time</Text>
                    <Pressable accessibilityRole="button" onPress={() => setPickingTime(false)} hitSlop={8}>
                      <Text style={styles.timeSheetDone}>Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={reminderDate}
                    mode="time"
                    display="spinner"
                    onChange={onReminderTimeChange}
                  />
                </View>
              </View>
            </Modal>
          ) : null}
        </>
      ) : null}

      <Text style={styles.section}>Library</Text>
      <Text style={styles.sectionCopy}>{librarySummary({ tags, cards })}</Text>

      {transferSupported ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={busy !== null}
            onPress={onExport}
            style={({ pressed }) => [styles.action, pressed && !busy && styles.pressed, busy && styles.disabled]}
          >
            {busy === "export" ? (
              <ActivityIndicator color={colors.onIndigo} />
            ) : (
              <Text style={styles.actionLabel}>Export library</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy !== null}
            onPress={onImport}
            style={({ pressed }) => [styles.action, styles.actionSecondary, pressed && !busy && styles.pressed, busy && styles.disabled]}
          >
            {busy === "import" ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Text style={styles.actionSecondaryLabel}>Import library</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <Text style={styles.webHint}>
          Export and import are available in the iOS and Android apps
          {Platform.OS === "web" ? ", not in the browser." : "."}
        </Text>
      )}
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    scroll: {
      paddingTop: 12,
      paddingBottom: 28,
    },
    title: {
      color: colors.ink,
      fontSize: 34,
      fontWeight: "700",
      letterSpacing: -0.6,
    },
    segment: {
      flexDirection: "row",
      backgroundColor: colors.segment,
      borderRadius: 14,
      padding: 4,
      marginTop: 14,
    },
    option: {
      flex: 1,
      alignItems: "center",
      borderRadius: 11,
      paddingVertical: 12,
    },
    optionOn: {
      backgroundColor: colors.segmentActive,
    },
    optionLabel: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: "600",
      textAlign: "center",
    },
    optionLabelOn: {
      color: colors.ink,
      fontWeight: "700",
    },
    customRow: {
      marginTop: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderWidth: 1,
      borderColor: colors.line,
    },
    customRowFocused: {
      borderColor: colors.indigoFill,
    },
    customLabel: {
      flex: 1,
      color: colors.ink,
      fontSize: 16,
      fontWeight: "600",
    },
    customHint: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: "600",
    },
    customInput: {
      minWidth: 64,
      textAlign: "center",
      color: colors.ink,
      fontSize: 18,
      fontWeight: "700",
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: colors.segment,
    },
    section: {
      marginTop: 32,
      color: colors.ink,
      fontSize: 18,
      fontWeight: "700",
    },
    sectionFirst: {
      marginTop: 22,
    },
    sectionCopy: {
      marginTop: 6,
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
    },
    reminderRow: {
      marginTop: 14,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    reminderTimeRow: {
      marginTop: 10,
    },
    reminderLabel: {
      flex: 1,
      color: colors.ink,
      fontSize: 16,
      fontWeight: "600",
    },
    reminderTimeValue: {
      color: colors.indigo,
      fontSize: 16,
      fontWeight: "700",
    },
    timeSheetRoot: {
      flex: 1,
      justifyContent: "flex-end",
    },
    timeSheetBackdrop: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: colors.backdrop,
    },
    timeSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 24,
      paddingHorizontal: 8,
    },
    timeSheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 4,
    },
    timeSheetTitle: {
      color: colors.ink,
      fontSize: 17,
      fontWeight: "700",
    },
    timeSheetDone: {
      color: colors.indigo,
      fontSize: 16,
      fontWeight: "700",
    },
    actions: {
      marginTop: 16,
      gap: 10,
    },
    action: {
      backgroundColor: colors.indigoFill,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
      paddingHorizontal: 16,
    },
    actionSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    actionLabel: {
      color: colors.onIndigo,
      fontSize: 16,
      fontWeight: "700",
    },
    actionSecondaryLabel: {
      color: colors.ink,
      fontSize: 16,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.85,
    },
    disabled: {
      opacity: 0.55,
    },
    webHint: {
      marginTop: 14,
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
    },
  });
