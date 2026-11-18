import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { useTheme, useThemedStyles } from "@/components/theme-provider";
import { AppearancePreference, Palette } from "@/constants/theme";

const OPTIONS: { id: AppearancePreference; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function SettingsScreen() {
  const { preference, setPreference } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Screen scroll contentStyle={styles.scroll}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Appearance follows your phone until you choose.</Text>
      <View accessibilityLabel="Appearance" style={styles.segment}>
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
      lineHeight: 22,
    },
    segment: {
      flexDirection: "row",
      backgroundColor: colors.segment,
      borderRadius: 14,
      padding: 4,
      marginTop: 22,
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
    },
    optionLabelOn: {
      color: colors.ink,
      fontWeight: "700",
    },
  });
