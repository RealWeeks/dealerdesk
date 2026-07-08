import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { AiBadge } from "../components/AiBadge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { GeneratingBlock } from "../components/GeneratingBlock";
import { InsightCard } from "../components/InsightCard";
import { PageHeader } from "../components/PageHeader";
import { Reveal } from "../components/Reveal";
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
      <PageHeader
        title="AI reply"
        description={selectedDealer ? `A negotiation reply for ${selectedDealer.name}, drafted to keep the price moving in your favor. Edit it, then copy or save.` : "Select a dealer before generating a reply."}
        right={<AiBadge />}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !generatedReply ? (
        <Card>
          <GeneratingBlock messages={["Drafting a reply…", "Reviewing the latest offer…", "Keeping trade-in and financing separate…"]} />
        </Card>
      ) : (
        <>
          <Reveal>
            <Card>
              <View style={styles.draftHeader}>
                <View style={styles.draftHeaderLeft}>
                  <Ionicons name="sparkles" size={14} color={theme.colors.accent} />
                  <Text style={styles.draftLabel}>Drafted reply</Text>
                </View>
                <AiBadge label="AI" />
              </View>
              <TextInput accessibilityLabel="Reply text" multiline value={reply} onChangeText={setReply} placeholder="Generated reply will appear here..." placeholderTextColor={theme.colors.faint} style={styles.textarea} />
              <Button label={copied ? "Copied" : "Copy reply"} disabled={!reply} onPress={copyReply} />
              <Button label={saved ? "Saved as sent" : "Save as sent"} variant="secondary" disabled={!reply || loading} onPress={saveReply} />
              {generatedReply?.suggestedFollowUpTitle ? (
                <Button label="Create follow-up task" variant="secondary" disabled={loading} onPress={createSuggestedFollowUp} />
              ) : null}
            </Card>
          </Reveal>
          {generatedReply?.strategyNotes ? <InsightCard title="Why this works">{generatedReply.strategyNotes}</InsightCard> : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { ...theme.typography.body, color: theme.colors.danger, fontFamily: theme.fonts.semibold },
  draftHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  draftHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  draftLabel: { ...theme.typography.label, color: theme.colors.muted, textTransform: "uppercase" },
  textarea: { ...theme.typography.body, backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, color: theme.colors.text, minHeight: 180, padding: theme.spacing.md, textAlignVertical: "top" }
});
