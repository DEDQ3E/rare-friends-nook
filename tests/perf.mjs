// Frame rate of the running game (headless Chromium, software rendering): node tests/perf.mjs
import { testGame } from "@rarefriends/friendsdk/testing";
await testGame("./games/friend-nook", { timeout: 120000,
  check: async ({ page, game }) => {
    await game.getByRole("button", { name: /character card/ }).waitFor({ timeout: 60000 });
    const frame = page.frames().find(f => f !== page.mainFrame() && f.url() !== "about:blank") ?? page.frames()[1];
    const fps = await frame.evaluate(() => new Promise(done => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else done(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(tick); }));
    const cost = await frame.evaluate(() => { const c = document.querySelector("canvas"); return c ? `${c.width}x${c.height}` : "none"; });
    console.log("fps", fps.toFixed(1), "canvas", cost);
  } });
