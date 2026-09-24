/** Procedural sound for Friend Nook (Web Audio, synthesized in code: no recordings or samples).
 *
 * - Music: composed eight-bar tunes, one per time of day, each with its own band, all FM or subtractive synths:
 *   morning marimba and shaker, a swinging vibraphone-and-Rhodes afternoon with brushes and upright bass,
 *   a lo-fi Rhodes evening with vinyl crackle, a music-box lullaby in 3/4 at night, and a disco-funk record for
 *   dancing. Melodies vary on repeats and rest every third time round. Music ducks under the TV and games and
 *   softens while the Friend sleeps.
 * - Ambience: finches and a dove through the window by day, an owl and chirring insects at night.
 * - Activities: TV chatter and jingles, video-game and arcade bleeps, bath water and bubbles, running tap,
 *   sizzling pan, crunchy snacks, cutlery, toy squeaks, piano, page flips, brush strokes, aquarium bubbles,
 *   twinkles, snoring, ball bounces. Piano, twinkles, chimes and humming take their notes from the chord the
 *   music is playing, so they always fit.
 * - Footsteps by floor (wood, carpet, tile) and the Friend's voice: speech is voiced as a babble of syllables
 *   whose pitch and timbre come from its family (and how expressive, from its generation).
 *
 * Nothing plays until unlock() runs from a player gesture. Muted, paused or hidden → the context is suspended. */

export type Surface = "wood" | "carpet" | "tile";
export type Voice = Readonly<{ base: number; wave: OscillatorType; spread: number; speed: number }>;

type Note = readonly [pos: number, note: number, len: number];
type Lead = "marimba" | "vibes" | "rhodes" | "musicbox" | "synth";
type Track = Readonly<{
  bpm: number; meter: 3 | 4; swing: number;           // swing: how late the off-beat eighth lands, in beats
  chords: readonly (readonly number[])[];             // one voicing per bar
  roots: readonly number[];                           // bass root per bar
  melody: readonly (readonly Note[])[];               // one phrase per bar
  lead: Lead; comp: "rhodes" | "clav"; hits: readonly (readonly [number, number])[];
  bass: "upright" | "soft" | "disco"; line: readonly (readonly [number, number, number])[]; // [pos, semitones or APPROACH, len]
  drums: "shaker" | "brush" | "lofi" | "disco" | "none"; crackle: boolean; rests: boolean;
  lv: Readonly<{ lead: number; comp: number; bass: number; drums: number }>;
}>;
const APPROACH = 99; // a chromatic step into the next bar's root
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

const TRACKS: Readonly<Record<string, Track>> = {
  // F major, bright and bouncy: marimba over soft Rhodes, shaker and a light kick
  morning: {
    bpm: 104, meter: 4, swing: .06, lead: "marimba", comp: "rhodes", bass: "upright", drums: "shaker", crackle: false, rests: true,
    chords: [[53, 57, 60, 64], [50, 57, 60, 65], [55, 58, 62, 65], [52, 55, 58, 64], [53, 57, 60, 64], [52, 55, 60, 64], [53, 57, 58, 62], [52, 55, 58, 64]],
    roots: [41, 38, 43, 36, 41, 45, 46, 36],
    melody: [
      [[0, 72, .5], [.5, 76, .5], [1, 77, 1], [2.5, 76, .5], [3, 72, 1]],
      [[0, 74, .5], [.5, 77, .5], [1, 81, 1.5], [3, 79, .5], [3.5, 77, .5]],
      [[0, 79, 1], [1, 77, .5], [1.5, 74, .5], [2, 70, 1], [3, 72, 1]],
      [[0, 76, 1.5], [2, 79, .5], [2.5, 76, .5], [3, 72, 1]],
      [[0, 77, .5], [.5, 81, .5], [1, 84, 1], [2.5, 81, .5], [3, 79, 1]],
      [[0, 76, 1], [1, 72, .5], [1.5, 76, .5], [2, 79, 1.5]],
      [[0, 77, .5], [.5, 74, .5], [1, 70, 1], [2, 74, .5], [2.5, 77, .5], [3, 81, 1]],
      [[0, 79, 2], [2.5, 76, .5], [3, 72, .5]],
    ],
    hits: [[0, 2], [2.5, 1.5]], line: [[0, 0, 1.5], [2, 7, 1], [3, 12, .5], [3.5, APPROACH, .5]],
    lv: { lead: .075, comp: .014, bass: .09, drums: 1 },
  },
  // Bb major, a lazy jazz swing: vibraphone melody, Rhodes comping, walking upright bass, brushes
  day: {
    bpm: 90, meter: 4, swing: .16, lead: "vibes", comp: "rhodes", bass: "upright", drums: "brush", crackle: false, rests: true,
    chords: [[55, 58, 62, 65], [53, 57, 60, 64], [51, 55, 58, 62], [51, 57, 60, 62], [50, 53, 57, 60], [53, 57, 58, 62], [51, 55, 58, 62], [51, 57, 60, 62]],
    roots: [39, 38, 36, 41, 46, 43, 36, 41],
    melody: [
      [[.5, 74, .5], [1, 75, .5], [1.5, 79, 1.5], [3.5, 77, .5]],
      [[0, 77, 1], [1, 74, .5], [1.5, 72, .5], [2, 69, 1.5]],
      [[.5, 70, .5], [1, 72, .5], [1.5, 75, 1], [2.5, 74, .5], [3, 72, 1]],
      [[0, 69, 1.5], [2, 72, .5], [2.5, 75, .5], [3, 74, 1]],
      [[0, 74, .5], [.5, 77, .5], [1, 81, 1.5], [3, 79, .5], [3.5, 77, .5]],
      [[0, 79, 1], [1, 74, 1], [2.5, 77, .5], [3, 74, 1]],
      [[0, 75, .5], [.5, 74, .5], [1, 72, 1], [2, 70, .5], [2.5, 72, .5], [3, 75, 1]],
      [[0, 77, 2], [2.5, 75, .5], [3, 72, 1]],
    ],
    hits: [[0, 1], [1.5, .5], [2.5, 1.5]], line: [[0, 0, 1], [1, 7, 1], [2, 12, 1], [3, APPROACH, 1]],
    lv: { lead: .06, comp: .013, bass: .1, drums: 1 },
  },
  // D minor, slow lo-fi: Rhodes chords and melody, dusty kick and snare, vinyl crackle
  evening: {
    bpm: 74, meter: 4, swing: .12, lead: "rhodes", comp: "rhodes", bass: "upright", drums: "lofi", crackle: true, rests: true,
    chords: [[53, 57, 58, 62], [52, 55, 58, 62], [52, 57, 60, 64], [53, 57, 58, 62], [52, 55, 58, 62], [49, 55, 59, 64], [53, 57, 60, 64], [49, 55, 59, 64]],
    roots: [43, 36, 41, 46, 40, 45, 38, 45],
    melody: [
      [[0, 81, 1.5], [1.5, 79, .5], [2, 77, 1], [3, 74, 1]],
      [[0, 76, 1], [1, 79, 1], [2, 82, 2]],
      [[0, 81, 2], [2.5, 77, .5], [3, 76, 1]],
      [[0, 74, 1.5], [1.5, 77, .5], [2, 81, 2]],
      [[0, 79, 1], [1, 77, 1], [2, 74, .5], [2.5, 76, .5], [3, 77, 1]],
      [[0, 76, 1.5], [1.5, 73, .5], [2, 76, 1], [3, 79, 1]],
      [[0, 77, 1], [1, 76, .5], [1.5, 74, 2.5]],
      [[2, 69, .5], [2.5, 73, .5], [3, 76, 1]],
    ],
    hits: [[0, 3.5]], line: [[0, 0, 1.5], [2, 7, 1], [3, APPROACH, 1]],
    lv: { lead: .065, comp: .016, bass: .1, drums: 1.1 },
  },
  // E major lullaby in 3/4: a music box over a quiet Rhodes waltz, no drums
  night: {
    bpm: 80, meter: 3, swing: 0, lead: "musicbox", comp: "rhodes", bass: "soft", drums: "none", crackle: false, rests: false,
    chords: [[56, 59, 64], [56, 61, 64], [57, 61, 64], [54, 57, 63], [56, 59, 64], [56, 59, 63], [57, 61, 64], [54, 57, 63]],
    roots: [40, 37, 45, 47, 40, 44, 45, 47],
    melody: [
      [[0, 80, 1], [1, 83, 1], [2, 88, 1]],
      [[0, 85, 2], [2, 83, 1]],
      [[0, 81, 1], [1, 85, 1], [2, 88, 1]],
      [[0, 87, 2], [2, 83, 1]],
      [[0, 88, 1], [1, 87, 1], [2, 85, 1]],
      [[0, 83, 2], [2, 80, 1]],
      [[0, 81, 1], [1, 80, 1], [2, 78, 1]],
      [[0, 78, 1.5], [1.5, 80, .5], [2, 78, 1]],
    ],
    hits: [[1, .9], [2, .9]], line: [[0, 0, 2.5]],
    lv: { lead: .08, comp: .013, bass: .08, drums: 0 },
  },
  // G minor disco-funk on the record player: octave bass, four on the floor, clav stabs, a synth riff
  record: {
    bpm: 118, meter: 4, swing: 0, lead: "synth", comp: "clav", bass: "disco", drums: "disco", crackle: true, rests: true,
    chords: [[55, 58, 62, 65], [52, 58, 62, 64], [55, 58, 62, 63], [54, 57, 60, 64]],
    roots: [43, 36, 39, 38],
    melody: [
      [[0, 79, .5], [.5, 77, .5], [1, 74, .5], [1.5, 77, 1], [3, 79, .5], [3.5, 82, .5]],
      [[0, 79, 1], [1.5, 76, .5], [2, 74, .5], [2.5, 72, 1]],
      [[0, 74, .5], [.5, 75, .5], [1, 79, 1], [2.5, 82, .5], [3, 79, 1]],
      [[0, 78, 1.5], [2, 74, .5], [2.5, 72, .5], [3, 74, 1]],
    ],
    hits: [[.5, .25], [1.5, .25], [2.5, .25], [3.5, .25]],
    line: [[0, 0, .4], [.5, 12, .4], [1, 0, .4], [1.5, 12, .4], [2, 0, .4], [2.5, 12, .4], [3, 0, .4], [3.5, APPROACH, .4]],
    lv: { lead: .04, comp: .024, bass: .09, drums: 1.3 },
  },
};

/** Sounds of each activity: a loop (runs while the activity lasts) and/or a sound every few seconds. */
type Loop = "tv" | "games" | "arcade" | "bath" | "tap" | "sizzle" | "none";
const ACTIVITY: Readonly<Record<string, { loop?: Loop; every?: number; one?: string; duck?: number; music?: "record" | "soft" }>> = {
  tv: { loop: "tv", duck: .35 }, games: { loop: "games", duck: .35 }, arcade: { loop: "arcade", duck: .4 },
  bath: { loop: "bath", every: .7, one: "bubble" }, wash: { loop: "tap" }, cook: { loop: "sizzle", every: 1.1, one: "bubble" },
  snack: { every: .5, one: "crunch" }, bar: { every: .6, one: "crunch" }, dinner: { every: .9, one: "clink" },
  dance: { music: "record" }, piano: { every: .32, one: "piano", duck: .4 }, toys: { every: .8, one: "squeak" },
  read: { every: 3.2, one: "page" }, book: { every: 1.6, one: "page" }, paint: { every: .9, one: "brush" },
  fish: { every: 1.2, one: "bubble" }, primp: { every: 1, one: "twinkle" }, admire: { every: 1.2, one: "twinkle" },
  stargaze: { every: 1.6, one: "twinkle" }, telescope: { every: 1.3, one: "twinkle" }, daydream: { every: 2.5, one: "twinkle" },
  sleep: { every: 3.4, one: "snore", music: "soft" }, nap: { every: 3.4, one: "snore", music: "soft" },
  ball: { every: .55, one: "bounce" }, dress: { every: 1, one: "rustle" }, keepsakes: { every: 1.5, one: "twinkle" },
  sit: {}, lounge: {}, talk: {}, pet: {}, gift: {},
  // family heirlooms
  xylo: { every: .28, one: "xylo", duck: .5 }, mask: { every: 1.1, one: "rustle" }, photos: { every: 2.6, one: "chime" },
  cells: { every: .8, one: "bubble" }, tower: { every: .6, one: "block" }, cloud: { every: 2.2, one: "twinkle", music: "soft" },
  boulder: {}, mirrorball: { music: "record" }, lantern: { every: 3, one: "twinkle", music: "soft" },
};

export function createSoundscape() {
  let ctx: AudioContext | null = null;
  let master!: GainNode, musicBus!: GainNode, verbSend!: GainNode, ambBus!: GainNode, sfxBus!: GainNode;
  let white!: AudioBuffer, brown!: AudioBuffer;
  let muted = true, paused = false, hidden = false, musicOn = true, volume = .8;
  let hour = 8, activity: string | null = null, timer = 0, nextOne = 0, nextAmb = 0, nextOwl = 0;
  type Playing = { key: string; track: Track; gain: GainNode; nextBar: number; bar: number; dying: boolean };
  let playing: Playing[] = [];
  let loopNodes: { stop: () => void } | null = null;
  let pianoStep = 0;

  /* ---------- building blocks ---------- */
  function noise(c: AudioContext, kind: "white" | "brown") {
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (kind === "white") d[i] = w; else { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } }
    return buf;
  }
  function room(c: AudioContext, seconds: number) {
    const len = Math.floor(c.sampleRate * seconds), buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-5 * i / len) * (i < 200 ? i / 200 : 1); }
    return buf;
  }
  function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + attack + decay);
  }
  function tone(t: number, f: number, dur: number, peak: number, out: AudioNode, type: OscillatorType = "sine", toF?: number, attack = .008) {
    const c = ctx!, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (toF) o.frequency.exponentialRampToValueAtTime(toF, t + dur);
    env(g, t, peak, attack, dur); o.connect(g).connect(out); o.start(t); o.stop(t + attack + dur + .05);
  }
  function burst(t: number, dur: number, peak: number, out: AudioNode, type: BiquadFilterType, f: number, q = 1, buf = white, rate = 1, attack = .004) {
    const c = ctx!, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; s.playbackRate.value = rate; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    env(g, t, peak, attack, dur); s.connect(fl).connect(g).connect(out); s.start(t, Math.random() * 1.5); s.stop(t + attack + dur + .05);
  }
  /** Two-operator FM: a sine carrier whose pitch is wobbled by a modulator; the wobble fades for a bell or e-piano bark. */
  function fm(t: number, f: number, dur: number, peak: number, out: AudioNode, ratio: number, index: number, fade: number, attack = .01) {
    const c = ctx!, car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain();
    car.frequency.value = f; mod.frequency.value = f * ratio;
    mg.gain.setValueAtTime(f * index, t); mg.gain.exponentialRampToValueAtTime(Math.max(.5, f * index * .04), t + fade);
    mod.connect(mg).connect(car.frequency);
    env(g, t, peak, attack, dur); car.connect(g).connect(out);
    const end = t + attack + dur + .05; car.start(t); mod.start(t); car.stop(end); mod.stop(end);
  }

  /* ---------- instruments ---------- */
  const rhodes = (t: number, n: number, dur: number, v: number, out: AudioNode) => fm(t, midi(n), Math.max(.3, dur), v, out, 1, 1.1, .3, .014);
  const piano = (t: number, n: number, v: number, out: AudioNode) => { fm(t, midi(n), 1.1, v, out, 1, .8, .12, .008); tone(t, midi(n) * 2, .35, v * .25, out, "sine", undefined, .008); };
  const musicbox = (t: number, n: number, v: number, out: AudioNode) => { fm(t, midi(n), 1.5, v, out, 4, .3, .05, .008); tone(t, midi(n) * 2, .4, v * .22, out, "sine", undefined, .008); };
  const marimba = (t: number, n: number, v: number, out: AudioNode) => { tone(t, midi(n), .45, v, out, "sine", undefined, .006); tone(t, midi(n) * 4, .05, v * .3, out, "sine", undefined, .005); };
  function vibes(t: number, n: number, dur: number, v: number, out: AudioNode) {
    const c = ctx!, o = c.createOscillator(), g = c.createGain(), trem = c.createGain(), lfo = c.createOscillator(), depth = c.createGain();
    o.frequency.value = midi(n); lfo.frequency.value = 5.2; depth.gain.value = .35; trem.gain.value = .75;
    env(g, t, v, .008, Math.max(.6, dur * 1.4)); lfo.connect(depth).connect(trem.gain); o.connect(g).connect(trem).connect(out);
    const end = t + Math.max(.6, dur * 1.4) + .1; o.start(t); lfo.start(t); o.stop(end); lfo.stop(end);
    tone(t, midi(n) * 4, .1, v * .15, out, "sine", undefined, .006);
  }
  function synth(t: number, n: number, dur: number, v: number, out: AudioNode) {
    const c = ctx!, lp = c.createBiquadFilter(), g = c.createGain();
    lp.type = "lowpass"; lp.Q.value = 3; lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(700, t + Math.max(.15, dur));
    env(g, t, v, .01, Math.max(.12, dur)); lp.connect(g).connect(out);
    for (const [type, det] of [["square", 0], ["sawtooth", 8]] as const) { const o = c.createOscillator(); o.type = type; o.frequency.value = midi(n); o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + .1); }
  }
  function clav(t: number, notes: readonly number[], v: number, out: AudioNode) {
    const c = ctx!, bp = c.createBiquadFilter(), g = c.createGain(); bp.type = "bandpass"; bp.frequency.value = 1400; bp.Q.value = 1.4;
    env(g, t, v, .003, .13); bp.connect(g).connect(out);
    for (const n of notes.slice(1)) { const o = c.createOscillator(); o.type = "square"; o.frequency.value = midi(n); o.connect(bp); o.start(t); o.stop(t + .2); }
  }
  function bass(kind: Track["bass"], t: number, n: number, dur: number, v: number, out: AudioNode) {
    const c = ctx!, f = midi(n);
    if (kind === "soft") { tone(t, f, dur, v, out, "sine", undefined, .05); return; }
    const lp = c.createBiquadFilter(), g = c.createGain(), o = c.createOscillator();
    lp.type = "lowpass"; lp.Q.value = kind === "disco" ? 5 : .8;
    lp.frequency.setValueAtTime(kind === "disco" ? 900 : 1100, t); lp.frequency.exponentialRampToValueAtTime(kind === "disco" ? 320 : 260, t + .14);
    o.type = kind === "disco" ? "sawtooth" : "triangle"; o.frequency.value = f;
    env(g, t, v, kind === "disco" ? .005 : .012, Math.min(dur, .9)); o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + dur + .1);
    if (kind === "upright") tone(t, f, Math.min(dur, .7), v * .5, out, "sine", undefined, .015);
  }
  const drum = {
    kick: (t: number, v: number, out: AudioNode, hard = false) => { tone(t, hard ? 150 : 105, .2, v, out, "sine", 44, .002); if (hard) burst(t, .01, v * .3, out, "highpass", 3000); },
    brush: (t: number, v: number, out: AudioNode) => burst(t, .16, v, out, "bandpass", 3800, .5, white, 1, .02),
    snare: (t: number, v: number, out: AudioNode) => { burst(t, .13, v, out, "bandpass", 1900, .9); tone(t, 200, .06, v * .6, out, "triangle", 140, .002); },
    clap: (t: number, v: number, out: AudioNode) => { for (let n = 0; n < 3; n++) burst(t + n * .011, n === 2 ? .14 : .02, v, out, "bandpass", 1500, 1.2); },
    hat: (t: number, v: number, out: AudioNode, open = false) => burst(t, open ? .16 : .03, v, out, "highpass", 8000),
    shaker: (t: number, v: number, out: AudioNode) => burst(t, .05, v, out, "bandpass", 6500, 1.5, white, 1, .012),
  };

  /* ---------- music ---------- */
  function scheduleBar(p: Playing, T: number) {
    const tr = p.track, spb = 60 / tr.bpm, len = tr.chords.length, i = p.bar % len, pass = Math.floor(p.bar / len), out = p.gain;
    const human = tr.drums === "disco" ? 0 : .008;
    const at = (pos: number) => T + (Math.abs(pos % 1 - .5) < 1e-6 ? pos + tr.swing : pos) * spb + (Math.random() - .5) * human;
    const vel = (v: number) => v * (.85 + Math.random() * .3);
    const chord = tr.chords[i], root = tr.roots[i];
    // comping
    for (const [pos, l] of tr.hits) {
      if (tr.comp === "clav") clav(at(pos), chord, vel(tr.lv.comp), out);
      else chord.forEach((n, k) => rhodes(at(pos) + k * .012, n, l * spb, vel(tr.lv.comp), out)); // a slight strum
    }
    // bass
    for (const [pos, semi, l] of tr.line) {
      let n = root + semi;
      if (semi === APPROACH) { n = tr.roots[(i + 1) % len] - 1; while (n - root > 7) n -= 12; while (root - n > 7) n += 12; }
      bass(tr.bass, at(pos), n, l * spb, vel(tr.lv.bass), out);
    }
    // melody: exact the first time, varied on repeats, resting every third time round
    if (!(tr.rests && pass % 3 === 2)) for (const [pos, n, l] of tr.melody[i]) {
      if (pass % 2 === 1 && Math.random() < .15) continue;
      if (pass % 2 === 1 && pos >= .5 && Math.random() < .12) lead(tr.lead, at(pos - .25), n - (tr.swing ? 1 : 2), .2 * spb, vel(tr.lv.lead) * .7, out);
      lead(tr.lead, at(pos), n, l * spb, vel(tr.lv.lead), out);
    }
    // drums
    const d = tr.lv.drums, beats = tr.meter;
    for (let b = 0; b < beats; b++) for (const half of [0, .5]) {
      const pos = b + half, t = at(pos);
      switch (tr.drums) {
        case "shaker": drum.shaker(t, vel(half ? .012 : .02) * d, out); if (pos === 0 || pos === 2.5) drum.kick(t, .07 * d, out); break;
        case "brush": if (!half && (b === 1 || b === 3)) drum.brush(t, .05 * d, out); if (pos === 0 || pos === 2.5) drum.kick(t, .06 * d, out); if (pos !== .5 && pos !== 2.5) drum.hat(t, vel(.009) * d, out); break;
        case "lofi": if (pos === 0 || pos === 2.5) drum.kick(t, .09 * d, out); if (!half && (b === 1 || b === 3)) drum.snare(t, .05 * d, out); drum.hat(t, vel(.007) * d, out); break;
        case "disco": if (!half) drum.kick(t, .1 * d, out, true); if (!half && (b === 1 || b === 3)) drum.clap(t, .05 * d, out); if (half) drum.hat(t, .016 * d, out, true); break;
      }
    }
    if (tr.crackle) for (let n = 0; n < 7; n++) burst(T + Math.random() * beats * spb, .004, .006 + Math.random() * .014, out, "highpass", 2500 + Math.random() * 3500, .7, white, 1, .001);
  }
  function lead(kind: Lead, t: number, n: number, dur: number, v: number, out: AudioNode) {
    if (kind === "marimba") marimba(t, n, v, out);
    else if (kind === "vibes") vibes(t, n, dur, v, out);
    else if (kind === "rhodes") rhodes(t, n, dur * 1.2, v, out);
    else if (kind === "musicbox") musicbox(t, n, v, out);
    else synth(t, n, dur * .9, v, out);
  }
  function scheduleMusic(until: number) {
    for (const p of playing) {
      const barLen = 60 / p.track.bpm * p.track.meter;
      while (p.nextBar < until) { scheduleBar(p, p.nextBar); p.nextBar += barLen; p.bar++; }
    }
  }
  /** The chord the music is on right now (instruments and one-shots pick their notes from it). */
  function chordNow(): readonly number[] {
    const p = playing.find(x => !x.dying);
    if (!p || !ctx) return [60, 64, 67, 71];
    const barLen = 60 / p.track.bpm * p.track.meter, back = Math.ceil(Math.max(0, p.nextBar - ctx.currentTime) / barLen);
    return p.track.chords[((p.bar - back) % p.track.chords.length + p.track.chords.length) % p.track.chords.length];
  }
  const trackKey = () => {
    const a = activity ? ACTIVITY[activity] : undefined;
    if (a?.music === "record") return "record";
    return hour >= 5 && hour < 11 ? "morning" : hour >= 11 && hour < 18 ? "day" : hour >= 18 && hour < 21 ? "evening" : "night";
  };
  function syncMusic() {
    if (!ctx) return;
    const key = musicOn ? trackKey() : "", now = ctx.currentTime, a = activity ? ACTIVITY[activity] : undefined;
    const level = (a?.duck ?? 1) * (a?.music === "soft" ? .5 : 1);
    for (const p of playing) if (p.key !== key && !p.dying) { p.dying = true; p.gain.gain.cancelScheduledValues(now); p.gain.gain.setValueAtTime(p.gain.gain.value, now); p.gain.gain.linearRampToValueAtTime(0, now + 2); }
    const live = playing.find(p => p.key === key && !p.dying);
    if (key && !live) {
      const g = ctx.createGain(); g.gain.value = 0; g.connect(musicBus); g.connect(verbSend); g.gain.linearRampToValueAtTime(level, now + 2.5);
      playing.push({ key, track: TRACKS[key], gain: g, nextBar: now + .1, bar: 0, dying: false });
    } else if (live) { live.gain.gain.cancelScheduledValues(now); live.gain.gain.setValueAtTime(live.gain.gain.value, now); live.gain.gain.linearRampToValueAtTime(level, now + .8); }
    // a fading track keeps sounding its last scheduled bar (up to about 3 s), then leaves the graph
    window.setTimeout(() => { playing = playing.filter(p => { if (p.dying && ctx && p.gain.gain.value < .01) { p.gain.disconnect(); return false; } return true; }); }, 4200);
  }

  /* ---------- activity loops ---------- */
  function startLoop(kind: Loop) {
    stopLoop(); if (!ctx || kind === "none") return;
    const c = ctx, out = c.createGain(); out.gain.value = 0; out.gain.linearRampToValueAtTime(1, c.currentTime + .4); out.connect(sfxBus);
    const nodes: AudioScheduledSourceNode[] = [];
    const src = (buf: AudioBuffer, type: BiquadFilterType, f: number, q: number, gain: number, lfoRate = 0, lfoDepth = 0) => {
      const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
      s.buffer = buf; s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = gain;
      s.connect(fl).connect(g).connect(out); s.start(); nodes.push(s);
      if (lfoRate) { const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = lfoRate; lg.gain.value = lfoDepth; lfo.connect(lg).connect(g.gain); lfo.start(); nodes.push(lfo); }
    };
    if (kind === "tv") src(white, "bandpass", 1100, 1.2, .035, 3.3, .03);
    if (kind === "bath") src(brown, "lowpass", 700, .7, .12, .6, .06);
    if (kind === "tap") src(white, "bandpass", 3200, .8, .06);
    if (kind === "sizzle") src(white, "highpass", 5200, .7, .03, 7, .02);
    let alive = true;
    // melodic loops: TV chatter and jingles, 8-bit game bleeps
    const blip = () => {
      if (!alive || !ctx) return;
      const t = ctx.currentTime + .02;
      if (kind === "tv") { if (Math.random() < .7) tone(t, 220 + Math.random() * 260, .09, .03, out, "sawtooth", 180 + Math.random() * 200); else marimba(t, 72 + [0, 4, 7, 12][Math.floor(Math.random() * 4)], .04, out); }
      if (kind === "games" || kind === "arcade") { const n = 72 + [0, 3, 7, 10, 12, 15][Math.floor(Math.random() * 6)]; tone(t, midi(n), .07, kind === "arcade" ? .04 : .03, out, "square"); if (Math.random() < .15) tone(t + .08, 300, .14, .03, out, "square", 900); }
      window.setTimeout(blip, kind === "tv" ? 140 + Math.random() * 180 : 110 + Math.random() * 90);
    };
    if (kind === "tv" || kind === "games" || kind === "arcade") blip();
    loopNodes = { stop: () => { alive = false; const now = c.currentTime; out.gain.cancelScheduledValues(now); out.gain.setValueAtTime(out.gain.value, now); out.gain.linearRampToValueAtTime(0, now + .3); window.setTimeout(() => { for (const n of nodes) try { n.stop(); } catch { /* already stopped */ } out.disconnect(); }, 400); } };
  }
  function stopLoop() { loopNodes?.stop(); loopNodes = null; }

  /* ---------- one-shots ---------- */
  function one(name: string, level = 1) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + .01, o = sfxBus, L = level, ch = chordNow(), from = (list: readonly number[]) => list[Math.floor(Math.random() * list.length)];
    switch (name) {
      case "bubble": tone(t, 380 + Math.random() * 300, .08, .05 * L, o, "sine", 900 + Math.random() * 400); break;
      case "crunch": for (let n = 0; n < 3; n++) burst(t + n * .05, .04, .08 * L, o, "bandpass", 1800 + Math.random() * 1500, 2); break;
      case "clink": fm(t, 2300 + Math.random() * 500, .3, .025 * L, o, 2.76, .4, .05, .001); burst(t + .2, .06, .04 * L, o, "bandpass", 900, 2, brown); break;
      case "piano": { // a little tune up and down the current chord
        const notes = ch.map(n => n + 12), k = pianoStep++ % (notes.length * 2 - 2), idx = k < notes.length ? k : notes.length * 2 - 2 - k;
        piano(t, notes[idx], .06 * L, o); if (Math.random() < .2) piano(t, notes[0] - 12, .04 * L, o); break;
      }
      case "squeak": tone(t, 900, .12, .05 * L, o, "sine", 1500 + Math.random() * 500); break;
      case "page": burst(t, .12, .05 * L, o, "highpass", 3000, .7); break;
      case "brush": burst(t, .18, .04 * L, o, "bandpass", 2500, .9); break;
      case "twinkle": for (let n = 0; n < 3; n++) musicbox(t + n * .08, from(ch) + 24, .02 * L, o); break;
      case "snore": burst(t, 1.1, .05 * L, o, "lowpass", 380, 2, brown, .7); break;
      case "bounce": tone(t, 180, .12, .09 * L, o, "sine", 70); break;
      case "rustle": burst(t, .25, .04 * L, o, "bandpass", 1600, .8); break;
      case "puff": burst(t, .3, .06 * L, o, "lowpass", 500, .7, brown); break;
      case "hum": { const f = midi(from(ch) + 12); tone(t, f, .32, .025 * L, o, "triangle", f * (Math.random() < .5 ? 1.06 : .95), .04); break; }
      case "chime": musicbox(t, ch[1] + 24, .05 * L, o); musicbox(t + .12, ch[ch.length - 1] + 24, .05 * L, o); break;
      case "xylo": { // a bone xylophone: dry marimba notes walking the current chord
        const notes = ch.map(n => n + 24), k = pianoStep++ % (notes.length * 2 - 2), idx = k < notes.length ? k : notes.length * 2 - 2 - k;
        marimba(t, notes[idx], .06 * L, o); burst(t, .012, .03 * L, o, "bandpass", 2600, 3, white, 1, .001); break;
      }
      case "block": tone(t, 520 + Math.random() * 180, .06, .05 * L, o, "triangle", 380, .002); burst(t, .02, .03 * L, o, "bandpass", 1800, 2, white, 1, .001); break;
    }
  }
  function ambience() {
    if (!ctx || muted) return;
    const t = ctx.currentTime + .02, night = hour >= 21 || hour < 6;
    if (night) {
      // chirring insects: a quick train of narrow noise pulses
      const f = 4600 + Math.random() * 900, pulses = 5 + Math.floor(Math.random() * 5);
      for (let n = 0; n < pulses; n++) burst(t + n * .022, .012, .012, ambBus, "bandpass", f, 14, white, 1, .002);
      // now and then an owl: two soft hoots, the second lower
      if (ctx.currentTime >= nextOwl) { nextOwl = ctx.currentTime + 14 + Math.random() * 16; for (const [k, f0] of [[0, 392], [.55, 370], [.95, 349]] as const) tone(t + .6 + k, f0, .32, .02, ambBus, "sine", f0 * .93, .08); }
    } else if (hour >= 6 && hour < 19) {
      if (Math.random() < .75) { // a finch's trill
        const f = 3000 + Math.random() * 1400, notes = 4 + Math.floor(Math.random() * 5);
        for (let n = 0; n < notes; n++) fm(t + n * .055, f * (n % 2 ? 1.12 : 1), .04, .009, ambBus, 2, .3, .03, .003);
      } else { // a dove, far away
        for (const [k, f0] of [[0, 560], [.35, 610], [.7, 520]] as const) tone(t + k, f0, .28, .008, ambBus, "sine", f0 * .9, .06);
      }
    }
  }
  function tick() {
    if (!ctx) return;
    const now = ctx.currentTime;
    scheduleMusic(now + .6);
    const a = activity ? ACTIVITY[activity] : undefined;
    if (a?.every && a.one && now >= nextOne) { nextOne = now + a.every * (.7 + Math.random() * .6); one(a.one); }
    if (now >= nextAmb) { nextAmb = now + (hour >= 21 || hour < 6 ? 1.4 + Math.random() * 1.2 : 3 + Math.random() * 4); ambience(); }
  }
  function suspendIfNeeded() {
    if (!ctx) return;
    if (muted || paused || hidden) void ctx.suspend(); else void ctx.resume();
  }
  const onVisibility = () => { hidden = document.hidden; suspendIfNeeded(); };

  return {
    /** Create the audio graph (call from a player gesture). */
    async unlock() {
      if (!ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        ctx = new Ctor();
        master = ctx.createGain(); master.gain.value = volume; master.connect(ctx.destination);
        const warm = ctx.createBiquadFilter(); warm.type = "lowpass"; warm.frequency.value = 6500; warm.connect(master);
        musicBus = ctx.createGain(); musicBus.gain.value = .9; musicBus.connect(warm);
        const verb = ctx.createConvolver(); verb.buffer = room(ctx, 1.4); verbSend = ctx.createGain(); verbSend.gain.value = .18; verbSend.connect(verb); verb.connect(warm);
        ambBus = ctx.createGain(); ambBus.gain.value = 1; ambBus.connect(master);
        sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
        white = noise(ctx, "white"); brown = noise(ctx, "brown");
        document.addEventListener("visibilitychange", onVisibility);
        timer = window.setInterval(tick, 120);
        syncMusic(); setActivityNow(activity);
      }
      suspendIfNeeded();
    },
    setMuted(v: boolean) { muted = v; suspendIfNeeded(); },
    setPaused(v: boolean) { paused = v; suspendIfNeeded(); },
    setVolume(v: number) { volume = v; if (ctx) master.gain.setTargetAtTime(v, ctx.currentTime, .05); },
    setMusic(on: boolean) { musicOn = on; syncMusic(); },
    setHour(h: number) { if (h !== hour) { const before = trackKey(); hour = h; if (trackKey() !== before) syncMusic(); } },
    setActivity(id: string | null) { if (id === activity) return; setActivityNow(id); },
    step(surface: Surface) {
      if (!ctx || muted) return;
      const t = ctx.currentTime + .01;
      if (surface === "wood") { tone(t, 190 + Math.random() * 30, .05, .045, sfxBus, "triangle", 120, .002); burst(t, .03, .02, sfxBus, "bandpass", 1300, 2, brown, 1.2, .002); }
      else if (surface === "tile") { tone(t, 2100 + Math.random() * 300, .015, .012, sfxBus, "sine", undefined, .001); burst(t, .02, .025, sfxBus, "highpass", 4000, .7, white, 1, .001); }
      else burst(t, .07, .025, sfxBus, "lowpass", 350, .7, brown, 1, .01);
    },
    /** Voice a line as a babble of syllables in the Friend's voice. */
    babble(text: string, v: Voice) {
      if (!ctx || muted) return;
      const syllables = Math.min(14, Math.max(2, Math.round(text.replace(/[^a-z]/gi, "").length / 3))), t0 = ctx.currentTime + .02, gap = .085 / v.speed;
      for (let n = 0; n < syllables; n++) {
        const f = v.base * Math.pow(2, ((Math.random() - .5) * v.spread) / 12), t = t0 + n * gap, last = n === syllables - 1;
        tone(t, f, gap * .8, .05, sfxBus, v.wave, f * (last ? (text.trim().endsWith("?") ? 1.3 : .85) : 1.04), .01);
      }
    },
    sfx(name: "bubble" | "puff" | "chime" | "twinkle" | "bounce" | "rustle" | "hum") { one(name); },
    dispose() {
      window.clearInterval(timer); stopLoop(); document.removeEventListener("visibilitychange", onVisibility);
      if (ctx) void ctx.close(); ctx = null; playing = [];
    },
  };

  function setActivityNow(id: string | null) {
    activity = id;
    if (!ctx) return;
    const a = id ? ACTIVITY[id] : undefined;
    startLoop(a?.loop ?? "none");
    nextOne = ctx.currentTime + .3;
    if (id === "sit" || id === "lounge" || id === "boulder" || id === "cloud") one("puff");
    if (id === "pet" || id === "gift") one("chime");
    syncMusic();
  }
}
export type Soundscape = ReturnType<typeof createSoundscape>;

/** Voices per family: base pitch (Hz), timbre, pitch spread (semitones, grows with generation strength), speed. */
export function voiceFor(family: string | null, strength: number): Voice {
  const s = .6 + .8 * strength;
  switch (family) {
    case "Skeleton": return { base: 240, wave: "square", spread: 5 * s, speed: 1.2 };
    case "Mask": return { base: 330, wave: "triangle", spread: 9 * s, speed: 1.1 };
    case "Family": return { base: 300, wave: "sine", spread: 5 * s, speed: 1 };
    case "Cellular": return { base: 280, wave: "triangle", spread: 6 * s, speed: .95 };
    case "Asymmetry": return { base: 390, wave: "square", spread: 11 * s, speed: 1.4 };
    case "Hoverer": return { base: 440, wave: "sine", spread: 4 * s, speed: .8 };
    case "Colossus": return { base: 120, wave: "triangle", spread: 3 * s, speed: .7 };
    case "Sparkling": return { base: 560, wave: "sine", spread: 7 * s, speed: 1.1 };
    case "Hollow": return { base: 200, wave: "sine", spread: 2 * s, speed: .75 };
    default: return { base: 300, wave: "sine", spread: 5, speed: 1 };
  }
}
