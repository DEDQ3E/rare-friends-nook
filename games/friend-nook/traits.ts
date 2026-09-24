/** Personal traits: what makes THIS Friend unique, not just its family. Derived deterministically from the
 * token's canonical sprite seed and token ID (read by the SDK's sprite reader), so the same Friend always has
 * the same nickname, favourite colour, favourite thing, favourite snack, birthday, catchphrase and quirk.
 * Traits only change behaviour and looks. They never change prices, odds, rewards, or who may play. */
import { ACTION } from "./sim.js";
import type { Temperament } from "./personality.js";

export type Accent = Readonly<{ name: string; top: string; left: string; right: string; light: string }>;
export type Quirk = Readonly<{ id: "chatterbox" | "quiet" | "nightsnacker" | "earlybird" | "sleepyhead" | "neat" | "collector" | "hummer"; label: string; blurb: string }>;
export type Traits = Readonly<{
  nickname: string; accent: Accent; favorite: string; snack: string; birthday: { month: number; day: number; label: string };
  catchphrase: string; quirk: Quirk;
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
const QUIRKS: readonly Quirk[] = [
  { id: "chatterbox", label: "Chatterbox", blurb: "Talks twice as often." },
  { id: "quiet", label: "Man of few words", blurb: "Talks half as often, and means it." },
  { id: "nightsnacker", label: "Night snacker", blurb: "Raids the fridge after dark." },
  { id: "earlybird", label: "Early bird", blurb: "Up at dawn, whatever time it went to bed." },
  { id: "sleepyhead", label: "Sleepyhead", blurb: "Gets tired a bit faster." },
  { id: "neat", label: "Neat freak", blurb: "Stays clean longer and loves a quick wash." },
  { id: "collector", label: "Collector", blurb: "Treasures keepsakes: gifts mean more." },
  { id: "hummer", label: "Hummer", blurb: "Hums little tunes while it walks." },
];
const FIRST = ["Mo", "Pi", "Lu", "Bo", "Ki", "Nu", "Zu", "Fi", "Ta", "Ro", "Mi", "Po", "Su", "Ji", "Wo", "Ba"];
const LAST = ["mo", "ppy", "no", "bble", "ki", "to", "zzy", "lo", "ma", "sh", "ri", "gs", "ni", "do", "pi", "x"];
const PHRASE_A = ["Stars", "Socks", "Crumbs", "Bubbles", "Pickles", "Clouds", "Buttons", "Noodles", "Sprinkles", "Pebbles", "Mittens", "Biscuits"];
const PHRASE_B = ["and spoons!", "forever!", "on toast!", "ahoy!", "in a jar!", "o'clock!", "galore!", "for everyone!", "and moonlight!", "at dawn!"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Actions a Friend can pick as its personal favourite (things the starting house or the catalog offers). */
const FAVORITES = ["stargaze", "daydream", "toys", "bath", "admire", "cook", "snack", "tv", "games", "sit", "book", "read", "dance", "ball", "dress", "piano", "fish", "paint", "arcade", "telescope", "primp", "lounge"];

/** mulberry32: a small deterministic generator seeded from the token. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function traitsFor(tokenId: bigint, seed: number, t: Temperament): Traits {
  const r = rng((seed ^ Number(tokenId % 2147483647n) * 2654435761) >>> 0);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(r() * list.length)];
  const nickname = pick(FIRST) + pick(LAST);
  const accent = pick(ACCENTS);
  // a personal favourite outside the family's loves, so two Friends of one family still differ
  const options = FAVORITES.filter(a => !t.loves.includes(a) && !t.dislikes.includes(a));
  const favorite = pick(options.length ? options : FAVORITES);
  const snack = pick(SNACKS);
  const month = Math.floor(r() * 12), day = 1 + Math.floor(r() * 28);
  const catchphrase = `${pick(PHRASE_A)} ${pick(PHRASE_B)}`;
  const quirk = pick(QUIRKS);
  return { nickname, accent, favorite, snack, birthday: { month, day, label: `${MONTHS[month]} ${day}` }, catchphrase, quirk };
}

/** The family temperament with this Friend's own traits folded in. */
export function personalize(t: Temperament, p: Traits | null): Temperament {
  if (!p) return t;
  const decay = { ...t.decay };
  if (p.quirk.id === "sleepyhead") decay.energy = (decay.energy ?? 1) * 1.2;
  if (p.quirk.id === "neat") decay.hygiene = (decay.hygiene ?? 1) * .7;
  const loves = [...t.loves, p.favorite, ...(p.quirk.id === "neat" ? ["wash"] : [])].filter((a, i, all) => all.indexOf(a) === i && !!ACTION[a]);
  return {
    ...t, loves, decay,
    voice: { ...t.voice, hello: [`${t.voice.hello[0]} ${p.catchphrase}`], idle: [...t.voice.idle, p.catchphrase, `I could go for some ${p.snack}.`], love: [...t.voice.love, p.catchphrase] },
  };
}
