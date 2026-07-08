import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../components/Button";
import { MakePicker } from "../components/MakePicker";
import { PageHeader } from "../components/PageHeader";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { SegmentGroup } from "../components/SegmentGroup";
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
      <PageHeader title="Search setup" description="Tell DealDesk exactly what you're shopping for and where. This drives dealer discovery and every out-the-door comparison." />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {validationError ? <Text style={styles.error}>{validationError}</Text> : null}
      <Section title="Vehicle" divider={false}>
        <TextInput accessibilityLabel="Year" value={form.year} onChangeText={(value) => update("year", value)} keyboardType="number-pad" placeholder="Year" placeholderTextColor={theme.colors.faint} style={styles.input} />
        <MakePicker value={form.make} onChange={(value) => update("make", value)} />
        <TextInput accessibilityLabel="Model" value={form.model} onChangeText={(value) => update("model", value)} placeholder="Model" placeholderTextColor={theme.colors.faint} style={styles.input} />
        <TextInput accessibilityLabel="Trim" value={form.trim} onChangeText={(value) => update("trim", value)} placeholder="Trim" placeholderTextColor={theme.colors.faint} style={styles.input} />
      </Section>
      <Section title="Search area and targets">
        <TextInput accessibilityLabel="ZIP" value={form.zipCode} onChangeText={(value) => update("zipCode", value)} keyboardType="number-pad" placeholder="ZIP" placeholderTextColor={theme.colors.faint} style={styles.input} />
        <TextInput accessibilityLabel="Radius" value={form.searchRadiusMiles} onChangeText={(value) => update("searchRadiusMiles", value)} keyboardType="number-pad" placeholder="Radius miles" placeholderTextColor={theme.colors.faint} style={styles.input} />
        <TextInput accessibilityLabel="Target selling price" value={form.targetSellingPrice} onChangeText={(value) => update("targetSellingPrice", value)} keyboardType="number-pad" placeholder="Target selling price" placeholderTextColor={theme.colors.faint} style={styles.input} />
        <TextInput accessibilityLabel="Target OTD" value={form.targetOtdPrice} onChangeText={(value) => update("targetOtdPrice", value)} keyboardType="number-pad" placeholder="Target OTD" placeholderTextColor={theme.colors.faint} style={styles.input} />
      </Section>
      <Section title="Strategy">
        <View style={styles.row}>
          <Pressable accessibilityRole="button" onPress={() => setWillingToTravel(!willingToTravel)} style={styles.secondary}><Text style={styles.secondaryText}>{willingToTravel ? "Travel: yes" : "Travel: no"}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setWillingToShip(!willingToShip)} style={styles.secondary}><Text style={styles.secondaryText}>{willingToShip ? "Ship: yes" : "Ship: no"}</Text></Pressable>
        </View>
        <Text style={styles.label}>Trade</Text>
        <SegmentGroup options={tradeOptions.map((option) => ({ label: option, value: option }))} value={form.tradeInStrategy} onChange={(value) => update("tradeInStrategy", value)} labelPrefix="Trade" />
        <Text style={styles.label}>Financing</Text>
        <SegmentGroup options={financingOptions.map((option) => ({ label: option, value: option }))} value={form.financingStrategy} onChange={(value) => update("financingStrategy", value)} labelPrefix="Financing" />
        <Text style={styles.label}>Status</Text>
        <SegmentGroup options={statusOptions.map((option) => ({ label: option, value: option }))} value={form.status} onChange={(value) => update("status", value)} labelPrefix="Status" />
      </Section>
      <Button label={loading ? "Saving..." : "Save Search"} disabled={loading} onPress={save} accessibilityLabel="Save Search" style={styles.selfStart} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...theme.typography.subtitle, color: theme.colors.text },
  selfStart: { alignSelf: "flex-start" },
  input: { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, color: theme.colors.text, minHeight: 46, paddingHorizontal: theme.spacing.md },
  row: { flexDirection: "row", gap: theme.spacing.sm },
  secondary: { alignItems: "center", backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, flex: 1, minHeight: 44, justifyContent: "center" },
  secondaryText: { ...theme.typography.subtitle, color: theme.colors.text },
  error: { ...theme.typography.caption, color: theme.colors.danger }
});
