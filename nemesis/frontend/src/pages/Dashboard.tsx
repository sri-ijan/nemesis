import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRivalry, generateNarrative, syncUser } from "../lib/api";
import type { RivalryDoc } from "../types";
import RatingChart from "../components/RatingChart";
import DuelCard from "../components/DuelCard";
import ProfileDialCard from "../components/ProfileDialCard";

export default function Dashboard() {
  const { rivalryId } = useParams();
  const [rivalry, setRivalry] = useState<RivalryDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!rivalryId) return;
    getRivalry(rivalryId)
      .then(setRivalry)
      .catch((err) => setError(err.message));
  }, [rivalryId]);

  async function handleGenerateRecap() {
    if (!rivalryId) return;
    setGenerating(true);
    setError(null);
    try {
      await generateNarrative(rivalryId);
      const fresh = await getRivalry(rivalryId);
      setRivalry(fresh);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to generate recap.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSync() {
    if (!rivalry) return;
    setSyncing(true);
    setError(null);
    try {
      await syncUser(rivalry.userA._id);
      await syncUser(rivalry.userB._id);
      const fresh = await getRivalry(rivalry._id);
      setRivalry(fresh);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  if (error && !rivalry) {
    return <ErrorState message={error} />;
  }
  if (!rivalry) {
    return <LoadingSkeleton />;
  }

  const { userA, userB, obsessionScoreA, obsessionScoreB, narrativeLog } = rivalry;
  const leader =
    userA.stats.cfRating === userB.stats.cfRating
      ? null
      : userA.stats.cfRating > userB.stats.cfRating
      ? userA.displayName
      : userB.displayName;

  return (
    <main className="min-h-screen px-6 py-12 md:py-16 max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-3">
          <p className="font-mono text-xs tracking-[0.3em] text-muted uppercase">
            {leader ? `${leader} leads on rating` : "Rating: dead even"}
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="font-mono text-[10px] tracking-widest uppercase text-muted hover:text-parchment transition-colors disabled:opacity-40 border border-graphite-700 rounded-full px-2.5 py-1"
          >
            {syncing ? "Syncing…" : "↻ Sync"}
          </button>
        </div>
        <h1 className="font-display text-4xl md:text-6xl italic">
          <span className="text-amber">{userA.displayName}</span>
          <span className="text-muted mx-3 not-italic font-mono text-2xl md:text-3xl align-middle">
            vs
          </span>
          <span className="text-ember">{userB.displayName}</span>
        </h1>
        <p className="text-muted text-xs mt-3 max-w-md mx-auto">
          Rating reflects long-term skill. Obsession score reflects who's
          grinding harder <em>right now</em> — the two don't have to agree.
        </p>
      </header>

      {error && (
        <p className="text-ember text-sm font-mono text-center mb-6">{error}</p>
      )}

      <section className="grid grid-cols-2 gap-4 mb-6">
        <ScoreCard
          label={userA.displayName}
          score={obsessionScoreA}
          rating={userA.stats.cfRating}
          solved={userA.stats.cfProblemsSolved}
          streak={userA.activity.currentStreakDays}
          accent="amber"
          isLeader={obsessionScoreA >= obsessionScoreB}
        />
        <ScoreCard
          label={userB.displayName}
          score={obsessionScoreB}
          rating={userB.stats.cfRating}
          solved={userB.stats.cfProblemsSolved}
          streak={userB.activity.currentStreakDays}
          accent="ember"
          isLeader={obsessionScoreB > obsessionScoreA}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ProfileDialCard user={userA} accent="amber" />
        <ProfileDialCard user={userB} accent="ember" />
      </section>

      <section className="bg-graphite-900 border border-graphite-700 rounded-card p-6 md:p-7 mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted mb-5">
          Rating history
        </p>
        <RatingChart
          historyA={userA.ratingHistory}
          historyB={userB.ratingHistory}
          nameA={userA.displayName}
          nameB={userB.displayName}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Latest recap
          </p>
          <button
            onClick={handleGenerateRecap}
            disabled={generating}
            className="font-mono text-xs uppercase tracking-widest text-amber hover:text-amber-soft transition-colors disabled:opacity-50"
          >
            {generating ? "Writing…" : "Generate recap"}
          </button>
        </div>
        <DuelCard
          entry={narrativeLog.at(-1) ?? null}
          userAId={userA._id}
          nameA={userA.displayName}
          nameB={userB.displayName}
        />
      </section>
    </main>
  );
}

function ScoreCard({
  label,
  score,
  rating,
  solved,
  streak,
  accent,
  isLeader,
}: {
  label: string;
  score: number;
  rating: number;
  solved: number;
  streak: number;
  accent: "amber" | "ember";
  isLeader: boolean;
}) {
  const accentText = accent === "amber" ? "text-amber" : "text-ember";
  const accentBg = accent === "amber" ? "bg-amber" : "bg-ember";
  const accentBorder = isLeader
    ? accent === "amber"
      ? "border-amber/40"
      : "border-ember/40"
    : "border-graphite-700";

  return (
    <div
      className={`bg-graphite-900 border ${accentBorder} rounded-card p-5 md:p-6 transition-colors`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className={`font-mono text-xs uppercase tracking-widest ${accentText}`}>
          {label}
        </p>
        {isLeader && (
          <span className={`font-mono text-[9px] uppercase tracking-widest ${accentText}`}>
            ● grinding harder
          </span>
        )}
      </div>
      <p className="font-display text-5xl md:text-6xl italic mb-1">{score}</p>
      <p className="text-muted text-xs font-mono mb-3">obsession score</p>

      <div className="h-1 bg-graphite-800 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${accentBg} transition-all`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>

      <div className="pt-3 border-t border-graphite-700 grid grid-cols-3 gap-2 text-xs font-mono text-muted">
        <span>{rating} rtg</span>
        <span>{solved} solved</span>
        <span>{streak}d streak</span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-4xl mx-auto animate-pulse">
      <div className="h-3 w-40 bg-graphite-800 rounded mx-auto mb-4" />
      <div className="h-12 w-80 bg-graphite-800 rounded mx-auto mb-12" />
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="h-40 bg-graphite-900 border border-graphite-700 rounded-card" />
        <div className="h-40 bg-graphite-900 border border-graphite-700 rounded-card" />
      </div>
      <div className="h-72 bg-graphite-900 border border-graphite-700 rounded-card" />
    </main>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <p className="font-mono text-ember text-sm text-center">{message}</p>
    </main>
  );
}
