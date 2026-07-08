import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { AiBadge } from "../components/AiBadge";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { GuidedPageHeader } from "../components/PageHeader";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { ReviewAIExtractionScreen } from "./ReviewAIExtractionScreen";
import { theme } from "../theme/theme";

const EXTRACTS = [
  "Selling price, taxes, fees, and true out-the-door total",
  "Add-ons and anything that looks like a red flag",
  "The dealer's ask and a suggested next step"
];

export function AddUpdateScreen() {
  const [rawText, setRawText] = useState("");
  const { error, loading, parseDealerMessage, pendingExtraction, selectedDealer } = useDealDeskApp();
  const router = useRouter();
  if (pendingExtraction) return <ReviewAIExtractionScreen />;

  return (
    <Screen>
      <GuidedPageHeader
        title="Add dealer update"
        description="Paste a dealer's email, text, or call notes and DealDesk reads it for you — pulling out prices, fees, and the next step to review before anything is saved."
        status={
          selectedDealer ? (
            <View style={styles.selectedRow}>
              <Ionicons name="storefront-outline" size={16} color={theme.colors.muted} />
              <Text style={styles.selectedText}>Selected dealer: {selectedDealer.name}</Text>
            </View>
          ) : (
            <Text style={styles.muted}>Open a dealer from the Dealers tab before parsing a message.</Text>
          )
        }
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <View style={styles.kickerRow}>
          <Text style={styles.kicker}>Paste dealer message</Text>
          <AiBadge label="AI" />
        </View>
        <TextInput accessibilityLabel="Dealer message" multiline value={rawText} onChangeText={setRawText} placeholder="Paste email, text, or call notes..." placeholderTextColor={theme.colors.faint} style={styles.textarea} />
        <View style={styles.extractList}>
          <Text style={styles.extractHeading}>What DealDesk will pull out</Text>
          {EXTRACTS.map((item) => (
            <View key={item} style={styles.extractRow}>
              <Ionicons name="checkmark-circle-outline" size={15} color={theme.colors.accent} />
              <Text style={styles.extractText}>{item}</Text>
            </View>
          ))}
        </View>
        <Button label={loading ? "Reading..." : "Review AI extraction"} disabled={!selectedDealer || !rawText || loading} onPress={() => parseDealerMessage(rawText)} style={styles.selfStart} />
      </Card>

      <Section title="Dictate a call note" right={<Badge label="Coming soon" tone="neutral" />}>
        <Text style={styles.muted}>Soon you'll be able to talk through a call and let DealDesk transcribe and extract it. For now, paste your notes above.</Text>
      </Section>

      <Section title="Prefer to type the numbers?">
        <Text style={styles.muted}>If the dealer already gave you clean figures, skip the AI step and enter the quote directly.</Text>
        <Button label="Enter quote manually" variant="secondary" size="sm" disabled={!selectedDealer} onPress={() => router.replace("/manual-quote")} style={styles.selfStart} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  selectedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  selectedText: { ...theme.typography.body, color: theme.colors.text },
  kicker: { ...theme.typography.label, color: theme.colors.muted, textTransform: "uppercase" },
  kickerRow: { alignItems: "center", flexDirection: "row", gap: theme.spacing.sm, justifyContent: "space-between" },
  muted: { ...theme.typography.body, color: theme.colors.muted },
  error: { ...theme.typography.body, color: theme.colors.danger, fontFamily: theme.fonts.semibold },
  textarea: { ...theme.typography.body, backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, color: theme.colors.text, minHeight: 140, padding: theme.spacing.md, textAlignVertical: "top" },
  extractList: { gap: 6, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.md, padding: theme.spacing.md },
  extractHeading: { ...theme.typography.caption, color: theme.colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  extractRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  extractText: { ...theme.typography.body, color: theme.colors.text, flex: 1 },
  selfStart: { alignSelf: "flex-start" }
});
