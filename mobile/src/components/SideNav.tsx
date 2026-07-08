import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { theme } from "../theme/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
const NAV: { route: string; label: string; on: IconName; off: IconName }[] = [
  { route: "/home", label: "Home", on: "home", off: "home-outline" },
  { route: "/dealers", label: "Dealers", on: "storefront", off: "storefront-outline" },
  { route: "/outreach", label: "Outreach", on: "send", off: "send-outline" },
  { route: "/offers", label: "Offers", on: "pricetags", off: "pricetags-outline" },
  { route: "/ai", label: "Add Update", on: "document-text", off: "document-text-outline" }
];

// Desktop sidebar rendered as a sibling of the tab navigator (not via the tabBar
// slot), so the content pane width is deterministic across browsers. Navigates
// with expo-router and highlights the active route via the pathname.
export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useDealDeskApp();
  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.brandMark}>
          <Ionicons name="sparkles" size={16} color={theme.colors.onAccent} />
        </LinearGradient>
        <Text style={styles.brandText}>DealDesk</Text>
      </View>
      <View style={styles.navList}>
        {NAV.map((item) => {
          const active = pathname === item.route || pathname.startsWith(`${item.route}/`);
          return (
            <Pressable key={item.route} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: active }} onPress={() => router.push(item.route as never)} style={[styles.navItem, active && styles.navItemActive]}>
              {active ? <View style={styles.activeRail} /> : null}
              <Ionicons name={active ? item.on : item.off} size={20} color={active ? theme.colors.text : theme.colors.muted} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Log out" onPress={() => { logout(); router.replace("/"); }} style={styles.logout}>
        <Ionicons name="log-out-outline" size={18} color={theme.colors.muted} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: theme.layout.sidebarWidth,
    flexShrink: 0,
    height: "100%",
    backgroundColor: theme.colors.bgElevated,
    borderRightColor: theme.colors.borderSoft,
    borderRightWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.lg
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 6 },
  brandMark: { width: 32, height: 32, borderRadius: theme.radii.md, alignItems: "center", justifyContent: "center" },
  brandText: { color: theme.colors.text, fontFamily: theme.fonts.display, fontSize: 20 },
  navList: { gap: 4, flex: 1 },
  navItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 11, borderRadius: theme.radii.md },
  navItemActive: { backgroundColor: theme.colors.accentSoft },
  activeRail: { position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: theme.radii.pill, backgroundColor: theme.colors.primary },
  navLabel: { color: theme.colors.muted, fontFamily: theme.fonts.semibold, fontSize: 15 },
  navLabelActive: { color: theme.colors.text },
  logout: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: theme.radii.md },
  logoutText: { color: theme.colors.muted, fontFamily: theme.fonts.semibold, fontSize: 14 }
});
