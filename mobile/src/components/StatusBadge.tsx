import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

type Tone = "neutral" | "success" | "warning" | "danger";
type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TONE: Record<Tone, [string, string]> = {
  neutral: [theme.colors.primarySoft, theme.colors.primary],
  success: [theme.colors.successSoft, theme.colors.success],
  warning: [theme.colors.warningSoft, theme.colors.warning],
  danger: [theme.colors.dangerSoft, theme.colors.danger]
};

// A pill that always pairs an icon + label with color, so status/priority is never
// communicated by color alone (accessibility).
function Pill({ label, tone, icon }: { label: string; tone: Tone; icon: IconName }) {
  const [bg, fg] = TONE[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={12} color={fg} />
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const STATUS: Record<string, { label: string; tone: Tone; icon: IconName }> = {
  not_contacted: { label: "Not contacted", tone: "neutral", icon: "ellipse-outline" },
  contacted: { label: "Contacted", tone: "neutral", icon: "checkmark-circle-outline" },
  needs_reply: { label: "Needs reply", tone: "warning", icon: "alert-circle-outline" },
  quoted: { label: "Quoted", tone: "neutral", icon: "pricetag-outline" },
  negotiating: { label: "Negotiating", tone: "warning", icon: "chatbubbles-outline" },
  finalist: { label: "Finalist", tone: "success", icon: "star-outline" },
  rejected: { label: "Passed", tone: "danger", icon: "close-circle-outline" },
  purchased_from: { label: "Purchased", tone: "success", icon: "trophy-outline" }
};

export function StatusBadge({ status }: { status: string }) {
  const info = STATUS[status] ?? { label: status.replace(/_/g, " "), tone: "neutral" as Tone, icon: "ellipse-outline" as IconName };
  return <Pill label={info.label} tone={info.tone} icon={info.icon} />;
}

const PRIORITY: Record<string, { label: string; tone: Tone }> = {
  high: { label: "High priority", tone: "warning" },
  medium: { label: "Medium priority", tone: "neutral" },
  low: { label: "Low priority", tone: "neutral" }
};

export function PriorityBadge({ priority }: { priority: string }) {
  const info = PRIORITY[priority] ?? { label: `${priority} priority`, tone: "neutral" as Tone };
  return <Pill label={info.label} tone={info.tone} icon="flag" />;
}

const styles = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", borderRadius: theme.radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontFamily: theme.fonts.semibold, fontSize: 12 }
});
