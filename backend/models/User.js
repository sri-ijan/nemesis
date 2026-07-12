import mongoose from "mongoose";

const ratingPointSchema = new mongoose.Schema(
  {
    contestName: String,
    date: Date,
    oldRating: Number,
    newRating: Number,
    rank: Number,
  },
  { _id: false },
);

const tagCountSchema = new mongoose.Schema(
  { tag: String, count: Number },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true },
    codeforcesHandle: { type: String, default: null },

    // Cached snapshot, refreshed by sync jobs (services/*.js)
    stats: {
      cfRating: { type: Number, default: 0 },
      cfMaxRating: { type: Number, default: 0 },
      cfProblemsSolved: { type: Number, default: 0 },
      cfContestsAttended: { type: Number, default: 0 },

      // LeetCode-style Easy/Medium/Hard breakdown, bucketed from CF
      // problem ratings (see services/codeforces.js → difficultyTier).
      difficultyBreakdown: {
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 },
      },

      // Strengths: top solved tags by real count.
      topTags: [tagCountSchema],
      // Weaknesses: lowest-count tags from a core CP topic reference list.
      weakTags: [String],
    },

    ratingHistory: [ratingPointSchema],

    // Rolling obsession inputs — see services/obsessionScore.js for formula
    activity: {
      solvesLast7Days: { type: Number, default: 0 },
      solvedThisWeek: { type: Number, default: 0 }, // since last Sunday 00:00 UTC
      currentStreakDays: { type: Number, default: 0 },
      bestStreakDays: {
        type: Number,
        default: 0,
      },
      upsolveRatio: { type: Number, default: 0 }, // upsolved / total attempted post-contest
    },

    lastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);