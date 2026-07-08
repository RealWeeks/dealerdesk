import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { AiBadge } from "../components/AiBadge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyStateCard } from "../components/EmptyStateCard";
import { GeneratingBlock } from "../components/GeneratingBlock";
import { PageHeader } from "../components/PageHeader";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { useDealDeskApp } from "../hooks/useDealDeskApp";
import { ReviewAIExtractionScreen } from "./ReviewAIExtractionScreen";
import { theme } from "../theme/theme";

export function CaptureVehicleScreen() {
  const { captureVehicleFromImage, captureVehicleFromUrl, error, loading, pendingVehicleCapture, selectedDealer } = useDealDeskApp();
  const [url, setUrl] = useState("");
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  async function runCapture(fn: () => Promise<unknown>) {
    setCapturing(true);
    try {
      await fn();
    } finally {
      setCapturing(false);
    }
  }

  // Once a car is captured, hand off to the shared review/edit screen.
  if (pendingVehicleCapture) return <ReviewAIExtractionScreen />;

  if (!selectedDealer) {
    return (
      <Screen>
        <PageHeader title="Capture a car" description="Add the exact car you're negotiating on so DealDesk can reference it in messages and offers." right={<AiBadge />} />
        <EmptyStateCard icon="storefront-outline" title="Open a dealer first" description="Open a dealer from the Dealers tab, then capture a car from their listing." />
      </Screen>
    );
  }

  async function pickScreenshot() {
    setPickerError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPickerError("Photo library permission is needed to read a screenshot.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    const base64 = result.canceled ? undefined : result.assets[0]?.base64 ?? undefined;
    if (base64) await runCapture(() => captureVehicleFromImage(base64));
  }

  return (
    <Screen>
      <PageHeader
        title="Capture a car"
        description={`Add the exact car from ${selectedDealer.name} by pasting a listing link or a screenshot. DealDesk reads the trim, VIN, and price for you to review.`}
        right={<AiBadge />}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {pickerError ? <Text style={styles.error}>{pickerError}</Text> : null}

      {capturing ? (
        <Card>
          <GeneratingBlock messages={["Analyzing listing…", "Extracting VIN, trim, and dealer info…", "Reading price and options…"]} />
        </Card>
      ) : (
        <>
          <Section title="Paste a listing link" divider={false}>
            <TextInput
              accessibilityLabel="Listing URL"
              autoCapitalize="none"
              keyboardType="url"
              onChangeText={setUrl}
              placeholder="https://dealer.com/inventory/..."
              placeholderTextColor={theme.colors.faint}
              style={styles.input}
              value={url}
            />
            <Button label={loading ? "Reading..." : "Capture from link"} disabled={!url || loading} onPress={() => runCapture(() => captureVehicleFromUrl(url))} style={styles.selfStart} />
            <Text style={styles.muted}>Some dealer sites block scraping — if the details come back empty, use a screenshot.</Text>
          </Section>

          <Section title="Upload a screenshot">
            <Text style={styles.muted}>We read the text on the image (free, on-device OCR happens on the server) and pre-fill the details for you to review.</Text>
            <Button label="Choose screenshot" variant="secondary" disabled={loading} onPress={pickScreenshot} style={styles.selfStart} />
          </Section>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { ...theme.typography.body, color: theme.colors.muted },
  error: { ...theme.typography.body, color: theme.colors.danger, fontFamily: theme.fonts.semibold },
  selfStart: { alignSelf: "flex-start" },
  input: { ...theme.typography.body, backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, color: theme.colors.text, minHeight: 44, paddingHorizontal: theme.spacing.md }
});
