import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { theme } from "../theme/theme";

export function DealerDetailScreen({ onBack }: { onBack?: () => void }) {
  const { createSuggestedFollowUp, generateInitialOutreach, generateReply, initialOutreach, interactions, loading, markOutreachContacted, markSelectedDealerContacted, offers, selectedDealer: dealer, timeline } = useDealDeskApp();
  const [initialMessage, setInitialMessage] = useState(initialOutreach?.messageText ?? "");
  const [initialNotes, setInitialNotes] = useState(initialOutreach?.strategyNotes ?? "");
  const [templateId, setTemplateId] = useState(initialOutreach?.templateId);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  if (!dealer) {
    return (
      <Screen>
        <Text style={styles.title}>Dealer detail</Text>
        <Text style={styles.body}>Select a dealer to view details.</Text>
      </Screen>
    );
  }
  const currentDealer = dealer;
  const dealerOffers = offers.filter((offer) => offer.dealerId === currentDealer._id);
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

  return (
    <Screen>
      {onBack ? <Pressable accessibilityRole="button" onPress={onBack} style={styles.button}><Text style={styles.buttonText}>Back</Text></Pressable> : null}
      <Text style={styles.title}>{currentDealer.name}</Text>
      <Card>
        <Badge label={currentDealer.status.replace("_", " ")} tone="warning" />
        <Text style={styles.body}>{currentDealer.city}, {currentDealer.state} · {currentDealer.phone}</Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => router.replace("/ai")} style={styles.button}><Text style={styles.buttonText}>Add Update</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={loading} onPress={generateInitialMessage} style={styles.button}><Text style={styles.buttonText}>Generate Initial Outreach</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={loading} onPress={async () => { await generateReply(); router.replace("/reply"); }} style={styles.button}><Text style={styles.buttonText}>Generate Reply</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={loading} onPress={markSelectedDealerContacted} style={styles.button}><Text style={styles.buttonText}>Mark Contacted</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={loading} onPress={createSuggestedFollowUp} style={styles.button}><Text style={styles.buttonText}>Add Follow-up</Text></Pressable>
        </View>
      </Card>
      {initialMessage ? (
        <Card>
          <Text style={styles.kicker}>Initial outreach</Text>
          <TextInput accessibilityLabel="Dealer initial outreach message" multiline value={initialMessage} onChangeText={setInitialMessage} style={styles.textarea} />
          {initialOutreach?.templateName ? <Text style={styles.body}>Template: {initialOutreach.templateName}</Text> : null}
          {initialOutreach?.usedWithThisDealer ? <Text style={styles.muted}>Used with this dealer before</Text> : null}
          {initialNotes ? <Text style={styles.muted}>{initialNotes}</Text> : null}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={async () => { await Clipboard.setStringAsync(initialMessage); setCopied(true); }} style={styles.button}><Text style={styles.buttonText}>{copied ? "Copied" : "Copy"}</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={loading || !initialMessage} onPress={saveInitialMessage} style={styles.button}><Text style={styles.buttonText}>{saved ? "Saved" : "Save as sent"}</Text></Pressable>
          </View>
        </Card>
      ) : null}
      <Card>
        <Text style={styles.kicker}>Offers</Text>
        {dealerOffers.length ? dealerOffers.map((offer) => <Text key={offer._id} style={styles.body}>{offer.otdPrice ? `$${offer.otdPrice.toLocaleString()} OTD` : "OTD missing"} · {offer.quoteCompleteness}</Text>) : <Text style={styles.body}>No confirmed offers from this dealer yet.</Text>}
      </Card>
      <Card>
        <Text style={styles.kicker}>Interaction history</Text>
        {interactions.length ? interactions.map((interaction) => (
          <Text key={interaction._id} style={styles.body}>{interaction.direction}: {interaction.rawContent}</Text>
        )) : <Text style={styles.body}>No interactions saved yet.</Text>}
      </Card>
      <Card>
        <Text style={styles.kicker}>Timeline</Text>
        {timeline.length ? timeline.map((item) => (
          <View key={item.id} style={styles.timelineItem}>
            <Text style={styles.body}>{item.type}: {item.title}</Text>
            <Text style={styles.muted}>{new Date(item.occurredAt).toLocaleString()}</Text>
            {item.summary ? <Text style={styles.muted}>{item.summary}</Text> : null}
          </View>
        )) : <Text style={styles.body}>No timeline events yet.</Text>}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 26, fontWeight: "900" },
  body: { color: theme.colors.text },
  kicker: { color: theme.colors.muted, fontWeight: "800" },
  muted: { color: theme.colors.muted },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: { borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  buttonText: { color: theme.colors.text, fontWeight: "800" },
  textarea: { borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, color: theme.colors.text, minHeight: 160, padding: 12, textAlignVertical: "top" },
  timelineItem: { borderTopColor: theme.colors.border, borderTopWidth: 1, gap: 4, paddingTop: 8 }
});
