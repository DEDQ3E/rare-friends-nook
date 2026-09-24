// Click furniture and actions like a player, screenshot each step: node tests/interact.mjs [out-dir]
import { testGame } from "@rarefriends/friendsdk/testing";
const out = process.argv[2] ?? "./tmp";
// logical world → canvas CSS position at zoom 1 (960 × 640 canvas, camera at (18, 88))
let k = 1;
const at = (i, j, z = 0) => ({ x: ((i - j) * 18 - 18 + 240) * 2 * k, y: ((i + j) * 9 - z - 88 + 160) * 2 * k });
await testGame("./games/friend-nook", {
  timeout: 240000,
  check: async ({ page, game }) => {
    const errors = []; page.on("pageerror", e => errors.push(String(e)));
    await game.getByRole("button", { name: /character card/ }).waitFor({ timeout: 60000 });
    await game.getByRole("button", { name: /Welcome home/ }).click();
    const canvas = game.locator("canvas");
    k = (await canvas.boundingBox()).width / 960;
    const shot = async name => { await page.waitForTimeout(250); await page.locator("#root").screenshot({ path: `${out}/${name}.png` }); };
    const use = async (i, j, z, label, wait, name) => {
      await canvas.click({ position: at(i, j, z) });
      await page.waitForTimeout(200);
      if (!(await game.getByRole("menuitem", { name: new RegExp(label) }).count())) { await shot("fail-" + name); throw new Error("no menu item " + label); }
      await game.getByRole("menuitem", { name: new RegExp(label) }).first().click();
      await page.waitForTimeout(wait); await shot(name);
    };
    await game.getByRole("button", { name: "Speed 3×" }).click();
    await use(3.7, 7.1, 10, "Watch TV", 3500, "i-tv");
    await use(1.3, 1.5, 10, "Nap", 5000, "i-bed");
    await use(9.7, 6.25, 8, "Family dinner", 5000, "i-dinner");
    await use(6.05, .6, 8, "Take a bath", 5000, "i-bath");
    await canvas.click({ position: at(6, 7.5, 0) }); await page.waitForTimeout(1000);
    const f = await game.locator("canvas").boundingBox(); void f;
    await page.keyboard.press("KeyF"); await page.waitForTimeout(300); await shot("i-friendmenu");
    if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
  },
});
console.log("ok");
