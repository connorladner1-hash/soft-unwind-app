import type { VercelRequest, VercelResponse } from "@vercel/node";

type Body = {
  userState?: string;
  dump?: string;
  reflection?: string;
};

type UserState = "My brain won't stop" | "My body feels tense" | "I feel restless" | "I feel lonely or heavy";

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

const FALLBACK_SETS: Record<UserState, FallbackResponse> = {
  "My brain won't stop": {
    title: "Let them drift",
    prompts: [
      "You don't need to stop your thoughts. Just let them pass.",
      "Imagine each thought as a cloud drifting across the sky.",
      "You don't have to follow any of them. They move on their own.",
      "Nothing needs your attention right now."
    ]
  },
  "My body feels tense": {
    title: "Let your body settle",
    prompts: [
      "Breathe in slowly through your nose. And let it out, a little longer.",
      "As you exhale, let your shoulders soften. Let your chest loosen.",
      "Each exhale is your body letting go.",
      "There's nothing to hold up anymore."
    ]
  },
  "I feel restless": {
    title: "Feel your body settle",
    prompts: [
      "Notice where your body meets the bed. Just feel the places already supporting you.",
      "Let your weight rest there. The bed can hold you tonight.",
      "You don't have to stay alert anymore.",
      "You can be still now. Nothing else needs to happen."
    ]
  },
  "I feel lonely or heavy": {
    title: "You're not alone right now",
    prompts: [
      "You don't have to carry this by yourself tonight.",
      "Whatever feels heavy can rest here. You're allowed to set it down for now.",
      "Nothing needs to be explained. Nothing needs to be solved.",
      "You can rest while being held."
    ]
  }
};

function containsForbiddenDrift(output: string, allowedText: string) {
  const o = output.toLowerCase();
  const a = allowedText.toLowerCase();
  
  const advicePatterns = [
    /you should.*?(work|job|boss|deadline)/,
    /try to.*?(family|relationship)/,
    /consider.*?(therapy|medical)/,
    /need to.*?(work|job|money|bills)/,
    /have to.*?(family|relationship)/
  ];
  
  const hasAdvicePattern = advicePatterns.some(pattern => pattern.test(o) && !pattern.test(a));
  const hasForbiddenDrift = FORBIDDEN.some((w) => o.includes(w) && !a.includes(w));
  
  return hasAdvicePattern || hasForbiddenDrift;
}

function normalizeText(s: string) {
  return s
    .replace(/\u0027/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .trim();
}

function getSystemPrompt(userState: string): string {
  switch (userState) {
    case "My brain won't stop":
      return `You are guiding a late-night cognitive downshift for someone whose mind feels busy and overactive.

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
- Avoid affirmations and "you're okay" language.

What to do:
- Use gentle imagery related to drifting, fading, floating, dimming, or passing.
- Treat thoughts as background movement that does not require attention.
- Emphasize permission, not action.
- Use short sentences and pauses.
- Allow thoughts to exist without engagement.

Structure:
- Create 4 brief prompts (appearing at 15-second intervals, total ~60 seconds)
- Start by removing the need to stop thinking
- Introduce passive imagery
- End with permission to let attention soften or fade

Desired feeling:
"There is nothing I need to do. My thoughts can move on their own."`;

    case "My body feels tense":
      return `You are guiding a late-night physical downshift for someone whose body feels tense or tight.

Goal:
Release physical tension and activate the parasympathetic nervous system using gentle, non-effortful breathing. Help the body unwind without trying to "do it right."

Tone:
Calm, steady, reassuring, and grounded. Simple language. Slow pacing.

Rules:
- Do NOT give advice, explanations, or medical language.
- Do NOT count breaths or display numbers.
- Do NOT instruct the user to breathe deeply or correctly.
- Do NOT use effort-based language ("try," "focus," "control").
- Do NOT ask questions.

What to do:
- Guide slow nasal breathing with a longer, unhurried exhale.
- Pair the exhale with softening cues for the chest, shoulders, and jaw.
- Emphasize that the breath does the work on its own.
- Use short phrases with space between them.

Structure:
- Create 4 brief prompts (appearing at 15-second intervals, total ~60 seconds)
- Gentle invitation to breathe
- Repeated emphasis on softening and letting go
- End with a sense of physical ease, not completion

Desired feeling:
"My body is settling on its own. I don't have to hold myself together."`;

    case "I feel restless":
      return `You are guiding a late-night grounding downshift for someone who feels restless, fidgety, or unsettled.

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
- Create 4 brief prompts (appearing at 15-second intervals, total ~60 seconds)
- Start by naming support
- Invite the body to settle naturally
- End with a sense of grounded rest

Desired feeling:
"My energy has somewhere safe to land. I can be still now."`;

    case "I feel lonely or heavy":
      return `You are guiding a late-night emotional downshift for someone who feels lonely, heavy, or emotionally tender.

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
- Use language of presence and shared space ("here," "with," "held").
- Emphasize that nothing needs to be carried alone tonight.
- Avoid techniques or instructions.
- Keep the language slow, steady, and simple.

Structure:
- Create 4 brief prompts (appearing at 15-second intervals, total ~60 seconds)
- Establish presence and containment
- Reduce the sense of isolation without resolving it
- End with permission to rest while being held

Desired feeling:
"I don't have to carry this by myself right now."`;

    default:
      return `You are guiding a gentle late-night downshift. Create 4 brief, calming prompts that help someone transition toward sleep. Use soft, non-directive language. Emphasize permission and ease.`;
  }
}

function getTitleGuidance(userState: string): string {
  switch (userState) {
    case "My brain won't stop":
      return "Title should be about letting thoughts drift, pass, or move on their own (2-4 words).";
    case "My body feels tense":
      return "Title should be about breathing, settling, or softening (2-4 words).";
    case "I feel restless":
      return "Title should be about feeling support or settling (2-4 words).";
    case "I feel lonely or heavy":
      return "Title should be about presence, not being alone, or being held (3-5 words).";
    default:
      return "Title should be calming and brief (2-4 words).";
  }
}

function validateResponse(parsed: any, userState: string): boolean {
  const { title, prompts } = parsed;
  
  if (!title || typeof title !== 'string') return false;
  if (!Array.isArray(prompts) || prompts.length !== 4) return false;
  
  if (title.split(' ').length > 6) return false;
  
  const maxWords = 25;
  for (const prompt of prompts) {
    if (typeof prompt !== 'string' || prompt.split(' ').length > maxWords) return false;
  }
  
  const combined = `${title} ${prompts.join(' ')}`.toLowerCase();
  const redFlags = [
    'should',
    'need to stop',
    'have to fix',
    'must',
    'try to',
    'tomorrow',
    'will be better',
    'talk to someone',
    'seek help',
    'get treatment',
    'clear your mind',
    'stop thinking',
    'deep breath',
    'focus on',
    'calm down'
  ];
  
  if (redFlags.some(flag => combined.includes(flag))) return false;
  
  return true;
}

function isValidUserState(state: string): state is UserState {
  return state in FALLBACK_SETS;
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

    const systemPrompt = getSystemPrompt(userState);
    const titleGuidance = getTitleGuidance(userState);

    const userPrompt = `
${systemPrompt}

User context:
The user wrote: "${dump}"
We showed them this reflection: "${reflection}"

${titleGuidance}

Create a sleep-safe guidance response.

Output ONLY valid JSON in this exact format:
{"title":"...","prompts":["...","...","...","..."]}

Remember:
- 4 prompts total
- Each prompt: 1-3 sentences, brief and gentle
- Follow all the rules for "${userState}" above
- Echo the user's own words naturally when relevant
- Stay tightly anchored to what they actually wrote
`.trim();

    const model = "claude-3-haiku-20240307";
    const MAX_RETRIES = 2;
    
    let parsed: any = null;
    let title = "";
    let prompts: string[] = [];

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 400,
          temperature: 0.6,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      const raw = await r.text();

      if (!r.ok) {
        if (attempt === MAX_RETRIES - 1) {
          return res.status(r.status).json({ error: "Claude request failed", details: raw });
        }
        continue;
      }

      const data = JSON.parse(raw);
      const text =
        (Array.isArray(data?.content)
          ? data.content.map((c: any) => (c?.type === "text" ? c.text : "")).join("\n")
          : "") || "";

      const trimmed = text.trim();

      try {
        parsed = JSON.parse(trimmed);
      } catch {
        const start = trimmed.indexOf("{");
        const end = trimmed.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          try {
            parsed = JSON.parse(trimmed.slice(start, end + 1));
          } catch {
            // Parsing failed
          }
        }
      }

      if (parsed && validateResponse(parsed, userState)) {
        title = normalizeText(String(parsed.title));
        const promptsIn = Array.isArray(parsed.prompts) ? parsed.prompts : [];
        prompts = promptsIn
          .map((p: any) => normalizeText(String(p || "")))
          .filter(Boolean)
          .slice(0, 4);

        while (prompts.length < 4) {
          prompts.push("Nothing needs your attention right now.");
        }

        const outputText = `${title}\n${prompts.join("\n")}`;
        const allowedText = `${dump}\n${reflection}`;

        if (!containsForbiddenDrift(outputText, allowedText)) {
          return res.status(200).json({ title, prompts, modelUsed: model });
        }
      }

      if (attempt === MAX_RETRIES - 1) {
        break;
      }
    }

    const fallback = isValidUserState(userState) 
      ? FALLBACK_SETS[userState] 
      : FALLBACK_SETS["My brain won't stop"];
    
    return res.status(200).json({
      title: fallback.title,
      prompts: fallback.prompts,
      modelUsed: model,
      note: "fallback_response_used",
    });

  } catch (err: any) {
    return res.status(500).json({ 
      error: "Unexpected server error", 
      details: String(err?.message || err) 
    });
  }
}