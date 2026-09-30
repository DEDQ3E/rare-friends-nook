// A demo video WITH SOUND of the real game: the real SDK runtime, a real Friend read live from mainnet
// (tests/live.mjs: only the wallet and ownership answers are mocked), recorded as the tab plays, picture and
// sound together (tab capture in headless Microsoft Edge, cropped to the game frame).
// Needs (not in package.json): npm install --no-save playwright; Microsoft Edge installed.
// Run: node tests/video.mjs [tokenId] → media/friend-nook.mp4 (H.264 + AAC, under GitHub's 10 MB video limit)
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildSync } from "esbuild";
import { liveRuntime } from "./live.mjs";
import { fixMp4Duration } from "./mp4-duration.mjs";

const id = BigInt(process.argv[2] ?? 66666);
// the favourite food is a secret on the card: compute it with the game's own code, to feed it on screen
buildSync({ entryPoints: ["tests/traits-lib.ts"], bundle: true, platform: "node", format: "esm", outfile: "tmp/traits-lib.mjs", logLevel: "error" });
const lib = await import(pathToFileURL(resolve("tmp/traits-lib.mjs")).href);
const { traits: t } = await lib.traitsOfFriend(id);
const loved = lib.FOOD_BY_ID[t.food.loved].name, liked = t.food.likes.map(f => lib.FOOD_BY_ID[f].name).filter(n => n !== loved)[0];
const hated = t.food.hated.map(f => lib.FOOD_BY_ID[f].name);
const rt = await liveRuntime({ launch: { channel: "msedge", ignoreDefaultArgs: ["--mute-audio"], args: ["--auto-accept-this-tab-capture", "--autoplay-policy=no-user-gesture-required"] } });
try {
  const { page, game, errors, close } = await rt.open(id, { width: 1000, height: 700 });
  const canvas = game.locator("canvas");
  // a recorder button outside the game (tab capture needs a real click); it hides itself once recording
  await page.evaluate(() => {
    const b = document.createElement("button"); b.id = "rec"; b.textContent = "rec"; b.style.cssText = "position:fixed;left:0;top:0;opacity:.01;z-index:9";
    document.body.append(b);
    b.onclick = async () => {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true, preferCurrentTab: true });
      const [v] = s.getVideoTracks(); const frame = document.querySelector(".rf-game-frame");
      if (frame && window.CropTarget) await v.cropTo(await window.CropTarget.fromElement(frame));
      const r = new MediaRecorder(s, { mimeType: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", videoBitsPerSecond: 650_000, audioBitsPerSecond: 96_000 }), parts = [];
      r.ondataavailable = e => parts.push(e.data); r.start(1000); b.remove();
      window.__stop = () => new Promise(res => { r.onstop = async () => { const buf = new Uint8Array(await new Blob(parts).arrayBuffer()); s.getTracks().forEach(t => t.stop()); res(Array.from(buf)); }; r.stop(); });
    };
  });
  await page.click("#rec"); await page.waitForFunction(() => !!window.__stop);
  const k = (await canvas.boundingBox()).width / 960;
  const at = (i, j, z = 0) => ({ x: ((i - j) * 18 - 18 + 240) * 2 * k, y: ((i + j) * 9 - z - 88 + 160) * 2 * k });
  const wait = ms => page.waitForTimeout(ms);
  const zoom = async on => { await game.getByRole("button", { name: on ? "Zoom in" : "Zoom out" }).click(); await wait(1300); };
  const use = async (i, j, z, label) => { // a few heights, in case the Friend or a bubble is in the way
    const item = game.getByRole("menuitem", { name: new RegExp(label) }).first();
    for (const dz of [0, 8, -4, 16, 24]) { await canvas.click({ position: at(i, j, z + dz) }); await wait(700); if (await item.isVisible()) return item.click(); await page.keyboard.press("Escape"); }
    throw new Error(`no menu for ${label}`);
  };
  const friendMenu = async label => { await canvas.focus(); await page.keyboard.press("KeyF"); await wait(700); await game.getByRole("menuitem", { name: new RegExp(label) }).first().click(); };

  await wait(4500);                                                          // the Meet your Friend card: its family table is the riddle's hint
  await game.getByRole("button", { name: /Welcome home/ }).click();          // the camera glides in
  await game.getByRole("button", { name: "Got it" }).click({ timeout: 3000 }).catch(() => {});
  await game.locator(".fn-toast").filter({ hasText: /own choice|Secret \d/ }).waitFor(); // its first own choice, and why
  await wait(3500);
  await zoom(false);
  // the food riddle: what is in the fridge at move-in, the shop, the loved food
  const shop = game.locator("section[role=dialog]").filter({ hasText: "Shop" });
  const toast = re => game.locator(".fn-toast").filter({ hasText: re });
  const openShop = async () => { await game.getByRole("button", { name: "Shop" }).click(); await shop.waitFor(); await wait(1400); };
  const fridge = async re => { for (const [i, j, z] of [[11.4, .5, 16], [11.4, .5, 8], [11.4, 1, 20], [11.4, .4, 24]]) { await canvas.click({ position: at(i, j, z) }); await wait(600); const m = game.getByRole("menuitem", { name: re }).first(); if (await m.count()) return m; await page.keyboard.press("Escape"); } throw new Error("fridge"); };
  const speed = n => game.getByRole("button", { name: `Speed ${n}×` }).click();          // the walk to the fridge at 3×, the rest at 1×
  const hatedRe = new RegExp(hated.join("|"), "i"), lovedRe = new RegExp(loved, "i");
  if (t.food.start === "picky") { await (await fridge(hatedRe)).click(); await speed(3); await toast(/did not like|turns up its nose/).waitFor({ timeout: 40000 }); await speed(1); await wait(1800); }
  await openShop(); await shop.locator("button.fn-food").filter({ hasText: liked }).click(); await wait(900);
  await shop.locator("button.fn-food").filter({ hasText: loved }).click(); await wait(1500); await game.getByRole("button", { name: "Close" }).click();
  await (await fridge(lovedRe)).click(); await speed(3); await toast(/favourite snack is|loved its/).waitFor({ timeout: 60000 }); await speed(1); await wait(2200);
  // its birthday, the cake, and where the RF went
  await friendMenu("^Talk"); await toast(/Secret \d\/3 found: its birthday/).waitFor({ timeout: 30000 });
  await toast(/asks to celebrate its birthday/).waitFor({ timeout: 25000 }); await wait(800);
  await openShop(); await shop.locator("button.fn-tile").filter({ hasText: "Birthday cake" }).click(); await wait(1000);
  await speed(3); await toast(/Happy birthday/).waitFor({ timeout: 120000 }); await wait(1500);
  await speed(1);
  await game.locator(".fn-money").click(); await wait(3800); await game.getByRole("button", { name: "Close" }).click(); await wait(600);
  await zoom(true); await wait(1200);
  await game.getByRole("button", { name: "Make a meme" }).click(); await wait(2800); // a random meme about this Friend
  await game.getByRole("button", { name: "Back to the house" }).click(); await wait(1000);
  await zoom(false); await use(12.05, 4.5, 10, "Visit a neighbour");                  // the front door: a real Friend from the street snapshot
  await game.getByRole("button", { name: /real Friend · simulated visit/ }).first().click({ timeout: 30000 }); await wait(4200); // its whole house; your Friend walks in
  await game.getByRole("button", { name: "Hug" }).click(); await wait(2600);
  await game.getByRole("button", { name: "Dance together" }).click(); await wait(3000);
  await game.getByRole("button", { name: "Go home" }).click(); await zoom(true); await wait(800);
  await friendMenu("Open a Gift Box"); await wait(900);
  await game.getByRole("button", { name: /Buy and open/ }).click();
  for (let n = 0; n < 2; n++) { const b = page.getByRole("button", { name: "Confirm preview" }); await b.waitFor(); await wait(700); await b.click(); }
  await game.getByRole("button", { name: "Keep it in the hutch" }).waitFor({ timeout: 90000 }); await wait(2800);
  await game.getByRole("button", { name: "Keep it in the hutch" }).click(); await wait(1500);

  const bytes = await page.evaluate(() => window.__stop());
  const mp4 = Buffer.from(bytes), secs = fixMp4Duration(mp4); // the real length in the header, so players show it and can seek
  writeFileSync("media/friend-nook.mp4", mp4);
  console.log("media/friend-nook.mp4", (bytes.length / 1e6).toFixed(1), "MB", secs.toFixed(1), "s", errors.length ? "ERRORS " + errors.join("; ") : "");
  await close();
} finally { await rt.close(); }
