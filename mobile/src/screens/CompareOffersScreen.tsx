import { StyleSheet, Text, View } from "react-native";
import { AiBadge } from "../components/AiBadge";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { DataTable, type Column } from "../components/DataTable";
import { EmptyStateCard } from "../components/EmptyStateCard";
import { InsightCard } from "../components/InsightCard";
import { InsightPanel } from "../components/InsightPanel";
import { OfferBreakdownCard } from "../components/OfferBreakdownCard";
import { PageHeader } from "../components/PageHeader";
import { Reveal } from "../components/Reveal";
import { RightRail } from "../components/RightRail";
import { Screen } from "../components/Screen";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import type { Offer } from "../types/domain";
import { theme } from "../theme/theme";

const money = (value?: number) => (typeof value === "number" ? `$${value.toLocaleString()}` : "—");

export function CompareOffersScreen() {
  const { dealers, error, offers, vehicles } = useDealDeskApp();
  const { isWide } = useBreakpoint();
  const ranked = [...offers].sort((a, b) => (a.otdPrice ?? Infinity) - (b.otdPrice ?? Infinity));
  const dealerName = (dealerId: string) => dealers.find((dealer) => dealer._id === dealerId)?.name ?? "Dealer";
  const carLabel = (vehicleId?: string) => {
    const vehicle = vehicles.find((candidate) => candidate._id === vehicleId);
    if (!vehicle) return null;
    const base = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ") || "Car";
    return vehicle.stockNumber ? `${base} · #${vehicle.stockNumber}` : base;
  };
  const feesTotal = (offer: Offer) => {
    const parts = [offer.docFee, offer.tax, offer.titleRegistration, offer.deliveryFee].filter((value): value is number => typeof value === "number");
    return parts.length ? parts.reduce((sum, value) => sum + value, 0) : undefined;
  };
  const otdPrices = ranked.map((offer) => offer.otdPrice).filter((price): price is number => typeof price === "number");
  const bestOtd = otdPrices[0];
  const spread = otdPrices.length >= 2 ? Math.max(...otdPrices) - Math.min(...otdPrices) : undefined;
  const flagged = ranked.filter((offer) => offer.redFlags?.length || offer.addOns?.length).length;
  const insight = ranked.length >= 2 && bestOtd
    ? `The lead is $${bestOtd.toLocaleString()} OTD. Ask the other dealers to beat it — keep trade-in and financing separate.`
    : ranked.length === 1
      ? "You have one quote. Capture another dealer's car or add a quote to compare true out-the-door prices."
      : null;

  const columns: Column<Offer>[] = [
    { key: "dealer", label: "Dealer", flex: 1.6, render: (offer) => <Text style={styles.cellStrong}>{ranked.indexOf(offer) + 1}. {dealerName(offer.dealerId)}</Text> },
    { key: "otd", label: "OTD", align: "right", render: (offer) => <Text style={[styles.cellStrong, offer === ranked[0] && styles.best]}>{money(offer.otdPrice)}</Text> },
    { key: "selling", label: "Selling", align: "right", render: (offer) => <Text style={styles.cell}>{money(offer.sellingPrice)}</Text> },
    { key: "fees", label: "Fees", align: "right", render: (offer) => <Text style={styles.cell}>{money(feesTotal(offer))}</Text> },
    { key: "addons", label: "Add-ons", align: "right", render: (offer) => <Text style={styles.cell}>{offer.addOns?.length ? offer.addOns.length : "—"}</Text> },
    { key: "flags", label: "Flags", align: "right", render: (offer) => <Text style={[styles.cell, !!offer.redFlags?.length && styles.flagOn]}>{offer.redFlags?.length ? "Review" : "—"}</Text> }
  ];

  const rail = ranked.length ? (
    <RightRail>
      <InsightPanel title="Best out-the-door" icon="trophy-outline" accent>
        <Text style={styles.railBig}>{money(bestOtd)}</Text>
        {bestOtd ? <Text style={styles.railMuted}>{dealerName(ranked[0].dealerId)}</Text> : <Text style={styles.railMuted}>No out-the-door totals yet</Text>}
      </InsightPanel>
      {typeof spread === "number" ? (
        <InsightPanel title="Spread" icon="swap-vertical-outline">
          <Text style={styles.railBig}>{money(spread)}</Text>
          <Text style={styles.railMuted}>between the best and highest quote · {flagged} flagged</Text>
        </InsightPanel>
      ) : null}
      {insight ? <InsightCard title="Next move">{insight}</InsightCard> : null}
    </RightRail>
  ) : undefined;

  return (
    <Screen width="wide" rail={rail}>
      <PageHeader title="Offers" description="Every dealer quote, normalized to a true out-the-door price and ranked so you can see who's really cheapest." right={<AiBadge label="AI insights" />} />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!ranked.length ? (
        <EmptyStateCard
          icon="pricetags-outline"
          title="No confirmed offers yet"
          description="Add a dealer update or enter a quote manually, and DealDesk will rank true out-the-door prices side by side here."
        />
      ) : isWide ? (
        <DataTable columns={columns} rows={ranked} highlightFirst rowKey={(offer) => offer._id} />
      ) : (
        <View style={styles.stack}>
          {ranked.map((offer, index) => (
            <Reveal key={offer._id} delay={index * 60}>
              <Card>
                <View style={styles.row}>
                  <Text style={styles.dealer}>{index + 1}. {dealerName(offer.dealerId)}</Text>
                  <Badge label={offer.quoteCompleteness} tone={offer.quoteCompleteness === "complete" ? "success" : "warning"} />
                </View>
                {carLabel(offer.vehicleId) ? <Text style={styles.muted}>{carLabel(offer.vehicleId)}</Text> : null}
                <Text style={styles.price}>{offer.otdPrice ? `$${offer.otdPrice.toLocaleString()} OTD` : "OTD missing"}</Text>
                {index === 0 && ranked.length > 1 ? <Badge label="Lowest OTD" tone="success" /> : null}
                <OfferBreakdownCard offer={offer} />
                <Text style={styles.flag}>{offer.redFlags?.length ? "Messy quote — check add-ons and fees" : "Clean quote"}</Text>
                <Button label="Generate reply" variant="secondary" size="sm" />
              </Card>
            </Reveal>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: theme.spacing.md },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  dealer: { ...theme.typography.heading, color: theme.colors.text, flex: 1 },
  price: { ...theme.typography.heading, color: theme.colors.success, fontSize: 24, lineHeight: 30 },
  muted: { ...theme.typography.body, color: theme.colors.muted },
  flag: { ...theme.typography.caption, color: theme.colors.muted },
  cell: { ...theme.typography.body, color: theme.colors.text },
  cellStrong: { ...theme.typography.subtitle, color: theme.colors.text },
  best: { color: theme.colors.success },
  flagOn: { color: theme.colors.warning },
  railBig: { ...theme.typography.heading, color: theme.colors.text },
  railMuted: { ...theme.typography.caption, color: theme.colors.muted },
  error: { ...theme.typography.body, color: theme.colors.danger, fontFamily: theme.fonts.bold }
});
