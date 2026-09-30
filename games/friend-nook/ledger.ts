/** Where simulated RF goes. Every purchase the game simulates (food, special treats, the birthday cake, clothes,
 * furniture) is split the same way the published tables say: a share burned, the rest to Friend rewards. The Gift
 * Box is the SDK's chance game and is accounted for separately (its stake is not burned). Nothing here touches
 * prices, odds or rewards of the Gift Box, and a Friend's personality never changes any of it. */
export const RF = 10n ** 18n;

export type Source = "food" | "treats" | "cake" | "wardrobe" | "furniture";
export const SOURCES: readonly Source[] = ["food", "treats", "cake", "wardrobe", "furniture"];
export const SOURCE_LABEL: Readonly<Record<Source, string>> = { food: "Food", treats: "Special treats", cake: "Birthday cake", wardrobe: "Wardrobe", furniture: "Furniture" };
/** Share of each spend that is burned, in percent; the rest goes to Friend rewards (proposed, simulated). */
export const BURN_PERCENT: Readonly<Record<Source, bigint>> = { food: 50n, treats: 50n, cake: 100n, wardrobe: 50n, furniture: 50n };

/** One special treat (the favourite snack once found) and the birthday cake, in RF. */
export const TREAT_PRICE = 1n * RF, CAKE_PRICE = 3n * RF;

export type Ledger = Readonly<Record<Source, bigint>>;
export const EMPTY_LEDGER: Ledger = { food: 0n, treats: 0n, cake: 0n, wardrobe: 0n, furniture: 0n };

export function split(source: Source, cost: bigint): { burned: bigint; rewards: bigint } {
  const burned = cost * BURN_PERCENT[source] / 100n;
  return { burned, rewards: cost - burned };
}
export function spend(ledger: Ledger, source: Source, cost: bigint): Ledger { return { ...ledger, [source]: ledger[source] + cost }; }
/** Totals over every source: what was spent, what was burned and what went to Friend rewards. */
export function totals(ledger: Ledger): { spent: bigint; burned: bigint; rewards: bigint } {
  let spent = 0n, burned = 0n, rewards = 0n;
  for (const s of SOURCES) { const p = split(s, ledger[s]); spent += ledger[s]; burned += p.burned; rewards += p.rewards; }
  return { spent, burned, rewards };
}
