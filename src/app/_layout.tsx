import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import { ThemeProvider, useTheme, useThemedStyles } from "@/components/theme-provider";
import { Palette } from "@/constants/theme";
import { LibraryProvider, useLibrary } from "@/data/store";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LibraryProvider>
        <ThemedShell />
      </LibraryProvider>
    </ThemeProvider>
  );
}

function ThemedShell() {
  const { scheme } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.shell}>
      <View style={styles.device}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <RootNavigator />
      </View>
    </View>
  );
}

function RootNavigator() {
  const { ready } = useLibrary();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (!ready) {
    return <View style={styles.loading} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="study" />
    </Stack>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    shell: {
      flex: 1,
      alignItems: "center",
      backgroundColor: colors.shell,
    },
    device: {
      flex: 1,
      width: "100%",
      maxWidth: 440,
      backgroundColor: colors.background,
    },
    loading: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
