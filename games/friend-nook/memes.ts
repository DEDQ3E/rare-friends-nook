/** Meme mode: a random two-line caption about this one Friend, drawn over a snapshot of it in its house.
 * Every template is filled from the Friend's own character (family voice, temperament, traits, quirk, heirloom)
 * and what it is doing right now, so no two Friends get the same memes. Captions only; nothing is paid or saved. */
import { ACTION, NEED_LABEL, NEEDS, moodLabel, type Needs } from "./sim.js";
import type { Temperament } from "./personality.js";
import type { Traits } from "./traits.js";

export type Meme = Readonly<{ top: string; bottom: string; template: number }>;
export type MemeContext = Readonly<{
  nick: string; temper: Temperament; traits: Traits | null; strengthLabel: string; generation: number | null;
  needs: Needs; mood: number; action: string | null; heirloom: string | null;
  /** Secrets the player has found so far (a meme never gives one away). */
  known: Readonly<{ quirk: boolean; favorite: boolean; snack: boolean }>;
}>;

const pick = <T,>(a: readonly T[], r: () => number): T => a[Math.floor(r() * a.length) % a.length];
const label = (id: string | undefined) => (id && ACTION[id] ? ACTION[id].label.toLowerCase() : "");

type Template = (c: MemeContext, r: () => number) => [string, string] | null;
const TEMPLATES: readonly Template[] = [
  (c, r) => ["Nobody:", `${c.nick}: ${pick(c.temper.voice.idle, r)}`],
  (c, r) => c.action ? [`Me: ${label(c.action)}`, `Also me: ${pick(c.temper.voice.love, r)}`] : null,
  (c, r) => { const d = c.temper.dislikes[Math.floor(r() * c.temper.dislikes.length)]; return d ? [`When you ask a ${c.temper.title} to ${label(d)}`, pick(c.temper.voice.nope, r)] : null; },
  (c, r) => { const d = c.temper.dislikes[Math.floor(r() * c.temper.dislikes.length)]; return d ? ["One does not simply", `ask ${c.nick} to ${label(d)}`] : null; },
  c => { const low = NEEDS.reduce((a, k) => (c.needs[k] < c.needs[a] ? k : a)); return c.needs[low] < 60 ? [`${NEED_LABEL[low]}: ${Math.round(c.needs[low])}%`, c.temper.voice[({ hunger: "hungry", energy: "tired", fun: "bored", hygiene: "grubby", social: "lonely" } as const)[low]]] : null; },
  c => [`Happiness: ${c.mood}`, `Feeling ${moodLabel(c.mood).toLowerCase()}. As a ${c.temper.title} should.`],
  c => c.generation ? [`Gen ${c.generation} ${c.temper.family}`, `${c.strengthLabel} ${c.temper.title} energy`] : null,
  c => c.traits && c.known.quirk ? [c.traits.quirk.label, c.traits.quirk.blurb] : null,
  c => c.traits && c.known.favorite && ACTION[c.traits.favorite] ? [`${c.nick} after one ${label(c.traits.favorite)}`, "Worth it."] : null,
  c => c.traits ? [`Birthday: ${c.traits.birthday.label}`, c.known.snack ? `Gifts accepted in ${c.traits.snack}` : "Gifts accepted. Snacks especially."] : null,
  c => c.traits ? ["Every single time:", c.traits.catchphrase] : null,
  c => c.heirloom ? [`The ${c.heirloom.toLowerCase()}`, "It's a family thing. You wouldn't understand."] : null,
  (c, r) => [`${c.nick} hearing you come home`, pick(c.temper.voice.hello, r)],
  (c, r) => { const l = c.temper.loves[Math.floor(r() * c.temper.loves.length)]; return l ? [`Them: we have ${label(l)} at home`, `${c.nick}: ${pick(c.temper.voice.love, r)}`] : null; },
  c => [`${c.temper.title} starter pack`, c.temper.blurb],
];

export const MEME_TEMPLATES = TEMPLATES.length;

/** A random meme for this Friend, never the same template twice in a row. */
export function randomMeme(c: MemeContext, last = -1, r: () => number = Math.random): Meme {
  for (let n = 0; n < 40; n++) {
    const t = Math.floor(r() * TEMPLATES.length); if (t === last) continue;
    const m = TEMPLATES[t](c, r); if (m && m[1]) return { top: m[0], bottom: m[1], template: t };
  }
  return { top: "Nobody:", bottom: `${c.nick}: ${c.temper.voice.idle[0]}`, template: 0 };
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
