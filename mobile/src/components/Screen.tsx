import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { theme } from "../theme/theme";

type Width = "default" | "wide" | "full";

// Page container. Without a `rail`, it centers content at `width` (default 900 / wide 1200).
// With a `rail` and a wide-enough viewport (`hasRail`, ≥1200), it lays out a centered shell
// (≤1280) as main (≤860) + a 320px right rail. Below that the rail stacks beneath the main
// content, so the same screen code works on desktop, medium, and mobile.
export function Screen({ children, width = "default", rail }: PropsWithChildren<{ width?: Width; rail?: ReactNode }>) {
  const { isWide, hasRail } = useBreakpoint();
  const maxWidth = width === "full" ? undefined : width === "wide" ? theme.layout.wide : theme.layout.content;
  const twoColumn = rail != null && hasRail;

  const inner = twoColumn ? (
    <View style={[styles.shell, { maxWidth: theme.layout.shell }]}>
      <View style={[styles.main, { maxWidth: theme.layout.main }]}>{children}</View>
      <View style={[styles.rail, { width: theme.layout.rail }]}>{rail}</View>
    </View>
  ) : (
    <View style={[styles.inner, maxWidth ? { maxWidth } : null]}>
      {children}
      {rail != null ? <View style={styles.railStacked}>{rail}</View> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: isWide ? theme.spacing.lg : theme.spacing.md, paddingBottom: isWide ? theme.spacing.lg : 96 }
        ]}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        {inner}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background, minHeight: "100%" },
  scroll: { flex: 1 },
  content: { flexGrow: 1, alignItems: "center", paddingVertical: theme.spacing.md },
  inner: { width: "100%", gap: theme.spacing.md },
  railStacked: { gap: theme.spacing.md },
  shell: { width: "100%", flexDirection: "row", alignItems: "flex-start", gap: theme.spacing.xl },
  main: { flex: 1, minWidth: 0, gap: theme.spacing.md },
  rail: { flexShrink: 0, gap: theme.spacing.md }
});
