// Quirks are read from a Friend's own pixels: the ten real Friends (frames read live from Robinhood mainnet, see
// tests/fixtures/ten-friends.json) get the traits below, each with a reason; the same Friend always gets the same
// ones; everything is a ratio of the Friend's own size, so odd or empty sprites cannot break it.
// Run: npm run pixels
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pixelFeatures, habitsFrom, POLES } from "../games/friend-nook/pixels.ts";
import { traitsFor, personalize, quirkStrengths, quirkBehind, QUIRKS } from "../games/friend-nook/traits.ts";
import { temperamentFor } from "../games/friend-nook/personality.ts";

type Row = { id: string; family: string; seed: number; idleDown: string[]; walkDown: string[][] };
const ten: Row[] = JSON.parse(readFileSync("tests/fixtures/ten-friends.json", "utf8"));
const spritesOf = (r: Row) => { const f = ["right", "left", "up", "down"] as const, set = (w: string[][]) => Object.fromEntries(f.map(k => [k, w])) as any; return { walk: set(r.walkDown), idle: set(Array(8).fill(r.idleDown)) }; };

// what the ten get (main quirk + habit): these are the published numbers, so a change here must be deliberate
const EXPECT: Record<string, string[]> = {
  "87846": ["appetite", "neat"], "65001": ["neat", "bookworm"], "1969": ["quiet", "speedy"], "15000": ["chatterbox", "hummer"], "7730": ["cuddly", "sleepyhead"],
  "20838": ["appetite", "chatterbox"], "66666": ["collector", "hummer"], "77777": ["appetite", "neat"], "444": ["skywatcher", "neat"], "88888": ["earlybird", "lighteater"],
};
const combos = new Set<string>();
for (const r of ten) {
  const sprites = spritesOf(r), t = traitsFor(BigInt(r.id), r.seed, temperamentFor(r.family), sprites), again = traitsFor(BigInt(r.id), r.seed, temperamentFor(r.family), sprites);
  assert.deepEqual(t.traits.map(x => x.quirk.id), EXPECT[r.id], `#${r.id} ${r.family}`);
  assert.deepEqual(t, again, "deterministic");
  for (const x of t.traits) { assert.match(x.reason, /^[A-Z][^,]+, so /, `a reason for ${x.quirk.id}`); assert.ok(x.strength >= 0.4 && x.strength <= 1, "strength 0.4..1"); }
  assert.equal(t.quirk, t.traits[0].quirk);
  combos.add(t.traits.map(x => x.quirk.id).join("+"));
  console.log(`#${r.id}`.padEnd(7), r.family.padEnd(10), t.traits.map(x => `${x.quirk.label} (${x.degree}): ${x.reason}`).join("  |  "));
}
// the reason the game gives for a quirk-loved choice names the quirk that makes it love it, not just the main one
const tr = (id: string) => { const r = ten.find(x => x.id === id)!; return traitsFor(BigInt(id), r.seed, temperamentFor(r.family), spritesOf(r)); };
assert.equal(quirkBehind(tr("65001"), "read")?.quirk.id, "bookworm", "Nuraki reads because of its second quirk");
assert.equal(quirkBehind(tr("88888"), "dance")?.quirk.id, "lighteater", "Luli dances because of its second quirk");
assert.equal(quirkBehind(tr("65001"), "toys"), undefined);
assert.ok(combos.size >= 9, `ten Friends, at least nine different combinations (got ${combos.size})`);

// the measurements themselves, on two Friends that are easy to read by eye
const eyes = pixelFeatures(spritesOf(ten.find(r => r.id === "444")!)), mask = pixelFeatures(spritesOf(ten.find(r => r.id === "87846")!));
assert.equal(eyes.eyes, 8, "#444 has 2 × 2 eye holes twice"); assert.equal(mask.symmetry, 1, "a Mask is perfectly symmetrical");
assert.ok(pixelFeatures(spritesOf(ten.find(r => r.id === "66666")!)).spark >= 10, "Sparkling floats sparkles");

// every quirk is reachable, strength scales its effect, and any sprite (even empty) still gives a character
const reach = new Set(POLES.map(p => p.quirk)); reach.add("easygoing");
assert.deepEqual([...QUIRKS.map(q => q.id)].sort(), [...reach].sort(), "every quirk comes from a measurement");
const blank = { walk: Object.fromEntries(["right", "left", "up", "down"].map(k => [k, Array(8).fill(Array(16).fill("................"))])) as any, idle: {} as any };
blank.idle = blank.walk;
const nothing = habitsFrom(pixelFeatures(blank)); assert.ok(nothing.length >= 1 && nothing.every(h => h.reason.includes(", so ")), "an empty sprite still gets a reasoned character"); console.log("empty sprite:", nothing.map(h => h.reason).join(" / "));
const plain = temperamentFor("Mask"), strong = personalize(plain, traitsFor(20838n, 20838, plain, spritesOf(ten.find(r => r.id === "20838")!)));
assert.ok((strong.decay.hunger ?? 1) > (plain.decay.hunger ?? 1) * 1.3, "a strong big appetite drains hunger at least 30% faster");
assert.equal(quirkStrengths(null).appetite, undefined);
console.log("ok");
