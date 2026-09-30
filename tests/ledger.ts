// Where simulated RF goes: the split of every spend, exact in base units (18 decimals), and the totals the
// "Where your RF went" panel shows. A special treat is 1 RF (half burned, half to Friend rewards), the birthday
// cake 3 RF (all burned), food, clothes and furniture half and half. Personality changes none of it.
// Run: npm run ledger
import assert from "node:assert/strict";
import { BURN_PERCENT, CAKE_PRICE, EMPTY_LEDGER, RF, SOURCES, TREAT_PRICE, split, spend, totals } from "../games/friend-nook/ledger.ts";
import { ACTION, ACTIONS, STOCK_OF, desire, setTreatName } from "../games/friend-nook/sim.ts";
import { temperamentFor } from "../games/friend-nook/personality.ts";

// prices and shares
assert.equal(TREAT_PRICE, RF); assert.equal(CAKE_PRICE, 3n * RF);
assert.deepEqual(split("treats", TREAT_PRICE), { burned: RF / 2n, rewards: RF / 2n }, "a treat: half burned, half to Friend rewards");
assert.deepEqual(split("cake", CAKE_PRICE), { burned: 3n * RF, rewards: 0n }, "the cake: all burned");
assert.deepEqual(split("food", 2n * RF), { burned: RF, rewards: RF });
assert.deepEqual(split("wardrobe", 5n * RF), { burned: 5n * RF / 2n, rewards: 5n * RF / 2n });
assert.deepEqual(split("furniture", 6n * RF), { burned: 3n * RF, rewards: 3n * RF });
for (const s of SOURCES) for (const c of [0n, 1n, 7n, RF, 3n * RF + 1n, 123456789012345678901n]) {
  const p = split(s, c); assert.equal(p.burned + p.rewards, c, `${s}: nothing lost or made up (${c})`); assert.ok(p.burned >= 0n && p.rewards >= 0n);
  assert.equal(p.burned, c * BURN_PERCENT[s] / 100n);
}

// a session: 1 snack pack, 1 groceries, 2 treats, the cake, a hat, a chair, a plant
let l = EMPTY_LEDGER;
l = spend(l, "food", RF); l = spend(l, "food", 2n * RF); l = spend(l, "treats", TREAT_PRICE); l = spend(l, "treats", TREAT_PRICE);
l = spend(l, "cake", CAKE_PRICE); l = spend(l, "wardrobe", 3n * RF); l = spend(l, "furniture", 2n * RF); l = spend(l, "furniture", 6n * RF);
assert.deepEqual(l, { food: 3n * RF, treats: 2n * RF, cake: 3n * RF, wardrobe: 3n * RF, furniture: 8n * RF }, "per source");
const t = totals(l);
assert.equal(t.spent, 19n * RF);
assert.equal(t.burned, (3n * RF) / 2n + RF + 3n * RF + (3n * RF) / 2n + 4n * RF, "1.5 + 1 + 3 + 1.5 + 4 = 11 RF burned");
assert.equal(t.burned, 11n * RF); assert.equal(t.rewards, 8n * RF); assert.equal(t.burned + t.rewards, t.spent);
assert.deepEqual(totals(EMPTY_LEDGER), { spent: 0n, burned: 0n, rewards: 0n });
assert.equal(EMPTY_LEDGER.cake, 0n, "spend never mutates the old ledger"); assert.deepEqual(spend(EMPTY_LEDGER, "cake", 1n).cake, 1n);

// the treat and the party: paid extras are given by you (never taken by free will), need their stock, and stay out of menus
const stock = { snacks: 3, meals: 2, treats: 1, cakes: 1 }, hungry = { hunger: 10, energy: 50, fun: 10, hygiene: 50, social: 50 };
for (const family of ["Mask", "Colossus", "Hoverer"]) for (const id of ["treat", "party"]) assert.equal(desire(ACTION[id], hungry, temperamentFor(family), 1, 12 * 60, stock), 0, `${family}: free will never takes ${id}`);
assert.equal(ACTION.party.uses, "cake"); assert.equal(ACTION.treat.uses, "treat"); assert.equal(STOCK_OF.cake, "cakes"); assert.equal(STOCK_OF.treat, "treats");
assert.ok(ACTION.party.hidden, "the party is in no menu"); assert.ok(ACTIONS.filter(a => a.on.includes("fridge") && !a.hidden).some(a => a.id === "treat"), "the treat is at the fridge");
// unnamed until the snack secret is found
setTreatName(null); assert.equal(ACTION.treat.label, "Special treat");
setTreatName("strawberry mochi"); assert.equal(ACTION.treat.label, "Strawberry mochi (treat)"); setTreatName(null);
console.log("ledger ok:", t.spent / RF, "RF spent,", t.burned / RF, "burned,", t.rewards / RF, "to Friend rewards");
