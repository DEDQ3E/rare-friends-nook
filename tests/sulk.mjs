// Left alone too long, the Friend sulks: requests are refused until you make up. node tests/sulk.mjs [out-dir]
import assert from "node:assert/strict";
import { testGame } from "@rarefriends/friendsdk/testing";
const out = process.argv[2] ?? "./tmp";
await testGame("./games/friend-nook", { width: 1280, height: 800, timeout: 300000,
  check: async ({ page, game }) => {
    const errors = []; page.on("pageerror", e => errors.push(String(e)));
    await game.getByRole("button", { name: /Welcome home/ }).click();
    await game.getByRole("button", { name: "Got it" }).click({ timeout: 3000 }).catch(() => {});
    await game.getByRole("button", { name: "Speed 3×" }).click();
    const t0 = Date.now();
    await game.locator(".fn-toast").filter({ hasText: "is sulking" }).waitFor({ timeout: 120000 });
    console.log(`sulking after ${((Date.now() - t0) / 1000).toFixed(0)} s at 3×`);
    await game.getByRole("button", { name: "Speed 1×" }).click();
    await page.screenshot({ path: `${out}/sulk.png` });
    assert.match(await game.locator(".fn-mood").innerText(), /Sulky/);
    assert.match(await game.locator(".fn-hintbtn").innerText(), /Sulking/);
    // a request is refused while it sulks
    await game.getByRole("button", { name: "Open your Friend's character card" }).click();
    const before = (await game.locator(".fn-diary li").allInnerTexts()).filter(s => s.includes("Refused")).length;
    await game.getByRole("button", { name: "Close" }).first().click();
    await game.locator("canvas").focus();
    let asked = false;
    for (const key of ["", "ArrowDown", "ArrowLeft", "ArrowUp", "ArrowRight"]) { // E: the nearest object's menu (walk a bit if nothing is near)
      if (key) { await page.keyboard.down(key); await page.waitForTimeout(700); await page.keyboard.up(key); }
      await page.keyboard.press("KeyE"); await page.waitForTimeout(400);
      const item = game.getByRole("menuitem").first();
      if (await item.isVisible()) { await item.click(); asked = true; break; }
    }
    assert.ok(asked, "asked it to do something");
    await game.locator(".fn-toast").filter({ hasText: "is sulking" }).waitFor({ state: "detached", timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(800);
    // make up: pet it until it forgives
    let forgiven = false;
    for (let n = 0; n < 6 && !forgiven; n++) {
      await game.locator("canvas").focus(); await page.keyboard.press("KeyF");
      await game.getByRole("menuitem", { name: /^Pet/ }).click();
      forgiven = await game.locator(".fn-toast").filter({ hasText: "forgave you" }).waitFor({ timeout: 6000 }).then(() => true, () => false);
    }
    assert.ok(forgiven, "petting makes up");
    await page.screenshot({ path: `${out}/forgive.png` });
    await game.getByRole("button", { name: "Open your Friend's character card" }).click();
    const diary = await game.locator(".fn-diary li").allInnerTexts();
    console.log(diary.slice(0, 8).join(" | "));
    assert.ok(diary.filter(s => s.includes("Refused")).length > before || diary.some(s => s.includes("Refused")), "refused while sulking");
    assert.ok(diary.some(s => s.includes("Made up with you")));
    assert.deepEqual(errors, []);
  } });
console.log("ok");
