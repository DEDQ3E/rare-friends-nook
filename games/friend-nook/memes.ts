/** Meme mode: a random two-line caption about this one Friend, drawn over a snapshot of it in its house.
 * Every template is filled from the Friend's own character (family voice, temperament, traits, quirk, heirloom)
 * and what is happening right now (time of day, its activity, a Gift Box, friendship), and the templates that fit
 * the moment are the likeliest, so no two Friends get the same memes. Captions only; nothing is paid or saved. */
import { ACTION, NEED_LABEL, NEEDS, type NeedKey, type Needs } from "./sim.js";
import type { Temperament } from "./personality.js";
import type { Traits } from "./traits.js";

export type Meme = Readonly<{ top: string; bottom: string; template: number }>;
export type MemeContext = Readonly<{
  nick: string; temper: Temperament; traits: Traits | null; strengthLabel: string; generation: number | null;
  needs: Needs; mood: number; action: string | null; walking: boolean; hour: number;
  heirloom: string | null; heirloomAction: string | null;
  level: number; levelTitle: string;
  gift: Readonly<{ name: string; rare: boolean }> | null; // a Gift Box opened a moment ago
  known: ReadonlySet<string>; // secrets the player found (a meme never spoils one that is still hidden)
}>;

const pick = <T,>(a: readonly T[], r: () => number): T => a[Math.floor(r() * a.length) % a.length];
const label = (id: string | null | undefined) => (id && ACTION[id] ? ACTION[id].label.toLowerCase() : "");
const FOCUS: readonly string[] = ["read", "book", "paint", "telescope", "piano", "fish"];
const QUEST: Readonly<Record<NeedKey, string>> = { hunger: "find the fridge", energy: "find the bed", fun: "find anything fun", hygiene: "find the bath", social: "find you" };
const VOICE: Readonly<Record<NeedKey, "hungry" | "tired" | "bored" | "grubby" | "lonely">> = { hunger: "hungry", energy: "tired", fun: "bored", hygiene: "grubby", social: "lonely" };
const lowest = (n: Needs) => NEEDS.reduce((a, k) => (n[k] < n[a] ? k : a));

/** [top, bottom, weight]: weight grows when the template fits what is happening right now. */
type Template = (c: MemeContext, r: () => number) => readonly [string, string, number] | null;
const TEMPLATES: readonly Template[] = [
  // the moment
  (c, r) => c.hour >= 5 && c.hour < 12 ? ["gm", `${c.nick}: ${pick(c.temper.voice.idle, r)}`, 3] : null,
  c => c.hour >= 21 || c.hour < 5 ? ["gn", `${c.nick}: ${c.temper.voice.tired}`, 3] : null,
  c => c.action && c.temper.loves.includes(c.action) ? ["+1000 aura", `${c.nick}: ${label(c.action)}`, 4] : null,
  (c, r) => c.action === "cook" ? ["Let him cook", pick(c.temper.voice.love, r), 6] : null,
  c => c.action && FOCUS.includes(c.action) ? ["Locked in", `${c.nick}: ${label(c.action)}`, 5] : null,
  c => !c.action ? ["NPC behaviour", c.walking ? `${c.nick} walking around the house for no reason` : `${c.nick} standing perfectly still`, 2] : null,
  c => { const low = lowest(c.needs); return c.needs[low] < 50 ? [`Side quest: ${QUEST[low]}`, `${NEED_LABEL[low]} ${Math.round(c.needs[low])}%. ${c.temper.voice[VOICE[low]]}`, 3] : null; },
  c => c.gift ? [`Opened a Gift Box: ${c.gift.name}`, c.gift.rare ? "Generational wealth" : "Still bullish", 6] : null,
  c => c.level >= 1 ? ["WAGMI", `Friendship level: ${c.levelTitle}`, 2] : null,
  c => c.heirloom ? [`The ${c.heirloom.toLowerCase()}`, "It's a family thing. You wouldn't understand.", c.action && c.action === c.heirloomAction ? 5 : 1] : null,
  c => [`Happiness: ${c.mood}`, c.mood >= 80 ? "Thriving, honestly" : c.mood >= 62 ? "Living its best life" : c.mood >= 45 ? "Mid" : c.mood >= 28 ? "Surviving" : "Not okay", c.mood >= 80 || c.mood < 28 ? 3 : 1],
  // its character
  (c, r) => { const d = c.temper.dislikes[Math.floor(r() * c.temper.dislikes.length)]; return d ? [`POV: you asked a ${c.temper.title} to ${label(d)}`, pick(c.temper.voice.nope, r), 2] : null; },
  (c, r) => [`Tell me you're a ${c.temper.title} without telling me you're a ${c.temper.title}`, pick(c.temper.voice.idle, r), 1],
  (c, r) => [`It's giving ${c.temper.title}`, pick(c.temper.voice.love, r), 1],
  c => c.generation ? (c.generation === 1 ? ["Main character energy", `Gen 1 ${c.temper.family}`, 2] : [`Gen ${c.generation} ${c.temper.family}`, `${c.strengthLabel} ${c.temper.title} energy`, 1]) : null,
  (c, r) => ["Nobody:", `${c.nick}: ${pick(c.temper.voice.idle, r)}`, 1],
  c => c.traits ? ["Every single time:", c.traits.catchphrase, 1] : null,
  // found secrets only
  c => c.traits && c.known.has("quirk") ? [`${c.nick}'s toxic trait:`, c.traits.quirk.blurb, 2] : null,
  c => c.traits && c.known.has("favorite") && ACTION[c.traits.favorite] ? ["Core memory unlocked", `${c.nick}: ${label(c.traits.favorite)}`, c.action === c.traits.favorite ? 5 : 2] : null,
  c => c.traits && c.known.has("snack") ? ["HODL", `${c.nick} guarding the last ${c.traits.snack}`, 2] : null,
  c => c.traits && c.known.has("birthday") && c.known.has("snack") ? [`Birthday: ${c.traits.birthday.label}`, `Gifts accepted in ${c.traits.snack}`, 1] : null,
];

export const MEME_TEMPLATES = TEMPLATES.length;

/** A random meme for this Friend: the ones that fit the moment are likelier, never the same template twice in a row. */
export function randomMeme(c: MemeContext, last = -1, r: () => number = Math.random): Meme {
  const options: { top: string; bottom: string; template: number; w: number }[] = [];
  TEMPLATES.forEach((t, template) => { if (template === last) return; const m = t(c, r); if (m && m[1]) options.push({ top: m[0], bottom: m[1], template, w: m[2] }); });
  let x = r() * options.reduce((s, o) => s + o.w, 0);
  for (const o of options) { x -= o.w; if (x <= 0) return { top: o.top, bottom: o.bottom, template: o.template }; }
  return options.length ? options[options.length - 1] : { top: "Nobody:", bottom: `${c.nick}: ${c.temper.voice.idle[0]}`, template: 15 };
}

/** Draw the meme: the snapshot, then white captions with a black outline, top and bottom, and a small credit. */
export function renderMeme(photo: HTMLCanvasElement, meme: Meme, credit: string): string {
  const W = 600, H = Math.round(W * photo.height / Math.max(1, photo.width));
  const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d"); if (!g) return "";
  g.imageSmoothingEnabled = false; g.drawImage(photo, 0, 0, W, H);
  const caption = (text: string, top: boolean) => {
    let size = 44, lines: string[] = [];
    for (; size >= 20; size -= 2) {
      g.font = `900 ${size}px Impact, "Arial Black", sans-serif`; lines = []; let line = "";
      for (const w of text.toUpperCase().split(/\s+/)) { const t = line ? `${line} ${w}` : w; if (g.measureText(t).width > W - 28 && line) { lines.push(line); line = w; } else line = t; }
      lines.push(line); if (lines.length <= 2 && lines.every(l => g.measureText(l).width <= W - 28)) break;
    }
    g.textAlign = "center"; g.textBaseline = top ? "top" : "bottom"; g.lineJoin = "round"; g.lineWidth = Math.max(4, size / 6); g.strokeStyle = "#000"; g.fillStyle = "#fff";
    lines.forEach((l, n) => { const y = top ? 10 + n * size * 1.05 : H - 22 - (lines.length - 1 - n) * size * 1.05; g.strokeText(l, W / 2, y); g.fillText(l, W / 2, y); });
  };
  caption(meme.top, true); caption(meme.bottom, false);
  g.font = "bold 11px \"Courier New\", monospace"; g.textAlign = "right"; g.textBaseline = "bottom"; g.lineWidth = 3; g.strokeStyle = "rgba(0,0,0,.6)"; g.fillStyle = "#fff";
  g.strokeText(credit, W - 6, H - 4); g.fillText(credit, W - 6, H - 4);
  return c.toDataURL("image/png");
}
