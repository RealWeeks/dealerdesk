import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { theme } from "../theme/theme";
import type { DealerSeed } from "../types/domain";

export function FindDealersScreen({ onAddDealer = () => undefined }: { onAddDealer?: (dealerId: string) => void }) {
  const { activeSearch, addDealer, error } = useDealDeskApp();
  const [brand, setBrand] = useState(activeSearch?.make ?? "Lexus");
  const [zip, setZip] = useState(activeSearch?.zipCode ?? "04101");
  const [radius, setRadius] = useState(String(activeSearch?.searchRadiusMiles ?? 150));
  const [results, setResults] = useState<DealerSeed[]>([]);
  const [loading, setLoading] = useState(false);
  const { searchDealerSeeds } = useDealDeskApp();

  useEffect(() => {
    if (!activeSearch) return;
    setBrand(activeSearch.make);
    setZip(activeSearch.zipCode);
    setRadius(String(activeSearch.searchRadiusMiles));
  }, [activeSearch]);

  async function submitSearch() {
    setLoading(true);
    try {
      setResults(await searchDealerSeeds(brand, zip, Number(radius)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Find dealers</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Card>
        <View style={styles.filters}>
          <TextInput accessibilityLabel="Dealer brand" value={brand} onChangeText={setBrand} placeholder="Lexus" style={styles.input} />
          <TextInput accessibilityLabel="Search ZIP" value={zip} onChangeText={setZip} placeholder="04101" style={styles.input} />
          <TextInput accessibilityLabel="Search radius" value={radius} onChangeText={setRadius} keyboardType="number-pad" placeholder="150 miles" style={styles.input} />
          <Pressable accessibilityRole="button" onPress={submitSearch} disabled={loading} style={styles.button}><Text style={styles.buttonText}>{loading ? "Searching..." : "Search Seeded Dealers"}</Text></Pressable>
        </View>
      </Card>
      {!results.length && !loading ? <Text style={styles.muted}>Search seeded dealers to add one to your active car search.</Text> : null}
      {results.map((dealer) => (
        <Card key={dealer._id}>
          <Text style={styles.dealer}>{dealer.name}</Text>
          <Text style={styles.muted}>{dealer.city}, {dealer.state} · {dealer.distanceMiles} mi</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={async () => { await addDealer(dealer._id); onAddDealer(dealer._id); }} style={styles.button}><Text style={styles.buttonText}>Add</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => Linking.openURL(`tel:${dealer.phone}`)} style={styles.secondary}><Text style={styles.secondaryText}>Call</Text></Pressable>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 26, fontWeight: "900" },
  filters: { gap: 10 },
  input: { borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, minHeight: 44, paddingHorizontal: 12 },
  dealer: { color: theme.colors.text, fontSize: 18, fontWeight: "800" },
  muted: { color: theme.colors.muted },
  error: { color: theme.colors.danger, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 10 },
  button: { backgroundColor: theme.colors.primary, borderRadius: theme.radius, paddingHorizontal: 16, paddingVertical: 10 },
  buttonText: { color: "#fff", fontWeight: "800" },
  secondary: { borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  secondaryText: { color: theme.colors.text, fontWeight: "800" }
});
