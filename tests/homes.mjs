// The nine family homes, drawn by the game's own shell, builders and depth sort, as media/homes.png.
// Needs (not in package.json): npm install --no-save playwright pngjs
// Run: node tests/homes.mjs [out.png] [night]
import { build } from "esbuild";
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { PNG } from "pngjs";

const out = process.argv[2] ?? "media/homes.png", dark = process.argv[3] === "night" ? 1 : 0;
const { outputFiles } = await build({ entryPoints: ["tests/homes-render.ts"], bundle: true, format: "iife", write: false, logLevel: "error" });
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 2600, height: 1700 } });
const errors = []; page.on("pageerror", e => errors.push(String(e)));
await page.setContent("<body style='margin:0'></body>"); await page.addScriptTag({ content: outputFiles[0].text });
await page.evaluate(d => window.draw(d), dark);
const big = PNG.sync.read(await page.locator("canvas").screenshot()); await browser.close();
if (errors.length) throw new Error(errors.join("\n"));
const k = process.env.K ? +process.env.K : 2, w = big.width / k | 0, h = big.height / k | 0, png = new PNG({ width: w, height: h });
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const a = [0, 0, 0]; for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const s = ((y * k + dy) * big.width + x * k + dx) * 4; a[0] += big.data[s]; a[1] += big.data[s + 1]; a[2] += big.data[s + 2]; }
  const d = (y * w + x) * 4; png.data[d] = a[0] / (k * k); png.data[d + 1] = a[1] / (k * k); png.data[d + 2] = a[2] / (k * k); png.data[d + 3] = 255;
}
writeFileSync(out, PNG.sync.write(png)); console.log(out, w, "x", h);
