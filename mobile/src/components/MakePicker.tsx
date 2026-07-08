import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CAR_MAKES } from "../constants/makes";
import { theme } from "../theme/theme";

// Dropdown of canonical makes so the value always matches the dealer directory's
// brand names (the search uses a fast exact-match query).
export function MakePicker({ value, onChange, label = "Make", options = CAR_MAKES }: { value: string; onChange: (make: string) => void; label?: string; options?: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => setOpen((prev) => !prev)} style={styles.field}>
        <Text style={[styles.value, !value && styles.placeholder]}>{value || `Select ${label.toLowerCase()}`}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={theme.colors.muted} />
      </Pressable>
      {open ? (
        <View style={styles.menu}>
          <ScrollView style={styles.menuScroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {options.map((make) => (
              <Pressable key={make} accessibilityRole="button" accessibilityLabel={make} onPress={() => { onChange(make); setOpen(false); }} style={styles.option}>
                <Text style={[styles.optionText, make === value && styles.optionActive]}>{make}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.bgElevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    minHeight: 46,
    paddingHorizontal: theme.spacing.md
  },
  value: { ...theme.typography.body, color: theme.colors.text },
  placeholder: { color: theme.colors.faint },
  menu: { marginTop: 4, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.md, borderWidth: 1, overflow: "hidden" },
  menuScroll: { maxHeight: 240 },
  option: { paddingHorizontal: theme.spacing.md, paddingVertical: 11, borderTopColor: theme.colors.borderSoft, borderTopWidth: 1 },
  optionText: { ...theme.typography.body, color: theme.colors.text },
  optionActive: { color: theme.colors.primary, fontFamily: theme.fonts.bold }
});
