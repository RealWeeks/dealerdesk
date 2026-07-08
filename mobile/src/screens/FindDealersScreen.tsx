import { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyStateCard } from "../components/EmptyStateCard";
import { MakePicker } from "../components/MakePicker";
import { PageHeader } from "../components/PageHeader";
import { RichList, RichListRow } from "../components/RichList";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { theme } from "../theme/theme";
import type { DealerSeed } from "../types/domain";

export function FindDealersScreen({ onAddDealer = () => undefined }: { onAddDealer?: (dealerId: string) => void }) {
  const { activeSearch, addDealer, error } = useDealDeskApp();
  const [brand, setBrand] = useState(activeSearch?.make ?? "Lexus");
  const [zip, setZip] = useState(activeSearch?.zipCode ?? "04101");
  const [radius, setRadius] = useState(String(activeSearch?.searchRadiusMiles ?? 150));
  const [results, setResults] = useState<DealerSeed[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
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
    setNotice(null);
    try {
      const res = await searchDealerSeeds(brand, zip, Number(radius));
      setResults(res.dealers);
      setNotice(res.warnings[0] ?? null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <PageHeader title="Find dealers" description="Search for dealerships that carry your car, then add the ones you want to negotiate with to your search." />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Card>
        <View style={styles.filters}>
          <MakePicker label="Dealer brand" value={brand} onChange={setBrand} />
          <TextInput accessibilityLabel="Search ZIP" value={zip} onChangeText={setZip} placeholder="04101" placeholderTextColor={theme.colors.faint} style={styles.input} />
          <TextInput accessibilityLabel="Search radius" value={radius} onChangeText={setRadius} keyboardType="number-pad" placeholder="150 miles" placeholderTextColor={theme.colors.faint} style={styles.input} />
          <Button label={loading ? "Searching..." : "Search dealers"} onPress={submitSearch} disabled={loading} variant="primary" />
        </View>
      </Card>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {!results.length && !loading && !notice ? (
        <EmptyStateCard icon="search-outline" title="Search to find dealers near you" description="Enter a brand, ZIP, and radius above to find real dealerships near you to add to your car search." />
      ) : null}
      {results.length ? (
        <Section title="Results" description="From OpenStreetMap" divider={false}>
          <RichList>
            {results.map((dealer) => (
              <RichListRow
                key={dealer._id}
                trailing={
                  <>
                    <Button label="Add" size="sm" onPress={async () => { await addDealer(dealer._id); onAddDealer(dealer._id); }} />
                    {dealer.websiteUrl ? <Button label="Website" variant="link" size="sm" accessibilityLabel={`Website for ${dealer.name}`} onPress={() => Linking.openURL(dealer.websiteUrl!)} /> : null}
                    {dealer.phone ? <Button label="Call" variant="link" size="sm" onPress={() => Linking.openURL(`tel:${dealer.phone}`)} /> : null}
                  </>
                }
              >
                <Text style={styles.dealer}>{dealer.name}</Text>
                <Text style={styles.muted}>{[dealer.city, dealer.state].filter(Boolean).join(", ")} · {dealer.distanceMiles} mi</Text>
                {dealer.address ? <Text style={styles.muted}>{dealer.address}</Text> : null}
              </RichListRow>
            ))}
          </RichList>
        </Section>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { gap: theme.spacing.sm },
  input: { ...theme.typography.body, backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, color: theme.colors.text, minHeight: 44, paddingHorizontal: theme.spacing.md },
  dealer: { ...theme.typography.heading, color: theme.colors.text },
  muted: { ...theme.typography.body, color: theme.colors.muted },
  notice: { ...theme.typography.body, color: theme.colors.warning },
  error: { ...theme.typography.body, color: theme.colors.danger, fontFamily: theme.fonts.bold }
});
