// The food riddle: every family likes three of the shop's eight foods and dislikes two; a Friend loves one of its family's
// three (deterministic from the token); what is in the fridge at the start varies (its loved food, nothing special, or a
// food it dislikes). Nothing here touches a price, an odds table or a reward.
// Run: npm run food
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FAMILY_FOOD, personalize, startFoods, traitsFor } from "../games/friend-nook/traits.ts";
import { FOODS, FOOD_BY_ID } from "../games/friend-nook/sim.ts";
import { temperamentFor } from "../games/friend-nook/personality.ts";
import { HEIRLOOMS } from "../games/friend-nook/heirlooms.ts";

// ---- the family tables
const ids = new Set(FOODS.map(f => f.id)), families = Object.keys(FAMILY_FOOD);
assert.equal(families.length, 9, "nine families"); assert.equal(FOODS.length, 8);
for (const h of HEIRLOOMS) assert.ok(FAMILY_FOOD[h.family], `${h.family} has a table`);
for (const [family, t] of Object.entries(FAMILY_FOOD)) {
  assert.equal(t.likes.length, 3, `${family} likes three`); assert.equal(t.dislikes.length, 2, `${family} dislikes two`);
  for (const f of [...t.likes, ...t.dislikes]) assert.ok(ids.has(f), `${family}: ${f} is a shop food`);
  assert.equal(new Set([...t.likes, ...t.dislikes]).size, 5, `${family}: nothing both liked and disliked, nothing twice`);
}
for (const f of FOODS) {
  assert.ok(families.some(k => FAMILY_FOOD[k].likes.includes(f.id)), `${f.name} is liked by some family`);
  assert.ok(families.some(k => FAMILY_FOOD[k].dislikes.includes(f.id)), `${f.name} is disliked by some family`);
}
assert.equal(new Set(families.map(k => FAMILY_FOOD[k].likes.join())).size, 9, "no two families share a table");

// ---- a Friend: its loved food is one of its family's three, determinism, and what used to come from hashes is unchanged
const ten: { id: string; family: string; seed: number; idleDown: string[]; walkDown: string[][] }[] = JSON.parse(readFileSync("tests/fixtures/ten-friends.json", "utf8"));
const sp = (r: (typeof ten)[number]) => { const f = ["right", "left", "up", "down"] as const, set = (w: string[][]) => Object.fromEntries(f.map(k => [k, w])) as any; return { walk: set(r.walkDown), idle: set(Array(8).fill(r.idleDown)) }; };
const NAMES: Record<string, string> = { "87846": "Rox", "65001": "Nuraki", "1969": "Veluri", "15000": "Robo", "7730": "Humippy", "20838": "Yeps", "66666": "Kikosh", "77777": "Daluno", "444": "Kozzy", "88888": "Luli" };
const starts: Record<string, number> = { stocked: 0, hunt: 0, picky: 0 };
for (const r of ten) {
  const t = temperamentFor(r.family), a = traitsFor(BigInt(r.id), r.seed, t, sp(r)), b = traitsFor(BigInt(r.id), r.seed, t, sp(r));
  assert.deepEqual(a.food, b.food, "deterministic"); assert.equal(a.nickname, NAMES[r.id], "the hashed traits did not move");
  const table = FAMILY_FOOD[r.family]; assert.ok(table.likes.includes(a.food.loved), `${r.family}: its favourite is one of its family's three`);
  assert.deepEqual(a.food.hated, table.dislikes); assert.equal(a.snack, FOOD_BY_ID[a.food.loved].name.toLowerCase(), "the favourite snack is the food it loves");
  starts[a.food.start]++;
  const p = personalize(t, a);
  assert.ok(p.loves.includes(`food:${a.food.loved}`), "it loves its food like any other activity"); for (const h of a.food.hated) assert.ok(p.dislikes.includes(`food:${h}`) && !p.loves.includes(`food:${h}`));
  const fridge = startFoods(a.food);
  if (a.food.start === "stocked") assert.deepEqual(fridge, { [a.food.loved]: 2 }); else if (a.food.start === "picky") assert.deepEqual(fridge, { [a.food.hated[0]]: 2 }); else assert.deepEqual(fridge, {});
  console.log(`#${r.id}`.padEnd(7), r.family.padEnd(10), "loves", FOOD_BY_ID[a.food.loved].name.padEnd(17), "start", a.food.start.padEnd(7), "hates", a.food.hated.map(h => FOOD_BY_ID[h].name).join(" + "));
}
assert.equal(temperamentFor("Hoverer").loves.some(l => l.startsWith("food:")), false, "the family temperament itself knows no food: it is per Friend");

// ---- over many tokens: every scenario and every liked food turns up, about evenly
const r0 = ten.find(r => r.id === "7730")!, sprites = sp(r0), seen: Record<string, number> = { stocked: 0, hunt: 0, picky: 0 }, loved: Record<string, number> = {};
const N = 3000; for (let i = 1; i <= N; i++) { const t = traitsFor(BigInt(i), i, temperamentFor("Skeleton"), sprites); seen[t.food.start]++; loved[t.food.loved] = (loved[t.food.loved] ?? 0) + 1; }
for (const [k, n] of Object.entries(seen)) assert.ok(n > N * 0.28 && n < N * 0.39, `${k}: about a third of the Friends (${n}/${N})`);
assert.deepEqual(Object.keys(loved).sort(), [...FAMILY_FOOD.Skeleton.likes].sort(), "only its family's liked foods are ever loved");
for (const [k, n] of Object.entries(loved)) assert.ok(n > N * 0.28 && n < N * 0.39, `${k}: about a third (${n}/${N})`);
// an unknown family still gets a table
assert.ok(traitsFor(5n, 5, temperamentFor(null), sprites).food.likes.length === 3);
console.log("food ok:", JSON.stringify(seen), JSON.stringify(loved));
