import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { theme } from "../../src/theme/theme";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: theme.colors.primary, tabBarStyle: { borderTopColor: theme.colors.border } }}>
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="dealers" options={{ title: "Dealers", tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="outreach" options={{ title: "Outreach", tabBarIcon: ({ color, size }) => <Ionicons name="send-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="offers" options={{ title: "Offers", tabBarIcon: ({ color, size }) => <Ionicons name="pricetags-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="ai" options={{ title: "AI", tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
