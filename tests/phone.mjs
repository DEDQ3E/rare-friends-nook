// Phone-sized screenshots: node tests/phone.mjs [out-dir]
import { testGame } from "@rarefriends/friendsdk/testing";
const out = process.argv[2] ?? "./tmp";
for (const [w, h, name] of [[844, 390, "p-landscape"], [390, 844, "p-portrait"], [1280, 800, "p-desktop"]]) {
  await testGame("./games/friend-nook", { width: w, height: h, timeout: 120000,
    check: async ({ page, game }) => {
      await game.getByRole("button", { name: /character card/ }).waitFor({ timeout: 60000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${out}/${name}.png` });
      const box = await game.locator(".fn-root").boundingBox(); console.log(name, "game", Math.round(box.width), "x", Math.round(box.height));
    } });
}
console.log("ok");
