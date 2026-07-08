import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
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
  const { error, loading, saveManualQuote, selectedDealer } = useDealDeskApp();
  const router = useRouter();
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
        <Text style={styles.title}>Manual quote</Text>
        <Card>
          <Text style={styles.body}>Open a dealer before entering a manual quote.</Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Manual quote</Text>
      <Text style={styles.muted}>Selected dealer: {selectedDealer.name}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {validationError ? <Text style={styles.error}>{validationError}</Text> : null}

      <Card>
        <Text style={styles.kicker}>Core quote</Text>
        {moneyFields.map(([label, key]) => (
          <TextInput
            key={key}
            accessibilityLabel={label}
            keyboardType="decimal-pad"
            onChangeText={(value) => updateNumber(key, value)}
            placeholder={label}
            style={styles.input}
            value={numbers[key]}
          />
        ))}
      </Card>

      <Card>
        <Text style={styles.kicker}>Financing</Text>
        {financeFields.map(([label, key]) => (
          <TextInput
            key={key}
            accessibilityLabel={label}
            keyboardType="decimal-pad"
            onChangeText={(value) => updateNumber(key, value)}
            placeholder={label}
            style={styles.input}
            value={numbers[key]}
          />
        ))}
      </Card>

      <Card>
        <Text style={styles.kicker}>Add-ons</Text>
        {addOns.map((addOn, index) => (
          <View key={index} style={styles.addOnRow}>
            <TextInput
              accessibilityLabel={`Add-on ${index + 1} name`}
              onChangeText={(value) => updateAddOn(index, { name: value })}
              placeholder="Name"
              style={[styles.input, styles.addOnName]}
              value={addOn.name}
            />
            <TextInput
              accessibilityLabel={`Add-on ${index + 1} amount`}
              keyboardType="decimal-pad"
              onChangeText={(value) => updateAddOn(index, { amount: value })}
              placeholder="Amount"
              style={[styles.input, styles.addOnAmount]}
              value={addOn.amount}
            />
            <Pressable accessibilityRole="button" onPress={() => updateAddOn(index, { required: !addOn.required })} style={styles.smallButton}>
              <Text style={styles.smallButtonText}>{addOn.required ? "Req" : "Opt"}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setAddOns((current) => current.filter((_, currentIndex) => currentIndex !== index))} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>-</Text>
            </Pressable>
          </View>
        ))}
        <Pressable accessibilityRole="button" onPress={() => setAddOns((current) => [...current, { name: "", amount: "", required: false }])} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Add add-on</Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={styles.kicker}>Completeness</Text>
        <View style={styles.segmentRow}>
          {completenessOptions.map((option) => (
            <Pressable key={option} accessibilityRole="button" onPress={() => setQuoteCompleteness(option)} style={[styles.segment, quoteCompleteness === option && styles.segmentActive]}>
              <Text style={[styles.segmentText, quoteCompleteness === option && styles.segmentTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          accessibilityLabel="Quote notes"
          multiline
          onChangeText={setSourceText}
          placeholder="Notes or original quote text"
          style={styles.textarea}
          value={sourceText}
        />
      </Card>

      <Pressable accessibilityRole="button" disabled={loading} onPress={save} style={[styles.button, loading && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>{loading ? "Saving..." : "Save Manual Quote"}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 26, fontWeight: "900" },
  kicker: { color: theme.colors.muted, fontSize: 13, fontWeight: "800", textTransform: "uppercase" },
  body: { color: theme.colors.text, fontSize: 16, lineHeight: 22 },
  muted: { color: theme.colors.muted },
  error: { color: theme.colors.danger, fontWeight: "700" },
  input: { borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, color: theme.colors.text, minHeight: 44, paddingHorizontal: 12 },
  textarea: { borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, color: theme.colors.text, minHeight: 110, padding: 12, textAlignVertical: "top" },
  addOnRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  addOnName: { flex: 1.4 },
  addOnAmount: { flex: 1 },
  button: { alignItems: "center", backgroundColor: theme.colors.primary, borderRadius: theme.radius, minHeight: 48, justifyContent: "center" },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: "#fff", fontWeight: "800" },
  secondaryButton: { alignItems: "center", borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, minHeight: 44, justifyContent: "center" },
  secondaryText: { color: theme.colors.text, fontWeight: "800" },
  smallButton: { alignItems: "center", backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius, minHeight: 42, justifyContent: "center", width: 48 },
  smallButtonText: { color: theme.colors.primary, fontWeight: "800" },
  iconButton: { alignItems: "center", borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, minHeight: 42, justifyContent: "center", width: 36 },
  iconButtonText: { color: theme.colors.text, fontSize: 20, fontWeight: "800" },
  segmentRow: { flexDirection: "row", gap: 8 },
  segment: { alignItems: "center", borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, flex: 1, minHeight: 42, justifyContent: "center" },
  segmentActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  segmentText: { color: theme.colors.text, fontWeight: "800" },
  segmentTextActive: { color: "#fff" }
});
