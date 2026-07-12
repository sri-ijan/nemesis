/**
 * Obsession Score — a 0-100 composite meant to capture "who's grinding harder
 * right now", not just "who's rated higher". Rating is a lagging indicator;
 * this rewards current effort.
 *
 * Weights (tune these during polish, these are reasonable defaults):
 *   40% - solve velocity   (solves in last 7 days, normalized against a cap)
 *   25% - streak           (consecutive active days, normalized against a cap)
 *   20% - upsolve ratio    (discipline signal: revisiting missed problems)
 *   15% - contest rating   (long-term skill, small weight on purpose)
 */

const VELOCITY_CAP = 30; // solves/week considered "maxed out"
const STREAK_CAP = 30; // days
const RATING_CAP = 3000; // CF legendary grandmaster territory

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

export function computeObsessionScore({
  solvesLast7Days = 0,
  currentStreakDays = 0,
  upsolveRatio = 0, // already 0-1
  rating = 0,
}) {
  const velocityScore = clamp01(solvesLast7Days / VELOCITY_CAP);
  const streakScore = clamp01(currentStreakDays / STREAK_CAP);
  const upsolveScore = clamp01(upsolveRatio);
  const ratingScore = clamp01(rating / RATING_CAP);

  const composite =
    velocityScore * 0.4 +
    streakScore * 0.25 +
    upsolveScore * 0.2 +
    ratingScore * 0.15;

  return Math.round(composite * 100);
}
