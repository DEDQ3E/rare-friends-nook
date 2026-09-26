// The first day at 3×, from 08:00 to the 22:00 summary card: node tests/day.mjs [passive|engaged] [out-dir]
// passive: nobody helps; engaged: a player who grants wishes and talks to it now and then.
import assert from "node:assert/strict";
import { testGame } from "@rarefriends/friendsdk/testing";
const mode = process.argv[2] ?? "engaged", out = process.argv[3] ?? "./tmp";
await testGame("./games/friend-nook", { width: 1280, height: 800, timeout: 300000,
  check: async ({ page, game }) => {
    const errors = []; page.on("pageerror", e => errors.push(String(e)));
    const card = await game.locator(".fn-intro").innerText();
    assert.ok(card.includes("secrets") && !card.includes("Quirk:") && card.includes("22:00"), "secrets hidden, day goal shown");
    await game.getByRole("button", { name: /Welcome home/ }).click();
    await game.getByRole("button", { name: "Speed 3×" }).click();
    const summary = game.getByRole("dialog", { name: "day" });
    for (let t = 0; !(await summary.count()); t++) {
      assert.ok(t < 400, "the day ends");
      if (mode === "engaged") {
        const wish = game.locator(".fn-wishgo:not([disabled])"), wishing = await game.locator(".fn-wishgo").count();
        if (await wish.count()) await wish.first().click();
        else if (!wishing && t % 12 === 0) { await page.keyboard.press("KeyF"); const talk = game.getByRole("menuitem", { name: /Talk/ }); if (await talk.count()) await talk.click(); }
        const panel = game.locator(".fn-close"); if (await panel.count() && !(await summary.count())) await panel.click();
      }
      await page.waitForTimeout(500);
    }
    console.log(mode, "\n" + (await summary.innerText()));
    await page.locator("#root").screenshot({ path: `${out}/day-${mode}.png` });
    await game.getByRole("button", { name: "Keep playing" }).click();
    await game.getByRole("button", { name: /character card/ }).click(); await page.waitForTimeout(300);
    await page.locator("#root").screenshot({ path: `${out}/day-${mode}-card.png` });
    const guesses = game.locator(".fn-guess button");
    if (await guesses.count()) { await guesses.first().click(); await page.waitForTimeout(300); assert.ok(!(await guesses.count()), "one guess only"); console.log("snack:", await game.locator(".fn-traits dd").filter({ hasText: /guessed|^[a-z]/ }).allInnerTexts()); }
    console.log((await game.locator(".fn-diary").innerText()).split("\n").reverse().join("\n"));
    if (errors.length) { console.log("ERRORS:\n" + errors.join("\n")); process.exitCode = 1; }
  } });
console.log("ok");
