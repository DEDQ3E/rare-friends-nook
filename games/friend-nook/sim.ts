/** Life simulation: needs, the in-game clock, actions and free will. Pure logic (no drawing), so it can be
 * tested on its own. One in-game day lasts 8 real minutes at 1× speed (3 in-game minutes per real second). */
import { preference, type Temperament } from "./personality.js";

export type NeedKey = "hunger" | "energy" | "fun" | "hygiene" | "social";
export type Needs = Record<NeedKey, number>;
export const NEEDS: readonly NeedKey[] = ["hunger", "energy", "fun", "hygiene", "social"];
export const NEED_LABEL: Readonly<Record<NeedKey, string>> = { hunger: "Hunger", energy: "Energy", fun: "Fun", hygiene: "Hygiene", social: "Social" };
/** Points lost per in-game hour before temperament multipliers. */
export const DECAY: Readonly<Record<NeedKey, number>> = { hunger: 5, energy: 3.5, fun: 6, hygiene: 3, social: 4 };
export const GAME_MINUTES_PER_SECOND = 3;
export const DAY_MINUTES = 24 * 60;

export const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));
export const isNight = (minute: number) => { const h = (minute % DAY_MINUTES) / 60; return h >= 21 || h < 6; };
export const hourOf = (minute: number) => Math.floor((minute % DAY_MINUTES) / 60);
export const clockText = (minute: number) => {
  const m = Math.floor(minute % DAY_MINUTES);
  return `Day ${Math.floor(minute / DAY_MINUTES) + 1} · ${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
/** Darkness 0 (day) … 1 (night), with dusk 18–21 and dawn 5–8. */
export function darkness(minute: number): number {
  const h = (minute % DAY_MINUTES) / 60;
  if (h >= 21 || h < 5) return 1;
  if (h >= 18) return (h - 18) / 3;
  if (h < 8) return 1 - (h - 5) / 3;
  return 0;
}

export function decayNeeds(n: Needs, hours: number, t: Temperament, asleep: boolean, minute: number) {
  const night = isNight(minute);
  for (const k of NEEDS) {
    let rate = DECAY[k] * (t.decay[k] ?? 1);
    if (k === "energy") { if (asleep) continue; if (t.nightOwl) rate *= night ? .5 : 1.3; }
    if (asleep) rate *= .4;
    n[k] = clamp(n[k] - rate * hours);
  }
}
/** Mood 0…100: the average, pulled down by the lowest need. */
export function mood(n: Needs): number {
  const v = NEEDS.map(k => n[k]); const avg = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.round(.6 * avg + .4 * Math.min(...v));
}
export const moodLabel = (m: number) => (m >= 80 ? "Radiant" : m >= 62 ? "Happy" : m >= 45 ? "Okay" : m >= 28 ? "Grumpy" : "Miserable");

export type Pose = "stand" | "seat" | "lie" | "bath";
export type Anim = "still" | "bounce" | "dance" | "hop" | "sway";
export type ActionDef = Readonly<{
  id: string;
  label: string;
  on: readonly string[];          // furniture def ids (or "friend") that offer it
  seat?: string;                  // use the pose of this furniture instead (TV → sofa)
  minutes: number;                // in-game duration
  rates?: Readonly<Partial<Needs>>; // change per in-game hour while doing it
  done?: Readonly<Partial<Needs>>;  // one-off change when finished
  pose: Pose;
  anim: Anim;
  uses?: "snack" | "meal";
  when?: "night" | "day";
  withYou?: boolean;              // you take part (counts as company)
  panel?: "wardrobe" | "keepsakes" | "gift";
  icon: string;                   // wish / menu icon key
  sleep?: boolean;
}>;

export const ACTIONS: readonly ActionDef[] = [
  { id: "sleep", label: "Sleep", on: ["bed"], minutes: 360, rates: { energy: 16 }, pose: "lie", anim: "still", icon: "moon", sleep: true },
  { id: "nap", label: "Nap", on: ["bed", "sofa"], minutes: 60, rates: { energy: 22 }, pose: "lie", anim: "still", icon: "zzz", sleep: true },
  { id: "dress", label: "Change outfit", on: ["wardrobe"], minutes: 15, done: { fun: 10 }, pose: "stand", anim: "hop", panel: "wardrobe", icon: "hat" },
  { id: "stargaze", label: "Stargaze", on: ["windowseat"], minutes: 60, rates: { fun: 26, energy: 4 }, pose: "seat", anim: "sway", when: "night", icon: "star" },
  { id: "daydream", label: "Daydream", on: ["windowseat"], minutes: 45, rates: { fun: 18, energy: 6 }, pose: "seat", anim: "sway", when: "day", icon: "cloud" },
  { id: "toys", label: "Play with toys", on: ["toychest"], minutes: 45, rates: { fun: 34, energy: -6 }, pose: "stand", anim: "hop", icon: "toy" },
  { id: "bath", label: "Take a bath", on: ["bathtub"], minutes: 40, rates: { hygiene: 110, fun: 6 }, pose: "bath", anim: "sway", icon: "bath" },
  { id: "wash", label: "Wash up", on: ["bathsink"], minutes: 15, rates: { hygiene: 90 }, pose: "stand", anim: "bounce", icon: "drop" },
  { id: "admire", label: "Admire self", on: ["bathsink"], minutes: 20, rates: { fun: 36 }, pose: "stand", anim: "bounce", icon: "mirror" },
  { id: "cook", label: "Cook a meal", on: ["counter"], minutes: 45, done: { hunger: 70, fun: 8 }, pose: "stand", anim: "bounce", uses: "meal", icon: "pot" },
  { id: "snack", label: "Grab a snack", on: ["fridge"], minutes: 10, done: { hunger: 22 }, pose: "stand", anim: "bounce", uses: "snack", icon: "apple" },
  { id: "bar", label: "Snack at the bar", on: ["stool", "island"], seat: "stool", minutes: 20, done: { hunger: 30, fun: 5 }, pose: "seat", anim: "bounce", uses: "snack", icon: "apple" },
  { id: "dinner", label: "Family dinner", on: ["chair-n", "chair-s", "dtable"], seat: "chair", minutes: 40, done: { hunger: 65 }, rates: { social: 40 }, pose: "seat", anim: "bounce", uses: "meal", withYou: true, icon: "plate" },
  { id: "tv", label: "Watch TV", on: ["tv", "sofa"], seat: "sofa", minutes: 60, rates: { fun: 24, energy: -2 }, pose: "seat", anim: "still", icon: "tv" },
  { id: "games", label: "Play video games", on: ["tv"], seat: "sofa", minutes: 45, rates: { fun: 38, energy: -5 }, pose: "seat", anim: "bounce", icon: "pad" },
  { id: "sit", label: "Relax", on: ["sofa"], minutes: 30, rates: { energy: 12, fun: 6 }, pose: "seat", anim: "still", icon: "sofa" },
  { id: "book", label: "Browse books", on: ["bookshelf"], minutes: 20, rates: { fun: 22 }, pose: "stand", anim: "still", icon: "book" },
  { id: "read", label: "Read", on: ["armchair"], minutes: 50, rates: { fun: 26, energy: 5 }, pose: "seat", anim: "still", icon: "book" },
  { id: "dance", label: "Dance", on: ["record"], minutes: 30, rates: { fun: 44, energy: -10 }, pose: "stand", anim: "dance", icon: "note" },
  { id: "ball", label: "Play ball with you", on: ["ball"], minutes: 30, rates: { fun: 40, social: 34, energy: -6 }, pose: "stand", anim: "hop", withYou: true, icon: "ball" },
  { id: "arcade", label: "Play arcade", on: ["arcade"], minutes: 30, rates: { fun: 46, energy: -6 }, pose: "stand", anim: "bounce", icon: "pad" },
  { id: "fish", label: "Watch the fish", on: ["aquarium"], minutes: 30, rates: { fun: 22, energy: 5 }, pose: "stand", anim: "sway", icon: "fish" },
  { id: "lounge", label: "Flop on the bean bag", on: ["beanbag"], minutes: 40, rates: { energy: 16, fun: 8 }, pose: "seat", anim: "still", icon: "sofa" },
  { id: "paint", label: "Paint", on: ["easel"], minutes: 40, rates: { fun: 32 }, pose: "stand", anim: "sway", icon: "brush" },
  { id: "telescope", label: "Look through the telescope", on: ["telescope"], minutes: 40, rates: { fun: 36 }, pose: "stand", anim: "still", when: "night", icon: "star" },
  { id: "primp", label: "Primp", on: ["vanity"], minutes: 20, rates: { fun: 34, hygiene: 10 }, pose: "stand", anim: "bounce", icon: "mirror" },
  { id: "piano", label: "Play the piano", on: ["piano"], minutes: 30, rates: { fun: 38, social: 6 }, pose: "stand", anim: "bounce", icon: "note" },
  { id: "keepsakes", label: "Look at keepsakes", on: ["hutch"], minutes: 10, done: { fun: 6 }, pose: "stand", anim: "still", panel: "keepsakes", icon: "gift" },
  { id: "pet", label: "Pet", on: ["friend"], minutes: 5, done: { social: 16, fun: 4 }, pose: "stand", anim: "bounce", withYou: true, icon: "heart" },
  { id: "talk", label: "Talk", on: ["friend"], minutes: 8, done: { social: 12 }, pose: "stand", anim: "bounce", withYou: true, icon: "chat" },
  { id: "gift", label: "Open a Gift Box", on: ["friend"], minutes: 5, pose: "stand", anim: "hop", withYou: true, panel: "gift", icon: "gift" },
];
export const ACTION: Readonly<Record<string, ActionDef>> = Object.fromEntries(ACTIONS.map(a => [a.id, a]));

export const available = (a: ActionDef, minute: number) => !a.when || (a.when === "night") === isNight(minute);
export const actionsOn = (def: string, minute: number) => ACTIONS.filter(a => a.on.includes(def) && available(a, minute));

export type Stock = { snacks: number; meals: number };

/** Free will: how much the Friend wants to do this right now (0 = never). */
export function desire(a: ActionDef, n: Needs, t: Temperament, strength: number, minute: number, stock: Stock): number {
  if (!available(a, minute) || a.panel || a.withYou) return 0;
  if (a.uses === "snack" && stock.snacks <= 0) return 0;
  if (a.uses === "meal" && stock.meals <= 0) return 0;
  const hours = a.minutes / 60;
  let value = 0;
  for (const k of Object.keys({ ...a.rates, ...a.done }) as NeedKey[]) {
    const gain = Math.min(100 - n[k], (a.rates?.[k] ?? 0) * hours + (a.done?.[k] ?? 0));
    const urgency = Math.pow((100 - n[k]) / 100, 2) + .05;
    value += gain * urgency;
  }
  if (a.sleep) { const night = isNight(minute); value *= a.id === "sleep" ? (night ? (t.nightOwl ? .6 : 2.2) : .15) : night ? .6 : 1; if (n.energy > 70) value *= .2; }
  return Math.max(0, value * preference(t, strength, a.id));
}
