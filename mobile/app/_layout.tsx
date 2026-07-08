import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from "@expo-google-fonts/inter";
import { SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DealDeskProvider, useDealDeskApp } from "../src/hooks/useDealDeskApp";
import { theme } from "../src/theme/theme";

const client = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    SpaceGrotesk_700Bold
  });

  // Gate render until fonts resolve so text doesn't flash in a fallback face.
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;

  return (
    <QueryClientProvider client={client}>
      <SafeAreaProvider>
        <DealDeskProvider>
          <StatusBar style="light" />
          <AuthRedirector />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.colors.bgElevated },
              headerTintColor: theme.colors.text,
              headerTitleStyle: { fontFamily: theme.fonts.bold, color: theme.colors.text },
              contentStyle: { backgroundColor: theme.colors.background }
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="search-setup" options={{ title: "Search setup" }} />
            <Stack.Screen name="manual-quote" options={{ title: "Manual quote" }} />
            <Stack.Screen name="capture-vehicle" options={{ title: "Capture a car" }} />
          </Stack>
        </DealDeskProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function AuthRedirector() {
  const { loading, token } = useDealDeskApp();
  const router = useRouter();
  const segments = useSegments();
  const firstSegment = segments[0];
  const isAuthScreen = !firstSegment;

  useEffect(() => {
    if (loading) return;
    if (!token && !isAuthScreen) router.replace("/");
    if (token && isAuthScreen) router.replace("/home");
  }, [isAuthScreen, loading, router, token]);

  return null;
}
