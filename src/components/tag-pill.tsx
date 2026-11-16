import { StyleSheet, Text, View } from "react-native";

import { tint } from "@/constants/theme";

type TagPillProps = {
  name: string;
  color: string;
  size?: "sm" | "md";
};

export function TagPill({ name, color, size = "md" }: TagPillProps) {
  return (
    <View style={[styles.pill, size === "sm" && styles.pillSmall, { backgroundColor: tint(color, 0.14) }]}>
      <Text style={[styles.label, size === "sm" && styles.labelSmall, { color }]}>{name}</Text>
    </View>
  );
}

export function Pronunciation({ value, centered = false }: { value: string; centered?: boolean }) {
  const text = value.trim();
  if (!text) return null;
  return <Text style={[styles.pronunciation, centered && styles.centered]}>{text}</Text>;
}

const styles = StyleSheet.create({
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
    color: "#8E8B84",
    fontSize: 13,
    fontStyle: "italic",
  },
  centered: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 6,
  },
});
