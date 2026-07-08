import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

// A light titled module for the right rail (quick actions, current search, dealer summary,
// tips). Lighter than a Card — a subtle surface with a small uppercase header — so the rail
// reads as grouped guidance rather than a stack of heavy boxes.
export function InsightPanel({
  title,
  icon,
  accent = false,
  children
}: {
  title: string;
  icon?: IconName;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={[styles.panel, accent && styles.accent]}>
      <View style={styles.header}>
        {icon ? <Ionicons name={icon} size={13} color={accent ? theme.colors.accent : theme.colors.muted} /> : null}
        <Text style={[styles.title, accent && styles.titleAccent]}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.sm
  },
  accent: { borderColor: theme.colors.selectedBorder },
  header: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { ...theme.typography.label, color: theme.colors.muted, textTransform: "uppercase" },
  titleAccent: { color: theme.colors.accent },
  body: { gap: theme.spacing.sm }
});
