import type { PropsWithChildren } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { theme } from "../theme/theme";

// Elevated card with a subtle accent gradient wash; used for hero / "next step".
export function GradientCard({ children, glow = false, style }: PropsWithChildren<{ glow?: boolean; style?: ViewStyle }>) {
  return (
    <View style={[styles.card, glow ? ({ boxShadow: theme.shadow.glow } as unknown as ViewStyle) : null, style]}>
      <LinearGradient colors={theme.gradients.accentSubtle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    overflow: "hidden"
  },
  content: { padding: theme.spacing.lg, gap: theme.spacing.sm }
});
