import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

export type Column<T> = {
  key: string;
  label: string;
  flex?: number;
  align?: "left" | "right";
  render?: (row: T) => ReactNode;
};

// A flex-based comparison table (no RN <table>, so the DOM test mock renders it as plain
// Views/Text). Header row + divider-separated data rows; the first row can be highlighted
// as the leader. Intended for desktop; screens fall back to stacked summaries on mobile.
export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  highlightFirst = false,
  rowKey
}: {
  columns: Column<T>[];
  rows: T[];
  highlightFirst?: boolean;
  rowKey: (row: T, index: number) => string;
}) {
  return (
    <View style={styles.table}>
      <View style={styles.headRow}>
        {columns.map((column) => (
          <View key={column.key} style={[styles.cell, { flex: column.flex ?? 1 }, column.align === "right" && styles.alignRight]}>
            <Text style={styles.th}>{column.label}</Text>
          </View>
        ))}
      </View>
      {rows.map((row, index) => (
        <View key={rowKey(row, index)} style={[styles.dataRow, index > 0 && styles.divided, highlightFirst && index === 0 && styles.highlight]}>
          {columns.map((column) => (
            <View key={column.key} style={[styles.cell, { flex: column.flex ?? 1 }, column.align === "right" && styles.alignRight]}>
              {column.render ? column.render(row) : <Text style={styles.td}>{String(row[column.key] ?? "")}</Text>}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    overflow: "hidden"
  },
  headRow: { flexDirection: "row", paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.bgElevated, gap: theme.spacing.sm },
  dataRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, gap: theme.spacing.sm },
  divided: { borderTopColor: theme.colors.divider, borderTopWidth: 1 },
  highlight: { backgroundColor: theme.colors.selected },
  cell: { flex: 1, minWidth: 0 },
  alignRight: { alignItems: "flex-end" },
  th: { ...theme.typography.caption, color: theme.colors.muted, textTransform: "uppercase", letterSpacing: 0.3 },
  td: { ...theme.typography.body, color: theme.colors.text }
});
