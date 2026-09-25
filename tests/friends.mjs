// Real Friends, real characters: the game's real SDK runtime for a fixed, hand-picked list of Generations
// Friends, each read live from Robinhood mainnet (see tests/live.mjs; nothing is scanned or enumerated).
// For each: its "Meet your Friend" card, its first own choice (the line the game shows, and a picture of it in
// the room), then 26 s alone at 3× (about four in-game hours) and what it chose.
// Needs (not in package.json): npm install --no-save playwright
// Run: node tests/friends.mjs → tmp/friends/*.png, media/friends.json, media/friends.md, media/friends-rooms.png
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { liveRuntime } from "./live.mjs";

// One per family where a hardwired Friend was at hand, plus a second Asymmetry and Skeleton: two Friends of one
// family still differ, because the token itself, not only the family, makes the character.
const FRIENDS = [87846n, 65001n, 1969n, 15000n, 7730n, 20838n, 66666n, 77777n, 444n, 88888n];
const out = "./tmp/friends"; // per-Friend shots (not committed); the combined picture goes to media/
mkdirSync(out, { recursive: true });

const rt = await liveRuntime();
const results = [];
try {
  for (const id of FRIENDS) {
    const { page, game, errors, close } = await rt.open(id);
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
      heirloom: pick(/Family heirloom: ([^\n(]+)/), swatch: await card.locator(".fn-swatch").evaluate(e => e.style.background),
    };
    await game.getByRole("button", { name: /Welcome home/ }).click();
    await game.getByRole("button", { name: "Got it" }).click({ timeout: 3000 }).catch(() => {});
    // its first own choice, as the game explains it on screen
    const toast = game.locator(".fn-toast").filter({ hasText: "own choice" }); await toast.waitFor();
    row.first = (await toast.innerText()).replace(/^.*?own choice: /, "");
    // leave it alone at 3×: whatever it does now is its own choice; a picture of it in the room once it got there
    await game.getByRole("button", { name: "Speed 3×" }).click();
    await page.waitForTimeout(2500);
    const frame = page.frames().find(f => f !== page.mainFrame());
    const hide = await frame.addStyleTag({ content: ".fn-card,.fn-tools,.fn-toast,.fn-hint{visibility:hidden!important}" });
    await game.locator("canvas").screenshot({ path: `${out}/${id}-room.png` }); // the game opens close to the Friend
    await hide.evaluate(e => e.remove());
    await page.waitForTimeout(23500);
    await game.getByRole("button", { name: "Open your Friend's character card" }).click();
    const diary = (await game.locator(".fn-diary li").allInnerTexts()).reverse().map(s => s.replace(/^\S+\s+\S+\s+/, "").trim());
    row.chose = diary.filter(s => / — its own choice/.test(s)).map(s => s.replace(" — its own choice", ""));
    row.wishes = diary.filter(s => s.startsWith("Made a wish: ")).map(s => s.slice(13));
    row.errors = errors;
    results.push(row);
    console.log(row.id, row.nickname, "|", row.family, row.generation, row.strength, "|", row.temperament, "|", row.first, "|", row.chose.join(" / "), errors.length ? `ERRORS ${errors.join("; ")}` : "");
    await close();
  }
} finally { await rt.close(); }
writeFileSync("./media/friends.json", JSON.stringify(results, null, 2) + "\n");

// the table for the READMEs
const md = ["| Friend | Family · generation | Nickname | Temperament · strength | Favourite thing | Colour | Quirk | Chose by itself (first 4 in-game hours) |", "|---|---|---|---|---|---|---|---|",
  ...results.map(r => `| #${r.id} | ${r.family} · ${r.generation} | ${r.nickname} | ${r.temperament} · ${r.strength} | ${r.favorite} | ${r.colour} | ${r.quirk} | ${r.chose.map(c => c.replace(/^\d\d:\d\d /, "").replace(" (loves it)", " ♥")).join(", ") || "—"} |`)];
writeFileSync("./media/friends.md", md.join("\n") + "\n");

// one picture: each Friend in the same house at its first own choice, and what makes it different
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const tiles = results.map(r => `<figure><div class="shot"><img src="data:image/png;base64,${readFileSync(`${out}/${r.id}-room.png`).toString("base64")}"></div>
  <figcaption><b>${esc(r.nickname)}</b> <small>#${r.id}</small><br>${esc(r.family)} · ${esc(r.generation)} · ${esc(r.temperament)} (${esc(r.strength)})<br>
  <i style="background:${esc(r.swatch)}"></i>${esc(r.colour)} · ${esc(r.quirk)}<br>Heirloom: ${esc(r.heirloom)}<br><em>Own choice: ${esc(r.first)}</em></figcaption></figure>`).join("");
const browser = await chromium.launch(), sheet = await browser.newPage({ viewport: { width: 1900, height: 1000 } });
await sheet.setContent(`<style>
body{margin:0;background:#f3e6cf;font:13px/1.45 "Courier New",monospace;color:#2b1d14}
main{padding:18px 20px;display:inline-block}
h1{font-size:22px;margin:0 0 4px}p{margin:0 0 14px;max-width:1800px;color:#6b4c34}
.grid{display:grid;grid-template-columns:repeat(5,352px);gap:14px}
figure{margin:0;background:#fff8ec;border:3px solid #3b2a1f;box-shadow:3px 3px 0 #3b2a1f}
.shot{width:352px;height:236px;overflow:hidden;border-bottom:3px solid #3b2a1f;position:relative}
.shot img{position:absolute;width:600px;left:-124px;top:-90px;image-rendering:pixelated}
figcaption{padding:7px 9px 9px;min-height:100px}b{font-size:15px}small{color:#8a6a50}
i{display:inline-block;width:11px;height:11px;border:1px solid #2b1d14;margin-right:5px;vertical-align:-1px}
em{font-style:normal;color:#9b3d2a;font-weight:bold}
</style><main><h1>Ten real Friends, one house</h1><p>Same rooms, same furniture. Family, generation and the token's own seed make each one different:
its name, colour (bed, cushion, rug), quirk, family heirloom, and what it chose by itself seconds after moving in.</p>
<div class="grid">${tiles}</div></main>`);
await sheet.locator("main").screenshot({ path: "./media/friends-rooms.png" });
await browser.close();
assert.deepEqual(results.flatMap(r => r.errors), [], "browser errors");
console.log("done");
