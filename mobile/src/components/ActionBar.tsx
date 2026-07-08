import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { theme } from "../theme/theme";

// A horizontal action strip: one primary + a few secondary/link actions laid out in a row
// that wraps on narrow widths. Used atop Dealer detail and as the sticky selection bar on
// Outreach. Pass `direction="column"` to stack (e.g. inside the right rail).
export function ActionBar({
  children,
  direction = "row",
  style
}: {
  children: ReactNode;
  direction?: "row" | "column";
  style?: ViewStyle;
}) {
  return <View style={[direction === "column" ? styles.column : styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: theme.spacing.sm },
  column: { flexDirection: "column", alignItems: "stretch", gap: theme.spacing.sm }
});
