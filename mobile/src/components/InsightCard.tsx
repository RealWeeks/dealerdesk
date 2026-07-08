import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

// A "recommended next move" block: accent rail + small icon + a short insight.
export function InsightCard({ title = "Recommended next move", children, icon = "bulb-outline" }: { title?: string; children: ReactNode; icon?: IconName }) {
  return (
    <View style={styles.card}>
      <View style={styles.rail} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name={icon} size={14} color={theme.colors.accent} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.body}>{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    overflow: "hidden"
  },
  rail: { width: 3, backgroundColor: theme.colors.accent },
  content: { flex: 1, padding: theme.spacing.md, gap: theme.spacing.xs },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { ...theme.typography.label, color: theme.colors.muted, textTransform: "uppercase" },
  body: { ...theme.typography.body, color: theme.colors.text }
});
