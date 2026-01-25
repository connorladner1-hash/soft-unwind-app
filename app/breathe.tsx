import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { theme } from "../constants/theme";
import { getBreathe, makeKey, setBreathe, type BreathePayload } from "./lib/sessionCache";

const BREATHE_URL = "https://soft-reset-app.vercel.app/api/breathe";

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const ss = s.toString().padStart(2, "0");
  return `${m}:${ss}`;
}

export default function Breathe() {
  // under 60 seconds
  const TOTAL = 50;

  const params = useLocalSearchParams<{ userState?: string; dump?: string; reflection?: string }>();
  const userState = (params.userState ?? "").toString();
  const dump = (params.dump ?? "").toString();
  const reflection = (params.reflection ?? "").toString();

  const [secondsLeft, setSecondsLeft] = useState(TOTAL);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<BreathePayload | null>(null);

  const key = useMemo(() => makeKey({ userState, dump, reflection }), [userState, dump, reflection]);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const done = secondsLeft === 0;

  useEffect(() => {
    if (done) router.push("/close");
  }, [done]);

  // Call AI ONCE per session (cached)
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);

        const cached = getBreathe(key);
        if (cached) {
          if (!cancelled) setPayload(cached);
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        let res: Response;
        try {
          res = await fetch(BREATHE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userState, dump, reflection }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        const raw = await res.text();
        let data: any = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          console.log("NON-JSON from /api/breathe:", raw.slice(0, 300));
        }

        if (!res.ok) {
          console.log("Breathe API error:", res.status, data);
          const fallback: BreathePayload = {
            title: "Breathe with me",
            prompts: [
              "You’re here. That’s enough for tonight.",
              "Let your shoulders soften a little.",
              "Let the surface under you support you.",
              "You did enough for today.",
            ],
          };
          setBreathe(key, fallback);
          if (!cancelled) setPayload(fallback);
          return;
        }

        const title = String(data?.title || "Breathe with me");
        const prompts = Array.isArray(data?.prompts)
          ? data.prompts.map((p: any) => String(p || "").trim()).filter(Boolean).slice(0, 4)
          : [];

        while (prompts.length < 4) prompts.push("Stay with this moment. Nothing to solve right now.");

        const result: BreathePayload = { title, prompts, modelUsed: data?.modelUsed };
        setBreathe(key, result);
        if (!cancelled) setPayload(result);
      } catch (e) {
        console.log("Breathe fetch failed:", e);
        const fallback: BreathePayload = {
          title: "Breathe with me",
          prompts: [
            "You’re here. That’s enough for tonight.",
            "Let your body rest where it can.",
            "Let your mind do what it does—no fixing required.",
            "You did enough for today.",
          ],
        };
        setBreathe(key, fallback);
        if (!cancelled) setPayload(fallback);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [key, userState, dump, reflection]);

  // show prompt at ~0 / 15 / 30 / 45 seconds
  const promptIndex = useMemo(() => {
    const elapsed = TOTAL - secondsLeft;
    return Math.min(3, Math.max(0, Math.floor(elapsed / 15)));
  }, [secondsLeft]);

  const prompt = payload?.prompts?.[promptIndex] || "";

  return (
    <Screen style={{ justifyContent: "center" }}>
      <Text style={styles.title}>{payload?.title || "…"}</Text>
      <Text style={styles.sub}>Under a minute. Nothing to perfect.</Text>

      <View style={styles.card}>
        {loading ? (
          <View style={{ alignItems: "center", gap: theme.space.s }}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Making this feel personal…</Text>
          </View>
        ) : (
          <Text style={styles.prompt}>{prompt}</Text>
        )}

        <View style={styles.timerRow}>
          <Text style={styles.timerLabel}>Timer</Text>
          <Text style={styles.timer}>{formatMMSS(secondsLeft)}</Text>
        </View>
      </View>

      <PrimaryButton label={done ? "Continue" : "Skip"} onPress={() => router.push("/close")} />
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
    textAlign: "center",
  },
  sub: {
    fontSize: theme.type.subSize,
    lineHeight: theme.type.subLine,
    opacity: 0.75,
    marginBottom: theme.space.l,
    color: theme.colors.text,
    textAlign: "center",
  },
  card: {
    borderRadius: theme.radius.m,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space.l,
    marginBottom: theme.space.l,
    minHeight: 170,
    justifyContent: "center",
  },
  prompt: {
    fontSize: 18,
    lineHeight: 26,
    color: theme.colors.text,
    opacity: 0.92,
    textAlign: "center",
    marginBottom: theme.space.l,
  },
  loadingText: {
    fontSize: 13,
    color: theme.colors.text,
    opacity: 0.75,
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timerLabel: {
    fontSize: 14,
    opacity: 0.65,
    color: theme.colors.text,
    fontWeight: "600",
  },
  timer: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "700",
  },
});

