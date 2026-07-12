import type { UserDoc } from "../types";

interface Props {
  user: UserDoc;
  accent: "amber" | "ember";
}

// LeetCode-style circular dial: three stacked arcs (easy/medium/hard) around
// a center total. Built with plain SVG stroke-dasharray segments — no chart
// library needed for something this simple.
export default function ProfileDialCard({ user, accent }: Props) {
  const { easy, medium, hard } = user.stats.difficultyBreakdown;
  const total = easy + medium + hard;

  const size = 140;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const easyLen = total > 0 ? (easy / total) * circumference : 0;
  const mediumLen = total > 0 ? (medium / total) * circumference : 0;
  const hardLen = total > 0 ? (hard / total) * circumference : 0;

  const accentText = accent === "amber" ? "text-amber" : "text-ember";
  const accentBorder = accent === "amber" ? "border-amber/30" : "border-ember/30";

  return (
    <div className={`bg-graphite-900 border ${accentBorder} rounded-card p-5 md:p-6`}>
      <p className={`font-mono text-xs uppercase tracking-widest mb-4 ${accentText}`}>
        {user.displayName}
      </p>

      <div className="flex items-center gap-5">
        {/* Dial */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#2b2723"
              strokeWidth={stroke}
            />
            {total > 0 && (
              <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#3fae6a"
                  strokeWidth={stroke}
                  strokeDasharray={`${easyLen} ${circumference - easyLen}`}
                  strokeLinecap="butt"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth={stroke}
                  strokeDasharray={`${mediumLen} ${circumference - mediumLen}`}
                  strokeDashoffset={-easyLen}
                  strokeLinecap="butt"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#b34a3c"
                  strokeWidth={stroke}
                  strokeDasharray={`${hardLen} ${circumference - hardLen}`}
                  strokeDashoffset={-(easyLen + mediumLen)}
                  strokeLinecap="butt"
                />
              </g>
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-display text-3xl italic text-parchment">{total}</p>
            <p className="text-muted text-[10px] font-mono uppercase tracking-wider">
              solved
            </p>
          </div>
        </div>

        {/* Difficulty legend */}
        <div className="flex flex-col gap-1.5 font-mono text-xs">
          <LegendRow color="#3fae6a" label="Easy" count={easy} />
          <LegendRow color="#d97706" label="Medium" count={medium} />
          <LegendRow color="#b34a3c" label="Hard" count={hard} />
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

function LegendRow({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-muted w-14">{label}</span>
      <span className="text-parchment">{count}</span>
    </div>
  );
}
