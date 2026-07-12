import { Router } from "express";
import Rivalry from "../models/Rivalry.js";
import User from "../models/User.js";
import { computeObsessionScore } from "../services/obsessionScore.js";
import { generateNarrative } from "../services/gemini.js";

const router = Router();

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
    await rivalry.save();

    res.json(rivalry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rivalries/:id/narrative
// Generates a fresh recap + catch-up tip using Gemini directly
// (services/gemini.js) and persists it.
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
