import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../components/Button";
import { GuidedPageHeader } from "../components/PageHeader";
import { RichList, RichListRow } from "../components/RichList";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { SegmentGroup } from "../components/SegmentGroup";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import type { SearchDealer } from "../types/domain";
import { DealerDetailScreen } from "./DealerDetailScreen";
import { FindDealersScreen } from "./FindDealersScreen";
import { theme } from "../theme/theme";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "To contact", value: "to_contact" },
  { label: "In progress", value: "active" },
  { label: "Finalists", value: "finalist" }
];
const SORTS = [
  { label: "Distance", value: "distance" },
  { label: "Priority", value: "priority" },
  { label: "Name", value: "name" }
];
const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
const ACTIVE_STATUSES = new Set(["contacted", "needs_reply", "quoted", "negotiating"]);

function matchesFilter(dealer: SearchDealer, filter: string) {
  if (filter === "all") return true;
  if (filter === "to_contact") return dealer.status === "not_contacted";
  if (filter === "active") return ACTIVE_STATUSES.has(dealer.status);
  if (filter === "finalist") return dealer.status === "finalist";
  return true;
}

function recommendedAction(dealer: SearchDealer, hasCar: boolean) {
  if (!hasCar) return "Capture the car you're negotiating on";
  switch (dealer.status) {
    case "not_contacted": return "Send a first outreach message";
    case "needs_reply": return "They're waiting on your reply";
    case "quoted": return "Compare their out-the-door quote";
    case "negotiating": return "Push for a better out-the-door price";
    default: return "Review the latest update";
  }
}

export function DealersScreen() {
  const { dealers, error, selectedDealer, selectDealer, vehicles } = useDealDeskApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("distance");

  const dealersWithCar = useMemo(() => new Set(vehicles.map((vehicle) => vehicle.dealerId)), [vehicles]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = dealers.filter((dealer) => matchesFilter(dealer, filter) && (!q || dealer.name.toLowerCase().includes(q)));
    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "priority") return (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3);
      return (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity);
    });
  }, [dealers, query, filter, sort]);

  if (selectedDealer) return <DealerDetailScreen onBack={() => selectDealer(null)} />;
  if (!dealers.length) return <FindDealersScreen />;

  const notContacted = dealers.filter((dealer) => dealer.status === "not_contacted").length;

  return (
    <Screen width="wide">
      <GuidedPageHeader
        title="Dealers"
        description="Every dealer in your search. Open one to capture a car, send outreach, and track their out-the-door quote."
        status={<Text style={styles.status}>{dealers.length} dealer{dealers.length === 1 ? "" : "s"} · {notContacted} waiting for first contact</Text>}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.controls}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={theme.colors.faint} />
          <TextInput
            accessibilityLabel="Search dealers by name"
            value={query}
            onChangeText={setQuery}
            placeholder="Search dealers"
            placeholderTextColor={theme.colors.faint}
            style={styles.search}
          />
        </View>
        <SegmentGroup options={FILTERS} value={filter} onChange={setFilter} labelPrefix="Filter" />
        <SegmentGroup options={SORTS} value={sort} onChange={setSort} labelPrefix="Sort by" />
      </View>

      {visible.length ? (
        <RichList>
          {visible.map((dealer) => {
            const hasCar = dealersWithCar.has(dealer._id);
            return (
              <RichListRow
                key={dealer._id}
                trailing={<Button label="Open" size="sm" onPress={() => selectDealer(dealer)} />}
              >
                <Text style={styles.name}>{dealer.name}</Text>
                <Text style={styles.meta}>{dealer.city}, {dealer.state}{typeof dealer.distanceMiles === "number" ? ` · ${dealer.distanceMiles.toFixed(1)} mi` : ""}</Text>
                <View style={styles.badgeRow}>
                  <StatusBadge status={dealer.status} />
                  <PriorityBadge priority={dealer.priority} />
                </View>
                <View style={styles.recommend}>
                  <Ionicons name={hasCar ? "car-sport" : "arrow-forward-circle-outline"} size={13} color={hasCar ? theme.colors.success : theme.colors.accent} />
                  <Text style={styles.recommendText}>{recommendedAction(dealer, hasCar)}</Text>
                </View>
              </RichListRow>
            );
          })}
        </RichList>
      ) : (
        <Section divider={false}>
          <Text style={styles.muted}>No dealers match your search. Try a different name or filter.</Text>
        </Section>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { ...theme.typography.body, color: theme.colors.muted },
  error: { ...theme.typography.body, color: theme.colors.danger, fontFamily: theme.fonts.bold },
  controls: { gap: theme.spacing.sm },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, paddingHorizontal: theme.spacing.md, minHeight: 44 },
  search: { flex: 1, ...theme.typography.body, color: theme.colors.text, minHeight: 44 },
  name: { ...theme.typography.heading, color: theme.colors.text },
  meta: { ...theme.typography.body, color: theme.colors.muted },
  badgeRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: theme.spacing.sm },
  recommend: { flexDirection: "row", alignItems: "center", gap: 6 },
  recommendText: { ...theme.typography.caption, color: theme.colors.muted },
  muted: { ...theme.typography.body, color: theme.colors.muted }
});
