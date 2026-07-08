import { useEffect, useState } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { useReducedMotion } from "../hooks/useReducedMotion";

// Progressive text reveal for decorative / read-only moments only (e.g. hero preview).
// Renders full text instantly under reduced motion or when `instant` is set.
export function TypewriterText({ text, style, speed = 18, instant = false }: { text: string; style?: StyleProp<TextStyle>; speed?: number; instant?: boolean }) {
  const reduced = useReducedMotion();
  const skip = reduced || instant;
  const [count, setCount] = useState(skip ? text.length : 0);
  useEffect(() => {
    if (skip) {
      setCount(text.length);
      return;
    }
    setCount(0);
    const id = setInterval(() => {
      setCount((current) => {
        if (current >= text.length) {
          clearInterval(id);
          return current;
        }
        return current + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [text, skip, speed]);
  return <Text style={style}>{text.slice(0, count)}</Text>;
}
