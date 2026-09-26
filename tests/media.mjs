// README media for Friend #7730 in the real SDK runtime, its artwork, family, seed and generation read live from
// mainnet (tests/live.mjs; only the wallet and ownership answers are mocked): screenshots in media/ and a GIF.
// Needs (not in package.json): npm install --no-save playwright gifenc pngjs
// Run: node tests/media.mjs
import { liveRuntime } from "./live.mjs";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import gifenc from "gifenc";
import { PNG } from "pngjs";
const { GIFEncoder, quantize, applyPalette } = gifenc;

const out = "./media";
mkdirSync(out, { recursive: true });
let k = 1;
const at = (i, j, z = 0) => ({ x: ((i - j) * 18 - 18 + 240) * 2 * k, y: ((i + j) * 9 - z - 88 + 160) * 2 * k });

const rt = await liveRuntime();
try {
  {
    const { page, game, close } = await rt.open(7730n, { width: 1000, height: 760 });
    const errors = []; page.on("pageerror", e => errors.push(String(e)));
    const root = page.locator("#root");
    const shot = async name => { await page.waitForTimeout(350); await root.screenshot({ path: `${out}/${name}.png` }); };
    const canvas = game.locator("canvas");
    await game.getByRole("button", { name: /Welcome home/ }).waitFor({ timeout: 60000 });
    k = (await canvas.boundingBox()).width / 960;
    await shot("intro");
    await game.getByRole("button", { name: /Welcome home/ }).click(); await game.getByRole("button", { name: "Zoom out" }).click(); await page.waitForTimeout(1200); // the whole house for the README
    // animations on (the test browser asks for reduced motion)
    await game.getByRole("button", { name: "How to play" }).click(); await game.getByLabel("Reduce motion").selectOption("off"); await game.getByRole("button", { name: "Close" }).click();
    await game.getByRole("button", { name: "Got it" }).click().catch(() => {});
    await page.waitForTimeout(900);
    await shot("house");

    const use = async (i, j, z, label, wait = 3500) => { await canvas.click({ position: at(i, j, z) }); await game.getByRole("menuitem", { name: new RegExp(label) }).first().click(); await page.waitForTimeout(wait); };
    const zoom = async on => { await game.getByRole("button", { name: on ? "Zoom in" : "Zoom out" }).click(); await page.waitForTimeout(on ? 1500 : 1900); };

    // GIF: dance, TV, bath (zoomed in, following the Friend)
    const frames = [];
    const record = async (seconds, fps = 7) => { const n = Math.round(seconds * fps); for (let f = 0; f < n; f++) { const t0 = Date.now(); frames.push({ png: await root.screenshot(), ms: 0 }); const spent = Date.now() - t0; await page.waitForTimeout(Math.max(0, 1000 / fps - spent)); frames[frames.length - 1].ms = Math.max(1000 / fps, Date.now() - t0); } };
    await use(5.57, 5.37, 10, "Dance", 3000);
    await zoom(true); await shot("dance"); await record(3.2); await zoom(false);
    await use(.4, 7.1, 14, "Watch TV", 4500);
    await zoom(true); await shot("tv"); await record(3.2); await zoom(false);
    await use(6.05, .6, 8, "Take a bath", 5500);
    await zoom(true); await shot("bath"); await record(3.2); await zoom(false);

    // Gift Box through the SDK confirmations
    const confirm = async () => { const b = page.getByRole("button", { name: "Confirm preview" }); await b.waitFor({ timeout: 30000 }); await b.click(); };
    await canvas.click({ position: { x: 30, y: 200 } }); await page.keyboard.press("KeyF");
    await game.getByRole("menuitem", { name: /Open a Gift Box/ }).click();
    await game.getByRole("button", { name: /Buy and open/ }).click(); await confirm(); await confirm();
    await game.getByRole("button", { name: "Keep it in the hutch" }).waitFor({ timeout: 90000 });
    await shot("gift");
    await game.getByRole("button", { name: "Keep it in the hutch" }).click();

    // Buy mode: catalog and placing an arcade
    await game.getByRole("button", { name: /Buy mode/ }).click(); await shot("catalog");
    await game.getByRole("button", { name: /Arcade cabinet/ }).click();
    await canvas.hover({ position: at(4.2, 3.4) }); await shot("placing");
    await canvas.click({ position: at(4.2, 3.4) });

    // leave it alone at 3× until night, then the character card with its diary
    await game.getByRole("button", { name: "Speed 3×" }).click();
    await page.waitForTimeout(80000);
    await shot("night");
    await game.getByRole("button", { name: /character card/ }).click(); await shot("character");
    await game.getByRole("button", { name: "Close" }).first().click();

    // GIF: 480 × 320, a palette per frame
    const gif = GIFEncoder();
    for (const f of frames) {
      const img = PNG.sync.read(f.png), w = 480, h = Math.round(img.height * 480 / img.width), rgba = new Uint8Array(w * h * 4);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const sx = Math.floor(x * img.width / w), sy = Math.floor(y * img.height / h), s = (sy * img.width + sx) * 4, d = (y * w + x) * 4; rgba[d] = img.data[s]; rgba[d + 1] = img.data[s + 1]; rgba[d + 2] = img.data[s + 2]; rgba[d + 3] = 255; }
      const palette = quantize(rgba, 128), index = applyPalette(rgba, palette);
      gif.writeFrame(index, w, h, { palette, delay: Math.round(f.ms) });
    }
    gif.finish(); writeFileSync(`${out}/friend-nook.gif`, gif.bytes());
    console.log("frames", frames.length, "gif bytes", readFileSync(`${out}/friend-nook.gif`).length);
    if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
    await close();
  }
  { // phone, landscape
    const { page, game, close } = await rt.open(7730n, { width: 844, height: 390 });
    await game.getByRole("button", { name: /Welcome home/ }).click();
    await page.waitForTimeout(1500); await page.screenshot({ path: `${out}/phone.png` });
    await close();
  }
} finally { await rt.close(); }
console.log("ok");
