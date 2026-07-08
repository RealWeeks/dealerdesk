import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 96,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    gap: 2
  },
  value: { color: theme.colors.text, fontFamily: theme.fonts.extrabold, fontSize: 24 },
  label: { color: theme.colors.muted, fontFamily: theme.fonts.medium, fontSize: 12 }
});
