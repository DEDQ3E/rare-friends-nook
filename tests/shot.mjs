// Quick screenshot of the game with the SDK's mock wallet: node tests/shot.mjs [out-dir] [seconds]
import { testGame } from "@rarefriends/friendsdk/testing";
const out = process.argv[2] ?? "./tmp", wait = Number(process.argv[3] ?? 3);
await testGame("./games/friend-nook", {
  timeout: 120000,
  check: async ({ page, game }) => {
    const errors = []; page.on("pageerror", e => errors.push(String(e))); page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    await game.getByRole("button", { name: /character card/ }).waitFor({ timeout: 60000 });
    await page.waitForTimeout(wait * 1000);
    await page.locator("#root").screenshot({ path: `${out}/shot.png` });
    if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
  },
});
console.log("ok");
