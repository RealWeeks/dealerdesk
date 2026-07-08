import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

type Option = { label: string; value: string };

// Accessible segmented control (≥40px targets). Replaces the duplicated segment styles
// in SearchSetup / ManualQuote. Active segment uses the accent fill + onAccent text.
export function SegmentGroup({
  options,
  value,
  onChange,
  labelPrefix
}: {
  options: (Option | string)[];
  value?: string;
  onChange: (value: string) => void;
  labelPrefix?: string;
}) {
  const normalized: Option[] = options.map((option) => (typeof option === "string" ? { label: option, value: option } : option));
  return (
    <View style={styles.row}>
      {normalized.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={labelPrefix ? `${labelPrefix} ${option.label}` : option.label}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  segment: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minWidth: 84,
    minHeight: 44,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.bgElevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1
  },
  segmentActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  text: { ...theme.typography.subtitle, color: theme.colors.text },
  textActive: { color: theme.colors.onAccent }
});
