import { Router } from "express";
import Rivalry from "../models/Rivalry.js";
import User from "../models/User.js";
import { computeObsessionScore } from "../services/obsessionScore.js";
import { generateNarrative } from "../services/gemini.js";

const router = Router();

// IST is UTC+5:30 — match the same offset used in
// services/codeforces.js so round boundaries line up with the live
// solvedThisWeek number (otherwise a solve right around midnight IST
// could fall in different weeks depending on which boundary is used).
const IST_OFFSET_SEC = 5.5 * 60 * 60;

// Week id = "YYYY-MM-DD" of that week's Sunday, computed in IST.
function getWeekId(date) {
  const shifted = new Date(date.getTime() + IST_OFFSET_SEC * 1000);
  const d = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
  const daysSinceSunday = d.getUTCDay(); // 0 = Sunday, read as IST day-of-week
  d.setUTCDate(d.getUTCDate() - daysSinceSunday);
  return d.toISOString().slice(0, 10);
}

/**
 * Checks if the week has rolled over since the last time this rivalry was
 * tracked. If so, finalizes the just-ended round into roundHistory +
 * updates the season tally, then starts a fresh baseline for the new
 * week. Runs reactively on every dashboard load — no cron needed.
 */
function rollWeeklyRoundIfNeeded(rivalry, userA, userB) {
  const currentWeekId = getWeekId(new Date());
  const tracking = rivalry.weekTracking;

  if (!tracking?.weekId) {
    rivalry.weekTracking = {
      weekId: currentWeekId,
      startSolvedA: userA.stats.cfProblemsSolved,
      startSolvedB: userB.stats.cfProblemsSolved,
    };
    return;
  }

  if (tracking.weekId === currentWeekId) return; // still the same round

  const solvedA = Math.max(0, userA.stats.cfProblemsSolved - tracking.startSolvedA);
  const solvedB = Math.max(0, userB.stats.cfProblemsSolved - tracking.startSolvedB);
  const winnerUserId =
    solvedA === solvedB ? null : solvedA > solvedB ? userA._id.toString() : userB._id.toString();

  rivalry.roundHistory.push({
    weekId: tracking.weekId,
    solvedA,
    solvedB,
    winnerUserId,
  });

  if (winnerUserId === userA._id.toString()) rivalry.seasonScoreA += 1;
  else if (winnerUserId === userB._id.toString()) rivalry.seasonScoreB += 1;

  rivalry.weekTracking = {
    weekId: currentWeekId,
    startSolvedA: userA.stats.cfProblemsSolved,
    startSolvedB: userB.stats.cfProblemsSolved,
  };
}

// POST /api/rivalries  { userAId, userBId }
router.post("/", async (req, res) => {
  try {
    const { userAId, userBId } = req.body;
    if (!userAId || !userBId) {
      return res.status(400).json({ error: "userAId and userBId are required" });
    }
    const rivalry = await Rivalry.create({ userA: userAId, userB: userBId });
    res.status(201).json(rivalry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rivalries/:id — full head-to-head payload for the dashboard
router.get("/:id", async (req, res) => {
  try {
    const rivalry = await Rivalry.findById(req.params.id)
      .populate("userA")
      .populate("userB");
    if (!rivalry) return res.status(404).json({ error: "Rivalry not found" });

    rivalry.obsessionScoreA = computeObsessionScore({
      solvesLast7Days: rivalry.userA.activity.solvesLast7Days,
      currentStreakDays: rivalry.userA.activity.currentStreakDays,
      upsolveRatio: rivalry.userA.activity.upsolveRatio,
      rating: rivalry.userA.stats.cfRating,
    });
    rivalry.obsessionScoreB = computeObsessionScore({
      solvesLast7Days: rivalry.userB.activity.solvesLast7Days,
      currentStreakDays: rivalry.userB.activity.currentStreakDays,
      upsolveRatio: rivalry.userB.activity.upsolveRatio,
      rating: rivalry.userB.stats.cfRating,
    });

    rollWeeklyRoundIfNeeded(rivalry, rivalry.userA, rivalry.userB);

    await rivalry.save();

    res.json(rivalry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rivalries/:id/narrative
router.post("/:id/narrative", async (req, res) => {
  try {
    const rivalry = await Rivalry.findById(req.params.id)
      .populate("userA")
      .populate("userB");
    if (!rivalry) return res.status(404).json({ error: "Rivalry not found" });

    const { recap, tip, tipTargetUserId } = await generateNarrative(rivalry);
    const leaderAtTime =
      rivalry.userA.stats.cfRating === rivalry.userB.stats.cfRating
        ? null
        : rivalry.userA.stats.cfRating > rivalry.userB.stats.cfRating
        ? rivalry.userA._id.toString()
        : rivalry.userB._id.toString();

    rivalry.narrativeLog.push({
      text: recap,
      tip,
      tipTargetUserId,
      triggerContest: req.body?.triggerContest,
      leaderAtTime,
    });
    await rivalry.save();
    res.status(201).json(rivalry.narrativeLog.at(-1));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;