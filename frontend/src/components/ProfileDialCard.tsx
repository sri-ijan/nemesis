import { useState } from "react";
import type { UserDoc } from "../types";

type Props = {
  user: UserDoc;
  accent: "amber" | "ember";
  momentum: number;
};

type Difficulty = "easy" | "medium" | "hard";

const DIFF_COLOR: Record<Difficulty, string> = {
 easy: "#3fae6a",   // unchanged — green
  medium: "#eab308", // was #d97706 (amber brand color) → now a true gold/yellow
  hard: "#e5484d",
};

const DIFF_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

// LeetCode-style circular dial: three stacked arcs (easy/medium/hard) around
// a center total. Hovering a segment (or its legend row) glows that arc,
// dims the others, and swaps the center label to that segment's count.
export default function ProfileDialCard({ user, accent, momentum }: Props) {
  const { easy, medium, hard } = user.stats.difficultyBreakdown;
  const total = easy + medium + hard;
  const counts: Record<Difficulty, number> = { easy, medium, hard };

  const [hovered, setHovered] = useState<Difficulty | null>(null);

  const size = 140;
  const baseStroke = 12;
  const hoverStroke = 14;
  const radius = (size - hoverStroke) / 2; // reserve room so the glow stroke never clips
  const circumference = 2 * Math.PI * radius;

  const easyLen = total > 0 ? (easy / total) * circumference : 0;
  const mediumLen = total > 0 ? (medium / total) * circumference : 0;
  const hardLen = total > 0 ? (hard / total) * circumference : 0;
  const offsets: Record<Difficulty, number> = {
    easy: 0,
    medium: -easyLen,
    hard: -(easyLen + mediumLen),
  };
  const lengths: Record<Difficulty, number> = {
    easy: easyLen,
    medium: mediumLen,
    hard: hardLen,
  };

  const accentText = accent === "amber" ? "text-amber" : "text-ember";
  const accentBorder =
    accent === "amber" ? "border-amber/30" : "border-ember/30";

  return (
    <div
      className={`relative bg-graphite-900 border ${accentBorder} rounded-card p-5 md:p-6 overflow-visible`}
    >
      {/* Momentum Badge */}
      <div className="absolute top-4 right-4 group z-20">
        <div
          className={`
        flex items-center
        h-9
        rounded-full
        overflow-hidden
        transition-all
        duration-300
        cursor-default
        shadow-lg
        ${
          momentum >= 0
            ? "bg-green-500/15 border border-green-500/40 text-green-400"
            : "bg-red-500/15 border border-red-500/40 text-red-400"
        }
       w-9 hover:w-44
      `}
        >
          <div className="w-9 flex items-center justify-center flex-shrink-0">
            {momentum >= 0 ? "▲" : "▼"}
          </div>

          <span
            className="
          whitespace-nowrap
          text-[11px]
          font-mono
          opacity-0
          ml-0
          transition-all
          duration-300
         hover:opacity-100
hover:ml-2
        "
          >
            {momentum >= 0 ? `+${momentum}` : momentum} last 5 contests
          </span>
        </div>
      </div>

      <p
        className={`font-mono text-xs uppercase tracking-widest mb-4 ${accentText}`}
      >
        {user.displayName}
      </p>

      <div className="flex items-center gap-5">
        {/* Dial */}
        <div
          className="relative shrink-0"
          style={{ width: size, height: size }}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#2b2723"
              strokeWidth={baseStroke}
            />
            {total > 0 && (
              <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => {
                  const isHovered = hovered === diff;
                  const isDimmed = hovered !== null && !isHovered;
                  return (
                    <circle
                      key={diff}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="none"
                      stroke={DIFF_COLOR[diff]}
                      strokeWidth={isHovered ? hoverStroke : baseStroke}
                      strokeDasharray={`${lengths[diff]} ${circumference - lengths[diff]}`}
                      strokeDashoffset={offsets[diff]}
                      strokeLinecap="butt"
                      pointerEvents="stroke"
                      onMouseEnter={() => setHovered(diff)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        cursor: counts[diff] > 0 ? "pointer" : "default",
                        opacity: isDimmed ? 0.55 : 1,
                        filter: isHovered
                          ? `drop-shadow(0 0 3px ${DIFF_COLOR[diff]}99)`
                          : "none",
                        transition: "opacity 0.1s ease-out",
                      }}
                    />
                  );
                })}
              </g>
            )}
          </svg>
          <div
  key={hovered ?? "total"}
  className="
    absolute inset-0
    flex flex-col
    items-center
    justify-center
    pointer-events-none
    transition-all
    duration-300
    ease-out
    animate-[fadeScale_.25s_ease-out]
  "
>
            {hovered ? (
              <>
                <p
                  className="font-display text-3xl italic transition-colors duration-150"
                  style={{ color: DIFF_COLOR[hovered] }}
                >
                  {counts[hovered]}
                </p>
                <p className="text-muted text-[10px] font-mono uppercase tracking-wider">
                  {DIFF_LABEL[hovered]}
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-3xl italic text-parchment">
                  {total}
                </p>
                <p className="text-muted text-[10px] font-mono uppercase tracking-wider">
                  solved
                </p>
              </>
            )}
          </div>
        </div>

        {/* Difficulty legend — hovering a row highlights the matching arc too */}
        <div className="flex flex-col gap-1.5 font-mono text-xs">
          <LegendRow
            diff="easy"
            count={easy}
            isHovered={hovered === "easy"}
            isDimmed={hovered !== null && hovered !== "easy"}
            onEnter={() => setHovered("easy")}
            onLeave={() => setHovered(null)}
          />
          <LegendRow
            diff="medium"
            count={medium}
            isHovered={hovered === "medium"}
            isDimmed={hovered !== null && hovered !== "medium"}
            onEnter={() => setHovered("medium")}
            onLeave={() => setHovered(null)}
          />
          <LegendRow
            diff="hard"
            count={hard}
            isHovered={hovered === "hard"}
            isDimmed={hovered !== null && hovered !== "hard"}
            onEnter={() => setHovered("hard")}
            onLeave={() => setHovered(null)}
          />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-graphite-700 grid grid-cols-2 gap-4">
        <div>
          <p className="text-muted text-[10px] font-mono uppercase tracking-widest mb-1.5">
            Strengths
          </p>
          {user.stats.topTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {user.stats.topTags.map((t) => (
                <span
                  key={t.tag}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-graphite-800 text-parchment/80"
                >
                  {t.tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted text-[10px] font-mono">—</p>
          )}
        </div>
        <div>
          <p className="text-muted text-[10px] font-mono uppercase tracking-widest mb-1.5">
            Weak spots
          </p>
          {user.stats.weakTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {user.stats.weakTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-graphite-800 text-ember/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted text-[10px] font-mono">—</p>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendRow({
  diff,
  count,
  isHovered,
  isDimmed,
  onEnter,
  onLeave,
}: {
  diff: Difficulty;
  count: number;
  isHovered: boolean;
  isDimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-100 cursor-default"
      style={{
        backgroundColor: isHovered ? `${DIFF_COLOR[diff]}1a` : "transparent",
        opacity: isDimmed ? 0.5 : 1,
        transform: isHovered ? "translateX(3px)" : "translateX(0)",
      }}
    >
      <span
        className="w-2 h-2 rounded-full transition-all duration-100"
        style={{
          backgroundColor: DIFF_COLOR[diff],
          boxShadow: isHovered ? `0 0 3px ${DIFF_COLOR[diff]}` : "none",
        }}
      />
      <span className="text-muted w-14">{DIFF_LABEL[diff]}</span>
      <span className="text-parchment">{count}</span>
    </div>
  );
}