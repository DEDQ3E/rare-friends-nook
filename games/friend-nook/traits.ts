/** Personal traits: what makes THIS Friend unique, not just its family. Derived deterministically from the
 * token: its quirks come from the shape of its own pixels (see pixels.ts: mass, eyes, symmetry, walk, height,
 * sparkles, ears, head), each with a reason the card can show; its nickname, favourite colour, favourite thing,
 * favourite snack, birthday and catchphrase come from hashes of its canonical sprite seed and token ID.
 * Traits only change behaviour and looks. They never change prices, odds, rewards, or who may play. */
import { ACTION } from "./sim.js";
import type { Temperament } from "./personality.js";
import type { FriendSprites } from "./engine.js";
import { habitsFrom, pixelFeatures, type Features, type Habit } from "./pixels.js";

export type Accent = Readonly<{ name: string; top: string; left: string; right: string; light: string }>;
export type QuirkId = "chatterbox" | "quiet" | "nightsnacker" | "earlybird" | "sleepyhead" | "neat" | "collector" | "hummer" | "bookworm" | "speedy" | "skywatcher" | "cuddly" | "appetite" | "lighteater" | "steady" | "easygoing";
export type Quirk = Readonly<{ id: QuirkId; label: string; blurb: string }>;
/** A quirk this Friend has, how strongly, and why (the measurement behind it). */
export type Trait = Readonly<{ quirk: Quirk; strength: number; degree: Habit["degree"]; reason: string }>;
export type Traits = Readonly<{
  nickname: string; accent: Accent; favorite: string; snack: string; birthday: { month: number; day: number; label: string };
  catchphrase: string;
  quirk: Quirk;             // the main quirk (= traits[0].quirk)
  traits: readonly Trait[]; // one or two, strongest first
  features: Features;       // the measurements behind them
}>;

const ACCENTS: readonly Accent[] = [
  { name: "Lavender", top: "#8E7CC3", left: "#7462A8", right: "#5F4F93", light: "#B3A5E0" },
  { name: "Coral", top: "#F08A6F", left: "#D86A50", right: "#B8543C", light: "#F7B8A6" },
  { name: "Mint", top: "#7FC7A7", left: "#62AA8A", right: "#4E8F72", light: "#B2E3CC" },
  { name: "Sky", top: "#7FB6E0", left: "#5F98C6", right: "#4A7FAB", light: "#B6D8F2" },
  { name: "Sunflower", top: "#F2C94C", left: "#D9AE36", right: "#C09A2A", light: "#F9E39A" },
  { name: "Rose", top: "#E58FB0", left: "#CC7196", right: "#B15B7E", light: "#F4C0D4" },
  { name: "Moss", top: "#9BB35C", left: "#809845", right: "#697F36", light: "#C8D99A" },
  { name: "Plum", top: "#A0628E", left: "#864C75", right: "#6E3B60", light: "#C99BBD" },
];
const SNACKS = ["strawberry mochi", "cheese toast", "honey pancakes", "seaweed crackers", "cherry pie", "mango pudding", "salted pretzels", "berry yoghurt", "corn dogs", "cinnamon rolls", "rice balls", "choco biscuits"];
export const QUIRKS: readonly Quirk[] = [
  { id: "chatterbox", label: "Chatterbox", blurb: "Talks twice as often." },
  { id: "quiet", label: "Quiet one", blurb: "Talks half as often, and means it." },
  { id: "nightsnacker", label: "Night snacker", blurb: "Raids the fridge after dark." },
  { id: "earlybird", label: "Early bird", blurb: "Up at dawn, whatever time it went to bed." },
  { id: "sleepyhead", label: "Sleepyhead", blurb: "Gets tired a bit faster." },
  { id: "neat", label: "Neat freak", blurb: "Stays clean longer and loves a quick wash." },
  { id: "collector", label: "Collector", blurb: "Treasures keepsakes: gifts mean more." },
  { id: "hummer", label: "Hummer", blurb: "Hums little tunes while it walks." },
  { id: "bookworm", label: "Bookworm", blurb: "Reads whenever it can, whatever its family thinks of books." },
  { id: "speedy", label: "Speedy", blurb: "Always in a hurry: walks a quarter faster." },
  { id: "skywatcher", label: "Sky watcher", blurb: "Loves daydreaming at the window and looking at the stars." },
  { id: "cuddly", label: "Cuddle bug", blurb: "Gets lonely sooner and loves being petted." },
  { id: "appetite", label: "Big appetite", blurb: "Gets hungry faster and loves a seat on the sofa." },
  { id: "lighteater", label: "Light eater", blurb: "Hungers more slowly and loves to dance." },
  { id: "steady", label: "Steady feet", blurb: "Tires more slowly and loves dancing and ball games." },
  { id: "easygoing", label: "Easygoing", blurb: "Takes life as it comes: everything drains a little slower." },
];
const QUIRK_BY_ID = new Map(QUIRKS.map(q => [q.id, q]));
/** Activities a quirk adds to the Friend's loves (and removes from its dislikes). */
const QUIRK_LOVES: Readonly<Partial<Record<QuirkId, readonly string[]>>> = {
  neat: ["wash"], bookworm: ["book", "read"], skywatcher: ["daydream", "stargaze", "telescope"], cuddly: ["pet", "talk"],
  appetite: ["sit", "lounge"], lighteater: ["dance"], steady: ["dance", "ball"], speedy: ["ball"], hummer: ["piano"],
};
const FIRST = ["Mo", "Pi", "Lu", "Bo", "Ki", "Nu", "Zu", "Fi", "Ta", "Ro", "Mi", "Po", "Su", "Ji", "Wo", "Ba", "Gu", "Da", "Ye", "Ko", "Hu", "Te", "Ve", "Lo"];
const MID = ["", "", "", "", "ra", "mi", "lu", "ko"];
const LAST = ["mo", "ppy", "no", "bble", "ki", "to", "zzy", "lo", "ma", "sh", "ri", "gs", "ni", "do", "pi", "x", "mble", "ffin", "na", "bo", "tch", "li", "nk", "ps"];
const PHRASE_A = ["Stars", "Socks", "Crumbs", "Bubbles", "Pickles", "Clouds", "Buttons", "Noodles", "Sprinkles", "Pebbles", "Mittens", "Biscuits"];
const PHRASE_B = ["and spoons!", "forever!", "on toast!", "ahoy!", "in a jar!", "o'clock!", "galore!", "for everyone!", "and moonlight!", "at dawn!"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Actions a Friend can pick as its personal favourite (things the starting house or the catalog offers). */
const FAVORITES = ["stargaze", "daydream", "toys", "bath", "admire", "cook", "snack", "tv", "games", "sit", "book", "read", "dance", "ball", "dress", "piano", "fish", "paint", "arcade", "telescope", "primp", "lounge"];

/** murmur3's 32-bit finalizer: spreads neighbouring seeds and token IDs over the whole range. */
export function fmix(h: number) { h ^= h >>> 16; h = Math.imul(h, 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); return (h ^ (h >>> 16)) >>> 0; }
/** A counter-based generator: draw n is its own hash of (token key, n), so every trait is independent. */
function rng(key: number) {
  let n = 0;
  return () => fmix(fmix(key ^ Math.imul(++n, 0x9E3779B9)) + n) / 4294967296;
}

export function traitsFor(tokenId: bigint, seed: number, t: Temperament, sprites: FriendSprites): Traits {
  const r = rng(fmix(fmix(seed >>> 0) ^ Number(tokenId & 0xFFFFFFFFn) ^ Math.imul(Number((tokenId >> 32n) & 0xFFFFFFFFn), 0x9E3779B1)));
  const pick = <T,>(list: readonly T[]) => list[Math.floor(r() * list.length)];
  const nickname = pick(FIRST) + pick(MID) + pick(LAST);
  const accent = pick(ACCENTS);
  // a personal favourite outside the family's loves, so two Friends of one family still differ
  const options = FAVORITES.filter(a => !t.loves.includes(a) && !t.dislikes.includes(a));
  const favorite = pick(options.length ? options : FAVORITES);
  const snack = pick(SNACKS);
  const month = Math.floor(r() * 12), day = 1 + Math.floor(r() * 28);
  const catchphrase = `${pick(PHRASE_A)} ${pick(PHRASE_B)}`;
  // the quirks are not drawn from a list: they are read off the Friend's own pixels
  const features = pixelFeatures(sprites);
  const traits: Trait[] = habitsFrom(features).map(h => ({ quirk: QUIRK_BY_ID.get(h.quirk as QuirkId)!, strength: h.strength, degree: h.degree, reason: h.reason }));
  return { nickname, accent, favorite, snack, birthday: { month, day, label: `${MONTHS[month]} ${day}` }, catchphrase, quirk: traits[0].quirk, traits, features };
}

/** How strongly this Friend has each quirk (absent = does not have it): the engine scales its own behaviours with it. */
export function quirkStrengths(p: Traits | null): Readonly<Record<string, number>> {
  return Object.fromEntries((p?.traits ?? []).map(x => [x.quirk.id, x.strength]));
}

/** The family temperament with this Friend's own traits folded in. Every effect scales with how strong the
 * measurement is (0.4 just past its cut-off, 1 at its strongest). */
export function personalize(t: Temperament, p: Traits | null): Temperament {
  if (!p) return t;
  const decay = { ...t.decay }, s = quirkStrengths(p);
  const scale = (k: "hunger" | "energy" | "hygiene" | "social" | "fun", by: number) => { decay[k] = (decay[k] ?? 1) * by; };
  if (s.appetite) scale("hunger", 1 + .4 * s.appetite);
  if (s.lighteater) scale("hunger", 1 - .3 * s.lighteater);
  if (s.sleepyhead) scale("energy", 1 + .3 * s.sleepyhead);
  if (s.steady) scale("energy", 1 - .25 * s.steady);
  if (s.neat) scale("hygiene", 1 - .4 * s.neat);
  if (s.cuddly) scale("social", 1 + .35 * s.cuddly);
  if (s.easygoing) for (const k of ["hunger", "energy", "hygiene", "social", "fun"] as const) scale(k, 1 - .15 * s.easygoing);
  const extra = p.traits.flatMap(x => QUIRK_LOVES[x.quirk.id] ?? []);
  const loves = [...t.loves, p.favorite, ...extra].filter((a, i, all) => all.indexOf(a) === i && !!ACTION[a]);
  const dislikes = t.dislikes.filter(a => !extra.includes(a));
  return {
    ...t, loves, dislikes, decay, speed: t.speed * (1 + .3 * (s.speedy ?? 0)),
    voice: { ...t.voice, hello: [`${t.voice.hello[0]} ${p.catchphrase}`], idle: [...t.voice.idle, p.catchphrase, `I could go for some ${p.snack}.`], love: [...t.voice.love, p.catchphrase] },
  };
}
