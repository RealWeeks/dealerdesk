import { StyleSheet, Text } from "react-native";
import { theme } from "../theme/theme";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const colors = {
    neutral: [theme.colors.primarySoft, theme.colors.primary],
    success: [theme.colors.successSoft, theme.colors.success],
    warning: [theme.colors.warningSoft, theme.colors.warning],
    danger: [theme.colors.dangerSoft, theme.colors.danger]
  }[tone];
  return <Text style={[styles.badge, { backgroundColor: colors[0], color: colors[1] }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5
  }
});
