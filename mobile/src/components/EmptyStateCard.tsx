import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { Card } from "./Card";
import { theme } from "../theme/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

// Helpful empty state: icon + title + a sentence explaining what will appear and why,
// plus an optional CTA. Replaces terse "No X yet." strings across the app.
export function EmptyStateCard({
  icon = "sparkles-outline",
  title,
  description,
  cta
}: {
  icon?: IconName;
  title: string;
  description?: string;
  cta?: { label: string; onPress?: () => void };
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={theme.colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {cta ? <Button label={cta.label} variant="secondary" size="sm" onPress={cta.onPress} style={styles.cta} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", gap: theme.spacing.sm, paddingVertical: theme.spacing.lg },
  iconWrap: { width: 40, height: 40, borderRadius: theme.radii.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.accentSoft },
  title: { ...theme.typography.subtitle, color: theme.colors.text, textAlign: "center" },
  description: { ...theme.typography.body, color: theme.colors.muted, textAlign: "center", maxWidth: 420 },
  cta: { marginTop: 4 }
});
