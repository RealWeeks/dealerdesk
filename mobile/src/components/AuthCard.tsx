import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "./Button";
import { Card } from "./Card";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { theme } from "../theme/theme";

export function AuthCard({ defaultMode = "login" }: { defaultMode?: "login" | "register" }) {
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef<TextInput>(null);
  const router = useRouter();
  const { login, register, loading, error } = useDealDeskApp();

  async function submit() {
    if (loading) return; // prevent double submit
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      router.replace("/home");
    } catch {
      // Error state is owned by the app provider and rendered below the fields.
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.heading}>{mode === "login" ? "Log in" : "Create account"}</Text>
      <TextInput
        accessibilityLabel="Email"
        placeholder="Email"
        placeholderTextColor={theme.colors.faint}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        ref={passwordRef}
        accessibilityLabel="Password"
        placeholder="Password"
        placeholderTextColor={theme.colors.faint}
        secureTextEntry
        returnKeyType="go"
        onSubmitEditing={submit}
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label={loading ? "Working..." : mode === "login" ? "Log in" : "Create account"} onPress={submit} disabled={loading} />
      <Pressable accessibilityRole="button" onPress={() => setMode(mode === "login" ? "register" : "login")}>
        <Text style={styles.link}>{mode === "login" ? "Need an account? Sign up" : "Already registered? Log in"}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.spacing.md },
  heading: { color: theme.colors.text, ...theme.typography.heading },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    minHeight: 48,
    paddingHorizontal: 14
  },
  error: { color: theme.colors.danger, fontFamily: theme.fonts.semibold },
  link: { color: theme.colors.primary, fontFamily: theme.fonts.semibold, textAlign: "center" }
});
