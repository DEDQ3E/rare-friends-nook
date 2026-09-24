/** Procedural sound for Friend Nook (Web Audio, synthesized in code: no recordings or samples).
 *
 * - Music: a cozy home tune that follows the time of day (morning, day, evening, a lullaby at night). It ducks
 *   under the TV, gives way to the record player while the Friend dances, and softens while it sleeps.
 * - Ambience: birds through the window by day, crickets at night.
 * - Activities: TV chatter, video-game and arcade bleeps, bath water and bubbles, running tap, sizzling pan,
 *   crunchy snacks, cutlery, toy squeaks, piano notes, page flips, brush strokes, aquarium bubbles, twinkles,
 *   snoring, ball bounces.
 * - Footsteps by floor (wood, carpet, tile) and the Friend's voice: speech is voiced as a babble of syllables
 *   whose pitch and timbre come from its family (and how expressive, from its generation).
 *
 * Nothing plays until unlock() runs from a player gesture. Muted, paused or hidden → the context is suspended. */

export type Surface = "wood" | "carpet" | "tile";
export type Voice = Readonly<{ base: number; wave: OscillatorType; spread: number; speed: number }>;

type Track = Readonly<{ bpm: number; chords: readonly (readonly number[])[]; arp: readonly number[]; arpChance: number; melody: readonly number[]; melodyChance: number; hat: boolean; kick: boolean; pad: number; pluck: number; bass: number }>;
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
const TRACKS: Readonly<Record<string, Track>> = {
  morning: { bpm: 92, chords: [[48, 52, 55, 60], [45, 52, 57, 60], [41, 53, 57, 60], [43, 55, 59, 62]], arp: [0, 2, 1, 3, 2, 1, 3, 2], arpChance: .8, melody: [72, 74, 76, 79, 81], melodyChance: .25, hat: true, kick: false, pad: .014, pluck: .045, bass: .07 },
  day: { bpm: 84, chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 55, 59, 64]], arp: [0, 1, 2, 3, 2, 1, 2, 3], arpChance: .7, melody: [69, 72, 74, 76, 79], melodyChance: .22, hat: true, kick: true, pad: .016, pluck: .042, bass: .08 },
  evening: { bpm: 74, chords: [[45, 52, 57, 60], [41, 48, 53, 57], [48, 52, 55, 59], [43, 50, 55, 59]], arp: [0, 2, 3, 2, 1, 2, 3, 1], arpChance: .6, melody: [69, 71, 72, 76, 79], melodyChance: .18, hat: false, kick: false, pad: .02, pluck: .04, bass: .07 },
  night: { bpm: 58, chords: [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]], arp: [0, 1, 2, 1, 3, 2, 1, 2], arpChance: .45, melody: [72, 74, 76, 79], melodyChance: .12, hat: false, kick: false, pad: .022, pluck: .034, bass: .05 },
  record: { bpm: 116, chords: [[50, 54, 57, 62], [47, 50, 54, 59], [43, 47, 50, 55], [45, 49, 52, 57]], arp: [0, 1, 2, 3, 2, 3, 1, 2], arpChance: .95, melody: [74, 76, 78, 81, 83], melodyChance: .35, hat: true, kick: true, pad: .012, pluck: .05, bass: .1 },
};
const BEATS_PER_CHORD = 8;

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
};

export function createSoundscape() {
  let ctx: AudioContext | null = null;
  let master!: GainNode, musicBus!: GainNode, ambBus!: GainNode, sfxBus!: GainNode;
  let white!: AudioBuffer, brown!: AudioBuffer;
  let muted = true, paused = false, hidden = false, musicOn = true, volume = .8;
  let hour = 8, activity: string | null = null, timer = 0, lastTick = 0, nextOne = 0, nextAmb = 0;
  type Playing = { key: string; track: Track; gain: GainNode; nextBeat: number; beat: number; dying: boolean };
  let playing: Playing[] = [];
  let loopNodes: { stop: () => void } | null = null;

  /* ---------- building blocks ---------- */
  function noise(c: AudioContext, kind: "white" | "brown") {
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (kind === "white") d[i] = w; else { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } }
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
  function burst(t: number, dur: number, peak: number, out: AudioNode, type: BiquadFilterType, f: number, q = 1, buf = white, rate = 1) {
    const c = ctx!, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; s.playbackRate.value = rate; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    env(g, t, peak, .004, dur); s.connect(fl).connect(g).connect(out); s.start(t, Math.random() * 1.5); s.stop(t + dur + .05);
  }

  /* ---------- music ---------- */
  function pluck(t: number, n: number, peak: number, out: AudioNode, len = 1) { tone(t, midi(n), len, peak, out, "triangle"); tone(t, midi(n + 12), len * .45, peak * .3, out, "sine"); }
  function pad(t: number, notes: readonly number[], dur: number, peak: number, out: AudioNode) {
    const c = ctx!, lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 850; lp.connect(out);
    for (const n of notes.slice(0, 3)) for (const det of [-5, 5]) {
      const o = c.createOscillator(), g = c.createGain(); o.type = "triangle"; o.frequency.value = midi(n); o.detune.value = det;
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(peak, t + Math.min(1.5, dur * .3)); g.gain.setValueAtTime(peak, t + dur - .2); g.gain.linearRampToValueAtTime(.0001, t + dur + 1.2);
      o.connect(g).connect(lp); o.start(t); o.stop(t + dur + 1.3);
    }
  }
  function scheduleMusic(until: number) {
    for (const p of playing) {
      const tr = p.track, spb = 60 / tr.bpm;
      while (p.nextBeat < until) {
        const t = p.nextBeat, b = p.beat % BEATS_PER_CHORD, chord = tr.chords[Math.floor(p.beat / BEATS_PER_CHORD) % tr.chords.length];
        if (b === 0) pad(t, chord, spb * BEATS_PER_CHORD, tr.pad, p.gain);
        if (b % 4 === 0) tone(t, midi(chord[0] - 12), spb * 1.8, tr.bass, p.gain, "sine");
        if (tr.kick && b % 2 === 0) tone(t, 120, .16, .1, p.gain, "sine", 45);
        for (let half = 0; half < 2; half++) {
          const th = t + half * spb / 2, s = (b * 2 + half) % tr.arp.length;
          if (Math.random() < tr.arpChance) pluck(th, chord[tr.arp[s]] + 12, tr.pluck * (half ? .75 : 1), p.gain, tr.bpm > 100 ? .5 : 1.1);
          if (tr.hat && half === 1) burst(th, .03, .012, p.gain, "highpass", 7500);
        }
        if (b % 2 === 0 && Math.random() < tr.melodyChance) pluck(t, tr.melody[Math.floor(Math.random() * tr.melody.length)], tr.pluck * 1.1, p.gain, 1.5);
        p.beat++; p.nextBeat += spb;
      }
    }
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
      const g = ctx.createGain(); g.gain.value = 0; g.connect(musicBus); g.gain.linearRampToValueAtTime(level, now + 2.5);
      playing.push({ key, track: TRACKS[key], gain: g, nextBeat: now + .1, beat: 0, dying: false });
    } else if (live) { live.gain.gain.cancelScheduledValues(now); live.gain.gain.setValueAtTime(live.gain.gain.value, now); live.gain.gain.linearRampToValueAtTime(level, now + .8); }
    window.setTimeout(() => { playing = playing.filter(p => { if (p.dying && ctx && p.gain.gain.value < .01) { p.gain.disconnect(); return false; } return true; }); }, 2600);
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
    // melodic loops: TV jingles/chatter, 8-bit game bleeps
    const blip = () => {
      if (!alive || !ctx) return;
      const t = ctx.currentTime + .02;
      if (kind === "tv") { if (Math.random() < .7) tone(t, 220 + Math.random() * 260, .09, .03, out, "sawtooth", 180 + Math.random() * 200); else pluck(t, 72 + [0, 4, 7, 12][Math.floor(Math.random() * 4)], .03, out, .4); }
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
    const t = ctx.currentTime + .01, o = sfxBus, L = level;
    switch (name) {
      case "bubble": tone(t, 380 + Math.random() * 300, .08, .05 * L, o, "sine", 900 + Math.random() * 400); break;
      case "crunch": for (let n = 0; n < 3; n++) burst(t + n * .05, .04, .08 * L, o, "bandpass", 1800 + Math.random() * 1500, 2); break;
      case "clink": tone(t, 2400 + Math.random() * 600, .25, .03 * L, o, "sine"); burst(t + .2, .06, .04 * L, o, "bandpass", 900, 2, brown); break;
      case "piano": { const n = [60, 62, 64, 67, 69, 72, 74, 76][Math.floor(Math.random() * 8)]; tone(t, midi(n), .9, .06 * L, o, "triangle"); tone(t, midi(n + 12), .4, .02 * L, o, "sine"); break; }
      case "squeak": tone(t, 900, .12, .05 * L, o, "sine", 1500 + Math.random() * 500); break;
      case "page": burst(t, .12, .05 * L, o, "highpass", 3000, .7); break;
      case "brush": burst(t, .18, .04 * L, o, "bandpass", 2500, .9); break;
      case "twinkle": for (let n = 0; n < 3; n++) tone(t + n * .07, midi(84 + [0, 4, 7, 12][Math.floor(Math.random() * 4)]), .35, .025 * L, o, "sine"); break;
      case "snore": burst(t, 1.1, .05 * L, o, "lowpass", 380, 2, brown, .7); break;
      case "bounce": tone(t, 180, .12, .09 * L, o, "sine", 70); break;
      case "rustle": burst(t, .25, .04 * L, o, "bandpass", 1600, .8); break;
      case "puff": burst(t, .3, .06 * L, o, "lowpass", 500, .7, brown); break;
      case "chime": pluck(t, 76, .06 * L, o, .8); pluck(t + .12, 83, .06 * L, o, 1); break;
    }
  }
  function ambience() {
    if (!ctx || muted) return;
    const t = ctx.currentTime + .02, night = hour >= 21 || hour < 6;
    if (night) { for (let n = 0; n < 3; n++) tone(t + n * .06, 4200 + Math.random() * 200, .03, .006, ambBus, "sine"); }
    else if (hour >= 6 && hour < 19 && Math.random() < .6) { const f = 2600 + Math.random() * 1200; tone(t, f, .09, .012, ambBus, "sine", f * 1.25); tone(t + .12, f * 1.1, .07, .01, ambBus, "sine", f * .9); }
  }
  function tick() {
    if (!ctx) return;
    const now = ctx.currentTime;
    scheduleMusic(now + .5);
    const a = activity ? ACTIVITY[activity] : undefined;
    if (a?.every && a.one && now >= nextOne) { nextOne = now + a.every * (.7 + Math.random() * .6); one(a.one); }
    if (now >= nextAmb) { nextAmb = now + (hour >= 21 || hour < 6 ? 1.2 : 3 + Math.random() * 4); ambience(); }
    lastTick = now;
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
        musicBus = ctx.createGain(); musicBus.gain.value = .9; musicBus.connect(master);
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
      if (surface === "wood") burst(t, .05, .05, sfxBus, "bandpass", 700, 3, brown, 1.4);
      else if (surface === "tile") { burst(t, .03, .04, sfxBus, "bandpass", 2400, 4); tone(t, 1600, .02, .006, sfxBus, "sine"); }
      else burst(t, .06, .03, sfxBus, "lowpass", 400, 1, brown);
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
    sfx(name: "bubble" | "puff" | "chime" | "twinkle" | "bounce" | "rustle") { one(name); },
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
    if (id === "sit" || id === "lounge") one("puff");
    if (id === "pet" || id === "gift") one("chime");
    syncMusic();
    void lastTick;
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
