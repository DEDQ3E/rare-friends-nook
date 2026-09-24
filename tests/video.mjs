// A demo video WITH SOUND of the real game: the real SDK runtime, a real Friend read live from mainnet
// (tests/live.mjs: only the wallet and ownership answers are mocked), recorded as the tab plays, picture and
// sound together (tab capture in headless Microsoft Edge, cropped to the game frame).
// Needs (not in package.json): npm install --no-save playwright; Microsoft Edge installed.
// Run: node tests/video.mjs [tokenId] → media/friend-nook.webm
import { writeFileSync } from "node:fs";
import { liveRuntime } from "./live.mjs";

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
      const r = new MediaRecorder(s, { mimeType: "video/webm;codecs=vp9,opus", videoBitsPerSecond: 2_500_000, audioBitsPerSecond: 128_000 }), parts = [];
      r.ondataavailable = e => parts.push(e.data); r.start(1000); b.remove();
      window.__stop = () => new Promise(res => { r.onstop = async () => { const buf = new Uint8Array(await new Blob(parts).arrayBuffer()); s.getTracks().forEach(t => t.stop()); res(Array.from(buf)); }; r.stop(); });
    };
  });
  await page.click("#rec"); await page.waitForFunction(() => !!window.__stop);
  const k = (await canvas.boundingBox()).width / 960;
  const at = (i, j, z = 0) => ({ x: ((i - j) * 18 - 18 + 240) * 2 * k, y: ((i + j) * 9 - z - 88 + 160) * 2 * k });
  const wait = ms => page.waitForTimeout(ms);
  const zoom = async on => { await game.getByRole("button", { name: on ? "Zoom in" : "Zoom out" }).click(); await wait(1300); };
  const use = async (i, j, z, label) => { await canvas.click({ position: at(i, j, z) }); await wait(700); await game.getByRole("menuitem", { name: new RegExp(label) }).first().click(); };
  const friendMenu = async label => { await canvas.focus(); await page.keyboard.press("KeyF"); await wait(700); await game.getByRole("menuitem", { name: new RegExp(label) }).first().click(); };

  await wait(4000);                                                          // the Meet your Friend card
  await game.getByRole("button", { name: /Welcome home/ }).click(); await wait(3200); // the camera glides in
  await game.getByRole("button", { name: "Got it" }).click().catch(() => {});
  await friendMenu("^Pet"); await wait(3200);
  await zoom(false); await use(5.8, 9.45, 26, "mirror ball"); await wait(2200); await zoom(true); await wait(8000);
  await zoom(false); await use(6.05, .6, 8, "Take a bath"); await wait(3800); await zoom(true); await wait(6000);
  await friendMenu("Open a Gift Box"); await wait(900);
  await game.getByRole("button", { name: /Buy and open/ }).click();
  for (let n = 0; n < 2; n++) { const b = page.getByRole("button", { name: "Confirm preview" }); await b.waitFor(); await wait(700); await b.click(); }
  await game.getByRole("button", { name: "Keep it in the hutch" }).waitFor({ timeout: 90000 }); await wait(3500);
  await game.getByRole("button", { name: "Keep it in the hutch" }).click(); await wait(2500);

  const bytes = await page.evaluate(() => window.__stop());
  writeFileSync("media/friend-nook.webm", Buffer.from(bytes));
  console.log("media/friend-nook.webm", (bytes.length / 1e6).toFixed(1), "MB", errors.length ? "ERRORS " + errors.join("; ") : "");
  await close();
} finally { await rt.close(); }
