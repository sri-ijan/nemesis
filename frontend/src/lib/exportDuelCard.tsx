import type { NarrativeEntry } from "../types";

// Matches tailwind.config.js — kept in sync manually since canvas can't
// read Tailwind classes.
const COLORS = {
  graphite900: "#151311",
  graphite800: "#1e1b18",
  graphite700: "#2b2723",
  parchment: "#ece7dd",
  parchmentDim: "rgba(236, 231, 221, 0.9)",
  muted: "#8a8378",
  amber: "#d97706",
  ember: "#b34a3c",
};

const WIDTH = 1200;
const HEIGHT = 630;
const PAD = 64;

function loadFonts() {
  return Promise.all([
    document.fonts.load('italic 44px "Instrument Serif"'),
    document.fonts.load('600 13px "Geist Mono"'),
    document.fonts.load('400 24px "Geist"'),
  ]).then(() => document.fonts.ready);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Greedy word-wrap. Truncates with an ellipsis on the last allowed line
// instead of overflowing the card.
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = attempt;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);

  if (lines.length === maxLines) {
    const consumedWords = lines.join(" ").split(/\s+/).length;
    const overflowed = consumedWords < words.length;
    if (overflowed) {
      let last = lines[maxLines - 1];
      while (
        ctx.measureText(`${last}…`).width > maxWidth &&
        last.includes(" ")
      ) {
        last = last.slice(0, last.lastIndexOf(" "));
      }
      lines[maxLines - 1] = `${last}…`;
    }
  }
  return lines;
}

export interface ExportDuelCardParams {
  entry: NarrativeEntry;
  nameA: string;
  nameB: string;
  userAId: string;
}

export async function exportDuelCardPNG({
  entry,
  nameA,
  nameB,
  userAId,
}: ExportDuelCardParams): Promise<void> {
  await loadFonts();

  const canvas = document.createElement("canvas");
  const scale = 2; // export at 2x for crisp retina PNGs
  canvas.width = WIDTH * scale;
  canvas.height = HEIGHT * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser");
  ctx.scale(scale, scale);

  // Card background — diagonal gradient, graphite-900 → graphite-800.
  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, COLORS.graphite900);
  bg.addColorStop(1, COLORS.graphite800);
  roundRect(ctx, 0, 0, WIDTH, HEIGHT, 28);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = COLORS.graphite700;
  ctx.lineWidth = 1;
  ctx.stroke();

  let y = PAD;

  // Eyebrow: contest name / "Recap", amber, mono uppercase.
  ctx.fillStyle = COLORS.amber;
  ctx.font = "600 13px 'Geist Mono', monospace";
  ctx.textBaseline = "alphabetic";
  const eyebrow = (entry.triggerContest ?? "Recap").toUpperCase();
  // simple dot marker in place of the newspaper icon
  ctx.beginPath();
  ctx.arc(PAD + 3, y - 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText(eyebrow, PAD + 16, y);
  y += 40;

  // "NameA vs NameB" header — gives the image context once it's shared
  // outside the dashboard, where there's no surrounding page to explain it.
  ctx.font = "italic 40px 'Instrument Serif', serif";
  const nameAWidth = ctx.measureText(nameA).width;
  const vsText = " VS ";
  ctx.font = "16px 'Geist Mono', monospace";
  const vsWidth = ctx.measureText(vsText).width;

  let cursorX = PAD;
  ctx.fillStyle = COLORS.amber;
  ctx.font = "italic 40px 'Instrument Serif', serif";
  ctx.fillText(nameA, cursorX, y);
  cursorX += nameAWidth;

  ctx.fillStyle = COLORS.muted;
  ctx.font = "16px 'Geist Mono', monospace";
  ctx.fillText(vsText, cursorX, y - 2);
  cursorX += vsWidth;

  const tipAccentColor =
    entry.tipTargetUserId === userAId ? COLORS.amber : COLORS.ember;
  const tipTargetName = entry.tipTargetUserId === userAId ? nameA : nameB;

  ctx.fillStyle = COLORS.ember;
  ctx.font = "italic 40px 'Instrument Serif', serif";
  ctx.fillText(nameB, cursorX, y);

  y += 56;

  // Recap body — the actual Gemini narrative text.
  ctx.fillStyle = COLORS.parchment;
  ctx.font = "italic 34px 'Instrument Serif', serif";
  const bodyMaxWidth = WIDTH - PAD * 2;
  const bodyLines = wrapText(ctx, entry.text, bodyMaxWidth, entry.tip ? 3 : 5);
  const bodyLineHeight = 44;
  for (const line of bodyLines) {
    y += bodyLineHeight;
    ctx.fillText(line, PAD, y);
  }
  y += 20;

  // Tip callout, if present — left accent bar + label + tip text.
  if (entry.tip) {
    y += 30;
    const barTop = y - 22;
    ctx.fillStyle = tipAccentColor;
    ctx.fillRect(PAD, barTop, 3, 74);

    ctx.font = "600 12px 'Geist Mono', monospace";
    ctx.fillStyle = tipAccentColor;
    ctx.fillText(
      `${tipTargetName.toUpperCase()} IS GRINDING LESS RIGHT NOW`,
      PAD + 20,
      y,
    );

    y += 28;
    ctx.font = "20px 'Geist', sans-serif";
    ctx.fillStyle = COLORS.parchmentDim;
    const tipLines = wrapText(ctx, entry.tip, bodyMaxWidth - 20, 2);
    for (const line of tipLines) {
      ctx.fillText(line, PAD + 20, y);
      y += 26;
    }
  }

  // Footer — timestamp + brand watermark.
  ctx.font = "13px 'Geist Mono', monospace";
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(
    new Date(entry.generatedAt).toLocaleString(),
    PAD,
    HEIGHT - PAD + 8,
  );
  const brand = "NEMESIS";
  const brandWidth = ctx.measureText(brand).width;
  ctx.fillText(brand, WIDTH - PAD - brandWidth, HEIGHT - PAD + 8);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  if (!blob) throw new Error("Failed to render PNG");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  a.href = url;
  a.download = `nemesis-${slug(nameA)}-vs-${slug(nameB)}-recap.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}