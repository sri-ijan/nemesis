import { Trophy } from "lucide-react";
import type { RivalryDoc } from "../types";

interface Props {
  rivalry: RivalryDoc;
}

// Weekly "rounds" (Sunday-Saturday) — whoever solves more problems that
// week wins it. Season tally + round-history dots come from finalized
// weekly snapshots (backend, routes/rivalry.js). The LIVE in-progress
// number uses activity.solvedThisWeek — computed fresh from actual CF
// submission timestamps every sync (services/codeforces.js), so it's
// correct immediately, from Sunday onward, no matter when tracking
// started.
export default function SeasonScoreCard({ rivalry }: Props) {
  const { userA, userB, seasonScoreA, seasonScoreB, roundHistory } = rivalry;

  const liveSolvedA = userA.activity.solvedThisWeek;
  const liveSolvedB = userB.activity.solvedThisWeek;
  const liveTotal = liveSolvedA + liveSolvedB;

  const recentRounds = [...roundHistory].slice(-8);

  return (
    <div className="bg-graphite-900 border border-graphite-700 rounded-card p-6 md:p-7 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <Trophy size={14} className="text-muted" strokeWidth={2} />
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          Season score
        </p>
      </div>

      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="text-center">
          <p className="font-display text-5xl italic text-amber">{seasonScoreA}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-1">
            {userA.displayName}
          </p>
        </div>
        <p className="font-mono text-muted text-xl">—</p>
        <div className="text-center">
          <p className="font-display text-5xl italic text-ember">{seasonScoreB}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-1">
            {userB.displayName}
          </p>
        </div>
      </div>

      <div className="pt-5 border-t border-graphite-700">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2 text-center">
          This week (since Sunday) — live
        </p>
        <div className="h-2 bg-graphite-800 rounded-full overflow-hidden flex mb-2">
          {liveTotal > 0 ? (
            <>
              <div
                className="h-full bg-amber transition-all"
                style={{ width: `${(liveSolvedA / liveTotal) * 100}%` }}
              />
              <div
                className="h-full bg-ember transition-all"
                style={{ width: `${(liveSolvedB / liveTotal) * 100}%` }}
              />
            </>
          ) : (
            <div className="h-full w-full bg-graphite-700" />
          )}
        </div>
        <div className="flex justify-between font-mono text-xs">
          <span className="text-amber">{liveSolvedA} solved</span>
          <span className="text-ember">{liveSolvedB} solved</span>
        </div>
      </div>

      {recentRounds.length > 0 && (
        <div className="pt-5 mt-5 border-t border-graphite-700">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
            Past rounds
          </p>
          <div className="flex gap-2 flex-wrap">
            {recentRounds.map((round) => {
              const color =
                round.winnerUserId === userA._id
                  ? "#d97706"
                  : round.winnerUserId === userB._id
                  ? "#b34a3c"
                  : "#8a8378";
              return (
                <div
                  key={round.weekId}
                  title={`${round.weekId}: ${userA.displayName} ${round.solvedA} — ${round.solvedB} ${userB.displayName}`}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}