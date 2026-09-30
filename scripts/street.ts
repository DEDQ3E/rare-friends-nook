/** Builds games/friend-nook/street.json: the snapshot the street's neighbours are drawn from.
 *
 * The game itself never reads any token but the chosen Friend (the SDK test harness rejects it). The neighbours are real,
 * hardwired (Generation 1-6) Rare Friends whose canonical artwork is recorded here once, at build time, from the SDK's
 * pinned sprite registry, unmodified, exactly as the SDK's own sprite reader returns it. The Friends are picked from the
 * roster of the builder's other entry, Rare Royale (games/rare-royale/roster.json: a seeded random sample of token IDs,
 * public `generation` reads only): four per family, as many different generations as that roster has. Only the public
 * `generation` (re-read now, so it is the generation at the time of the snapshot) and the artwork are read; no owner
 * addresses are read or stored.
 *
 * Usage: esbuild scripts/street.ts --bundle --platform=node --format=esm --outfile=tmp/street-build.mjs && node tmp/street-build.mjs <path to roster.json> */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient, http } from "viem";
import { readContract } from "viem/actions";
import { GENERATION_ELIGIBILITY_ABI } from "@rarefriends/friendsdk/identity";
import { GENERATION_SPRITE_MANIFEST as M, createFriendReader } from "@rarefriends/friendsdk/sprites";

const PER_FAMILY = 4;
const rosterPath = process.argv[2];
if (!rosterPath) throw new Error("usage: node tmp/street-build.mjs <path to Rare Royale roster.json>");
const roster = JSON.parse(readFileSync(rosterPath, "utf8")) as { source: { builtAt: string }; friends: { id: string; gen: number; family: string }[] };

// four per family, the widest spread of generations the roster offers (lowest generations first), then the smallest ids
const byFamily = new Map<string, typeof roster.friends>();
for (const f of roster.friends) byFamily.set(f.family, [...(byFamily.get(f.family) ?? []), f]);
const picked: string[] = [];
for (const [, list] of [...byFamily].sort(([a], [b]) => (a < b ? -1 : 1))) {
  const sorted = [...list].sort((a, b) => a.gen - b.gen || Number(BigInt(a.id) - BigInt(b.id)));
  const chosen: typeof list = [];
  for (const g of [...new Set(sorted.map(f => f.gen))]) { if (chosen.length < PER_FAMILY) chosen.push(sorted.find(f => f.gen === g)!); }
  for (const f of sorted) { if (chosen.length < PER_FAMILY && !chosen.includes(f)) chosen.push(f); }
  picked.push(...chosen.map(f => f.id));
}

const client = createClient({ transport: http(M.rpcUrl, { retryCount: 3, timeout: 20_000 }), cacheTime: 0 });
const reader = createFriendReader();
const hex = (b: bigint) => b.toString(16).padStart(64, "0");
const friends: unknown[] = [];
for (const id of picked) {
  const tokenId = BigInt(id);
  const gen = Number(await readContract(client, { address: M.generations, abi: GENERATION_ELIGIBILITY_ABI, functionName: "generation", args: [tokenId] }));
  if (gen < 1 || gen > 6) { console.log("skipped", id, "generation", gen); continue; }
  const art = await reader.read(tokenId);
  const unique = [...new Set(art.frames.map(hex))];
  friends.push({ id, gen, family: art.familyName, familyId: art.familyId, seed: art.seed, frames: unique, index: art.frames.map(b => unique.indexOf(hex(b))) });
  console.log(id, art.familyName, "gen", gen, art.frames.length, "frames,", unique.length, "unique");
}
const counts = [1, 2, 3, 4, 5, 6].map(g => `Gen ${g}: ${(friends as { gen: number }[]).filter(f => f.gen === g).length}`).join(", ");
const builtAt = new Date().toISOString();
writeFileSync(new URL("../games/friend-nook/street.json", import.meta.url), JSON.stringify({
  version: 1,
  source: {
    chainId: M.chainId, generations: M.generations, registry: M.registry,
    method: `Friends picked from the Rare Royale roster (a seeded random sample of token IDs in 1..100000 built ${roster.source.builtAt.slice(0, 10)}, public generation reads only): ${PER_FAMILY} per family, the widest spread of generations. Generation and canonical artwork read from the SDK's pinned sprite registry at the snapshot, unmodified. No owner addresses are read or stored.`,
    builtAt, snapshotDate: builtAt.slice(0, 10), counts,
  },
  friends,
}) + "\n");
console.log(`street.json: ${friends.length} Friends, ${counts}`);
