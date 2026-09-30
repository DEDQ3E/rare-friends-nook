/** The street. FriendSDK has no multiplayer, so a visit is always simulated: the game plays the neighbour, its owner is
 * not involved and no owner data exists anywhere in the game. The neighbours are real Generations Friends, though:
 * a snapshot (street.json, built by scripts/street.ts) holds 35 of them, four per family, with their canonical sprites
 * recorded from the SDK's pinned sprite registry, unmodified (the same roster as the builder's Rare Royale entry).
 * The game reads nothing from the network for them (the SDK test harness allows reading only the chosen Friend): the
 * three closest to your token number "live next door", and one is "new this week", picked by a hash of the ISO week
 * (UTC) and your token ID. A generation is the one at the time of the snapshot. If the snapshot is ever empty, the
 * two sample Friends that ship with FriendSDK v0.1.4 (examples/fishing/sample-sprites.ts, used under the SDK's
 * NOTICE.md) move in instead. A neighbour's character comes from the same rules as the player's Friend. */
import { decodeGenerationSprites, spriteFrame } from "@rarefriends/friendsdk/sprites";
import type { FriendSprites } from "./engine.js";
import { HEIRLOOM, type Heirloom } from "./heirlooms.js";
import { temperamentFor, type Temperament } from "./personality.js";
import { fmix, personalize, traitsFor, type Traits } from "./traits.js";
import snapshot from "./street.json";
import type { Facing } from "./wardrobe.js";

export type Role = "next-door" | "new" | "sample";
/** generation: the one at the time of the snapshot (null for the SDK samples); real: a recorded Generations Friend. */
export type Neighbour = Readonly<{ id: bigint; family: string; sprites: FriendSprites; traits: Traits; temper: Temperament; heirloom: Heirloom | undefined; role: Role; generation: number | null; real: boolean }>;

const SAMPLES: readonly { id: bigint; familyId: number; seed: number; frames: readonly bigint[] }[] = [
  { id: 3412n, familyId: 0, seed: 3412, frames: [
    0x660066007e00ff00ff007e0018001801ff81bd81bd80ff007e006600000n, 0x660066007e00ff00ff007e0018001801ff81bd81bd80ff007e006600000n, 0x660066007e00ff00ff007e0018001801ff81bd81bd80ff007e006600000n, 0x660066007e00ff007e0018001801ff81bd81bd80ff007e0066000000000n,
    0x660066007e00ff007e0018001801ff81bd81bd80ff007e0066000000000n, 0x660066007e00ff00ff007e0018001801ff81bd81bd80ff007e006600000n, 0x660066007e00ff00ff007e0018001801ff81bd81bd80ff007e006600000n, 0x660066007e00ff00ff007e0018001801ff81bd81bd80ff007e006600000n,
    0x660066007e00ff00ff007e0018001801ff81ff81ff80ff007e006600000n, 0x660066007e00ff00ff007e0018001801ff81ff81ff80ff007e006600000n, 0x660066007e00ff00ff007e0018001801ff81ff81ff80ff007e006600000n, 0x660066007e00ff007e0018001801ff81ff81ff80ff007e0066000000000n,
    0x660066007e00ff007e0018001801ff81ff81ff80ff007e0066000000000n, 0x660066007e00ff00ff007e0018001801ff81ff81ff80ff007e006600000n, 0x660066007e00ff00ff007e0018001801ff81ff81ff80ff007e006600000n, 0x660066007e00ff00ff007e0018001801ff81ff81ff80ff007e006600000n,
    0x180018007e007e007e003c0018001800ff00fd00fd007f003c003000000n, 0x180018007e007e007e003c0018001800ff00fd00fd007f003c003000000n, 0x180018007e007e007e003c0018001800ff00fd00fd007f003c003000000n, 0x180018007e007e003c0018001800ff00fd00fd007f003c0030000000000n,
    0x180018007e007e003c0018001800ff00fd00fd007f003c0030000000000n, 0x180018007e007e007e003c0018001800ff00fd00fd007f003c003000000n, 0x180018007e007e007e003c0018001800ff00fd00fd007f003c003000000n, 0x180018007e007e007e003c0018001800ff00fd00fd007f003c003000000n,
    0x180018007e007e007e003c0018001800ff00bf00bf00fe003c000c00000n, 0x180018007e007e007e003c0018001800ff00bf00bf00fe003c000c00000n, 0x180018007e007e007e003c0018001800ff00bf00bf00fe003c000c00000n, 0x180018007e007e003c0018001800ff00bf00bf00fe003c000c000000000n,
    0x180018007e007e003c0018001800ff00bf00bf00fe003c000c000000000n, 0x180018007e007e007e003c0018001800ff00bf00bf00fe003c000c00000n, 0x180018007e007e007e003c0018001800ff00bf00bf00fe003c000c00000n, 0x180018007e007e007e003c0018001800ff00bf00bf00fe003c000c00000n,
    0x660066007e00ff00ff007e0018001801ff81bd81bd80ff007e006600000n, 0x660066007e00ff007e0018001801ff81bd81bd80ff007e0066000000000n, 0x600066007e00ff00ff007e0018001801ff81bd81bd80ff007e006600000n, 0x600066007e00ff00ff007e0018001801ff81bd81bd80ff007e006600000n,
    0x660066007e00ff00ff007e0018001801ff81bd81bd80ff007e006600000n, 0x660066007e00ff007e0018001801ff81bd81bd80ff007e0066000000000n, 0x60066007e00ff00ff007e0018001801ff81bd81bd80ff007e006600000n, 0x60066007e00ff00ff007e0018001801ff81bd81bd80ff007e006600000n,
    0x660066007e00ff00ff007e0018001801ff81ff81ff80ff007e006600000n, 0x660066007e00ff007e0018001801ff81ff81ff80ff007e0066000000000n, 0x60066007e00ff00ff007e0018001801ff81ff81ff80ff007e006600000n, 0x60066007e00ff00ff007e0018001801ff81ff81ff80ff007e006600000n,
    0x660066007e00ff00ff007e0018001801ff81ff81ff80ff007e006600000n, 0x660066007e00ff007e0018001801ff81ff81ff80ff007e0066000000000n, 0x600066007e00ff00ff007e0018001801ff81ff81ff80ff007e006600000n, 0x600066007e00ff00ff007e0018001801ff81ff81ff80ff007e006600000n,
    0x180018007e007e007e003c0018001800ff00fd00fd007f003c003000000n, 0x180018007e007e003c0018001800ff00fd00fd007f003c0030000000000n, 0x6c006c007e007e007e003c0018001800ff00fd00fd007f003c003000000n, 0x6c006c007e007e007e003c0018001800ff00fd00fd007f003c003000000n,
    0x180018007e007e007e003c0018001800ff00fd00fd007f003c003000000n, 0x180018007e007e003c0018001800ff00fd00fd007f003c0030000000000n, 0xc006c007e007e007e003c0018001800ff00fd00fd007f003c003000000n, 0xc006c007e007e007e003c0018001800ff00fd00fd007f003c003000000n,
    0x180018007e007e007e003c0018001800ff00bf00bf00fe003c000c00000n, 0x180018007e007e003c0018001800ff00bf00bf00fe003c000c000000000n, 0x360036007e007e007e003c0018001800ff00bf00bf00fe003c000c00000n, 0x360036007e007e007e003c0018001800ff00bf00bf00fe003c000c00000n,
    0x180018007e007e007e003c0018001800ff00bf00bf00fe003c000c00000n, 0x180018007e007e003c0018001800ff00bf00bf00fe003c000c000000000n, 0x300036007e007e007e003c0018001800ff00bf00bf00fe003c000c00000n, 0x300036007e007e007e003c0018001800ff00bf00bf00fe003c000c00000n,
  ] },
  { id: 7730n, familyId: 5, seed: 7730, frames: [
    0x7e000000000124812481ff81ff83ffc3ffc07e005a007e007e004200000n, 0x7e000000000124812481ff81ff83ffc3ffc07e005a007e007e004200000n, 0x7e000000000124812481ff81ff83ffc3ffc07e005a007e007e004200000n, 0x7e00000124812481ff81ff83ffc3ffc07e005a007e007e0042000000000n,
    0xff00000124812481ff81ff83ffc3ffc07e005a007e007e0042000000000n, 0xff00000124812481ff81ff83ffc3ffc07e005a007e007e0042000000000n, 0xff000000000124812481ff81ff83ffc3ffc07e005a007e007e004200000n, 0x7e000000000124812481ff81ff83ffc3ffc07e005a007e007e004200000n,
    0x7e000000000124812481ff81ff83ffc3ffc07e007e007e007e004200000n, 0x7e000000000124812481ff81ff83ffc3ffc07e007e007e007e004200000n, 0x7e000000000124812481ff81ff83ffc3ffc07e007e007e007e004200000n, 0x7e00000124812481ff81ff83ffc3ffc07e007e007e007e0042000000000n,
    0xff00000124812481ff81ff83ffc3ffc07e007e007e007e0042000000000n, 0xff00000124812481ff81ff83ffc3ffc07e007e007e007e0042000000000n, 0xff000000000124812481ff81ff83ffc3ffc07e007e007e007e004200000n, 0x7e000000000124812481ff81ff83ffc3ffc07e007e007e007e004200000n,
    0x7e000000000080808081ffc1ffc1ffc1ffc001e001a001e001e00000000n, 0x7e000000000080808081ffc1ffc1ffc1ffc001e001a001e001e00000000n, 0x7e000000000080808081ffc1ffc1ffc1ffc001e001a001e001e00000000n, 0x7e00000080808081ffc1ffc1ffc1ffc001e001a001e001e000000000000n,
    0xff00000080808081ffc1ffc1ffc1ffc001e001a001e001e000000000000n, 0xff00000080808081ffc1ffc1ffc1ffc001e001a001e001e000000000000n, 0xff000000000080808081ffc1ffc1ffc1ffc001e001a001e001e00000000n, 0x7e000000000080808081ffc1ffc1ffc1ffc001e001a001e001e00000000n,
    0x7e000000000101010103ff83ff83ff83ff8780058007800780000000000n, 0x7e000000000101010103ff83ff83ff83ff8780058007800780000000000n, 0x7e000000000101010103ff83ff83ff83ff8780058007800780000000000n, 0x7e00000101010103ff83ff83ff83ff87800580078007800000000000000n,
    0xff00000101010103ff83ff83ff83ff87800580078007800000000000000n, 0xff00000101010103ff83ff83ff83ff87800580078007800000000000000n, 0xff000000000101010103ff83ff83ff83ff8780058007800780000000000n, 0x7e000000000101010103ff83ff83ff83ff8780058007800780000000000n,
    0x7e000000000124812481ff81ff83ffc3ffc07e005a007e007e004200000n, 0x7e000000000124812481ff81ff83ffc3ffc07e005a007e007e004200000n, 0x7e000000000124812481ff81ff83ffc3ffc07e005a007e007e004200000n, 0x7e00000124812481ff81ff83ffc3ffc07e005a007e007e0042000000000n,
    0xff00000124812481ff81ff83ffc3ffc07e005a007e007e0042000000000n, 0xff00000124812481ff81ff83ffc3ffc07e005a007e007e0042000000000n, 0xff000000000124812481ff81ff83ffc3ffc07e005a007e007e004200000n, 0x7e000000000124812481ff81ff83ffc3ffc07e005a007e007e004200000n,
    0x7e000000000124812481ff81ff83ffc3ffc07e007e007e007e004200000n, 0x7e000000000124812481ff81ff83ffc3ffc07e007e007e007e004200000n, 0x7e000000000124812481ff81ff83ffc3ffc07e007e007e007e004200000n, 0x7e00000124812481ff81ff83ffc3ffc07e007e007e007e0042000000000n,
    0xff00000124812481ff81ff83ffc3ffc07e007e007e007e0042000000000n, 0xff00000124812481ff81ff83ffc3ffc07e007e007e007e0042000000000n, 0xff000000000124812481ff81ff83ffc3ffc07e007e007e007e004200000n, 0x7e000000000124812481ff81ff83ffc3ffc07e007e007e007e004200000n,
    0x7e000000000080808081ffc1ffc1ffc1ffc001e001a001e001e00000000n, 0x7e000000000080808081ffc1ffc1ffc1ffc001e001a001e001e00000000n, 0x7e000000000080808081ffc1ffc1ffc1ffc001e001a001e001e00000000n, 0x7e00000080808081ffc1ffc1ffc1ffc001e001a001e001e000000000000n,
    0xff00000080808081ffc1ffc1ffc1ffc001e001a001e001e000000000000n, 0xff00000080808081ffc1ffc1ffc1ffc001e001a001e001e000000000000n, 0xff000000000080808081ffc1ffc1ffc1ffc001e001a001e001e00000000n, 0x7e000000000080808081ffc1ffc1ffc1ffc001e001a001e001e00000000n,
    0x7e000000000101010103ff83ff83ff83ff8780058007800780000000000n, 0x7e000000000101010103ff83ff83ff83ff8780058007800780000000000n, 0x7e000000000101010103ff83ff83ff83ff8780058007800780000000000n, 0x7e00000101010103ff83ff83ff83ff87800580078007800000000000000n,
    0xff00000101010103ff83ff83ff83ff87800580078007800000000000000n, 0xff00000101010103ff83ff83ff83ff87800580078007800000000000000n, 0xff000000000101010103ff83ff83ff83ff8780058007800780000000000n, 0x7e000000000101010103ff83ff83ff83ff8780058007800780000000000n,
  ] },
];
const FACINGS: readonly Facing[] = ["right", "left", "up", "down"];
let cache: readonly Neighbour[] | null = null;

/** The simulated neighbours, decoded once (the caller leaves out the player's own Friend). */
export function neighbours(): readonly Neighbour[] {
  if (cache) return cache;
  cache = SAMPLES.map(s => {
    const art = decodeGenerationSprites(s.id, s.familyId, s.seed, s.frames);
    const clip = (f: Facing, walking: boolean) => Array.from({ length: 8 }, (_, i) => spriteFrame(art, f, walking, i, "right").frame.rows);
    const set = (walking: boolean) => Object.fromEntries(FACINGS.map(f => [f, clip(f, walking)])) as Record<Facing, string[][]>;
    const sprites: FriendSprites = { walk: set(true), idle: set(false) };
    const family = art.familyName, base = temperamentFor(family), traits = traitsFor(s.id, art.seed, base, sprites);
    return { id: s.id, family, sprites, traits, temper: personalize(base, traits), heirloom: HEIRLOOM[family], role: "sample" as const, generation: null, real: false };
  });
  return cache;
}

/* ---------- real Friends on the street: a recorded snapshot, no network ---------- */

export type SnapshotFriend = Readonly<{ id: string; gen: number; family: string; familyId: number; seed: number; frames: readonly string[]; index: readonly number[] }>;
export const SNAPSHOT: readonly SnapshotFriend[] = snapshot.friends as readonly SnapshotFriend[];
/** When the snapshot was taken (UTC date): generations are as of then and can change when a Friend is promoted. */
export const SNAPSHOT_DATE: string = snapshot.source.snapshotDate;
export const STREET_NEXT_DOOR = 3, STREET_NEW = 1;
export const ROLE_LABEL: Readonly<Record<Role, string>> = { "next-door": "Lives next door", new: "New this week", sample: "Sample Friend" };

/** ISO-8601 week of a date in UTC, as year * 100 + week (2026-09-30 is week 40 of 2026 -> 202640). */
export function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); // the Thursday of this week decides the year
  const start = Date.UTC(t.getUTCFullYear(), 0, 1);
  return t.getUTCFullYear() * 100 + Math.ceil(((t.getTime() - start) / 86400000 + 1) / 7);
}

/** Who lives on this player's street this week: deterministic for a token and a week, never the player itself.
 * The closest token numbers in the snapshot live next door; the newcomers come from a hash of the ISO week and the token ID. */
export function pickStreet(playerId: bigint, when: Date, pool: readonly bigint[]): readonly { id: bigint; role: Role }[] {
  const others = pool.filter(id => id !== playerId);
  const dist = (id: bigint) => (id > playerId ? id - playerId : playerId - id);
  const byNumber = [...others].sort((a, b) => (dist(a) < dist(b) ? -1 : dist(a) > dist(b) ? 1 : a < b ? -1 : 1));
  const door = byNumber.slice(0, STREET_NEXT_DOOR), rest = byNumber.slice(STREET_NEXT_DOOR);
  const key = fmix(fmix(isoWeek(when)) ^ Number(playerId & 0xFFFFFFFFn) ^ Math.imul(Number((playerId >> 32n) & 0xFFFFFFFFn), 0x9E3779B1));
  const fresh: bigint[] = [];
  for (let n = 1; fresh.length < STREET_NEW && rest.length; n++) fresh.push(rest.splice(fmix(fmix(key ^ Math.imul(n, 0x9E3779B9)) + n) % rest.length, 1)[0]);
  return [...door.map(id => ({ id, role: "next-door" as const })), ...fresh.map(id => ({ id, role: "new" as const }))];
}

const decoded = new Map<string, Neighbour>();
function fromSnapshot(f: SnapshotFriend, role: Role): Neighbour {
  const hit = decoded.get(f.id + role); if (hit) return hit;
  const art = decodeGenerationSprites(BigInt(f.id), f.familyId, f.seed, f.index.map(i => BigInt(`0x${f.frames[i]}`)));
  const clip = (facing: Facing, walking: boolean) => Array.from({ length: 8 }, (_, i) => spriteFrame(art, facing, walking, i, "right").frame.rows);
  const set = (walking: boolean) => Object.fromEntries(FACINGS.map(g => [g, clip(g, walking)])) as Record<Facing, string[][]>;
  const sprites: FriendSprites = { walk: set(true), idle: set(false) };
  const family = art.familyName, base = temperamentFor(family), traits = traitsFor(BigInt(f.id), art.seed, base, sprites);
  const n: Neighbour = { id: BigInt(f.id), family, sprites, traits, temper: personalize(base, traits), heirloom: HEIRLOOM[family], role, generation: f.gen, real: true };
  decoded.set(f.id + role, n); return n;
}

/** The street for this player this week: real Friends from the snapshot, or (if there are none) the two SDK samples. */
export function streetFor(playerId: bigint, when: Date, friends: readonly SnapshotFriend[] = SNAPSHOT): readonly Neighbour[] {
  const byId = new Map(friends.map(f => [BigInt(f.id), f]));
  const real = pickStreet(playerId, when, [...byId.keys()]).map(p => fromSnapshot(byId.get(p.id)!, p.role));
  return real.length ? real : neighbours().filter(n => n.id !== playerId);
}
