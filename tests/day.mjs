// One day together: secrets found by playing, then the day's recap card at 22:00. node tests/day.mjs [out-dir]
import assert from "node:assert/strict";
import { testGame } from "@rarefriends/friendsdk/testing";
const out = process.argv[2] ?? "./tmp";
await testGame("./games/friend-nook", { width: 1280, height: 800, timeout: 300000,
  check: async ({ page, game }) => {
    const errors = []; page.on("pageerror", e => errors.push(String(e)));
    await page.screenshot({ path: `${out}/day-card.png` });
    const card = await game.locator(".fn-intro").innerText();
    assert.ok(!card.includes("rice balls") && !card.includes("Quiet one") && !card.includes("Sep 20"), "the card keeps the secrets");
    await game.getByRole("button", { name: /Welcome home/ }).click();
    await game.getByRole("button", { name: "Got it" }).click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1500);
    // talk to it: its birthday
    await game.locator("canvas").focus(); await page.keyboard.press("KeyF");
    await game.getByRole("menuitem", { name: /^Talk/ }).click();
    const secret = game.locator(".fn-toast").filter({ hasText: /Secret \d\/4 found: its birthday is Sep 20/ });
    await secret.waitFor({ timeout: 20000 }); console.log(await secret.innerText());
    await page.screenshot({ path: `${out}/day-secret.png` });
    // leave it alone until 22:00
    await game.getByRole("button", { name: "Speed 3×" }).click();
    const recap = game.locator("section[role=dialog]").filter({ hasText: "Day 1 with Humippy" });
    await recap.waitFor({ timeout: 200000 });
    await page.waitForTimeout(500); await page.screenshot({ path: `${out}/day-recap.png` });
    const text = await recap.innerText(); console.log(text.split("\n").slice(0, 8).join(" | "));
    assert.match(text, /things it chose by itself/); assert.match(text, /secrets found: \d\/4/);
    assert.match(await game.locator(".fn-meme").getAttribute("src"), /^data:image\/png/);
    await game.getByRole("button", { name: /Good night/ }).click();
    await game.getByRole("button", { name: "Open your Friend's character card" }).click();
    const profile = await game.locator("section[role=dialog]").innerText();
    assert.match(profile, /Birthday\s+Sep 20/); console.log(profile.match(/Secrets found[^\n]*\n[^\n]*/)?.[0].replace("\n", " "));
    assert.deepEqual(errors, []);
  } });
console.log("ok");
