// A demo video WITH SOUND of the real game: the real SDK runtime, a real Friend read live from mainnet
// (tests/live.mjs: only the wallet and ownership answers are mocked), recorded as the tab plays, picture and
// sound together (tab capture in headless Microsoft Edge, cropped to the game frame).
// Needs (not in package.json): npm install --no-save playwright; Microsoft Edge installed.
// Run: node tests/video.mjs [tokenId] → media/friend-nook.mp4 (H.264 + AAC, under GitHub's 10 MB video limit)
import { writeFileSync } from "node:fs";
import { liveRuntime } from "./live.mjs";
import { fixMp4Duration } from "./mp4-duration.mjs";

const id = BigInt(process.argv[2] ?? 66666);
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
      const r = new MediaRecorder(s, { mimeType: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", videoBitsPerSecond: 1_100_000, audioBitsPerSecond: 128_000 }), parts = [];
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

  await wait(4000);                                                          // the Meet your Friend card
  await game.getByRole("button", { name: /Welcome home/ }).click();          // the camera glides in
  await game.getByRole("button", { name: "Got it" }).click({ timeout: 3000 }).catch(() => {});
  await game.locator(".fn-toast").filter({ hasText: /own choice|Secret \d/ }).waitFor(); // its first own choice, and why
  await wait(5000);
  await friendMenu("^Talk"); await wait(4000);                              // talking finds a secret: its birthday
  await zoom(false); await use(6.05, .6, 8, "Take a bath"); await wait(3000); await zoom(true); await wait(3500);
  await game.getByRole("button", { name: "Make a meme" }).click(); await wait(2800); // a random meme about this Friend
  await game.getByRole("button", { name: "Another meme" }).click(); await wait(2800);
  await game.getByRole("button", { name: "Back to the house" }).click(); await wait(1200);
  await zoom(false); await use(12.05, 4.5, 10, "Visit a neighbour");                  // the front door: a simulated neighbour
  await game.getByRole("button", { name: /real Friend · simulated visit/ }).first().click({ timeout: 30000 }); await wait(4200); // its whole house; your Friend walks in
  await game.getByRole("button", { name: "Hug" }).click(); await wait(3000);
  await game.getByRole("button", { name: "Dance together" }).click(); await wait(3500);
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
