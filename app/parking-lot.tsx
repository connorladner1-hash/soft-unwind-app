import { ScreenMascot } from "@/components/ScreenMascot";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { theme } from "../constants/theme";

function normalizeText(raw: string) {
  return String(raw ?? "").replace(/\r/g, "").trim();
}

// Prefer list-like lines first, then fall back to sentence splitting.
function extractParkingItems(raw: string): string[] {
  const text = normalizeText(raw);
  if (!text) return [];

  // Remove common “soft unwind” preamble lines if they exist
  const cleaned = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((line) => !/^here is a gentle reflection/i.test(line));

  // 1) Lines that look like bullets/numbered lists
  let parts = cleaned
    .map((line) => line.replace(/^[-•*]\s+/, "").replace(/^\d+[\).\]]\s+/, ""))
    .filter(Boolean);

  // If we have multiple strong “line items”, use them.
  // Otherwise do a sentence split.
  const looksLikeList = parts.length >= 3;

  if (!looksLikeList) {
    const joined = cleaned.join(" ");
    parts = joined
      .split(/[.!?]+/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Final cleanup, cap length per item
  return parts
    .map((p) => p.replace(/\s+/g, " "))
    .filter(Boolean)
    .map((p) => (p.length > 90 ? p.slice(0, 87) + "…" : p))
    .slice(0, 5);
}

export default function ParkingLot() {
  const params = useLocalSearchParams<{
    dump?: string;
    reflection?: string;   // ✅ add (good to carry)
    feelingId?: string;    // ✅ add (required for breathe)
    feelingLabel?: string;
    timeId?: string;
    timeLabel?: string;
    userState?: string;
  }>();

  const dump = normalizeText((params.dump ?? "").toString());
  const reflectionStr = (params.reflection ?? "").toString(); // ✅ add
  const feelingIdStr = (params.feelingId ?? "").toString();   // ✅ add
  const feelingLabelStr = (params.feelingLabel ?? "").toString();
  const timeIdStr = (params.timeId ?? "").toString();
  const timeLabelStr = (params.timeLabel ?? "").toString();
  const userStateStr = (params.userState ?? "").toString();

  // ✅ Parking source: ONLY the user's brain dump
  const sourceText = dump;

  const initialItems = useMemo(() => extractParkingItems(sourceText), [sourceText]);
  const [items, setItems] = useState<string[]>(initialItems);

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Screen style={{ justifyContent: "flex-start" }}>
      <ScreenMascot size={110} style={{ marginBottom: 8 }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.space.l }}
      >
        <Text style={styles.title}>These can wait.</Text>
        <Text style={styles.sub}>I’ll hold them for tomorrow.</Text>

        <View style={styles.card}>
          {items.length === 0 ? (
            <Text style={styles.empty}>Nothing to organize right now. That’s okay.</Text>
          ) : (
            items.map((item, idx) => (
              <Pressable
                key={`${item}-${idx}`}
                onPress={() => removeItem(idx)}
                style={[styles.row, idx === 0 ? styles.rowFirst : null]}
              >
                <View style={styles.dot} />
                <Text style={styles.rowText}>{item}</Text>
                <Text style={styles.remove}>×</Text>
              </Pressable>
            ))
          )}
        </View>

        <Text style={styles.hint}>Tap a line to set it aside.</Text>

        <PrimaryButton
          label="I’m ready to rest"
          onPress={() =>
            router.push({
              pathname: "/calm-narrative",
              params: {
                dump,
                reflection: reflectionStr,   // ✅ forward
                feelingId: feelingIdStr,     // ✅ forward (critical)
                feelingLabel: feelingLabelStr,
                timeId: timeIdStr,
                timeLabel: timeLabelStr,
                userState: userStateStr,
              },
            })
          }
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: theme.type.titleSize,
    lineHeight: theme.type.titleLine,
    fontWeight: "600",
    marginBottom: theme.space.s,
    color: theme.colors.text,
  },
  sub: {
    fontSize: theme.type.subSize,
    lineHeight: theme.type.subLine,
    opacity: 0.75,
    marginBottom: theme.space.m,
    color: theme.colors.text,
  },
  card: {
    borderRadius: theme.radius.m,
    backgroundColor: theme.colors.cardStrong ?? theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.space.s,
    marginBottom: theme.space.s,
  },
  empty: {
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
    opacity: 0.75,
    padding: theme.space.m,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.space.s,
    paddingVertical: 12,
    paddingHorizontal: theme.space.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 7,
    backgroundColor: theme.colors.text,
    opacity: 0.5,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
    opacity: 0.92,
  },
  remove: {
    fontSize: 22,
    lineHeight: 22,
    opacity: 0.35,
    color: theme.colors.text,
    marginTop: -2,
  },
  hint: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: theme.space.l,
    color: theme.colors.text,
  },
});

