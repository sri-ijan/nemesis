export interface RatingPoint {
  contestName: string;
  date: string;
  oldRating: number;
  newRating: number;
  rank: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface UserDoc {
  _id: string;
  displayName: string;
  codeforcesHandle: string | null;
  leetcodeHandle: string | null;
  stats: {
    cfRating: number;
    cfMaxRating: number;
    cfProblemsSolved: number;
    cfContestsAttended: number;
    lcTotalSolved: number;
    lcRanking: number;
    difficultyBreakdown: {
      easy: number;
      medium: number;
      hard: number;
    };
    topTags: TagCount[];
    weakTags: string[];
  };
  ratingHistory: RatingPoint[];
  activity: {
    solvesLast7Days: number;
    currentStreakDays: number;
    upsolveRatio: number;
  };
}

export interface NarrativeEntry {
  generatedAt: string;
  triggerContest?: string;
  text: string;
  leaderAtTime: string | null;
  tip: string | null;
  tipTargetUserId: string | null;
}

export interface RivalryDoc {
  _id: string;
  userA: UserDoc;
  userB: UserDoc;
  obsessionScoreA: number;
  obsessionScoreB: number;
  narrativeLog: NarrativeEntry[];
}
