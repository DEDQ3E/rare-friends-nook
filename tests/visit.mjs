// The front door: visit a simulated neighbour (FriendSDK's sample Friends, played by the game) in its whole house, in its
// family's style; your Friend walks over as the guest. Then back home, which must keep its own look. node tests/visit.mjs [out-dir]
import assert from "node:assert/strict";
import { testGame } from "@rarefriends/friendsdk/testing";
const out = process.argv[2] ?? "./tmp";
for (const [w, h, name] of [[1280, 800, "visit-desktop"], [844, 390, "visit-phone"]]) await testGame("./games/friend-nook", { width: w, height: h, timeout: 180000,
  check: async ({ page, game }) => {
    const errors = []; page.on("pageerror", e => errors.push(String(e)));
    await game.getByRole("button", { name: /Welcome home/ }).click();
    await game.getByRole("button", { name: "Got it" }).click({ timeout: 3000 }).catch(() => {});
    await game.getByRole("button", { name: "Zoom out" }).click(); await page.waitForTimeout(1300);
    const canvas = game.locator("canvas").first(), k = (await canvas.boundingBox()).width / 960;
    const at = (i, j, z) => ({ x: ((i - j) * 18 - 18 + 240) * 2 * k, y: ((i + j) * 9 - z - 88 + 160) * 2 * k });
    const item = game.getByRole("menuitem", { name: /Visit a neighbour/ });
    const door = async () => { for (const [i, j, z] of [[12.05, 4.5, 10], [12.05, 4.5, 4], [11.6, 4.5, 1], [12.05, 4.5, 16]]) { await canvas.click({ position: at(i, j, z) }); await page.waitForTimeout(500); if (await item.isVisible()) break; await page.keyboard.press("Escape"); } await item.click(); };
    await door();
    const list = game.locator("section[role=dialog]").filter({ hasText: "Neighbours" });
    await list.waitFor({ timeout: 30000 });
    const text = await list.innerText(); assert.match(text, /SIMULATED/i); assert.match(text, /not real players/);
    console.log(name, text.split("\n").filter(Boolean).slice(0, 6).join(" | "));
    await page.screenshot({ path: `${out}/${name}-list.png` });
    await game.getByRole("button", { name: /sample Friend #/ }).first().click();
    const scene = game.locator("section[role=dialog]").filter({ hasText: "simulated neighbour" });
    await scene.waitFor(); await page.waitForTimeout(4500); // the guest walks in from the front door
    for (const act of ["Hug", "Dance together"]) { await game.getByRole("button", { name: act }).click(); await page.waitForTimeout(1500); console.log(act, "→", await scene.locator(".fn-sub").innerText()); }
    await page.screenshot({ path: `${out}/${name}.png` });
    if (name === "visit-desktop") await scene.screenshot({ path: "./media/visit.png" }); // for the submission
    const drawn = await game.locator("canvas.fn-visit").evaluate(c => { const g = c.getContext("2d"), d = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 150) n++; return [c.width, c.height, n]; });
    assert.ok(drawn[2] > 1000, "the room is drawn"); console.log("canvas", drawn.join(" "));
    await game.getByRole("button", { name: "Go home" }).click();
    await page.waitForTimeout(700); await page.screenshot({ path: `${out}/${name}-home.png` }); // home keeps its own family look
    // a second visit: the neighbour remembers the first
    await door();
    const street = await game.locator("section[role=dialog]").filter({ hasText: "Neighbours" }).innerText();
    assert.match(street, /Best friend on the street: \S+ \(sample Friend #\d+\), 1 good moment together/); console.log(street.match(/Best friend[^\n]*/)[0]);
    await game.getByRole("button", { name: /sample Friend #/ }).first().click(); await scene.waitFor();
    const again = await scene.locator(".fn-sub").innerText(); console.log("again →", again); assert.match(again, /Visit 2. Last time/);
    await game.getByRole("button", { name: "Go home" }).click();
    await game.getByRole("button", { name: "Open your Friend's character card" }).click();
    const diary = await game.locator(".fn-diary li").allInnerTexts(); console.log(diary.slice(0, 3).join(" | "));
    assert.ok(diary.some(s => s.includes("simulated neighbour")));
    assert.deepEqual(errors, []);
  } });
console.log("ok");
