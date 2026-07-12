import mongoose from "mongoose";

const narrativeEntrySchema = new mongoose.Schema(
  {
    generatedAt: { type: Date, default: Date.now },
    triggerContest: String,
    // Filled by services/gemini.js.
    text: { type: String, required: true },
    leaderAtTime: { type: String, default: null }, // userId string, or null if tied
    // Catch-up tip aimed at whoever's currently behind on obsession score.
    tip: { type: String, default: null },
    tipTargetUserId: { type: String, default: null },
  },
  { _id: false }
);

const rivalrySchema = new mongoose.Schema(
  {
    userA: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userB: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Snapshot obsession scores, recomputed on each sync
    obsessionScoreA: { type: Number, default: 0 },
    obsessionScoreB: { type: Number, default: 0 },

    narrativeLog: [narrativeEntrySchema],

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

rivalrySchema.index({ userA: 1, userB: 1 }, { unique: true });

export default mongoose.model("Rivalry", rivalrySchema);
