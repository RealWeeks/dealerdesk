import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { theme } from "../theme/theme";

// Container for the desktop right rail's stacked panels. On web it sticks near the top
// so guidance stays in view while the main column scrolls; on native/mobile the cast is
// ignored and it simply stacks (Screen already handles the stacked-below-main fallback).
export function RightRail({ children }: { children: ReactNode }) {
  return <View style={styles.rail}>{children}</View>;
}

const styles = StyleSheet.create({
  rail: {
    gap: theme.spacing.md,
    ...({ position: "sticky", top: theme.spacing.lg } as unknown as ViewStyle)
  }
});
