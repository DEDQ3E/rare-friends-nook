// README media for Friend #7730 in the real SDK runtime, its artwork, family, seed and generation read live from
// mainnet (tests/live.mjs; only the wallet and ownership answers are mocked): the screenshots in media/.
// Needs (not in package.json): npm install --no-save playwright
// Run: node tests/media.mjs
import { liveRuntime } from "./live.mjs";
import { mkdirSync } from "node:fs";

const out = "./media";
mkdirSync(out, { recursive: true });
let k = 1;
const at = (i, j, z = 0) => ({ x: ((i - j) * 18 - 18 + 240) * 2 * k, y: ((i + j) * 9 - z - 88 + 160) * 2 * k });

const rt = await liveRuntime();
try {
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

  // Gift Box through the SDK confirmations
  const confirm = async () => { const b = page.getByRole("button", { name: "Confirm preview" }); await b.waitFor({ timeout: 30000 }); await b.click(); };
  await canvas.click({ position: { x: 30, y: 200 } }); await page.keyboard.press("KeyF");
  await game.getByRole("menuitem", { name: /Open a Gift Box/ }).click();
  await game.getByRole("button", { name: /Buy and open/ }).click(); await confirm(); await confirm();
  await game.getByRole("button", { name: "Keep it in the hutch" }).waitFor({ timeout: 90000 });
  await shot("gift");
  await game.getByRole("button", { name: "Keep it in the hutch" }).click();

  // Buy mode: placing an arcade
  await game.getByRole("button", { name: /Buy mode/ }).click();
  await game.getByRole("button", { name: /Arcade cabinet/ }).click();
  await canvas.hover({ position: at(4.2, 3.4) }); await shot("placing");
  await canvas.click({ position: at(4.2, 3.4) });

  // leave it alone at 3× until night: the day's recap card at 22:00, then the character card with its diary
  await game.getByRole("button", { name: "Speed 3×" }).click();
  await page.waitForTimeout(80000);
  const night = game.getByRole("button", { name: /Good night/ });
  await night.waitFor({ timeout: 60000 }); await page.waitForTimeout(600); await shot("recap"); await night.click();
  await shot("night");
  await game.getByRole("button", { name: /character card/ }).click(); await shot("character");
  if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
  await close();
} finally { await rt.close(); }
console.log("ok");
