# Nemesis — Your CP Rivalry, Narrated

Built for the **"Passion" weekend challenge**. Every competitive programmer
has one — the person whose rating you check before your own. Nemesis turns
that rivalry into a living head-to-head: real rating data, a composite
"Obsession Score" that rewards current grind over past glory, and Gemini-written
recaps that read like sports commentary instead of a boring stats table.

**Prize category: Best use of Google AI** — Gemini is the actual differentiator
here, not a bolt-on. See [AI Studio Handoff](#ai-studio-handoff) below.

---

## Architecture

```
nemesis/
├── backend/          MERN API — Express + MongoDB
│   ├── config/db.js          Mongo connection
│   ├── models/
│   │   ├── User.js           handle, cached platform stats, rating history
│   │   └── Rivalry.js        pairs two users, stores obsession scores + narrative log
│   ├── services/
│   │   ├── codeforces.js     CF public API — rating, history, submissions
│   │   ├── leetcode.js       LeetCode unofficial GraphQL — solved count, ranking
│   │   └── obsessionScore.js composite metric: velocity + streak + upsolve + rating
│   └── routes/
│       ├── user.js           create user, trigger platform sync
│       └── rivalry.js        create duel, fetch head-to-head, persist narrative
│
└── frontend/          React + Vite + TS + Tailwind
    ├── src/pages/
    │   ├── Landing.tsx       enter both handles, kick off first sync
    │   └── Dashboard.tsx     head-to-head view
    └── src/components/
        ├── RatingChart.tsx   dual-line amber vs ember overlay (recharts)
        └── DuelCard.tsx      renders the Gemini-generated recap
```

**Data flow:** frontend → Express API → Codeforces/LeetCode public APIs
(sync) → MongoDB (cache) → frontend reads cached stats + computes obsession
score on request. Gemini narrative generation is a separate service — see
below.

## Design tokens

Dual-accent rivalry palette on the usual graphite base:

| Token | Value | Use |
|---|---|---|
| `graphite-950` | `#0e0d0c` | background |
| `amber` | `#d97706` | "you" — every data point, chart line, and label for player A |
| `ember` | `#b34a3c` | "rival" — same role for player B |
| `parchment` | `#ece7dd` | primary text |

Display face: Instrument Serif (italic, for headlines and the narrative
recap). Body/data: Geist + Geist Mono. The signature idea: color is never
decorative here — amber and ember consistently mean "you" and "them" across
every chart, card, and label, so the eye tracks the rivalry without reading
labels.

---

## AI Studio Handoff

**Split of work for this submission:**
- **Claude** (this repo): architecture, MERN boilerplate, CF/LeetCode sync
  services, obsession score formula, frontend shell + design system.
- **AI Studio**: the actual Gemini narrative agent — this is the piece
  submitted under the Google AI prize category.

**The contract between them is one endpoint:**

```
POST /api/rivalries/:id/narrative
Body: { text: string, triggerContest?: string, leaderAtTime?: string }
```

Build the Gemini agent in AI Studio to:
1. Read a rivalry's current state (`GET /api/rivalries/:id` — gives both
   users' stats, rating history, and obsession scores)
2. Generate a short (2-4 sentence) commentary-style recap of the head-to-head
   — sports-broadcast tone, references specific numbers (rating gap, solve
   streaks, who's closing the gap)
3. `POST` the result back to `/api/rivalries/:id/narrative`

The frontend's `DuelCard` component just renders whatever `text` shows up in
the narrative log — it has no opinion on how that text was generated, so the
AI Studio side can iterate on prompts independently without touching this
repo.

**Suggested trigger:** call the AI Studio agent right after a `/sync` call
detects a new contest in either user's rating history (i.e., new entry in
`ratingHistory` since last sync) — that's the natural "something just
happened" moment for a recap.

---

## Obsession Score formula

Rating alone is a lagging indicator — it rewards past skill, not current
effort. The composite score weights recent behavior more heavily:

- **40%** solve velocity (solves in the last 7 days)
- **25%** current streak (consecutive active days)
- **20%** upsolve ratio (discipline signal — do you revisit what you missed)
- **15%** contest rating (long-term skill, intentionally small weight)

See `backend/services/obsessionScore.js` for the exact normalization caps.

---

## Setup

```bash
# Backend
cd backend
cp .env.example .env   # fill in MONGO_URI
npm install
npm run dev             # http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev              # http://localhost:5173, proxies /api to :5000
```

## Roadmap / stretch goals
- Bracket mode: more than 2 duelists, World-Cup-style knockout rounds
- Shareable duel card as an actual downloadable image (canvas export) for
  LinkedIn/X posting
- Weekly digest narrative (cron job) instead of only contest-triggered recaps
- LeetCode contest rating (currently only solved count + ranking, no rating
  history — LC's contest API is separately unofficial)
