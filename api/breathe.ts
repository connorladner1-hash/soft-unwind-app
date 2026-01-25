import type { VercelRequest, VercelResponse } from "@vercel/node";

type Body = {
  userState?: string;
  dump?: string;
  reflection?: string;
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

function containsForbiddenDrift(output: string, allowedText: string) {
  const o = output.toLowerCase();
  const a = allowedText.toLowerCase();
  return FORBIDDEN.some((w) => o.includes(w) && !a.includes(w));
}

function variantRules(userState: string) {
  switch (userState) {
    case "My brain won’t stop":
      return `Imagery-based guidance. No breathing pacing. Encourage thoughts passing without control. Vary imagery.`;
    case "My body feels tense":
      return `Allow slow nasal breathing and longer exhales. Subtle chest/shoulder/jaw softening cues. No counting.`;
    case "I feel restless":
      return `Focus on weight, gravity, surface support (bed/floor). No breath pacing.`;
    case "I feel lonely or heavy":
      return `Warm containing language like a short bedtime narration. No technique instructions.`;
    default:
      return `Gentle grounding. No breath counting.`;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body: Body =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body as Body);

    const userState = String(body?.userState ?? "").trim();
    const dump = String(body?.dump ?? "").trim();
    const reflection = String(body?.reflection ?? "").trim();

    if (!userState) return res.status(400).json({ error: "Missing userState" });
    if (!dump) return res.status(400).json({ error: "Missing dump" });
    if (!reflection) return res.status(400).json({ error: "Missing reflection" });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });

    const rules = variantRules(userState);

    // Variation but controlled:
    // - moderate temperature
    // - short, structured output
    // - imagery allowed only in brain/ rest / lonely modes
    const prompt = `
You are Soft Unwind. Write a short, safe, grounded, bedtime-style guidance.

Goal:
Create FOUR short chunks for a screen that lasts under 60 seconds.
Chunk 1 appears immediately, chunk 2 at ~15s, chunk 3 at ~30s, chunk 4 at ~45s.
Each chunk: 1–2 sentences max. Keep sentences short.

CRITICAL SAFETY:
- No medical claims, no diagnosis, no urgency.
- No advice, no solutions, no “you should”.
- No therapy/clinical language.
- Do NOT invent topics (work/family/money/health/etc) unless explicitly mentioned.
- Stay tightly anchored to the user’s words. Echo their phrasing.

Variant rules:
${rules}

Allowed context:
Brain dump (what they wrote) + Reflection (already generated).
Use only what’s here:

Brain dump:
"""${dump}"""

Reflection:
"""${reflection}"""

Output ONLY valid JSON:
{"title":"...","prompts":["...","...","...","..."]}

Title guidance:
- brain: "Let your thoughts drift"
- tense: "Breathe with me"
- restless: "Feel your body settle"
- lonely: "You’re not alone right now"
`.trim();

    // Use the model that works for your key
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
        temperature: 0.65, // varies nightly, but still constrained
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const raw = await r.text();

    if (!r.ok) {
      return res.status(r.status).json({ error: "Claude request failed", details: raw });
    }

    const data = JSON.parse(raw);
    const text =
      (Array.isArray(data?.content)
        ? data.content.map((c: any) => (c?.type === "text" ? c.text : "")).join("\n")
        : "") || "";

    const trimmed = text.trim();

    let parsed: any;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      const start = trimmed.indexOf("{");
      const end = trimmed.lastIndexOf("}");
      parsed = JSON.parse(trimmed.slice(start, end + 1));
    }

    const title = String(parsed?.title || "Breathe with me");
    const promptsIn = Array.isArray(parsed?.prompts) ? parsed.prompts : [];
    const prompts = promptsIn.map((p: any) => String(p || "").trim()).filter(Boolean).slice(0, 4);

    while (prompts.length < 4) prompts.push("Stay with this moment. Nothing to solve right now.");

    const outputText = `${title}\n${prompts.join("\n")}`;
    const allowedText = `${dump}\n${reflection}`;

    // Anti-drift filter:
    if (containsForbiddenDrift(outputText, allowedText)) {
      return res.status(200).json({
        title,
        prompts: [
          "You’re here. That’s enough for tonight.",
          "Let your body rest where it can.",
          "Let your mind do what it does—no fixing required.",
          "You don’t have to carry this alone right now.",
        ],
        modelUsed: model,
        note: "fallback_due_to_drift_filter",
      });
    }

    return res.status(200).json({ title, prompts, modelUsed: model });
  } catch (err: any) {
    return res.status(500).json({ error: "Unexpected server error", details: String(err?.message || err) });
  }
}
