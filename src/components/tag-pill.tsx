import { StyleSheet, Text, View } from "react-native";

import { useTheme, useThemedStyles } from "@/components/theme-provider";
import { Palette, tagAppearance } from "@/constants/theme";

type TagPillProps = {
  name: string;
  color: string;
  size?: "sm" | "md";
};

export function TagPill({ name, color, size = "md" }: TagPillProps) {
  const { colors, scheme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const appearance = tagAppearance(color, scheme, colors.surface);

  return (
    <View style={[styles.pill, size === "sm" && styles.pillSmall, { backgroundColor: appearance.backgroundColor }]}>
      <Text style={[styles.label, size === "sm" && styles.labelSmall, { color: appearance.color }]}>{name}</Text>
    </View>
  );
}

export function Pronunciation({ value, centered = false }: { value: string; centered?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const text = value.trim();
  if (!text) return null;
  return <Text style={[styles.pronunciation, centered && styles.centered]}>{text}</Text>;
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    pill: {
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    pillSmall: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
    },
    labelSmall: {
      fontSize: 12,
    },
    pronunciation: {
      marginTop: 2,
      color: colors.muted,
      fontSize: 13,
      fontStyle: "italic",
    },
    centered: {
      textAlign: "center",
      fontSize: 16,
      marginTop: 6,
    },
  });
