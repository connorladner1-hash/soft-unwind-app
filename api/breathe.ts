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
  // new
  feelingId?: string;
  optionPrompt?: string;

  // existing
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

// Back-compat: map the old userState label to a FeelingId
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

function validateResponse(parsed: any): parsed is { title: string; prompts: string[] } {
  if (!parsed?.title || typeof parsed.title !== "string") return false;
  if (!Array.isArray(parsed?.prompts)) return false;
  if (parsed.prompts.length !== 4) return false;

  const cleaned = parsed.prompts
    .map((p: any) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean);

  if (cleaned.length !== 4) return false;

  // Keep prompts short-ish so they fit your UI nicely
  if (cleaned.some((p) => p.length > 180)) return false;

  return true;
}

function buildUserPrompt(args: {
  feelingId: FeelingId;
  optionPrompt: string;
  dump: string;
  reflection: string;
}) {
  const { feelingId, optionPrompt, dump, reflection } = args;

  // Universal formatting constraints for your UI
  const outputContract = `
Output ONLY valid JSON (no markdown, no extra text):
{"title":"...","prompts":["...","...","...","..."]}

Constraints:
- title: 2–5 words, calm, not cheesy
- prompts: exactly 4 short lines, no numbering, no quotes around them
- no questions
- keep each prompt under ~160 characters
`.trim();

  // We treat your option prompt as the primary behavior spec.
  // Then we add an output contract and (optional) personalization context.
  return `
${optionPrompt}

Context (optional, for subtle personalization only):
- User dump: "${dump}"
- Reflection shown: "${reflection}"
- Mode: "${feelingId}"

${outputContract}
`.trim();
}

export default async function handler(req: Req, res: Res) {
  if ((req.method ?? "POST").toUpperCase() !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body: Body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};

    const dump = normalizeText(body.dump ?? "");
    const reflection = normalizeText(body.reflection ?? "");
    const rawFeelingId = normalizeText(body.feelingId ?? "");
    const rawState = normalizeText(body.userState ?? "");
    const optionPrompt = normalizeText(body.optionPrompt ?? "");

    // Resolve mode:
    // 1) prefer feelingId if provided
    // 2) else fall back to mapping userState label
    const resolvedFeelingId: FeelingId = isFeelingId(rawFeelingId)
      ? rawFeelingId
      : mapUserStateToFeelingId(rawState);

    // If optionPrompt is missing, fall back immediately (keeps behavior stable)
    if (!optionPrompt) {
      const fallback = FALLBACK_SETS[resolvedFeelingId];
      return res.status(200).json({
        title: fallback.title,
        prompts: fallback.prompts,
        modelUsed: "fallback",
        note: "missing_optionPrompt",
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const fallback = FALLBACK_SETS[resolvedFeelingId];
      return res.status(200).json({
        title: fallback.title,
        prompts: fallback.prompts,
        modelUsed: "fallback",
        note: "missing_api_key",
      });
    }

    const userPrompt = buildUserPrompt({
      feelingId: resolvedFeelingId,
      optionPrompt,
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
        max_tokens: 450,
        temperature: 0.6,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const raw = await r.text();
    if (!r.ok) {
      // fall back gracefully
      const fallback = FALLBACK_SETS[resolvedFeelingId];
      return res.status(200).json({
        title: fallback.title,
        prompts: fallback.prompts,
        modelUsed: model,
        note: "anthropic_error_fallback",
        debug: raw.slice(0, 500),
      });
    }

    const data = JSON.parse(raw);
    const text = Array.isArray(data?.content)
      ? data.content.map((c: any) => c.text).join("\n")
      : "";

    let parsed: any = null;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      parsed = null;
    }

    if (parsed && validateResponse(parsed)) {
      const title = normalizeText(parsed.title);
      const prompts = parsed.prompts.map(normalizeText);

      const combined = `${title} ${prompts.join(" ")}`;
      const allowed = `${dump} ${reflection}`;

      // Prevent “forbidden drift” unless it was already in user text
      if (!containsForbiddenDrift(combined, allowed)) {
        return res.status(200).json({ title, prompts, modelUsed: model });
      }
    }

    // If JSON parse/validation fails, fall back safely
    const fallback = FALLBACK_SETS[resolvedFeelingId];
    return res.status(200).json({
      title: fallback.title,
      prompts: fallback.prompts,
      modelUsed: model,
      note: "fallback_used",
    });
  } catch (err: any) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: String(err?.message || err),
    });
  }
}
