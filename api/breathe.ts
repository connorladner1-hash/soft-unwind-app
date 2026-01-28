// api/breathe.ts (or api/breathe.tsx — but this is a server file)
// COPY/PASTE THE ENTIRE FILE

type Req = {
  method?: string;
  body?: any;
};

type Res = {
  status: (code: number) => Res;
  json: (data: any) => void;
};

type FeelingId = "brain" | "tense" | "restless" | "lonely";

type Body = {
  feelingId?: string;
  userState?: string;
  dump?: string;
  reflection?: string;
};

type FallbackResponse = {
  title: string;
  prompts: string[];
};

const FORBIDDEN = [
  "work",
  "job",
  "boss",
  "deadline",
  "project",
  "money",
  "rent",
  "bills",
  "family",
  "mom",
  "dad",
  "sister",
  "brother",
  "relationship",
  "girlfriend",
  "boyfriend",
  "medical",
  "diagnosis",
  "therapy",
  "therapist",
];

const FALLBACK_SETS: Record<FeelingId, FallbackResponse> = {
  brain: {
    title: "Let them drift",
    prompts: [
      "You don’t need to stop your thoughts. Just let them pass.",
      "Imagine each thought as a cloud drifting across the sky.",
      "You don’t have to follow any of them. They move on their own.",
      "Nothing needs your attention right now.",
    ],
  },
  tense: {
    title: "Let your body settle",
    prompts: [
      "Breathe in gently through your nose. Let it out, a little longer.",
      "As you exhale, let your shoulders soften. Let your jaw loosen.",
      "Each exhale is your body letting go in its own time.",
      "There’s nothing to hold up anymore.",
    ],
  },
  restless: {
    title: "Feel your body settle",
    prompts: [
      "Notice where your body meets the bed. Feel what’s already supporting you.",
      "Let your weight rest there. The bed can hold you tonight.",
      "You don’t have to stay alert anymore.",
      "You can be still now. Nothing else needs to happen.",
    ],
  },
  lonely: {
    title: "You’re not alone",
    prompts: [
      "You don’t have to carry this by yourself tonight.",
      "Whatever feels heavy can rest here. You’re allowed to set it down for now.",
      "Nothing needs to be explained. Nothing needs to be solved.",
      "You can rest while being held.",
    ],
  },
};

function isFeelingId(x: any): x is FeelingId {
  return x === "brain" || x === "tense" || x === "restless" || x === "lonely";
}

// Back-compat: map older userState labels to a FeelingId
function mapUserStateToFeelingId(raw: string): FeelingId {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("tense")) return "tense";
  if (s.includes("restless")) return "restless";
  if (s.includes("lonely") || s.includes("heavy")) return "lonely";
  return "brain";
}

function normalizeText(s: string) {
  return String(s ?? "")
    .replace(/\u2019|\u2018/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .trim();
}

function containsForbiddenDrift(output: string, allowed: string) {
  const o = output.toLowerCase();
  const a = allowed.toLowerCase();
  return FORBIDDEN.some((w) => o.includes(w) && !a.includes(w));
}

/**
 * If the model adds extra text, try to extract the first {...} JSON object.
 */
function extractJsonObject(raw: string): string | null {
  if (!raw) return null;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return raw.slice(start, end + 1);
}

/**
 * Turn model output into a safe payload.
 * - exactly 4 prompts
 * - strings only
 * - trimmed
 * - cap length so UI is safe
 */
function sanitizePayload(parsed: any): { title: string; prompts: string[] } | null {
  if (!parsed || typeof parsed !== "object") return null;

  const title = typeof parsed.title === "string" ? normalizeText(parsed.title) : "";
  const promptsRaw = Array.isArray(parsed.prompts) ? parsed.prompts : null;
  if (!title || !promptsRaw) return null;

  // Clean strings only
  let prompts: string[] = promptsRaw
    .map((p: unknown): string => (typeof p === "string" ? normalizeText(p) : ""))
    .filter((p: string) => Boolean(p));

  // Must have at least 4 usable lines
  if (prompts.length < 4) return null;

  // Only first 4
  prompts = prompts.slice(0, 4);

  // Hard cap for UI stability (don't fail, just trim)
  const CAP = 180;
  prompts = prompts.map((p: string) => (p.length > CAP ? p.slice(0, CAP - 1) + "…" : p));

  // No questions (keep consistent with your rules)
  if (prompts.some((p: string) => p.includes("?"))) return null;

  return { title, prompts };
}

function buildUserPrompt(args: { feelingId: FeelingId; dump: string; reflection: string }) {
  const { feelingId, dump, reflection } = args;

  // More “JSON only” force + shorter spec to reduce rambly outputs
  return `
You are writing calm, late-night guidance.
Mode: "${feelingId}"

Rules:
- No advice, no fixing, no questions
- No therapy/medical language
- Keep it simple, slow, and sleep-safe

Write:
- A short title (2–5 words)
- Exactly 4 short prompts (each under ~160 chars)

Personal context (use subtly, don’t mention specifics):
- Dump: "${dump}"
- Reflection: "${reflection}"

Output ONLY valid JSON, nothing else:
{"title":"...","prompts":["...","...","...","..."]}
`.trim();
}

export default async function handler(req: Req, res: Res) {
  if ((req.method ?? "POST").toUpperCase() !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body: Body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};

    const dump = normalizeText(body.dump ?? "");
    const reflection = normalizeText(body.reflection ?? "");
    const rawFeelingId = normalizeText(body.feelingId ?? "");
    const rawState = normalizeText(body.userState ?? "");

    const resolvedFeelingId: FeelingId = isFeelingId(rawFeelingId)
      ? rawFeelingId
      : mapUserStateToFeelingId(rawState);

    // If missing required text, still fallback but 200 (keeps UX smooth)
    if (!dump || !reflection) {
      const fallback = FALLBACK_SETS[resolvedFeelingId];
      return res.status(200).json({
        title: fallback.title,
        prompts: fallback.prompts,
        modelUsed: "fallback",
        note: "missing_dump_or_reflection",
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const fallback = FALLBACK_SETS[resolvedFeelingId];
      return res.status(200).json({
        title: fallback.title,
        prompts: fallback.prompts,
        modelUsed: "fallback",
        note: "fallback_used",
        debugReason: "missing_api_key",
        debugModelText: "",
      });
    }

    const userPrompt = buildUserPrompt({
      feelingId: resolvedFeelingId,
      dump,
      reflection,
    });

    const model = "claude-3-haiku-20240307";

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 350,
        temperature: 0.3,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const raw = await r.text();

    if (!r.ok) {
      const fallback = FALLBACK_SETS[resolvedFeelingId];
      return res.status(200).json({
        title: fallback.title,
        prompts: fallback.prompts,
        modelUsed: model,
        note: "anthropic_error_fallback",
        debug: process.env.NODE_ENV === "production" ? undefined : raw.slice(0, 500),
      });
    }

    const data = JSON.parse(raw);
    const text = Array.isArray(data?.content) ? data.content.map((c: any) => c.text).join("\n") : "";

    const maybeJson = extractJsonObject(text.trim());
    let parsed: any = null;

    try {
      parsed = JSON.parse((maybeJson ?? text).trim());
    } catch {
      parsed = null;
    }

    const sanitized = sanitizePayload(parsed);

    if (sanitized) {
      const combined = `${sanitized.title} ${sanitized.prompts.join(" ")}`;
      const allowed = `${dump} ${reflection}`;

      if (!containsForbiddenDrift(combined, allowed)) {
        return res.status(200).json({
          title: sanitized.title,
          prompts: sanitized.prompts,
          modelUsed: model,
        });
      }
    }

    // 🧯 Late fallback: model responded but failed parsing / validation / drift
    const fallback = FALLBACK_SETS[resolvedFeelingId];
    return res.status(200).json({
      title: fallback.title,
      prompts: fallback.prompts,
      modelUsed: model,
      note: "fallback_used",
      debugReason: "parse_failed_or_validation_failed_or_forbidden_drift",
      debugModelText: (text ?? "").slice(0, 800),
    });
  } catch (err: any) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: String(err?.message || err),
    });
  }
}
