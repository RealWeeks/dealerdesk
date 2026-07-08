import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { AiBadge } from "../components/AiBadge";
import { ActionBar } from "../components/ActionBar";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyStateCard } from "../components/EmptyStateCard";
import { InsightPanel } from "../components/InsightPanel";
import { NextBestActionCard } from "../components/NextBestActionCard";
import { GuidedPageHeader } from "../components/PageHeader";
import { RightRail } from "../components/RightRail";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";
import { TimelineSection } from "../components/Timeline";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import type { Vehicle } from "../types/domain";
import { theme } from "../theme/theme";

function carLabel(vehicle: Vehicle) {
  const base = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ") || "Car";
  return vehicle.stockNumber ? `${base} · #${vehicle.stockNumber}` : base;
}

export function DealerDetailScreen({ onBack }: { onBack?: () => void }) {
  const { activeSearch, createSuggestedFollowUp, generateInitialOutreach, generateReply, initialOutreach, loading, markOutreachContacted, markSelectedDealerContacted, offers, selectedDealer: dealer, setFocusVehicle, timeline, vehicles } = useDealDeskApp();
  const [initialMessage, setInitialMessage] = useState(initialOutreach?.messageText ?? "");
  const [initialNotes, setInitialNotes] = useState(initialOutreach?.strategyNotes ?? "");
  const [templateId, setTemplateId] = useState(initialOutreach?.templateId);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  if (!dealer) {
    return (
      <Screen>
        <GuidedPageHeader title="Dealer" description="Select a dealer to view details." />
      </Screen>
    );
  }
  const currentDealer = dealer;
  const dealerOffers = offers.filter((offer) => offer.dealerId === currentDealer._id);
  const dealerVehicles = vehicles.filter((vehicle) => vehicle.dealerId === currentDealer._id);
  const vehicleById = (id?: string) => dealerVehicles.find((vehicle) => vehicle._id === id);
  const searchContext = activeSearch ? `${activeSearch.year} ${activeSearch.make} ${activeSearch.model}` : undefined;

  async function generateInitialMessage() {
    const message = await generateInitialOutreach(currentDealer._id);
    if (message) {
      setInitialMessage(message.messageText);
      setInitialNotes(message.strategyNotes);
      setTemplateId(message.templateId);
      setCopied(false);
      setSaved(false);
    }
  }

  async function saveInitialMessage() {
    const text = initialMessage || (await generateInitialOutreach(currentDealer._id))?.messageText || "";
    if (!text) return;
    setInitialMessage(text);
    await markOutreachContacted([currentDealer._id], text, true, templateId);
    setSaved(true);
  }

  // State-based next best action.
  const next = dealerVehicles.length === 0
    ? { title: "Capture a specific car from this dealer", description: "Add a listing link or screenshot before outreach so DealDesk can draft a targeted message.", cta: { label: "Capture car", onPress: () => router.push("/capture-vehicle") } }
    : currentDealer.status === "not_contacted"
      ? { title: "Generate a first outreach message", description: "Draft a natural message referencing the captured car and ask for an itemized out-the-door price.", cta: { label: "Generate outreach", onPress: generateInitialMessage } }
      : { title: "Log the dealer's latest reply", description: "Paste their email, text, or quote and DealDesk will extract prices, fees, and next steps.", cta: { label: "Add update", onPress: () => router.replace("/ai") } };

  const timelineItems = timeline.map((item) => ({ id: item.id, type: item.type, title: item.title, time: new Date(item.occurredAt).toLocaleString(), summary: item.summary }));

  const summary = (
    <View style={styles.summary}>
      <View style={styles.badges}>
        <StatusBadge status={currentDealer.status} />
        <PriorityBadge priority={currentDealer.priority} />
      </View>
      <View style={styles.metaRow}>
        <View style={styles.meta}><Ionicons name="location-outline" size={14} color={theme.colors.muted} /><Text style={styles.metaText}>{currentDealer.city}, {currentDealer.state}</Text></View>
        {currentDealer.phone ? <View style={styles.meta}><Ionicons name="call-outline" size={14} color={theme.colors.muted} /><Text style={styles.metaText}>{currentDealer.phone}</Text></View> : null}
      </View>
    </View>
  );

  const rail = (
    <RightRail>
      <NextBestActionCard title={next.title} description={next.description} cta={{ label: next.cta.label, onPress: next.cta.onPress, disabled: loading }} />
      <InsightPanel title="Quick actions" icon="flash-outline">
        <ActionBar direction="column">
          <Button label="Generate Initial Outreach" variant="secondary" size="sm" disabled={loading} onPress={generateInitialMessage} />
          <Button label="Generate Reply" variant="secondary" size="sm" disabled={loading} onPress={async () => { await generateReply(); router.replace("/reply"); }} />
          <Button label="Add Update" variant="secondary" size="sm" onPress={() => router.replace("/ai")} />
          <Button label="Mark Contacted" variant="link" size="sm" disabled={loading} onPress={markSelectedDealerContacted} />
          <Button label="Add Follow-up" variant="link" size="sm" disabled={loading} onPress={createSuggestedFollowUp} />
        </ActionBar>
      </InsightPanel>
      {searchContext ? (
        <InsightPanel title="Dealer" icon="storefront-outline">
          <Text style={styles.railText}>Shopping: {searchContext}</Text>
        </InsightPanel>
      ) : null}
    </RightRail>
  );

  return (
    <Screen rail={rail}>
      {onBack ? <Button label="Back" variant="link" size="sm" onPress={onBack} style={styles.selfStart} /> : null}
      <GuidedPageHeader
        title={currentDealer.name}
        description="Track cars, quotes, messages, and next steps for this dealer."
        status={summary}
      />

      {initialMessage ? (
        <Card>
          <View style={styles.kickerRow}>
            <Text style={styles.kicker}>Initial outreach</Text>
            <AiBadge label="AI" />
          </View>
          <TextInput accessibilityLabel="Dealer initial outreach message" multiline value={initialMessage} onChangeText={setInitialMessage} style={styles.textarea} placeholderTextColor={theme.colors.faint} />
          {initialOutreach?.templateName ? <Text style={styles.body}>Template: {initialOutreach.templateName}</Text> : null}
          {initialOutreach?.usedWithThisDealer ? <Text style={styles.muted}>Used with this dealer before</Text> : null}
          {initialNotes ? <Text style={styles.muted}>{initialNotes}</Text> : null}
          <View style={styles.actions}>
            <Button label={copied ? "Copied" : "Copy"} variant="secondary" size="sm" onPress={async () => { await Clipboard.setStringAsync(initialMessage); setCopied(true); }} accessibilityLabel="Copy" />
            <Button label={saved ? "Saved" : "Save as sent"} size="sm" disabled={loading || !initialMessage} onPress={saveInitialMessage} accessibilityLabel="Save as sent" />
          </View>
        </Card>
      ) : null}

      <Section title="Cars" divider={false} right={<Button label="Capture car" variant="secondary" size="sm" onPress={() => router.push("/capture-vehicle")} />}>
        {dealerVehicles.length ? dealerVehicles.map((vehicle) => (
          <Pressable key={vehicle._id} accessibilityRole="button" accessibilityLabel={`Focus ${carLabel(vehicle)}`} disabled={loading} onPress={() => setFocusVehicle(vehicle._id)} style={styles.carRow}>
            <Text style={styles.body}>{carLabel(vehicle)}</Text>
            {currentDealer.focusVehicleId === vehicle._id ? <Badge label="Focus" tone="success" /> : <Text style={styles.muted}>Tap to focus</Text>}
          </Pressable>
        )) : (
          <EmptyStateCard icon="car-sport-outline" title="No cars captured yet" description="Paste a listing link or screenshot from this dealer. DealDesk will extract the trim, VIN, listed price, and dealer details." cta={{ label: "Capture car", onPress: () => router.push("/capture-vehicle") }} />
        )}
      </Section>

      <Section title="Offers">
        {dealerOffers.length ? dealerOffers.map((offer) => {
          const car = vehicleById(offer.vehicleId);
          return (
            <View key={offer._id} style={styles.offerRow}>
              <Text style={styles.body}>{car ? `${carLabel(car)} — ` : ""}{offer.otdPrice ? `$${offer.otdPrice.toLocaleString()} OTD` : "OTD missing"}</Text>
              <Text style={styles.muted}>{offer.quoteCompleteness}</Text>
            </View>
          );
        }) : (
          <EmptyStateCard icon="pricetags-outline" title="No offers yet" description="Paste a dealer quote or enter one manually. DealDesk will break out selling price, taxes, fees, add-ons, and true OTD price." cta={{ label: "Add quote", onPress: () => router.replace("/ai") }} />
        )}
      </Section>

      <Section title="Dealer timeline">
        {timelineItems.length ? (
          <TimelineSection items={timelineItems} />
        ) : (
          <EmptyStateCard icon="time-outline" title="No timeline yet" description="Once you capture a car, send outreach, or add a dealer reply, DealDesk will build a timeline here." />
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...theme.typography.body, color: theme.colors.text },
  kicker: { ...theme.typography.label, color: theme.colors.muted, textTransform: "uppercase" },
  muted: { ...theme.typography.caption, color: theme.colors.muted },
  railText: { ...theme.typography.body, color: theme.colors.muted },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  kickerRow: { alignItems: "center", flexDirection: "row", gap: theme.spacing.sm, justifyContent: "space-between" },
  selfStart: { alignSelf: "flex-start" },
  summary: { gap: theme.spacing.sm },
  badges: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: theme.spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: theme.spacing.md },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { ...theme.typography.body, color: theme.colors.muted },
  textarea: { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, color: theme.colors.text, minHeight: 160, padding: theme.spacing.md, textAlignVertical: "top" },
  carRow: { alignItems: "center", borderTopColor: theme.colors.divider, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: theme.spacing.sm },
  offerRow: { alignItems: "center", borderTopColor: theme.colors.divider, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: theme.spacing.sm }
});
