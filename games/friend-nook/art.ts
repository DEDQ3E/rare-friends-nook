/** Pixel art helpers: the Friend (canonical frames, black mask + white halo, outfit layered on top), bubbles
 * and small icons. All artwork is authored in code. */
import { drawOutfit, type Facing, type Outfit } from "./wardrobe.js";

export const INK = "#1c1c1c";
export type Pixmap = Readonly<{ rows: readonly string[]; palette: Readonly<Record<string, string>> }>;

export function drawPixmap(ctx: CanvasRenderingContext2D, art: Pixmap, x: number, y: number, scale = 1) {
  art.rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = art.palette[row[i]]; if (c) { ctx.fillStyle = c; ctx.fillRect(x + i * scale, y + j * scale, scale, scale); } } });
}
export function pixmapUrl(art: Pixmap, scale = 4): string {
  const w = Math.max(...art.rows.map(r => r.length)), h = art.rows.length;
  const c = document.createElement("canvas"); c.width = w * scale; c.height = h * scale;
  const g = c.getContext("2d"); if (!g) return ""; drawPixmap(g, art, 0, 0, scale); return c.toDataURL();
}

export const FRIEND_MASK = "#111111", FRIEND_HALO = "#ffffff";
/** The Friend's canonical frame as a black mask with a white one-pixel halo (1 unit per sprite pixel). */
export function drawFriendPixels(ctx: CanvasRenderingContext2D, rows: readonly string[], x: number, y: number) {
  const on = (i: number, j: number) => j >= 0 && j < 16 && i >= 0 && i < 16 && rows[j][i] === "#";
  ctx.fillStyle = FRIEND_HALO;
  for (let j = -1; j < 17; j++) for (let i = -1; i < 17; i++) {
    if (on(i, j)) continue;
    if (on(i + 1, j) || on(i - 1, j) || on(i, j + 1) || on(i, j - 1)) ctx.fillRect(x + i, y + j, 1, 1);
  }
  ctx.fillStyle = FRIEND_MASK;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) if (on(i, j)) ctx.fillRect(x + i, y + j, 1, 1);
}
export function drawFriend(ctx: CanvasRenderingContext2D, rows: readonly string[], x: number, y: number, outfit: Outfit | undefined, facing: Facing, clock: number, moving: boolean) {
  drawFriendPixels(ctx, rows, x, y);
  drawOutfit(ctx, rows, x, y, outfit, facing, clock, moving);
}
/** Lowest filled row of a frame (the Friend's feet), so it stands on the floor whatever its shape. */
export function feetRow(rows: readonly string[]): number {
  for (let j = 15; j >= 0; j--) if (rows[j]?.includes("#")) return j;
  return 15;
}
export function topRow(rows: readonly string[]): number {
  for (let j = 0; j < 16; j++) if (rows[j]?.includes("#")) return j;
  return 0;
}

/* ---------- icons (9 × 9) for wishes, menus and emotes ---------- */
const k = INK;
export const ICONS: Readonly<Record<string, Pixmap>> = {
  moon: { palette: { m: "#FFE9A8", s: "#D8C07A" }, rows: ["..mmm....", ".mms.....", "mms......", "mm.......", "mm.......", "mms....m.", ".mms..mm.", "..mmmmm..", "........."] },
  zzz: { palette: { k: "#3A3D6E" }, rows: ["kkkk.....", "..k......", ".k.......", "kkkk.....", "....kkk..", ".....k...", "....kkk..", ".........", "........."] },
  hat: { palette: { k, a: "#8E7CC3", b: "#FFD23F" }, rows: ["....k....", "...kak...", "...kak...", "..kaaak..", "..kbbbk..", ".kaaaaak.", "kkkkkkkkk", ".........", "........."] },
  star: { palette: { y: "#FFD23F", o: "#FF9A3C" }, rows: ["....y....", "....y....", "...yyy...", "yyyyoyyyy", ".yyoooyy.", "..yyoyy..", "..yy.yy..", ".yy...yy.", "........."] },
  camera: { palette: { k: "#1c1c1c", b: "#5B6770", l: "#7FC8F8", w: "#FFFFFF", r: "#E07A5F" }, rows: [".........", "..kkk....", "kkkkkkkkk", "kbbkkkbrk", "kbklwkbbk", "kbkllkbbk", "kbbkkkbbk", "kkkkkkkkk", "........."] },
  cloud: { palette: { c: "#FFFFFF", s: "#B7CDE6" }, rows: [".........", "...cc....", "..cccc.c.", ".cccccccc", "ccccccccc", "sssssssss", ".........", ".........", "........."] },
  toy: { palette: { r: "#E07A5F", y: "#F2C94C", b: "#4F7CAC" }, rows: ["...yyy...", "..yyyyy..", "..yyyyy..", "...yyy...", "rrrr.bbbb", "rrrr.bbbb", "rrrr.bbbb", "rrrr.bbbb", "........."] },
  bath: { palette: { w: "#FFFFFF", b: "#7FB6CE", k: "#8B99A6" }, rows: [".b..b....", "..b..b.b.", ".........", "kkkkkkkkk", "kbbbbbbbk", "kwwwwwwwk", ".kwwwwwk.", "..k...k..", "........."] },
  drop: { palette: { b: "#6EC6FF", w: "#FFFFFF" }, rows: ["....b....", "...bbb...", "...bbb...", "..bbbbb..", ".bbwbbbb.", ".bbwbbbb.", ".bbbbbbb.", "..bbbbb..", "........."] },
  mirror: { palette: { k: "#AAB6BD", g: "#EAF4F7", w: "#FFFFFF" }, rows: ["..kkkkk..", ".kgggggk.", ".kgwgggk.", ".kgwgggk.", ".kgggggk.", ".kgggggk.", "..kkkkk..", "....k....", "...kkk..."] },
  pot: { palette: { k: "#3A3A44", r: "#C0504D", s: "#FFFFFF" }, rows: ["..s.s....", "...s.s...", ".........", "kkkkkkkkk", ".krrrrrk.", ".krrrrrk.", ".krrrrrk.", "..kkkkk..", "........."] },
  apple: { palette: { r: "#E04848", g: "#6FAE5C", w: "#FFB0B0" }, rows: ["....g....", "...g.....", "..rrrrr..", ".rwrrrrr.", ".rrrrrrr.", ".rrrrrrr.", "..rrrrr..", "...r.r...", "........."] },
  plate: { palette: { w: "#FFFFFF", s: "#D2D2DE", o: "#E07A5F", g: "#7FB069" }, rows: [".........", ".........", "..ooogg..", ".wwwwwwww", "wssssssww", ".wwwwwww.", ".........", ".........", "........."] },
  tv: { palette: { k: "#23232B", b: "#6FC3DF", w: "#A8E0F0" }, rows: ["..k...k..", "...k.k...", "kkkkkkkkk", "kbbwbbbbk", "kbwbbbbbk", "kbbbbbbbk", "kkkkkkkkk", "..k...k..", "........."] },
  pad: { palette: { k: "#3A3A44", r: "#E07A5F", y: "#F2C94C" }, rows: [".........", ".kkkkkkk.", "kkkkkkkkk", "kk.kkkrkk", "k...kykrk", "kk.kkkkkk", "kkk...kkk", ".k.....k.", "........."] },
  sofa: { palette: { b: "#4F7CAC", l: "#8CB3DA" }, rows: [".........", ".bbbbbbb.", ".bbbbbbb.", "bblllllbb", "bblllllbb", "bbbbbbbbb", "b.......b", ".........", "........."] },
  book: { palette: { r: "#C0504D", w: "#FFFFFF", k: "#6E4630" }, rows: [".........", "rrrr.rrrr", "rwwwrwwwr", "rwwwrwwwr", "rwwwrwwwr", "rwwwrwwwr", "rrrrkrrrr", "....k....", "........."] },
  note: { palette: { k }, rows: ["...kkkkk.", "...k...k.", "...k...k.", "...k...k.", ".kkk.kkk.", "kkkk.kkk.", ".kk...k..", ".........", "........."] },
  ball: { palette: { r: "#E07A5F", w: "#FFF6E6" }, rows: [".........", "..rrrrr..", ".rrrrrrr.", "rrrrrrrrr", "wwwwwwwww", "rrrrrrrrr", ".rrrrrrr.", "..rrrrr..", "........."] },
  gift: { palette: { r: "#C0504D", y: "#F2C94C", p: "#E07A5F" }, rows: ["..y...y..", "...y.y...", "yyyyyyyyy", "rrrryrrrr", "pppypyppp", "pppypyppp", "pppypyppp", "pppypyppp", "........."] },
  heart: { palette: { r: "#FF4D6D", p: "#FFB3C1" }, rows: [".........", ".rr...rr.", "rprr.rrrr", "rrrrrrrrr", "rrrrrrrrr", ".rrrrrrr.", "..rrrrr..", "...rrr...", "....r...."] },
  chat: { palette: { k, w: "#FFFFFF" }, rows: [".kkkkkkk.", "kwwwwwwwk", "kwkwkwkwk", "kwwwwwwwk", ".kkkkkkk.", "..kk.....", ".k.......", ".........", "........."] },
  dots: { palette: { k: "#3A3D6E" }, rows: [".........", ".........", ".........", ".........", "kk.kk.kk.", "kk.kk.kk.", ".........", ".........", "........."] },
  wow: { palette: { k: "#E04848" }, rows: ["....k....", "....k....", "....k....", "....k....", "....k....", ".........", "....k....", ".........", "........."] },
  sweat: { palette: { b: "#6EC6FF", w: "#FFFFFF" }, rows: ["....b....", "...bbb...", "..bbwbb..", "..bwbbb..", "..bbbbb..", "...bbb...", ".........", ".........", "........."] },
  angry: { palette: { r: "#E04848" }, rows: ["r.r...r.r", ".rr...rr.", "rrr...rrr", ".........", ".........", "rrr...rrr", ".rr...rr.", "r.r...r.r", "........."] },
  fish: { palette: { o: "#FF9A3C", k: INK, b: "#8FC0E0" }, rows: [".........", "b........", ".b..ooo..", "...ooooo.", "o.ooookoo", "ooooooooo", "o.ooooooo", "...ooooo.", "....ooo.."] },
  brush: { palette: { k: "#6E4630", s: "#C9D3D8", r: "#E07A5F", b: "#4F7CAC" }, rows: [".......rr", "......rrr", ".....sss.", "....kss..", "...kk....", "..kk.....", ".kk....bb", "kk....bbb", "k......b."] },
  speaker: { palette: { k }, rows: [".........", "...k...k.", "..kk.k..k", "kkkk..k.k", "kkkk..k.k", "kkkk..k.k", "..kk.k..k", "...k...k.", "........."] },
  mute: { palette: { k, r: "#C0504D" }, rows: [".........", "...k.....", "..kk.....", "kkkk.r..r", "kkkk..rr.", "kkkk..rr.", "..kk.r..r", "...k.....", "........."] },
  sparkle: { palette: { y: "#FFE08A", w: "#FFFFFF" }, rows: ["....y....", "....y....", "...ywy...", "yyywwwyyy", "...ywy...", "....y....", "....y....", ".........", "........."] },
};

/** A speech/thought bubble with an icon, tail pointing down at (cx, bottom). Returns nothing; 13 × 13 box. */
export function drawIconBubble(ctx: CanvasRenderingContext2D, icon: Pixmap, cx: number, bottom: number, thought = false) {
  const x = Math.round(cx) - 7, y = Math.round(bottom) - 15;
  ctx.fillStyle = INK; ctx.fillRect(x + 1, y, 13, 1); ctx.fillRect(x, y + 1, 15, 11); ctx.fillRect(x + 1, y + 12, 13, 1);
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x + 1, y + 1, 13, 11);
  if (thought) { ctx.fillStyle = INK; ctx.fillRect(x + 4, y + 14, 2, 2); ctx.fillRect(x + 2, y + 17, 1, 1); }
  else { ctx.fillStyle = INK; ctx.fillRect(x + 5, y + 13, 5, 1); ctx.fillRect(x + 6, y + 14, 3, 1); ctx.fillRect(x + 7, y + 15, 1, 1); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x + 6, y + 12, 3, 1); ctx.fillRect(x + 7, y + 13, 1, 1); }
  drawPixmap(ctx, icon, x + 3, y + 2);
}
