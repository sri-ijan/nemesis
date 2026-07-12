import { useState } from "react";
import { Newspaper, Lightbulb, Download } from "lucide-react";
import toast from "react-hot-toast";
import type { NarrativeEntry } from "../types";
import { exportDuelCardPNG } from "../lib/exportDuelCard";

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
  const [downloading, setDownloading] = useState(false);

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

  async function handleDownload() {
    if (!entry) return;
    setDownloading(true);
    try {
      await exportDuelCardPNG({ entry, nameA, nameB, userAId });
    } catch (err: any) {
      toast.error(err?.message || "Couldn't generate the image.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-graphite-900 to-graphite-800 border border-graphite-700 rounded-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-amber shrink-0" strokeWidth={2} />
          <p className="font-mono text-xs uppercase tracking-widest text-amber">
            {entry.triggerContest ?? "Recap"}
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted hover:text-parchment transition-colors disabled:opacity-40 border border-graphite-700 rounded-full px-2.5 py-1"
        >
          <Download size={11} strokeWidth={2} />
          {downloading ? "Rendering…" : "Download PNG"}
        </button>
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