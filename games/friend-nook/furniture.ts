/** Furniture: pixel-box models, footprints, stand spots and use poses. Every piece is written at its default
 * position in the starting house; `Builder.place` moves (and mirrors) it for Buy mode. */
import { Builder, S, project, type Part } from "./iso.js";
import { CATALOG } from "./catalog.js";
import { FX, drawBurners, drawRecord, drawTv } from "./fx.js";

export type Pose = Readonly<{ i: number; j: number; z: number; face: readonly [number, number]; lie?: boolean }>;
export type FurnitureDef = Readonly<{
  id: string;
  name: string;
  origin: readonly [number, number];              // default position of the footprint's corner
  foot: readonly [number, number, number, number]; // blocking footprint [i0, j0, i1, j1] at the default position
  spots: readonly (readonly [number, number])[];  // where the Friend stands to use it (default position)
  pose?: Pose;                                     // where the Friend sits/lies while using it (default position)
  wall?: boolean;                                  // must stand against a wall
  build: (b: Builder) => void;
}>;

const WOOD = S("#B7875A", "#9A6E45", "#835C38"), DK = S("#8A5A3A", "#6E4630", "#5A3B26"), WHT = S("#FFFFFF", "#E6E6EE", "#D2D2DE");
const RED = S("#E07A5F", "#C0504D", "#A33F3C"), YEL = S("#FFE08A", "#F2C94C", "#D9AE36"), GOLD = S("#F2C94C", "#D9AE36", "#C09A2A");
const POT = S("#C8763F", "#A85F30", "#8E4E26"), LEAF = S("#7FBF6A", "#6FAE5C", "#5E9A4C"), LEAF2 = S("#8FCF7A", "#7FBF6A", "#6FAE5C"), LEAF3 = S("#9FDF8A", "#8FCF7A", "#7FBF6A");
const STEEL = S("#C9D3D8", "#AAB6BD", "#96A3AB"), DARK = S("#5B5B66", "#4A4A55", "#3A3A44"), BLK = S("#3A3A44", "#2E2E36", "#23232B");
const BLUE = S("#6C97C4", "#4F7CAC", "#3D6592"), BLUE2 = S("#8CB3DA", "#6C97C4", "#4F7CAC"), BLUE3 = S("#4F7CAC", "#3D6592", "#34587F");
const PURP = S("#8E7CC3", "#7462A8", "#5F4F93"), CREAM = S("#F0EBDD", "#DCD3BE", "#C9BEA6"), TOPC = S("#F7F4EC", "#D9CFB8", "#C4B89C");
const GREEN = S("#7FB069", "#6A9A56", "#5A8848"), SKY = S("#9CC7DB", "#7FB0C9", "#6497B0"), PINK = S("#F4A6A0", "#E07A5F", "#C0504D");
const MINT = S("#8FBF8A", "#6FA86A", "#5A9056"), MINT2 = S("#A9D3A4", "#8FBF8A", "#6FA86A"), WICKER = S("#E9D9B8", "#D6C29C", "#C0AA82");
const THIN = .0005;

let ballLift = 0, hutchItems: readonly string[] = [];
/** Colors of the keepsakes standing in the hutch (up to 10). */
export function setHutchItems(colors: readonly string[]) { hutchItems = colors.slice(0, 10); }
/** Height of the bouncing ball while the Friend plays with it. */
export function setBallLift(v: number) { ballLift = v; }
function drawBall(ctx: CanvasRenderingContext2D, p: Part) {
  const [x, y] = project((p.i0 + p.i1) / 2, (p.j0 + p.j1) / 2, 0);
  ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.beginPath(); ctx.ellipse(x, y, 4, 1.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#E07A5F"; ctx.strokeStyle = "#2b1d14"; ctx.lineWidth = .5; ctx.beginPath(); ctx.arc(x, y - 3 - ballLift, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#FFF6E6"; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x - 3, y - 3 - ballLift); ctx.quadraticCurveTo(x, y - 1.4 - ballLift, x + 3, y - 3 - ballLift); ctx.stroke();
}
function chair(b: Builder, i: number, j: number, back: "n" | "s") {
  const w = .5, d = .5;
  b.legs(i + .03, j + .03, w - .06, d - .06, 6, WOOD, .07);
  b.box(i, j, w, d, 1, WOOD, 6); b.box(i + .06, j + .06, w - .12, d - .12, .7, RED, 7);
  if (back === "n") { b.box(i, j, w, .08, 8.5, WOOD, 7); b.box(i + .04, j, w - .08, .08, 1.5, RED, 12, false); }
  else { b.box(i, j + d - .08, w, .08, 8.5, WOOD, 7); b.fj(j + d, i + .08, i + w - .08, 11, 13.5, RED[1]); }
}
function stool(b: Builder, i: number, j: number) {
  b.legs(i + .04, j + .04, .32, .32, 8, DK, .06); b.box(i + .1, j + .1, .2, .2, .8, DK, 3); b.box(i, j, .4, .4, 1.2, RED, 8);
}
function table(b: Builder, i: number, j: number, w: number, d: number, h: number) {
  b.legs(i + .06, j + .06, w - .12, d - .12, h - 1.2, WOOD, .12); b.box(i, j, w, d, 1.2, WOOD, h - 1.2); b.fj(j + d, i, i + w, h - 1.2, h - .9, WOOD[2]);
}
function plant(b: Builder, i: number, j: number, s = 1) {
  b.box(i + .07 * s, j + .07 * s, .42 * s, .42 * s, 5, POT); b.box(i, j, .56 * s, .56 * s, 7 * s, LEAF, 5);
  b.box(i + .09 * s, j + .09 * s, .38 * s, .38 * s, 6 * s, LEAF2, 5 + 7 * s); b.box(i + .17 * s, j + .17 * s, .22 * s, .22 * s, 4 * s, LEAF3, 5 + 13 * s);
}

export const FURNITURE: readonly FurnitureDef[] = [
  /* ---------------- bedroom ---------------- */
  { id: "bed", name: "Bed", origin: [.12, .7], foot: [.12, .7, 2.42, 2.3], spots: [[1.5, 2.75], [2.7, 2.6]], wall: true,
    pose: { i: 1.55, j: 1.5, z: 9.2, face: [1, 1], lie: true },
    build: b => {
      const i = .12, j = .7, L = 2.3, W = 1.6;
      b.box(i, j, .18, .12, 19, DK); b.box(i, j + W - .12, .18, .12, 19, DK); b.box(i, j + .12, .14, W - .24, 15, WOOD, 2); b.box(i, j, .18, W, 1.5, DK, 19);
      b.box(i + L - .14, j, .14, .12, 9, DK); b.box(i + L - .14, j + W - .12, .14, .12, 9, DK); b.box(i + L - .12, j + .12, .1, W - .24, 5, WOOD, 2);
      b.box(i + .18, j + .05, L - .32, W - .1, 3, WOOD, 2); b.box(i + .2, j + .08, L - .36, W - .16, 3, WHT, 5);
      const A = FX.accent; b.box(i + .95, j + .06, L - 1.1, W - .12, 1.3, S(A.top, A.left, A.right), 8); b.box(i + .95, j + .06, .28, W - .12, 1.5, S(A.light, A.top, A.left), 8.1);
      b.fj(j + W - .06, i + 1.25, i + L - .15, 6.5, 9.3, A.left);
      b.box(i + .3, j + .18, .5, .58, 2.4, WHT, 8); b.box(i + .3, j + .84, .5, .58, 2.4, WHT, 8);
    } },
  { id: "nightstand", name: "Nightstand", origin: [.12, 2.45], foot: [.12, 2.45, .74, 3.05], spots: [], wall: true,
    build: b => { b.box(.12, 2.45, .62, .6, 9, WOOD); b.fj(3.05, .18, .68, 4.5, 8, "#C9955E"); b.tp(.35, 2.9, .5, 2.95, 6.3, "#5A3B26"); b.box(.3, 2.62, .12, .12, 5, STEEL, 9); b.box(.22, 2.54, .3, .3, 4.5, YEL, 14); } },
  { id: "wardrobe", name: "Wardrobe", origin: [3.11, .06], foot: [3.11, .06, 4.89, .8], spots: [[4.0, 1.25]], wall: true,
    build: b => {
      const i = 3.15, j = .08, w = 1.7, d = .66, h = 36;
      b.box(i, j, w, d, h, WOOD); b.box(i - .04, j - .02, w + .08, d + .06, 1.8, DK, h);
      b.fj(j + d, i + .08, i + w / 2 - .03, 3, h - 2.5, "#A57A4F"); b.fj(j + d, i + w / 2 + .03, i + w - .08, 3, h - 2.5, "#A57A4F");
      b.fj(j + d + THIN, i + w / 2 - .16, i + w / 2 - .1, 16, 21, "#F2C94C"); b.fj(j + d + THIN, i + w / 2 + .1, i + w / 2 + .16, 16, 21, "#F2C94C");
      b.box(i + .05, j + d, .1, .02, 1.5, DK, 0, false); b.box(i + w - .15, j + d, .1, .02, 1.5, DK, 0, false);
    } },
  { id: "toychest", name: "Toy chest", origin: [2.52, .92], foot: [2.52, .92, 3.13, 2.08], spots: [[3.45, 1.5]],
    build: b => { b.box(2.55, .95, .55, 1.1, 6, RED); b.box(2.52, .92, .61, 1.16, 1.8, GOLD, 6); b.fi(3.13, 1.4, 1.6, 4.5, 7, "#8A5A00"); b.box(2.6, 1.0, .2, .2, 2.5, GREEN, 7.8); } },
  { id: "windowseat", name: "Window seat", origin: [.12, 3.05], foot: [.12, 3.05, .74, 4.45], spots: [[1.2, 3.75]], wall: true,
    pose: { i: .45, j: 3.75, z: 7.6, face: [1, 0] },
    build: b => {
      const i = .12, j = 3.05, w = .62, d = 1.4;
      b.box(i, j, w, d, 6, WOOD); b.fi(i + w, j + .06, j + d / 2 - .03, 1.2, 5, "#A57A4F"); b.fi(i + w, j + d / 2 + .03, j + d - .06, 1.2, 5, "#A57A4F");
      const A = FX.accent;
      b.box(i + .02, j + .03, w - .04, d - .06, 1.6, PINK, 6);
      b.box(i + .04, j + .1, .22, .42, 3.5, S("#FFF6E6", "#EFE2CC", "#DCCBAF"), 7.6); b.box(i + .04, j + .85, .22, .42, 3.5, S(A.light, A.top, A.left), 7.6);
    } },
  { id: "plant-bed", name: "Potted plant", origin: [.13, .05], foot: [.13, .05, .69, .61], spots: [], build: b => plant(b, .13, .05) },
  /* ---------------- bathroom ---------------- */
  { id: "bathtub", name: "Bathtub", origin: [5.15, .1], foot: [5.15, .1, 7.0, 1.1], spots: [[6.05, 1.6]], wall: true,
    pose: { i: 6.075, j: .6, z: -3, face: [1, 1] },
    build: b => {
      const i = 5.15, j = .1, w = 1.85, d = 1.0;
      b.box(i, j, w, d, 9, WHT); b.tp(i + .12, j + .12, i + w - .12, j + d - .12, 9.01, "#8FC6DE"); b.tp(i + .12, j + .12, i + w - .12, j + .28, 9.02, "#B5DCEC");
      b.box(i + .1, j + .35, .14, .3, 4, STEEL, 9); b.box(i + .22, j + .45, .12, .1, 1, STEEL, 12); b.box(i + 1.3, j + .72, .22, .18, 1.6, YEL, 9);
      b.legs(i + .05, j + .05, w - .1, d - .1, 1, GOLD, .14);
    } },
  { id: "bathsink", name: "Sink and mirror", origin: [7.08, .07], foot: [7.08, .07, 7.73, .62], spots: [[7.45, 1.05]], wall: true,
    build: b => { b.box(7.15, .14, .28, .28, 9, WHT); b.box(7.08, .07, .65, .55, 2.6, WHT, 9); b.tp(7.16, .14, 7.65, .52, 11.62, "#9AB8C6"); b.box(7.33, .1, .08, .14, 3, STEEL, 11.6); } },
  { id: "towels", name: "Towel cabinet", origin: [5.1, 2.3], foot: [5.1, 2.3, 5.55, 3.3], spots: [], wall: true,
    build: b => {
      const i = 5.1, j = 2.3, w = .45, d = 1.0, h = 14;
      b.box(i, j, w, d, h, WOOD); b.fi(i + w, j + .06, j + d / 2 - .03, 1.5, h - 1.5, "#A57A4F"); b.fi(i + w, j + d / 2 + .03, j + d - .06, 1.5, h - 1.5, "#A57A4F");
      b.fi(i + w + THIN, j + d / 2 - .12, j + d / 2 - .07, 6, 9, "#F2C94C"); b.fi(i + w + THIN, j + d / 2 + .07, j + d / 2 + .12, 6, 9, "#F2C94C");
      b.box(i + .05, j + .08, .35, .4, 2.2, SKY, h); b.box(i + .05, j + .08, .35, .4, 2.2, PINK, h + 2.2); b.box(i + .08, j + .6, .3, .3, 3.5, WHT, h);
    } },
  { id: "laundry", name: "Laundry basket", origin: [5.25, 3.8], foot: [5.25, 3.8, 5.75, 4.3], spots: [],
    build: b => { b.box(5.25, 3.8, .5, .5, 7, WICKER); b.tp(5.3, 3.85, 5.7, 4.25, 7.1, "#9CC7DB"); } },
  /* ---------------- kitchen ---------------- */
  { id: "counter", name: "Stove and counter", origin: [8.1, .05], foot: [8.1, .05, 10.9, 1.0], spots: [[9.4, 1.5], [10.4, 1.5]], wall: true,
    build: b => {
      const i = 8.12, j = .05, w = 2.75, d = .9, h = 13;
      b.box(i, j, w, d, h - 1, CREAM); b.box(i - .02, j, w + .04, d + .05, 1.2, TOPC, h - 1);
      for (const [a, c] of [[.08, .78], [1.78, 2.26], [2.3, 2.68]]) b.fj(j + d, i + a, i + c, 1.5, h - 2.3, "#C9955E");
      b.box(i + .03, j + d - .02, w - .06, .04, 1.2, DK, 0, false);
      b.fj(j + d, i + .85, i + 1.7, 1.5, h - 2.3, "#3A3A44"); b.fj(j + d + THIN, i + .95, i + 1.6, 3.5, 8.5, "#1E2A4A");
      for (let n = 0; n < 4; n++) b.fj(j + d + THIN, i + .9 + n * .21, i + .98 + n * .21, 9.3, 10.2, "#D2D2DE");
      b.tp(i + .85, j + .1, i + 1.7, j + .8, h + .25, "#3A3A44");
      b.tpFx(i + .9, j + .15, i + 1.65, j + .75, h + .3, drawBurners);
      b.box(i + 1.3, j + .45, .3, .3, 2.5, RED, h + .3);
      b.tp(i + 1.9, j + .18, i + 2.55, j + .72, h + .25, "#8B99A6"); b.tp(i + 1.97, j + .24, i + 2.48, j + .66, h + .3, "#6E7B86");
      b.box(i + 2.18, j + .08, .08, .08, 4, STEEL, h); b.box(i + 2.18, j + .08, .08, .28, .8, STEEL, h + 3.6);
      b.box(i + .2, j + .2, .3, .25, 3.5, WHT, h); b.box(i + .25, j + .5, .2, .2, 2.5, GREEN, h);
      b.box(9.0, .05, .84, .5, 4, STEEL, 31); b.box(9.25, .05, .34, .3, 9, STEEL, 35);
    } },
  { id: "fridge", name: "Fridge", origin: [10.95, .05], foot: [10.95, .05, 11.9, 1.0], spots: [[11.4, 1.5]], wall: true,
    build: b => {
      const i = 10.95, j = .05, w = .95, d = .95, h = 32;
      b.box(i, j, w, d, h, S("#EEF3F6", "#CFDAE2", "#B7C5CF")); b.fj(j + d, i + .04, i + w - .04, 21.5, 22.2, "#AAB6BD");
      b.box(i + .1, j + d, .05, .04, 6, STEEL, 12); b.box(i + .1, j + d, .05, .04, 4, STEEL, 24);
      b.fj(j + d + THIN, i + .5, i + .62, 15, 17.5, "#E07A5F"); b.fj(j + d + THIN, i + .66, i + .78, 13, 15, "#F2C94C"); b.fj(j + d + THIN, i + .4, i + .5, 25, 27, "#7FB069");
    } },
  { id: "island", name: "Breakfast bar", origin: [8.95, 2.35], foot: [8.95, 2.35, 11.2, 3.5], spots: [],
    build: b => {
      const i = 9.05, j = 2.4, w = 2.1, d = .85, h = 12;
      b.box(i, j, w, d, h - 1, CREAM); b.box(i - .05, j - .05, w + .1, d + .25, 1.2, TOPC, h - 1);
      b.fj(j + d, i + .1, i + w - .1, 1.2, h - 2.2, "#C9955E"); for (const a of [.7, 1.4]) b.fj(j + d + THIN, i + a - .02, i + a + .02, 1.2, h - 2.2, "#A87B4C");
      b.box(i + .35, j + .25, .45, .4, 1, WICKER, h + .2); b.box(i + .4, j + .3, .15, .15, 1.5, RED, h + 1.2); b.box(i + .58, j + .33, .15, .15, 1.5, YEL, h + 1.2); b.box(i + .48, j + .45, .15, .15, 1.5, GREEN, h + 1.2);
      b.box(i + 1.45, j + .3, .28, .28, .6, WHT, h + .2);
    } },
  { id: "stool", name: "Bar stool", origin: [9.3, 3.55], foot: [9.3, 3.55, 9.7, 3.95], spots: [[9.5, 4.3]],
    pose: { i: 9.5, j: 3.75, z: 9.2, face: [-1, -1] }, build: b => stool(b, 9.3, 3.55) },
  /* ---------------- dining ---------------- */
  { id: "dtable", name: "Dining table", origin: [9.3, 6.55], foot: [9.3, 6.55, 10.9, 7.7], spots: [],
    build: b => {
      table(b, 9.3, 6.55, 1.6, 1.15, 11);
      for (const [a, c] of [[9.45, 6.7], [10.3, 6.7], [9.45, 7.25], [10.3, 7.25]]) { b.tp(a, c, a + .35, c + .35, 11.1, "#FFFFFF"); b.tp(a + .07, c + .07, a + .28, c + .28, 11.2, "#E6E6EE"); }
      b.box(10.02, 7.02, .16, .16, 3, SKY, 11); b.box(9.97, 6.97, .26, .26, 2, PINK, 14);
    } },
  { id: "chair-n", name: "Dining chair", origin: [9.45, 6.0], foot: [9.45, 6.0, 9.95, 6.5], spots: [[9.7, 5.6]],
    pose: { i: 9.7, j: 6.25, z: 7.7, face: [0, 1] }, build: b => chair(b, 9.45, 6.0, "n") },
  { id: "chair-s", name: "Dining chair", origin: [9.45, 7.75], foot: [9.45, 7.75, 9.95, 8.25], spots: [[9.7, 8.65]],
    pose: { i: 9.7, j: 8.0, z: 7.7, face: [0, -1] }, build: b => chair(b, 9.45, 7.75, "s") },
  { id: "hutch", name: "Keepsake hutch", origin: [8.09, 8.92], foot: [8.09, 8.92, 8.65, 9.98], spots: [[9.0, 9.45]], wall: true,
    build: b => {
      const i = 8.12, j = 8.95, w = .5, d = 1.0, h = 26;
      b.box(i, j, w, d, h, WOOD); b.box(i - .03, j - .03, w + .06, d + .06, 1.6, DK, h);
      b.fi(i + w, j + .06, j + d - .06, 1.5, 10, "#A57A4F"); b.fi(i + w, j + .06, j + d - .06, 11.5, h - 1.5, "#D6ECF2"); b.fi(i + w + THIN, j + .06, j + d - .06, 18.3, 18.9, "#835C38");
      hutchItems.forEach((c, n) => { const row = n < 5 ? 0 : 1, col = n % 5, z = row ? 19.4 : 12.2; b.fi(i + w + 2 * THIN, j + .1 + col * .17, j + .22 + col * .17, z, z + 4 + (n % 2), c); b.fi(i + w + 3 * THIN, j + .12 + col * .17, j + .15 + col * .17, z + 2.4, z + 3.4, "#FFFFFF"); });
    } },
  { id: "plant-dining", name: "Potted plant", origin: [11.28, 9.18], foot: [11.28, 9.18, 11.88, 9.78], spots: [], build: b => plant(b, 11.28, 9.18, 1) },
  /* ---------------- living room ---------------- */
  { id: "tv", name: "TV", origin: [.12, 6.2], foot: [.12, 6.2, .74, 8.0], spots: [[1.3, 7.1]], wall: true,
    build: b => {
      const i = .12, j = 6.2, w = .62, d = 1.8;
      b.box(i, j, w, d, 7, DK); b.fi(i + w, j + .08, j + .85, 1.2, 6, "#8A5A3A"); b.fi(i + w, j + .95, j + d - .08, 1.2, 6, "#8A5A3A");
      b.fi(i + w + THIN, j + .45, j + .55, 3, 4, "#F2C94C"); b.fi(i + w + THIN, j + 1.35, j + 1.45, 3, 4, "#F2C94C");
      b.box(i + .25, j + .8, .2, .2, 1.2, BLK, 7); b.box(i + .3, j + .1, .12, 1.6, 11, BLK, 8.2); b.fiFx(i + .42, j + .18, j + 1.62, 9.2, 18.2, drawTv);
      b.box(i + .3, j + 1.2, .25, .3, 1, WHT, 7); b.box(i + .36, j + 1.0, .14, .12, .6, RED, 7);
    } },
  { id: "sofa", name: "Sofa", origin: [3.2, 6.1], foot: [3.2, 6.1, 4.25, 8.1], spots: [[2.95, 6.85], [2.95, 7.55]],
    pose: { i: 3.55, j: 7.1, z: 7.6, face: [-1, 0] },
    build: b => {
      const i = 3.2, j = 6.1, w = 1.05, d = 2.0;
      b.legs(i + .05, j + .05, w - .1, d - .1, 1, DK, .1); b.box(i, j + .28, w - .32, d - .56, 4, BLUE, 1);
      b.box(i + .1, j + .3, .6, .7, 1.6, BLUE2, 5); b.box(i + .1, j + 1.0, .6, .7, 1.6, BLUE2, 5);
      b.box(i + w - .32, j, .32, d, 13, BLUE, 1); b.box(i, j, w - .32, .28, 8, BLUE3, 1); b.box(i, j + d - .28, w - .32, .28, 8, BLUE3, 1);
      b.box(i + .45, j + .4, .2, .45, 4, GOLD, 6.6); b.box(i + .45, j + 1.2, .2, .45, 4, RED, 6.6); b.fj(j + d, i + .1, i + w - .42, 2, 4, "#34587F");
    } },
  { id: "ctable", name: "Coffee table", origin: [1.75, 6.55], foot: [1.75, 6.55, 2.6, 7.8], spots: [],
    build: b => { table(b, 1.75, 6.55, .85, 1.25, 6); b.box(1.95, 6.8, .18, .18, 2.2, WHT, 6); b.tp(1.98, 6.83, 2.1, 6.95, 8.25, "#6E4630"); b.box(2.2, 7.25, .3, .4, .6, GREEN, 6); } },
  { id: "bookshelf", name: "Bookshelf", origin: [.1, 8.55], foot: [.1, 8.55, .6, 9.85], spots: [[.8, 9.75]], wall: true,
    build: b => {
      const i = .1, j = 8.55, w = .5, d = 1.3, h = 34;
      b.box(i, j, w, d, h, WOOD); b.fi(i + w, j + .06, j + d - .06, 1.5, h - 1.5, "#6E4630");
      const cols = ["#C0504D", "#4F7CAC", "#F2C94C", "#7FB069", "#8E7CC3", "#E07A5F", "#6FC3DF"];
      for (let s = 0; s < 4; s++) {
        const z = 2 + s * 8; b.fi(i + w + THIN, j + .06, j + d - .06, z + 6.2, z + 7.2, "#9A6E45");
        let jj = j + .1, n = 0;
        while (jj < j + d - .2) { const bw = .1 + ((s * 7 + n * 3) % 3) * .03, bh = 4 + ((s + n) % 3); b.fi(i + w + 2 * THIN, jj, jj + bw, z, z + bh, cols[(s * 3 + n) % cols.length]); jj += bw + .015; n++; }
      }
      b.fi(i + w + 3 * THIN, j + .8, j + 1.1, 26, 29, "#F4A6A0");
    } },
  { id: "armchair", name: "Reading chair", origin: [1.0, 8.6], foot: [1.0, 8.6, 1.9, 9.5], spots: [[2.3, 9.05]],
    pose: { i: 1.5, j: 9.05, z: 6.6, face: [1, 0] },
    build: b => {
      const i = 1.0, j = 8.6, w = .9, d = .9;
      b.legs(i + .05, j + .05, w - .1, d - .1, 1, DK, .1); b.box(i + .25, j + .2, w - .25, d - .4, 4, MINT, 1); b.box(i + .25, j + .2, .55, .5, 1.5, MINT2, 5);
      b.box(i, j, .25, d, 12, MINT, 1); b.box(i + .25, j, w - .25, .2, 8, MINT, 1); b.box(i + .25, j + d - .2, w - .25, .2, 8, MINT, 1);
      b.box(i + .35, j + .3, .3, .35, .8, GOLD, 6.5);
    } },
  { id: "floorlamp", name: "Floor lamp", origin: [.9, 8.05], foot: [.9, 8.05, 1.3, 8.45], spots: [],
    build: b => { b.box(.95, 8.1, .3, .3, .8, DK); b.box(1.06, 8.21, .08, .08, 26, DK); b.box(.9, 8.05, .4, .4, 6, YEL, 25); } },
  { id: "record", name: "Record player", origin: [5.2, 5.12], foot: [5.2, 5.12, 5.95, 5.62], spots: [[5.6, 6.15]], wall: true,
    build: b => {
      const i = 5.2, j = 5.12, w = .75, d = .5;
      b.box(i, j, w, d, 8, WOOD); b.fj(j + d, i + .06, i + w - .06, 1.5, 7, "#A57A4F"); b.fj(j + d + THIN, i + .33, i + .42, 4, 5, "#F2C94C");
      b.box(i + .08, j + .06, .6, .4, 1.2, BLK, 8); b.tpFx(i + .16, j + .1, i + .5, j + .42, 9.3, drawRecord); b.box(i + .56, j + .1, .05, .3, .8, STEEL, 9.2);
    } },
  { id: "plant-living", name: "Potted plant", origin: [.12, 5.12], foot: [.12, 5.12, .78, 5.78], spots: [], build: b => plant(b, .12, 5.12, 1.15) },
  { id: "ball", name: "Ball", origin: [6.8, 7.5], foot: [6.8, 7.5, 7.0, 7.7], spots: [[6.3, 8.1]],
    build: b => b.custom(6.8, 7.5, .2, .2, 6, drawBall) },
];

export const DEF: Readonly<Record<string, FurnitureDef>> = Object.fromEntries([...FURNITURE, ...CATALOG.map(c => c.def)].map(f => [f.id, f]));

/** A piece standing in the house. */
export type Placed = { uid: string; def: string; i: number; j: number; swap: boolean };

/** The furnished starting house (the design mockup). */
export function starterHouse(): Placed[] {
  const out: Placed[] = FURNITURE.map(f => ({ uid: f.id, def: f.id, i: f.origin[0], j: f.origin[1], swap: false }));
  const add = (uid: string, def: string, i: number, j: number) => out.push({ uid, def, i, j, swap: false });
  add("stool-2", "stool", 10.4, 3.55); add("chair-n2", "chair-n", 10.25, 6.0); add("chair-s2", "chair-s", 10.25, 7.75);
  return out;
}

/** Transform a default-position point of a piece to where the placed piece has it. */
export function placePoint(p: Placed, i: number, j: number): [number, number] {
  const d = DEF[p.def], di = i - d.origin[0], dj = j - d.origin[1];
  return p.swap ? [p.i + dj, p.j + di] : [p.i + di, p.j + dj];
}
export function footprint(p: Placed): [number, number, number, number] {
  const f = DEF[p.def].foot, [a, b] = placePoint(p, f[0], f[1]), [c, d] = placePoint(p, f[2], f[3]);
  return [Math.min(a, c), Math.min(b, d), Math.max(a, c), Math.max(b, d)];
}
export function buildPlaced(b: Builder, p: Placed) {
  const d = DEF[p.def]; b.place(p.uid, d.origin[0], d.origin[1], p.i, p.j, p.swap); d.build(b); b.reset();
}

