// Draws the furnished house once per family home, with the game's own shell, builders and depth sort (bundled by
// tests/homes.mjs). No Friend is drawn: this shows what each family's home looks like.
import { Builder, depthSort, fillPoly } from "../games/friend-nook/iso.js";
import { buildStructure, drawShell } from "../games/friend-nook/house.js";
import { buildPlaced, starterHouse } from "../games/friend-nook/furniture.js";
import { HEIRLOOM, HEIRLOOM_AT } from "../games/friend-nook/heirlooms.js";
import { HOMES } from "../games/friend-nook/homes.js";
import { FX } from "../games/friend-nook/fx.js";

const CW = 420, CH = 272, SC = 2, COLS = 3, families = Object.keys(HOMES);
const c = document.createElement("canvas"); c.width = CW * SC * COLS; c.height = CH * SC * Math.ceil(families.length / COLS); document.body.appendChild(c);
const g = c.getContext("2d")!; g.imageSmoothingEnabled = false;
(window as any).draw = (dark: number, weathers?: string[]) => {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#8FBF6A"; g.fillRect(0, 0, c.width, c.height);
  FX.t = 2.3; FX.acts = new Set(); FX.dark = dark;
  families.forEach((family, n) => {
    const ox = (n % COLS) * CW, oy = Math.floor(n / COLS) * CH;
    FX.home = HOMES[family];
    g.setTransform(SC, 0, 0, SC, (ox + CW / 2 - 18) * SC, (oy + 58) * SC);
    const night = dark > .5;
    drawShell(g, dark, { glass: night ? "#1E2A4A" : "#9FD3F0", stars: night, sun: !night, weather: (weathers?.[n] ?? "clear") as any, t: 1.7 + n });
    const b = new Builder(); buildStructure(b);
    const placed = starterHouse(); const h = HEIRLOOM[family];
    if (h) placed.push({ uid: "heirloom", def: h.def.id, i: HEIRLOOM_AT[0], j: HEIRLOOM_AT[1], swap: false });
    for (const p of placed) buildPlaced(b, p);
    for (const p of depthSort(b.parts)) { if (p.custom) { p.custom(g, p); continue; } for (const poly of p.polys) fillPoly(g, poly.pts, poly.fill, poly.stroke); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = "bold 26px monospace"; g.textAlign = "left"; g.textBaseline = "alphabetic";
    const label = `${HOMES[family].name} (${family})${weathers ? " · " + weathers[n] : ""}`, lw = g.measureText(label).width;
    g.fillStyle = "#FFF6E6"; g.fillRect((ox + 4) * SC, (oy + 3) * SC, lw + 8 * SC, 18 * SC); g.strokeStyle = "#2b1d14"; g.lineWidth = 3; g.strokeRect((ox + 4) * SC, (oy + 3) * SC, lw + 8 * SC, 18 * SC);
    g.fillStyle = "#2b1d14"; g.fillText(label, (ox + 8) * SC, (oy + 16) * SC);
  });
};
