// Sound check: after the first click, music and activity sounds are scheduled (counts Web Audio nodes), and mute stops them.
import { testGame } from "@rarefriends/friendsdk/testing";
let k = 1;
const at = (i, j, z = 0) => ({ x: ((i - j) * 18 - 18 + 240) * 2 * k, y: ((i + j) * 9 - z - 88 + 160) * 2 * k });
await testGame("./games/friend-nook", { timeout: 240000, check: async ({ page, game }) => {
  const errors = []; page.on("pageerror", e => errors.push(String(e)));
  await game.getByRole("button", { name: /character card/ }).waitFor({ timeout: 60000 });
    await game.getByRole("button", { name: /Welcome home/ }).click();
  const f = page.frames().find(x => x !== page.mainFrame());
  await f.evaluate(() => {
    const w = window; w.__audio = { osc: 0, noise: 0 };
    const P = AudioContext.prototype, o = P.createOscillator, b = P.createBufferSource;
    P.createOscillator = function () { w.__audio.osc++; return o.call(this); };
    P.createBufferSource = function () { w.__audio.noise++; return b.call(this); };
  });
  const canvas = game.locator("canvas"); k = (await canvas.boundingBox()).width / 960;
  const count = async () => f.evaluate(() => ({ ...window.__audio }));
  const measure = async (label, ms) => { const a = await count(); await page.waitForTimeout(ms); const b = await count(); console.log(label.padEnd(18), "oscillators", b.osc - a.osc, "noise", b.noise - a.noise); };
  await canvas.click({ position: { x: 30, y: 200 } }); // first gesture unlocks audio
  await measure("music + ambience", 3000);
  const use = async (i, j, z, label) => { await canvas.click({ position: at(i, j, z) }); await game.getByRole("menuitem", { name: new RegExp(label) }).first().click(); await page.waitForTimeout(3500); };
  await use(.4, 7.1, 14, "Watch TV"); await measure("TV", 3000);
  await use(6.05, .6, 8, "Take a bath"); await measure("bath", 3000);
  await use(5.57, 5.37, 10, "Dance"); await measure("dance (record)", 3000);
  await game.getByRole("button", { name: "Sound on" }).click(); await page.waitForTimeout(500);
  await measure("muted", 3000);
  if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
} });
