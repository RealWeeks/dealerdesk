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

export function TextInput({ accessibilityLabel, onChangeText, multiline, value, placeholder, ...props }: Props) {
  const shared = {
    ...domProps({ ...props, accessibilityLabel }),
    placeholder,
    value: value ?? "",
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeText?.(event.target.value)
  };
  return multiline ? <textarea {...shared} /> : <input {...shared} />;
}

export const StyleSheet = {
  create<T extends Record<string, unknown>>(styles: T) {
    return styles;
  },
  flatten(style: unknown) {
    return style;
  }
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
    keyboardType: _keyboardType,
    alwaysBounceVertical: _alwaysBounceVertical,
    keyboardShouldPersistTaps: _keyboardShouldPersistTaps,
    secureTextEntry: _secureTextEntry,
    style: _style,
    ...rest
  } = props;
  return {
    ...rest,
    "aria-label": accessibilityLabel,
    role: accessibilityRole === "button" ? "button" : undefined
  };
}
