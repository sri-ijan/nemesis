import axios from "axios";

const CF_BASE = "https://codeforces.com/api";

// Codeforces allows ~1 request/2s per IP. Small delay between our own calls
// keeps us well under that instead of tripping their rate limiter (429s).
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Reference topic list for weakness detection — core CP categories. A tag
// showing up rarely (or not at all) in someone's solved set is a real
// signal, even if they've never touched it.
const CORE_TAGS = [
  "dp",
  "graphs",
  "greedy",
  "math",
  "implementation",
  "binary search",
  "trees",
  "strings",
  "data structures",
  "number theory",
  "combinatorics",
  "geometry",
];

// IST is UTC+5:30. Week/day boundaries are computed in IST, not UTC —
// otherwise solves made in the IST morning (before 5:30am) land on the
// "wrong side" of a UTC midnight boundary and silently don't count,
// which is confusing since the person thinks in IST calendar days.
const IST_OFFSET_SEC = 5.5 * 60 * 60;

/** Shifts a unix timestamp so its UTC-field getters read as IST wall-clock time. */
function toISTShifted(unixSec) {
  return new Date((unixSec + IST_OFFSET_SEC) * 1000);
}

/**
 * Unix timestamp (seconds, real UTC) corresponding to the most recent
 * Sunday 00:00 IST — the start of "this week" for the live season-round
 * display. If today IS Sunday (IST), this returns today's IST midnight.
 */
function getWeekStartTimestamp() {
  const nowIST = toISTShifted(Date.now() / 1000);
  const daysSinceSunday = nowIST.getUTCDay(); // 0 = Sunday, read as IST day-of-week
  const startIST = new Date(
    Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate() - daysSinceSunday)
  );
  return startIST.getTime() / 1000 - IST_OFFSET_SEC; // back to real UTC timestamp
}

/**
 * Fetches current rating snapshot for a handle.
 * CF API returns an array in `result`; we want the single user object.
 */
export async function fetchCFUserInfo(handle) {
  const { data } = await axios.get(`${CF_BASE}/user.info`, {
    params: { handles: handle },
  });
  if (data.status !== "OK")
    throw new Error(`CF user.info failed for ${handle}`);
  const u = data.result[0];
  return {
    rating: u.rating ?? 0,
    maxRating: u.maxRating ?? 0,
  };
}

/**
 * Fetches full contest rating history — this is what powers the
 * head-to-head overlay chart on the dashboard.
 */
export async function fetchCFRatingHistory(handle) {
  const { data } = await axios.get(`${CF_BASE}/user.rating`, {
    params: { handle },
  });
  if (data.status !== "OK")
    throw new Error(`CF user.rating failed for ${handle}`);
  return data.result.map((c) => ({
    contestName: c.contestName,
    date: new Date(c.ratingUpdateTimeSeconds * 1000),
    oldRating: c.oldRating,
    newRating: c.newRating,
    rank: c.rank,
  }));
}

/**
 * Buckets a CF problem rating into an Easy/Medium/Hard tier, LeetCode-style.
 * Unrated problems (gym/unofficial, rating undefined) are excluded from
 * the breakdown — still counted in the total, just not bucketed.
 */
function difficultyTier(rating) {
  if (!rating) return null;
  if (rating <= 1200) return "easy";
  if (rating <= 1899) return "medium";
  return "hard";
}

/**
 * Fetches submissions to compute solved-problem count, difficulty
 * breakdown, strength/weakness tags, upsolve ratio, current streak, and
 * recent solve velocity (last 7 days) for the obsession score + profile
 * dial cards.
 */
export async function fetchCFSubmissions(handle, count = 10000) {
  const { data } = await axios.get(`${CF_BASE}/user.status`, {
    params: { handle, from: 1, count },
  });
  if (data.status !== "OK")
    throw new Error(`CF user.status failed for ${handle}`);

  const solvedDays = new Set(); // "YYYY-MM-DD" strings, UTC
  let solvesLast7Days = 0;
  const sevenDaysAgoSec = Date.now() / 1000 - 7 * 24 * 60 * 60;
  const weekStartSec = getWeekStartTimestamp();

  // Dedup by problem — key -> { time, participantType, rating, tags }
  const firstSolveByProblem = new Map();

  for (const sub of data.result) {
    if (sub.verdict !== "OK") continue;
    const key = `${sub.problem.contestId}-${sub.problem.index}`;

    const d = toISTShifted(sub.creationTimeSeconds);

    const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
      2,
      "0",
    )}-${String(d.getUTCDate()).padStart(2, "0")}`;
    solvedDays.add(day);

    if (sub.creationTimeSeconds >= sevenDaysAgoSec) solvesLast7Days += 1;

    const existing = firstSolveByProblem.get(key);
    if (!existing || sub.creationTimeSeconds < existing.time) {
      firstSolveByProblem.set(key, {
        time: sub.creationTimeSeconds,
        participantType: sub.author?.participantType ?? "PRACTICE",
        rating: sub.problem.rating ?? null,
        tags: sub.problem.tags ?? [],
      });
    }
  }

  // Streak
  let currentStreakDays = 0;
  let bestStreakDays = 0;
  const cursor = toISTShifted(Date.now() / 1000);
  cursor.setUTCHours(0, 0, 0, 0);
  if (!solvedDays.has(cursor.toISOString().slice(0, 10))) {
    // Haven't solved anything yet today — that doesn't break a streak that's
    // still active as of yesterday, so start the walk-back from yesterday.
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (solvedDays.has(cursor.toISOString().slice(0, 10))) {
    currentStreakDays += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const sortedDays = [...solvedDays].sort();

  let longest = 0;
  let running = 0;

  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      running = 1;
      longest = 1;
      continue;
    }

    const prev = new Date(sortedDays[i - 1]);
    const cur = new Date(sortedDays[i]);

    prev.setUTCDate(prev.getUTCDate() + 1);

    if (prev.getTime() === cur.getTime()) {
      running++;
    } else {
      running = 1;
    }

    longest = Math.max(longest, running);
  }

  bestStreakDays = longest;

  // Upsolve ratio + difficulty breakdown + tag counts + this-week solve
  // count, all from the same deduped solved-problem set.
  let contestProblemsSolved = 0;
  let upsolvedCount = 0;
  let solvedSinceWeekStart = 0;
  const difficultyBreakdown = { easy: 0, medium: 0, hard: 0 };
  const tagCounts = new Map();

  for (const [, info] of firstSolveByProblem) {
    contestProblemsSolved += 1;
    if (info.participantType !== "CONTESTANT") upsolvedCount += 1;
    if (info.time >= weekStartSec) solvedSinceWeekStart += 1;

    const tier = difficultyTier(info.rating);
    if (tier) difficultyBreakdown[tier] += 1;

    for (const tag of info.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const upsolveRatio =
    contestProblemsSolved > 0 ? upsolvedCount / contestProblemsSolved : 0;

  // Strengths: top 3 tags actually solved a lot, by real count.
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => ({ tag, count }));

  // Weaknesses: from the core CP topic list, the 3 with the lowest count
  // (including zero) — real signal even for topics never touched.
  const weakTags = [...CORE_TAGS]
    .map((tag) => ({ tag, count: tagCounts.get(tag) ?? 0 }))
    .sort((a, b) => a.count - b.count)
    .slice(0, 3)
    .map((t) => t.tag);

  return {
    problemsSolved: firstSolveByProblem.size,
    solvesLast7Days,
    solvedSinceWeekStart,
    currentStreakDays,
    bestStreakDays,
    upsolveRatio,
    difficultyBreakdown,
    topTags,
    weakTags,
  };
}