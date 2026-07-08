import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useBreakpoint } from "../hooks/useBreakpoint";
import type { JourneyStep } from "../hooks/useJourney";
import { theme } from "../theme/theme";

export function JourneyStepper({ steps, activeKey }: { steps: JourneyStep[]; activeKey?: string }) {
  const { isTablet } = useBreakpoint();
  return (
    <View style={[styles.wrap, isTablet ? styles.row : styles.col]}>
      {steps.map((step, index) => {
        const active = step.key === activeKey;
        return (
          <View key={step.key} style={[styles.step, isTablet && styles.stepRow]}>
            <View style={[styles.dot, step.done && styles.dotDone, active && styles.dotActive]}>
              {step.done ? (
                <Ionicons name="checkmark" size={14} color={theme.colors.onAccent} />
              ) : (
                <Text style={[styles.num, active && styles.numActive]}>{index + 1}</Text>
              )}
            </View>
            <Text style={[styles.label, (active || step.done) && styles.labelOn]} numberOfLines={1}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.sm },
  row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  col: { flexDirection: "column" },
  step: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepRow: { flex: 1, minWidth: 92 },
  dot: {
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderWidth: 1
  },
  dotDone: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  dotActive: { borderColor: theme.colors.primary, ...( { boxShadow: theme.shadow.glow } as object ) },
  num: { color: theme.colors.muted, fontFamily: theme.fonts.bold, fontSize: 12 },
  numActive: { color: theme.colors.text },
  label: { color: theme.colors.muted, fontFamily: theme.fonts.semibold, fontSize: 13 },
  labelOn: { color: theme.colors.text }
});
