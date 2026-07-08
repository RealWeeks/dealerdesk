import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import type { SearchDealer } from "../types/domain";
import { theme } from "../theme/theme";

const statuses = ["not_contacted", "contacted", "needs_reply", "quoted", "negotiating", "finalist", "rejected"];

function statusLabel(status: string) {
  return status.replace("_", " ");
}

function dealerMeta(dealer: SearchDealer) {
  const distance = typeof dealer.distanceMiles === "number" ? ` · ${dealer.distanceMiles.toFixed(1)} mi` : "";
  return `${dealer.city}, ${dealer.state}${distance}`;
}

export function OutreachQueueScreen() {
  const { activeSearch, dealers, error, generateInitialOutreach, initialOutreach, loadMessageTemplates, loading, markOutreachContacted, messageTemplates } = useDealDeskApp();
  const notContacted = dealers.filter((dealer) => dealer.status === "not_contacted");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [messageText, setMessageText] = useState(initialOutreach?.messageText ?? "");
  const [strategyNotes, setStrategyNotes] = useState(initialOutreach?.strategyNotes ?? "");
  const [templateId, setTemplateId] = useState(initialOutreach?.templateId);
  const [templateName, setTemplateName] = useState(initialOutreach?.templateName ?? "");
  const [templateMeta, setTemplateMeta] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const grouped = useMemo(() => statuses.map((status) => ({
    status,
    dealers: dealers.filter((dealer) => dealer.status === status)
  })), [dealers]);

  useEffect(() => {
    if (initialOutreach) {
      setMessageText(initialOutreach.messageText);
      setStrategyNotes(initialOutreach.strategyNotes);
      setTemplateId(initialOutreach.templateId);
      setTemplateName(initialOutreach.templateName ?? "");
      setTemplateMeta(`${initialOutreach.category ?? "initial_outreach"} · ${initialOutreach.tone ?? "friendly"}${initialOutreach.usedWithThisDealer ? " · used with this dealer" : ""}`);
      setCopied(false);
      setSaved(false);
    }
  }, [initialOutreach]);

  function toggleDealer(dealerId: string) {
    setSelectedIds((current) => current.includes(dealerId) ? current.filter((id) => id !== dealerId) : [...current, dealerId]);
  }

  async function generateForSelection(dealerId?: string, nextTemplateId = templateId) {
    const nextIds = dealerId ? [dealerId] : selectedIds;
    if (!nextIds.length) return;
    setSelectedIds(nextIds);
    const message = await generateInitialOutreach(dealerId ?? (nextIds.length === 1 ? nextIds[0] : undefined), nextTemplateId);
    if (message) {
      setMessageText(message.messageText);
      setStrategyNotes(message.strategyNotes);
      setTemplateId(message.templateId);
      setTemplateName(message.templateName ?? "");
      setTemplateMeta(`${message.category ?? "initial_outreach"} · ${message.tone ?? "friendly"}${message.usedWithThisDealer ? " · used with this dealer" : ""}`);
    }
  }

  async function copyMessage() {
    await Clipboard.setStringAsync(messageText);
    setCopied(true);
  }

  async function markSent(dealerId?: string) {
    const nextIds = dealerId ? [dealerId] : selectedIds;
    if (!nextIds.length) return;
    let text = messageText;
    let selectedTemplateId = templateId;
    if (!text) {
      const message = await generateInitialOutreach(dealerId, templateId);
      text = message?.messageText ?? "";
      setMessageText(text);
      setStrategyNotes(message?.strategyNotes ?? "");
      selectedTemplateId = message?.templateId;
      setTemplateId(message?.templateId);
    }
    if (!text) return;
    await markOutreachContacted(nextIds, text, true, selectedTemplateId);
    setSaved(true);
    setSelectedIds((current) => current.filter((id) => !nextIds.includes(id)));
  }

  if (!activeSearch) {
    return (
      <Screen>
        <Text style={styles.title}>Outreach queue</Text>
        <Text style={styles.muted}>Create an active search before contacting dealers.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Outreach queue</Text>
          <Text style={styles.muted}>{activeSearch.year} {activeSearch.make} {activeSearch.model} near {activeSearch.zipCode}</Text>
        </View>
        <Badge label={`${notContacted.length} new`} tone={notContacted.length ? "warning" : "success"} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !dealers.length ? <Text style={styles.muted}>Loading dealers...</Text> : null}

      {notContacted.length ? (
        <Card>
          <View style={styles.row}>
            <Text style={styles.kicker}>{selectedIds.length} selected</Text>
            <Pressable accessibilityRole="button" onPress={() => setSelectedIds(selectedIds.length === notContacted.length ? [] : notContacted.map((dealer) => dealer._id))}>
              <Text style={styles.link}>{selectedIds.length === notContacted.length ? "Clear" : "Select all"}</Text>
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" disabled={!selectedIds.length || loading} onPress={() => generateForSelection()} style={styles.primaryButton}>
            <Text style={styles.primaryText}>{loading ? "Working..." : "Generate Message"}</Text>
          </Pressable>
        </Card>
      ) : (
        <Card>
          <Text style={styles.kicker}>Nothing waiting</Text>
          <Text style={styles.muted}>No dealers need initial outreach.</Text>
        </Card>
      )}

      {messageText ? (
        <Card>
          <Text style={styles.kicker}>Initial message</Text>
          <TextInput accessibilityLabel="Initial outreach message" multiline value={messageText} onChangeText={setMessageText} style={styles.textarea} />
          {templateName ? <Text style={styles.body}>Template: {templateName}</Text> : null}
          {templateMeta ? <Text style={styles.muted}>{templateMeta}</Text> : null}
          {strategyNotes ? <Text style={styles.muted}>{strategyNotes}</Text> : null}
          <Pressable accessibilityRole="button" onPress={() => { void loadMessageTemplates(selectedIds.length === 1 ? selectedIds[0] : undefined); setShowTemplates((current) => !current); }} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Choose different template</Text>
          </Pressable>
          {showTemplates ? (
            <View style={styles.templateList}>
              {messageTemplates.map((template) => (
                <Pressable key={template._id} accessibilityRole="button" onPress={() => { setTemplateId(template._id); setShowTemplates(false); void generateForSelection(undefined, template._id); }} style={styles.templateOption}>
                  <Text style={styles.body}>{template.name} · {template.tone}</Text>
                  {template.usedWithThisDealer ? <Text style={styles.error}>Used with this dealer</Text> : <Text style={styles.muted}>Unused for this dealer</Text>}
                  <Text style={styles.muted}>{template.body.slice(0, 120)}...</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <Pressable accessibilityRole="button" disabled={!messageText} onPress={copyMessage} style={styles.primaryButton}>
            <Text style={styles.primaryText}>{copied ? "Copied" : "Copy message"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={!selectedIds.length || !messageText || loading} onPress={() => markSent()} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>{saved ? "Saved as contacted" : "Confirm sent and create follow-ups"}</Text>
          </Pressable>
        </Card>
      ) : null}

      {grouped.map((group) => group.dealers.length ? (
        <View key={group.status} style={styles.section}>
          <Text style={styles.sectionTitle}>{statusLabel(group.status)}</Text>
          {group.dealers.map((dealer) => (
            <Card key={dealer._id}>
              <View style={styles.row}>
                <Text style={styles.dealerName}>{dealer.name}</Text>
                <Badge label={dealer.priority} tone={dealer.priority === "high" ? "warning" : "neutral"} />
              </View>
              <Text style={styles.muted}>{dealerMeta(dealer)}</Text>
              {dealer.phone ? <Text style={styles.muted}>{dealer.phone}</Text> : null}
              <View style={styles.linkRow}>
                {dealer.websiteUrl ? <Pressable onPress={() => Linking.openURL(dealer.websiteUrl!)}><Text style={styles.link}>Website</Text></Pressable> : null}
                {dealer.inventoryUrl ? <Pressable onPress={() => Linking.openURL(dealer.inventoryUrl!)}><Text style={styles.link}>Inventory</Text></Pressable> : null}
              </View>
              {dealer.status === "not_contacted" ? (
                <>
                  <Pressable accessibilityLabel={`Select ${dealer.name}`} accessibilityRole="button" onPress={() => toggleDealer(dealer._id)} style={styles.checkRow}>
                    <Text style={styles.checkbox}>{selectedIds.includes(dealer._id) ? "[x]" : "[ ]"}</Text>
                    <Text style={styles.body}>Include in outreach</Text>
                  </Pressable>
                  <View style={styles.actions}>
                    <Pressable accessibilityRole="button" disabled={loading} onPress={() => generateForSelection(dealer._id)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Generate Message</Text></Pressable>
                    <Pressable accessibilityRole="button" disabled={loading} onPress={() => markSent(dealer._id)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Mark Contacted</Text></Pressable>
                  </View>
                </>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 26, fontWeight: "900" },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", gap: 12 },
  section: { gap: theme.spacing.sm },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "900", textTransform: "capitalize" },
  kicker: { color: theme.colors.muted, fontSize: 13, fontWeight: "800", textTransform: "uppercase" },
  dealerName: { color: theme.colors.text, flex: 1, fontSize: 18, fontWeight: "800" },
  body: { color: theme.colors.text },
  muted: { color: theme.colors.muted },
  error: { color: theme.colors.danger, fontWeight: "700" },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 12 },
  linkRow: { flexDirection: "row", gap: 16 },
  link: { color: theme.colors.primary, fontWeight: "800" },
  checkRow: { alignItems: "center", flexDirection: "row", gap: 8, minHeight: 40 },
  checkbox: { color: theme.colors.text, fontWeight: "900" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  textarea: { borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, color: theme.colors.text, minHeight: 180, padding: 12, textAlignVertical: "top" },
  primaryButton: { alignItems: "center", backgroundColor: theme.colors.primary, borderRadius: theme.radius, minHeight: 46, justifyContent: "center" },
  primaryText: { color: "#fff", fontWeight: "800" },
  secondaryButton: { alignItems: "center", borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, minHeight: 42, justifyContent: "center", paddingHorizontal: 12 },
  secondaryText: { color: theme.colors.text, fontWeight: "800" },
  templateList: { gap: theme.spacing.sm },
  templateOption: { borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, gap: 4, padding: 10 }
});
