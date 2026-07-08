import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, type PressableStateCallbackType, type StyleProp, type ViewStyle } from "react-native";
import { theme } from "../theme/theme";

type Variant = "primary" | "secondary" | "ghost" | "link";
type Size = "md" | "sm";

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  accessibilityLabel,
  style
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const height = size === "sm" ? 40 : 48;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      style={(state: PressableStateCallbackType) => {
        // react-native-web adds `hovered`/`focused` to the callback state.
        const hovered = (state as { hovered?: boolean }).hovered ?? false;
        const pressed = state.pressed;
        return [
          styles.base,
          { minHeight: height, paddingHorizontal: variant === "link" ? theme.spacing.sm : size === "sm" ? theme.spacing.md : theme.spacing.lg },
          variant === "secondary" && styles.secondary,
          (variant === "ghost" || variant === "link") && styles.ghost,
          (variant === "secondary" || variant === "ghost") && hovered && styles.hoverSurface,
          { opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          variant === "primary" && hovered ? ({ boxShadow: theme.shadow.glow } as unknown as ViewStyle) : null,
          variant === "link" && hovered ? ({ textDecorationLine: "underline" } as unknown as ViewStyle) : null,
          style
        ];
      }}
    >
      {variant === "primary" ? (
        <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      ) : null}
      <Text style={[styles.label, size === "sm" && styles.labelSm, variant === "primary" ? styles.labelOnAccent : variant === "secondary" ? styles.labelSecondary : styles.labelGhost, variant === "link" && styles.labelLink]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radii.md,
    overflow: "hidden"
  },
  secondary: { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, borderWidth: 1 },
  ghost: { backgroundColor: "transparent" },
  hoverSurface: { borderColor: theme.colors.primary },
  label: { fontFamily: theme.fonts.bold, fontSize: 15 },
  labelSm: { fontSize: 14 },
  labelOnAccent: { color: theme.colors.onAccent },
  labelSecondary: { color: theme.colors.text },
  labelGhost: { color: theme.colors.primary },
  labelLink: { fontFamily: theme.fonts.semibold }
});
