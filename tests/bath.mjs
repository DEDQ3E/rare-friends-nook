// Bath close-up (zoomed, motion on): node tests/bath.mjs [out-dir]
import { testGame } from "@rarefriends/friendsdk/testing";
const out = process.argv[2] ?? "./tmp";
let k = 1;
const at = (i, j, z = 0) => ({ x: ((i - j) * 18 - 18 + 240) * 2 * k, y: ((i + j) * 9 - z - 88 + 160) * 2 * k });
await testGame("./games/friend-nook", { timeout: 120000, check: async ({ page, game }) => {
  await game.getByRole("button", { name: /character card/ }).waitFor({ timeout: 60000 });
  const canvas = game.locator("canvas"); k = (await canvas.boundingBox()).width / 960;
  await game.getByRole("button", { name: "Got it" }).click().catch(() => {});
  await game.getByRole("button", { name: "How to play" }).click(); await game.getByLabel("Reduce motion").selectOption("off"); await game.getByRole("button", { name: "Close" }).click();
  await canvas.click({ position: at(6.05, .6, 8) }); await game.getByRole("menuitem", { name: /Take a bath/ }).click();
  await page.waitForTimeout(6000);
  await game.getByRole("button", { name: "Zoom in" }).click(); await page.waitForTimeout(1500);
  await page.locator("#root").screenshot({ path: `${out}/bath-zoom.png` });
  const b = await canvas.boundingBox(), p = at(6.05, .6, 10);
  await game.getByRole("button", { name: "Zoom out" }).click(); await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}/bath-normal.png`, clip: { x: b.x + p.x - 160 * k, y: b.y + p.y - 120 * k, width: 320 * k, height: 200 * k } });
} });
console.log("ok");
