import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { theme } from "../theme/theme";

export function CompareOffersScreen() {
  const { dealers, error, offers } = useDealDeskApp();
  const ranked = [...offers].sort((a, b) => (a.otdPrice ?? Infinity) - (b.otdPrice ?? Infinity));
  return (
    <Screen>
      <Text style={styles.title}>Compare offers</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!ranked.length ? <Text style={styles.muted}>No confirmed offers yet. Parse and save a dealer update first.</Text> : null}
      {ranked.map((offer, index) => (
        <Card key={offer._id}>
          <View style={styles.row}>
            <Text style={styles.dealer}>{index + 1}. {dealers.find((dealer) => dealer._id === offer.dealerId)?.name ?? "Dealer"}</Text>
            <Badge label={offer.quoteCompleteness} tone={offer.quoteCompleteness === "complete" ? "success" : "warning"} />
          </View>
          <Text style={styles.price}>{offer.otdPrice ? `$${offer.otdPrice.toLocaleString()} OTD` : "OTD missing"}</Text>
          <Text style={styles.muted}>Selling price: {offer.sellingPrice ? `$${offer.sellingPrice.toLocaleString()}` : "missing"}</Text>
          <Text style={styles.muted}>Add-ons: {offer.addOns?.length ? offer.addOns.map((addOn) => addOn.name).join(", ") : "none"}</Text>
          <Text style={styles.muted}>{offer.redFlags?.length ? "Messy quote" : "Clean quote"}</Text>
          <Pressable accessibilityRole="button" style={styles.button}><Text style={styles.buttonText}>Generate reply</Text></Pressable>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 26, fontWeight: "900" },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  dealer: { color: theme.colors.text, flex: 1, fontSize: 18, fontWeight: "800" },
  price: { color: theme.colors.success, fontSize: 24, fontWeight: "900" },
  muted: { color: theme.colors.muted },
  error: { color: theme.colors.danger, fontWeight: "700" },
  button: { alignItems: "center", borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, minHeight: 42, justifyContent: "center" },
  buttonText: { color: theme.colors.text, fontWeight: "800" }
});
