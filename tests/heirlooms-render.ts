// Draws every family heirloom with the game's Builder and depth sort (bundled by tests/heirlooms.mjs).
import { Builder, depthSort, fillPoly, project } from "../games/friend-nook/iso.js";
import { HEIRLOOMS } from "../games/friend-nook/heirlooms.js";
import { FX } from "../games/friend-nook/fx.js";
const W = 64, H = 58, SC = 8;
const c = document.createElement("canvas"); c.width = W * SC * 3; c.height = H * SC * 3; document.body.appendChild(c);
const g = c.getContext("2d")!; g.imageSmoothingEnabled = false; g.fillStyle = "#EFE3CC"; g.fillRect(0, 0, c.width, c.height);
(window as any).draw = (active: boolean) => {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#EFE3CC"; g.fillRect(0, 0, c.width, c.height);
  FX.t = 2.3; FX.acts = new Set(active ? HEIRLOOMS.map(h => h.action.id) : []);
  HEIRLOOMS.forEach((h, n) => {
    const ox = (n % 3) * W, oy = Math.floor(n / 3) * H;
    g.setTransform(SC, 0, 0, SC, (ox + W / 2) * SC, (oy + H * .6) * SC);
    // floor tile under it
    const P = (i: number, j: number) => project(i, j, 0);
    fillPoly(g, [...P(-.5, -.5), ...P(1.7, -.5), ...P(1.7, 1.2), ...P(-.5, 1.2)], "#D6B98C", false);
    const b = new Builder(); b.place("x", 0, 0, 0, 0, false); h.def.build(b); b.reset();
    for (const p of depthSort(b.parts)) { if (p.custom) { p.custom(g, p); continue; } for (const poly of p.polys) fillPoly(g, poly.pts, poly.fill, poly.stroke); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#3A2A1E"; g.font = "bold 26px monospace"; g.textAlign = "center"; g.fillText(h.def.name, (ox + W / 2) * SC, (oy + H - 6) * SC); g.font = "22px monospace"; g.fillStyle = "#8A5A3A"; g.fillText(h.family, (ox + W / 2) * SC, (oy + 8) * SC); g.textAlign = "left";
  });
};
