// The food riddle and the paid extras: eight shop foods (1 RF a portion; every family likes three and dislikes two, one is the
// Friend's favourite), eaten at the fridge; feeding it the favourite reveals the snack secret; a disliked one is refused or
// grudgingly eaten. Then the Birthday cake (3 RF, all burned, asked for once after the birthday secret, shared at the dining
// table) and the "Where your RF went" panel. The mock Friend is #7730 (a Hoverer): it likes mango pudding, berry yoghurt and rice
// balls, dislikes corn dogs and cheese toast, and loves mango pudding (see tests/food.ts), which its fridge starts with.
// Run: node tests/treats.mjs [out-dir]
import assert from "node:assert/strict";
import { testGame } from "@rarefriends/friendsdk/testing";
const out = process.argv[2] ?? "./tmp";
await testGame("./games/friend-nook", { width: 1280, height: 800, timeout: 300000,
  check: async ({ page, game }) => {
    const errors = []; page.on("pageerror", e => errors.push(String(e)));
    // the intro card says what the family likes and dislikes: the hint for the riddle
    const intro = await game.locator(".fn-intro").innerText();
    assert.match(intro, /Family table: likes mango pudding, berry yoghurt, rice balls · dislikes corn dogs, cheese toast\. Which one is Humippy's favourite\?/);
    assert.ok(!intro.includes("Favourite snack: mango pudding"), "the favourite stays a secret");
    await game.getByRole("button", { name: /Welcome home/ }).click();
    await game.getByRole("button", { name: "Got it" }).click({ timeout: 3000 }).catch(() => {});
    await game.getByRole("button", { name: "Zoom out" }).click(); await page.waitForTimeout(1300);
    const canvas = game.locator("canvas").first(), k = (await canvas.boundingBox()).width / 960;
    const at = (i, j, z) => ({ x: ((i - j) * 18 - 18 + 240) * 2 * k, y: ((i + j) * 9 - z - 88 + 160) * 2 * k });
    const shop = game.locator("section[role=dialog]").filter({ hasText: "Shop" });
    const openShop = async () => { await game.getByRole("button", { name: "Shop" }).click(); await shop.waitFor(); };
    const toast = re => game.locator(".fn-toast").filter({ hasText: re });
    const balance = async () => Number((await game.locator(".fn-money strong").innerText()).replace(/[^\d.]/g, ""));

    // the shop: eight foods at 1 RF, plus snacks, groceries and clothes; a food costs 1 RF, half burned, half to Friend rewards
    const start = await balance();
    await openShop();
    const foods = shop.locator("button.fn-food"); assert.equal(await foods.count(), 8, "eight foods");
    assert.match(await foods.first().innerText(), /1 RF/); assert.equal(await shop.locator("button.fn-tile").filter({ hasText: "Birthday cake" }).count(), 0, "no cake before its birthday is known");
    await shop.locator("button.fn-tile").filter({ hasText: "Snack pack" }).click(); // plain food: 1 RF
    assert.equal(await balance(), start - 1, "a snack pack costs 1 RF");
    await shop.locator("button.fn-food").filter({ hasText: "Corn dogs" }).click();
    await toast(/Corn dogs added \(1 RF: 0\.5 RF burned, 0\.5 RF to Friend rewards/).waitFor({ timeout: 5000 });
    await shop.locator("button.fn-food").filter({ hasText: "Mango pudding" }).click();
    assert.equal(await balance(), start - 3, "each food costs 1 RF");
    await page.waitForTimeout(700); assert.match(await shop.locator("button.fn-food").filter({ hasText: "Corn dogs" }).innerText(), /in the fridge 1/);
    await page.screenshot({ path: `${out}/foods-shop.png` });
    await game.getByRole("button", { name: "Close" }).click();

    // at the fridge: the foods that are in it (mango pudding from the start and now more, corn dogs); the disliked one is refused or grudgingly eaten
    const fridge = async () => { for (const [i, j, z] of [[11.4, .5, 16], [11.4, .5, 8], [11.4, 1, 20], [11.4, .4, 24]]) { await canvas.click({ position: at(i, j, z) }); await page.waitForTimeout(400); if (await game.getByRole("menuitem", { name: /Corn dogs|Mango pudding/ }).count()) return true; } return false; };
    assert.ok(await fridge(), "the fridge offers the foods that are in it");
    const menu = await game.getByRole("menuitem").allInnerTexts(); assert.ok(menu.some(t => /Corn dogs/.test(t)) && menu.some(t => /Mango pudding/.test(t)), "both foods are in the menu"); assert.ok(!menu.some(t => /Berry yoghurt|Rice balls/.test(t)), "only the foods that are in the fridge");
    await game.getByRole("menuitem", { name: /Corn dogs/ }).click();
    await toast(/did not like the corn dogs|turns up its nose at the corn dogs/).waitFor({ timeout: 60000 });
    // the favourite: it reveals the secret (unless it already ate its own mango pudding by itself, which reveals it too)
    await page.waitForTimeout(800);
    if (!(await game.getByRole("button", { name: "Open your Friend's character card" }).isVisible())) await page.waitForTimeout(500);
    const known = async () => { await game.getByRole("button", { name: "Open your Friend's character card" }).click(); const t = await game.locator("section[role=dialog]").innerText(); await game.getByRole("button", { name: "Close" }).click(); return /Favourite snack\s+mango pudding/.test(t); };
    if (!(await known())) {
      if (!(await fridge())) { await openShop(); await shop.locator("button.fn-food").filter({ hasText: "Mango pudding" }).click(); await game.getByRole("button", { name: "Close" }).click(); assert.ok(await fridge()); }
      await game.getByRole("menuitem", { name: /Mango pudding/ }).click();
      await toast(/favourite snack is mango pudding|loved its mango pudding/).waitFor({ timeout: 60000 });
    }
    assert.ok(await known(), "it loves mango pudding: the secret is found"); await page.screenshot({ path: `${out}/foods-found.png` });

    // the birthday: talk to it (secret), it asks once, the cake is 3 RF and all burned, served at the dining table
    await game.locator("canvas").focus(); await page.keyboard.press("KeyF");
    await game.getByRole("menuitem", { name: /^Talk/ }).click();
    await toast(/Secret \d\/3 found: its birthday is/).waitFor({ timeout: 30000 });
    await toast(/asks to celebrate its birthday/).waitFor({ timeout: 20000 });
    const before = await balance();
    await openShop();
    const cake = shop.locator("button.fn-tile").filter({ hasText: "Birthday cake" });
    assert.match(await cake.innerText(), /3 RF · all burned/);
    await cake.click();
    assert.equal(await balance(), before - 3, "the cake costs 3 RF");
    await game.getByRole("button", { name: "Speed 3×" }).click();
    await toast(/Happy birthday/).waitFor({ timeout: 120000 });
    await page.screenshot({ path: `${out}/foods-cake.png` });
    await game.getByRole("button", { name: "Open your Friend's character card" }).click();
    const diary = await game.locator(".fn-diary li").allInnerTexts(); console.log(diary.slice(0, 6).join(" | "));
    assert.ok(diary.some(s => s.includes("Birthday party at the dining table")) && diary.some(s => s.includes("Bought a birthday cake")) && diary.some(s => /Ate its favourite food: mango pudding|Did not like the corn dogs|Refused: corn dogs/.test(s)));
    await game.getByRole("button", { name: "Close" }).click();
    await openShop(); assert.match(await shop.locator("button.fn-tile").filter({ hasText: "Birthday cake" }).innerText(), /Celebrated this session/, "once per session");
    await game.getByRole("button", { name: "Close" }).click();

    // where it all went: 1 RF snack pack + 2 RF foods + 3 RF cake = 6 RF spent (mango pudding eaten from the start stock costs nothing), 4.5 burned, 1.5 to Friend rewards
    const burnedNow = await game.locator(".fn-money small").innerText();
    assert.match(burnedNow, /[\d.]+ RF burned/);
    await game.locator(".fn-money").click();
    const rf = game.locator("section[role=dialog]").filter({ hasText: "Where your RF went" }); await rf.waitFor();
    const rows = await rf.locator("table.fn-rf tbody tr").evaluateAll(trs => trs.map(tr => [...tr.children].map(c => c.textContent.trim())));
    const foodsBought = rows[1][1];
    assert.deepEqual(rows[0], ["Food", "1 RF", "0.5 RF", "0.5 RF"]); assert.deepEqual(rows[2], ["Birthday cake", "3 RF", "3 RF", "0 RF"]);
    assert.equal(rows[1][0], "Shop foods"); assert.ok(["2 RF", "3 RF"].includes(foodsBought), "the foods bought (1 RF each)");
    const n = Number(foodsBought.replace(/[^\d]/g, ""));
    assert.deepEqual(await rf.locator("table.fn-rf tfoot th").allInnerTexts(), ["Total", `${4 + n} RF`, `${3.5 + n / 2} RF`.replace(/\.0 /, " "), `${0.5 + n / 2} RF`]);
    assert.match(await rf.innerText(), /Gift Boxes are the game's own stake[^\n]*0 opened × 1 RF = 0 RF staked/);
    await page.screenshot({ path: `${out}/rf-panel.png` });
    assert.deepEqual(errors, []);
  } });
console.log("ok");
