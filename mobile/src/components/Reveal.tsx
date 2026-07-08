import { useEffect, useRef, type PropsWithChildren } from "react";
import { Animated } from "react-native";
import { useReducedMotion } from "../hooks/useReducedMotion";

// Fades + lifts children in on mount. Content is always in the tree (opacity 0→1),
// so it animates appearance only — accessibility and tests are unaffected.
export function Reveal({ children, delay = 0 }: PropsWithChildren<{ delay?: number }>) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, { toValue: 1, duration: 320, delay, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [progress, reduced, delay]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [6, 0] });
  return <Animated.View style={{ opacity: progress, transform: [{ translateY }] }}>{children}</Animated.View>;
}
