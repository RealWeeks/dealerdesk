import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { theme } from "../theme/theme";

export function AIReplyScreen() {
  const { createSuggestedFollowUp, error, generatedReply, generateReply, loading, saveGeneratedReply, selectedDealer } = useDealDeskApp();
  const [reply, setReply] = useState(generatedReply?.replyText ?? "");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (!generatedReply && selectedDealer && !requested) {
      setRequested(true);
      void generateReply();
    }
  }, [generatedReply, generateReply, requested, selectedDealer]);

  useEffect(() => {
    if (generatedReply) setReply(generatedReply.replyText);
  }, [generatedReply]);

  async function copyReply() {
    await Clipboard.setStringAsync(reply);
    setCopied(true);
  }

  async function saveReply() {
    await saveGeneratedReply(reply);
    setSaved(true);
  }

  return (
    <Screen>
      <Text style={styles.title}>AI reply</Text>
      {selectedDealer ? <Text style={styles.muted}>For {selectedDealer.name}</Text> : <Text style={styles.muted}>Select a dealer before generating a reply.</Text>}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !generatedReply ? <Text style={styles.muted}>Generating reply...</Text> : null}
      <Card>
        <TextInput accessibilityLabel="Reply text" multiline value={reply} onChangeText={setReply} placeholder="Generated reply will appear here..." style={styles.textarea} />
        {generatedReply ? <Text style={styles.muted}>{generatedReply.strategyNotes}</Text> : null}
        <Pressable accessibilityRole="button" disabled={!reply} onPress={copyReply} style={styles.button}><Text style={styles.buttonText}>{copied ? "Copied" : "Copy reply"}</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={!reply || loading} onPress={saveReply} style={styles.secondary}><Text style={styles.secondaryText}>{saved ? "Saved as sent" : "Save as sent"}</Text></Pressable>
        {generatedReply?.suggestedFollowUpTitle ? (
          <Pressable accessibilityRole="button" disabled={loading} onPress={createSuggestedFollowUp} style={styles.secondary}><Text style={styles.secondaryText}>Create follow-up task</Text></Pressable>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 26, fontWeight: "900" },
  muted: { color: theme.colors.muted },
  error: { color: theme.colors.danger, fontWeight: "700" },
  textarea: { borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, minHeight: 180, padding: 12, textAlignVertical: "top" },
  button: { alignItems: "center", backgroundColor: theme.colors.primary, borderRadius: theme.radius, minHeight: 46, justifyContent: "center" },
  buttonText: { color: "#fff", fontWeight: "800" },
  secondary: { alignItems: "center", borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, minHeight: 46, justifyContent: "center" },
  secondaryText: { color: theme.colors.text, fontWeight: "800" }
});
