/** A visit to a simulated neighbour: a small room drawn with the house's own builder, the two Friends, and what
 * they do together. How it goes depends on both characters (what each one loves or dislikes, and family). */
import { drawFriend, feetRow } from "./art.js";
import { buildPlaced } from "./furniture.js";
import { Builder, S, depthSort, fillPoly, project } from "./iso.js";
import type { Temperament } from "./personality.js";
import type { Accent } from "./traits.js";
import type { Facing } from "./wardrobe.js";

export type VisitAct = Readonly<{ id: string; label: string; like: string; neutral: string; hostNeutral: string; icon: string }>;
/** Things to do together; `like` is the everyday activity whose taste decides how each Friend feels about it. */
export const VISIT_ACTS: readonly VisitAct[] = [
  { id: "hug", label: "Hug", like: "pet", neutral: "Aww. Okay, a quick one.", hostNeutral: "Oh! Hello to you too.", icon: "heart" },
  { id: "hi", label: "Say hi", like: "talk", neutral: "Hi, neighbour!", hostNeutral: "Come in, come in.", icon: "chat" },
  { id: "dance", label: "Dance together", like: "dance", neutral: "One song. Maybe two.", hostNeutral: "Only if I lead.", icon: "note" },
  { id: "snack", label: "Share a snack", like: "snack", neutral: "Thanks, I'll try it.", hostNeutral: "Take the big one.", icon: "apple" },
];
export type Reaction = Readonly<{ guest: string; host: string; verdict: string; score: number }>;
const taste = (t: Temperament, id: string) => (t.loves.includes(id) ? 1 : t.dislikes.includes(id) ? -1 : 0);
const pickLine = (a: readonly string[], r: () => number) => a[Math.floor(r() * a.length) % a.length];

/** How the two Friends take it: each one's taste, plus a bonus when they share a family. */
export function react(guest: Temperament, host: Temperament, act: VisitAct, r: () => number = Math.random): Reaction {
  const g = taste(guest, act.like), h = taste(host, act.like), same = guest.family === host.family;
  const line = (t: Temperament, v: number, neutral: string) => (v > 0 ? pickLine(t.voice.love, r) : v < 0 ? pickLine(t.voice.nope, r) : neutral);
  const score = g + h + (same ? 1 : 0);
  const verdict = same && score >= 1 ? "Family reunion!" : score >= 2 ? "Instant besties" : score === 1 ? "Good vibes"
    : score === 0 ? "Polite and friendly" : score === -1 ? "A bit awkward" : "Never again. Probably.";
  return { guest: line(guest, g, act.neutral), host: line(host, h, act.hostNeutral), verdict, score };
}

const WALL = S("#EFE0C4", "#E2CFAE", "#D6BC94"), FLOOR_A = "#C8935E", FLOOR_B = "#BD8753";
export type VisitScene = Readonly<{
  guest: readonly (readonly string[])[]; host: readonly (readonly string[])[]; // idle frames (down facing)
  accent: Accent; heirloomDef: string | null; t: number; reduced: boolean;
  guestSays: string; hostSays: string; hop: number; // hop: seconds left of a happy bounce
}>;

/** Draw the neighbour's room into the canvas (its size in device pixels). */
export function drawVisit(ctx: CanvasRenderingContext2D, scene: VisitScene) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#2b1d14"; ctx.fillRect(0, 0, W, H);
  const b = new Builder(); b.reset();
  for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) b.tp(i, j, i + 1, j + 1, 0, (i + j) % 2 ? FLOOR_A : FLOOR_B);
  b.box(-.15, 0, .15, 4, 34, WALL); b.box(0, -.15, 5, .15, 34, WALL);
  b.tp(1.1, 1.5, 3.9, 3.5, .3, scene.accent.top);
  for (const [def, i, j] of [["armchair", .25, 1.3], ["floorlamp", .3, .35], ["plant-living", 4.2, .15]] as const) buildPlaced(b, { uid: def, def, i, j, swap: false });
  if (scene.heirloomDef) buildPlaced(b, { uid: "heirloom", def: scene.heirloomDef, i: 2.6, j: .3, swap: false });
  const parts = depthSort(b.parts);
  const xa = Math.min(...parts.map(p => p.x0)), xb = Math.max(...parts.map(p => p.x1)), ya = Math.min(...parts.map(p => p.y0)) - 18, yb = Math.max(...parts.map(p => p.y1));
  const s = Math.min(W / (xb - xa + 8), H / (yb - ya + 8));
  ctx.setTransform(s, 0, 0, s, W / 2 - (xa + xb) / 2 * s, H / 2 - (ya + yb) / 2 * s);
  for (const p of parts) { if (p.custom) { p.custom(ctx, p); continue; } for (const q of p.polys) fillPoly(ctx, q.pts, q.fill, q.stroke); }
  // the two Friends, facing each other on the rug
  const frame = (clip: readonly (readonly string[])[]) => clip[scene.reduced ? 0 : Math.floor(Math.max(0, scene.t) * 4) % clip.length]; // a first frame may come a hair before t0
  const friend = (clip: readonly (readonly string[])[], i: number, j: number, facing: Facing, bounce: number) => {
    const rows = frame(clip), [x, y] = project(i, j, 0), feet = feetRow(rows);
    ctx.save(); ctx.translate(x, y - bounce); ctx.scale(2, 2); drawFriend(ctx, rows, -8, -(feet + 1), undefined, facing, scene.t, false); ctx.restore();
    return project(i, j, 38 + bounce);
  };
  const hop = scene.hop > 0 && !scene.reduced ? Math.abs(Math.sin(scene.t * 9)) * 5 : 0;
  const g = friend(scene.guest, 2.1, 2.9, "down", hop), h = friend(scene.host, 3.3, 2.2, "down", hop);
  // speech in screen space
  const toScreen = ([x, y]: readonly [number, number]) => [x * s + W / 2 - (xa + xb) / 2 * s, y * s + H / 2 - (ya + yb) / 2 * s] as const;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const fs = Math.round(Math.max(11, W / 44));
  ctx.font = `bold ${fs}px "Courier New", monospace`; ctx.textBaseline = "middle";
  // the guest's words lean left, the host's lean right, so they never cover each other
  const bubble = (text: string, at: readonly [number, number], side: -1 | 1, above: number) => {
    if (!text) return;
    const [sx, sy] = toScreen(at), w = Math.min(ctx.measureText(text).width, W * .46) + 14, bh = fs + 10;
    const x = Math.max(4, Math.min(W - w - 4, side < 0 ? sx - w + 24 : sx - 24)), y = Math.max(4, sy - bh - above);
    ctx.fillStyle = "#fffaf0"; ctx.strokeStyle = "#2b1d14"; ctx.lineWidth = 2; ctx.fillRect(x, y, w, bh); ctx.strokeRect(x, y, w, bh);
    ctx.fillStyle = "#2b1d14"; ctx.fillText(text, x + 7, y + bh / 2, w - 14);
  };
  bubble(scene.hostSays, h, 1, fs + 16); bubble(scene.guestSays, g, -1, 2);
}
