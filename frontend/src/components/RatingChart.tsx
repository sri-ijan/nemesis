import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { RatingPoint } from "../types";

interface Props {
  historyA: RatingPoint[];
  historyB: RatingPoint[];
  nameA: string;
  nameB: string;
}

// Merges two independent contest histories into one chart-friendly array,
// indexed by contest number rather than wall-clock date (CP rivals rarely
// enter the exact same contests, so date-axis alignment would be misleading).
function mergeHistories(historyA: RatingPoint[], historyB: RatingPoint[]) {
  const maxLen = Math.max(historyA.length, historyB.length);
  const merged = [];
  for (let i = 0; i < maxLen; i++) {
    merged.push({
      index: i + 1,
      ratingA: historyA[i]?.newRating ?? null,
      ratingB: historyB[i]?.newRating ?? null,
    });
  }
  return merged;
}

export default function RatingChart({ historyA, historyB, nameA, nameB }: Props) {
  const data = mergeHistories(historyA, historyB);

  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2b2723" />
          <XAxis
            dataKey="index"
            stroke="#8a8378"
            fontSize={12}
            tickMargin={8}
            label={{ value: "Contest #", position: "bottom", offset: 0, fill: "#8a8378" }}
          />
          <YAxis stroke="#8a8378" fontSize={12} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              background: "#151311",
              border: "1px solid #2b2723",
              borderRadius: 8,
              color: "#ece7dd",
            }}
          />
          <Line
            type="monotone"
            dataKey="ratingA"
            name={nameA}
            stroke="#d97706"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="ratingB"
            name={nameB}
            stroke="#b34a3c"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
