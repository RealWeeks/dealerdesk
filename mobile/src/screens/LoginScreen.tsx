import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { theme } from "../theme/theme";

export function LoginScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login, register, loading, error, token } = useDealDeskApp();

  async function submit() {
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      router.replace("/home");
    } catch {
      // Error state is owned by the app provider and rendered below the fields.
    }
  }

  useEffect(() => {
    if (token) router.replace("/home");
  }, [router, token]);

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.title}>DealDesk</Text>
        <Text style={styles.subtitle}>AI car buying and negotiation assistant</Text>
      </View>
      <Card>
        <Text style={styles.heading}>{mode === "login" ? "Log in" : "Create account"}</Text>
        <TextInput accessibilityLabel="Email" placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} style={styles.input} />
        <TextInput accessibilityLabel="Password" placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" onPress={submit} disabled={loading} style={styles.primaryButton}>
          <Text style={styles.primaryText}>{loading ? "Working..." : mode === "login" ? "Log in" : "Register"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setMode(mode === "login" ? "register" : "login")}>
          <Text style={styles.link}>{mode === "login" ? "Need an account?" : "Already registered?"}</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 36, gap: 8 },
  title: { color: theme.colors.text, fontSize: 38, fontWeight: "800" },
  subtitle: { color: theme.colors.muted, fontSize: 16 },
  heading: { color: theme.colors.text, fontSize: 22, fontWeight: "800" },
  input: { borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, color: theme.colors.text, minHeight: 48, paddingHorizontal: 12 },
  primaryButton: { alignItems: "center", backgroundColor: theme.colors.primary, borderRadius: theme.radius, minHeight: 48, justifyContent: "center" },
  primaryText: { color: "#fff", fontWeight: "800" },
  error: { color: theme.colors.danger, fontWeight: "700" },
  link: { color: theme.colors.primary, fontWeight: "700", textAlign: "center" }
});
