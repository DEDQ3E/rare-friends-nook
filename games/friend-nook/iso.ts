/** Isometric projection, scene parts and depth sorting for Friend Nook.
 *
 * World units: i and j are tile coordinates on the floor (i runs to the lower right on screen, j to the lower
 * left), z is height in screen pixels. A tile is 36 × 18 pixels (2:1). Everything that stands in the room is
 * made of axis-aligned boxes and thin face/top plates ("parts"). Parts are ordered with a topological sort:
 * A is drawn before B when A lies entirely at lower i, lower j or lower z than B and their screen boxes overlap.
 * That keeps table legs under table tops, cushions behind armrests and the Friend behind the sofa back. */

export const HW = 18, HH = 9; // half tile width / height in logical pixels

export type Pt = readonly [number, number];
/** Maps (u, v) in [0, 1]² on a face to a screen point; u runs along the face, v up (or across, on tops). */
export type QuadAt = (u: number, v: number) => Pt;
export const project = (i: number, j: number, z = 0): Pt => [(i - j) * HW, (i + j) * HH - z];
/** Screen point (relative to the world origin) → floor tile coordinates at height z. */
export function unproject(x: number, y: number, z = 0): { i: number; j: number } {
  const a = x / HW, b = (y + z) / HH; // a = i - j, b = i + j
  return { i: (a + b) / 2, j: (b - a) / 2 };
}

/** Three shades of one material: top, left face (+j side), right face (+i side). */
export type Shade = readonly [string, string, string];
export const S = (top: string, left: string, right: string): Shade => [top, left, right];

export type Poly = Readonly<{ pts: readonly number[]; fill: string; stroke: boolean }>;
export type Part = {
  i0: number; i1: number; j0: number; j1: number; z0: number; z1: number;
  polys: Poly[];
  owner: string | null;               // furniture instance id, "friend", or null for structure
  x0: number; x1: number; y0: number; y1: number; // screen bounding box
  custom?: (ctx: CanvasRenderingContext2D, part: Part) => void;
};

const THIN = 0.0005, EPS = 1e-4;

function bounds(i0: number, i1: number, j0: number, j1: number, z0: number, z1: number) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const i of [i0, i1]) for (const j of [j0, j1]) for (const z of [z0, z1]) {
    const [x, y] = project(i, j, z); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { x0, x1, y0, y1 };
}
const flat = (pts: readonly Pt[]) => pts.flatMap(p => [p[0], p[1]]);

/** Collects parts. `place` moves and optionally mirrors (swaps i and j) everything built through it, so one
 * furniture builder written in its default position can be placed anywhere in Buy mode. */
export class Builder {
  parts: Part[] = [];
  owner: string | null = null;
  private oi = 0; private oj = 0; private bi = 0; private bj = 0; private swap = false;
  /** Build at (i, j) instead of the builder's default origin (di, dj); swap = mirror the piece. */
  place(owner: string | null, di: number, dj: number, i: number, j: number, swap = false) {
    this.owner = owner; this.bi = di; this.bj = dj; this.oi = i; this.oj = j; this.swap = swap;
  }
  reset() { this.owner = null; this.bi = this.bj = this.oi = this.oj = 0; this.swap = false; }
  /** Map a default-position box to its placed box. */
  private tx(i: number, j: number, w: number, d: number): [number, number, number, number] {
    const di = i - this.bi, dj = j - this.bj;
    return this.swap ? [this.oi + dj, this.oj + di, d, w] : [this.oi + di, this.oj + dj, w, d];
  }
  private push(i0: number, i1: number, j0: number, j1: number, z0: number, z1: number, polys: Poly[], custom?: Part["custom"]) {
    this.parts.push({ i0, i1, j0, j1, z0, z1, polys, owner: this.owner, ...bounds(i0, i1, j0, j1, z0, z1), custom });
  }
  /** A solid box: w along i, d along j, h high, standing at height z. */
  box(i: number, j: number, w: number, d: number, h: number, c: Shade, z = 0, outline = true) {
    [i, j, w, d] = this.tx(i, j, w, d);
    const P = project;
    this.push(i, i + w, j, j + d, z, z + h, [
      { pts: flat([P(i, j + d, z), P(i + w, j + d, z), P(i + w, j + d, z + h), P(i, j + d, z + h)]), fill: c[1], stroke: outline },
      { pts: flat([P(i + w, j, z), P(i + w, j + d, z), P(i + w, j + d, z + h), P(i + w, j, z + h)]), fill: c[2], stroke: outline },
      { pts: flat([P(i, j, z + h), P(i + w, j, z + h), P(i + w, j + d, z + h), P(i, j + d, z + h)]), fill: c[0], stroke: outline },
    ]);
  }
  /** A flat plate on the face that looks toward +j (the left face on screen), at j = jp. */
  fj(jp: number, i0: number, i1: number, z0: number, z1: number, fill: string) {
    // default-space points (i, jp); mirrored they land on the plane i = const
    if (this.swap) this.planeI(this.oi + jp - this.bj, this.oj + i0 - this.bi, this.oj + i1 - this.bi, z0, z1, fill);
    else this.planeJ(this.oj + jp - this.bj, this.oi + i0 - this.bi, this.oi + i1 - this.bi, z0, z1, fill);
  }
  /** A flat plate on the face that looks toward +i (the right face on screen), at i = ip. */
  fi(ip: number, j0: number, j1: number, z0: number, z1: number, fill: string) {
    if (this.swap) this.planeJ(this.oj + ip - this.bi, this.oi + j0 - this.bj, this.oi + j1 - this.bj, z0, z1, fill);
    else this.planeI(this.oi + ip - this.bi, this.oj + j0 - this.bj, this.oj + j1 - this.bj, z0, z1, fill);
  }
  /** World-space plate on the plane j = jw, from i = a to i = b. */
  private planeJ(jw: number, a: number, b: number, z0: number, z1: number, fill: string) {
    const P = project;
    this.push(a, b, jw, jw + THIN, z0, z1, [{ pts: flat([P(a, jw, z0), P(b, jw, z0), P(b, jw, z1), P(a, jw, z1)]), fill, stroke: false }]);
  }
  /** World-space plate on the plane i = iw, from j = a to j = b. */
  private planeI(iw: number, a: number, b: number, z0: number, z1: number, fill: string) {
    const P = project;
    this.push(iw, iw + THIN, a, b, z0, z1, [{ pts: flat([P(iw, a, z0), P(iw, b, z0), P(iw, b, z1), P(iw, a, z1)]), fill, stroke: false }]);
  }
  /** Animated face on the +i side at i = ip (drawn every frame by `draw`). */
  fiFx(ip: number, j0: number, j1: number, z0: number, z1: number, draw: (ctx: CanvasRenderingContext2D, at: QuadAt) => void) {
    if (this.swap) this.planeFx("j", this.oj + ip - this.bi, this.oi + j0 - this.bj, this.oi + j1 - this.bj, z0, z1, draw);
    else this.planeFx("i", this.oi + ip - this.bi, this.oj + j0 - this.bj, this.oj + j1 - this.bj, z0, z1, draw);
  }
  /** Animated face on the +j side at j = jp. */
  fjFx(jp: number, i0: number, i1: number, z0: number, z1: number, draw: (ctx: CanvasRenderingContext2D, at: QuadAt) => void) {
    if (this.swap) this.planeFx("i", this.oi + jp - this.bj, this.oj + i0 - this.bi, this.oj + i1 - this.bi, z0, z1, draw);
    else this.planeFx("j", this.oj + jp - this.bj, this.oi + i0 - this.bi, this.oi + i1 - this.bi, z0, z1, draw);
  }
  private planeFx(axis: "i" | "j", w: number, a: number, b: number, z0: number, z1: number, draw: (ctx: CanvasRenderingContext2D, at: QuadAt) => void) {
    const at: QuadAt = axis === "j" ? (u, v) => project(a + (b - a) * u, w, z0 + (z1 - z0) * v) : (u, v) => project(w, a + (b - a) * u, z0 + (z1 - z0) * v);
    if (axis === "j") this.push(Math.min(a, b), Math.max(a, b), w, w + THIN, z0, z1, [], ctx => draw(ctx, at));
    else this.push(w, w + THIN, Math.min(a, b), Math.max(a, b), z0, z1, [], ctx => draw(ctx, at));
  }
  /** Animated plate lying on top of something at height z. */
  tpFx(i0: number, j0: number, i1: number, j1: number, z: number, draw: (ctx: CanvasRenderingContext2D, at: QuadAt) => void) {
    const [a, b, w, d] = this.tx(i0, j0, i1 - i0, j1 - j0), at: QuadAt = (u, v) => project(a + w * u, b + d * v, z);
    this.push(a, a + w, b, b + d, z, z + THIN, [], ctx => draw(ctx, at));
  }
  /** A flat plate lying on top of something at height z. */
  tp(i0: number, j0: number, i1: number, j1: number, z: number, fill: string) {
    const [a, b, w, d] = this.tx(i0, j0, i1 - i0, j1 - j0), P = project;
    this.push(a, a + w, b, b + d, z, z + THIN, [{ pts: flat([P(a, b, z), P(a + w, b, z), P(a + w, b + d, z), P(a, b + d, z)]), fill, stroke: false }]);
  }
  /** Anything else (drawn by a callback in world-pixel space) occupying a box. */
  custom(i: number, j: number, w: number, d: number, h: number, draw: (ctx: CanvasRenderingContext2D, part: Part) => void, z = 0) {
    [i, j, w, d] = this.tx(i, j, w, d);
    this.push(i, i + w, j, j + d, z, z + h, [], draw);
  }
  /** Legs at the four corners of a w × d footprint. */
  legs(i: number, j: number, w: number, d: number, h: number, c: Shade, t = 0.1) {
    this.box(i, j, t, t, h, c); this.box(i + w - t, j, t, t, h, c); this.box(i, j + d - t, t, t, h, c); this.box(i + w - t, j + d - t, t, t, h, c);
  }
}

/** true when a must be drawn before b (a is behind or below b). */
export function before(a: Part, b: Part): boolean {
  if (a.i1 <= b.i0 + EPS) return true; if (b.i1 <= a.i0 + EPS) return false;
  if (a.j1 <= b.j0 + EPS) return true; if (b.j1 <= a.j0 + EPS) return false;
  if (a.z1 <= b.z0 + EPS) return true; if (b.z1 <= a.z0 + EPS) return false;
  return (a.i0 + a.i1 + a.j0 + a.j1) / 2 + a.z0 * 0.001 < (b.i0 + b.i1 + b.j0 + b.j1) / 2 + b.z0 * 0.001;
}
const overlap = (a: Part, b: Part) => !(a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0);

/** Topological depth sort of static parts (run once whenever the furniture changes). */
export function depthSort(list: readonly Part[]): Part[] {
  const n = list.length, adj: number[][] = list.map(() => []);
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
    const A = list[a], B = list[b];
    if (!overlap(A, B)) continue;
    if (before(A, B)) adj[b].push(a); else adj[a].push(b);
  }
  const out: Part[] = [], state = new Uint8Array(n);
  const order = list.map((_, k) => k).sort((a, b) => (list[a].i0 + list[a].j0) - (list[b].i0 + list[b].j0));
  const stack: [number, number][] = [];
  for (const start of order) {
    if (state[start]) continue;
    stack.push([start, 0]); state[start] = 1;
    while (stack.length) {
      const top = stack[stack.length - 1], [v, k] = top;
      if (k < adj[v].length) { top[1]++; const u = adj[v][k]; if (!state[u]) { state[u] = 1; stack.push([u, 0]); } }
      else { stack.pop(); state[v] = 2; out.push(list[v]); }
    }
  }
  return out;
}

/** Where a moving part (the Friend) goes into an already sorted list: after everything it must follow,
 * before everything it must precede. Returns the insertion index. */
export function insertionIndex(sorted: readonly Part[], p: Part): number {
  let after = -1, first = sorted.length;
  for (let k = 0; k < sorted.length; k++) {
    const q = sorted[k]; if (!overlap(p, q)) continue;
    if (before(q, p)) after = k; else if (k < first) first = k;
  }
  return after < first ? first : after + 1;
}

/** The sorted scene with a moving part (the Friend) in it. When the static order leaves no valid slot
 * (something it must follow comes after something it must precede), only that stretch is re-sorted. */
export function withMoving(sorted: readonly Part[], p: Part): Part[] {
  let after = -1, first = sorted.length;
  for (let k = 0; k < sorted.length; k++) {
    const q = sorted[k]; if (!overlap(p, q)) continue;
    if (before(q, p)) after = k; else if (k < first) first = k;
  }
  if (after < first) return [...sorted.slice(0, after + 1), p, ...sorted.slice(after + 1)];
  return [...sorted.slice(0, first), ...depthSort([...sorted.slice(first, after + 1), p]), ...sorted.slice(after + 1)];
}

export function makePart(i0: number, i1: number, j0: number, j1: number, z0: number, z1: number, owner: string | null, custom?: Part["custom"]): Part {
  return { i0, i1, j0, j1, z0, z1, polys: [], owner, ...bounds(i0, i1, j0, j1, z0, z1), custom };
}

/* ---------- drawing ---------- */

export const OUTLINE = "#2b1d14";

export function fillPoly(ctx: CanvasRenderingContext2D, pts: readonly number[], fill: string, stroke: boolean) {
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = OUTLINE; ctx.lineWidth = 0.5; ctx.lineJoin = "round"; ctx.stroke(); }
}

export function pointInPoly(x: number, y: number, pts: readonly number[]): boolean {
  let inside = false;
  for (let a = 0, b = pts.length - 2; a < pts.length; b = a, a += 2) {
    const xa = pts[a], ya = pts[a + 1], xb = pts[b], yb = pts[b + 1];
    if ((ya > y) !== (yb > y) && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inside = !inside;
  }
  return inside;
}

/* ---------- light: every material color is blended toward the night color (the Friend is never tinted) ---------- */
const shadeCache = new Map<string, string>();
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
/** k = 0 (day) … 1 (deep night), quantized to 20 steps for caching. */
export function lit(c: string, k: number): string {
  if (k <= 0 || c[0] !== "#" || c.length !== 7) return c;
  const q = Math.round(k * 20) / 20, key = c + q;
  const hit = shadeCache.get(key); if (hit) return hit;
  const [r, g, b] = hex(c), n = [34, 40, 78];
  const mix = (v: number, t: number) => Math.round(v * (1 - 0.55 * q) + t * 0.55 * q * 0.6);
  const out = `rgb(${mix(r, n[0])},${mix(g, n[1])},${mix(b, n[2])})`;
  shadeCache.set(key, out); return out;
}
