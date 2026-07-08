import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { AiBadge } from "../components/AiBadge";
import { AiOutputCard } from "../components/AiOutputCard";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { EmptyStateCard } from "../components/EmptyStateCard";
import { InsightCard } from "../components/InsightCard";
import { PageHeader } from "../components/PageHeader";
import { Reveal } from "../components/Reveal";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import type { VehicleCapture } from "../types/domain";
import { theme } from "../theme/theme";

function numOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// Editable review for a captured listing. The user confirms/edits the pre-filled
// fields before it is saved as a Vehicle.
function ListingReview({ capture }: { capture: VehicleCapture }) {
  const { confirmVehicleCapture, discardVehicleCapture, error, loading } = useDealDeskApp();
  const router = useRouter();
  const v = capture.vehicle;
  const [fields, setFields] = useState({
    year: v.year != null ? String(v.year) : "",
    make: v.make ?? "",
    model: v.model ?? "",
    trim: v.trim ?? "",
    vin: v.vin ?? "",
    stockNumber: v.stockNumber ?? "",
    listedPrice: v.listedPrice != null ? String(v.listedPrice) : "",
    exteriorColor: v.exteriorColor ?? ""
  });

  function update(key: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    const ok = await confirmVehicleCapture({
      year: numOrUndefined(fields.year),
      make: fields.make.trim() || undefined,
      model: fields.model.trim() || undefined,
      trim: fields.trim.trim() || undefined,
      vin: fields.vin.trim() || undefined,
      stockNumber: fields.stockNumber.trim() || undefined,
      listedPrice: numOrUndefined(fields.listedPrice),
      exteriorColor: fields.exteriorColor.trim() || undefined,
      listingUrl: capture.vehicle.listingUrl
    });
    if (ok) router.replace("/dealers");
  }

  const textFields: [string, keyof typeof fields, boolean][] = [
    ["Year", "year", true],
    ["Make", "make", false],
    ["Model", "model", false],
    ["Trim", "trim", false],
    ["VIN", "vin", false],
    ["Stock number", "stockNumber", false],
    ["Listed price", "listedPrice", true],
    ["Exterior color", "exteriorColor", false]
  ];

  return (
    <Screen>
      <PageHeader title="Review captured car" description="Check the details, edit anything that's off, then save. DealDesk pre-filled everything it could read from the listing." right={<AiBadge />} />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {capture.warnings.length ? (
        <Section title="Heads up" divider={false}>
          {capture.warnings.map((warning) => <Badge key={warning} label={warning} tone="warning" />)}
        </Section>
      ) : null}

      <AiOutputCard title="Extracted from listing" confidence={capture.confidence}>
        {textFields.map(([label, key, numeric], index) => (
          <Reveal key={key} delay={index * 60}>
            <TextInput
              accessibilityLabel={label}
              keyboardType={numeric ? "decimal-pad" : "default"}
              onChangeText={(value) => update(key, value)}
              placeholder={label}
              placeholderTextColor={theme.colors.faint}
              style={styles.input}
              value={fields[key]}
            />
          </Reveal>
        ))}
      </AiOutputCard>

      <View style={styles.actions}>
        <Button label={loading ? "Saving..." : "Save car"} disabled={loading} onPress={save} />
        <Button label="Discard" variant="secondary" disabled={loading} onPress={discardVehicleCapture} />
      </View>
    </Screen>
  );
}

export function ReviewAIExtractionScreen() {
  const { confirmPendingExtraction, error, loading, pendingExtraction, pendingVehicleCapture } = useDealDeskApp();

  if (pendingVehicleCapture) return <ListingReview capture={pendingVehicleCapture} />;

  if (!pendingExtraction) {
    return (
      <Screen>
        <PageHeader title="Review AI extraction" description="After you add a dealer update, the extracted numbers land here for you to confirm." right={<AiBadge />} />
        <EmptyStateCard icon="document-text-outline" title="No extraction is waiting for review." description="Head to Add update, paste a dealer's message, and DealDesk will pull out the offer for you to check here." />
      </Screen>
    );
  }
  return (
    <Screen>
      <PageHeader title="Review AI extraction" description="Confirm what DealDesk read from the dealer's message. Edit anything that's off before saving." right={<AiBadge />} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AiOutputCard title="Extracted from message">
        <Text style={styles.kicker}>Dealer</Text>
        <Text style={styles.body}>{pendingExtraction.dealer.name ?? "Unknown dealer"} · {pendingExtraction.dealer.salespersonName ?? "Unknown salesperson"}</Text>
        <Text style={styles.kicker}>Vehicle</Text>
        <Text style={styles.body}>{pendingExtraction.vehicle.year} {pendingExtraction.vehicle.make} {pendingExtraction.vehicle.model} {pendingExtraction.vehicle.trim}</Text>
        <Text style={styles.kicker}>Offer</Text>
        <Text style={styles.body}>{pendingExtraction.offer.otdPrice ? `$${pendingExtraction.offer.otdPrice.toLocaleString()} OTD` : "OTD missing"} · {pendingExtraction.offer.sellingPrice ? `$${pendingExtraction.offer.sellingPrice.toLocaleString()} selling` : "Selling price missing"}</Text>
      </AiOutputCard>
      <Section title="Red flags">
        {pendingExtraction.redFlags.length ? pendingExtraction.redFlags.map((flag) => <Badge key={flag} label={flag} tone="danger" />) : <Text style={styles.body}>No red flags returned.</Text>}
      </Section>
      <Section title="Missing info">
        {pendingExtraction.missingInfo.length ? pendingExtraction.missingInfo.map((item) => <Badge key={item} label={item} tone="warning" />) : <Text style={styles.body}>No missing info returned.</Text>}
      </Section>
      <InsightCard title="Suggested next step">{pendingExtraction.suggestedNextStep}</InsightCard>
      <Section title="Suggested reply">
        <Text style={styles.body}>{pendingExtraction.suggestedReply}</Text>
      </Section>
      <View style={styles.actions}>
        <Button label={loading ? "Saving..." : "Save"} disabled={loading} onPress={confirmPendingExtraction} />
        {["Edit", "Ask AI what to say", "Discard"].map((label) => <Button key={label} label={label} variant="secondary" />)}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { ...theme.typography.label, color: theme.colors.muted, textTransform: "uppercase" },
  body: { ...theme.typography.body, color: theme.colors.text },
  error: { ...theme.typography.body, color: theme.colors.danger, fontFamily: theme.fonts.semibold },
  input: { ...theme.typography.body, backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, color: theme.colors.text, minHeight: 44, paddingHorizontal: theme.spacing.md },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }
});
