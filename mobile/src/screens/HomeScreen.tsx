import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { theme } from "../theme/theme";

export function HomeScreen() {
  const { activeSearch, createDefaultSearch, dealers, error, loading, logout, offers, user } = useDealDeskApp();
  const router = useRouter();
  const bestOffer = [...offers].sort((a, b) => (a.otdPrice ?? Infinity) - (b.otdPrice ?? Infinity))[0];
  const outreachCount = dealers.filter((dealer) => dealer.status === "not_contacted").length;

  async function signOut() {
    await logout();
    router.replace("/");
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>DealDesk</Text>
          {user ? <Text style={styles.muted}>{user.email}</Text> : null}
        </View>
        <Pressable accessibilityRole="button" onPress={signOut} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!activeSearch ? (
        <Card>
          <Badge label="No active search" tone="warning" />
          <Text style={styles.body}>Create the starter Lexus search to begin the real dealer workflow.</Text>
          <Pressable accessibilityRole="button" onPress={createDefaultSearch} disabled={loading} style={styles.button}>
            <Text style={styles.buttonText}>{loading ? "Creating..." : "Create Active Search"}</Text>
          </Pressable>
        </Card>
      ) : (
        <>
          <Card>
            <Badge label="Active search" />
            <Text style={styles.title}>{activeSearch.year} {activeSearch.make} {activeSearch.model}</Text>
            <Text style={styles.muted}>{activeSearch.trim} within {activeSearch.searchRadiusMiles} miles of {activeSearch.zipCode}</Text>
            <Pressable accessibilityRole="button" onPress={() => router.replace("/search-setup")} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Edit Search</Text>
            </Pressable>
          </Card>
          <Card>
            <View style={styles.row}>
              <Text style={styles.kicker}>Outreach queue</Text>
              <Badge label={`${outreachCount} dealers`} tone={outreachCount ? "warning" : "success"} />
            </View>
            <Text style={styles.body}>{outreachCount ? `${outreachCount} dealers not contacted` : "No dealers waiting for initial outreach"}</Text>
            <Pressable accessibilityRole="button" onPress={() => router.replace("/outreach")} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Start outreach</Text>
            </Pressable>
          </Card>
          <Card>
            <Text style={styles.kicker}>Best current offer</Text>
            {bestOffer ? (
              <>
                <Text style={styles.price}>{bestOffer.otdPrice ? `$${bestOffer.otdPrice.toLocaleString()} OTD` : "OTD missing"}</Text>
                <Text style={styles.muted}>Dealer offer on file</Text>
              </>
            ) : <Text style={styles.muted}>No offers yet</Text>}
          </Card>
          <Card>
            <Text style={styles.kicker}>Next recommended action</Text>
            <Text style={styles.body}>Ask finalists for an itemized OTD quote and confirmation that trade-in and financing are separate.</Text>
          </Card>
          <Card>
            <View style={styles.row}>
              <Text style={styles.kicker}>Needs follow-up</Text>
              <Badge label={`${dealers.filter((dealer) => dealer.status === "needs_reply").length}`} tone="warning" />
            </View>
            {dealers.filter((dealer) => dealer.status === "needs_reply").length ? dealers.filter((dealer) => dealer.status === "needs_reply").map((dealer) => <Text key={dealer._id} style={styles.body}>{dealer.name}</Text>) : <Text style={styles.muted}>No dealers need replies yet</Text>}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  appName: { color: theme.colors.text, fontSize: 32, fontWeight: "900" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 12 },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: "800" },
  kicker: { color: theme.colors.muted, fontSize: 13, fontWeight: "800", textTransform: "uppercase" },
  muted: { color: theme.colors.muted },
  body: { color: theme.colors.text, fontSize: 16, lineHeight: 22 },
  price: { color: theme.colors.success, fontSize: 28, fontWeight: "900" },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  button: { alignItems: "center", backgroundColor: theme.colors.primary, borderRadius: theme.radius, minHeight: 46, justifyContent: "center" },
  buttonText: { color: "#fff", fontWeight: "800" },
  secondaryButton: { alignItems: "center", borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, minHeight: 42, justifyContent: "center" },
  secondaryText: { color: theme.colors.text, fontWeight: "800" },
  logoutButton: { alignItems: "center", borderColor: theme.colors.border, borderRadius: theme.radius, borderWidth: 1, minHeight: 38, justifyContent: "center", paddingHorizontal: 12 },
  logoutText: { color: theme.colors.text, fontWeight: "800" },
  error: { color: theme.colors.danger, fontWeight: "700" }
});
