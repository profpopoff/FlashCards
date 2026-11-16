import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/constants/theme";

type FilterChipProps = {
  label: string;
  selected: boolean;
  tone?: "ink" | "indigo";
  bordered?: boolean;
  onPress: () => void;
};

export function FilterChip({ label, selected, tone = "ink", bordered = false, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        bordered && styles.bordered,
        selected ? styles.selected : styles.idle,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, selected ? styles.selectedLabel : tone === "indigo" ? styles.indigoLabel : styles.inkLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.line,
  },
  idle: {
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  pressed: {
    opacity: 0.72,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  selectedLabel: {
    color: "#FFFFFF",
  },
  inkLabel: {
    color: colors.ink,
  },
  indigoLabel: {
    color: colors.indigo,
  },
});
