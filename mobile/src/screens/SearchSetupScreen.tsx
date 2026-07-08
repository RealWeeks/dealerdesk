import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { theme } from "../theme/theme";
import type { CarSearch } from "../types/domain";

type SearchSetupForm = {
  year: string;
  make: string;
  model: string;
  trim: string;
  zipCode: string;
  searchRadiusMiles: string;
  targetSellingPrice: string;
  targetOtdPrice: string;
  tradeInStrategy: NonNullable<CarSearch["tradeInStrategy"]>;
  financingStrategy: NonNullable<CarSearch["financingStrategy"]>;
  status: CarSearch["status"];
};

const requiredDefaults: SearchSetupForm = {
  year: "2026",
  make: "Lexus",
  model: "RX 350h",
  trim: "Premium AWD",
  zipCode: "04101",
  searchRadiusMiles: "150",
  targetSellingPrice: "",
  targetOtdPrice: "62000",
  tradeInStrategy: "separate",
  financingStrategy: "separate",
  status: "active"
};

const tradeOptions: NonNullable<CarSearch["tradeInStrategy"]>[] = ["separate", "included", "none"];
const financingOptions: NonNullable<CarSearch["financingStrategy"]>[] = ["separate", "included", "cash"];
const statusOptions: CarSearch["status"][] = ["active", "paused", "purchased"];

function optionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function SearchSetupScreen() {
  const { activeSearch, error, loading, saveSearch } = useDealDeskApp();
  const router = useRouter();
  const [form, setForm] = useState(requiredDefaults);
  const [willingToTravel, setWillingToTravel] = useState(true);
  const [willingToShip, setWillingToShip] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSearch) return;
    setForm({
      year: String(activeSearch.year),
      make: activeSearch.make,
      model: activeSearch.model,
      trim: activeSearch.trim,
      zipCode: activeSearch.zipCode,
      searchRadiusMiles: String(activeSearch.searchRadiusMiles),
      targetSellingPrice: activeSearch.targetSellingPrice ? String(activeSearch.targetSellingPrice) : "",
      targetOtdPrice: activeSearch.targetOtdPrice ? String(activeSearch.targetOtdPrice) : "",
      tradeInStrategy: activeSearch.tradeInStrategy ?? "separate",
      financingStrategy: activeSearch.financingStrategy ?? "separate",
      status: activeSearch.status
    });
    setWillingToTravel(activeSearch.willingToTravel ?? true);
    setWillingToShip(activeSearch.willingToShip ?? false);
  }, [activeSearch]);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setValidationError(null);
    const year = Number(form.year);
    const searchRadiusMiles = Number(form.searchRadiusMiles);
    const targetSellingPrice = optionalNumber(form.targetSellingPrice);
    const targetOtdPrice = optionalNumber(form.targetOtdPrice);
    if (!year || !form.make.trim() || !form.model.trim() || !form.trim.trim() || form.zipCode.length < 5 || !searchRadiusMiles || searchRadiusMiles <= 0) {
      setValidationError("Year, make, model, trim, ZIP, and radius are required.");
      return;
    }
    if (Number.isNaN(targetSellingPrice) || Number.isNaN(targetOtdPrice)) {
      setValidationError("Target prices must be numbers.");
      return;
    }
    const saved = await saveSearch({
      year,
      make: form.make.trim(),
      model: form.model.trim(),
      trim: form.trim.trim(),
      zipCode: form.zipCode.trim(),
      searchRadiusMiles,
      targetSellingPrice,
      targetOtdPrice,
      willingToTravel,
      willingToShip,
      tradeInStrategy: form.tradeInStrategy,
      financingStrategy: form.financingStrategy,
      status: form.status
    });
    if (saved) router.replace("/home");
  }

  return (
    <Screen>
      <Text style={styles.title}>Search setup</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {validationError ? <Text style={styles.error}>{validationError}</Text> : null}
      <Card>
        <Text style={styles.kicker}>Vehicle</Text>
        <TextInput accessibilityLabel="Year" value={form.year} onChangeText={(value) => update("year", value)} keyboardType="number-pad" placeholder="Year" style={styles.input} />
        <TextInput accessibilityLabel="Make" value={form.make} onChangeText={(value) => update("make", value)} placeholder="Make" style={styles.input} />
        <TextInput accessibilityLabel="Model" value={form.model} onChangeText={(value) => update("model", value)} placeholder="Model" style={styles.input} />
        <TextInput accessibilityLabel="Trim" value={form.trim} onChangeText={(value) => update("trim", value)} placeholder="Trim" style={styles.input} />
      </Card>
      <Card>
        <Text style={styles.kicker}>Search area and targets</Text>
        <TextInput accessibilityLabel="ZIP" value={form.zipCode} onChangeText={(value) => update("zipCode", value)} keyboardType="number-pad" placeholder="ZIP" style={styles.input} />
        <TextInput accessibilityLabel="Radius" value={form.searchRadiusMiles} onChangeText={(value) => update("searchRadiusMiles", value)} keyboardType="number-pad" placeholder="Radius miles" style={styles.input} />
        <TextInput accessibilityLabel="Target selling price" value={form.targetSellingPrice} onChangeText={(value) => update("targetSellingPrice", value)} keyboardType="number-pad" placeholder="Target selling price" style={styles.input} />
        <TextInput accessibilityLabel="Target OTD" value={form.targetOtdPrice} onChangeText={(value) => update("targetOtdPrice", value)} keyboardType="number-pad" placeholder="Target OTD" style={styles.input} />
      </Card>
      <Card>
        <Text style={styles.kicker}>Strategy</Text>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" onPress={() => setWillingToTravel(!willingToTravel)} style={styles.secondary}><Text style={styles.secondaryText}>{willingToTravel ? "Travel: yes" : "Travel: no"}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setWillingToShip(!willingToShip)} style={styles.secondary}><Text style={styles.secondaryText}>{willingToShip ? "Ship: yes" : "Ship: no"}</Text></Pressable>
        </View>
        <Text style={styles.label}>Trade</Text>
        <View style={styles.segmentRow}>
          {tradeOptions.map((option) => (
            <Pressable key={option} accessibilityRole="button" onPress={() => update("tradeInStrategy", option)} style={[styles.segment, form.tradeInStrategy === option && styles.segmentActive]}>
              <Text style={[styles.segmentText, form.tradeInStrategy === option && styles.segmentTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Financing</Text>
        <View style={styles.segmentRow}>
          {financingOptions.map((option) => (
            <Pressable key={option} accessibilityRole="button" onPress={() => update("financingStrategy", option)} style={[styles.segment, form.financingStrategy === option && styles.segmentActive]}>
              <Text style={[styles.segmentText, form.financingStrategy === option && styles.segmentTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Status</Text>
        <View style={styles.segmentRow}>
          {statusOptions.map((option) => (
            <Pressable key={option} accessibilityRole="button" onPress={() => update("status", option)} style={[styles.segment, form.status === option && styles.segmentActive]}>
              <Text style={[styles.segmentText, form.status === option && styles.segmentTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
      <Pressable accessibilityRole="button" disabled={loading} onPress={save} style={styles.button}><Text style={styles.buttonText}>{loading ? "Saving..." : "Save Search"}</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 26, fontWeight: "900" },
  kicker: { color: theme.colors.muted, fontWeight: "800" },
  label: { color: theme.colors.text, fontWeight: "800" },
  input: { borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, minHeight: 46, paddingHorizontal: 12 },
  row: { flexDirection: "row", gap: 10 },
  segmentRow: { flexDirection: "row", gap: 8 },
  segment: { alignItems: "center", borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, flex: 1, minHeight: 42, justifyContent: "center" },
  segmentActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  segmentText: { color: theme.colors.text, fontWeight: "800" },
  segmentTextActive: { color: "#fff" },
  button: { alignItems: "center", backgroundColor: theme.colors.primary, borderRadius: theme.radius, minHeight: 48, justifyContent: "center" },
  buttonText: { color: "#fff", fontWeight: "800" },
  secondary: { alignItems: "center", borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, flex: 1, minHeight: 44, justifyContent: "center" },
  secondaryText: { color: theme.colors.text, fontWeight: "800" },
  error: { color: theme.colors.danger, fontWeight: "700" }
});
