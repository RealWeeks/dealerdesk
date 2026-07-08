import { StyleSheet, Text, View } from "react-native";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { DealerDetailScreen } from "./DealerDetailScreen";
import { FindDealersScreen } from "./FindDealersScreen";
import { theme } from "../theme/theme";
import { Pressable } from "react-native";

export function DealersScreen() {
  const { dealers, error, selectedDealer, selectDealer } = useDealDeskApp();
  if (selectedDealer) return <DealerDetailScreen onBack={() => selectDealer(null)} />;
  if (!dealers.length) return <FindDealersScreen />;

  return (
    <Screen>
      <Text style={styles.title}>Dealers</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {dealers.map((dealer) => (
        <Card key={dealer._id}>
          <View style={styles.row}>
            <Text style={styles.dealer}>{dealer.name}</Text>
            <Badge label={dealer.priority} tone={dealer.priority === "high" ? "warning" : "neutral"} />
          </View>
          <Text style={styles.muted}>{dealer.city}, {dealer.state}</Text>
          <Badge label={dealer.status.replace("_", " ")} tone={dealer.status === "needs_reply" ? "danger" : "success"} />
          <Text style={styles.muted}>Last contacted: not yet · Next follow-up: tomorrow</Text>
          <Pressable accessibilityRole="button" onPress={() => selectDealer(dealer)} style={styles.button}><Text style={styles.buttonText}>Open</Text></Pressable>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 26, fontWeight: "900" },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  dealer: { color: theme.colors.text, flex: 1, fontSize: 18, fontWeight: "800" },
  muted: { color: theme.colors.muted },
  button: { alignItems: "center", borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, minHeight: 42, justifyContent: "center" },
  buttonText: { color: theme.colors.text, fontWeight: "800" },
  error: { color: theme.colors.danger, fontWeight: "700" }
});
