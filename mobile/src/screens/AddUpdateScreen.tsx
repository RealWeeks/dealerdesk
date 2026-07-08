import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { ReviewAIExtractionScreen } from "./ReviewAIExtractionScreen";
import { theme } from "../theme/theme";

export function AddUpdateScreen() {
  const [rawText, setRawText] = useState("");
  const { error, loading, parseDealerMessage, pendingExtraction, selectedDealer } = useDealDeskApp();
  const router = useRouter();
  if (pendingExtraction) return <ReviewAIExtractionScreen />;

  return (
    <Screen>
      <Text style={styles.title}>Add update</Text>
      {selectedDealer ? <Text style={styles.muted}>Selected dealer: {selectedDealer.name}</Text> : <Text style={styles.muted}>Open a dealer from the Dealers tab before parsing a message.</Text>}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Card>
        <Text style={styles.kicker}>Paste dealer message</Text>
        <TextInput accessibilityLabel="Dealer message" multiline value={rawText} onChangeText={setRawText} placeholder="Paste email, text, or call notes..." style={styles.textarea} />
        <Pressable accessibilityRole="button" disabled={!selectedDealer || !rawText || loading} onPress={() => parseDealerMessage(rawText)} style={styles.button}><Text style={styles.buttonText}>{loading ? "Parsing..." : "Review AI Extraction"}</Text></Pressable>
      </Card>
      <Card>
        <Text style={styles.kicker}>Dictate call note</Text>
        <Text style={styles.muted}>Speech-to-text placeholder ready for Expo voice integration.</Text>
      </Card>
      <Card>
        <Text style={styles.kicker}>Manual quote</Text>
        <Text style={styles.muted}>Enter quote fields directly when the dealer gives clean numbers.</Text>
        <Pressable accessibilityRole="button" disabled={!selectedDealer} onPress={() => router.replace("/manual-quote")} style={styles.secondaryButton}><Text style={styles.secondaryText}>Enter Manual Quote</Text></Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 26, fontWeight: "900" },
  kicker: { color: theme.colors.muted, fontWeight: "800" },
  muted: { color: theme.colors.muted },
  error: { color: theme.colors.danger, fontWeight: "700" },
  textarea: { borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, color: theme.colors.text, minHeight: 140, padding: 12, textAlignVertical: "top" },
  button: { alignItems: "center", backgroundColor: theme.colors.primary, borderRadius: theme.radius, minHeight: 46, justifyContent: "center" },
  buttonText: { color: "#fff", fontWeight: "800" },
  secondaryButton: { alignItems: "center", borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, minHeight: 44, justifyContent: "center" },
  secondaryText: { color: theme.colors.text, fontWeight: "800" }
});
