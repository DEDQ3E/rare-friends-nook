// Close-ups of activities (animated furniture, particles, props, the need hint): node tests/fx.mjs [out-dir]
import { testGame } from "@rarefriends/friendsdk/testing";
const out = process.argv[2] ?? "./tmp";
let k = 1, box = null;
const at = (i, j, z = 0) => ({ x: ((i - j) * 18 - 18 + 240) * 2 * k, y: ((i + j) * 9 - z - 88 + 160) * 2 * k });
await testGame("./games/friend-nook", {
  timeout: 300000,
  check: async ({ page, game }) => {
    const errors = []; page.on("pageerror", e => errors.push(String(e)));
    await game.getByRole("button", { name: /character card/ }).waitFor({ timeout: 60000 });
    await game.getByRole("button", { name: /Welcome home/ }).click();
    const canvas = game.locator("canvas"); box = await canvas.boundingBox(); k = box.width / 960;
    await game.getByRole("button", { name: "Got it" }).click().catch(() => {});
    // the test browser asks for reduced motion; switch it off to see particles
    await game.getByRole("button", { name: "How to play" }).click(); await game.getByLabel("Reduce motion").selectOption("off"); await game.getByRole("button", { name: "Close" }).click();
    await page.screenshot({ path: `${out}/fx-hint.png`, clip: { x: box.x, y: box.y + box.height - 250 * k, width: 420 * k, height: 250 * k } });
    // close-up around a world point
    const close = async (name) => { await game.getByRole("button", { name: "Zoom in" }).click(); await page.waitForTimeout(1500); await page.locator("#root").screenshot({ path: `${out}/${name}.png` }); await game.getByRole("button", { name: "Zoom out" }).click(); await page.waitForTimeout(1800); };
    const use = async (i, j, z, label, wait) => {
      await canvas.click({ position: at(i, j, z) });
      await game.getByRole("menuitem", { name: new RegExp(label) }).first().click();
      await page.waitForTimeout(wait);
    };
    await use(.4, 7.1, 14, "Watch TV", 7000); await close("fx-tv");
    await use(.4, 7.1, 14, "Play video games", 7000); await close("fx-games");
    await use(6.05, .6, 8, "Take a bath", 7000); await close("fx-bath");
    await use(11.4, .5, 20, "Grab a snack", 2500); await close("fx-snack");
    await use(5.57, 5.37, 10, "Dance", 6000); await close("fx-dance");
    await use(2.82, 1.5, 7, "Play with toys", 6000); await close("fx-toys");
    await use(1.45, 9.05, 8, "Read", 7000); await close("fx-read");
    if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
  },
});
console.log("ok");
