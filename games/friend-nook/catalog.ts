/** Buy mode catalog: furniture bought with (simulated) RF and placed anywhere free. Each piece brings its own
 * action, and families like them differently (see personality.ts). Built at origin (0, 0). */
import { S, type Builder } from "./iso.js";
import type { FurnitureDef } from "./furniture.js";

const DK = S("#8A5A3A", "#6E4630", "#5A3B26"), WOOD = S("#B7875A", "#9A6E45", "#835C38"), BLK = S("#3A3A44", "#2E2E36", "#23232B");
const WHT = S("#FFFFFF", "#E6E6EE", "#D2D2DE"), STEEL = S("#C9D3D8", "#AAB6BD", "#96A3AB"), GOLD = S("#F2C94C", "#D9AE36", "#C09A2A");
const PURP = S("#8E7CC3", "#7462A8", "#5F4F93"), PINK = S("#F4A6A0", "#E07A5F", "#C0504D"), GLASS = S("#CFEAF4", "#A9D4E6", "#8FC0D6");
const POT = S("#C8763F", "#A85F30", "#8E4E26"), LEAF = S("#7FBF6A", "#6FAE5C", "#5E9A4C"), LEAF2 = S("#8FCF7A", "#7FBF6A", "#6FAE5C");
const T = .0005;

export type CatalogItem = Readonly<{ def: FurnitureDef; price: number; blurb: string }>;

export const CATALOG: readonly CatalogItem[] = [
  { price: 6, blurb: "Blinking lights and a joystick. Loud, bright, perfect.", def: { id: "arcade", name: "Arcade cabinet", origin: [0, 0], foot: [0, 0, .8, .7], spots: [[.4, 1.15]],
    build: (b: Builder) => {
      b.box(0, 0, .8, .7, 30, PURP); b.box(-.02, -.02, .84, .74, 3, S("#F2C94C", "#E07A5F", "#C0504D"), 30);
      b.fj(.7, .08, .72, 17, 27, "#23232B"); b.fj(.7 + T, .14, .66, 18.5, 25.5, "#6FC3DF"); b.fj(.7 + 2 * T, .22, .4, 21, 23, "#FFD23F");
      b.box(.05, .7, .7, .22, 2, BLK, 13); b.box(.2, .75, .06, .06, 3, STEEL, 15); b.box(.45, .76, .08, .08, .8, PINK, 15); b.box(.58, .76, .08, .08, .8, GOLD, 15);
      b.fj(.7, .1, .7, 2, 10, "#5F4F93"); b.fj(.7 + T, .3, .5, 5, 6.5, "#FFD23F");
    } } },
  { price: 5, blurb: "Three little fish who have seen everything.", def: { id: "aquarium", name: "Aquarium", origin: [0, 0], foot: [0, 0, 1.2, .5], spots: [[.6, .95]],
    build: (b: Builder) => {
      b.box(0, 0, 1.2, .5, 10, DK); b.fj(.5, .06, .58, 1.5, 8.5, "#A57A4F"); b.fj(.5, .62, 1.14, 1.5, 8.5, "#A57A4F");
      b.box(0, 0, 1.2, .5, 12, GLASS, 10); b.tp(.04, .04, 1.16, .46, 22.01, "#7FC7E6");
      b.fj(.5 + T, .05, 1.15, 10.5, 13, "#D9C58A"); b.fj(.5 + 2 * T, .2, .3, 13, 18, "#6FAE5C"); b.fj(.5 + 2 * T, .9, .98, 13, 16, "#6FAE5C");
      b.fj(.5 + 2 * T, .45, .6, 16, 17.5, "#FF9A3C"); b.fj(.5 + 2 * T, .7, .8, 18.5, 19.5, "#F2C94C"); b.fj(.5 + 2 * T, .32, .4, 19.5, 20.5, "#E07A5F");
    } } },
  { price: 3, blurb: "Sinks around you like a warm hug.", def: { id: "beanbag", name: "Bean bag", origin: [0, 0], foot: [0, 0, .8, .8], spots: [[.4, 1.2]],
    pose: { i: .4, j: .45, z: 5.5, face: [0, 1] },
    build: (b: Builder) => { b.box(.05, .05, .7, .7, 4, PINK); b.box(0, .1, .8, .6, 3, PINK, 1); b.box(.12, .12, .56, .56, 1.6, S("#F7B8B2", "#F4A6A0", "#E07A5F"), 4); b.box(.1, .05, .6, .22, 6, PINK, 4); } } },
  { price: 4, blurb: "Paints, brushes and a canvas that is never quite finished.", def: { id: "easel", name: "Easel", origin: [0, 0], foot: [0, 0, .6, .4], spots: [[.3, .85]],
    build: (b: Builder) => {
      b.box(.05, .05, .06, .06, 22, WOOD); b.box(.49, .05, .06, .06, 22, WOOD); b.box(.27, .3, .06, .06, 20, WOOD);
      b.box(.02, .1, .56, .08, 1.2, WOOD, 8); b.box(.06, .12, .48, .04, 13, WHT, 9);
      b.fj(.16 + T, .12, .3, 12, 17, "#8FC0E0"); b.fj(.16 + T, .3, .5, 10, 14, "#E07A5F"); b.fj(.16 + 2 * T, .2, .4, 16, 20, "#F2C94C"); b.fj(.16 + T, .12, .5, 9.5, 11, "#7FB069");
    } } },
  { price: 6, blurb: "For counting stars. Works best at night.", def: { id: "telescope", name: "Telescope", origin: [0, 0], foot: [0, 0, .6, .6], spots: [[.3, 1.0]],
    build: (b: Builder) => {
      b.box(.05, .05, .05, .05, 14, DK); b.box(.5, .05, .05, .05, 14, DK); b.box(.27, .5, .05, .05, 14, DK); b.box(.18, .18, .24, .24, 1.5, DK, 13.5);
      b.box(-.25, .22, .85, .16, 2.4, S("#E6EEF3", "#C4D2DC", "#B0C0CB"), 15.5); b.box(-.32, .2, .12, .2, 2.8, GOLD, 15.3); b.box(.55, .25, .1, .1, 1.6, BLK, 15.9);
    } } },
  { price: 5, blurb: "A vanity with lights. Everybody looks great in it.", def: { id: "vanity", name: "Vanity mirror", origin: [0, 0], foot: [0, 0, .9, .45], spots: [[.45, .9]],
    build: (b: Builder) => {
      b.legs(.03, .03, .84, .39, 10, WOOD, .07); b.box(0, 0, .9, .45, 1.4, WOOD, 10); b.fj(.45, .05, .85, 7.5, 9.8, "#A57A4F");
      b.box(.15, .02, .6, .08, 17, GOLD, 11.4); b.fj(.1 + T, .2, .7, 13, 26.5, "#EAF4F7"); b.fj(.1 + 2 * T, .28, .34, 20, 25, "#FFFFFF");
      for (const a of [.18, .45, .72]) b.box(a, .02, .06, .06, 1.2, S("#FFF3B0", "#FFE08A", "#F2C94C"), 28.2);
      b.box(.62, .22, .1, .1, 2, PINK, 11.4); b.box(.2, .25, .12, .12, 1.2, PURP, 11.4);
    } } },
  { price: 4, blurb: "Twenty-five keys, mostly in tune.", def: { id: "piano", name: "Toy piano", origin: [0, 0], foot: [0, 0, 1.0, .45], spots: [[.5, .9]],
    build: (b: Builder) => {
      b.box(0, 0, 1.0, .45, 10, BLK); b.box(0, 0, 1.0, .15, 6, BLK, 10); b.tp(.04, .2, .96, .42, 10.02, "#FFFFFF");
      for (let n = 0; n < 7; n++) b.tp(.1 + n * .13, .2, .15 + n * .13, .3, 10.04, "#23232B");
      b.fj(.45, .1, .9, 3, 8, "#3A3A44"); b.box(.05, .02, .15, .1, 2.5, GOLD, 16);
    } } },
  { price: 2, blurb: "A tall leafy friend for any corner.", def: { id: "bigplant", name: "Big plant", origin: [0, 0], foot: [0, 0, .6, .6], spots: [],
    build: (b: Builder) => { b.box(.1, .1, .4, .4, 6, POT); b.box(.02, .02, .56, .56, 9, LEAF, 6); b.box(.08, .08, .44, .44, 8, LEAF2, 15); b.box(.16, .16, .28, .28, 7, LEAF, 23); b.box(.22, .22, .16, .16, 4, LEAF2, 30); } } },
  { price: 2, blurb: "Slow warm bubbles. Very calming.", def: { id: "lavalamp", name: "Lava lamp", origin: [0, 0], foot: [0, 0, .45, .45], spots: [],
    build: (b: Builder) => { b.box(0, 0, .45, .45, 8, WOOD); b.box(.14, .14, .17, .17, 3, STEEL, 8); b.box(.12, .12, .21, .21, 9, S("#FFB36B", "#FF8A5B", "#E0663C"), 11); b.fj(.33 + T, .16, .22, 13, 16, "#FFE08A"); b.box(.15, .15, .15, .15, 1.5, STEEL, 20); } } },
];

export const CATALOG_DEF: Readonly<Record<string, CatalogItem>> = Object.fromEntries(CATALOG.map(c => [c.def.id, c]));
