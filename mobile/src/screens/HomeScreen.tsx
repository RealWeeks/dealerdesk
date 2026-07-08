import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AiBadge } from "../components/AiBadge";
import { Button } from "../components/Button";
import { GradientCard } from "../components/GradientCard";
import { GuidedPageHeader } from "../components/PageHeader";
import { InsightCard } from "../components/InsightCard";
import { InsightPanel } from "../components/InsightPanel";
import { JourneyStepper } from "../components/JourneyStepper";
import { NextBestActionCard } from "../components/NextBestActionCard";
import { RightRail } from "../components/RightRail";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { StatCard } from "../components/StatCard";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { useJourney } from "../hooks/useJourney";
import { theme } from "../theme/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export function HomeScreen() {
  const { activeSearch, createDefaultSearch, dealers, error, loading, logout, offers, user, vehicles } = useDealDeskApp();
  const { steps, nextStep, activeKey } = useJourney();
  const router = useRouter();
  const bestOffer = [...offers].sort((a, b) => (a.otdPrice ?? Infinity) - (b.otdPrice ?? Infinity))[0];
  const outreachCount = dealers.filter((dealer) => dealer.status === "not_contacted").length;
  const hasCars = vehicles.length > 0;

  async function signOut() {
    await logout();
    router.replace("/");
  }

  const actions: { icon: IconName; label: string; route: string }[] = [
    { icon: "scan-outline", label: "Capture a car", route: "/dealers" },
    { icon: "document-text-outline", label: "Parse a dealer quote", route: "/ai" },
    { icon: "chatbubbles-outline", label: "Draft a reply", route: "/dealers" }
  ];

  // A DealDesk observation (not the next action) for the rail — coaching, not storage.
  const insight = !hasCars
    ? `You've got ${dealers.length} dealer${dealers.length === 1 ? "" : "s"} lined up, but no car captured yet. Adding a specific listing makes every message and quote far stronger.`
    : bestOffer?.otdPrice
      ? `Best out-the-door so far is $${bestOffer.otdPrice.toLocaleString()}. Ask the other dealers to beat it — keep trade-in and financing separate.`
      : "You've captured a car. Start outreach to collect itemized out-the-door quotes you can compare side by side.";

  const account = (
    <View style={styles.account}>
      {user ? <Text style={styles.email}>{user.email}</Text> : null}
      <Button label="Log out" variant="link" size="sm" onPress={signOut} />
    </View>
  );

  if (!activeSearch) {
    return (
      <Screen>
        <GuidedPageHeader
          title="Dashboard"
          description="Your command center for finding dealers, capturing cars, and comparing out-the-door offers."
          right={account}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <GradientCard glow>
          <AiBadge label="Get started" />
          <Text style={styles.title}>Start your first car search</Text>
          <Text style={styles.body}>DealDesk will guide you from search to signed deal — find dealers, capture the exact car, and compare real out-the-door offers.</Text>
          <Button label={loading ? "Creating..." : "Create Active Search"} onPress={createDefaultSearch} disabled={loading} style={styles.selfStart} />
        </GradientCard>
      </Screen>
    );
  }

  const rail = (
    <RightRail>
      <InsightCard title="DealDesk insight">{insight}</InsightCard>
      <InsightPanel title="Quick actions" icon="flash-outline">
        {actions.map((item) => (
          <View key={item.label} style={styles.actionRow}>
            <Ionicons name={item.icon} size={16} color={theme.colors.primary} />
            <Button label={item.label} variant="link" size="sm" onPress={() => router.push(item.route as never)} />
          </View>
        ))}
      </InsightPanel>
      <InsightPanel title="Current search" icon="search-outline">
        <Text style={styles.searchTitle}>{activeSearch.year} {activeSearch.make} {activeSearch.model}</Text>
        <Text style={styles.searchMeta}>{activeSearch.trim} · within {activeSearch.searchRadiusMiles} mi of {activeSearch.zipCode}</Text>
        <Button label="Edit search" variant="link" size="sm" onPress={() => router.push("/search-setup")} style={styles.selfStart} />
      </InsightPanel>
    </RightRail>
  );

  return (
    <Screen rail={rail}>
      <GuidedPageHeader
        title="Dashboard"
        description="Your command center for finding dealers, capturing cars, and comparing out-the-door offers."
        right={account}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <NextBestActionCard
        title={nextStep.title}
        description={nextStep.description}
        cta={{ label: nextStep.cta, onPress: () => router.push(nextStep.route as never) }}
      />

      <Section title="Your progress" divider={false}>
        <JourneyStepper steps={steps} activeKey={activeKey} />
      </Section>

      <View style={styles.statsRow}>
        <StatCard label="Dealers" value={String(dealers.length)} />
        <StatCard label="Offers" value={String(offers.length)} />
        <StatCard label="Best OTD" value={bestOffer?.otdPrice ? `$${Math.round(bestOffer.otdPrice / 1000)}k` : "—"} />
      </View>

      <Section title="Outreach queue" right={<Text style={styles.count}>{outreachCount}</Text>}>
        {hasCars ? (
          <>
            <Text style={styles.body}>{outreachCount ? `${outreachCount} dealers not contacted` : "No dealers waiting for initial outreach"}</Text>
            <Button label="Start outreach" variant="secondary" size="sm" onPress={() => router.push("/outreach")} style={styles.selfStart} />
          </>
        ) : (
          <>
            <Text style={styles.body}>{outreachCount || dealers.length} dealers ready once you capture a car.</Text>
            <Text style={styles.muted}>Capture a specific listing first so DealDesk can draft a targeted message.</Text>
            <Button label="Capture a car" variant="secondary" size="sm" onPress={() => router.push("/dealers")} style={styles.selfStart} />
          </>
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  account: { alignItems: "flex-end", gap: 2 },
  email: { color: theme.colors.muted, ...theme.typography.caption },
  title: { color: theme.colors.text, ...theme.typography.heading },
  muted: { color: theme.colors.muted, ...theme.typography.body },
  body: { color: theme.colors.text, ...theme.typography.body },
  count: { color: theme.colors.primary, fontFamily: theme.fonts.extrabold, fontSize: 18 },
  statsRow: { flexDirection: "row", gap: theme.spacing.sm },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  searchTitle: { color: theme.colors.text, ...theme.typography.subtitle },
  searchMeta: { color: theme.colors.muted, ...theme.typography.caption },
  selfStart: { alignSelf: "flex-start" },
  error: { color: theme.colors.danger, fontFamily: theme.fonts.semibold }
});
