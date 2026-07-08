import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { theme } from "../theme/theme";

// Lightweight header: task-describing title + a one-line human explanation.
export function PageHeader({ title, description, right }: { title: string; description?: string; right?: ReactNode }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.titleCol}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

// Guided header: PageHeader + optional status badges, a single primary CTA, and an
// inline slot for a NextBestAction / DealDesk-insight card. Answers "where am I, what's
// happening, what do I do next" at the top of every major page.
export function GuidedPageHeader({
  title,
  description,
  status,
  primaryAction,
  right,
  children
}: {
  title: string;
  description?: string;
  status?: ReactNode;
  primaryAction?: { label: string; onPress?: () => void; disabled?: boolean };
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.titleCol}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {status ? <View style={styles.statusRow}>{status}</View> : null}
      {primaryAction ? (
        <Button label={primaryAction.label} onPress={primaryAction.onPress} disabled={primaryAction.disabled} style={styles.cta} />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.sm },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: theme.spacing.md },
  titleCol: { flex: 1, gap: 4 },
  title: { ...theme.typography.title, color: theme.colors.text },
  description: { ...theme.typography.body, color: theme.colors.muted, maxWidth: 640 },
  right: { flexShrink: 0 },
  statusRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: theme.spacing.sm },
  cta: { alignSelf: "flex-start" }
});
