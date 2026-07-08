import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

// A section heading: a restrained uppercase label + optional description + optional
// right-aligned action. Used to delineate page sections without boxing them in a Card.
export function SectionHeader({ title, description, right }: { title: string; description?: string; right?: ReactNode }) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerText}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

// A non-boxed page section: an optional hairline top divider, an optional SectionHeader,
// then content. This is the default alternative to wrapping every block in a Card — it
// gives structure and rhythm on desktop while staying light on mobile.
export function Section({
  title,
  description,
  right,
  divider = true,
  children
}: {
  title?: string;
  description?: string;
  right?: ReactNode;
  divider?: boolean;
  children?: ReactNode;
}) {
  return (
    <View style={[styles.section, divider && styles.divided]}>
      {title ? <SectionHeader title={title} description={description} right={right} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: theme.spacing.sm },
  divided: { borderTopColor: theme.colors.divider, borderTopWidth: 1, paddingTop: theme.spacing.lg },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: theme.spacing.md },
  headerText: { flex: 1, gap: 2 },
  title: { ...theme.typography.label, color: theme.colors.muted, textTransform: "uppercase" },
  description: { ...theme.typography.caption, color: theme.colors.faint },
  right: { flexShrink: 0 }
});
