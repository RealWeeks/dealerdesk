// Dark, AI-native design system.
// Existing color keys keep their names (screens that read tokens flip to dark for
// free); new tokens (accent gradients, typography, radii, shadow, layout) are added.
export const theme = {
  colors: {
    // Surfaces — widened luminance ramp so panels lift off the bg by brightness,
    // not just borders: background < bgElevated (sidebar) < surface (cards) < surfaceAlt.
    background: "#070B14",
    bgElevated: "#0E1420",
    surface: "#172033",
    surfaceAlt: "#212C42",
    // Lines — opaque `border` for tables/list rows/inputs; translucent `borderSoft`
    // reserved for boxed-card edges; `divider` for section/table/row separators.
    border: "#2A3650",
    borderSoft: "rgba(230,234,242,0.08)",
    divider: "rgba(230,234,242,0.10)",
    // Text (raised for AA contrast on the deeper bg)
    text: "#EAEEF6",
    muted: "#AEB7CC",
    faint: "#7C879E",
    // Brand / accent
    primary: "#6366F1",
    accent: "#6366F1",
    onAccent: "#FFFFFF",
    primarySoft: "rgba(99,102,241,0.15)",
    accentSoft: "rgba(99,102,241,0.15)",
    // Inputs — inset (darker than the surface they sit on) but readable
    inputBg: "#0C121E",
    inputBorder: "#2C3852",
    inputBorderFocus: "#6366F1",
    // Selected / active state
    selected: "rgba(99,102,241,0.12)",
    selectedBorder: "#6366F1",
    focusRing: "#8B8DF8",
    // Subtle hover overlay for interactive rows/controls
    hover: "rgba(230,234,242,0.04)",
    // Semantic (brightened for dark bg) + translucent soft variants
    success: "#34D399",
    successSoft: "rgba(52,211,153,0.15)",
    warning: "#FBBF24",
    warningSoft: "rgba(251,191,36,0.15)",
    danger: "#F87171",
    dangerSoft: "rgba(248,113,113,0.15)"
  },
  // Gradient stops for expo-linear-gradient (used for fills, never text).
  // `as const` makes each a readonly tuple so it satisfies LinearGradient's colors prop.
  gradients: {
    accent: ["#6366F1", "#A855F7", "#22D3EE"] as const,
    accentSubtle: ["rgba(99,102,241,0.28)", "rgba(34,211,238,0.10)"] as const,
    hero: ["#070B14", "#172033"] as const
  },
  // Font family names loaded via @expo-google-fonts in app/_layout.tsx
  fonts: {
    display: "SpaceGrotesk_700Bold",
    body: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
    extrabold: "Inter_800ExtraBold"
  },
  typography: {
    display: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 40, lineHeight: 46, letterSpacing: -0.5 },
    title: { fontFamily: "Inter_800ExtraBold", fontSize: 28, lineHeight: 34, letterSpacing: -0.3 },
    heading: { fontFamily: "Inter_700Bold", fontSize: 20, lineHeight: 26 },
    subtitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, lineHeight: 22 },
    body: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 },
    label: { fontFamily: "Inter_600SemiBold", fontSize: 13, lineHeight: 16, letterSpacing: 0.3 },
    caption: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 16 }
  },
  spacing: { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48 },
  // radius kept as a number for backward-compat; radii is the new scale
  radius: 8,
  radii: { sm: 8, md: 12, lg: 16, pill: 999 },
  shadow: {
    card: "0px 1px 3px rgba(0,0,0,0.4)",
    raised: "0px 10px 30px rgba(0,0,0,0.5)",
    glow: "0px 0px 24px rgba(124,107,255,0.45)"
  },
  breakpoints: { tablet: 768, desktop: 1024, sidebar: 900, rail: 1200 },
  layout: { content: 900, wide: 1200, sidebarWidth: 248, shell: 1280, main: 860, rail: 320 },
  control: { sm: 40, md: 48 },
  motion: { fast: 160, base: 240, slow: 400 }
};
