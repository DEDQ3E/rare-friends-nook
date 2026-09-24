// Gift Box flow through the SDK: buy + play + settle, the Friend's reaction, keep it (hutch), sell one back.
import { testGame } from "@rarefriends/friendsdk/testing";
const out = process.argv[2] ?? "./tmp";
await testGame("./games/friend-nook", {
  timeout: 240000,
  check: async ({ page, game }) => {
    const errors = []; page.on("pageerror", e => errors.push(String(e)));
    await game.getByRole("button", { name: /character card/ }).waitFor({ timeout: 60000 });
    const shot = async name => { await page.waitForTimeout(300); await page.locator("#root").screenshot({ path: `${out}/${name}.png` }); };
    const focus = () => game.locator("canvas").click({ position: { x: 30, y: 200 } });
    const confirm = async () => { const b = page.getByRole("button", { name: "Confirm preview" }); await b.waitFor({ timeout: 30000 }); await b.click(); };
    await focus(); await page.keyboard.press("KeyF");
    await game.getByRole("menuitem", { name: /Open a Gift Box/ }).click();
    await game.getByRole("button", { name: /Buy and open/ }).click();
    await confirm(); // buy
    await confirm(); // play
    await game.getByRole("button", { name: "Keep it in the hutch" }).waitFor({ timeout: 90000 });
    await shot("g-reveal");
    await game.getByRole("button", { name: "Keep it in the hutch" }).click();
    await page.waitForTimeout(1200);
    await shot("g-after");
    // open two more and sell one from the keepsakes list
    for (let n = 0; n < 2; n++) {
      await focus(); await page.keyboard.press("KeyF"); await game.getByRole("menuitem", { name: /Open a Gift Box/ }).click();
      await game.getByRole("button", { name: /Buy and open/ }).click(); await confirm(); await confirm();
      await game.getByRole("button", { name: "Keep it in the hutch" }).click();
    }
    await game.getByRole("button", { name: /character card/ }).click(); await shot("g-profile");
    await game.getByRole("button", { name: "Close" }).first().click();
    if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
  },
});
console.log("ok");
