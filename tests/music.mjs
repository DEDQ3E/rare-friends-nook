// Records the game's own soundscape (games/friend-nook/audio.ts) to WAV files, one per music track, straight
// from its Web Audio graph in headless Chromium. Also prints the loudness of each, to keep the mix even.
// Needs (not in package.json): npm install --no-save playwright
// Run: node tests/music.mjs [seconds] [path/to/audio.ts] [out-dir] → tmp/music/*.wav
import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const seconds = Number(process.argv[2] ?? 20), source = resolve(process.argv[3] ?? "games/friend-nook/audio.ts"), dir = process.argv[4] ?? "tmp/music";
mkdirSync(dir, { recursive: true });
const { outputFiles } = await build({ entryPoints: [source], bundle: true, format: "iife", globalName: "Nook", write: false, logLevel: "error" });
const scenes = [["morning", 8, null], ["day", 14, null], ["evening", 19, null], ["night", 23, null], ["record", 14, "dance"], ["tv", 14, "tv"], ["piano", 19, "piano"]];

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
try {
  for (const [name, hour, act] of scenes) {
    const page = await browser.newPage();
    const errors = []; page.on("pageerror", e => errors.push(String(e)));
    await page.setContent("<!doctype html><title>music</title>");
    await page.addScriptTag({ content: outputFiles[0].text });
    const samples = await page.evaluate(async ({ seconds, hour, act }) => {
      // tap everything that reaches the speakers into a MediaRecorder (encoded off the main thread, so the
      // recording has no gaps while the scheduler is busy), then decode it back to samples
      let tap = null, rec = null; const parts = [];
      const connect = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function (dest, ...rest) {
        if (dest instanceof AudioDestinationNode) {
          if (!tap) { tap = dest.context.createMediaStreamDestination(); rec = new MediaRecorder(tap.stream, { audioBitsPerSecond: 256000 }); rec.ondataavailable = e => parts.push(e.data); rec.start(); }
          connect.call(this, tap, ...rest);
        }
        return connect.call(this, dest, ...rest);
      };
      const s = window.Nook.createSoundscape();
      s.setHour(hour); await s.unlock(); s.setMuted(false); if (act) s.setActivity(act);
      await new Promise(r => setTimeout(r, seconds * 1000));
      await new Promise(r => { rec.onstop = r; rec.stop(); });
      const ctx = new OfflineAudioContext(1, 1, 48000);
      const audio = await ctx.decodeAudioData(await new Blob(parts, { type: rec.mimeType }).arrayBuffer());
      s.dispose();
      const l = audio.getChannelData(0), r = audio.numberOfChannels > 1 ? audio.getChannelData(1) : l, all = new Float32Array(l.length);
      for (let i = 0; i < l.length; i++) all[i] = (l[i] + r[i]) / 2;
      return { rate: audio.sampleRate, data: Array.from(all) };
    }, { seconds, hour, act });
    const d = Float32Array.from(samples.data);
    let sum = 0, peak = 0; for (const v of d) { sum += v * v; peak = Math.max(peak, Math.abs(v)); }
    // 16-bit mono WAV
    const buf = Buffer.alloc(44 + d.length * 2);
    buf.write("RIFF", 0); buf.writeUInt32LE(36 + d.length * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
    buf.writeUInt32LE(samples.rate, 24); buf.writeUInt32LE(samples.rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(d.length * 2, 40);
    d.forEach((v, i) => buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), 44 + i * 2));
    writeFileSync(`${dir}/${name}.wav`, buf);
    console.log(name.padEnd(8), "seconds", (d.length / samples.rate).toFixed(1), "rms", Math.sqrt(sum / d.length).toFixed(4), "peak", peak.toFixed(3), errors.length ? "ERRORS " + errors.join("; ") : "");
    await page.close();
  }
} finally { await browser.close(); }
