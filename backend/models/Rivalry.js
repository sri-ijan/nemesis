import mongoose from "mongoose";

const narrativeEntrySchema = new mongoose.Schema(
  {
    generatedAt: { type: Date, default: Date.now },
    triggerContest: String,
    text: { type: String, required: true },
    leaderAtTime: { type: String, default: null },
    tip: { type: String, default: null },
    tipTargetUserId: { type: String, default: null },
  },
  { _id: false }
);

// One finalized weekly round — who solved more that week (Sunday-Saturday).
const roundResultSchema = new mongoose.Schema(
  {
    weekId: { type: String, required: true }, // "YYYY-MM-DD" of that week's Sunday
    solvedA: { type: Number, default: 0 },
    solvedB: { type: Number, default: 0 },
    winnerUserId: { type: String, default: null }, // null = tie
    endedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const rivalrySchema = new mongoose.Schema(
  {
    userA: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userB: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    obsessionScoreA: { type: Number, default: 0 },
    obsessionScoreB: { type: Number, default: 0 },

    narrativeLog: [narrativeEntrySchema],

    // Snapshot marking the start of the currently in-progress round —
    // used only for finalizing PAST rounds cleanly. The live in-progress
    // number shown in the UI comes from activity.solvedThisWeek instead
    // (computed fresh from CF submission timestamps every sync), so it's
    // accurate immediately rather than depending on this baseline.
    weekTracking: {
      weekId: { type: String, default: null },
      startSolvedA: { type: Number, default: 0 },
      startSolvedB: { type: Number, default: 0 },
    },

    roundHistory: [roundResultSchema],
    seasonScoreA: { type: Number, default: 0 },
    seasonScoreB: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

rivalrySchema.index({ userA: 1, userB: 1 }, { unique: true });

export default mongoose.model("Rivalry", rivalrySchema);