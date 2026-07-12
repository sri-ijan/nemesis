import { Newspaper, Lightbulb } from "lucide-react";
import type { NarrativeEntry } from "../types";

interface Props {
  entry: NarrativeEntry | null;
  userAId: string;
  nameA: string;
  nameB: string;
}

// This is the shareable "duel card" — `entry.text` (the recap) and
// `entry.tip` (a catch-up suggestion for whoever's behind) are both
// written by Gemini in backend/services/gemini.js.
export default function DuelCard({ entry, userAId, nameA, nameB }: Props) {
  if (!entry) {
    return (
      <div className="bg-graphite-900 border border-dashed border-graphite-700 rounded-card p-8 text-center">
        <p className="text-muted text-sm font-mono">
          No recap yet, hit "Generate recap" above to get the first one.
        </p>
      </div>
    );
  }

  const tipTargetName = entry.tipTargetUserId === userAId ? nameA : nameB;
  const tipAccent = entry.tipTargetUserId === userAId ? "amber" : "ember";

  return (
    <div className="bg-gradient-to-br from-graphite-900 to-graphite-800 border border-graphite-700 rounded-card p-6 md:p-8">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper size={14} className="text-amber shrink-0" strokeWidth={2} />
        <p className="font-mono text-xs uppercase tracking-widest text-amber">
          {entry.triggerContest ?? "Recap"}
        </p>
      </div>
      <p className="font-display italic text-2xl md:text-3xl leading-snug text-parchment mb-6">
        {entry.text}
      </p>

      {entry.tip && (
        <div
          className={`border-l-2 pl-4 py-1 mb-4 ${
            tipAccent === "amber" ? "border-amber" : "border-ember"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb
              size={13}
              className={tipAccent === "amber" ? "text-amber" : "text-ember"}
              strokeWidth={2}
            />
            <p
              className={`font-mono text-[11px] uppercase tracking-widest ${
                tipAccent === "amber" ? "text-amber" : "text-ember"
              }`}
            >
              {tipTargetName} is grinding less right now — here's the gap
            </p>
          </div>
          <p className="text-parchment/90 text-sm leading-relaxed">{entry.tip}</p>
        </div>
      )}

      <p className="text-muted text-xs font-mono">
        {new Date(entry.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}