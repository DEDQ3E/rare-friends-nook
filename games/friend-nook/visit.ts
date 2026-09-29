/** Visiting a simulated neighbour: the things to do together and how both characters take them. The house itself
 * is the neighbour's own engine (see index.tsx); this file decides what each one says. */
import type { Temperament } from "./personality.js";

export type VisitAct = Readonly<{ id: string; label: string; like: string; neutral: string; hostNeutral: string; icon: string }>;
/** Things to do together; `like` is the everyday activity whose taste decides how each Friend feels about it. */
export const VISIT_ACTS: readonly VisitAct[] = [
  { id: "hug", label: "Hug", like: "pet", neutral: "Aww. Okay, a quick one.", hostNeutral: "Oh! Hello to you too.", icon: "heart" },
  { id: "hi", label: "Say hi", like: "talk", neutral: "Hi, neighbour!", hostNeutral: "Come in, come in.", icon: "chat" },
  { id: "dance", label: "Dance together", like: "dance", neutral: "One song. Maybe two.", hostNeutral: "Only if I lead.", icon: "note" },
  { id: "snack", label: "Share a snack", like: "snack", neutral: "Thanks, I'll try it.", hostNeutral: "Take the big one.", icon: "apple" },
];
export type Reaction = Readonly<{ guest: string; host: string; verdict: string; score: number }>;
const taste = (t: Temperament, id: string) => (t.loves.includes(id) ? 1 : t.dislikes.includes(id) ? -1 : 0);
const pickLine = (a: readonly string[], r: () => number) => a[Math.floor(r() * a.length) % a.length];

/** How the two Friends take it: each one's taste, plus a bonus when they share a family. */
export function react(guest: Temperament, host: Temperament, act: VisitAct, r: () => number = Math.random): Reaction {
  const g = taste(guest, act.like), h = taste(host, act.like), same = guest.family === host.family;
  const line = (t: Temperament, v: number, neutral: string) => (v > 0 ? pickLine(t.voice.love, r) : v < 0 ? pickLine(t.voice.nope, r) : neutral);
  const score = g + h + (same ? 1 : 0);
  const verdict = same && score >= 1 ? "Family reunion!" : score >= 2 ? "Instant besties" : score === 1 ? "Good vibes"
    : score === 0 ? "Polite and friendly" : score === -1 ? "A bit awkward" : "Never again. Probably.";
  return { guest: line(guest, g, act.neutral), host: line(host, h, act.hostNeutral), verdict, score };
}
