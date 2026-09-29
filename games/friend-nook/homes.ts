/** Family homes: each of the nine families moves into the same floor plan decorated its own way (walls, wallpaper
 * motif, floors, curtains, rugs, trim and furniture materials). Only looks change: the same furniture pieces,
 * activities, prices and odds. */

/** A wallpaper motif: small pixel pictures ("#" = paint) cycled across the bedroom walls, or brick courses. */
export type Motif = Readonly<{ kind: "dots" } | { kind: "bricks" } | { kind: "stamps"; stamps: readonly (readonly string[])[] }>;

export type HomeTheme = Readonly<{
  name: string;
  motif: Motif;
  bed: Readonly<{ left: string; back: string; paper: readonly [string, string]; floor: string; floorDot: string; curtain: string; rug: readonly [string, string, string] }>;
  bath: Readonly<{ wall: string; trim: string; band: string; floor: readonly [string, string]; rug: readonly [string, string] }>;
  kitchen: Readonly<{ wall: string; trim: string; band: string; floor: readonly [string, string] }>;
  living: Readonly<{ wall: string; stripe: string; wood: readonly [string, string, string]; rug: readonly [string, string] }>;
  dining: Readonly<{ wood: readonly [string, string, string]; rug: readonly [string, string] }>;
  seam: string; skirting: string; frame: string; frameSide: string;
  /** Interior walls: [cap, left face, right face]. */
  inner: readonly [string, string, string];
  /** Furniture recoloured in the family's materials (original colour → new), or none for the original look. */
  furniture?: Readonly<Record<string, string>>;
}>;

/* ---------- furniture materials ---------- */
const rgb = (h: string) => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
const hex = (c: number[]) => "#" + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
/** Tones of a base colour: f < 1 darkens, f > 1 mixes toward white. */
const tone = (base: string, f: number) => hex(rgb(base).map(v => (f <= 1 ? v * f : v + (255 - v) * (f - 1))));
/** The furniture palette in furniture.ts, lightest first: light wood (with its door panels), dark wood, the sofa and the reading chair. */
const ORIGINAL = {
  wood: ["#B7875A", "#A57A4F", "#9A6E45", "#835C38"], dark: ["#8A5A3A", "#6E4630", "#5A3B26"],
  sofa: ["#8CB3DA", "#6C97C4", "#4F7CAC", "#3D6592", "#34587F"], chair: ["#A9D3A4", "#8FBF8A", "#6FA86A", "#5A9056"],
} as const;
const STEPS = { wood: [1, .9, .84, .72], dark: [1, .8, .65], sofa: [1.22, 1, .8, .66, .56], chair: [1.14, 1, .85, .72] } as const;
/** Map the original furniture palette onto a family's materials (each given as its main tone). */
const materials = (m: Readonly<Record<keyof typeof ORIGINAL, string>>): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const k of Object.keys(ORIGINAL) as (keyof typeof ORIGINAL)[]) ORIGINAL[k].forEach((c, n) => { out[c] = tone(m[k], STEPS[k][n]); });
  return out;
};

const stamps = (...s: (readonly string[])[]): Motif => ({ kind: "stamps", stamps: s });
const BONE = ["#...#", "#####", "#...#"], DIAMOND = ["..#..", ".###.", "#####", ".###.", "..#.."], HEART = [".#.#.", "#####", ".###.", "..#.."];
const CELL = [".###.", "#...#", "#.#.#", "#...#", ".###."], ZIGZAG = ["#...#...#", ".#.#.#.#.", "..#...#.."], CLOUD = [".##..", "####.", "#####"];
const STAR = [".#.", "###", ".#."], SPARKLE = ["..#..", "..#..", "##.##", "..#..", "..#.."], DOT = ["#"], LEAF = ["..##", ".###", "###.", "#..."];

/** The original house, for a Friend whose family could not be read. */
export const DEFAULT_HOME: HomeTheme = {
  name: "Friend Nook", motif: { kind: "dots" },
  bed: { left: "#9DB3D0", back: "#B7CDE6", paper: ["#E8F0FA", "#C8D6EA"], floor: "#E7B7C3", floorDot: "#D9A2B1", curtain: "#E8A0B4", rug: ["#F4D35E", "#F7E08F", "#F4D35E"] },
  bath: { wall: "#DCEFF3", trim: "#BCD9E0", band: "#8FB8C4", floor: ["#B9DAE5", "#D3EBF1"], rug: ["#7FB069", "#97C47F"] },
  kitchen: { wall: "#CFE3C1", trim: "#B5CFA5", band: "#9DBB8B", floor: ["#E1D9C6", "#F4F0E6"] },
  living: { wall: "#D2B084", stripe: "#C6A273", wood: ["#D9A066", "#D19659", "#DDA86F"], rug: ["#7FB0C9", "#9CC7DB"] },
  dining: { wood: ["#C98B55", "#C0814C", "#CF935E"], rug: ["#8E7CC3", "#A897D6"] },
  seam: "#B98450", skirting: "#6E4630", frame: "#5A3B26", frameSide: "#4A301F", inner: ["#5A3B26", "#E8D2AE", "#D6BC94"],
};

export const HOMES: Readonly<Record<string, HomeTheme>> = {
  Skeleton: {
    name: "Moonlit Manor", motif: stamps(BONE),
    bed: { left: "#6F6A8E", back: "#817BA3", paper: ["#E6DFCC", "#D8D0BC"], floor: "#5B4B6E", floorDot: "#4E3F60", curtain: "#8E2F45", rug: ["#8E2F45", "#A8455B", "#8E2F45"] },
    bath: { wall: "#C9C9D6", trim: "#9C9CB0", band: "#5C5873", floor: ["#3E3B4F", "#D6D4E0"], rug: ["#8E2F45", "#A8455B"] },
    kitchen: { wall: "#B7B3C9", trim: "#9994B0", band: "#5C5873", floor: ["#3E3B4F", "#CFCBDC"] },
    living: { wall: "#6B5F7E", stripe: "#5D5270", wood: ["#7A5A48", "#70523F", "#846351"], rug: ["#5D5270", "#7B6F92"] },
    dining: { wood: ["#6A4B3C", "#624436", "#735244"], rug: ["#8E2F45", "#A8455B"] },
    seam: "#5A4033", skirting: "#3E2E3A", frame: "#2E2433", frameSide: "#241C29", inner: ["#2E2433", "#8D86A6", "#7A7394"],
    furniture: materials({ wood: "#5E5468", dark: "#3A3140", sofa: "#8E2F45", chair: "#6B5F7E" }),
  },
  Mask: {
    name: "Backstage", motif: stamps(DIAMOND),
    bed: { left: "#9E3B4A", back: "#B24A58", paper: ["#E8B94A", "#D9A93F"], floor: "#4A3550", floorDot: "#3E2B44", curtain: "#6E1A28", rug: ["#E8B94A", "#F2CF6B", "#E8B94A"] },
    bath: { wall: "#F0D9DE", trim: "#D6AFB8", band: "#9E3B4A", floor: ["#2F2A35", "#E8E2EA"], rug: ["#9E3B4A", "#B85C69"] },
    kitchen: { wall: "#F2E1C4", trim: "#DDBF8E", band: "#9E3B4A", floor: ["#2F2A35", "#EFE7DA"] },
    living: { wall: "#7E2E3C", stripe: "#C99A3A", wood: ["#8A4B32", "#80442D", "#945339"], rug: ["#E8B94A", "#F2CF6B"] },
    dining: { wood: ["#7E4430", "#743E2B", "#884A35"], rug: ["#6E1A28", "#8E2F45"] },
    seam: "#6B3524", skirting: "#3A1E24", frame: "#2E1A1F", frameSide: "#231317", inner: ["#2E1A1F", "#D9B98A", "#C4A276"],
    furniture: materials({ wood: "#9E5A3C", dark: "#5E2A22", sofa: "#D9A93F", chair: "#7E2E3C" }),
  },
  Family: {
    name: "Cozy Cottage", motif: stamps(HEART),
    bed: { left: "#F2C5A8", back: "#F7D6BE", paper: ["#E86F7E", "#D95F6E"], floor: "#E9B8A0", floorDot: "#DDA58B", curtain: "#E86F7E", rug: ["#F2A65A", "#F7C08A", "#F2A65A"] },
    bath: { wall: "#FBEFE3", trim: "#EACFB7", band: "#E86F7E", floor: ["#F2D8C4", "#FFF3E8"], rug: ["#E86F7E", "#F09AA5"] },
    kitchen: { wall: "#FFF1D6", trim: "#E8C9A0", band: "#D95F6E", floor: ["#E86F7E", "#FFF3E8"] },
    living: { wall: "#E9C39B", stripe: "#DDB085", wood: ["#D9A066", "#D19659", "#DDA86F"], rug: ["#E86F7E", "#F09AA5"] },
    dining: { wood: ["#C98B55", "#C0814C", "#CF935E"], rug: ["#F2A65A", "#F7C08A"] },
    seam: "#B98450", skirting: "#8A5A3A", frame: "#6E4630", frameSide: "#5A3B26", inner: ["#6E4630", "#F3DCC0", "#E6C9A8"],
    furniture: materials({ wood: "#C99B6A", dark: "#8A5A3A", sofa: "#E86F7E", chair: "#F2A65A" }),
  },
  Cellular: {
    name: "Greenhouse Lab", motif: stamps(CELL),
    bed: { left: "#9FD8B8", back: "#B8E6CB", paper: ["#6FBF8F", "#62B083"], floor: "#CDEBC0", floorDot: "#B7DDA8", curtain: "#5FAF7A", rug: ["#C6E36B", "#D8EE8C", "#C6E36B"] },
    bath: { wall: "#E3F6EE", trim: "#BFE3D2", band: "#5FAF7A", floor: ["#BFE3D2", "#E9F8F1"], rug: ["#C6E36B", "#D8EE8C"] },
    kitchen: { wall: "#F1FAF3", trim: "#CDE8D5", band: "#5FAF7A", floor: ["#DDEFE3", "#F7FCF8"] },
    living: { wall: "#A9D9B0", stripe: "#96CC9E", wood: ["#CDB483", "#C4AA78", "#D4BC8C"], rug: ["#6FBF8F", "#94D1AB"] },
    dining: { wood: ["#BFA374", "#B69969", "#C7AB7C"], rug: ["#C6E36B", "#D8EE8C"] },
    seam: "#A88E5E", skirting: "#4F7F5E", frame: "#3F6A4E", frameSide: "#325841", inner: ["#3F6A4E", "#DDF0DF", "#C8E4CC"],
    furniture: materials({ wood: "#D4BC8C", dark: "#9C8457", sofa: "#6FBF8F", chair: "#C6E36B" }),
  },
  Asymmetry: {
    name: "Funhouse", motif: stamps(ZIGZAG),
    bed: { left: "#3FB6A8", back: "#F29E4C", paper: ["#F7E35A", "#F25F5C"], floor: "#8E7CC3", floorDot: "#F7E35A", curtain: "#F25F5C", rug: ["#3FB6A8", "#F7E35A", "#F25F5C"] },
    bath: { wall: "#F7E35A", trim: "#E3C93D", band: "#3FB6A8", floor: ["#F25F5C", "#FFF3D6"], rug: ["#8E7CC3", "#A897D6"] },
    kitchen: { wall: "#8FD694", trim: "#6FC079", band: "#8E7CC3", floor: ["#3FB6A8", "#FFF3D6"] },
    living: { wall: "#F25F5C", stripe: "#F7E35A", wood: ["#D9A066", "#E3B35C", "#C98BB9"], rug: ["#F7E35A", "#F29E4C"] },
    dining: { wood: ["#C98B55", "#8FB8C4", "#CF935E"], rug: ["#3FB6A8", "#6FD1C4"] },
    seam: "#9E6B40", skirting: "#3D3A6B", frame: "#2E2B55", frameSide: "#232046", inner: ["#2E2B55", "#9CD8CF", "#7DC7BC"],
    furniture: materials({ wood: "#E3B35C", dark: "#3D3A6B", sofa: "#F25F5C", chair: "#3FB6A8" }),
  },
  Hoverer: {
    name: "Cloud Loft", motif: stamps(CLOUD, STAR),
    bed: { left: "#8FB4E0", back: "#A9C8EE", paper: ["#FFFFFF", "#F0F6FF"], floor: "#C9C3EC", floorDot: "#B8B1E2", curtain: "#B8A6E6", rug: ["#F7E08F", "#FFF1B8", "#F7E08F"] },
    bath: { wall: "#E4EEFB", trim: "#C3D6F0", band: "#8FB4E0", floor: ["#C3D6F0", "#EEF4FC"], rug: ["#B8A6E6", "#CFC2F0"] },
    kitchen: { wall: "#EAF2FB", trim: "#C9DAF0", band: "#8FB4E0", floor: ["#DCE6F3", "#F6F9FD"] },
    living: { wall: "#B9CDEB", stripe: "#A7BFE4", wood: ["#E4CBA0", "#DCC294", "#E9D3AC"], rug: ["#B8A6E6", "#CFC2F0"] },
    dining: { wood: ["#D6BA8C", "#CEB082", "#DDC296"], rug: ["#8FB4E0", "#AFC9EE"] },
    seam: "#C2A274", skirting: "#5E6FA3", frame: "#4A5A8C", frameSide: "#3A4873", inner: ["#4A5A8C", "#E4EEFB", "#CFDDF2"],
    furniture: materials({ wood: "#E6D3B3", dark: "#B8A58A", sofa: "#8FB4E0", chair: "#B8A6E6" }),
  },
  Colossus: {
    name: "Stone Lodge", motif: { kind: "bricks" },
    bed: { left: "#A89F92", back: "#B8AFA2", paper: ["#8F8679", "#857C70"], floor: "#9C8A6E", floorDot: "#8B7A5F", curtain: "#6E8B4E", rug: ["#6E8B4E", "#8AA66A", "#6E8B4E"] },
    bath: { wall: "#C9C2B6", trim: "#ACA497", band: "#6E6558", floor: ["#8F8679", "#BDB5A8"], rug: ["#6E8B4E", "#8AA66A"] },
    kitchen: { wall: "#D2C9B8", trim: "#B3A994", band: "#6E6558", floor: ["#A39A8C", "#C7BFB2"] },
    living: { wall: "#A09482", stripe: "#8F8473", wood: ["#8A5E3C", "#805636", "#946643"], rug: ["#B5553C", "#C9745C"] },
    dining: { wood: ["#7A5234", "#704B2F", "#83593A"], rug: ["#B5553C", "#C9745C"] },
    seam: "#5E4029", skirting: "#4A433A", frame: "#3A342D", frameSide: "#2D2823", inner: ["#3A342D", "#C4BBAE", "#AFA597"],
    furniture: materials({ wood: "#7A5234", dark: "#4A3222", sofa: "#6E8B4E", chair: "#B5553C" }),
  },
  Sparkling: {
    name: "Glam Suite", motif: stamps(SPARKLE, DOT),
    bed: { left: "#F2B8D2", back: "#F7CCE0", paper: ["#E0A92E", "#D69E26"], floor: "#FBE3EE", floorDot: "#F2C9DC", curtain: "#C77DDB", rug: ["#C77DDB", "#DDA4EA", "#C77DDB"] },
    bath: { wall: "#FFF0F6", trim: "#F2D0E0", band: "#F2C94C", floor: ["#F2D0E0", "#FFFFFF"], rug: ["#F2C94C", "#F7DC85"] },
    kitchen: { wall: "#F6E8FA", trim: "#E3CBEB", band: "#C77DDB", floor: ["#E9DDF0", "#FFFFFF"] },
    living: { wall: "#E6C4E8", stripe: "#E0B84A", wood: ["#F1E6DC", "#E9DDD2", "#F6EDE5"], rug: ["#F2A5C8", "#F7C4DA"] },
    dining: { wood: ["#EADCCF", "#E2D3C5", "#F0E4D8"], rug: ["#C77DDB", "#DDA4EA"] },
    seam: "#D8C8BC", skirting: "#B98CC4", frame: "#8E5A9E", frameSide: "#744883", inner: ["#8E5A9E", "#FBE3EE", "#F2CFE0"],
    furniture: materials({ wood: "#F4EDE6", dark: "#D9B45A", sofa: "#F2A5C8", chair: "#C77DDB" }),
  },
  Hollow: {
    name: "Quiet Library", motif: stamps(LEAF),
    bed: { left: "#8FA38E", back: "#A3B5A0", paper: ["#6E8468", "#657B60"], floor: "#8A9A7B", floorDot: "#7C8C6E", curtain: "#4F6B55", rug: ["#B59A6A", "#C9B083", "#B59A6A"] },
    bath: { wall: "#D5DDD2", trim: "#B7C4B3", band: "#5E7361", floor: ["#9FAE9B", "#D2DBCF"], rug: ["#4F6B55", "#6A8670"] },
    kitchen: { wall: "#DAD8C8", trim: "#BDBAA6", band: "#5E7361", floor: ["#B9B39E", "#D8D3C0"] },
    living: { wall: "#7F917E", stripe: "#6F8170", wood: ["#7A5234", "#704B2F", "#83593A"], rug: ["#B59A6A", "#C9B083"] },
    dining: { wood: ["#6F4A2F", "#66442B", "#784F33"], rug: ["#4F6B55", "#6A8670"] },
    seam: "#4E3524", skirting: "#3E4A3C", frame: "#2F3A2E", frameSide: "#242D23", inner: ["#2F3A2E", "#C9D2C3", "#B4BFAE"],
    furniture: materials({ wood: "#6F4A2F", dark: "#4E3524", sofa: "#4F6B55", chair: "#B59A6A" }),
  },
};

export const homeFor = (family: string | null | undefined): HomeTheme => (family && HOMES[family]) || DEFAULT_HOME;
