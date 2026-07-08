import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

// Gradient-bordered pill signalling an AI-powered feature.
export function AiBadge({ label = "AI-powered" }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.border}>
        <View style={styles.inner}>
          <Ionicons name="sparkles" size={12} color={theme.colors.accent} />
          <Text style={styles.text}>{label}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "flex-start", borderRadius: theme.radii.pill, overflow: "hidden" },
  border: { borderRadius: theme.radii.pill, padding: 1 },
  inner: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  text: { color: theme.colors.text, fontFamily: theme.fonts.bold, fontSize: 12, letterSpacing: 0.3 }
});
