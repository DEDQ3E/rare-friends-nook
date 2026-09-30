/** What a Friend's own pixels say about it.
 *
 * Every Generations Friend is a 16 × 16 silhouette (plus eight walk frames per facing), and no two are quite
 * alike. This reads that silhouette, never a hash, and turns it into a few plain measurements: how solid it is,
 * how big its eyes (the holes in its head) are, how symmetrical, how much its legs move, how tall and slim,
 * how many sparkles float around it, how high its ears or antennae reach, how big its head is. The character
 * in `traits.ts` is then built from the measurements that stand out, and each one is a reason the card can show.
 * All measurements are ratios of the Friend's own size, so they work for any Friend, not only the known ones. */
import { fitFrame } from "./fit.js";
import type { FriendSprites } from "./engine.js";

export type Features = Readonly<{
  mass: number;      // filled pixels of the main body (of 256)
  eyes: number;      // enclosed holes in the upper body: the eyes (pixels)
  symmetry: number;  // 0..1, overlap of the front view with its mirror image
  motion: number;    // 0..1, how much of the body changes between walk frames
  slim: number;      // body height / width
  spark: number;     // filled pixels not attached to the body (sparkles, hover lines)
  crest: number;     // pixels above the head (ears, horns, antennae)
  head: number;      // head width / widest body row
  stance: number;    // separate legs on the lowest body row
}>;

const W = 16;
const on = (rows: readonly string[], i: number, j: number) => j >= 0 && j < rows.length && i >= 0 && i < W && rows[j][i] === "#";
const count = (rows: readonly string[]) => rows.reduce((n, r) => n + [...r].filter(c => c === "#").length, 0);

/** Empty pixels fully enclosed by the main body in its upper half: the eyes (a hole that opens to the outside is a notch). */
function eyeHoles(mask: readonly (readonly boolean[])[], top: number, bottom: number): number {
  const seen = mask.map(r => r.map(() => false)), stack: [number, number][] = [];
  const free = (i: number, j: number) => i >= 0 && i < W && j >= 0 && j < mask.length && !mask[j][i] && !seen[j][i];
  for (let k = -1; k <= W; k++) for (const [i, j] of [[k, -1], [k, mask.length], [-1, k], [W, k]] as const) stack.push([i, j]);
  while (stack.length) {
    const [a, b] = stack.pop()!;
    for (const [i, j] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]] as const) if (free(i, j)) { seen[j][i] = true; stack.push([i, j]); }
  }
  const limit = top + Math.ceil((bottom - top + 1) * 0.55);
  let n = 0;
  for (let j = top; j < limit; j++) for (let i = 0; i < W; i++) if (!mask[j][i] && !seen[j][i]) n++;
  return n;
}

export function pixelFeatures(sprites: FriendSprites): Features {
  const front = sprites.idle.down[0];
  const fit = fitFrame(front), { mask } = fit;
  const body = mask.reduce((n, r) => n + r.filter(Boolean).length, 0);
  const width = fit.right - fit.left + 1, height = fit.bottom - fit.top + 1;
  // mirror image about the body's own centre line
  let both = 0, either = 0;
  for (let j = 0; j < mask.length; j++) for (let i = 0; i < W; i++) {
    const a = mask[j][i], b = mask[j][fit.left + fit.right - i] ?? false;
    if (a && b) both++; if (a || b) either++;
  }
  // how much the silhouette changes from one walk frame to the next (front view), as a share of the body
  const walk = sprites.walk.down; let diff = 0;
  for (let f = 0; f < walk.length; f++) {
    const a = walk[f], b = walk[(f + 1) % walk.length];
    for (let j = 0; j < a.length; j++) for (let i = 0; i < W; i++) if (on(a, i, j) !== on(b, i, j)) diff++;
  }
  let crest = 0;
  for (let j = 0; j < fit.headRow; j++) crest += fit.spans[j]?.n ?? 0;
  let widest = 1; for (const s of fit.spans) if (s) widest = Math.max(widest, s.r - s.l + 1);
  let stance = 0; for (let i = fit.left; i <= fit.right; i++) if (mask[fit.bottom]?.[i] && !mask[fit.bottom]?.[i - 1]) stance++;
  return {
    mass: body,
    eyes: eyeHoles(mask, fit.top, fit.bottom),
    symmetry: either ? both / either : 1,
    motion: body ? diff / walk.length / body : 0,
    slim: height / Math.max(1, width),
    spark: count(front) - body,
    crest,
    head: (fit.headR - fit.headL + 1) / widest,
    stance,
  };
}

/* ---------- from measurements to character ---------- */

/** One end of a measurement. Past `at` the pole applies; `span` more and it is at full strength. The cut-offs are
 * constants: they were set once by measuring the ten Friends the game is tested on (tests/pixel-traits.mjs), not
 * by reading anything at play time, so a Friend beyond the tested range simply lands at full strength. */
type Pole = Readonly<{ axis: keyof Features; dir: 1 | -1; at: number; span: number; cap?: number; quirk: string; cause: string; because: string }>;
export const POLES: readonly Pole[] = [
  { axis: "mass", dir: 1, at: 88, span: 20, quirk: "appetite", cause: "Solid build", because: "it has a big appetite" },
  { axis: "mass", dir: -1, at: 62, span: 14, quirk: "lighteater", cause: "Slight build", because: "it nibbles instead of feasting" },
  { axis: "eyes", dir: 1, at: 6, span: 3, quirk: "skywatcher", cause: "Big eyes", because: "it loves the stars" },
  { axis: "eyes", dir: -1, at: 2, span: 2, quirk: "bookworm", cause: "Tiny eyes", because: "it reads up close" },
  { axis: "symmetry", dir: -1, at: 0.65, span: 0.3, quirk: "chatterbox", cause: "Lopsided outline", because: "it has so much to say" },
  { axis: "symmetry", dir: 1, at: 0.98, span: 0.02, cap: 0.45, quirk: "neat", cause: "Perfectly symmetrical", because: "it likes everything in order" },
  { axis: "motion", dir: 1, at: 0.2, span: 0.08, quirk: "speedy", cause: "Legs that never stop", because: "it is always in a hurry" },
  { axis: "motion", dir: -1, at: 0.11, span: 0.05, quirk: "sleepyhead", cause: "Barely lifts its feet", because: "it tires fast" },
  { axis: "slim", dir: 1, at: 1.6, span: 0.7, quirk: "earlybird", cause: "Tall and slim", because: "it sees the sunrise first" },
  { axis: "slim", dir: -1, at: 1, span: 0.3, quirk: "cuddly", cause: "Low and round", because: "it loves to be held" },
  { axis: "spark", dir: 1, at: 5, span: 8, quirk: "collector", cause: "Sparkles around it", because: "it treasures shiny gifts" },
  { axis: "crest", dir: 1, at: 6, span: 6, quirk: "hummer", cause: "Long ears or antennae", because: "it picks up tunes to hum" },
  { axis: "head", dir: 1, at: 0.9, span: 0.15, quirk: "quiet", cause: "Big head", because: "it thinks more than it says" },
  { axis: "head", dir: -1, at: 0.35, span: 0.15, quirk: "nightsnacker", cause: "Small head", because: "it saves room for midnight snacks" },
  { axis: "stance", dir: 1, at: 4, span: 2, cap: 0.75, quirk: "steady", cause: "Four sturdy legs", because: "it is sure-footed" },
];
export const FALLBACK = { quirk: "easygoing", cause: "Nothing about its build stands out", because: "it takes life as it comes" } as const;

export type Habit = Readonly<{
  quirk: string;      // quirk id (see traits.ts)
  strength: number;   // 0.4 .. 1: how far past the cut-off the measurement is
  degree: "mild" | "clear" | "strong";
  reason: string;     // "Big eyes, so it loves the stars"
}>;

/** The (up to) two measurements that stand out most, on different axes and with different quirks: the main
 * trait and a second habit. A Friend where nothing stands out gets the easygoing fallback. */
export function habitsFrom(f: Features): readonly Habit[] {
  const hits = POLES.map((p, order) => {
    const dev = p.dir * (f[p.axis] - p.at);
    return dev < 0 ? null : { p, order, s: (p.cap ?? 1) * (0.4 + 0.6 * Math.min(1, dev / p.span)) };
  }).filter(<T,>(h: T | null): h is T => h !== null).sort((a, b) => b.s - a.s || a.order - b.order);
  const habit = (p: { quirk: string; cause: string; because: string }, s: number): Habit =>
    ({ quirk: p.quirk, strength: +s.toFixed(2), degree: s < 0.55 ? "mild" : s < 0.8 ? "clear" : "strong", reason: `${p.cause}, so ${p.because}` });
  if (!hits.length) return [habit(FALLBACK, 0.5)];
  const first = hits[0], second = hits.find(h => h.p.axis !== first.p.axis && h.p.quirk !== first.p.quirk);
  return [habit(first.p, first.s), ...(second ? [habit(second.p, second.s)] : [])];
}
