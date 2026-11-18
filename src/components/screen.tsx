import { ReactNode } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";

import { useThemedStyles } from "@/components/theme-provider";
import { Palette } from "@/constants/theme";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
};

export function Screen({ children, scroll = false, edges = ["top"], contentStyle }: ScreenProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 28,
    },
  });
