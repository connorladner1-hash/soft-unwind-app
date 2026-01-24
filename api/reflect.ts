import type { VercelRequest, VercelResponse } from "@vercel/node";

type Body = {
  dump?: string;
  feelingLabel?: string;
  timeLabel?: string;
};

function pickOpener(feelingLabel?: string, timeLabel?: string) {
  const f = (feelingLabel || "").toLowerCase();
  const t = (timeLabel || "").toLowerCase();

  const late = t.includes("late") || t.includes("night");
  const stressed = f.includes("stress") || f.includes("anx") || f.includes("overwhelm");
  const ok = f.includes("okay") || f.includes("fine") || f.includes("neutral");

  // Small banks (short, grounded, not poetic)
  const lateBank = [
    "It’s late. Your mind is still on.",
    "It’s been a long day. You’re still carrying it.",
    "It’s late, and you’re still holding a lot.",
  ];

  const stressedBank = [
    "That sounds like a lot to carry.",
    "I hear how heavy this feels.",
    "You’ve been holding a lot today.",
  ];

  const okBank = [
    "Got it. A quieter kind of day.",
    "That makes sense. Nothing big—just a lot of small things.",
    "Okay. Just taking the day as it is.",
  ];

  const baseBank = [
    "I hear you.",
    "I’m with you in this moment.",
    "Thank you for putting that into words.",
  ];

  // Prioritize: late+stressed > stressed > late > ok > base
  const bank =
    late && stressed ? [...lateBank, ...stressedBank] :
    stressed ? stressedBank :
    late ? lateBank :
    ok ? okBank :
    baseBank;

  // Deterministic-ish pick (avoid feeling random each render)
  const seedStr = `${f}|${t}`;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  const idx = bank.length ? seed % bank.length : 0;

  return bank[idx] || "I hear you.";
}

function enforceSentenceWordCap(text: string, maxWordsPerSentence = 14, maxSentences = 6) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";

  // Split into sentences while keeping basic punctuation
  const parts = clean.split(/(?<=[.!?])\s+/).filter(Boolean);

  const capped = parts.slice(0, maxSentences).map((s) => {
    const words = s.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWordsPerSentence) return s.trim();

    // Trim to max words and add period if missing
    const trimmed = words.slice(0, maxWordsPerSentence).join(" ");
    const endsPunct = /[.!?]$/.test(trimmed);
    return endsPunct ? trimmed : trimmed + ".";
  });

  return capped.join(" ").trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body: Body =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body as Body);

    const { dump, feelingLabel, timeLabel } = body || {};
    const cleanDump = String(dump ?? "").trim();

    if (!cleanDump) return res.status(400).json({ error: "Missing dump text" });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });

    // Tone/time hints
    const toneHint =
      (feelingLabel || "").toLowerCase().includes("overwhelmed") ? "extra gentle, slower pace" :
      (feelingLabel || "").toLowerCase().includes("stressed") ? "steady and reassuring" :
      (feelingLabel || "").toLowerCase().includes("okay") ? "light, supportive, low-intensity" :
      "neutral calm";

    const timeHint =
      (timeLabel || "").toLowerCase().includes("late") ? "shorter sentences, more soothing" :
      "normal pacing";

    // Opening phrase bank
    const opener = pickOpener(feelingLabel, timeLabel);

    const prompt = `
You are Soft Unwind — a calm nighttime companion.

Tone guidance:
- Overall tone: ${toneHint}
- Pacing: ${timeHint}

Hard style constraints:
- 4–6 sentences total
- Each sentence must be 8–14 words (hard max 14)
- Plain language. No metaphors. No poetic imagery.
- No therapy language. No advice. No fixes. No “you should”.

Goal:
Help the person feel heard and understood.

Structure:
1) Start with this exact opening line (do not change it): "${opener}"
2) One sentence that restates what they said (use their words if possible).
3) One sentence that validates simply (e.g., “That makes sense.” “That’s a lot.”).
4) 1–3 sentences that slow the moment down and reassure (no urgency, no solutions).

Avoid:
- diagnosing or analyzing
- explaining why they feel that way
- telling them what to do next
- generic filler like “I’m here for you” unless it fits specifically

Context:
- Feeling label: ${feelingLabel || "unknown"}
- Time label: ${timeLabel || "unknown"}
- Journal dump: """${cleanDump}"""
`;

    const candidates = [
      process.env.ANTHROPIC_MODEL,
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ].filter(Boolean) as string[];

    let lastRaw = "";
    let lastStatus = 500;

    for (const model of candidates) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 220,
          temperature: 0.6, // slightly lower = more consistent length/format
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const raw = await r.text();
      lastRaw = raw;
      lastStatus = r.status;

      if (r.ok) {
        const data = JSON.parse(raw);

        const text =
          (Array.isArray(data?.content)
            ? data.content
                .map((c: any) => (c?.type === "text" ? c.text : ""))
                .join("\n")
            : "") || "";

        const trimmed = text.trim();
        if (!trimmed) {
          return res.status(502).json({
            error: "No text returned from Anthropic",
            modelUsed: model,
            details: raw,
          });
        }

        // Server-side hard enforcement (guarantee sentence length cap)
        const finalText = enforceSentenceWordCap(trimmed, 14, 6);

        return res.status(200).json({
          text: finalText,
          modelUsed: model,
          openerUsed: opener,
        });
      }

      // Model not found → try next
      try {
        const errJson = JSON.parse(raw);
        const msg = errJson?.error?.message || "";
        if (r.status === 404 && msg.toLowerCase().includes("model")) continue;
      } catch {
        // ignore
      }

      // Other errors → stop
      return res.status(r.status).json({
        error: "Claude request failed",
        status: r.status,
        details: raw,
      });
    }

    return res.status(404).json({
      error: "No available Anthropic model found for this API key",
      tried: candidates,
      status: lastStatus,
      details: lastRaw,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: String(err?.message || err),
    });
  }
}
