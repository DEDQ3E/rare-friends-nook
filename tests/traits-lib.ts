export { traitsFor } from "../games/friend-nook/traits.ts";
export { temperamentFor } from "../games/friend-nook/personality.ts";
export { ACTION, FOOD_BY_ID } from "../games/friend-nook/sim.ts";
import { createFriendReader, spriteFrame } from "@rarefriends/friendsdk/sprites";
import { traitsFor } from "../games/friend-nook/traits.ts";
import { temperamentFor } from "../games/friend-nook/personality.ts";
import { pixelFeatures } from "../games/friend-nook/pixels.ts";

const FACINGS = ["right", "left", "up", "down"] as const;
/** A Friend's canonical frames, read live like the game does (same clips as games/friend-nook/index.tsx). */
export async function spritesOf(id: bigint) {
  const art = await createFriendReader().read(id);
  const clip = (facing: (typeof FACINGS)[number], walking: boolean) => Array.from({ length: 8 }, (_, i) => spriteFrame(art, facing, walking, i, "right").frame.rows);
  const set = (walking: boolean) => Object.fromEntries(FACINGS.map(f => [f, clip(f, walking)])) as Record<(typeof FACINGS)[number], string[][]>;
  return { art, sprites: { walk: set(true), idle: set(false) } };
}
/** The game's own traits for a real Friend (live read). */
export async function traitsOfFriend(id: bigint) {
  const { art, sprites } = await spritesOf(id);
  return { family: art.familyName, traits: traitsFor(id, art.seed, temperamentFor(art.familyName), sprites), features: pixelFeatures(sprites) };
}
