import { Router } from "express";
import User from "../models/User.js";
import {
  fetchCFUserInfo,
  fetchCFRatingHistory,
  fetchCFSubmissions,
} from "../services/codeforces.js";
import { fetchLeetCodeStats } from "../services/leetcode.js";

const router = Router();

// GET /api/users/verify-handle/:handle — checks if a CF handle exists,
// used by the frontend before creating a user, so typos get caught early
// instead of surfacing as a confusing 500 later.
router.get("/verify-handle/:handle", async (req, res) => {
  try {
    const info = await fetchCFUserInfo(req.params.handle);
    res.json({ valid: true, rating: info.rating });
  } catch {
    res.json({ valid: false });
  }
});

// POST /api/users  { displayName, codeforcesHandle, leetcodeHandle }
router.post("/", async (req, res) => {
  try {
    const { displayName, codeforcesHandle, leetcodeHandle } = req.body;
    if (!displayName) {
      return res.status(400).json({ error: "displayName is required" });
    }
    const user = await User.create({ displayName, codeforcesHandle, leetcodeHandle });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/sync — pulls fresh data from CF/LeetCode, recomputes stats
router.post("/:id/sync", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.codeforcesHandle) {
      const info = await fetchCFUserInfo(user.codeforcesHandle);
      await new Promise((r) => setTimeout(r, 800));
      const history = await fetchCFRatingHistory(user.codeforcesHandle);
      await new Promise((r) => setTimeout(r, 800));
      const subs = await fetchCFSubmissions(user.codeforcesHandle);

      user.stats.cfRating = info.rating;
      user.stats.cfMaxRating = info.maxRating;
      user.stats.cfProblemsSolved = subs.problemsSolved;
      user.stats.cfContestsAttended = history.length;
      user.stats.difficultyBreakdown = subs.difficultyBreakdown;
      user.stats.topTags = subs.topTags;
      user.stats.weakTags = subs.weakTags;
      user.activity.solvesLast7Days = subs.solvesLast7Days;
      user.activity.currentStreakDays = subs.currentStreakDays;
      user.activity.upsolveRatio = subs.upsolveRatio;
      user.ratingHistory = history;
    }

    if (user.leetcodeHandle) {
      const lc = await fetchLeetCodeStats(user.leetcodeHandle);
      user.stats.lcTotalSolved = lc.totalSolved;
      user.stats.lcRanking = lc.ranking;
    }

    user.lastSyncedAt = new Date();
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

export default router;