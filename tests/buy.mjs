// Buy mode: open the catalog, buy two pieces, place them, move one, and use one.
import { testGame } from "@rarefriends/friendsdk/testing";
const out = process.argv[2] ?? "./tmp";
let k = 1;
const at = (i, j, z = 0) => ({ x: ((i - j) * 18 - 18 + 240) * 2 * k, y: ((i + j) * 9 - z - 88 + 160) * 2 * k });
await testGame("./games/friend-nook", {
  timeout: 240000,
  check: async ({ page, game }) => {
    const errors = []; page.on("pageerror", e => errors.push(String(e)));
    await game.getByRole("button", { name: /character card/ }).waitFor({ timeout: 60000 });
    const canvas = game.locator("canvas"); k = (await canvas.boundingBox()).width / 960;
    const shot = async name => { await page.waitForTimeout(300); await page.locator("#root").screenshot({ path: `${out}/${name}.png` }); };
    await game.getByRole("button", { name: /Buy mode/ }).click();
    await shot("b-catalog");
    await game.getByRole("button", { name: /Arcade cabinet/ }).click();
    await canvas.hover({ position: at(4.2, 3.4) }); await page.waitForTimeout(200); await shot("b-ghost");
    await canvas.click({ position: at(4.2, 3.4) }); await page.waitForTimeout(400);
    await game.getByRole("button", { name: /Buy mode/ }).click();
    await game.getByRole("button", { name: /Aquarium/ }).click();
    await canvas.click({ position: at(6.4, 9.5) }); await page.waitForTimeout(600);
    await shot("b-placed");
    // use the arcade
    await canvas.click({ position: at(4.2, 3.3, 20) });
    await game.getByRole("menuitem", { name: /Play arcade/ }).click();
    await page.waitForTimeout(4000); await shot("b-arcade");
    if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
  },
});
console.log("ok");
