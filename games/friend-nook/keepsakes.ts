/** Keepsakes from the Gift Box: one per outcome in game.json (same order). Kept keepsakes stand in the hutch;
 * any keepsake can be sold back for its RF value (the SDK's redeem). */
import { INK, type Pixmap } from "./art.js";

export type Keepsake = Readonly<{ name: string; rarity: string; color: string; shelf: string; blurb: string; icon: Pixmap; bond: number }>;

export const KEEPSAKES: readonly Keepsake[] = [
  { name: "Pressed Flower", rarity: "Common", color: "#E8E0D0", shelf: "#F7E08F", bond: 2, blurb: "A daisy kept flat in a book. Small, but it counts.",
    icon: { palette: { k: INK, w: "#FFFFFF", y: "#F2C94C", g: "#7FB069" }, rows: ["...www...", "..wwyww..", "..wyyyw..", "..wwyww..", "...www...", "....g....", "...gg....", "....g....", "........."] } },
  { name: "Snow Globe", rarity: "Uncommon", color: "#7FCF4F", shelf: "#8FC0E0", bond: 4, blurb: "Shake it and a tiny house gets a tiny winter.",
    icon: { palette: { k: INK, b: "#BFE4FF", w: "#FFFFFF", r: "#C0504D", d: "#8A5A3A" }, rows: ["..kkkkk..", ".kbbwbbk.", "kbwbbbwbk", "kbbbrbbbk", "kbbrrrbbk", ".kbbbbbk.", "..kkkkk..", ".kdddddk.", ".kkkkkkk."] } },
  { name: "Music Box", rarity: "Rare", color: "#4AA3FF", shelf: "#8E7CC3", bond: 7, blurb: "Plays a lullaby that sounds a bit like your name.",
    icon: { palette: { k: INK, p: "#8E7CC3", y: "#F2C94C", w: "#FFFFFF" }, rows: ["....y....", "...yyy...", "....k....", "kkkkkkkkk", "kpppppppk", "kpyyyyypk", "kpppppppk", "kkkkkkkkk", "........."] } },
  { name: "Golden Locket", rarity: "Epic", color: "#B86BFF", shelf: "#F2C94C", bond: 11, blurb: "Opens to a picture of the two of you.",
    icon: { palette: { k: INK, y: "#F2C94C", o: "#C09A2A", w: "#FFF3B0" }, rows: ["...k.k...", "....k....", "...kkk...", "..kyyyk..", ".kywyyok.", ".kyyyyok.", ".kyyyook.", "..kyook..", "...kkk..."] } },
  { name: "Star in a Jar", rarity: "Legendary", color: "#FFB52E", shelf: "#FFE08A", bond: 18, blurb: "A real star, very small, very warm. It hums at night.",
    icon: { palette: { k: INK, c: "#8B99A6", g: "#DCEFF3", y: "#FFD23F", w: "#FFFFFF" }, rows: ["..kkkkk..", "..kcccck.", ".kggggggk", ".kggyggk.", ".kgyyygk.", ".kggyggk.", ".kgwgggk.", ".kggggggk", "..kkkkk.."] } },
];

/** Temperament reactions to a gift (family → line); strong characters react more. */
export const GIFT_LOVERS = new Set(["Sparkling", "Family", "Mask"]);
