import { useWindowDimensions } from "react-native";
import { theme } from "../theme/theme";

// Single source of responsive truth. Degrades to mobile/1-column when width is
// unknown (0) — e.g. the jsdom test environment — so nothing branches oddly there.
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const w = width || 0;
  return {
    width: w,
    isTablet: w >= theme.breakpoints.tablet,
    isDesktop: w >= theme.breakpoints.desktop,
    isWide: w >= theme.breakpoints.sidebar,
    // Wide enough for a two-column main + right-rail layout (sidebar already takes ~248px).
    hasRail: w >= theme.breakpoints.rail,
    columns: w >= theme.breakpoints.desktop ? 3 : w >= theme.breakpoints.tablet ? 2 : 1
  };
}
