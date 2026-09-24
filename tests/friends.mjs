// Real Friends, real characters: the game's real SDK runtime for a fixed, hand-picked list of Generations
// Friends, each read live from Robinhood mainnet (see tests/live.mjs; nothing is scanned or enumerated).
// For each: its "Meet your Friend" card, then 26 s alone at 3× (about four in-game hours) and what it chose.
// Needs (not in package.json): npm install --no-save playwright pngjs
// Run: node tests/friends.mjs → tmp/friends/*.png, media/friends.json, media/friends.md,
//                               media/friends-cards.png, media/friends-life.png
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import { liveRuntime } from "./live.mjs";

// One per family where a hardwired Friend was at hand, plus a second Asymmetry and Skeleton: two Friends of one
// family still differ, because the token itself, not only the family, makes the character.
const FRIENDS = [87846n, 65001n, 1969n, 15000n, 7730n, 20838n, 66666n, 77777n, 444n, 88888n];
const out = "./tmp/friends"; // per-Friend shots (not committed); the sheets go to media/
mkdirSync(out, { recursive: true });

const rt = await liveRuntime();
const results = [];
try {
  for (const id of FRIENDS) {
    const { page, game, root, errors, close } = await rt.open(id);
    const card = game.locator(".fn-intro");
    await page.waitForTimeout(500);
    await card.screenshot({ path: `${out}/${id}-card.png` });
    const text = await card.innerText(), pick = re => (text.match(re)?.[1] ?? "").trim();
    const row = {
      id: String(id), nickname: await card.locator("h2").innerText(),
      family: pick(/· (\S+) family ·/), generation: pick(/family · ([^\n]+)/),
      temperament: await card.locator(".fn-temper strong").innerText(), strength: pick(/Character strength: ([^\n(]+)/),
      loves: pick(/Loves: ([^\n]+)/), dislikes: pick(/Dislikes: ([^\n]+)/),
      favorite: pick(/Favourite thing: ([^\n]+)/), colour: pick(/Favourite colour:\s*([^\n]+)/), snack: pick(/Favourite snack: ([^\n]+)/),
      birthday: pick(/Birthday: ([^\n]+)/), quirk: pick(/Quirk: ([^\n—]+)/), says: pick(/Says: [“"]([^”"]+)/),
    };
    await game.getByRole("button", { name: /Welcome home/ }).click();
    await game.getByRole("button", { name: "Got it" }).click().catch(() => {});
    // leave it alone at 3×: whatever it does now is its own choice
    await game.getByRole("button", { name: "Speed 3×" }).click();
    await page.waitForTimeout(26000);
    await game.getByRole("button", { name: "Zoom in" }).click(); await page.waitForTimeout(1600);
    await root.screenshot({ path: `${out}/${id}-life.png` });
    await game.getByRole("button", { name: "Zoom out" }).click(); await page.waitForTimeout(400);
    await game.getByRole("button", { name: "Open your Friend's character card" }).click();
    const diary = (await game.locator(".fn-diary li").allInnerTexts()).reverse().map(s => s.replace(/^\S+\s+\S+\s+/, "").trim());
    row.chose = diary.filter(s => / — its own choice/.test(s)).map(s => s.replace(" — its own choice", ""));
    row.wishes = diary.filter(s => s.startsWith("Made a wish: ")).map(s => s.slice(13));
    row.errors = errors;
    results.push(row);
    console.log(row.id, row.nickname, "|", row.family, row.generation, row.strength, "|", row.temperament, "|", row.favorite, "|", row.quirk, "|", row.chose.join(" / "), errors.length ? `ERRORS ${errors.join("; ")}` : "");
    await close();
  }
} finally { await rt.close(); }
writeFileSync("./media/friends.json", JSON.stringify(results, null, 2) + "\n");

// the table for the READMEs
const md = ["| Friend | Family · generation | Nickname | Temperament · strength | Favourite thing | Colour | Quirk | Chose by itself (first 4 in-game hours) |", "|---|---|---|---|---|---|---|---|",
  ...results.map(r => `| #${r.id} | ${r.family} · ${r.generation} | ${r.nickname} | ${r.temperament} · ${r.strength} | ${r.favorite} | ${r.colour} | ${r.quirk} | ${r.chose.map(c => c.replace(/^\d\d:\d\d /, "").replace(" (loves it)", " ♥")).join(", ") || "—"} |`)];
writeFileSync("./media/friends.md", md.join("\n") + "\n");

// contact sheets (half size, box filter)
function sheet(files, cols, file, scale = .5) {
  const imgs = files.map(f => PNG.sync.read(readFileSync(f)));
  const w = Math.max(...imgs.map(i => i.width)), h = Math.max(...imgs.map(i => i.height));
  const tw = Math.floor(w * scale), th = Math.floor(h * scale), gap = 8, rows = Math.ceil(imgs.length / cols), k = Math.round(1 / scale);
  const png = new PNG({ width: cols * tw + (cols + 1) * gap, height: rows * th + (rows + 1) * gap });
  for (let p = 0; p < png.data.length; p += 4) { png.data[p] = 0xf3; png.data[p + 1] = 0xe6; png.data[p + 2] = 0xcf; png.data[p + 3] = 255; }
  imgs.forEach((img, n) => {
    const ox = gap + (n % cols) * (tw + gap), oy = gap + Math.floor(n / cols) * (th + gap);
    for (let y = 0; y < Math.floor(img.height / k); y++) for (let x = 0; x < Math.floor(img.width / k); x++) {
      const acc = [0, 0, 0];
      for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const s = ((y * k + dy) * img.width + x * k + dx) * 4; acc[0] += img.data[s]; acc[1] += img.data[s + 1]; acc[2] += img.data[s + 2]; }
      const d = ((oy + y) * png.width + ox + x) * 4; png.data[d] = acc[0] / (k * k); png.data[d + 1] = acc[1] / (k * k); png.data[d + 2] = acc[2] / (k * k);
    }
  });
  writeFileSync(file, PNG.sync.write(png));
}
sheet(FRIENDS.map(id => `${out}/${id}-card.png`), 5, "./media/friends-cards.png");
sheet(FRIENDS.map(id => `${out}/${id}-life.png`), 5, "./media/friends-life.png");
assert.deepEqual(results.flatMap(r => r.errors), [], "browser errors");
console.log("done");
