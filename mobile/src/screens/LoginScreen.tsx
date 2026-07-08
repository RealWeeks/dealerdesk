import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AiBadge } from "../components/AiBadge";
import { AuthCard } from "../components/AuthCard";
import { Screen } from "../components/Screen";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { theme } from "../theme/theme";

// Minimal auth entry (kept as a standalone screen). The rich marketing entry lives
// in LandingScreen, which also embeds AuthCard.
export function LoginScreen() {
  const router = useRouter();
  const { token } = useDealDeskApp();

  useEffect(() => {
    if (token) router.replace("/home");
  }, [router, token]);

  return (
    <Screen>
      <View style={styles.hero}>
        <AiBadge />
        <Text style={styles.title}>DealDesk</Text>
        <Text style={styles.subtitle}>Your AI copilot for buying and negotiating your next car.</Text>
      </View>
      <AuthCard />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: theme.spacing.xl, gap: theme.spacing.sm },
  title: { color: theme.colors.text, ...theme.typography.display },
  subtitle: { color: theme.colors.muted, ...theme.typography.subtitle }
});
