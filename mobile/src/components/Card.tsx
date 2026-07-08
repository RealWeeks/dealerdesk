import type { PropsWithChildren } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { theme } from "../theme/theme";

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    // boxShadow is supported by react-native-web (and RN 0.79); cast keeps TS happy.
    ...( { boxShadow: theme.shadow.card } as unknown as ViewStyle )
  }
});
