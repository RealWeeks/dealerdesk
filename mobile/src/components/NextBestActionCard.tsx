import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { GradientCard } from "./GradientCard";
import { theme } from "../theme/theme";

// The single most important thing to do right now, framed as coaching (label +
// action + why it matters + one primary CTA). Used on Home and Dealer detail.
export function NextBestActionCard({
  title,
  description,
  cta,
  label = "Next best action"
}: {
  title: string;
  description?: string;
  cta?: { label: string; onPress?: () => void; disabled?: boolean };
  label?: string;
}) {
  return (
    <GradientCard glow>
      <View style={styles.labelRow}>
        <Ionicons name="sparkles" size={13} color={theme.colors.accent} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {cta ? <Button label={cta.label} onPress={cta.onPress} disabled={cta.disabled} style={styles.cta} /> : null}
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { ...theme.typography.label, color: theme.colors.accent, textTransform: "uppercase" },
  title: { ...theme.typography.heading, color: theme.colors.text },
  description: { ...theme.typography.body, color: theme.colors.muted },
  cta: { alignSelf: "flex-start", marginTop: 4 }
});
