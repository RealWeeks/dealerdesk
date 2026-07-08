import { Ionicons } from "@expo/vector-icons";
import type { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Reveal } from "./Reveal";
import { theme } from "../theme/theme";

// A label/value row that staggers in — the unit of a structured AI-output card.
export function FieldRow({ label, value, index = 0 }: { label: string; value: ReactNode; index?: number }) {
  return (
    <Reveal delay={index * 60}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </Reveal>
  );
}

// A card that reads like the result of model inference: sparkle header + title +
// optional confidence, over structured content.
export function AiOutputCard({ title, confidence, children, style }: PropsWithChildren<{ title: string; confidence?: string; style?: ViewStyle }>) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={14} color={theme.colors.accent} />
        <Text style={styles.title}>{title}</Text>
        {confidence ? <Text style={styles.confidence}>{confidence} confidence</Text> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    ...( { boxShadow: theme.shadow.card } as unknown as ViewStyle )
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { ...theme.typography.label, color: theme.colors.text, textTransform: "uppercase" },
  confidence: { ...theme.typography.caption, color: theme.colors.faint, marginLeft: "auto" },
  body: { gap: theme.spacing.xs },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.md, paddingVertical: 2 },
  label: { ...theme.typography.caption, color: theme.colors.muted },
  value: { ...theme.typography.body, color: theme.colors.text, fontFamily: theme.fonts.semibold, flexShrink: 1, textAlign: "right" }
});
