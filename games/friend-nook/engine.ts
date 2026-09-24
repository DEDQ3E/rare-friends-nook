/** Friend Nook engine: camera, rendering, walking (A* on half-tile cells), picking, and the life simulation
 * loop (needs, actions, free will, wishes, voice). React only shows panels and the HUD around it. */
import { Builder, depthSort, fillPoly, lit, withMoving, makePart, pointInPoly, project, unproject, type Part } from "./iso.js";
import { CELL, COLS, GH, GW, ROWS, buildStructure, drawShell, edgeOpen, roomAt, type Room, type Sky } from "./house.js";
import { DEF, buildPlaced, footprint, placePoint, starterHouse, setBallLift, setHutchItems, type Placed } from "./furniture.js";
import { ACTION, ACTIONS, DAY_MINUTES, GAME_MINUTES_PER_SECOND, NEEDS, actionsOn, clamp, darkness, decayNeeds, desire, isNight, mood, type ActionDef, type NeedKey, type Needs, type Stock } from "./sim.js";
import { BALANCED, preference, refuseChance, type Temperament } from "./personality.js";
import { ICONS, drawFriend, drawIconBubble, feetRow, topRow, type Pixmap } from "./art.js";
import type { Facing, Outfit } from "./wardrobe.js";
import { FX } from "./fx.js";
import { drawPixmap } from "./art.js";
import { HEIRLOOM, HEIRLOOMS, HEIRLOOM_AT } from "./heirlooms.js";

/** Particles per action: where they come from (default coordinates of the used piece, or the Friend) and what. */
type Emit = Readonly<{ at?: readonly [number, number, number]; kind: "bubble" | "steam" | "icon" | "dot" | "drip" | "hop"; icon?: string; colors?: readonly string[]; every: number }>;
const EMIT: Readonly<Record<string, Emit>> = {
  bath: { kind: "bubble", every: .18 },
  cook: { at: [9.57, .66, 17], kind: "steam", every: .22 },
  dance: { at: [5.57, 5.37, 11], kind: "icon", icon: "note", every: .55 },
  piano: { at: [.5, .25, 12], kind: "icon", icon: "note", every: .45 },
  wash: { at: [7.37, .3, 13], kind: "drip", colors: ["#6EC6FF", "#BFE4FF"], every: .08 },
  toys: { at: [2.82, 1.5, 8], kind: "hop", colors: ["#E07A5F", "#F2C94C", "#4F7CAC", "#7FB069"], every: .35 },
  arcade: { at: [.4, .72, 26], kind: "dot", colors: ["#FF5AD1", "#7FCF4F", "#FFD23F", "#6FC3DF"], every: .2 },
  games: { at: [.54, 7.1, 16], kind: "dot", colors: ["#FFD23F", "#FFFFFF", "#E07A5F"], every: .3 },
  paint: { at: [.3, .16, 15], kind: "dot", colors: ["#E07A5F", "#8FC0E0", "#F2C94C", "#7FB069", "#8E7CC3"], every: .25 },
  fish: { at: [.6, .25, 22], kind: "bubble", every: .4 },
  primp: { kind: "icon", icon: "sparkle", every: .6 }, admire: { kind: "icon", icon: "sparkle", every: .6 },
  stargaze: { kind: "dot", colors: ["#FFF3B0", "#FFFFFF"], every: .3 }, telescope: { kind: "dot", colors: ["#FFF3B0", "#FFFFFF"], every: .25 },
  pet: { kind: "icon", icon: "heart", every: .5 }, keepsakes: { at: [8.4, 9.45, 24], kind: "icon", icon: "sparkle", every: .6 },
  daydream: { kind: "icon", icon: "cloud", every: 1.4 }, snack: { kind: "icon", icon: "apple", every: 1.2 },
  dinner: { kind: "steam", every: .35 },
  ...Object.fromEntries(HEIRLOOMS.filter(h => h.emit).map(h => [h.action.id, h.emit!])),
};
/** Things held while doing an action (drawn beside the Friend, never over its artwork's outline). */
const PROPS: Readonly<Record<string, string>> = { read: "book", book: "book", bar: "apple", snack: "apple", games: "pad", paint: "brush" };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; kind: Emit["kind"]; icon?: Pixmap; color?: string; r: number };
const ARROW: Pixmap = { palette: { k: "#3A2A1E", y: "#FFD23F", w: "#FFF3B0" }, rows: ["..kkkkk..", "..kwyyk..", "..kyyyk..", "..kyyyk..", "kkkyyykkk", ".kyyyyyk.", "..kyyyk..", "...kyk...", "....k...."] };

export type FriendSprites = Readonly<{ walk: Readonly<Record<Facing, readonly (readonly string[])[]>>; idle: Readonly<Record<Facing, readonly (readonly string[])[]>> }>;
export type EngineEvent =
  | { type: "speech"; text: string }
  | { type: "panel"; panel: "wardrobe" | "keepsakes" | "gift" }
  | { type: "refuse"; action: string }
  | { type: "noStock"; kind: "snack" | "meal" }
  | { type: "wish"; action: string }
  | { type: "wishDone"; action: string; points: number }
  | { type: "start"; action: string; auto: boolean; loved: boolean; disliked: boolean }
  | { type: "done"; action: string; loved: boolean }
  | { type: "blocked" }
  | { type: "placed"; uid: string; def: string }
  | { type: "step"; surface: "wood" | "carpet" | "tile" }
  | { type: "hum" };
export type Pick =
  | { kind: "friend"; x: number; y: number }
  | { kind: "object"; uid: string; def: string; x: number; y: number }
  | { kind: "floor"; i: number; j: number; x: number; y: number }
  | { kind: "none"; x: number; y: number };
export type View = Readonly<{
  needs: Readonly<Needs>; minute: number; mood: number; action: string | null; walking: boolean;
  wish: string | null; friendship: number; stock: Readonly<Stock>; room: Room; speed: number; active: string | null;
}>;

const VIEW_W = 480, VIEW_H = 320;           // logical viewport (the 960 × 640 frame at 2×)
const HOME: readonly [number, number] = [240 - 222, 160 - 72]; // world point shown at the view centre at zoom 1
const SPRITE = 2;                           // world pixels per Friend sprite pixel
const WALK_SPEED = 1.7;                     // tiles per real second
const GRASS = "#8FBF6A";

type Doing = { action: ActionDef; target: string | null; phase: "walk" | "do"; left: number; spot: [number, number] | null; seat: Placed | null; loved: boolean; auto: boolean };

export function createEngine(canvas: HTMLCanvasElement, onEvent: (e: EngineEvent) => void) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  const g: CanvasRenderingContext2D = ctx;

  /* ---------- state ---------- */
  let placed: Placed[] = starterHouse();
  let parts: Part[] = [];
  const blocked = new Uint8Array(GW * GH);
  let sprites: FriendSprites | null = null, outfit: Outfit = {};
  let temper: Temperament = BALANCED, strength = .5, quirk: string | null = null, humIn = 1;
  let paused = false, speed = 1, reduced = false, zoom = 1, zoomTo = 1, heirloomFor: string | null = null;
  let minute = 8 * 60;                      // Day 1, 08:00
  const needs: Needs = { hunger: 72, energy: 80, fun: 60, hygiene: 85, social: 55 };
  const stock: Stock = { snacks: 3, meals: 2 };
  let friendship = 0, keepsakeCount = 0;
  const fr = { i: 5.75, j: 7.75, z: 0, facing: "down" as Facing, path: [] as [number, number][], moving: false, clock: 0, lie: false, bath: false };
  let doing: Doing | null = null;
  let idleFor = 0, voiceIn = 25, wish: { action: string; until: number } | null = null, wishIn = 90, lastLow: Partial<Record<NeedKey, number>> = {};
  let bubble: { icon: Pixmap; until: number; thought?: boolean } | null = null;
  let speech: { text: string; until: number } | null = null;
  let move = { x: 0, y: 0 };
  let hover: string | null = null;
  let t = 0, raf = 0, last = performance.now(), destroyed = false;
  let drawOrder: Part[] = [];
  let cam = { x: HOME[0], y: HOME[1] };
  let placing: { def: string; i: number; j: number; swap: boolean; valid: boolean; uid: string | null; original: Placed | null } | null = null;
  let ghostParts: Part[] = [];
  let bought = 0;
  let particles: Particle[] = [], emitIn = 0, hintUid: string | null = null, stepIn = 0;
  const tops = new Map<string, { x: number; y: number }>();

  /* ---------- furniture → parts and blocked cells ---------- */
  function rebuild() {
    const b = new Builder();
    buildStructure(b);
    for (const p of placed) buildPlaced(b, p);
    parts = depthSort(b.parts);
    tops.clear();
    const span = new Map<string, { x0: number; x1: number; y: number }>();
    for (const p of parts) { if (!p.owner) continue; const q = span.get(p.owner); if (!q) span.set(p.owner, { x0: p.x0, x1: p.x1, y: p.y0 }); else { q.x0 = Math.min(q.x0, p.x0); q.x1 = Math.max(q.x1, p.x1); q.y = Math.min(q.y, p.y0); } }
    for (const [uid, q] of span) tops.set(uid, { x: (q.x0 + q.x1) / 2, y: q.y });
    blocked.fill(0);
    for (const p of placed) {
      if (p.def === "ball") continue;
      const [i0, j0, i1, j1] = footprint(p);
      for (let a = 0; a < GW; a++) for (let c = 0; c < GH; c++) {
        const ci = (a + .5) * CELL, cj = (c + .5) * CELL;
        if (ci > i0 && ci < i1 && cj > j0 && cj < j1) blocked[c * GW + a] = 1;
      }
    }
  }
  rebuild();

  /* ---------- pathfinding ---------- */
  const cellOf = (i: number, j: number) => [clamp(Math.floor(i / CELL), 0, GW - 1), clamp(Math.floor(j / CELL), 0, GH - 1)] as const;
  const free = (a: number, c: number) => a >= 0 && c >= 0 && a < GW && c < GH && !blocked[c * GW + a];
  const center = (a: number, c: number): [number, number] => [(a + .5) * CELL, (c + .5) * CELL];
  function step(a: number, c: number, da: number, dc: number) {
    const na = a + da, nc = c + dc;
    if (!free(na, nc)) return false;
    if (da && dc) return free(a + da, c) && free(a, c + dc) && edgeOpen(a, c, na, c) && edgeOpen(na, c, na, nc) && edgeOpen(a, c, a, nc) && edgeOpen(a, nc, na, nc);
    return edgeOpen(a, c, na, nc);
  }
  /** Distances from the Friend's cell to every reachable cell (8 directions, no corner cutting). */
  function reach(): { dist: Float32Array; prev: Int32Array } {
    const dist = new Float32Array(GW * GH).fill(Infinity), prev = new Int32Array(GW * GH).fill(-1);
    const [sa, sc] = cellOf(fr.i, fr.j), open: number[] = [sc * GW + sa]; dist[sc * GW + sa] = 0;
    while (open.length) {
      let best = 0; for (let k = 1; k < open.length; k++) if (dist[open[k]] < dist[open[best]]) best = k;
      const cur = open.splice(best, 1)[0], a = cur % GW, c = (cur - a) / GW;
      for (let da = -1; da <= 1; da++) for (let dc = -1; dc <= 1; dc++) {
        if (!da && !dc) continue;
        if (!step(a, c, da, dc)) continue;
        const n = (c + dc) * GW + a + da, d = dist[cur] + (da && dc ? 1.414 : 1);
        if (d < dist[n]) { if (dist[n] === Infinity) open.push(n); dist[n] = d; prev[n] = cur; }
      }
    }
    return { dist, prev };
  }
  /** Path to the reachable free cell nearest to (i, j). */
  function pathTo(i: number, j: number, maxOff = 1.2): [number, number][] | null {
    const { dist, prev } = reach();
    let best = -1, bestD = Infinity;
    for (let n = 0; n < GW * GH; n++) {
      if (dist[n] === Infinity) continue;
      const [ci, cj] = center(n % GW, Math.floor(n / GW)), off = Math.hypot(ci - i, cj - j);
      if (off > maxOff) continue;
      const score = off * 4 + dist[n] * .02;
      if (score < bestD) { bestD = score; best = n; }
    }
    if (best < 0) return null;
    const out: [number, number][] = [];
    for (let n = best; n >= 0 && prev[n] >= 0; n = prev[n]) out.push(center(n % GW, Math.floor(n / GW)));
    return out.reverse();
  }

  /* ---------- character ---------- */
  const say = (text: string, seconds = 3.6) => { speech = { text, until: t + seconds }; onEvent({ type: "speech", text }); };
  const pickLine = (lines: readonly string[]) => lines[Math.floor(Math.random() * lines.length)];
  const show = (icon: keyof typeof ICONS, seconds = 2.2, thought = false) => { bubble = { icon: ICONS[icon], until: t + seconds, thought }; };

  function faceToward(di: number, dj: number): Facing {
    const dx = di - dj, dy = di + dj;
    if (Math.abs(dx) >= Math.abs(dy) * .9) return dx >= 0 ? "right" : "left";
    return dy >= 0 ? "down" : "up";
  }
  const placedById = (uid: string) => placed.find(p => p.uid === uid) ?? null;
  const nearestOf = (defs: readonly string[]) => {
    let best: Placed | null = null, bd = Infinity;
    for (const p of placed) if (defs.includes(p.def)) { const [a, b, c, d] = footprint(p), dd = Math.hypot((a + c) / 2 - fr.i, (b + d) / 2 - fr.j); if (dd < bd) { bd = dd; best = p; } }
    return best;
  };
  function spotFor(p: Placed): [number, number] | null {
    const d = DEF[p.def]; if (!d.spots.length) { const [a, b, c, e] = footprint(p); return [(a + c) / 2, e + .4]; }
    let best: [number, number] | null = null, bd = Infinity;
    for (const s of d.spots) { const q = placePoint(p, s[0], s[1]), dd = Math.hypot(q[0] - fr.i, q[1] - fr.j); if (dd < bd) { bd = dd; best = q; } }
    return best;
  }

  function standUp() {
    if (!doing) return;
    fr.z = 0; fr.lie = false; fr.bath = false;
    if (doing.phase === "do" && doing.spot) { fr.i = doing.spot[0]; fr.j = doing.spot[1]; }
  }
  function stop() { standUp(); doing = null; fr.path = []; fr.moving = false; setBallLift(0); }

  /** Start an action (from a menu click or free will). */
  function command(id: string, targetUid: string | null, fromPlayer = true): boolean {
    const a = ACTION[id]; if (!a) return false;
    if (fromPlayer && Math.random() < refuseChance(temper, strength, id)) {
      say(pickLine(temper.voice.nope)); show("angry", 2); onEvent({ type: "refuse", action: id }); idleFor = 0; return false;
    }
    if (a.uses === "snack" && stock.snacks <= 0) { if (fromPlayer) { say(temper.voice.hungry); onEvent({ type: "noStock", kind: "snack" }); } return false; }
    if (a.uses === "meal" && stock.meals <= 0) { if (fromPlayer) { say(temper.voice.hungry); onEvent({ type: "noStock", kind: "meal" }); } return false; }
    stop();
    const loved = temper.loves.includes(id);
    if (a.on.includes("friend")) { doing = { action: a, target: null, phase: "do", left: a.minutes, spot: null, seat: null, loved, auto: !fromPlayer }; begin(); return true; }
    // the object the Friend walks to: the seat for TV/dinner/bar actions, otherwise the clicked piece
    let target = targetUid ? placedById(targetUid) : null;
    if (a.seat === "sofa") target = nearestOf(["sofa"]);
    else if (a.seat === "chair") target = nearestOf(["chair-n", "chair-s"]);
    else if (a.seat === "stool") target = nearestOf(["stool"]);
    else if (!target || !a.on.includes(target.def)) target = nearestOf(a.on);
    if (!target) return false;
    const spot = spotFor(target); if (!spot) return false;
    const path = pathTo(spot[0], spot[1]);
    if (!path) { if (fromPlayer) { say("I can't get there."); onEvent({ type: "blocked" }); } return false; }
    fr.path = path;
    const stand = path.length ? path[path.length - 1] : [fr.i, fr.j] as [number, number];
    doing = { action: a, target: target.uid, phase: "walk", left: a.minutes, spot: [stand[0], stand[1]], seat: DEF[target.def].pose ? target : null, loved, auto: !fromPlayer };
    idleFor = 0;
    if (!path.length) begin(); // already standing at the spot
    return true;
  }

  function begin() {
    if (!doing) return;
    const a = doing.action; doing.phase = "do"; fr.path = []; fr.moving = false;
    if (a.uses === "snack") stock.snacks--; if (a.uses === "meal") stock.meals--;
    const p = doing.target ? placedById(doing.target) : null;
    if (p) { const [x0, y0, x1, y1] = footprint(p); fr.facing = faceToward((x0 + x1) / 2 - fr.i, (y0 + y1) / 2 - fr.j); }
    if (a.pose !== "stand" && doing.seat) {
      const pose = DEF[doing.seat.def].pose!, [pi, pj] = placePoint(doing.seat, pose.i, pose.j), f = doing.seat.swap ? [pose.face[1], pose.face[0]] : pose.face;
      fr.i = pi; fr.j = pj; fr.z = pose.z; fr.lie = a.pose === "lie" && !!pose.lie; fr.bath = a.pose === "bath"; fr.facing = faceToward(f[0], f[1]);
    }
    if (a.panel) onEvent({ type: "panel", panel: a.panel });
    if (doing.loved) { show("heart", 1.8); if (Math.random() < .5) say(pickLine(temper.voice.love)); }
    else if (temper.dislikes.includes(a.id)) show("sweat", 1.8);
    else show(a.icon as keyof typeof ICONS, 1.6);
    if (a.id === "talk") say(pickLine(temper.voice.idle));
    onEvent({ type: "start", action: a.id, auto: doing.auto, loved: doing.loved, disliked: temper.dislikes.includes(a.id) });
  }
  function finish() {
    if (!doing) return;
    const a = doing.action, loved = doing.loved;
    for (const [k, v] of Object.entries(a.done ?? {}) as [NeedKey, number][]) needs[k] = clamp(needs[k] + v);
    if (a.id === "keepsakes") needs.fun = clamp(needs.fun + Math.min(20, 2 * keepsakeCount));
    friendship += loved ? 3 : 1;
    if (wish && wish.action === a.id) { const pts = 12 + Math.round(8 * strength); friendship += pts; wish = null; wishIn = 100 + Math.random() * 80; show("sparkle", 2.4); onEvent({ type: "wishDone", action: a.id, points: pts }); }
    stop(); idleFor = 0;
    onEvent({ type: "done", action: a.id, loved });
  }

  /* ---------- free will ---------- */
  function chooseSomething() {
    const options: { a: ActionDef; uid: string | null; v: number }[] = [];
    const seen = new Set<string>();
    for (const p of placed) for (const a of actionsOn(p.def, minute)) {
      const key = a.id + (a.seat ? "" : p.uid); if (seen.has(key)) continue; seen.add(key);
      let v = desire(a, needs, temper, strength, minute, stock);
      if (quirk === "nightsnacker" && isNight(minute) && (a.id === "snack" || a.id === "bar")) v *= 2.5;
      if (v > 0) options.push({ a, uid: p.uid, v });
    }
    if (!options.length) return;
    options.sort((x, y) => y.v - x.v);
    const top = options.slice(0, 3), total = top.reduce((s, o) => s + o.v, 0);
    let r = Math.random() * total;
    for (const o of top) { r -= o.v; if (r <= 0) { command(o.a.id, o.uid, false); return; } }
  }
  function wanderSomewhere() {
    for (let n = 0; n < 12; n++) {
      const i = .6 + Math.random() * (COLS - 1.2), j = .6 + Math.random() * (ROWS - 1.2), path = pathTo(i, j, .6);
      if (path && path.length > 1 && path.length < 14) { fr.path = path; return; }
    }
  }

  /* ---------- Buy mode ---------- */
  /** Cells whose centres lie inside a footprint. */
  function cellsOf(f: readonly [number, number, number, number]) {
    const out: [number, number][] = [];
    for (let a = 0; a < GW; a++) for (let c = 0; c < GH; c++) { const ci = (a + .5) * CELL, cj = (c + .5) * CELL; if (ci > f[0] && ci < f[2] && cj > f[1] && cj < f[3]) out.push([a, c]); }
    if (!out.length) out.push([...cellOf((f[0] + f[2]) / 2, (f[1] + f[3]) / 2)] as [number, number]);
    return out;
  }
  function validPlacement(p: Placed): boolean {
    const f = footprint(p);
    if (f[0] < .05 || f[1] < .05 || f[2] > COLS - .05 || f[3] > ROWS - .05) return false;
    const cells = cellsOf(f), set = new Set(cells.map(([a, c]) => c * GW + a)), [fa, fc] = cellOf(fr.i, fr.j);
    for (const [a, c] of cells) {
      if (blocked[c * GW + a] || (a === fa && c === fc)) return false;
      if (set.has(c * GW + a + 1) && !edgeOpen(a, c, a + 1, c)) return false;
      if (set.has((c + 1) * GW + a) && !edgeOpen(a, c, a, c + 1)) return false;
    }
    // every piece must stay usable: its stand spot must still be reachable
    for (const [a, c] of cells) blocked[c * GW + a] = 1;
    const { dist } = reach(), ok = [...placed, p].every(q => {
      const d = DEF[q.def]; if (!d.spots.length) return true;
      return d.spots.some(s => { const [si, sj] = placePoint(q, s[0], s[1]); for (let n = 0; n < GW * GH; n++) if (dist[n] < Infinity && Math.hypot((n % GW + .5) * CELL - si, (Math.floor(n / GW) + .5) * CELL - sj) <= 1.2) return true; return false; });
    });
    for (const [a, c] of cells) blocked[c * GW + a] = 0;
    return ok;
  }
  function updateGhost() {
    if (!placing) { ghostParts = []; return; }
    const tmp: Placed = { uid: "ghost", def: placing.def, i: placing.i, j: placing.j, swap: placing.swap };
    placing.valid = validPlacement(tmp);
    const b = new Builder(); buildPlaced(b, tmp); ghostParts = depthSort(b.parts);
  }
  function placeAt(cssX: number, cssY: number) {
    if (!placing) return;
    const w = worldAt(cssX, cssY), { i, j } = unproject(w.x, w.y), d = DEF[placing.def];
    const sw = placing.swap, wi = sw ? d.foot[3] - d.foot[1] : d.foot[2] - d.foot[0], wj = sw ? d.foot[2] - d.foot[0] : d.foot[3] - d.foot[1];
    const ni = Math.round((i - wi / 2) * 4) / 4, nj = Math.round((j - wj / 2) * 4) / 4;
    if (ni !== placing.i || nj !== placing.j) { placing.i = ni; placing.j = nj; updateGhost(); }
  }

  /* ---------- update ---------- */
  function update(dt: number) {
    const gm = dt * GAME_MINUTES_PER_SECOND * speed; // in-game minutes this frame
    minute += gm;
    const asleep = !!doing && doing.phase === "do" && !!doing.action.sleep;
    decayNeeds(needs, gm / 60, temper, asleep, minute);
    // walking
    const pace = WALK_SPEED * temper.speed * Math.min(2, speed) * dt;
    if (move.x || move.y) {
      if (doing) stop();
      const di = move.x + move.y, dj = move.y - move.x, len = Math.hypot(di, dj) || 1;
      const ni = fr.i + di / len * pace, nj = fr.j + dj / len * pace;
      const [a, c] = cellOf(fr.i, fr.j), tryMove = (ti: number, tj: number) => { const [na, nc] = cellOf(ti, tj); return (na === a && nc === c) || (Math.abs(na - a) + Math.abs(nc - c) === 1 ? free(na, nc) && edgeOpen(a, c, na, nc) : step(a, c, na - a, nc - c)); };
      if (tryMove(ni, nj)) { fr.i = ni; fr.j = nj; } else if (tryMove(ni, fr.j)) fr.i = ni; else if (tryMove(fr.i, nj)) fr.j = nj;
      fr.facing = faceToward(di, dj); fr.moving = true; idleFor = 0;
    } else if (fr.path.length) {
      const [ti, tj] = fr.path[0], di = ti - fr.i, dj = tj - fr.j, d = Math.hypot(di, dj);
      if (d <= pace) { fr.i = ti; fr.j = tj; fr.path.shift(); } else { fr.i += di / d * pace; fr.j += dj / d * pace; fr.facing = faceToward(di, dj); }
      fr.moving = true;
      if (!fr.path.length) { fr.moving = false; if (doing?.phase === "walk") begin(); }
    } else fr.moving = false;
    // doing
    if (doing?.phase === "do") {
      const a = doing.action;
      for (const [k, v] of Object.entries(a.rates ?? {}) as [NeedKey, number][]) needs[k] = clamp(needs[k] + v * gm / 60);
      if (a.withYou) needs.social = clamp(needs.social + 4 * gm / 60);
      doing.left -= gm;
      if (a.id === "ball") setBallLift(Math.abs(Math.sin(t * 5)) * 10);
      if (a.sleep && (!bubble || t > bubble.until) && Math.floor(t) % 4 === 0) show("zzz", 2);
      const h = (minute % DAY_MINUTES) / 60, dawn = quirk === "earlybird" && a.id === "sleep" && h >= 5.5 && h < 9 && needs.energy > 55;
      const full = dawn || (a.sleep && needs.energy >= 99 && !(a.id === "sleep" && isNight(minute)));
      if (doing.left <= 0 || full) finish();
    }
    if (temper.family === "Mask" && !doing && !fr.moving && !reduced && Math.random() < dt * (.25 + .35 * strength)) fr.facing = fr.facing === "left" ? "right" : fr.facing === "right" ? "down" : "left";
    // the Hummer hums while it walks
    if (quirk === "hummer" && fr.moving && !reduced) { humIn -= dt; if (humIn <= 0) { humIn = 1.1 + Math.random(); const [hx, hy] = headPoint(); particles.push({ x: hx + 8, y: hy - 4, vx: 4, vy: -10, life: 1.4, max: 1.4, kind: "icon", icon: ICONS.note, r: 0 }); onEvent({ type: "hum" }); } }
    // footsteps
    if (fr.moving) { stepIn -= dt * Math.min(2, speed); if (stepIn <= 0) { stepIn = .3 / temper.speed; const r = roomAt(fr.i, fr.j); onEvent({ type: "step", surface: r === "bedroom" ? "carpet" : r === "bathroom" || r === "kitchen" ? "tile" : "wood" }); } }
    // particles from what the Friend is doing
    for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === "hop" || p.kind === "drip") p.vy += 90 * dt; if (p.kind === "steam") p.r += 3 * dt; }
    particles = particles.filter(p => p.life > 0);
    const em = doing?.phase === "do" ? EMIT[doing.action.id] : undefined;
    if (em && !reduced) {
      emitIn -= dt;
      if (emitIn <= 0) {
        emitIn = em.every;
        const target = doing?.target ? placedById(doing.target) : null;
        let x: number, y: number;
        if (em.at && target) { const [pi, pj] = placePoint(target, em.at[0], em.at[1]); [x, y] = project(pi, pj, em.at[2]); }
        else { const [hx, hy] = headPoint(); x = hx; y = em.kind === "bubble" ? project(fr.i, fr.j, 7.6)[1] : em.kind === "steam" ? project(fr.i, fr.j, fr.z + 12)[1] : hy; }
        const rnd = (a: number) => (Math.random() - .5) * a, color = em.colors ? em.colors[Math.floor(Math.random() * em.colors.length)] : undefined;
        if (em.kind === "bubble") particles.push({ x: x + rnd(26), y, vx: rnd(4), vy: -10 - Math.random() * 8, life: 1.2, max: 1.2, kind: "bubble", r: 1 + Math.random() * 1.4 });
        else if (em.kind === "steam") particles.push({ x: x + rnd(6), y: y - 2, vx: rnd(4), vy: -9, life: 1.8, max: 1.8, kind: "steam", r: 1.5 });
        else if (em.kind === "icon") particles.push({ x: x + rnd(18), y: y - 6, vx: rnd(8), vy: -12, life: 1.6, max: 1.6, kind: "icon", icon: ICONS[em.icon ?? "note"], r: 0 });
        else if (em.kind === "drip") particles.push({ x: x + rnd(2), y, vx: 0, vy: 4, life: .35, max: .35, kind: "drip", color, r: .8 });
        else if (em.kind === "hop") particles.push({ x: x + rnd(10), y, vx: rnd(30), vy: -48 - Math.random() * 20, life: 1, max: 1, kind: "hop", color, r: 1.6 });
        else particles.push({ x: x + rnd(22), y: y + rnd(10), vx: rnd(10), vy: -6 - Math.random() * 6, life: .9, max: .9, kind: "dot", color, r: 1 });
      }
    }
    // free will
    if (!doing && !fr.path.length && !(move.x || move.y)) {
      idleFor += dt * Math.min(3, speed);
      if (idleFor > 6) { idleFor = 0; if (Math.random() < .8) chooseSomething(); else wanderSomewhere(); }
    }
    // wishes
    wishIn -= gm;
    if (!wish && wishIn <= 0) {
      const h = (minute % DAY_MINUTES) / 60, bedtime = h >= 20 || h < 2;
      const pool = ACTIONS.filter(a => temper.loves.includes(a.id) && !a.panel && a.id !== doing?.action.id && (a.id !== "sleep" || bedtime) && placed.some(p => a.on.includes(p.def)) && (!a.when || (a.when === "night") === isNight(minute)));
      const choice = pool.length ? pool[Math.floor(Math.random() * pool.length)] : ACTION.ball;
      wish = { action: choice.id, until: minute + 6 * 60 }; onEvent({ type: "wish", action: choice.id }); show(choice.icon as keyof typeof ICONS, 3.5, true);
    }
    if (wish && minute > wish.until) { wish = null; wishIn = 60; }
    // voice
    voiceIn -= dt;
    if (voiceIn <= 0) {
      voiceIn = (35 + Math.random() * 40) * (quirk === "chatterbox" ? .5 : quirk === "quiet" ? 2 : 1);
      const low = NEEDS.filter(k => needs[k] < 25).sort((a, b) => needs[a] - needs[b])[0];
      const line = low ? { hunger: temper.voice.hungry, energy: temper.voice.tired, fun: temper.voice.bored, hygiene: temper.voice.grubby, social: temper.voice.lonely }[low] : pickLine(temper.voice.idle);
      if (!low || (lastLow[low] ?? -1e9) < minute - 120) { if (low) lastLow[low] = minute; say(line); }
      else if (wish) show(ACTION[wish.action].icon as keyof typeof ICONS, 3, true);
      if (!bubble && mood(needs) < 35) show(Math.random() < .5 ? "dots" : "sweat", 2.5);
    }
  }
  /** The camera glides to its zoom and, zoomed in, follows the Friend (runs even while game time is stopped). */
  function camera(dt: number) {
    const [fx, fy] = project(fr.i, fr.j, 20), tx = zoomTo > 1 ? fx : HOME[0], ty = zoomTo > 1 ? fy : HOME[1];
    const k = reduced ? 1 : Math.min(1, dt * 6);
    zoom += (zoomTo - zoom) * k; if (Math.abs(zoomTo - zoom) < .002) zoom = zoomTo;
    cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
    if (zoomTo > 1) { cam.x = clamp(cam.x, -150, 190); cam.y = clamp(cam.y, 40, 150); }
  }

  /* ---------- drawing ---------- */
  function frameRows(): { rows: readonly string[]; facing: Facing } {
    if (!sprites) return { rows: [], facing: "down" };
    const clip = fr.moving ? sprites.walk[fr.facing] : sprites.idle[fr.facing];
    const i = Math.floor(fr.clock * (fr.moving ? 8 : 2.5)) % Math.max(1, clip.length);
    return { rows: clip[i] ?? clip[0] ?? [], facing: fr.facing };
  }
  /** Signature idle per family (how the character moves when it is just being itself); generation = strength. */
  function signatureIdle(): { dx: number; dy: number } {
    const s = fr.clock, A = .4 + .6 * strength;
    switch (temper.family) {
      case "Hoverer": return { dx: 0, dy: -(2 + 3 * A) * (.5 + .5 * Math.sin(s * 1.6)) };
      case "Skeleton": return { dx: (s % 3.2) < .35 ? Math.sin(s * 70) * .9 * A : 0, dy: 0 };
      case "Asymmetry": return { dx: Math.sin(s * 3) * 2 * A, dy: -Math.abs(Math.sin(s * 6)) * 2 * A };
      case "Colossus": return { dx: 0, dy: Math.sin(s * 1.1) * .8 * A };
      case "Cellular": return { dx: 0, dy: -Math.abs(Math.sin(s * 4)) * 1.6 * A };
      case "Hollow": return { dx: Math.sin(s * .8) * 1.6 * A, dy: 0 };
      case "Family": return { dx: 0, dy: -Math.abs(Math.sin(s * 2.2)) * 1 * A };
      default: return { dx: 0, dy: 0 };
    }
  }
  function friendOffset(): { dx: number; dy: number } {
    if (reduced) return { dx: 0, dy: 0 };
    if (!doing && !fr.moving) return signatureIdle();
    if (!doing || doing.phase !== "do") return { dx: 0, dy: fr.moving ? -Math.abs(Math.sin(fr.clock * 10)) : 0 };
    const a = doing.action.anim, s = fr.clock;
    if (a === "bounce") return { dx: 0, dy: -Math.abs(Math.sin(s * 6)) * 1.5 };
    if (a === "hop") return { dx: 0, dy: -Math.abs(Math.sin(s * 5)) * 5 };
    if (a === "dance") return { dx: Math.sin(s * 4) * 3, dy: -Math.abs(Math.sin(s * 8)) * 3 };
    if (a === "sway") return { dx: Math.sin(s * 1.5) * 1, dy: 0 };
    return { dx: 0, dy: 0 };
  }
  function friendPart(): Part {
    const r = .2, z0 = fr.bath ? 9.2 : fr.z;
    return makePart(fr.i - r, fr.i + r, fr.j - r, fr.j + r, z0, z0 + 30, "friend", drawFriendNow);
  }
  function drawFriendNow(c: CanvasRenderingContext2D) {
    const { rows, facing } = frameRows(); if (!rows.length) return;
    const [x, y] = project(fr.i, fr.j, fr.z), off = friendOffset(), feet = feetRow(rows);
    if (!fr.lie && !fr.bath) { c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.ellipse(x, project(fr.i, fr.j, fr.z)[1], 11, 3.6, 0, 0, Math.PI * 2); c.fill(); }
    c.save();
    if (fr.lie) { // resting upright in bed (the canonical artwork is never rotated or changed)
      c.translate(Math.round(x - 8 * SPRITE), Math.round(y + 3 - (feet + 1) * SPRITE)); c.scale(SPRITE, SPRITE);
      drawFriend(c, rows, 0, 0, outfit, "down", fr.clock, false);
    } else {
      c.translate(Math.round(x + off.dx - 8 * SPRITE), Math.round(y + off.dy - (feet + 1) * SPRITE));
      c.scale(SPRITE, SPRITE);
      drawFriend(c, rows, 0, 0, outfit, facing, fr.clock, fr.moving);
    }
    c.restore();
    const prop = doing?.phase === "do" ? PROPS[doing.action.id] : undefined;
    if (fr.bath && doing?.seat) drawTubFront(c, footprint(doing.seat));
    if (prop && !fr.lie) { const left = fr.facing === "left"; drawPixmap(c, ICONS[prop], Math.round(x + off.dx + (left ? -20 : 11)), Math.round(y + off.dy - 17), 1); }
    // family flourishes around (never on) the Friend: Sparkling twinkles, Family hearts
    if (!reduced && !fr.lie && !doing && !fr.moving) {
      const top = y + off.dy - (feet - topRow(rows) + 1) * SPRITE;
      if (temper.family === "Sparkling") for (let n = 0; n < 2 + Math.round(2 * strength); n++) {
        const ph = fr.clock * 1.7 + n * 2.1, a = Math.max(0, Math.sin(ph)); if (a < .2) continue;
        const px = x + Math.sin(n * 7.3 + Math.floor(ph / Math.PI) * 3.1) * 17, py = top + 6 + ((n * 11) % 22);
        c.fillStyle = `rgba(255,236,150,${a})`; c.fillRect(px - .5, py - 2, 1, 5); c.fillRect(px - 2, py - .5, 5, 1);
      }
      if (temper.family === "Family") { const ph = (fr.clock % 4) / 4; if (ph < .5 * (.5 + strength)) { const hy = top - 4 - ph * 16; c.fillStyle = `rgba(255,77,109,${1 - ph * 1.6})`; c.fillRect(x + 9, hy, 2, 2); c.fillRect(x + 12, hy, 2, 2); c.fillRect(x + 9, hy + 1, 5, 2); c.fillRect(x + 10, hy + 3, 3, 1); } }
    }
  }
  /** The near half of the bath (water, foam, front rim and end) drawn over the Friend sitting in it. */
  function drawTubFront(c: CanvasRenderingContext2D, [a, b, e, d]: readonly number[]) {
    const P = project, dk = darkness(minute), rim = .12, wz = 7.6, W = ["#FFFFFF", "#E6E6EE", "#D2D2DE"];
    const q = (pts: readonly (readonly [number, number])[], fill: string, stroke = true) => fillPoly(c, pts.flatMap(p => [p[0], p[1]]), lit(fill, dk), stroke);
    // water in front of the Friend, then foam floating on it
    // the water line is level on screen: everything of the Friend below it is under water
    const [fx, fy] = P(fr.i, fr.j, wz), line = fy - 3;
    c.save(); c.beginPath(); c.rect(-1e4, line, 2e4, 1e4); c.clip();
    q([P(a + rim, b + rim, wz), P(e - rim, b + rim, wz), P(e - rim, d - rim, wz), P(a + rim, d - rim, wz)], "#8FC6DE", false);
    c.restore();
    c.fillStyle = lit("#B5DCEC", dk); c.fillRect(fx - 20, line, 40, 1);
    for (let n = 0; n < 12; n++) {
      const bob = reduced ? 0 : Math.sin(fr.clock * 2 + n) * .6, bx = fx - 21 + n * 3.8, by = line + 1 + (n % 3) * 1.4;
      c.fillStyle = lit(n % 3 ? "#FFFFFF" : "#DCEFF3", dk * .6); c.beginPath(); c.ellipse(bx, by + bob, 3.4, 2.1, 0, 0, Math.PI * 2); c.fill();
    }
    // front rim (along i at the near side) and the right end: outer faces, then tops
    q([P(a, d, 0), P(e, d, 0), P(e, d, 9), P(a, d, 9)], W[1]);
    q([P(e, b, 0), P(e, d, 0), P(e, d, 9), P(e, b, 9)], W[2]);
    q([P(a, d - rim, 9), P(e, d - rim, 9), P(e, d, 9), P(a, d, 9)], W[0]);
    q([P(e - rim, b, 9), P(e, b, 9), P(e, d, 9), P(e - rim, d, 9)], W[0]);
    // inner side of the front rim, seen above the water
    q([P(a + rim, d - rim, wz), P(e - rim, d - rim, wz), P(e - rim, d - rim, 9), P(a + rim, d - rim, 9)], "#EEF3F6", false);
  }
  function headPoint(): [number, number] {
    const { rows } = frameRows(), [x, y] = project(fr.i, fr.j, fr.z);
    const top = rows.length ? topRow(rows) : 2, feet = rows.length ? feetRow(rows) : 15;
    return [x, y - (feet - top + 2) * SPRITE];
  }

  let scale = 2;
  const toScreen = (wx: number, wy: number): [number, number] => [((wx - cam.x) * zoom + VIEW_W / 2) * scale, ((wy - cam.y) * zoom + VIEW_H / 2) * scale];

  function draw() {
    const W = canvas.width, H = canvas.height; scale = W / VIEW_W;
    g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false;
    const k = darkness(minute);
    g.fillStyle = lit(GRASS, k * .8); g.fillRect(0, 0, W, H);
    const s = scale * zoom;
    g.setTransform(s, 0, 0, s, (VIEW_W / 2 - cam.x * zoom) * scale, (VIEW_H / 2 - cam.y * zoom) * scale);
    const night = isNight(minute), h = (minute % DAY_MINUTES) / 60;
    const sky: Sky = { glass: night ? "#1E2A4A" : h < 8 ? "#F4B183" : h >= 18 ? "#E8906A" : "#9FD3F0", stars: night, sun: !night && h >= 8 && h < 18 };
    drawShell(g, k, sky);
    // lamp light pools on the floor at night
    if (k > 0) for (const p of placed) {
      if (!["nightstand", "floorlamp"].includes(p.def)) continue;
      const [a, b, c2, d] = footprint(p), [x, y] = project((a + c2) / 2 + .3, (b + d) / 2 + .3);
      const grad = g.createRadialGradient(x, y, 2, x, y, 40); grad.addColorStop(0, `rgba(255,214,120,${.28 * k})`); grad.addColorStop(1, "rgba(255,214,120,0)");
      g.fillStyle = grad; g.beginPath(); g.ellipse(x, y, 40, 20, 0, 0, Math.PI * 2); g.fill();
    }
    if (placing) {
      const f = footprint({ uid: "ghost", def: placing.def, i: placing.i, j: placing.j, swap: placing.swap }), P = project;
      fillPoly(g, [...P(f[0], f[1], .6), ...P(f[2], f[1], .6), ...P(f[2], f[3], .6), ...P(f[0], f[3], .6)], placing.valid ? "rgba(127,176,105,.55)" : "rgba(224,72,72,.5)", false);
    }
    FX.t = t; FX.dark = k; FX.calm = reduced; FX.acts.clear(); if (doing?.phase === "do") FX.acts.add(doing.action.id);
    drawOrder = withMoving(parts, friendPart());
    for (const p of drawOrder) {
      if (p.custom) { p.custom(g, p); continue; }
      const hi = hover !== null && p.owner === hover;
      for (const poly of p.polys) fillPoly(g, poly.pts, lit(hi ? brighten(poly.fill) : poly.fill, k), poly.stroke);
    }
    for (const p of particles) {
      const a = Math.max(0, Math.min(1, p.life / p.max * 1.4)); g.globalAlpha = a;
      if (p.kind === "icon" && p.icon) drawPixmap(g, p.icon, Math.round(p.x - 4), Math.round(p.y - 4), 1);
      else if (p.kind === "bubble") { g.strokeStyle = "#FFFFFF"; g.lineWidth = .6; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.stroke(); }
      else if (p.kind === "steam") { g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); }
      else { g.fillStyle = p.color ?? "#FFFFFF"; g.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }
    }
    g.globalAlpha = 1;
    if (hintUid && !placing) {
      const anchor = hintUid === "friend" ? (() => { const [hx, hy] = headPoint(); return { x: hx, y: hy - 16 }; })() : tops.get(hintUid);
      if (anchor) drawPixmap(g, ARROW, Math.round(anchor.x - 4), Math.round(anchor.y - 14 - (reduced ? 0 : Math.abs(Math.sin(t * 4)) * 4)), 1);
    }
    if (placing) { g.globalAlpha = placing.valid ? .85 : .5; for (const p of ghostParts) { if (p.custom) { p.custom(g, p); continue; } for (const poly of p.polys) fillPoly(g, poly.pts, poly.fill, poly.stroke); } g.globalAlpha = 1; }
    // bubbles and speech in screen space
    g.setTransform(1, 0, 0, 1, 0, 0);
    const [hx, hy] = headPoint(), [sx, sy] = toScreen(hx, hy - 4);
    if (bubble && t < bubble.until) {
      g.save(); g.translate(sx, sy); const bs = Math.max(2, Math.round(scale)); g.scale(bs, bs); drawIconBubble(g, bubble.icon, 0, 0, bubble.thought); g.restore();
    } else bubble = null;
    if (speech && t < speech.until) drawSpeech(sx, sy - (bubble ? 34 * scale / 2 : 0), speech.text); else speech = null;
  }
  function drawSpeech(x: number, y: number, text: string) {
    const css = canvas.width / Math.max(1, canvas.getBoundingClientRect().width), fs = Math.round(Math.max(6.5 * scale, 11 * css)); g.font = `bold ${fs}px "Courier New", monospace`;
    const w = Math.min(g.measureText(text).width, 200 * scale), pad = 4 * scale / 2, bx = clamp(x - w / 2 - pad, 4, canvas.width - w - pad * 2 - 4), by = y - fs - pad * 2 - 6 * scale / 2;
    g.fillStyle = "#1c1c1c"; g.fillRect(bx - 2, by - 2, w + pad * 2 + 4, fs + pad * 2 + 4);
    g.fillStyle = "#FFF6E6"; g.fillRect(bx, by, w + pad * 2, fs + pad * 2);
    g.fillStyle = "#1c1c1c"; g.fillRect(x - 3, by + fs + pad * 2 + 2, 6, 3 * scale / 2);
    g.fillStyle = "#3A2A1E"; g.textBaseline = "top"; g.fillText(text, bx + pad, by + pad, w);
  }
  const brighten = (c: string) => { if (c[0] !== "#") return c; const n = [1, 3, 5].map(o => Math.min(255, parseInt(c.slice(o, o + 2), 16) + 28)); return `#${n.map(v => v.toString(16).padStart(2, "0")).join("")}`; };

  function frame(now: number) {
    if (destroyed) return;
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (!paused) { t += dt; fr.clock += dt; if (speed > 0) update(dt); camera(dt); }
    draw();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  /* ---------- picking ---------- */
  function worldAt(cssX: number, cssY: number) {
    const r = canvas.getBoundingClientRect(), px = (cssX / r.width) * canvas.width, py = (cssY / r.height) * canvas.height;
    return { x: (px / scale - VIEW_W / 2) / zoom + cam.x, y: (py / scale - VIEW_H / 2) / zoom + cam.y };
  }
  function pick(cssX: number, cssY: number): Pick {
    const { x: wx, y: wy } = worldAt(cssX, cssY);
    const shot = { x: cssX, y: cssY };
    // the Friend first (its sprite box)
    const [fx, fy] = project(fr.i, fr.j, fr.z);
    if (Math.abs(wx - fx) < 14 && wy < fy + 3 && wy > fy - 34) return { kind: "friend", ...shot };
    for (let n = drawOrder.length - 1; n >= 0; n--) {
      const p = drawOrder[n]; if (!p.owner || p.owner === "friend") continue;
      if (wx < p.x0 || wx > p.x1 || wy < p.y0 || wy > p.y1) continue;
      if (p.custom || p.polys.some(q => pointInPoly(wx, wy, q.pts))) { const pl = placedById(p.owner); if (pl) return { kind: "object", uid: pl.uid, def: pl.def, ...shot }; }
    }
    const { i, j } = unproject(wx, wy);
    if (i >= 0 && j >= 0 && i < COLS && j < ROWS) return { kind: "floor", i, j, ...shot };
    return { kind: "none", ...shot };
  }

  return {
    setSprites(s: FriendSprites) { sprites = s; },
    setOutfit(o: Outfit) { outfit = o; },
    setCharacter(temperament: Temperament, s: number, q: string | null = null) {
      temper = temperament; strength = s; quirk = q;
      // the family's heirloom moves in with the Friend (once; the player may move it or put it away later)
      const h = HEIRLOOM[temperament.family];
      if (h && !heirloomFor) { heirloomFor = temperament.family; placed = placed.filter(p => !p.def.startsWith("heirloom-")); placed.push({ uid: "heirloom", def: h.def.id, i: HEIRLOOM_AT[0], j: HEIRLOOM_AT[1], swap: false }); rebuild(); }
    },
    setAccent(a: { top: string; left: string; right: string; light: string }) { FX.accent = a; rebuild(); },
    setPaused(v: boolean) { paused = v; if (v) move = { x: 0, y: 0 }; },
    setSpeed(v: number) { speed = v; },
    setReducedMotion(v: boolean) { reduced = v; },
    setZoom(z: number) { zoomTo = z; },
    setMove(x: number, y: number) { move = { x, y }; },
    setHover(uid: string | null) { hover = uid; },
    pick,
    command,
    walkTo(i: number, j: number) { const p = pathTo(i, j, .8); if (p) { stop(); fr.path = p; idleFor = 0; } else onEvent({ type: "blocked" }); },
    cancel() { stop(); idleFor = 0; },
    greet() { say(pickLine(temper.voice.hello), 4.5); show("heart", 2); },
    say,
    emote(icon: keyof typeof ICONS, seconds = 2) { show(icon, seconds); },
    /** Actions shown in the menu of a clicked piece (always offered; availability is explained in the menu). */
    menuFor(def: string) { return actionsOn(def, minute); },
    nearestUsable(): Placed | null {
      let best: Placed | null = null, bd = 1.6;
      for (const p of placed) { if (!actionsOn(p.def, minute).length) continue; const s = spotFor(p); if (!s) continue; const d = Math.hypot(s[0] - fr.i, s[1] - fr.j); if (d < bd) { bd = d; best = p; } }
      return best;
    },
    /** Buy mode: start placing a piece (a new purchase, or moving an owned one when uid is given). */
    startPlacing(def: string, uid: string | null = null) {
      if (uid) { const p = placedById(uid); if (!p) return; placed = placed.filter(q => q.uid !== uid); rebuild(); placing = { def, i: p.i, j: p.j, swap: p.swap, valid: false, uid, original: p }; }
      else placing = { def, i: Math.round(fr.i) + .5, j: Math.round(fr.j) - 1.5, swap: false, valid: false, uid: null, original: null };
      if (doing && doing.target === uid) stop();
      updateGhost();
    },
    placeAt,
    /** Things that raise a need right now: [{ uid (or "friend"), action }]. */
    hintOptions(need: NeedKey) {
      const out: { uid: string; action: string }[] = [];
      for (const p of placed) for (const a of actionsOn(p.def, minute)) {
        if (a.panel || (a.uses === "snack" && stock.snacks <= 0) || (a.uses === "meal" && stock.meals <= 0)) continue;
        const gain = (a.rates?.[need] ?? 0) * a.minutes / 60 + (a.done?.[need] ?? 0) + (a.withYou && need === "social" ? 4 * a.minutes / 60 : 0);
        if (gain >= 8 && !out.some(o => o.action === a.id && (a.seat || o.uid === p.uid))) out.push({ uid: p.uid, action: a.id });
      }
      if (need === "social") { out.push({ uid: "friend", action: "pet" }); out.push({ uid: "friend", action: "talk" }); }
      return out;
    },
    setHint(uid: string | null) { hintUid = uid; },
    nudgePlacing(di: number, dj: number) { if (placing) { placing.i += di; placing.j += dj; updateGhost(); } },
    rotatePlacing() { if (placing) { placing.swap = !placing.swap; updateGhost(); } },
    isPlacing() { return !!placing; },
    placingValid() { return !!placing?.valid; },
    /** Put the ghost down. Returns the new piece's uid, or null when the spot is not valid. */
    confirmPlacing(): string | null {
      if (!placing) return null;
      updateGhost(); if (!placing.valid) return null;
      const uid = placing.uid ?? `${placing.def}-${++bought}`;
      placed.push({ uid, def: placing.def, i: placing.i, j: placing.j, swap: placing.swap });
      const def = placing.def; placing = null; ghostParts = []; rebuild(); onEvent({ type: "placed", uid, def });
      return uid;
    },
    /** Cancel placing; a moved piece goes back where it was. */
    cancelPlacing() { if (placing?.original) { placed.push(placing.original); rebuild(); } placing = null; ghostParts = []; },
    removePiece(uid: string) { if (doing?.target === uid) stop(); placed = placed.filter(p => p.uid !== uid); rebuild(); },
    pieceById(uid: string) { const p = placedById(uid); return p ? { ...p } : null; },
    setKeepsakes(colors: readonly string[]) { keepsakeCount = colors.length; setHutchItems(colors); rebuild(); },
    addStock(snacks: number, meals: number) { stock.snacks += snacks; stock.meals += meals; },
    addFriendship(v: number) { friendship += v; },
    boostNeed(k: NeedKey, v: number) { needs[k] = clamp(needs[k] + v); },
    preferenceOf(id: string) { return preference(temper, strength, id); },
    view(): View {
      return { needs: { ...needs }, minute, mood: mood(needs), action: doing?.action.id ?? null, walking: fr.moving, wish: wish?.action ?? null, friendship, stock: { ...stock }, room: roomAt(fr.i, fr.j), speed, active: doing?.phase === "do" ? doing.action.id : null };
    },
    /** CSS position of the Friend's head inside the canvas box (for menus). */
    friendAnchor(): { x: number; y: number } {
      const r = canvas.getBoundingClientRect(), [hx, hy] = headPoint(), [sx, sy] = toScreen(hx, hy);
      return { x: sx / canvas.width * r.width, y: sy / canvas.height * r.height };
    },
    resize() {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(480, Math.round(r.width * dpr)), hgt = Math.round(w * VIEW_H / VIEW_W);
      if (canvas.width !== w || canvas.height !== hgt) { canvas.width = w; canvas.height = hgt; }
    },
    destroy() { destroyed = true; cancelAnimationFrame(raf); },
  };
}
export type Engine = ReturnType<typeof createEngine>;

/** Isometric thumbnail of a furniture piece (for the Buy mode catalog). */
export function pieceThumb(def: string, w = 72, h = 60): string {
  const c = document.createElement("canvas"); c.width = w * 2; c.height = h * 2; const g = c.getContext("2d"); if (!g) return "";
  const b = new Builder(); buildPlaced(b, { uid: "thumb", def, i: 0, j: 0, swap: false });
  const parts = depthSort(b.parts); if (!parts.length) return "";
  const x0 = Math.min(...parts.map(p => p.x0)), x1 = Math.max(...parts.map(p => p.x1)), y0 = Math.min(...parts.map(p => p.y0)), y1 = Math.max(...parts.map(p => p.y1));
  const s = Math.min((w * 2 - 8) / (x1 - x0), (h * 2 - 8) / (y1 - y0), 5);
  g.setTransform(s, 0, 0, s, w - (x0 + x1) / 2 * s, h - (y0 + y1) / 2 * s);
  for (const p of parts) { if (p.custom) { p.custom(g, p); continue; } for (const q of p.polys) fillPoly(g, q.pts, q.fill, q.stroke); }
  return c.toDataURL();
}
