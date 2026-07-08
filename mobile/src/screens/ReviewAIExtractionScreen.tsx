import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { theme } from "../theme/theme";

export function ReviewAIExtractionScreen() {
  const { confirmPendingExtraction, error, loading, pendingExtraction } = useDealDeskApp();
  if (!pendingExtraction) {
    return (
      <Screen>
        <Text style={styles.title}>Review AI Extraction</Text>
        <Text style={styles.body}>No extraction is waiting for review.</Text>
      </Screen>
    );
  }
  return (
    <Screen>
      <Text style={styles.title}>Review AI Extraction</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Card>
        <Text style={styles.kicker}>Dealer</Text>
        <Text style={styles.body}>{pendingExtraction.dealer.name ?? "Unknown dealer"} · {pendingExtraction.dealer.salespersonName ?? "Unknown salesperson"}</Text>
        <Text style={styles.kicker}>Vehicle</Text>
        <Text style={styles.body}>{pendingExtraction.vehicle.year} {pendingExtraction.vehicle.make} {pendingExtraction.vehicle.model} {pendingExtraction.vehicle.trim}</Text>
        <Text style={styles.kicker}>Offer</Text>
        <Text style={styles.body}>{pendingExtraction.offer.otdPrice ? `$${pendingExtraction.offer.otdPrice.toLocaleString()} OTD` : "OTD missing"} · {pendingExtraction.offer.sellingPrice ? `$${pendingExtraction.offer.sellingPrice.toLocaleString()} selling` : "Selling price missing"}</Text>
      </Card>
      <Card>
        <Text style={styles.kicker}>Red flags</Text>
        {pendingExtraction.redFlags.length ? pendingExtraction.redFlags.map((flag) => <Badge key={flag} label={flag} tone="danger" />) : <Text style={styles.body}>No red flags returned.</Text>}
        <Text style={styles.kicker}>Missing info</Text>
        {pendingExtraction.missingInfo.length ? pendingExtraction.missingInfo.map((item) => <Badge key={item} label={item} tone="warning" />) : <Text style={styles.body}>No missing info returned.</Text>}
      </Card>
      <Card>
        <Text style={styles.kicker}>Suggested next step</Text>
        <Text style={styles.body}>{pendingExtraction.suggestedNextStep}</Text>
        <Text style={styles.kicker}>Suggested reply</Text>
        <Text style={styles.body}>{pendingExtraction.suggestedReply}</Text>
      </Card>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" disabled={loading} onPress={confirmPendingExtraction} style={styles.button}><Text style={styles.buttonText}>{loading ? "Saving..." : "Save"}</Text></Pressable>
        {["Edit", "Ask AI what to say", "Discard"].map((label) => <Pressable key={label} accessibilityRole="button" style={styles.button}><Text style={styles.buttonText}>{label}</Text></Pressable>)}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 26, fontWeight: "900" },
  kicker: { color: theme.colors.muted, fontWeight: "800" },
  body: { color: theme.colors.text },
  error: { color: theme.colors.danger, fontWeight: "700" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  button: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  buttonText: { color: theme.colors.text, fontWeight: "800" }
});
