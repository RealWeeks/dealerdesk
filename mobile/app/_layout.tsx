import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DealDeskProvider, useDealDeskApp } from "../src/hooks/useDealDeskApp";
import { theme } from "../src/theme/theme";

const client = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={client}>
      <SafeAreaProvider>
        <DealDeskProvider>
          <AuthRedirector />
          <Stack screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="search-setup" options={{ title: "Search setup" }} />
            <Stack.Screen name="manual-quote" options={{ title: "Manual quote" }} />
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
