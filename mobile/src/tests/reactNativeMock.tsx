import React from "react";

type Props = {
  children?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  onPress?: () => void;
  onChangeText?: (value: string) => void;
  multiline?: boolean;
  value?: string;
  placeholder?: string;
  [key: string]: unknown;
};

export function View({ children, ...props }: Props) {
  return <div {...domProps(props)}>{children}</div>;
}

export function Text({ children, ...props }: Props) {
  return <span {...domProps(props)}>{children}</span>;
}

export function ScrollView({ children, contentContainerStyle: _contentContainerStyle, ...props }: Props) {
  return <div {...domProps(props)}>{children}</div>;
}

export function SafeAreaView({ children, ...props }: Props) {
  return <div {...domProps(props)}>{children}</div>;
}

export function Pressable({ children, onPress, ...props }: Props) {
  return <button {...domProps(props)} onClick={onPress}>{children}</button>;
}

export const TextInput = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(function TextInput(
  { accessibilityLabel, onChangeText, onSubmitEditing, multiline, value, placeholder, ...props }: Props,
  ref
) {
  const shared = {
    ...domProps({ ...props, accessibilityLabel }),
    placeholder,
    value: value ?? "",
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeText?.(event.target.value),
    // Enter on a single-line field fires onSubmitEditing (Enter-to-submit behaviour).
    onKeyDown: (event: React.KeyboardEvent) => {
      if (!multiline && event.key === "Enter" && typeof onSubmitEditing === "function") {
        (onSubmitEditing as () => void)();
      }
    }
  };
  return multiline
    ? <textarea ref={ref as React.Ref<HTMLTextAreaElement>} {...shared} />
    : <input ref={ref as React.Ref<HTMLInputElement>} {...shared} />;
});

export const StyleSheet = {
  create<T extends Record<string, unknown>>(styles: T) {
    return styles;
  },
  flatten(style: unknown) {
    return style;
  },
  absoluteFill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  absoluteFillObject: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }
};

export function useWindowDimensions() {
  return { width: 0, height: 0, scale: 1, fontScale: 1 };
}

// --- Animation stubs: render final/static state, no timers. Reduce-motion is
// reported as ON so motion primitives short-circuit to their resolved state. ---
class AnimatedValue {
  constructor(private value: number) {}
  setValue(next: number) { this.value = next; }
  interpolate() { return this; }
  addListener() { return "0"; }
  removeAllListeners() {}
  stopAnimation() {}
}

const noopAnimation = { start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: true }), stop() {} };

export const Animated = {
  View,
  Text,
  ScrollView,
  Value: AnimatedValue,
  timing: () => noopAnimation,
  spring: () => noopAnimation,
  loop: () => noopAnimation,
  sequence: () => noopAnimation,
  parallel: () => noopAnimation,
  stagger: () => noopAnimation,
  delay: () => noopAnimation,
  createAnimatedComponent: <T,>(component: T) => component
};

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  in: (fn: (t: number) => number) => fn,
  out: (fn: (t: number) => number) => fn,
  inOut: (fn: (t: number) => number) => fn,
  quad: (t: number) => t,
  cubic: (t: number) => t
};

export const AccessibilityInfo = {
  isReduceMotionEnabled: async () => true,
  addEventListener: () => ({ remove() {} })
};

export const Linking = {
  openURL: () => Promise.resolve()
};

export const Platform = {
  OS: "ios",
  select<T>(values: { ios?: T; android?: T; default?: T }) {
    return values.ios ?? values.default;
  }
};

function domProps(props: Props) {
  const {
    accessibilityLabel,
    accessibilityRole,
    accessibilityState: _accessibilityState,
    keyboardType: _keyboardType,
    alwaysBounceVertical: _alwaysBounceVertical,
    keyboardShouldPersistTaps: _keyboardShouldPersistTaps,
    secureTextEntry: _secureTextEntry,
    placeholderTextColor: _placeholderTextColor,
    numberOfLines: _numberOfLines,
    autoCapitalize: _autoCapitalize,
    nestedScrollEnabled: _nestedScrollEnabled,
    returnKeyType: _returnKeyType,
    blurOnSubmit: _blurOnSubmit,
    style: _style,
    ...rest
  } = props;
  return {
    ...rest,
    "aria-label": accessibilityLabel,
    role: accessibilityRole === "button" ? "button" : undefined
  };
}
