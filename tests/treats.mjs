// Paid extras: the Special treat (1 RF, unnamed until the snack secret is found; eating one reveals it) and the
// Birthday cake (3 RF, all burned, asked for once after the birthday secret; shared at the dining table).
// Run: node tests/treats.mjs [out-dir]
import assert from "node:assert/strict";
import { testGame } from "@rarefriends/friendsdk/testing";
const out = process.argv[2] ?? "./tmp";
await testGame("./games/friend-nook", { width: 1280, height: 800, timeout: 300000,
  check: async ({ page, game }) => {
    const errors = []; page.on("pageerror", e => errors.push(String(e)));
    await game.getByRole("button", { name: /Welcome home/ }).click();
    await game.getByRole("button", { name: "Got it" }).click({ timeout: 3000 }).catch(() => {});
    await game.getByRole("button", { name: "Zoom out" }).click(); await page.waitForTimeout(1300);
    const canvas = game.locator("canvas").first(), k = (await canvas.boundingBox()).width / 960;
    const at = (i, j, z) => ({ x: ((i - j) * 18 - 18 + 240) * 2 * k, y: ((i + j) * 9 - z - 88 + 160) * 2 * k });
    const shop = game.locator("section[role=dialog]").filter({ hasText: "Shop" });
    const openShop = async () => { await game.getByRole("button", { name: "Shop" }).click(); await shop.waitFor(); };
    const toast = re => game.locator(".fn-toast").filter({ hasText: re });
    const balance = async () => Number((await game.locator(".fn-money strong").innerText()).replace(/[^\d.]/g, ""));

    // the treat: 1 RF, unnamed, half burned and half to Friend rewards
    const start = await balance();
    await openShop();
    const tile = shop.locator("button.fn-tile").filter({ hasText: "Special treat" });
    assert.match(await tile.innerText(), /1 RF/); assert.equal(await shop.locator("button.fn-tile").filter({ hasText: "Birthday cake" }).count(), 0, "no cake before its birthday is known");
    await tile.click();
    await toast(/Special treat added \(1 RF: 0\.5 RF burned, 0\.5 RF to Friend rewards/).waitFor({ timeout: 5000 });
    assert.equal(await balance(), start - 1, "a treat costs 1 RF");
    await page.screenshot({ path: `${out}/treats-shop.png` });
    await game.getByRole("button", { name: "Close" }).click();

    // give it at the fridge: it reveals the favourite snack (the secret), and the treat is named from then on
    let served = false;
    for (const [i, j, z] of [[11.4, .5, 16], [11.4, .5, 8], [11.4, 1, 20], [11.4, .4, 24]]) {
      await canvas.click({ position: at(i, j, z) }); await page.waitForTimeout(400);
      const item = game.getByRole("menuitem", { name: /Special treat/ });
      if (await item.count()) { await item.click(); served = true; break; }
    }
    assert.ok(served, "the fridge offers the Special treat");
    const found = toast(/Secret \d\/3 found: its favourite snack is ([a-z ]+)/); await found.waitFor({ timeout: 60000 });
    const snack = (await found.innerText()).match(/favourite snack is ([a-z ]+)/)[1].trim(); console.log("snack:", snack);
    await openShop();
    const named = snack[0].toUpperCase() + snack.slice(1) + " (treat)";
    assert.ok(await shop.locator("button.fn-tile").filter({ hasText: named }).count(), `the treat is now "${named}"`);
    await game.getByRole("button", { name: "Close" }).click();

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
    await page.screenshot({ path: `${out}/treats-cake.png` });
    await game.getByRole("button", { name: "Open your Friend's character card" }).click();
    const diary = await game.locator(".fn-diary li").allInnerTexts(); console.log(diary.slice(0, 5).join(" | "));
    assert.ok(diary.some(s => s.includes("Birthday party at the dining table")) && diary.some(s => s.includes("Shared a special treat")) && diary.some(s => s.includes("Bought a birthday cake")));
    await game.getByRole("button", { name: "Close" }).click();
    await openShop(); assert.match(await shop.locator("button.fn-tile").filter({ hasText: "Birthday cake" }).innerText(), /Celebrated this session/, "once per session");
    assert.deepEqual(errors, []);
  } });
console.log("ok");
