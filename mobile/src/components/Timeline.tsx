import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
export type TimelineItem = { id: string; type: string; title: string; time?: string; summary?: string };

const TYPE_ICON: Record<string, IconName> = {
  interaction: "chatbubble-ellipses-outline",
  message: "chatbubble-ellipses-outline",
  offer: "pricetag-outline",
  task: "checkbox-outline",
  note: "document-text-outline",
  template_usage: "send-outline",
  follow_up: "alarm-outline",
  ai_extraction: "sparkles-outline",
  dealer_status: "flag-outline"
};

export function TimelineEvent({ item, last = false }: { item: TimelineItem; last?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={styles.dot}>
          <Ionicons name={TYPE_ICON[item.type] ?? "ellipse-outline"} size={13} color={theme.colors.accent} />
        </View>
        {last ? null : <View style={styles.line} />}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        {item.time ? <Text style={styles.time}>{item.time}</Text> : null}
        {item.summary ? <Text style={styles.summary}>{item.summary}</Text> : null}
      </View>
    </View>
  );
}

export function TimelineSection({ items }: { items: TimelineItem[] }) {
  return (
    <View>
      {items.map((item, index) => (
        <TimelineEvent key={item.id} item={item} last={index === items.length - 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: theme.spacing.sm },
  rail: { alignItems: "center", width: 28 },
  dot: { width: 28, height: 28, borderRadius: theme.radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.accentSoft },
  line: { flex: 1, width: 2, backgroundColor: theme.colors.borderSoft, marginVertical: 2 },
  content: { flex: 1, paddingBottom: theme.spacing.md, gap: 2 },
  title: { ...theme.typography.body, color: theme.colors.text, fontFamily: theme.fonts.semibold },
  time: { ...theme.typography.caption, color: theme.colors.faint },
  summary: { ...theme.typography.body, color: theme.colors.muted }
});
