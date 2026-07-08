import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AiBadge } from "../components/AiBadge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyStateCard } from "../components/EmptyStateCard";
import { InsightPanel } from "../components/InsightPanel";
import { GuidedPageHeader, PageHeader } from "../components/PageHeader";
import { RichList, RichListRow } from "../components/RichList";
import { RightRail } from "../components/RightRail";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";
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
  const { activeSearch, dealers, error, generateInitialOutreach, initialOutreach, loadMessageTemplates, loading, markOutreachContacted, messageTemplates, vehicles } = useDealDeskApp();
  const router = useRouter();
  const notContacted = dealers.filter((dealer) => dealer.status === "not_contacted");
  const dealersWithCar = useMemo(() => new Set(vehicles.map((vehicle) => vehicle.dealerId)), [vehicles]);
  const hasAnyCar = vehicles.length > 0;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [messageText, setMessageText] = useState(initialOutreach?.messageText ?? "");
  const [strategyNotes, setStrategyNotes] = useState(initialOutreach?.strategyNotes ?? "");
  const [templateId, setTemplateId] = useState(initialOutreach?.templateId);
  const [templateName, setTemplateName] = useState(initialOutreach?.templateName ?? "");
  const [templateMeta, setTemplateMeta] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dismissedCarNudge, setDismissedCarNudge] = useState(false);

  const grouped = useMemo(() => statuses.filter((status) => status !== "not_contacted").map((status) => ({
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
        <PageHeader title="Outreach queue" description="Create an active search before contacting dealers." />
      </Screen>
    );
  }

  const readyLabel = notContacted.length
    ? `${notContacted.length} dealer${notContacted.length === 1 ? "" : "s"} ready for first contact`
    : "All dealers contacted";

  function dealerRow(dealer: SearchDealer, selectable: boolean) {
    const hasCar = dealersWithCar.has(dealer._id);
    const selected = selectedIds.includes(dealer._id);
    const trailing = (
      <>
        {dealer.websiteUrl ? <Button label="Website" variant="link" size="sm" onPress={() => Linking.openURL(dealer.websiteUrl!)} /> : null}
        {dealer.inventoryUrl ? <Button label="Inventory" variant="link" size="sm" onPress={() => Linking.openURL(dealer.inventoryUrl!)} /> : null}
      </>
    );
    return (
      <RichListRow
        key={dealer._id}
        leading={selectable ? <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={22} color={selected ? theme.colors.primary : theme.colors.faint} /> : undefined}
        trailing={trailing}
        onPress={selectable ? () => toggleDealer(dealer._id) : undefined}
        selected={selected}
        accessibilityLabel={selectable ? `Select ${dealer.name}` : undefined}
      >
        <Text style={styles.dealerName}>{dealer.name}</Text>
        <Text style={styles.muted}>{dealerMeta(dealer)}</Text>
        <View style={styles.badgeRow}>
          <StatusBadge status={dealer.status} />
          <PriorityBadge priority={dealer.priority} />
        </View>
        <View style={styles.carRow}>
          <Ionicons name={hasCar ? "car-sport" : "car-sport-outline"} size={13} color={hasCar ? theme.colors.success : theme.colors.faint} />
          <Text style={[styles.carText, hasCar && styles.carOn]}>{hasCar ? "Car captured" : "No car captured yet"}</Text>
        </View>
      </RichListRow>
    );
  }

  const rail = (notContacted.length || messageText) ? (
    <RightRail>
      <InsightPanel title="Send outreach" icon="send-outline" accent>
        {notContacted.length ? (
          <>
            <View style={styles.row}>
              <Text style={styles.selectedCount}>{selectedIds.length} selected</Text>
              <Pressable accessibilityRole="button" onPress={() => setSelectedIds(selectedIds.length === notContacted.length ? [] : notContacted.map((dealer) => dealer._id))}>
                <Text style={styles.link}>{selectedIds.length === notContacted.length ? "Clear" : "Select all"}</Text>
              </Pressable>
            </View>
            <Text style={styles.muted}>Tap a dealer to include them, then generate one message for everyone selected.</Text>
            <Button label={loading ? "Working..." : "Generate messages"} disabled={!selectedIds.length || loading} onPress={() => generateForSelection()} accessibilityLabel="Generate messages" />
          </>
        ) : null}
        {messageText ? (
          <>
            <Button label={saved ? "Saved as contacted" : "Confirm sent and create follow-ups"} disabled={!selectedIds.length || !messageText || loading} onPress={() => markSent()} accessibilityLabel="Confirm sent and create follow-ups" />
            <Button label={copied ? "Copied" : "Copy message"} variant="secondary" disabled={!messageText} onPress={copyMessage} accessibilityLabel="Copy message" />
          </>
        ) : null}
      </InsightPanel>
    </RightRail>
  ) : undefined;

  return (
    <Screen rail={rail}>
      <GuidedPageHeader
        title="Outreach queue"
        description={`Reach out to dealers for your ${activeSearch.year} ${activeSearch.make} ${activeSearch.model} near ${activeSearch.zipCode}. Select the dealers you want to contact, then generate a message you can send.`}
        status={
          <View style={styles.statusRow}>
            <StatusBadge status={notContacted.length ? "not_contacted" : "contacted"} />
            <Text style={styles.statusText}>{readyLabel}</Text>
          </View>
        }
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !dealers.length ? <Text style={styles.muted}>Loading dealers...</Text> : null}

      {notContacted.length && !hasAnyCar && !dismissedCarNudge ? (
        <Card style={styles.nudge}>
          <View style={styles.kickerRow}>
            <Text style={styles.kicker}>Better outreach starts with a specific car</Text>
            <AiBadge label="Tip" />
          </View>
          <Text style={styles.body}>Dealers respond faster when you reference an exact listing. Capture a car first so DealDesk can ask for an itemized out-the-door price on that specific vehicle — or send general outreach now and add the car later.</Text>
          <View style={styles.actions}>
            <Button label="Capture a car first" size="sm" onPress={() => router.push("/dealers")} />
            <Button label="Generate general outreach anyway" variant="secondary" size="sm" onPress={() => setDismissedCarNudge(true)} />
          </View>
        </Card>
      ) : null}

      {!notContacted.length ? (
        <EmptyStateCard icon="checkmark-done-outline" title="No dealers need initial outreach" description="As soon as you add dealers who haven't been contacted, they'll show up here ready to message." />
      ) : null}

      {messageText ? (
        <Card>
          <View style={styles.kickerRow}>
            <Text style={styles.kicker}>Initial message</Text>
            <AiBadge label="AI" />
          </View>
          <TextInput accessibilityLabel="Initial outreach message" multiline value={messageText} onChangeText={setMessageText} style={styles.textarea} placeholderTextColor={theme.colors.faint} />
          {templateName ? <Text style={styles.body}>Template: {templateName}</Text> : null}
          {templateMeta ? <Text style={styles.muted}>{templateMeta}</Text> : null}
          {strategyNotes ? <Text style={styles.muted}>{strategyNotes}</Text> : null}
          <Button label="Choose different template" variant="link" size="sm" style={styles.selfStart} onPress={() => { void loadMessageTemplates(selectedIds.length === 1 ? selectedIds[0] : undefined); setShowTemplates((current) => !current); }} />
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
        </Card>
      ) : null}

      {notContacted.length ? (
        <Section title="Ready for first contact" divider={false}>
          <RichList>{notContacted.map((dealer) => dealerRow(dealer, true))}</RichList>
        </Section>
      ) : null}

      {grouped.map((group) => group.dealers.length ? (
        <Section key={group.status} title={statusLabel(group.status)}>
          <RichList>{group.dealers.map((dealer) => dealerRow(dealer, false))}</RichList>
        </Section>
      ) : null)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, flexWrap: "wrap" },
  statusText: { ...theme.typography.body, color: theme.colors.muted },
  kicker: { ...theme.typography.label, color: theme.colors.muted, textTransform: "uppercase" },
  kickerRow: { alignItems: "center", flexDirection: "row", gap: theme.spacing.sm, justifyContent: "space-between" },
  nudge: { borderColor: theme.colors.selectedBorder },
  body: { ...theme.typography.body, color: theme.colors.text },
  muted: { ...theme.typography.caption, color: theme.colors.muted },
  error: { ...theme.typography.caption, color: theme.colors.danger },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.sm },
  selectedCount: { ...theme.typography.label, color: theme.colors.text, textTransform: "uppercase" },
  link: { ...theme.typography.subtitle, color: theme.colors.primary },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  selfStart: { alignSelf: "flex-start" },
  dealerName: { ...theme.typography.subtitle, color: theme.colors.text },
  badgeRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: theme.spacing.sm },
  carRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  carText: { ...theme.typography.caption, color: theme.colors.muted },
  carOn: { color: theme.colors.success },
  textarea: { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, color: theme.colors.text, minHeight: 180, padding: theme.spacing.md, textAlignVertical: "top" },
  templateList: { gap: theme.spacing.sm },
  templateOption: { backgroundColor: theme.colors.bgElevated, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, gap: 4, padding: theme.spacing.sm }
});
