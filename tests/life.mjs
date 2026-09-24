// Leave the Friend alone at 3× until night and read its diary: node tests/life.mjs [seconds]
import { testGame } from "@rarefriends/friendsdk/testing";
const secs = Number(process.argv[2] ?? 95);
await testGame("./games/friend-nook", { timeout: 60000 + secs * 1000 * 2,
  check: async ({ page, game }) => {
    const errors = []; page.on("pageerror", e => errors.push(String(e)));
    await game.getByRole("button", { name: /character card/ }).waitFor({ timeout: 60000 });
    await game.getByRole("button", { name: /Welcome home/ }).click(); await game.getByRole("button", { name: "Zoom out" }).click(); await page.waitForTimeout(1200); // tests click furniture in the whole-house view
    await game.getByRole("button", { name: "Speed 3×" }).click();
    for (let t = 0; t < secs; t += 15) { await page.waitForTimeout(15000); await page.locator("#root").screenshot({ path: `./tmp/life-${String(t).padStart(3, "0")}.png` }); }
    await game.getByRole("button", { name: /character card/ }).click(); await page.waitForTimeout(300);
    console.log((await game.locator(".fn-diary").innerText().catch(() => "(no diary)")));
    console.log("needs:", await game.locator(".fn-needs").innerText());
    await page.locator("#root").screenshot({ path: "./tmp/life-profile.png" });
    if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
  } });
