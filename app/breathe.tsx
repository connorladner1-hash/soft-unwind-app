import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { theme } from "../constants/theme";
import { getBreathe, makeKey, setBreathe, type BreathePayload } from "./lib/sessionCache";

const BREATHE_URL = "https://soft-reset-app.vercel.app/api/breathe";

type FeelingId = "brain" | "tense" | "restless" | "lonely";
function isFeelingId(x: any): x is FeelingId {
  return x === "brain" || x === "tense" || x === "restless" || x === "lonely";
}

/**
 * These are the “Option 1–4” prompts you provided.
 * Keep them server-side later if you want, but client-side is fine for MVP.
 */
const OPTION_PROMPTS: Record<FeelingId, string> = {
  brain: `
You are guiding a late-night cognitive downshift for someone whose mind feels busy and overactive.

Goal:
Reduce cognitive grip by removing effort, control, and problem-solving. Help thoughts lose momentum naturally so the user can drift toward sleep.

Tone:
Soft, slow, minimal, and non-directive. Calm but not reassuring. Gentle, not poetic or chatty.

Rules:
- Do NOT give advice, reassurance, reframing, or explanations.
- Do NOT ask questions.
- Do NOT use breath counting or focus instructions.
- Do NOT try to stop or fix thoughts.
- Do NOT encourage effort, control, or improvement.
- Avoid affirmations and “you’re okay” language.

What to do:
- Use gentle imagery related to drifting, fading, floating, dimming, or passing.
- Treat thoughts as background movement that does not require attention.
- Emphasize permission, not action.
- Use short sentences and pauses.
- Allow thoughts to exist without engagement.

Structure:
- 30–90 seconds of guidance
- Start by removing the need to stop thinking
- Introduce passive imagery
- End with permission to let attention soften or fade

Desired feeling:
“There is nothing I need to do. My thoughts can move on their own.”

Output:
A short, sleep-safe guidance script that helps the mind loosen and drift without effort.
  `.trim(),

  tense: `
You are guiding a late-night physical downshift for someone whose body feels tense or tight.

Goal:
Release physical tension and activate the parasympathetic nervous system using gentle, non-effortful breathing. Help the body unwind without trying to “do it right.”

Tone:
Calm, steady, reassuring, and grounded. Simple language. Slow pacing.

Rules:
- Do NOT give advice, explanations, or medical language.
- Do NOT count breaths or display numbers.
- Do NOT instruct the user to breathe deeply or correctly.
- Do NOT use effort-based language (“try,” “focus,” “control”).
- Do NOT ask questions.

What to do:
- Guide slow nasal breathing with a longer, unhurried exhale.
- Pair the exhale with softening cues for the chest, shoulders, and jaw.
- Emphasize that the breath does the work on its own.
- Use short phrases with space between them.

Structure:
- 30–90 seconds of guidance
- Gentle invitation to breathe
- Repeated emphasis on softening and letting go
- End with a sense of physical ease, not completion

Desired feeling:
“My body is settling on its own. I don’t have to hold myself together.”

Output:
A short, sleep-safe breathing guidance script that releases tension without effort or performance.
  `.trim(),

  restless: `
You are guiding a late-night grounding downshift for someone who feels restless, fidgety, or unsettled.

Goal:
Help excess energy settle downward by emphasizing support, gravity, and physical contact. Give the body a place to land without forcing stillness.

Tone:
Grounded, steady, and permissive. Calm but not sleepy. Reassuring without instruction.

Rules:
- Do NOT ask the user to relax, calm down, or focus.
- Do NOT use breath pacing or visualization that requires effort.
- Do NOT introduce energizing movement or stretching.
- Do NOT ask questions.

What to do:
- Guide attention to body weight, contact, and support (bed, floor, surface).
- Use downward, settling imagery (heaviness, resting, being held).
- Allow small movement if needed, then guide toward stillness.
- Emphasize that the ground or bed is doing the holding.

Structure:
- 30–90 seconds of guidance
- Start by naming support
- Invite the body to settle naturally
- End with a sense of grounded rest

Desired feeling:
“My energy has somewhere safe to land. I can be still now.”

Output:
A short, sleep-safe grounding script that helps restlessness settle into physical support.
  `.trim(),

  lonely: `
You are guiding a late-night emotional downshift for someone who feels lonely, heavy, or emotionally tender.

Goal:
Create a sense of warmth, containment, and quiet companionship without trying to fix or explain the emotion. Help the user feel held enough to rest.

Tone:
Warm, gentle, and present. Soft cadence. Minimal but caring.

Rules:
- Do NOT give advice, reassurance, or reframing.
- Do NOT analyze emotions or explain why they exist.
- Do NOT ask questions.
- Do NOT use affirmations or motivational language.

What to do:
- Use language of presence and shared space (“here,” “with,” “held”).
- Emphasize that nothing needs to be carried alone tonight.
- Avoid techniques or instructions.
- Keep the language slow, steady, and simple.

Structure:
- 30–90 seconds of guidance
- Establish presence and containment
- Reduce the sense of isolation without resolving it
- End with permission to rest while being held

Desired feeling:
“I don’t have to carry this by myself right now.”

Output:
A short, sleep-safe containment script that provides emotional warmth and quiet presence.
  `.trim(),
};

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const ss = s.toString().padStart(2, "0");
  return `${m}:${ss}`;
}

export default function Breathe() {
  // under 60 seconds
  const TOTAL = 50;

  // ✅ include feelingId so we can pick Option 1–4
  const params = useLocalSearchParams<{
    userState?: string;
    dump?: string;
    reflection?: string;
    feelingId?: string;
  }>();

  const userState = (params.userState ?? "").toString();
  const dump = (params.dump ?? "").toString();
  const reflection = (params.reflection ?? "").toString();

  const feelingId: FeelingId = isFeelingId(params.feelingId) ? params.feelingId : "brain";

  // ✅ pick the correct Option prompt
  const optionPrompt = OPTION_PROMPTS[feelingId];

  const [secondsLeft, setSecondsLeft] = useState(TOTAL);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<BreathePayload | null>(null);

  // ✅ include feelingId + optionPrompt in the cache key so each option caches separately
  const key = useMemo(
    () => makeKey({ userState, dump, reflection, feelingId, optionPrompt }),
    [userState, dump, reflection, feelingId, optionPrompt]
  );

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

            // ✅ send feelingId + the selected Option prompt
            body: JSON.stringify({
              feelingId,
              optionPrompt,
              userState,
              dump,
              reflection,
            }),

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
  }, [key, userState, dump, reflection, feelingId, optionPrompt]);

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

