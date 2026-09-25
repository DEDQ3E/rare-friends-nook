// Meme mode: random captions from the Friend's own character over a clean snapshot; writes media/memes.png.
// Run: node tests/meme.mjs [out-dir]
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import { testGame } from "@rarefriends/friendsdk/testing";
const out = process.argv[2] ?? "./tmp";
for (const [w, h, name] of [[1280, 800, "meme-desktop"], [844, 390, "meme-phone"]]) {
  await testGame("./games/friend-nook", { width: w, height: h, timeout: 120000,
    check: async ({ page, game }) => {
      const errors = []; page.on("pageerror", e => errors.push(String(e)));
      await game.getByRole("button", { name: /Welcome home/ }).click(); await page.waitForTimeout(1500);
      await game.getByRole("button", { name: "Make a meme" }).click();
      const img = game.locator("img.fn-meme"), seen = new Set(), shots = [];
      for (let n = 0; n < 6; n++) {
        await img.waitFor(); const alt = await img.getAttribute("alt"); seen.add(alt);
        assert.match(await img.getAttribute("src"), /^data:image\/png;base64,/);
        if (name === "meme-desktop" && n < 3) shots.push(PNG.sync.read(Buffer.from((await img.getAttribute("src")).split(",")[1], "base64")));
        if (n < 2) await page.screenshot({ path: `${out}/${name}-${n}.png` });
        await game.getByRole("button", { name: "Another meme" }).click(); await page.waitForTimeout(250);
      }
      if (shots.length) { // media/memes.png: the first three memes side by side (needs pngjs)
        const W = shots.reduce((a, i) => a + i.width, 0) + 24, H = Math.max(...shots.map(i => i.height)), sheet = new PNG({ width: W, height: H });
        let x = 0; for (const im of shots) { PNG.bitblt(im, sheet, 0, 0, im.width, im.height, x, 0); x += im.width + 12; }
        writeFileSync("./media/memes.png", PNG.sync.write(sheet));
      }
      console.log(name, [...seen]);
      assert.ok(seen.size >= 4, "memes change"); assert.deepEqual(errors, []);
      await game.getByRole("button", { name: "Back to the house" }).click();
    } });
}
console.log("ok");
