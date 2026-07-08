import { Children, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { theme } from "../theme/theme";

// Responsive card grid: 1 column on phones, 2 on tablets, 3 on desktop.
export function Grid({ children }: { children: ReactNode }) {
  const { columns } = useBreakpoint();
  const items = Children.toArray(children);
  const basis = columns === 1 ? "100%" : columns === 2 ? "48%" : "31.5%";
  return (
    <View style={styles.grid}>
      {items.map((child, index) => (
        <View key={index} style={{ width: basis as unknown as number }}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md }
});
