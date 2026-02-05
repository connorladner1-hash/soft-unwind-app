// api/reflect.ts
import { createClient } from "@supabase/supabase-js";

type Req = {
  method?: string;
  body?: any;
};

type Res = {
  status: (code: number) => Res;
  json: (data: any) => void;
};

type Body = {
  dump?: string;
  feelingLabel?: string;
  timeLabel?: string;
  // We'll use this later in Option B (Auth). Safe to include now.
  userId?: string | null;
};

// ---- Supabase (server/admin) ----
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---- Anthropic models to try (fallback) ----
// Keep this list simple + reliable. Add/remove as you like.
const MODELS = [
  "claude-3-5-sonnet-latest",
  "claude-3-5-haiku-latest",
];

// ---- Helpers ----
function safeLower(s?: string) {
  return (s || "").toLowerCase();
}

function normalizeText(s: string) {
  // Basic cleanup: remove common escaping artifacts
  return s
    .replace(/\\u0027/g, "'")
    .replace(/\u0027/g, "'")
    .replace(/\r\n/g, "\n")
    .trim();
}

function pickOpener(feelingLabel?: string, timeLabel?: string) {
  const f = safeLower(feelingLabel);
  const t = safeLower(timeLabel);

  const late = t.includes("late") || t.includes("night") || t.includes("1");
  const stressed =
    f.includes("stress") ||
    f.includes("anx") ||
    f.includes("overwhelm") ||
    f.includes("overthink");
  const ok = f.includes("okay") || f.includes("fine") || f.includes("neutral");

  const lateBank = [
    "Hey. I know it's late and your mind's still going.",
    "You're still up, still thinking about all of this.",
    "Late nights like this… when everything feels heavier…",
    "It's late and you're still carrying all of this.",
  ];

  const stressedBank = [
    "That’s a lot spinning around in there.",
    "I can feel how heavy this has been for you.",
    "That sounds really overwhelming.",
    "Your mind is working overtime with all of this.",
  ];

  const okBank = [
    "Yeah, I get it. Just one of those days.",
    "Nothing major, but still… a lot of little things adding up.",
    "Sometimes the quiet days are their own kind of full.",
  ];

  const fallback = ["I hear you.", "I’m with you.", "Okay — let’s slow this down."];

  const bank = late ? lateBank : stressed ? stressedBank : ok ? okBank : fallback;
  return bank[Math.floor(Math.random() * bank.length)];
}

function buildPrompt(dump: string, opener: string) {
  // Keep output short and app-friendly (no markdown, no lists)
  return `
You are a calm, supportive reflection companion.
Write a gentle, validating reflection (4–8 sentences) that:
- acknowledges what they said
- helps them feel grounded
- offers 1 small next step they can do in 60 seconds
Avoid therapy disclaimers. Avoid bullet points. Avoid emojis. Avoid markdown.

Start with: "${opener}"

User dump:
${dump}
`.trim();
}

async function callAnthropic(model: string, prompt: string, debugInfo: string[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const t0 = Date.now();
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const ms = Date.now() - t0;
  debugInfo.push(`${model} responded in ${ms}ms with status ${r.status}`);

  if (!r.ok) {
    let errText = "";
    try {
      errText = await r.text();
    } catch {
      errText = "(unable to read error body)";
    }
    debugInfo.push(`${model} error body: ${errText.slice(0, 500)}`);
    throw new Error(`Anthropic error (${model}): ${r.status}`);
  }

  const data: any = await r.json();
  const text =
    Array.isArray(data?.content)
      ? data.content.map((c: any) => (c?.type === "text" ? c.text : "")).join("\n")
      : "";

  return normalizeText(text || "");
}

// ---- Handler ----
export default async function handler(req: Req, res: Res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = (req.body || {}) as Body;

    const dump = (body.dump || "").trim();
    if (!dump) return res.status(400).json({ error: "Missing dump text" });

    const opener = pickOpener(body.feelingLabel, body.timeLabel);
    const prompt = buildPrompt(dump, opener);

    const debugInfo: string[] = [];
    debugInfo.push(`Received dump with ${dump.length} chars`);
    debugInfo.push(`Feeling: ${body.feelingLabel || "n/a"}, Time: ${body.timeLabel || "n/a"}`);
    debugInfo.push(`Selected opener: ${opener}`);

    // ✅ IMPORTANT FIX:
    // Generate inside the loop, but DO NOT return inside the loop.
    // Save the final text, then insert to Supabase AFTER the loop.
    let finalText = "";
    let modelUsed = "";

    for (const model of MODELS) {
      try {
        debugInfo.push(`Trying model: ${model}`);
        const out = await callAnthropic(model, prompt, debugInfo);
        if (!out) {
          debugInfo.push(`${model} returned empty text, trying next`);
          continue;
        }
        finalText = out;
        modelUsed = model;
        debugInfo.push(`SUCCESS! Response: ${finalText.length} chars`);
        break;
      } catch (e: any) {
        debugInfo.push(`Model failed: ${model} -> ${e?.message || "unknown error"}`);
        continue;
      }
    }

    if (!finalText) {
      return res.status(500).json({
        error: "Failed to generate reflection",
        debug: debugInfo,
      });
    }

    // ✅ Supabase insert happens here (outside loop)
    console.log("INSERTING REFLECTION INTO SUPABASE");

    const userId = body.userId ?? null; // Option B will populate this

    const { error: dbError } = await supabaseAdmin.from("reflections").insert({
      user_id: userId,
      feeling_id: body.feelingLabel ?? null,
      dump,
      reflection: finalText,
    });

    if (dbError) {
      console.log("Supabase insert error:", dbError);
      debugInfo.push(`Supabase insert error: ${dbError.message}`);
    } else {
      console.log("Supabase insert success");
      debugInfo.push("Supabase insert success");
    }

    return res.status(200).json({
      text: finalText,
      modelUsed,
      openerUsed: opener,
      debug: debugInfo,
    });
  } catch (err: any) {
    console.log("Reflect handler fatal error:", err);
    return res.status(500).json({
      error: "Server error",
      message: err?.message || "unknown",
    });
  }
}
