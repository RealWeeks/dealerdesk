import { Tabs } from "expo-router";
import { View } from "react-native";
import { AppTabBar } from "../../src/components/AppTabBar";
import { SideNav } from "../../src/components/SideNav";
import { useBreakpoint } from "../../src/hooks/useBreakpoint";
import { theme } from "../../src/theme/theme";

export default function TabLayout() {
  const { isWide } = useBreakpoint();
  return (
    // Explicit row: on wide screens the sidebar sits beside a flex:1 content pane
    // (minWidth:0 so it can't overflow), giving a browser-deterministic width.
    <View style={{ flex: 1, flexDirection: isWide ? "row" : "column", backgroundColor: theme.colors.background }}>
      {isWide ? <SideNav /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Tabs
          tabBar={isWide ? () => null : (props) => <AppTabBar {...props} />}
          screenOptions={{ headerShown: false, tabBarStyle: isWide ? { display: "none" } : undefined }}
        >
          <Tabs.Screen name="home" options={{ title: "Home" }} />
          <Tabs.Screen name="dealers" options={{ title: "Dealers" }} />
          <Tabs.Screen name="outreach" options={{ title: "Outreach" }} />
          <Tabs.Screen name="offers" options={{ title: "Offers" }} />
          <Tabs.Screen name="ai" options={{ title: "Add Update" }} />
        </Tabs>
      </View>
    </View>
  );
}
