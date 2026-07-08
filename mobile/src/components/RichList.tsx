import { Children, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { theme } from "../theme/theme";

// A desktop-native list: rows separated by hairline dividers (no per-item box). On mobile
// it falls back to spaced, card-like rows so it stays thumb-friendly. Pair with RichListRow.
export function RichList({ children }: { children: ReactNode }) {
  const { isWide } = useBreakpoint();
  const items = Children.toArray(children);
  if (!isWide) return <View style={styles.stack}>{children}</View>;
  return (
    <View style={styles.list}>
      {items.map((child, index) => (
        <View key={index} style={[styles.rowWrap, index > 0 && styles.divided]}>{child}</View>
      ))}
    </View>
  );
}

// One list row. `children` is the main content (name, meta, badges). `leading` sits before
// it (e.g. a select indicator) and `trailing` after (actions/links). When `onPress` is set
// only the leading+main region toggles — `trailing` renders as a sibling so tapping an
// action button/link there doesn't also fire the row press (the web nested-press trap).
export function RichListRow({
  leading,
  trailing,
  onPress,
  selected = false,
  accessibilityLabel,
  children
}: {
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
  children: ReactNode;
}) {
  const { isWide } = useBreakpoint();
  const region = (
    <>
      {leading != null ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.body}>{children}</View>
    </>
  );
  return (
    <View style={[styles.row, !isWide && styles.card, selected && styles.selected]}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ selected }}
          onPress={onPress}
          style={styles.region}
        >
          {region}
        </Pressable>
      ) : (
        <View style={styles.region}>{region}</View>
      )}
      {trailing != null ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {},
  stack: { gap: theme.spacing.sm },
  rowWrap: {},
  divided: { borderTopColor: theme.colors.divider, borderTopWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.md, paddingVertical: theme.spacing.md },
  // Mobile: give each row a card-like frame so it stays legible when stacked.
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    flexWrap: "wrap"
  },
  selected: { backgroundColor: theme.colors.selected },
  region: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
  leading: { flexShrink: 0 },
  body: { flex: 1, minWidth: 0, gap: 3 },
  trailing: { flexShrink: 0, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: theme.spacing.sm }
});
