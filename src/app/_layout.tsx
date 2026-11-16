import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";
import { LibraryProvider, useLibrary } from "@/data/store";

export default function RootLayout() {
  return (
    <LibraryProvider>
      <View style={styles.shell}>
        <View style={styles.device}>
          <StatusBar style="dark" />
          <RootNavigator />
        </View>
      </View>
    </LibraryProvider>
  );
}

function RootNavigator() {
  const { ready } = useLibrary();

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

const styles = StyleSheet.create({
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
