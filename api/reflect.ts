console.log(
  "ENV CHECK:",
  "SUPABASE_URL",
  process.env.SUPABASE_URL ? "SET" : "MISSING",
  "| SERVICE_ROLE",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING"
);

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
};

function pickOpener(feelingLabel?: string, timeLabel?: string) {
  const f = (feelingLabel || "").toLowerCase();
  const t = (timeLabel || "").toLowerCase();

  const late = t.includes("late") || t.includes("night") || t.includes("1 or later");
  const stressed = f.includes("stress") || f.includes("anx") || f.includes("overwhelm") || f.includes("overthink");
  const ok = f.includes("okay") || f.includes("fine") || f.includes("neutral");

  const lateBank = [
    "Hey. I know it's late and your mind's still going.",
    "You're still up, still thinking about all of this.",
    "Late nights like this... when everything feels heavier.",
    "It's late and you're still carrying all of this.",
  ];

  const stressedBank = [
    "That's a lot spinning around in there.",
    "I can feel how heavy this has been for you.",
    "That sounds really overwhelming.",
    "Your mind is working overtime with all of this.",
  ];

  const okBank = [
    "Yeah, I get it. Just one of those days.",
    "Nothing major, but still... a lot of little things adding up.",
    "Sometimes the quiet days are their own kind of full.",
  ];

  const baseBank = [
    "I'm here. I'm listening.",
    "Thanks for sharing this with me.",
    "I hear you.",
  ];

  const bank =
    late && stressed ? [...lateBank, ...stressedBank] :
    stressed ? stressedBank :
    late ? lateBank :
    ok ? okBank :
    baseBank;

  const seedStr = `${f}|${t}`;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  const idx = bank.length ? seed % bank.length : 0;

  return bank[idx] || "I hear you.";
}

export default async function handler(req: Req, res: Res) {


  const debugInfo: string[] = [];

  try {
    const body: Body =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body as Body);

    const { dump, feelingLabel, timeLabel } = body || {};
    const cleanDump = String(dump ?? "").trim();

    debugInfo.push(`Received dump with ${cleanDump.length} chars`);
    debugInfo.push(`Feeling: ${feelingLabel}, Time: ${timeLabel}`);

    if (!cleanDump) return res.status(400).json({ error: "Missing dump text" });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });

    const opener = pickOpener(feelingLabel, timeLabel);
    debugInfo.push(`Selected opener: ${opener}`);

    const prompt = `You're a close, trusted friend responding to someone who just shared what's weighing on their mind.

Start with: "${opener}"

Then write 8-12 sentences responding to what they shared.

EXAMPLES OF CORRECT RESPONSES:

User says: "I'm so tired and annoyed that I can't just fall asleep like a normal person."
CORRECT response: "Late nights like this... when everything feels heavier. I hear you on that frustration about not being able to fall asleep like a 'normal person' - that comparison makes it even worse, doesn't it? Like you're failing at something that should be automatic. The annoyance on top of the tiredness is such a brutal combo. Your body is exhausted but your brain just won't cooperate. It's not fair that you can't just switch off when you need to. I wish I could give you that peaceful, easy sleep you're craving. Just know I'm here with you in this frustrating late-night moment. You're not alone in this."

User says: "Work presentation went badly and my manager seemed disappointed."
CORRECT response: "I hear you. That presentation not going well really stings, especially seeing that disappointment from your manager. You put effort into preparing and it didn't land the way you hoped. That's rough. The aftermath of something like that can sit heavy - replaying moments, wondering what you could have done differently. It's hard not to take it personally when someone you report to seems let down. But one tough presentation doesn't define your work or your value there. Even the best people have off days. I'm sorry it went that way today."

WRONG RESPONSE (DO NOT DO THIS):
User says: "I'm so tired and annoyed that I can't just fall asleep like a normal person."
WRONG: "Late nights like this when everything feels heavier. I hear you on the work stress and the project deadlines looming..." ← WRONG! User never mentioned work or projects!

NOW RESPOND TO THIS USER:

They're feeling: ${feelingLabel || "general"}
Time of day: ${timeLabel || "evening"}

What they shared:
"""${cleanDump}"""

Remember: ONLY respond to what they actually wrote. If they only mentioned sleep, only talk about sleep. If they mentioned work, talk about work. Match what they shared - nothing more, nothing less.`;

    debugInfo.push("Prepared prompt, attempting API call");

    // Try all available Claude models, newest to oldest
    const models = [
      // Claude 3.5 models (newest)
      "claude-3-5-sonnet-20241022",  
      "claude-3-5-sonnet-20240620",  
      "claude-3-5-haiku-20241022",
      
      // Claude 3 models (older, more widely available)
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ];

    for (const model of models) {
      debugInfo.push(`Trying model: ${model}`);
      
      try {
        const startTime = Date.now();
        
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 800,
            temperature: 0.9,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const elapsed = Date.now() - startTime;
        debugInfo.push(`${model} responded in ${elapsed}ms with status ${r.status}`);

        if (!r.ok) {
          const errorText = await r.text();
          debugInfo.push(`${model} error: ${errorText.slice(0, 200)}`);
          
          // If model not found, try next one
          if (r.status === 404) {
            continue;
          }
          
          // Other errors, return immediately
          return res.status(r.status).json({
            error: "API request failed",
            details: errorText,
            debug: debugInfo,
          });
        }

        const data = await r.json();

        const text =
          (Array.isArray(data?.content)
            ? data.content
                .map((c: any) => (c?.type === "text" ? c.text : ""))
                .join("\n")
            : "") || "";

        const trimmed = text.trim();
        
        if (!trimmed) {
          debugInfo.push(`${model} returned empty response, trying next`);
          continue;
        }

        debugInfo.push(`SUCCESS! Response: ${trimmed.length} chars`);

        return res.status(200).json({
          text: trimmed,
          modelUsed: model,
          openerUsed: opener,
          debug: debugInfo,
        });

      } catch (fetchErr: any) {
        debugInfo.push(`${model} fetch error: ${fetchErr.message}`);
        continue;
      }
    }

    // If we got here, all models failed
    return res.status(500).json({
      error: "All models failed",
      debug: debugInfo,
    });

  } catch (err: any) {
    debugInfo.push(`Unexpected error: ${err.message}`);
    return res.status(500).json({
      error: "Unexpected server error",
      details: String(err?.message || err),
      debug: debugInfo,
    });
  }
}