// The street: the neighbours are real Generations Friends from a recorded snapshot (games/friend-nook/street.json), picked
// without any network read: the three closest to your token number live next door, one is "new this week" by a hash of the
// ISO week (UTC) and your token ID. Deterministic, never the player, and the two SDK samples only when the snapshot is empty.
// Run: npm run street
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { SNAPSHOT, SNAPSHOT_DATE, STREET_NEW, STREET_NEXT_DOOR, isoWeek, neighbours, pickStreet, streetFor } from "../games/friend-nook/neighbours.ts";
import { HOMES } from "../games/friend-nook/homes.ts";

// ---- the snapshot itself: provenance, coverage, and every Friend decodes
const raw = JSON.parse(readFileSync("games/friend-nook/street.json", "utf8"));
assert.equal(raw.version, 1);
assert.equal(raw.source.chainId, 4663); assert.match(raw.source.generations, /^0x[0-9a-fA-F]{40}$/); assert.match(raw.source.registry, /^0x[0-9a-fA-F]{40}$/);
assert.match(raw.source.method, /No owner addresses are read or stored/); assert.match(raw.source.method, /Rare Royale roster/);
assert.match(raw.source.builtAt, /^\d{4}-\d\d-\d\dT/); assert.equal(raw.source.snapshotDate, raw.source.builtAt.slice(0, 10)); assert.equal(SNAPSHOT_DATE, raw.source.snapshotDate);
assert.ok(SNAPSHOT.length >= 30 && SNAPSHOT.length <= 40, `30-40 Friends (got ${SNAPSHOT.length})`);
assert.ok(statSync("games/friend-nook/street.json").size < 80_000, "the snapshot stays small");
assert.ok(!/owner|address|wallet/i.test(JSON.stringify(SNAPSHOT)), "no owner data in the Friends");
assert.equal(new Set(SNAPSHOT.map(f => f.id)).size, SNAPSHOT.length, "unique ids");
const families = new Set(SNAPSHOT.map(f => f.family)); assert.equal(families.size, 9, `all nine families (got ${[...families].join(", ")})`);
for (const f of families) assert.ok(HOMES[f], `${f} has a family home`);
const gens = new Set(SNAPSHOT.map(f => f.gen)); for (const g of [1, 2, 3, 4, 5, 6]) assert.ok(gens.has(g), `generation ${g} is in the snapshot`);
for (const f of SNAPSHOT) { assert.ok(f.gen >= 1 && f.gen <= 6); assert.equal(f.index.length, 64, "64 canonical frames"); assert.ok(f.index.every(i => i >= 0 && i < f.frames.length)); assert.ok(f.frames.every(h => /^[0-9a-f]{64}$/.test(h))); }
// every Friend decodes into a neighbour with a character (quirk with a reason) and keeps its recorded generation
const now = new Date("2026-09-30T18:00:00Z");
for (const f of SNAPSHOT) {
  const [n] = streetFor(0n, now, [f]);
  assert.ok(n.real && n.role === "next-door" && n.generation === f.gen && n.id === BigInt(f.id) && n.family === f.family, `#${f.id} decodes`);
  assert.ok(n.traits.traits[0].reason.includes(", so "), "a quirk with a reason"); assert.equal(n.sprites.walk.down.length, 8);
}

// ---- ISO weeks in UTC (the Thursday of the week decides the year)
assert.equal(isoWeek(new Date("2026-09-30T23:59:00Z")), 202640); assert.equal(isoWeek(new Date("2026-10-01T00:00:00Z")), 202640);
assert.equal(isoWeek(new Date("2026-10-05T00:00:00Z")), 202641, "Monday starts a new week");
assert.equal(isoWeek(new Date("2027-01-01T12:00:00Z")), 202653, "1 Jan 2027 still belongs to week 53 of 2026");
assert.equal(isoWeek(new Date("2024-12-30T00:00:00Z")), 202501, "30 Dec 2024 belongs to week 1 of 2025");

// ---- who lives on the street
const pool = SNAPSHOT.map(f => BigInt(f.id)), ids = (p: readonly { id: bigint }[]) => p.map(x => x.id);
const player = 7730n, street = pickStreet(player, now, pool);
assert.equal(street.length, STREET_NEXT_DOOR + STREET_NEW);
assert.deepEqual(street, pickStreet(player, new Date("2026-09-28T00:00:00Z"), pool), "the same ISO week (Mon 28 .. Sun 4), the same street");
assert.deepEqual(street, pickStreet(player, now, [...pool].reverse()), "the order of the snapshot does not matter");
assert.ok(!ids(street).includes(player), "never the player"); assert.equal(new Set(ids(street)).size, street.length, "nobody twice");
assert.ok(ids(street).every(id => pool.includes(id)), "only from the snapshot");
const dist = (id: bigint) => (id > player ? id - player : player - id), nearest = [...pool].sort((a, b) => Number(dist(a) - dist(b)));
assert.deepEqual(ids(street.filter(p => p.role === "next-door")), nearest.slice(0, STREET_NEXT_DOOR), "next door = the closest token numbers");
assert.ok(street.filter(p => p.role === "new").every(p => !nearest.slice(0, STREET_NEXT_DOOR).includes(p.id)), "a newcomer does not live next door too");
// a player that is in the snapshot is left out and still gets a full street
const inside = pool[5]; assert.ok(!ids(pickStreet(inside, now, pool)).includes(inside)); assert.equal(pickStreet(inside, now, pool).length, 4);
// the newcomer changes from week to week and from player to player
const newcomers = new Set<bigint>(), perPlayer = new Set<string>();
for (let w = 0; w < 40; w++) newcomers.add(pickStreet(player, new Date(Date.UTC(2026, 8, 30 + 7 * w)), pool).find(p => p.role === "new")!.id);
for (const p of [1n, 5000n, 12345n, 66666n, 99999n, 2n ** 40n]) { const s = pickStreet(p, now, pool); assert.equal(s.length, 4); assert.ok(!ids(s).includes(p)); perPlayer.add(ids(s).join()); }
assert.ok(newcomers.size >= 8, `new this week varies with the week (${newcomers.size} different newcomers in 40 weeks)`);
assert.ok(perPlayer.size >= 4, "different players get different streets");
// small pools give what there is
assert.equal(pickStreet(1n, now, [2n, 3n]).length, 2); assert.deepEqual(pickStreet(1n, now, []), []);

// ---- the real street, and the fallback
const real = streetFor(player, now);
assert.equal(real.length, 4); assert.ok(real.every(n => n.real && n.generation !== null && n.role !== "sample" && n.id !== player));
assert.deepEqual(real.map(n => [n.id, n.role]), street.map(p => [p.id, p.role]), "streetFor follows pickStreet");
assert.deepEqual(real.map(n => n.traits.nickname), streetFor(player, now).map(n => n.traits.nickname), "deterministic");
const samples = streetFor(1n, now, []);
assert.deepEqual(samples.map(n => n.id), neighbours().map(n => n.id), "an empty snapshot: the two SDK samples");
assert.ok(samples.every(n => !n.real && n.role === "sample" && n.generation === null));
assert.ok(streetFor(3412n, now, []).every(n => n.id !== 3412n), "a player that is a sample is not their own neighbour");
console.log("street ok:", street.map(p => `${p.role === "new" ? "new" : "door"} #${p.id}`).join(", "), `(snapshot ${SNAPSHOT_DATE}, ${SNAPSHOT.length} Friends)`);
