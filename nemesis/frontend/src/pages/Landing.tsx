import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser, createRivalry, syncUser } from "../lib/api";

export default function Landing() {
  const navigate = useNavigate();
  const [you, setYou] = useState({ displayName: "", codeforcesHandle: "" });
  const [rival, setRival] = useState({ displayName: "", codeforcesHandle: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartDuel() {
    if (!you.displayName || !rival.displayName) {
      setError("Both names are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userA = await createUser(you);
      const userB = await createUser(rival);
      await syncUser(userA._id);
      await syncUser(userB._id);
      const rivalry = await createRivalry(userA._id, userB._id);
      navigate(`/duel/${rivalry._id}`);
    } catch (err: any) {
      const backendMessage = err?.response?.data?.error;
      setError(backendMessage || err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-muted uppercase mb-4">
          Every grind needs a witness
        </p>
        <h1 className="font-display text-6xl md:text-7xl italic text-parchment mb-4">
          Nemesis
        </h1>
        <p className="text-muted text-lg mb-12">
          Track your head-to-head against the one person who makes you open
          another problem at midnight.
        </p>

        <div className="grid grid-cols-2 gap-4 text-left mb-6">
          <DuelistForm
            label="You"
            accent="amber"
            value={you}
            onChange={setYou}
          />
          <DuelistForm
            label="Rival"
            accent="ember"
            value={rival}
            onChange={setRival}
          />
        </div>

        {error && (
          <p className="text-ember text-sm mb-4 font-mono">{error}</p>
        )}

        <button
          onClick={handleStartDuel}
          disabled={loading}
          className="w-full bg-amber hover:bg-amber-soft transition-colors text-graphite-950 font-body font-semibold py-3 rounded-card disabled:opacity-50"
        >
          {loading ? "Squaring off…" : "Start the duel"}
        </button>
      </div>
    </main>
  );
}

function DuelistForm({
  label,
  accent,
  value,
  onChange,
}: {
  label: string;
  accent: "amber" | "ember";
  value: { displayName: string; codeforcesHandle: string };
  onChange: (v: { displayName: string; codeforcesHandle: string }) => void;
}) {
  const accentClass = accent === "amber" ? "text-amber" : "text-ember";
  return (
    <div className="bg-graphite-900 border border-graphite-700 rounded-card p-4">
      <p className={`font-mono text-xs uppercase tracking-widest mb-3 ${accentClass}`}>
        {label}
      </p>
      <input
        placeholder="Display name"
        value={value.displayName}
        onChange={(e) => onChange({ ...value, displayName: e.target.value })}
        className="w-full bg-graphite-800 border border-graphite-700 rounded-md px-3 py-2 text-sm mb-2 outline-none focus:border-amber"
      />
      <input
        placeholder="Codeforces handle"
        value={value.codeforcesHandle}
        onChange={(e) =>
          onChange({ ...value, codeforcesHandle: e.target.value })
        }
        className="w-full bg-graphite-800 border border-graphite-700 rounded-md px-3 py-2 text-sm outline-none focus:border-amber"
      />
    </div>
  );
}
