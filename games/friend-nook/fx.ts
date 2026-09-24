/** Living furniture: animated screens, water, lamps and dials. Furniture builders register "fx faces"
 * (see Builder.fiFx / fjFx / tpFx) whose drawings read this shared state every frame. The Friend's own
 * artwork is never drawn here. */
import type { QuadAt } from "./iso.js";

/** Current time (seconds), the actions being done right now, and darkness 0…1. Updated by the engine. */
export const FX = { t: 0, acts: new Set<string>(), dark: 0, calm: false };

/** Fill the sub-rectangle [u0, u1] × [v0, v1] of a face (u along the face, v up). */
export function quad(ctx: CanvasRenderingContext2D, at: QuadAt, u0: number, v0: number, u1: number, v1: number, color: string) {
  const a = at(u0, v0), b = at(u1, v0), c = at(u1, v1), d = at(u0, v1);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill();
}
const pulse = (speed: number, phase = 0) => (FX.calm ? .5 : .5 + .5 * Math.sin(FX.t * speed + phase));
const step = (fps: number) => (FX.calm ? 0 : Math.floor(FX.t * fps));

/** TV: off (dark glass), a show (three channels) or a video game. */
export function drawTv(ctx: CanvasRenderingContext2D, at: QuadAt) {
  const on = FX.acts.has("tv"), game = FX.acts.has("games");
  if (!on && !game) { quad(ctx, at, 0, 0, 1, 1, "#23232B"); quad(ctx, at, .08, .55, .22, .9, "#34343F"); quad(ctx, at, .22, .7, .3, .9, "#2E2E38"); return; }
  if (game) {
    quad(ctx, at, 0, 0, 1, 1, "#1B1E3A");
    quad(ctx, at, 0, 0, 1, .12, "#3E8E5A");
    const px = .15 + .5 * pulse(1.3), jump = Math.abs(Math.sin(FX.t * 3)) * .3;
    quad(ctx, at, px, .12 + jump, px + .08, .3 + jump, "#FFD23F");
    for (let n = 0; n < 3; n++) { const ex = ((FX.calm ? .5 : FX.t * .25) + n * .33) % 1; quad(ctx, at, 1 - ex, .12, 1 - ex + .07, .22, "#E07A5F"); }
    for (let n = 0; n < 4; n++) if ((step(2) + n) % 3) quad(ctx, at, .06 + n * .07, .84, .1 + n * .07, .92, "#FFFFFF");
    return;
  }
  const channel = step(1 / 3) % 3;
  if (channel === 0) { // nature show: sky, hills, a drifting cloud
    quad(ctx, at, 0, 0, 1, 1, "#8FD0F0"); quad(ctx, at, 0, 0, 1, .35, "#6FAE5C"); quad(ctx, at, .3, .35, .7, .45, "#7FBF6A");
    const cx = (FX.calm ? .4 : (FX.t * .08) % 1.2) - .1; quad(ctx, at, cx, .65, cx + .22, .78, "#FFFFFF");
    quad(ctx, at, .78, .7, .88, .86, "#FFE08A");
  } else if (channel === 1) { // cartoon: bouncing ball on stripes
    for (let n = 0; n < 5; n++) quad(ctx, at, n / 5, 0, (n + 1) / 5, 1, ["#F4A6A0", "#FFE08A", "#A9D3A4", "#8FC0E0", "#C8B8EE"][n]);
    const bx = pulse(1.1) * .8 + .05, by = Math.abs(Math.sin(FX.t * 4)) * .6 + .1; quad(ctx, at, bx, by, bx + .12, by + .2, "#E04848");
  } else { // news: anchor desk and a ticker
    quad(ctx, at, 0, 0, 1, 1, "#2F5E9E"); quad(ctx, at, .3, .15, .7, .35, "#8A5A3A"); quad(ctx, at, .42, .35, .58, .7, "#F2C94C");
    quad(ctx, at, 0, 0, 1, .12, "#C0504D"); const tx = FX.calm ? .3 : (FX.t * .3) % 1; quad(ctx, at, 1 - tx, .03, 1 - tx + .3, .09, "#FFFFFF");
  }
  quad(ctx, at, .06, .82, .16, .94, "rgba(255,255,255,.25)");
}

/** Arcade: attract mode, faster invaders while the Friend plays. */
export function drawArcade(ctx: CanvasRenderingContext2D, at: QuadAt) {
  const playing = FX.acts.has("arcade");
  quad(ctx, at, 0, 0, 1, 1, "#10122A");
  const sp = playing ? 2.2 : .7;
  for (let r = 0; r < 2; r++) for (let n = 0; n < 4; n++) {
    const x = .1 + n * .2 + Math.sin(FX.calm ? 0 : FX.t * sp) * .08, y = .62 + r * .18;
    quad(ctx, at, x, y, x + .1, y + .09, r ? "#7FCF4F" : "#FF5AD1");
  }
  const sx = .45 + Math.sin(FX.calm ? 0 : FX.t * sp * 1.3) * .3; quad(ctx, at, sx, .08, sx + .12, .18, "#6FC3DF");
  if (playing && step(6) % 2) quad(ctx, at, sx + .05, .2, sx + .07, .5, "#FFD23F");
}

/** Aquarium water with three fish and rising bubbles (always alive). */
export function drawAquarium(ctx: CanvasRenderingContext2D, at: QuadAt) {
  quad(ctx, at, 0, 0, 1, 1, "rgba(127,199,230,.55)");
  const fish = [["#FF9A3C", .55, .9], ["#F2C94C", .75, 1.3], ["#E07A5F", .35, .7]] as const;
  fish.forEach(([c, v, sp], n) => {
    const s = FX.calm ? .5 : .5 + .42 * Math.sin(FX.t * sp * .6 + n * 2), dir = FX.calm ? 1 : Math.cos(FX.t * sp * .6 + n * 2) >= 0 ? 1 : -1;
    quad(ctx, at, s - .06, v, s + .06, v + .1, c); quad(ctx, at, dir > 0 ? s - .1 : s + .06, v + .02, dir > 0 ? s - .06 : s + .1, v + .08, c);
  });
  if (!FX.calm) for (let n = 0; n < 3; n++) { const v = ((FX.t * .35 + n / 3) % 1) * .9; quad(ctx, at, .2 + n * .3, v, .23 + n * .3, v + .05, "rgba(255,255,255,.8)"); }
}

/** Lava lamp: two warm blobs drifting up and down. */
export function drawLava(ctx: CanvasRenderingContext2D, at: QuadAt) {
  quad(ctx, at, 0, 0, 1, 1, "#FF8A5B");
  for (let n = 0; n < 2; n++) { const v = pulse(.6 + n * .3, n * 2) * .7; quad(ctx, at, .2 + n * .2, v, .6 + n * .2, v + .22, "#FFE08A"); }
}

/** Record: the label turns while music plays. */
export function drawRecord(ctx: CanvasRenderingContext2D, at: QuadAt) {
  quad(ctx, at, 0, 0, 1, 1, "#23232B");
  const a = FX.acts.has("dance") && !FX.calm ? FX.t * 5 : .6, c = Math.cos(a) * .32, s = Math.sin(a) * .32;
  ctx.strokeStyle = "#5B5B66"; ctx.lineWidth = .6; const p = at(.5 - c, .5 - s), q = at(.5 + c, .5 + s); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
  quad(ctx, at, .4, .4, .6, .6, "#E07A5F");
}

/** Stove burners glow while cooking. */
export function drawBurners(ctx: CanvasRenderingContext2D, at: QuadAt) {
  const on = FX.acts.has("cook"), hot = on ? `rgba(255,${90 + Math.round(60 * pulse(9))},40,1)` : "#5B5B66";
  quad(ctx, at, .08, .1, .38, .4, hot); quad(ctx, at, .55, .1, .85, .4, hot); quad(ctx, at, .08, .55, .38, .85, "#5B5B66"); quad(ctx, at, .55, .55, .85, .85, on ? hot : "#5B5B66");
}

/** Easel canvas: strokes appear while painting. */
export function drawCanvas(ctx: CanvasRenderingContext2D, at: QuadAt) {
  quad(ctx, at, 0, 0, 1, 1, "#FFFFFF");
  quad(ctx, at, .1, .55, .45, .9, "#8FC0E0"); quad(ctx, at, .5, .2, .9, .5, "#E07A5F"); quad(ctx, at, .25, .1, .5, .35, "#F2C94C");
  if (FX.acts.has("paint")) { const n = FX.calm ? 3 : step(1.5) % 6; for (let k = 0; k < n; k++) quad(ctx, at, .1 + k * .13, .05 + (k % 3) * .3, .2 + k * .13, .15 + (k % 3) * .3, ["#7FB069", "#8E7CC3", "#C0504D"][k % 3]); }
}

/** Vanity bulbs blink while primping. */
export function drawBulbs(ctx: CanvasRenderingContext2D, at: QuadAt) {
  const on = FX.acts.has("primp");
  for (let n = 0; n < 3; n++) quad(ctx, at, .1 + n * .32, 0, .24 + n * .32, 1, on && (step(4) + n) % 2 ? "#FFFFFF" : "#FFE08A");
}
