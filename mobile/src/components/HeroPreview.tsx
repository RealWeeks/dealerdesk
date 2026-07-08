import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { AiOutputCard, FieldRow } from "./AiOutputCard";
import { GeneratingBlock } from "./GeneratingBlock";
import { Reveal } from "./Reveal";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { theme } from "../theme/theme";

const SAMPLES = [
  {
    vehicle: "2026 Lexus RX 350h",
    trim: "Premium AWD",
    vin: "JTHGP8CA5N1•••••••",
    price: "$61,480",
    reply: "Hi — I'm interested in this RX 350h. Is it still available, and can you send the full out-the-door price with taxes, fees, and any add-ons broken out?",
    insight: "Suggested next move: Ask Dealer B to beat the $60,850 competing OTD offer."
  },
  {
    vehicle: "2025 Toyota RAV4 Hybrid",
    trim: "XLE AWD",
    vin: "2T3W1RFV8SC•••••••",
    price: "$38,900",
    reply: "Hi, I'm comparing a few similar listings this week. Could you send your best itemized out-the-door price for this one?",
    insight: "DealDesk insight: This quote includes $1,295 in dealer add-ons. Ask if they can remove or discount them."
  },
  {
    vehicle: "2026 Honda CR-V Hybrid",
    trim: "Sport-L AWD",
    vin: "7FARS6H92RE•••••••",
    price: "$39,750",
    reply: "Hi — is the CR-V Hybrid Sport-L still available? Please send an itemized out-the-door price with fees and any required add-ons separated.",
    insight: "Next best action: Request an itemized out-the-door quote before discussing monthly payments."
  },
  {
    vehicle: "2025 Subaru Outback",
    trim: "Touring XT",
    vin: "4S4BTGPD9S3•••••••",
    price: "$42,300",
    reply: "Hi — I'm looking at the Outback Touring XT. Can you send your best out-the-door number, taxes and fees included?",
    insight: "Suggested next move: You're within $450 of the best OTD — ask for free all-weather mats to close."
  }
];

// Continuously streams different parsed listings "coming in live": analyze → reveal →
// hold → next, looping. Under reduced motion it shows one static parsed listing.
export function HeroPreview() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [parsing, setParsing] = useState(!reduced);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    const run = () => {
      setParsing(true);
      const t1 = setTimeout(() => !cancelled && setParsing(false), 1000);
      // Hold the parsed listing long enough to comfortably read before the next arrives.
      const t2 = setTimeout(() => {
        if (cancelled) return;
        setIndex((current) => (current + 1) % SAMPLES.length);
        run();
      }, 6500);
      timers.current = [t1, t2];
    };
    run();
    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
    };
  }, [reduced]);

  const sample = SAMPLES[index];

  return (
    <View style={styles.wrap}>
      <View style={styles.chrome}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <Text style={styles.chromeText}>DealDesk · live</Text>
      </View>
      <View style={styles.body}>
        {parsing ? (
          <GeneratingBlock messages={["Analyzing listing…", "Extracting VIN, trim, and dealer info…", "Reading price and options…"]} lines={3} />
        ) : (
          <Reveal key={index}>
            <View style={styles.stack}>
              <AiOutputCard title="Parsed listing" confidence="high">
                <FieldRow index={0} label="Vehicle" value={sample.vehicle} />
                <FieldRow index={1} label="Trim" value={sample.trim} />
                <FieldRow index={2} label="VIN" value={sample.vin} />
                <FieldRow index={3} label="Listed" value={sample.price} />
              </AiOutputCard>
              <View style={styles.reply}>
                <View style={styles.replyHeader}>
                  <Ionicons name="sparkles" size={12} color={theme.colors.accent} />
                  <Text style={styles.replyLabel}>DRAFTED REPLY</Text>
                </View>
                <Text style={styles.replyText} numberOfLines={3}>{sample.reply}</Text>
              </View>
              <View style={styles.insight}>
                <Ionicons name="bulb-outline" size={12} color={theme.colors.accent} />
                <Text style={styles.insightText} numberOfLines={2}>{sample.insight}</Text>
              </View>
            </View>
          </Reveal>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...( { boxShadow: theme.shadow.raised } as unknown as ViewStyle )
  },
  chrome: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.bgElevated, borderBottomColor: theme.colors.borderSoft, borderBottomWidth: 1 },
  dot: { width: 8, height: 8, borderRadius: theme.radii.pill, backgroundColor: theme.colors.faint },
  chromeText: { ...theme.typography.caption, color: theme.colors.faint, marginLeft: 8 },
  // minHeight sits above the tallest state (parsed card + reply) so the box doesn't
  // resize between the shimmer and parsed states; content is top-aligned so it doesn't shift.
  body: { padding: theme.spacing.md, minHeight: 372, justifyContent: "flex-start" },
  stack: { gap: theme.spacing.sm },
  reply: { backgroundColor: theme.colors.bgElevated, borderColor: theme.colors.borderSoft, borderRadius: theme.radii.md, borderWidth: 1, padding: theme.spacing.md, gap: 6 },
  replyHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  replyLabel: { ...theme.typography.caption, color: theme.colors.muted, letterSpacing: 0.4 },
  replyText: { ...theme.typography.body, color: theme.colors.text },
  insight: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingHorizontal: 2 },
  insightText: { ...theme.typography.caption, color: theme.colors.muted, flex: 1 }
});

