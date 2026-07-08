import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { theme } from "../theme/theme";

export type WorkflowStep = { n: number; title: string; desc: string; ai?: boolean };

const SEG = 100; // viewBox units per step
const CY = 50;
const AMP = 22;
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Curved, organic connector path weaving between step-node centers (alternating waves).
function buildPath(count: number) {
  let d = `M 50 ${CY}`;
  for (let i = 1; i < count; i++) {
    const x0 = (i - 1) * SEG + 50;
    const x1 = i * SEG + 50;
    const dir = i % 2 === 1 ? -1 : 1;
    d += ` C ${x0 + SEG * 0.35} ${CY + dir * AMP} ${x1 - SEG * 0.35} ${CY - dir * AMP} ${x1} ${CY}`;
  }
  return d;
}

export function WorkflowFlow({ steps }: { steps: WorkflowStep[] }) {
  const { isTablet } = useBreakpoint();
  const reduced = useReducedMotion();
  const dash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(Animated.timing(dash, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, [dash, reduced]);

  const strokeDashoffset = dash.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });

  if (isTablet) {
    return (
      <View>
        <View style={styles.connector}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${steps.length * SEG} 100`} preserveAspectRatio="none">
            <Defs>
              <SvgLinearGradient id="flow" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={theme.gradients.accent[0]} />
                <Stop offset="0.5" stopColor={theme.gradients.accent[1]} />
                <Stop offset="1" stopColor={theme.gradients.accent[2]} />
              </SvgLinearGradient>
            </Defs>
            {/* base line */}
            <Path d={buildPath(steps.length)} stroke="url(#flow)" strokeWidth={2} fill="none" opacity={0.35} />
            {/* flowing dash on top */}
            <AnimatedPath d={buildPath(steps.length)} stroke="url(#flow)" strokeWidth={2.5} fill="none" strokeDasharray="10 14" strokeDashoffset={reduced ? 0 : strokeDashoffset} strokeLinecap="round" />
          </Svg>
          <View style={styles.dotRow}>
            {steps.map((step) => (
              <View key={step.n} style={styles.dotCell}>
                <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dot}>
                  <Text style={styles.dotText}>{step.n}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.textRow}>
          {steps.map((step) => (
            <View key={step.n} style={styles.textCell}>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.desc}>{step.desc}</Text>
              {step.ai ? (
                <View style={styles.aiTag}>
                  <Ionicons name="sparkles" size={10} color={theme.colors.accent} />
                  <Text style={styles.aiTagText}>AI</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Narrow: vertical timeline with a gradient rail.
  return (
    <View style={styles.vwrap}>
      <View style={styles.rail}>
        <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      </View>
      {steps.map((step) => (
        <View key={step.n} style={styles.vrow}>
          <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dot}>
            <Text style={styles.dotText}>{step.n}</Text>
          </LinearGradient>
          <View style={styles.vtext}>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.desc}>{step.desc}</Text>
            {step.ai ? (
              <View style={styles.aiTag}>
                <Ionicons name="sparkles" size={10} color={theme.colors.accent} />
                <Text style={styles.aiTagText}>AI</Text>
              </View>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Horizontal
  connector: { height: 64, justifyContent: "center" },
  dotRow: { flexDirection: "row", alignItems: "center", ...StyleSheet.absoluteFillObject },
  dotCell: { flex: 1, alignItems: "center" },
  textRow: { flexDirection: "row", marginTop: theme.spacing.xs },
  textCell: { flex: 1, alignItems: "center", paddingHorizontal: theme.spacing.sm, gap: 4 },
  // Vertical
  vwrap: { position: "relative", gap: theme.spacing.md },
  rail: { position: "absolute", left: 14, top: 24, bottom: 24, width: 2, opacity: 0.5 },
  vrow: { flexDirection: "row", alignItems: "flex-start", gap: theme.spacing.md },
  vtext: { flex: 1, gap: 4, paddingTop: 2 },
  // Shared node bits
  dot: { width: 30, height: 30, borderRadius: theme.radii.pill, alignItems: "center", justifyContent: "center" },
  dotText: { color: theme.colors.onAccent, fontFamily: theme.fonts.bold, fontSize: 14 },
  title: { ...theme.typography.heading, color: theme.colors.text },
  desc: { ...theme.typography.body, color: theme.colors.muted },
  aiTag: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: theme.colors.accentSoft, borderRadius: theme.radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  aiTagText: { ...theme.typography.caption, color: theme.colors.accent, fontFamily: theme.fonts.bold, letterSpacing: 0.4 }
});
