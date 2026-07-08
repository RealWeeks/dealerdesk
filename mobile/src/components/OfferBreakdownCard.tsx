import { StyleSheet, Text, View } from "react-native";
import { AiOutputCard, FieldRow } from "./AiOutputCard";
import type { Offer } from "../types/domain";
import { theme } from "../theme/theme";

const money = (value?: number) => (typeof value === "number" ? `$${value.toLocaleString()}` : undefined);

// Normalized itemized out-the-door breakdown for a single offer. Only shows rows that
// have values; emphasizes the true OTD total at the bottom.
export function OfferBreakdownCard({ offer, title = "Out-the-door breakdown" }: { offer: Offer; title?: string }) {
  const addOnTotal = offer.addOns?.reduce((sum, addOn) => sum + (addOn.amount ?? 0), 0) ?? 0;
  const rows: [string, string | undefined][] = [
    ["Selling price", money(offer.sellingPrice)],
    ["Dealer discount", money(offer.dealerDiscount)],
    ["Incentives", money(offer.incentives)],
    ["Doc fee", money(offer.docFee)],
    ["Tax", money(offer.tax)],
    ["Title / registration", money(offer.titleRegistration)],
    ["Add-ons", addOnTotal ? money(addOnTotal) : undefined]
  ];
  const shown = rows.filter(([, value]) => value !== undefined);
  return (
    <AiOutputCard title={title} confidence={offer.confidence}>
      {shown.map(([label, value], index) => (
        <FieldRow key={label} index={index} label={label} value={value as string} />
      ))}
      <View style={styles.otdRow}>
        <Text style={styles.otdLabel}>Out-the-door</Text>
        <Text style={styles.otdValue}>{money(offer.otdPrice) ?? "—"}</Text>
      </View>
    </AiOutputCard>
  );
}

const styles = StyleSheet.create({
  otdRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: theme.spacing.xs, paddingTop: theme.spacing.sm, borderTopColor: theme.colors.borderSoft, borderTopWidth: 1 },
  otdLabel: { ...theme.typography.subtitle, color: theme.colors.text },
  otdValue: { ...theme.typography.heading, color: theme.colors.success }
});
