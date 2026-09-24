// The nine family heirlooms, drawn by the game's own builders and depth sort, as media/heirlooms.png.
// Needs (not in package.json): npm install --no-save playwright pngjs
// Run: node tests/heirlooms.mjs
import { build } from "esbuild";
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { PNG } from "pngjs";

const { outputFiles } = await build({ entryPoints: ["tests/heirlooms-render.ts"], bundle: true, format: "iife", write: false, logLevel: "error" });
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });
const errors = []; page.on("pageerror", e => errors.push(String(e)));
await page.setContent("<body style='margin:0'></body>"); await page.addScriptTag({ content: outputFiles[0].text });
await page.evaluate(() => window.draw(true));
const big = PNG.sync.read(await page.locator("canvas").screenshot()); await browser.close();
if (errors.length) throw new Error(errors.join("\n"));
const k = 2, w = big.width / k | 0, h = big.height / k | 0, out = new PNG({ width: w, height: h });
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const a = [0, 0, 0]; for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const s = ((y * k + dy) * big.width + x * k + dx) * 4; a[0] += big.data[s]; a[1] += big.data[s + 1]; a[2] += big.data[s + 2]; }
  const d = (y * w + x) * 4; out.data[d] = a[0] / 4; out.data[d + 1] = a[1] / 4; out.data[d + 2] = a[2] / 4; out.data[d + 3] = 255;
}
writeFileSync("media/heirlooms.png", PNG.sync.write(out)); console.log("media/heirlooms.png", w, "x", h);
