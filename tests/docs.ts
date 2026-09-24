// Every number in README.md and submission/README.md must match game.json and the code.
// Run: npm run docs (bundles this file with esbuild, then runs it with Node).
import { readFileSync } from "node:fs";
import { ACTIONS } from "../games/friend-nook/sim.js";
import { FURNITURE } from "../games/friend-nook/furniture.js";
import { CATALOG } from "../games/friend-nook/catalog.js";
import { WARDROBE } from "../games/friend-nook/wardrobe.js";
import { KEEPSAKES } from "../games/friend-nook/keepsakes.js";
import { QUIRKS } from "../games/friend-nook/traits.js";

const game = JSON.parse(readFileSync("games/friend-nook/game.json", "utf8")) as { price: string; outcomes: { name: string; chanceBps: number; reward: string }[] };
const index = readFileSync("games/friend-nook/index.tsx", "utf8"), engine = readFileSync("games/friend-nook/engine.ts", "utf8");
const docs = { "README.md": readFileSync("README.md", "utf8"), "submission/README.md": readFileSync("submission/README.md", "utf8") };
const rf = (v: string | bigint) => { const n = Number(BigInt(v)) / 1e18; return `${n} RF`; };
let failures = 0;
const expect = (ok: boolean, what: string) => { if (!ok) { failures++; console.log("FAIL", what); } };
const inDocs = (text: string, where: (keyof typeof docs)[] = ["README.md", "submission/README.md"]) => { for (const d of where) expect(docs[d].includes(text), `${d} should say "${text}"`); };

// Gift Box
const U = 1e18, price = Number(BigInt(game.price)) / U;
let ev = 0, e2 = 0, ahead = 0;
for (const o of game.outcomes) { const r = Number(BigInt(o.reward)) / U, p = o.chanceBps / 1e4; ev += p * r; e2 += p * r * r; if (r >= price) ahead += p; }
inDocs(`${rf(game.price)} per box`, ["submission/README.md"]);
inDocs(`${ev.toFixed(4)} RF`);
inDocs(`${Math.sqrt(e2 - ev * ev).toFixed(3)} RF`, ["submission/README.md"]);
inDocs(`${Math.round(ahead * 100)}% chance`, ["submission/README.md"]);
inDocs(`${((1 - ev) * 100).toFixed(2)}% edge`, ["submission/README.md"]);
const top = game.outcomes.reduce((m, o) => (BigInt(o.reward) > m ? BigInt(o.reward) : m), 0n);
inDocs(`${rf(top)} top prize`, ["submission/README.md"]);
game.outcomes.forEach((o, i) => {
  const k = KEEPSAKES[i], row = `| ${k.name} | ${k.rarity} | ${o.chanceBps / 100}% | ${rf(o.reward)} | ${k.bond} |`;
  inDocs(row, ["submission/README.md"]);
});
// exact sessions, every keepsake sold
const vals = game.outcomes.map(o => Math.round(Number(BigInt(o.reward)) / 1e16)), ps = game.outcomes.map(o => o.chanceBps / 1e4);
for (const n of [10, 30]) {
  let d = new Map([[0, 1]]);
  for (let s = 0; s < n; s++) { const nd = new Map<number, number>(); for (const [t, p] of d) vals.forEach((v, i) => nd.set(t + v, (nd.get(t + v) ?? 0) + p * ps[i])); d = nd; }
  const arr = [...d].sort((a, b) => a[0] - b[0]), q = (x: number) => { let c = 0; for (const [s, p] of arr) { c += p; if (c >= x) return (s / 100).toFixed(2); } return "?"; };
  let win = 0; for (const [s, p] of arr) if (s >= n * 100) win += p;
  inDocs(`${n} boxes return ${(ev * n).toFixed(2)} RF`, ["submission/README.md"]);
  inDocs(`median ${q(.5)}, 90th percentile ${q(.9)}, ${(win * 100).toFixed(1)}%`, ["submission/README.md"]);
}
// shop, wardrobe, furniture
const wear = WARDROBE.filter(w => !w.season).map(w => w.price), cat = CATALOG.map(c => c.price);
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
inDocs(`2–5 RF per piece, ${sum(wear)} RF for all ${["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][wear.length]}`, ["submission/README.md"]);
expect(Math.min(...wear) === 2 && Math.max(...wear) === 5, "wardrobe prices 2–5 RF");
inDocs(`2–6 RF per piece, ${sum(cat)} RF for all ${["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][cat.length]}`, ["submission/README.md"]);
expect(Math.min(...cat) === 2 && Math.max(...cat) === 6, "furniture prices 2–6 RF");
expect(index.includes("const cost = 10n ** 18n;") && index.includes("engine.current?.addStock(4, 0)"), "snack pack: 1 RF for 4");
expect(index.includes("const cost = 2n * 10n ** 18n;") && index.includes("engine.current?.addStock(0, 3)"), "groceries: 2 RF for 3 meals");
inDocs("Snack pack ×4: 1 RF", ["submission/README.md"]); inDocs("Groceries ×3 meals: 2 RF", ["submission/README.md"]);
expect(engine.includes("const stock: Stock = { snacks: 3, meals: 2 };"), "starting stock 3 snacks, 2 meals");
inDocs("3 snacks and 2 meals", ["submission/README.md"]);
// content counts
const furnitureKinds = new Set([...FURNITURE, ...CATALOG.map(c => c.def)].filter(f => ACTIONS.some(a => a.on.includes(f.id))).map(f => f.id));
inDocs(`${ACTIONS.length} things to do on ${furnitureKinds.size} kinds of furniture`, ["submission/README.md"]);
inDocs(`${ACTIONS.length} activities`, ["README.md"]);
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen"];
inDocs(`one of ${WORDS[QUIRKS.length]} quirks`, ["submission/README.md"]);
for (const q of QUIRKS) inDocs(q.label.toLowerCase(), ["submission/README.md"]);
// the ten-Friend table is the one tests/friends.mjs recorded
inDocs(readFileSync("media/friends.md", "utf8").trim(), ["submission/README.md"]);

console.log(failures ? `${failures} mismatch(es)` : "docs match the code");
process.exit(failures ? 1 : 0);
