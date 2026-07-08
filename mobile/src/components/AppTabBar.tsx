import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
const ICONS: Record<string, { on: IconName; off: IconName }> = {
  home: { on: "home", off: "home-outline" },
  dealers: { on: "storefront", off: "storefront-outline" },
  outreach: { on: "send", off: "send-outline" },
  offers: { on: "pricetags", off: "pricetags-outline" },
  ai: { on: "document-text", off: "document-text-outline" }
};

// Dark bottom tab bar for phones / narrow screens. The desktop sidebar is a
// separate component (SideNav) rendered as a sibling of the navigator.
export function AppTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = (descriptors[route.key]?.options.title ?? route.name) as string;
        const icon = ICONS[route.name] ?? { on: "ellipse", off: "ellipse-outline" };
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable key={route.key} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.bottomItem}>
            <Ionicons name={focused ? icon.on : icon.off} size={22} color={focused ? theme.colors.primary : theme.colors.muted} />
            <Text style={[styles.bottomLabel, focused && styles.bottomLabelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: "row",
    backgroundColor: theme.colors.bgElevated,
    borderTopColor: theme.colors.borderSoft,
    borderTopWidth: 1,
    paddingTop: 8
  },
  bottomItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  bottomLabel: { color: theme.colors.muted, fontFamily: theme.fonts.medium, fontSize: 11 },
  bottomLabelActive: { color: theme.colors.primary }
});
