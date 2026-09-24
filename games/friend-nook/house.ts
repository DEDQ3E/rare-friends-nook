/** The house shell: floors, back walls, windows and wall decor (drawn flat, behind everything), plus the
 * interior walls, door frames and the cut-away front walls (depth-sorted parts), and the walking grid. */
import { Builder, S, fillPoly, lit, project, type Pt, type Shade } from "./iso.js";

export const COLS = 12, ROWS = 10, WALL_H = 44;
export type Room = "bedroom" | "bathroom" | "kitchen" | "living" | "dining";
export const ROOM_NAME: Readonly<Record<Room, string>> = { bedroom: "Bedroom", bathroom: "Bathroom", kitchen: "Kitchen", living: "Living room", dining: "Dining area" };
export const roomAt = (i: number, j: number): Room => j < 5 ? (i < 5 ? "bedroom" : i < 8 ? "bathroom" : "kitchen") : (i < 8 ? "living" : "dining");

export type Sky = Readonly<{ glass: string; stars: boolean; sun: boolean }>;

const flat = (pts: readonly Pt[]) => pts.flatMap(p => [p[0], p[1]]);
const hash = (a: number, b: number) => ((a * 73856093) ^ (b * 19349663)) >>> 0;

/** Floors, back walls, windows and wall decor. k = darkness 0…1. */
export function drawShell(ctx: CanvasRenderingContext2D, k: number, sky: Sky) {
  const P = project;
  const q = (pts: Pt[], c: string) => fillPoly(ctx, flat(pts), lit(c, k), false);
  const tile = (i0: number, j0: number, i1: number, j1: number, c: string, z = 0) => q([P(i0, j0, z), P(i1, j0, z), P(i1, j1, z), P(i0, j1, z)], c);
  // floors
  for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) {
    const room = roomAt(i, j);
    if (room === "bathroom") { for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) tile(i + a / 2, j + b / 2, i + a / 2 + .5, j + b / 2 + .5, (a + b) % 2 ? "#B9DAE5" : "#D3EBF1"); continue; }
    if (room === "kitchen") { tile(i, j, i + 1, j + 1, (i + j) % 2 ? "#E1D9C6" : "#F4F0E6"); continue; }
    if (room === "bedroom") { tile(i, j, i + 1, j + 1, "#E7B7C3"); tile(i + .45, j + .45, i + .55, j + .55, "#D9A2B1"); continue; }
    const woods = room === "living" ? ["#D9A066", "#D19659", "#DDA86F"] : ["#C98B55", "#C0814C", "#CF935E"];
    for (let s = 0; s < 3; s++) {
      tile(i, j + s / 3, i + 1, j + (s + 1) / 3, woods[hash(i + s * 7, j * 3 + s) % 3]);
      tile(i, j + (s + 1) / 3 - .02, i + 1, j + (s + 1) / 3, "#B98450");
    }
    tile(i + .98, j, i + 1, j + 1, "#B98450");
  }
  // back walls: LW = left wall (plane i = 0), BW = back wall (plane j = 0)
  const LW = (j0: number, j1: number, h0: number, h1: number, c: string) => q([P(0, j0, h0), P(0, j1, h0), P(0, j1, h1), P(0, j0, h1)], c);
  const BW = (i0: number, i1: number, h0: number, h1: number, c: string) => q([P(i0, 0, h0), P(i1, 0, h0), P(i1, 0, h1), P(i0, 0, h1)], c);
  LW(0, 5, 0, WALL_H, "#9DB3D0"); LW(5, 10, 0, WALL_H, "#D2B084");
  BW(0, 5, 0, WALL_H, "#B7CDE6"); BW(5, 8, 0, WALL_H, "#DCEFF3"); BW(8, 12, 0, WALL_H, "#CFE3C1");
  for (let j = 5.25; j < 10; j += .5) LW(j, j + .07, 3, WALL_H, "#C6A273");
  for (let n = 0; n < 14; n++) { const i = .4 + (n * .37) % 4.4, h = 12 + ((n * 17) % 28); BW(i, i + .08, h, h + 1.6, "#E8F0FA"); }
  for (let n = 0; n < 8; n++) { const j = .4 + (n * .61) % 4.4, h = 12 + ((n * 13) % 28); LW(j, j + .08, h, h + 1.6, "#C8D6EA"); }
  for (let i = 5; i < 8; i += .5) BW(i, i + .03, 3, 24, "#BCD9E0");
  for (let h = 6; h < 24; h += 6) BW(5, 8, h, h + .6, "#BCD9E0");
  BW(5, 8, 24, 25.5, "#8FB8C4");
  for (let i = 8; i < 12; i += .5) BW(i, i + .03, 14, 26, "#B5CFA5");
  for (let h = 18; h < 26; h += 4) BW(8, 12, h, h + .5, "#B5CFA5");
  BW(8, 12, 26, 27, "#9DBB8B");
  LW(0, 10, 0, 3, "#6E4630"); BW(0, 12, 0, 3, "#6E4630");
  q([P(0, 0, WALL_H), P(0, 10, WALL_H), P(-.3, 10, WALL_H), P(-.3, -.3, WALL_H), P(12, -.3, WALL_H), P(12, 0, WALL_H)], "#5A3B26");
  q([P(0, 10, WALL_H), P(-.3, 10, WALL_H), P(-.3, 10, 0), P(0, 10, 0)], "#4A301F");
  q([P(12, -.3, WALL_H), P(12, 0, WALL_H), P(12, 0, 0), P(12, -.3, 0)], "#4A301F");
  // windows: glass follows the sky; stars at night, a sun glint by day
  const star = sky.stars ? "#FFF3B0" : sky.sun ? "#FFFFFF" : sky.glass;
  const winL = (j0: number, j1: number, h0: number, h1: number, curtain: string) => {
    LW(j0 - .15, j1 + .15, h0 - 2, h1 + 2, "#5A3B26"); LW(j0, j1, h0, h1, sky.glass);
    const m = (j0 + j1) / 2; LW(m - .04, m + .04, h0, h1, "#5A3B26"); LW(j0, j1, (h0 + h1) / 2 - .5, (h0 + h1) / 2 + .5, "#5A3B26");
    LW(j0 + .25, j0 + .33, h1 - 5, h1 - 3.5, star); LW(j1 - .5, j1 - .42, h0 + 4, h0 + 5.5, star);
    LW(j0 - .35, j0 + .1, h0 - 4, h1 + 3, curtain); LW(j1 - .1, j1 + .35, h0 - 4, h1 + 3, curtain); LW(j0 - .45, j1 + .45, h1 + 3, h1 + 4.5, "#8A5A3A");
  };
  const winB = (i0: number, i1: number, h0: number, h1: number) => {
    BW(i0 - .12, i1 + .12, h0 - 2, h1 + 2, "#FFFFFF"); BW(i0, i1, h0, h1, sky.glass);
    const m = (i0 + i1) / 2; BW(m - .04, m + .04, h0, h1, "#FFFFFF");
    BW(i0 + .2, i0 + .3, h1 - 5, h1 - 3.5, star); BW(i1 - .3, i1 - .22, h0 + 3, h0 + 4.5, star);
  };
  winL(3.0, 4.5, 16, 36, "#E8A0B4");
  LW(.95, 2.05, 24, 35, "#5A3B26"); LW(1.03, 1.97, 25, 34, "#F7E08F"); LW(1.2, 1.8, 26, 31, "#E07A5F");
  BW(1.2, 2.2, 22, 32, "#5A3B26"); BW(1.28, 2.12, 23, 31, "#9FD3F0"); BW(1.28, 2.12, 23, 26, "#7FB069");
  BW(7.1, 7.8, 20, 36, "#C9D3D8"); BW(7.16, 7.74, 21.5, 34.5, "#EAF4F7"); BW(7.25, 7.35, 28, 33, "#FFFFFF");
  BW(5.4, 6.6, 16, 17, "#AAB6BD"); BW(5.6, 5.9, 8, 16, "#E07A5F"); BW(6.1, 6.4, 9, 16, "#F7E08F");
  BW(8.12, 8.9, 28, 40, "#A87B4C"); BW(8.17, 8.5, 29, 39, "#C9955E"); BW(8.55, 8.86, 29, 39, "#C9955E");
  BW(10.9, 11.9, 33, 40, "#A87B4C"); BW(10.95, 11.85, 34, 39, "#C9955E");
  winB(9.95, 10.8, 24, 38);
  BW(11.05, 11.35, 24, 30, "#FFFFFF"); BW(11.1, 11.3, 24.5, 29.5, "#F4F0E6");
  winL(5.3, 6.0, 22, 38, "#C0504D");
  LW(6.5, 7.7, 26, 36, "#5A3B26"); LW(6.58, 7.62, 27, 35, "#8FC0E0"); LW(6.62, 7.58, 27, 30, "#7FB069"); LW(7.0, 7.25, 30, 33, "#F2C94C");
  LW(8.7, 9.1, 38, 41.5, "#FFFFFF"); LW(8.75, 9.05, 38.5, 41, "#F4F0E6");
  // rugs
  const rug = (i: number, j: number, w: number, d: number, c: string) => tile(i, j, i + w, j + d, c, .4);
  rug(1.3, 2.7, 2.5, 1.9, "#F4D35E"); rug(1.5, 2.9, 2.1, 1.5, "#F7E08F"); rug(1.7, 3.1, 1.7, 1.1, "#F4D35E");
  rug(5.3, 1.25, 1.5, .6, "#7FB069"); rug(5.4, 1.33, 1.3, .44, "#97C47F");
  rug(1.2, 5.8, 3.1, 2.9, "#C0504D"); rug(1.4, 6, 2.7, 2.5, "#E07A5F"); rug(1.8, 6.4, 1.9, 1.7, "#EE9A7F");
  rug(8.9, 6.0, 2.9, 2.9, "#8E7CC3"); rug(9.1, 6.2, 2.5, 2.5, "#A897D6");
  rug(5.3, 7.0, 2.1, 1.9, "#7FB0C9"); rug(5.45, 7.15, 1.8, 1.6, "#9CC7DB");
}

const IW: Shade = S("#5A3B26", "#E8D2AE", "#D6BC94"), DK: Shade = S("#8A5A3A", "#6E4630", "#5A3B26"), FR: Shade = S("#5A3B26", "#6E4630", "#6E4630");

/** Interior walls (split into one-tile pieces so they sort well), door frames and the cut-away front walls. */
export function buildStructure(b: Builder) {
  b.reset();
  const wallI = (i: number, j0: number, j1: number) => { for (let j = j0; j < j1 - .001; j = Math.min(j1, Math.floor(j + 1))) b.box(i, j, .2, Math.min(j1, Math.floor(j + 1)) - j, 12, IW); };
  const wallJ = (j: number, i0: number, i1: number) => { for (let i = i0; i < i1 - .001; i = Math.min(i1, Math.floor(i + 1))) b.box(i, j, Math.min(i1, Math.floor(i + 1)) - i, .2, 12, IW); };
  wallJ(4.9, 0, 3); wallJ(4.9, 4, 5.1); wallJ(4.9, 5.1, 6); wallJ(4.9, 7, 8.1);
  wallI(4.9, 0, 4.9); wallI(7.9, 0, 4.9); wallI(7.9, 5.1, 6); wallI(7.9, 8.9, 10);
  for (let i = 0; i < COLS; i++) b.box(i, 10, 1, .2, 5, FR);
  for (let j = 0; j < ROWS; j++) b.box(12, j, .2, 1, 5, FR);
  b.box(12, 10, .2, .2, 5, FR);
  for (const [a, c] of [[3, 4], [6, 7]]) { b.box(a, 4.88, .08, .24, 30, DK); b.box(c - .08, 4.88, .08, .24, 30, DK); b.box(a + .08, 4.88, c - a - .16, .24, 3, DK, 27); }
  b.box(7.88, 6, .24, .08, 30, DK); b.box(7.88, 8.82, .24, .08, 30, DK); b.box(7.88, 6.08, .24, 2.74, 3, DK, 27);
}

/* ---------- walking grid: half-tile cells, walls block the edges between cells ---------- */
export const CELL = .5, GW = COLS / CELL, GH = ROWS / CELL; // 24 × 20 cells
/** Wall lines: [axis, line position, from, to] — axis "j" = a wall along i at j = line. */
const WALLS: readonly (readonly ["i" | "j", number, number, number])[] = [
  ["j", 5, 0, 3], ["j", 5, 4, 6], ["j", 5, 7, 8],   // bedroom / bathroom ↔ living room (doors at i 3–4 and 6–7)
  ["i", 5, 0, 5], ["i", 8, 0, 5],                   // bedroom | bathroom | kitchen
  ["i", 8, 5, 6], ["i", 8, 9, 10],                  // living room ↔ dining area (opening at j 6–9)
];
/** Can the Friend step from cell (a, b) to the orthogonal neighbour (c, d)? (walls only; furniture is checked separately) */
export function edgeOpen(a: number, b: number, c: number, d: number): boolean {
  if (c < 0 || d < 0 || c >= GW || d >= GH) return false;
  for (const [axis, line, from, to] of WALLS) {
    if (axis === "j" && a === c && Math.min(b, d) * CELL + CELL === line) { const mid = (a + .5) * CELL; if (mid > from && mid < to) return false; }
    if (axis === "i" && b === d && Math.min(a, c) * CELL + CELL === line) { const mid = (b + .5) * CELL; if (mid > from && mid < to) return false; }
  }
  return true;
}
