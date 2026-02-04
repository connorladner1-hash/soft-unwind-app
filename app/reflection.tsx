import { ScreenMascot } from "@/components/ScreenMascot";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { GlassCard } from "../components/ui/GlassCard";
import { Screen } from "../components/Screen";
import { theme } from "../constants/theme";

const REFLECT_URL = "https://soft-reset-app.vercel.app/api/reflect";

export default function ReflectionScreen() {
  const {
    dump = "",
    feelingId = "", // ✅ add
    feelingLabel = "",
    timeLabel = "",
    userState = "",
  } =
    useLocalSearchParams<{
      dump?: string;
      feelingId?: string; // ✅ add
      feelingLabel?: string;
      timeLabel?: string;
      userState?: string;
    }>();

  const dumpStr = (dump ?? "").toString();
  const feelingIdStr = (feelingId ?? "").toString(); // ✅ add
  const feelingStr = (feelingLabel ?? "").toString();
  const timeStr = (timeLabel ?? "").toString();

  const [reflection, setReflection] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function runReflection() {
      try {
        const cleanDump = String(dumpStr ?? "").trim();
        console.log("Reflection dump length:", cleanDump.length);

        // If nothing was typed, don't call API
        if (cleanDump.length === 0) {
          if (!cancelled) {
            setReflection("");
            setLoading(false);
          }
          return;
        }

        console.log("Starting reflect fetch...");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s

        let res: Response;
        try {
          res = await fetch(REFLECT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dump: cleanDump,
              feelingLabel: feelingStr,
              timeLabel: timeStr,
              // feelingId is optional for reflect, but you can include it if you want:
              // feelingId: feelingIdStr,
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        console.log("Reflect response received:", res.status);

        const raw = await res.text();
        let data: any = {};

        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          console.log("NON-JSON from /api/reflect:", raw.slice(0, 300));
          if (!cancelled) setReflection(cleanDump);
          return;
        }

        if (!res.ok) {
          console.log("Reflect API error:", res.status, data);
          if (!cancelled) setReflection(cleanDump);
          return;
        }

        console.log("API Response Debug:", data.debug);
        console.log("Model Used:", data.modelUsed);
        console.log("Response Length:", data.text?.length);

        const aiText =
          typeof data?.text === "string" && data.text.trim().length > 0
            ? data.text
            : cleanDump;

        if (!cancelled) setReflection(aiText);
      } catch (err) {
        console.log("Reflection fetch failed:", err);
        if (!cancelled) setReflection(String(dumpStr ?? "").trim());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    runReflection();
    return () => {
      cancelled = true;
    };
  }, [dumpStr, feelingStr, timeStr]);

  const onContinue = () => {
  router.push({
    pathname: "/paywallScreen",
    params: {
      userState,
      dump: dumpStr,
      reflection: (reflection || "").trim() || dumpStr,
      feelingId: feelingIdStr,
      feelingLabel: feelingStr,
      timeLabel: timeStr,
    },
  });
};


  return (
    <Screen style={{ justifyContent: "flex-start" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ScreenMascot size={130} style={styles.mascot} />
        <Text style={styles.title}>Reflection</Text>

        {!!feelingStr || !!timeStr ? (
          <View style={styles.metaRow}>
            {!!feelingStr && <Text style={styles.metaPill}>{feelingStr}</Text>}
            {!!timeStr && <Text style={styles.metaPill}>{timeStr}</Text>}
          </View>
        ) : null}

        <GlassCard style={styles.card}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={theme.colors.text} />
              <Text style={styles.loadingText}>Creating something gentle…</Text>
            </View>
          ) : (
            <Text style={styles.body}>{reflection}</Text>
          )}
        </GlassCard>

        <PrimaryButton label="Continue" onPress={onContinue} disabled={loading} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.space.l,
  },
  mascot: {
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: theme.type.titleSize,
    lineHeight: theme.type.titleLine,
    fontWeight: "600",
    marginBottom: theme.space.s,
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: "row",
    gap: theme.space.s,
    marginBottom: theme.space.m,
  },
  metaPill: {
    fontSize: 13,
    color: theme.colors.text,
    backgroundColor: theme.colors.pillBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    opacity: 0.9,
  },
  card: {
    marginBottom: theme.space.l,
    minHeight: 160,
  },
  body: {
    fontSize: theme.type.bodySize,
    lineHeight: theme.type.bodyLine,
    color: theme.colors.text,
    opacity: 0.9,
  },
  loadingWrap: {
    gap: theme.space.s,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: theme.space.m,
  },
  loadingText: {
    fontSize: 13,
    color: theme.colors.textMuted ?? theme.colors.text,
    opacity: 0.8,
  },
});
