// The first 20 seconds: Meet your Friend card, then its first own choice within a few seconds, explained on screen.
// Run: node tests/onboarding.mjs [out-dir]
import assert from "node:assert/strict";
import { testGame } from "@rarefriends/friendsdk/testing";
const out = process.argv[2] ?? "./tmp";
for (let run = 0; run < 3; run++) await testGame("./games/friend-nook", { width: 1280, height: 800, timeout: 120000,
  check: async ({ page, game }) => {
    const card = await game.locator(".fn-intro").innerText();
    for (const t of ["family", "Gen", "Character strength", "Favourite thing", "Quirk"]) assert.ok(card.includes(t), t);
    await game.getByRole("button", { name: /Welcome home/ }).click();
    const t0 = Date.now(), toast = game.locator(".fn-toast").filter({ hasText: "own choice" });
    await toast.waitFor({ timeout: 8000 });
    const text = await toast.innerText(), secs = (Date.now() - t0) / 1000;
    console.log(`${secs.toFixed(1)} s: ${text}`);
    assert.ok(secs < 6, "first own choice within 6 s"); assert.match(text, /loves this|favourite thing|family heirloom|quirk/);
    await page.waitForTimeout(600); if (run === 0) await page.screenshot({ path: `${out}/onboarding.png` });
  } });
console.log("ok");
