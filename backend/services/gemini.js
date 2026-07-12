import { GoogleGenerativeAI } from "@google/generative-ai";

// IMPORTANT: don't instantiate GoogleGenerativeAI at module load time.
// This file gets imported (via routes/rivalry.js) before server.js calls
// dotenv.config(), so process.env.GEMINI_API_KEY would still be undefined
// at that point. Creating the client lazily, inside the function, ensures
// dotenv has already loaded .env by the time this actually runs.
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set — check your .env file");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const SYSTEM_PROMPT = `You write short, dry, stats-driven recaps of a
competitive programming rivalry between two coders. Tone: like a friend
who's tracked both their grinds too closely and now has opinions about it.
Deadpan, a little roasty, never cheesy or overhyped. No sports-commentator
voice, no exclamation marks, no "the crowd goes wild" energy.

CRITICAL: Use ONLY the numbers given to you below. Do not invent, assume,
or mention any contest names, problem names, dates, events, or stats that
are not explicitly provided. If you don't have a specific detail, don't
reference it — stick to the numbers you were given.

You produce two things:
1. "recap" — 2-3 sentences on the current head-to-head. Reference at least
   one real number from the data given (rating gap, streak, solves this
   week, obsession score). Don't declare a permanent winner — ratings
   move. If they're close, say so plainly instead of manufacturing drama.
2. "tip" — one concrete, specific catch-up suggestion aimed at whoever is
   currently behind (lower obsession score). Base it on the actual gap in
   the data given — e.g. if their streak is shorter, say so; if their
   solve velocity is lower, say so. No generic "just practice more"
   filler — it has to reference their specific weak signal from the stats
   given. One sentence, direct, no fluff.

Respond ONLY with valid JSON, no markdown fences, no reasoning, no
preamble — just the raw JSON object, in exactly this shape:
{"recap": "...", "tip": "..."}`;

function stripFences(raw) {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

/**
 * Last-resort extractor: pulls "recap": "..." / "tip": "..." out of a
 * string via regex, for cases where the model wraps valid-looking JSON in
 * extra text and JSON.parse chokes on the whole blob. Better than dumping
 * the raw string (which looks like broken JSON) into the UI.
 */
function extractField(raw, field) {
  const match = raw.match(new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "s"));
  if (!match) return null;
  return match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
}

/**
 * Generates a recap + catch-up tip for a rivalry using the data already
 * returned by GET /api/rivalries/:id — pass that object straight in.
 * Returns { recap, tip, tipTargetUserId }.
 */
export async function generateNarrative(rivalryData) {
  const { userA, userB, obsessionScoreA, obsessionScoreB } = rivalryData;

  const trailingUser = obsessionScoreA <= obsessionScoreB ? userA : userB;
  const tipTargetUserId = trailingUser._id.toString();

  const prompt = `
DATA (use only these numbers, nothing else):

${userA.displayName}: rating ${userA.stats.cfRating}, ${userA.stats.cfProblemsSolved} solved,
${userA.activity.solvesLast7Days} solves this week, ${userA.activity.currentStreakDays}-day streak,
upsolve ratio ${userA.activity.upsolveRatio.toFixed(2)}, obsession score ${obsessionScoreA}.

${userB.displayName}: rating ${userB.stats.cfRating}, ${userB.stats.cfProblemsSolved} solved,
${userB.activity.solvesLast7Days} solves this week, ${userB.activity.currentStreakDays}-day streak,
upsolve ratio ${userB.activity.upsolveRatio.toFixed(2)}, obsession score ${obsessionScoreB}.

The tip should be aimed at ${trailingUser.displayName}, who currently has the
lower obsession score.
`.trim();

  // gemini-flash-latest — gemini-2.0-flash-001 hit a zero-quota wall on
  // the free tier for this project, so we're back on the alias that
  // actually has quota. thinkingBudget: 0 asks it to skip the internal
  // reasoning pass that sometimes breaks JSON.parse; the regex fallback
  // above catches it either way if this gets ignored by the SDK version.
  const model = getClient().getGenerativeModel({
    model: "gemini-flash-latest",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const result = await model.generateContent(prompt);
  const raw = stripFences(result.response.text().trim());

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("[gemini] Failed to parse JSON, falling back to regex extraction:", raw);
    const extractedRecap = extractField(raw, "recap");
    const extractedTip = extractField(raw, "tip");
    parsed = {
      recap: extractedRecap ?? raw,
      tip: extractedTip,
    };
  }

  return {
    recap: parsed.recap ?? raw,
    tip: parsed.tip ?? null,
    tipTargetUserId,
  };
}