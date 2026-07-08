import { useEffect, useRef } from "react";
import { Animated, StyleSheet, type DimensionValue } from "react-native";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { theme } from "../theme/theme";

// Skeleton placeholder with a subtle opacity pulse — the "generating" unit.
export function ShimmerLine({ width = "100%", height = 12 }: { width?: DimensionValue; height?: number }) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(reduced ? 0.6 : 0.45)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduced]);
  return <Animated.View style={[styles.bar, { width, height, opacity }]} />;
}

const styles = StyleSheet.create({
  bar: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.sm }
});
