import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AiBadge } from "../components/AiBadge";
import { AiOutputCard, FieldRow } from "../components/AiOutputCard";
import { AuthCard } from "../components/AuthCard";
import { Card } from "../components/Card";
import { Grid } from "../components/Grid";
import { HeroPreview } from "../components/HeroPreview";
import { Screen } from "../components/Screen";
import { WorkflowFlow } from "../components/WorkflowFlow";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { theme } from "../theme/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const BULLETS = [
  "Capture a specific car from a listing",
  "Track every dealer conversation",
  "Compare true out-the-door offers"
];

const STEPS: { n: number; title: string; desc: string; ai?: boolean }[] = [
  { n: 1, title: "Search", desc: "You tell DealDesk the car you want and where you're shopping." },
  { n: 2, title: "Find dealers", desc: "AI finds nearby dealers that actually carry it.", ai: true },
  { n: 3, title: "Capture cars", desc: "AI reads a listing link or screenshot and fills in the details.", ai: true },
  { n: 4, title: "Outreach", desc: "AI drafts the message; you send it and track every reply.", ai: true },
  { n: 5, title: "Compare", desc: "AI normalizes fees and totals to rank true out-the-door prices.", ai: true }
];

const FEATURES: { icon: IconName; title: string; desc: string; kind: "capture" | "parse" | "reply" }[] = [
  { icon: "scan-outline", title: "AI car capture", desc: "Paste a listing link or a screenshot; AI reads the year, trim, VIN, and price.", kind: "capture" },
  { icon: "document-text-outline", title: "AI quote parsing", desc: "Drop in a dealer's email and AI extracts the itemized out-the-door numbers.", kind: "parse" },
  { icon: "chatbubbles-outline", title: "AI reply drafting", desc: "Generate friendly-but-firm negotiation replies in a single tap.", kind: "reply" }
];

function FeaturePreview({ kind }: { kind: "capture" | "parse" | "reply" }) {
  if (kind === "capture") {
    return (
      <AiOutputCard title="Extracted" confidence="high">
        <FieldRow index={0} label="VIN" value="JTHGP8CA5N…" />
        <FieldRow index={1} label="Trim" value="Premium AWD" />
        <FieldRow index={2} label="Listed" value="$61,480" />
      </AiOutputCard>
    );
  }
  if (kind === "parse") {
    return (
      <AiOutputCard title="Out-the-door">
        <FieldRow index={0} label="Selling" value="$57,500" />
        <FieldRow index={1} label="Fees + tax" value="$4,749" />
        <FieldRow index={2} label="OTD" value="$62,249" />
      </AiOutputCard>
    );
  }
  return (
    <View style={styles.replyPreview}>
      <Text style={styles.replyPreviewLabel}>DRAFTED REPLY</Text>
      <Text style={styles.replyPreviewText}>Thanks! Can you send an itemized OTD price with fees and any required add-ons separated?</Text>
    </View>
  );
}

export function LandingScreen() {
  const { isDesktop } = useBreakpoint();
  const router = useRouter();
  const { token } = useDealDeskApp();

  useEffect(() => {
    if (token) router.replace("/home");
  }, [router, token]);

  return (
    <Screen width="wide">
      {/* Hero */}
      <View style={styles.hero}>
        <LinearGradient colors={theme.gradients.accentSubtle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.brandRow}>
          <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.brandMark}>
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.brand}>DealDesk</Text>
        </View>
        <View style={[styles.heroRow, isDesktop && styles.heroRowWide]}>
          <View style={styles.heroLeft}>
            <AiBadge label="AI-powered" />
            <Text style={styles.headline}>Negotiate your next car with confidence</Text>
            <Text style={styles.subhead}>
              DealDesk captures the exact car you want, tracks every dealer conversation, and compares real out-the-door offers — so you always know your next move.
            </Text>
            <View style={styles.bullets}>
              {BULLETS.map((bullet) => (
                <View key={bullet} style={styles.bullet}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
            <View style={styles.previewWrap}>
              <HeroPreview />
            </View>
          </View>
          <View style={[styles.heroRight, { width: isDesktop ? 380 : "100%" }]}>
            <AuthCard defaultMode="register" />
            <View style={styles.aside}>
              <View style={styles.asideHead}>
                <Ionicons name="bulb-outline" size={14} color={theme.colors.accent} />
                <Text style={styles.asideLabel}>WHAT HAPPENS NEXT</Text>
              </View>
              <Text style={styles.asideText}>
                Create your account and DealDesk sets up your first search, then shows the single next best move — starting with capturing the exact car you're comparing.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* How it works */}
      <View style={styles.section}>
        <Text style={styles.eyebrow}>HOW IT WORKS</Text>
        <Text style={styles.sectionTitle}>From search to signed deal, guided the whole way</Text>
        <WorkflowFlow steps={STEPS} />
      </View>

      {/* Powered by AI */}
      <View style={styles.section}>
        <View style={styles.aiHeader}>
          <Text style={styles.eyebrow}>POWERED BY AI</Text>
          <AiBadge label="AI" />
        </View>
        <Text style={styles.sectionTitle}>The busywork, handled for you</Text>
        <Grid>
          {FEATURES.map((feature) => (
            <Card key={feature.title} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.cardTitle}>{feature.title}</Text>
              <Text style={styles.cardDesc}>{feature.desc}</Text>
              <View style={styles.featurePreview}><FeaturePreview kind={feature.kind} /></View>
            </Card>
          ))}
        </Grid>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: "hidden",
    borderRadius: theme.radii.lg,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 32, height: 32, borderRadius: theme.radii.md, alignItems: "center", justifyContent: "center" },
  brand: { color: theme.colors.text, fontFamily: theme.fonts.display, fontSize: 20 },
  heroRow: { flexDirection: "column", gap: theme.spacing.lg },
  heroRowWide: { flexDirection: "row", alignItems: "flex-start", gap: theme.spacing.xxl },
  heroLeft: { flex: 1, gap: theme.spacing.md },
  heroRight: { alignSelf: "stretch", gap: theme.spacing.md },
  aside: { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderSoft, borderRadius: theme.radii.md, borderWidth: 1, padding: theme.spacing.md, gap: 6 },
  asideHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  asideLabel: { ...theme.typography.caption, color: theme.colors.accent, fontFamily: theme.fonts.bold, letterSpacing: 0.4 },
  asideText: { ...theme.typography.caption, color: theme.colors.muted },
  headline: { color: theme.colors.text, ...theme.typography.display },
  subhead: { color: theme.colors.muted, ...theme.typography.subtitle, maxWidth: 560 },
  bullets: { gap: theme.spacing.sm, marginTop: theme.spacing.xs },
  bullet: { flexDirection: "row", alignItems: "center", gap: 10 },
  bulletText: { color: theme.colors.text, ...theme.typography.body },
  previewWrap: { marginTop: theme.spacing.md, maxWidth: 420 },
  section: { gap: theme.spacing.md, paddingTop: theme.spacing.lg },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  eyebrow: { color: theme.colors.primary, ...theme.typography.label },
  sectionTitle: { color: theme.colors.text, ...theme.typography.title },
  stepCard: { flex: 1, gap: theme.spacing.xs },
  stepHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepNum: { width: 30, height: 30, borderRadius: theme.radii.pill, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: theme.colors.onAccent, fontFamily: theme.fonts.bold, fontSize: 14 },
  aiTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.colors.accentSoft, borderRadius: theme.radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  aiTagText: { ...theme.typography.caption, color: theme.colors.accent, fontFamily: theme.fonts.bold, letterSpacing: 0.4 },
  featureCard: { flex: 1, gap: theme.spacing.xs },
  featurePreview: { marginTop: theme.spacing.xs },
  replyPreview: { backgroundColor: theme.colors.bgElevated, borderColor: theme.colors.borderSoft, borderRadius: theme.radii.md, borderWidth: 1, padding: theme.spacing.md, gap: 6 },
  replyPreviewLabel: { ...theme.typography.caption, color: theme.colors.muted, letterSpacing: 0.4 },
  replyPreviewText: { ...theme.typography.body, color: theme.colors.text },
  featureIcon: { width: 40, height: 40, borderRadius: theme.radii.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.accentSoft },
  cardTitle: { color: theme.colors.text, ...theme.typography.heading },
  cardDesc: { color: theme.colors.muted, ...theme.typography.body }
});
