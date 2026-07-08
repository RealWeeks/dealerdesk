import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../components/Button";
import { EmptyStateCard } from "../components/EmptyStateCard";
import { PageHeader } from "../components/PageHeader";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { SegmentGroup } from "../components/SegmentGroup";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { theme } from "../theme/theme";
import type { Offer } from "../types/domain";

type AddOnRow = { name: string; amount: string; required: boolean };

const moneyFields = [
  ["MSRP", "msrp"],
  ["Selling price", "sellingPrice"],
  ["Dealer discount", "dealerDiscount"],
  ["Incentives", "incentives"],
  ["Doc fee", "docFee"],
  ["Tax", "tax"],
  ["Title/registration", "titleRegistration"],
  ["Delivery fee", "deliveryFee"],
  ["Trade allowance", "tradeAllowance"],
  ["Payoff", "payoff"],
  ["Down payment", "downPayment"],
  ["OTD price", "otdPrice"]
] as const;

const financeFields = [
  ["APR", "apr"],
  ["Term months", "termMonths"],
  ["Monthly payment", "monthlyPayment"]
] as const;

type NumericKey = (typeof moneyFields)[number][1] | (typeof financeFields)[number][1];

const completenessOptions: Offer["quoteCompleteness"][] = ["complete", "partial", "unclear"];

function optionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function ManualQuoteScreen() {
  const { error, loading, saveManualQuote, selectedDealer, vehicles } = useDealDeskApp();
  const router = useRouter();
  const dealerVehicles = vehicles.filter((vehicle) => vehicle.dealerId === selectedDealer?._id);
  const [vehicleId, setVehicleId] = useState<string | undefined>(selectedDealer?.focusVehicleId);
  const [numbers, setNumbers] = useState<Record<NumericKey, string>>({
    msrp: "",
    sellingPrice: "",
    dealerDiscount: "",
    incentives: "",
    docFee: "",
    tax: "",
    titleRegistration: "",
    deliveryFee: "",
    tradeAllowance: "",
    payoff: "",
    downPayment: "",
    otdPrice: "",
    apr: "",
    termMonths: "",
    monthlyPayment: ""
  });
  const [addOns, setAddOns] = useState<AddOnRow[]>([{ name: "", amount: "", required: false }]);
  const [quoteCompleteness, setQuoteCompleteness] = useState<Offer["quoteCompleteness"]>("partial");
  const [sourceText, setSourceText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  function updateNumber(key: NumericKey, value: string) {
    setNumbers((current) => ({ ...current, [key]: value }));
  }

  function updateAddOn(index: number, patch: Partial<AddOnRow>) {
    setAddOns((current) => current.map((addOn, currentIndex) => currentIndex === index ? { ...addOn, ...patch } : addOn));
  }

  function buildOffer() {
    const numericEntries = Object.entries(numbers).map(([key, value]) => [key, optionalNumber(value)] as const);
    if (numericEntries.some(([, value]) => Number.isNaN(value))) return null;
    const payload = Object.fromEntries(numericEntries.filter(([, value]) => value !== undefined));
    const parsedAddOns = addOns
      .filter((addOn) => addOn.name.trim())
      .map((addOn) => ({ name: addOn.name.trim(), amount: optionalNumber(addOn.amount), required: addOn.required }));
    if (parsedAddOns.some((addOn) => Number.isNaN(addOn.amount))) return null;
    return {
      ...payload,
      vehicleId,
      addOns: parsedAddOns,
      quoteCompleteness,
      sourceText: sourceText.trim() || undefined
    } as Omit<Offer, "_id" | "dealerId" | "sourceType">;
  }

  async function save() {
    setValidationError(null);
    const offer = buildOffer();
    if (!offer) {
      setValidationError("Use numbers only for quote amounts, APR, terms, and add-on amounts.");
      return;
    }
    if (!offer.otdPrice && !offer.sellingPrice && !offer.msrp && !sourceText.trim()) {
      setValidationError("Add at least one quote number or source note.");
      return;
    }
    const saved = await saveManualQuote(offer);
    if (saved) router.replace("/offers");
  }

  if (!selectedDealer) {
    return (
      <Screen>
        <PageHeader title="Manual quote" description="Enter a dealer's numbers by hand when you already have clean figures." />
        <EmptyStateCard icon="storefront-outline" title="Open a dealer first" description="Open a dealer from the Dealers tab, then come back to enter a manual quote for them." />
      </Screen>
    );
  }

  const vehicleOptions = [
    { label: "None", value: "__none__" },
    ...dealerVehicles.map((vehicle) => ({
      label: [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || vehicle.stockNumber || "Car",
      value: vehicle._id
    }))
  ];

  return (
    <Screen>
      <PageHeader
        title="Manual quote"
        description={`Enter the dealer's numbers for ${selectedDealer.name}. DealDesk normalizes them into a true out-the-door price you can compare.`}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {validationError ? <Text style={styles.error}>{validationError}</Text> : null}

      {dealerVehicles.length ? (
        <Section title="Car this quote is for" divider={false}>
          <SegmentGroup options={vehicleOptions} value={vehicleId ?? "__none__"} onChange={(value) => setVehicleId(value === "__none__" ? undefined : value)} labelPrefix="Car" />
        </Section>
      ) : null}

      <Section title="Core quote" divider={false}>
        {moneyFields.map(([label, key]) => (
          <TextInput
            key={key}
            accessibilityLabel={label}
            keyboardType="decimal-pad"
            onChangeText={(value) => updateNumber(key, value)}
            placeholder={label}
            placeholderTextColor={theme.colors.faint}
            style={styles.input}
            value={numbers[key]}
          />
        ))}
      </Section>

      <Section title="Financing">
        {financeFields.map(([label, key]) => (
          <TextInput
            key={key}
            accessibilityLabel={label}
            keyboardType="decimal-pad"
            onChangeText={(value) => updateNumber(key, value)}
            placeholder={label}
            placeholderTextColor={theme.colors.faint}
            style={styles.input}
            value={numbers[key]}
          />
        ))}
      </Section>

      <Section title="Add-ons">
        {addOns.map((addOn, index) => (
          <View key={index} style={styles.addOnRow}>
            <TextInput
              accessibilityLabel={`Add-on ${index + 1} name`}
              onChangeText={(value) => updateAddOn(index, { name: value })}
              placeholder="Name"
              placeholderTextColor={theme.colors.faint}
              style={[styles.input, styles.addOnName]}
              value={addOn.name}
            />
            <TextInput
              accessibilityLabel={`Add-on ${index + 1} amount`}
              keyboardType="decimal-pad"
              onChangeText={(value) => updateAddOn(index, { amount: value })}
              placeholder="Amount"
              placeholderTextColor={theme.colors.faint}
              style={[styles.input, styles.addOnAmount]}
              value={addOn.amount}
            />
            <Pressable accessibilityRole="button" accessibilityLabel={`Toggle add-on ${index + 1} required`} onPress={() => updateAddOn(index, { required: !addOn.required })} style={styles.smallButton}>
              <Text style={styles.smallButtonText}>{addOn.required ? "Req" : "Opt"}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove add-on ${index + 1}`} onPress={() => setAddOns((current) => current.filter((_, currentIndex) => currentIndex !== index))} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>-</Text>
            </Pressable>
          </View>
        ))}
        <Pressable accessibilityRole="button" onPress={() => setAddOns((current) => [...current, { name: "", amount: "", required: false }])} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Add add-on</Text>
        </Pressable>
      </Section>

      <Section title="Completeness">
        <SegmentGroup options={completenessOptions.map((option) => ({ label: option, value: option }))} value={quoteCompleteness} onChange={(value) => setQuoteCompleteness(value as Offer["quoteCompleteness"])} labelPrefix="Completeness" />
        <TextInput
          accessibilityLabel="Quote notes"
          multiline
          onChangeText={setSourceText}
          placeholder="Notes or original quote text"
          placeholderTextColor={theme.colors.faint}
          style={styles.textarea}
          value={sourceText}
        />
      </Section>

      <Button label={loading ? "Saving..." : "Save Manual Quote"} disabled={loading} onPress={save} accessibilityLabel="Save Manual Quote" style={styles.selfStart} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  selfStart: { alignSelf: "flex-start" },
  error: { ...theme.typography.caption, color: theme.colors.danger },
  input: { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, color: theme.colors.text, minHeight: 44, paddingHorizontal: theme.spacing.md },
  textarea: { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, color: theme.colors.text, minHeight: 110, padding: theme.spacing.md, textAlignVertical: "top" },
  addOnRow: { alignItems: "center", flexDirection: "row", gap: theme.spacing.sm },
  addOnName: { flex: 1.4 },
  addOnAmount: { flex: 1 },
  secondaryButton: { alignItems: "center", backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, minHeight: 44, justifyContent: "center" },
  secondaryText: { ...theme.typography.subtitle, color: theme.colors.text },
  smallButton: { alignItems: "center", backgroundColor: theme.colors.primarySoft, borderRadius: theme.radii.md, minHeight: 42, justifyContent: "center", width: 48 },
  smallButtonText: { ...theme.typography.subtitle, color: theme.colors.primary },
  iconButton: { alignItems: "center", backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, minHeight: 42, justifyContent: "center", width: 36 },
  iconButtonText: { color: theme.colors.text, fontSize: 20, fontWeight: "800" }
});
