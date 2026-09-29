/** Weather seen through the windows. It changes every few in-game hours and the whole street shares it, so a visit
 * to a neighbour shows the same sky. Looks only: it never changes needs, prices or odds. */
export type Weather = "clear" | "clouds" | "rain" | "snow" | "storm";
export const WEATHER_LABEL: Readonly<Record<Weather, string>> = { clear: "Clear", clouds: "Cloudy", rain: "Rain", snow: "Snow", storm: "Storm" };

const SEED = Math.floor(Math.random() * 1e9); // one street per session (both houses read the same module)
const TABLE: readonly (readonly [Weather, number])[] = [["clear", 34], ["clouds", 26], ["rain", 22], ["snow", 12], ["storm", 6]];
const HOURS = 4;                              // the weather can change every 4 in-game hours

/** The weather at an in-game minute. */
export function weatherAt(minute: number): Weather {
  let h = (SEED ^ Math.imul(Math.floor(minute / (HOURS * 60)) + 1, 2654435761)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = (h ^ (h >>> 13)) >>> 0;
  let r = h % 100;
  for (const [w, p] of TABLE) { if (r < p) return w; r -= p; }
  return "clear";
}

/** Glass colour for the weather (the sky behind the rain and clouds). */
export function glassFor(base: string, w: Weather, night: boolean): string {
  if (night) return w === "storm" || w === "rain" ? "#161E36" : w === "snow" ? "#26304E" : base;
  return w === "rain" ? "#9DB2C6" : w === "storm" ? "#71819A" : w === "snow" ? "#C9D6E2" : w === "clouds" ? "#B4D2E6" : base;
}

type Rect = (a0: number, a1: number, h0: number, h1: number, c: string) => void;
/** Draw the weather inside a window's glass: [a0, a1] along its wall, [h0, h1] in height; t in seconds (0 = still). */
export function drawWeather(rect: Rect, a0: number, a1: number, h0: number, h1: number, w: Weather, t: number, night: boolean) {
  if (w === "clear") return;
  const W = a1 - a0, H = h1 - h0, PX = 1 / 18;
  const rnd = (n: number, k: number) => { const x = Math.sin(n * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const box = (x0: number, x1: number, y0: number, y1: number, c: string) => {
    const l = Math.max(a0, x0), r = Math.min(a1, x1), b = Math.max(h0, y0), tp = Math.min(h1, y1);
    if (r > l && tp > b) rect(l, r, b, tp, c);
  };
  // a lightning flash lights the whole pane for a moment
  if (w === "storm" && t > 0 && t % 6.5 < .14) { box(a0, a1, h0, h1, night ? "#8FA0C8" : "#EEF2FA"); }
  // clouds drift across the top of the pane
  const cloud = night ? "#3E4766" : w === "clouds" ? "#F2F5F8" : w === "snow" ? "#E4E9EF" : "#AEB7C4";
  for (let n = 0; n < (w === "clouds" ? 3 : 2); n++) {
    const span = W + .8, x = a0 - .4 + ((rnd(n, 1) * span + t * .04 * (1 + n * .4)) % span), y = h1 - 2.5 - n * 4;
    box(x, x + .42, y - 2, y, cloud); box(x + .08, x + .3, y, y + 1.6, cloud);
  }
  if (w === "rain" || w === "storm") { // streaks falling a little slanted
    const drops = w === "storm" ? 16 : 11, speed = w === "storm" ? 34 : 24, c = night ? "#6F83AA" : "#E4EEF8";
    for (let n = 0; n < drops; n++) {
      const x = a0 + rnd(n, 2) * W, y = h1 - ((rnd(n, 3) * H + t * speed) % H), len = w === "storm" ? 3.5 : 2.6;
      box(x, x + PX * .9, y - len, y, c); box(x - PX, x, y - len * 2, y - len, c);
    }
  }
  if (w === "snow") { // flakes drifting down
    for (let n = 0; n < 12; n++) {
      const y = h1 - ((rnd(n, 3) * H + t * 5) % H), x = a0 + rnd(n, 2) * W + Math.sin(t * 1.4 + n) * .05;
      box(x, x + PX * 1.3, y, y + 1.2, night ? "#C9D3E8" : "#FFFFFF");
    }
  }
}
