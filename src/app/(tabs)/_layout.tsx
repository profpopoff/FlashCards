import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

import { colors } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.indigo,
        tabBarInactiveTintColor: "#9A968E",
        tabBarStyle: {
          backgroundColor: "#FFFCF8",
          borderTopColor: colors.line,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Study",
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="words"
        options={{
          title: "Words",
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarIcon: ({ color, size }) => <Ionicons name="add" color={color as string} size={size + 4} />,
        }}
      />
      <Tabs.Screen
        name="tags"
        options={{
          title: "Tags",
          tabBarIcon: ({ color, size }) => <Ionicons name="pricetag-outline" color={color as string} size={size} />,
        }}
      />
    </Tabs>
  );
}
