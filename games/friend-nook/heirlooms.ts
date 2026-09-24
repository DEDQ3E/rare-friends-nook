/** Family heirlooms: one piece per family that moves in with the Friend and stands at the front of the living
 * room, so the house says who lives there at a glance. Each brings its own activity, which that family loves.
 * Built at origin (0, 0) like the catalog; the Friend stands on the +i side to use it. */
import { S, project, type Builder, type Part, type QuadAt } from "./iso.js";
import { FX, quad } from "./fx.js";
import type { FurnitureDef } from "./furniture.js";
import type { ActionDef } from "./sim.js";

const DK = S("#8A5A3A", "#6E4630", "#5A3B26"), WOOD = S("#B7875A", "#9A6E45", "#835C38"), GOLD = S("#F2C94C", "#D9AE36", "#C09A2A");
const BONE = S("#F7F2E4", "#DDD4BD", "#C8BEA4"), STEEL = S("#C9D3D8", "#AAB6BD", "#96A3AB"), STONE = S("#A8A49A", "#8C887E", "#76726A");
const RED = S("#E07A5F", "#C0504D", "#A33F3C"), BLUE = S("#6C97C4", "#4F7CAC", "#3D6592"), GREEN = S("#7FB069", "#6A9A56", "#5A8848");
const PURP = S("#8E7CC3", "#7462A8", "#5F4F93"), TEAL = S("#6FC3B8", "#4FA39A", "#3D8880"), CLOUD = S("#FFFFFF", "#E4EEF8", "#CFDDEE");
const T = .0005;

/** Where the heirloom stands in the starting house (front of the living room) and where its user stands. */
export const HEIRLOOM_AT: readonly [number, number] = [5.4, 9.05];
const SPOT: readonly (readonly [number, number])[] = [[1.2, .35]];

/* ---------- living faces ---------- */
function drawCells(ctx: CanvasRenderingContext2D, at: QuadAt) {
  quad(ctx, at, 0, 0, 1, 1, "#1E4D45");
  const busy = FX.acts.has("cells"), t = FX.calm ? 0 : FX.t * (busy ? 1.2 : .4);
  const cells: readonly [number, number, string][] = [[.2, .3, "#7FE0A0"], [.55, .55, "#B8F28C"], [.8, .25, "#5BC0A8"], [.35, .75, "#B8F28C"], [.7, .8, "#7FE0A0"]];
  cells.forEach(([u, v, c], n) => {
    const du = Math.sin(t + n * 1.7) * .06, dv = Math.cos(t * .8 + n) * .06, s = .07 + (busy ? .03 * (.5 + .5 * Math.sin(t * 3 + n)) : 0);
    quad(ctx, at, u + du - s, v + dv - s, u + du + s, v + dv + s, c);
    quad(ctx, at, u + du - s * .35, v + dv - s * .35, u + du + s * .35, v + dv + s * .35, "#1E4D45");
  });
}
function drawLantern(ctx: CanvasRenderingContext2D, at: QuadAt) {
  const lit = FX.acts.has("lantern") || FX.dark > .3, flick = FX.calm ? .5 : .5 + .5 * Math.sin(FX.t * 9) * Math.sin(FX.t * 2.3);
  quad(ctx, at, 0, 0, 1, 1, lit ? "#FFB85C" : "#E3C27A");
  if (lit) quad(ctx, at, .3, .15, .7, .55 + .25 * flick, "#FFF3B0");
  quad(ctx, at, .45, 0, .55, 1, "#8A5A3A");
}
function drawShadow(ctx: CanvasRenderingContext2D, p: Part) {
  const [x, y] = project((p.i0 + p.i1) / 2, (p.j0 + p.j1) / 2, 0), bob = FX.calm ? 0 : Math.sin(FX.t * 1.6) * .6;
  ctx.fillStyle = "rgba(40,60,90,.18)"; ctx.beginPath(); ctx.ellipse(x, y, 11 - bob, 4.5 - bob * .3, 0, 0, Math.PI * 2); ctx.fill();
}
function drawMirrorBall(ctx: CanvasRenderingContext2D, p: Part) {
  const [x, y] = project((p.i0 + p.i1) / 2, (p.j0 + p.j1) / 2, p.z0 + 5), r = 5, spin = FX.acts.has("mirrorball") && !FX.calm ? FX.t * 4 : 0;
  ctx.fillStyle = "#B8C4CC"; ctx.strokeStyle = "#2b1d14"; ctx.lineWidth = .5; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  const tones = ["#FFFFFF", "#DDE6EC", "#9FB0BC", "#F4C0D4", "#B6D8F2"];
  for (let row = -2; row <= 2; row++) for (let col = -3; col <= 3; col++) {
    const fx = x + col * 1.5 + ((row & 1) ? .75 : 0), fy = y + row * 1.8;
    if ((fx - x) ** 2 + (fy - y) ** 2 > (r - .8) ** 2) continue;
    ctx.fillStyle = tones[Math.abs(Math.floor(col + row * 2 + spin)) % tones.length]; ctx.fillRect(fx - .6, fy - .7, 1.2, 1.3);
  }
  if (FX.acts.has("mirrorball") && !FX.calm) for (let n = 0; n < 4; n++) { // light specks thrown around
    const a = spin * .5 + n * 1.6, d = 14 + 6 * Math.sin(FX.t * 2 + n);
    ctx.fillStyle = n % 2 ? "#FFF3B0" : "#F4C0D4"; ctx.fillRect(x + Math.cos(a) * d * 1.6, y + Math.sin(a) * d * .5 + 6, 1.4, 1.4);
  }
}

export type Heirloom = Readonly<{ family: string; blurb: string; def: FurnitureDef; action: ActionDef; emit?: Readonly<{ at?: readonly [number, number, number]; kind: "bubble" | "steam" | "icon" | "dot" | "drip" | "hop"; icon?: string; colors?: readonly string[]; every: number }> }>;

const piece = (id: string, name: string, build: (b: Builder) => void, pose?: FurnitureDef["pose"]): FurnitureDef =>
  ({ id: `heirloom-${id}`, name, origin: [0, 0], foot: [0, 0, .8, .7], spots: SPOT, ...(pose ? { pose } : {}), build });
const act = (id: string, label: string, rest: Omit<ActionDef, "id" | "label" | "on">): ActionDef => ({ id, label, on: [`heirloom-${id}`], ...rest });

export const HEIRLOOMS: readonly Heirloom[] = [
  { family: "Skeleton", blurb: "Grandpa's xylophone. Every bar is a real (spare) bone.",
    def: piece("xylo", "Bone xylophone", b => {
      b.legs(.06, .08, .68, .54, 6, DK, .07); b.box(0, .05, .8, .6, 1.2, DK, 6);
      // five bone bars, longest (lowest note) first, each with knobby ends; two mallets resting in front
      for (let n = 0; n < 5; n++) { const i = .08 + n * .14, l = .4 - n * .05, j0 = .35 - l / 2; b.box(i - .02, j0 - .09, .14, .09, 1.7, BONE, 7.2); b.box(i, j0, .1, l, 1.1, BONE, 7.2); b.box(i - .02, j0 + l, .14, .09, 1.7, BONE, 7.2); }
      b.box(.72, .12, .06, .45, .8, DK, 7.2); b.box(.7, .1, .1, .08, 1.4, RED, 8);
    }),
    action: act("xylo", "Rattle out a tune", { minutes: 30, rates: { fun: 36, social: 4 }, pose: "stand", anim: "bounce", icon: "note" }),
    emit: { at: [.4, .35, 12], kind: "icon", icon: "note", every: .5 } },
  { family: "Mask", blurb: "A stand of stage masks: one for every mood, and a spare.",
    def: piece("mask", "Mask stand", b => {
      b.box(.1, .2, .6, .3, 2, DK); b.box(.12, .3, .06, .08, 20, DK, 2); b.box(.62, .3, .06, .08, 20, DK, 2); b.box(.12, .3, .56, .08, 1.2, DK, 22);
      // three face masks hanging on the bar: happy, surprised, sly
      ([[.13, RED], [.33, GOLD], [.53, TEAL]] as const).forEach(([i, c], n) => {
        const w = .19, z = 13 + (n === 1 ? 2.5 : 0), f = (u0: number, u1: number, v0: number, v1: number, col: string) => b.fj(.42 + T, i + w * u0, i + w * u1, z + v0, z + v1, col);
        b.box(i, .38, w, .04, 5.5, c, z); b.box(i + w * .42, .38, w * .16, .04, 1.4, DK, z + 5.5);
        f(.15, .38, 3, 4.3, "#23232B"); f(.62, .85, 3, 4.3, "#23232B");
        if (n === 0) f(.2, .8, 1, 1.7, "#23232B"); else if (n === 1) f(.4, .6, .7, 2.1, "#23232B"); else f(.35, .85, 1.3, 1.9, "#23232B");
        f(.05, .2, 2, 2.7, "#F4A6A0"); f(.8, .95, 2, 2.7, "#F4A6A0");
      });
    }),
    action: act("mask", "Try on a mask", { minutes: 25, rates: { fun: 40, social: 6 }, pose: "stand", anim: "hop", icon: "hat" }),
    emit: { kind: "icon", icon: "sparkle", every: .7 } },
  { family: "Family", blurb: "Photos of everyone who ever lived in this family. Somehow you are in one.",
    def: piece("photos", "Family photo table", b => {
      b.legs(.06, .06, .68, .58, 9, WOOD, .07); b.box(0, 0, .8, .7, 1.2, WOOD, 9); b.tp(.08, .08, .72, .62, 10.2, "#FFF6E6");
      ([[.08, .3, 5.5, "#9CC7DB"], [.31, .2, 7, "#F4C0D4"], [.54, .36, 4.5, "#B2E3CC"]] as const).forEach(([i, j, h, c]) => {
        b.box(i, j, .18, .05, h, GOLD, 10.2); b.fj(j + .05 + T, i + .03, i + .15, 10.8, 10.2 + h - .6, c);
        b.fj(j + .05 + 2 * T, i + .07, i + .11, 11.4, 10.2 + h * .7, "#3A2A1E");
      });
    }),
    action: act("photos", "Look at family photos", { minutes: 20, rates: { social: 34, fun: 8 }, pose: "stand", anim: "still", icon: "heart" }),
    emit: { kind: "icon", icon: "heart", every: .9 } },
  { family: "Cellular", blurb: "A glass garden of glowing cells. They grow when talked to.",
    def: piece("cells", "Cell garden", b => {
      b.box(.1, .1, .6, .5, 5, DK); b.box(.05, .05, .7, .6, 10, S("#CFEFE2", "#1E4D45", "#173D37"), 5);
      b.fjFx(.65 + T, .08, .72, 5.5, 14.5, drawCells); b.fiFx(.75 + T, .08, .62, 5.5, 14.5, drawCells);
    }),
    action: act("cells", "Tend the cell garden", { minutes: 30, rates: { fun: 30, energy: 4 }, pose: "stand", anim: "sway", icon: "drop" }),
    emit: { at: [.4, .35, 16], kind: "bubble", every: .45 } },
  { family: "Asymmetry", blurb: "A tower of blocks that should have fallen years ago.",
    def: piece("tower", "Wobbly tower", b => {
      b.box(.08, .1, .55, .5, 5, RED); b.box(.18, .05, .5, .45, 5, BLUE, 5); b.box(.05, .18, .45, .42, 5, GOLD, 10);
      b.box(.24, .12, .38, .36, 5, GREEN, 15); b.box(.1, .22, .3, .3, 5, PURP, 20); b.box(.28, .18, .18, .18, 4, RED, 25);
    }),
    action: act("tower", "Stack the wobbly tower", { minutes: 30, rates: { fun: 42, energy: -5 }, pose: "stand", anim: "hop", icon: "toy" }),
    emit: { at: [.35, .3, 29], kind: "hop", colors: ["#E07A5F", "#4F7CAC", "#F2C94C", "#7FB069"], every: .4 } },
  { family: "Hoverer", blurb: "A little cloud that followed the family home and never left.",
    def: piece("cloud", "Cloud cushion", b => {
      b.custom(.1, .15, .6, .4, .1, drawShadow);
      b.box(0, .1, .8, .5, 4, CLOUD, 7); b.box(.08, .15, .3, .35, 2.5, CLOUD, 11); b.box(.42, .12, .3, .4, 3.5, CLOUD, 11);
    }, { i: .4, j: .4, z: 11, face: [0, 1] }),
    action: act("cloud", "Float on the cloud", { minutes: 40, rates: { energy: 18, fun: 12 }, pose: "seat", anim: "sway", icon: "cloud" }),
    emit: { kind: "icon", icon: "cloud", every: 1.3 } },
  { family: "Colossus", blurb: "The old family boulder. Warm in winter, cool in summer, never moves.",
    def: piece("boulder", "Old boulder seat", b => {
      b.box(0, .05, .8, .65, 7, STONE); b.box(.05, 0, .7, .2, 10, STONE, 7); b.tp(.1, .3, .45, .6, 7.01, "#8FBF6A"); b.tp(.5, .02, .7, .12, 17.01, "#8FBF6A");
    }, { i: .4, j: .45, z: 7.5, face: [0, 1] }),
    action: act("boulder", "Sit on the old boulder", { minutes: 40, rates: { energy: 14, fun: 10 }, pose: "seat", anim: "still", icon: "sofa" }),
    emit: { kind: "icon", icon: "heart", every: 2 } },
  { family: "Sparkling", blurb: "The family mirror ball. Put a record on and the room sparkles.",
    def: piece("mirrorball", "Mirror ball", b => {
      b.box(.25, .2, .3, .3, 2, DK); b.box(.37, .32, .06, .06, 20, STEEL, 2); b.custom(.2, .15, .4, .4, 10, drawMirrorBall, 22);
    }),
    action: act("mirrorball", "Dance under the mirror ball", { minutes: 30, rates: { fun: 44, energy: -8 }, pose: "stand", anim: "dance", icon: "star" }),
    emit: { kind: "icon", icon: "sparkle", every: .5 } },
  { family: "Hollow", blurb: "A quiet lantern for reading nights. It only flickers when you whisper.",
    def: piece("lantern", "Quiet lantern", b => {
      b.box(.05, .52, .45, .18, 1.6, PURP); b.box(.2, .08, .4, .4, 1.5, DK);
      b.box(.28, .16, .24, .24, 9, S("#FFE8A8", "#F2C94C", "#D9AE36"), 1.5); b.box(.24, .12, .32, .32, 1.2, DK, 10.5); b.box(.36, .24, .08, .08, 2, DK, 11.7);
      b.fjFx(.4 + T, .3, .5, 2.5, 9.5, drawLantern); b.fiFx(.52 + T, .18, .38, 2.5, 9.5, drawLantern);
    }),
    action: act("lantern", "Sit by the quiet lantern", { minutes: 45, rates: { fun: 22, energy: 10 }, pose: "stand", anim: "sway", icon: "moon" }),
    emit: { kind: "dot", colors: ["#FFF3B0", "#FFB85C"], every: .6 } },
];
export const HEIRLOOM: Readonly<Record<string, Heirloom>> = Object.fromEntries(HEIRLOOMS.map(h => [h.family, h]));
