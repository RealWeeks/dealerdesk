import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ShimmerLine } from "./ShimmerLine";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { theme } from "../theme/theme";

// "AI is working" moment: a cycling status line above shimmer placeholder lines.
export function GeneratingBlock({ messages, lines = 3 }: { messages: string[]; lines?: number }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduced || messages.length < 2) return;
    const id = setInterval(() => setIndex((current) => (current + 1) % messages.length), 1300);
    return () => clearInterval(id);
  }, [reduced, messages.length]);
  return (
    <View style={styles.wrap}>
      <View style={styles.statusRow}>
        <Ionicons name="sparkles" size={14} color={theme.colors.accent} />
        <Text style={styles.status}>{messages[index] ?? messages[0]}</Text>
      </View>
      <View style={styles.lines}>
        {Array.from({ length: lines }).map((_, i) => (
          <ShimmerLine key={i} width={i === lines - 1 ? "60%" : "100%"} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.sm },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  status: { ...theme.typography.body, color: theme.colors.muted },
  lines: { gap: theme.spacing.sm, marginTop: 2 }
});
