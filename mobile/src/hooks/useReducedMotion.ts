import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

// Under test we report reduced-motion = true so motion primitives render their final
// state synchronously (no timers, no async setState → no act warnings, deterministic).
const IS_TEST = typeof process !== "undefined" && process.env?.NODE_ENV === "test";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (IS_TEST) return;
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReduced);
    return () => {
      active = false;
      sub?.remove?.();
    };
  }, []);
  return IS_TEST ? true : reduced;
}
