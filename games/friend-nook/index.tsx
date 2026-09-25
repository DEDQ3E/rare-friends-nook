"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { GameComponentProps } from "@rarefriends/friendsdk/runtime";
import { maximumPrize, type GamePlay, type GameSnapshot } from "@rarefriends/friendsdk/game";
import { formatGameAmount } from "@rarefriends/friendsdk/ui";
import { createFriendSoundKit, type FriendSoundCue, type FriendSoundKit } from "@rarefriends/friendsdk/sounds";
import { GENERATION_SPRITE_MANIFEST, createFriendReader, spriteFrame } from "@rarefriends/friendsdk/sprites";
import { GENERATION_ELIGIBILITY_ABI } from "@rarefriends/friendsdk/identity";
import { createFriendPublicClient } from "@rarefriends/friendsdk/wallet";
import { createEngine, pieceThumb, type Engine, type EngineEvent, type FriendSprites, type View } from "./engine.js";
import { ACTION, NEEDS, NEED_LABEL, clockText, hourOf, moodLabel, type ActionDef, type NeedKey } from "./sim.js";
import { BOND_LEVELS, BOND_TITLES, STRENGTH_LABEL, bondLevel, preference, strengthOf, temperamentFor } from "./personality.js";
import { DEF } from "./furniture.js";
import { ROOM_NAME } from "./house.js";
import { ICONS, drawFriend, pixmapUrl } from "./art.js";
import { SLOTS, SLOT_LABEL, WARDROBE, type Facing, type Outfit, type Slot, type WearItem } from "./wardrobe.js";
import { GIFT_LOVERS, KEEPSAKES } from "./keepsakes.js";
import { CATALOG, CATALOG_DEF } from "./catalog.js";
import { createSoundscape, voiceFor, type Soundscape } from "./audio.js";
import { personalize, traitsFor } from "./traits.js";
import { HEIRLOOM } from "./heirlooms.js";
import "./style.css";

const rfText = (value: bigint) => `${formatGameAmount(value, 18)} RF`;
type Menu = { kind: "object"; uid: string; def: string; x: number; y: number } | { kind: "friend"; x: number; y: number } | null;
type Panel = "profile" | "wardrobe" | "keepsakes" | "gift" | "shop" | "buy" | "help" | null;
const RF = 10n ** 18n;
const FACINGS: readonly Facing[] = ["right", "left", "up", "down"];
const DEF_OFFERS = (action: string) => ["bed", "wardrobe", "windowseat", "toychest", "bathtub", "bathsink", "counter", "fridge", "stool", "chair-n", "tv", "sofa", "bookshelf", "armchair", "record", "ball", "hutch"].some(d => ACTION[action]?.on.includes(d));
const ACTIONS_ON = (def: string) => Object.values(ACTION).filter(a => a.on.includes(def)).map(a => a.id);
const pickOne = (lines: readonly string[]) => lines[Math.floor(Math.random() * lines.length)];
const NEED_ICON = { hunger: "apple", energy: "zzz", fun: "star", hygiene: "drop", social: "heart" } as const;
const NEED_COLOR = (v: number) => (v >= 60 ? "#7FB069" : v >= 30 ? "#F2C94C" : "#E07A5F");

export default function FriendNook({ friendId, client, paused }: GameComponentProps) {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [sprites, setSprites] = useState<FriendSprites | null>(null);
  const [family, setFamily] = useState<string | null>(null);
  const [seed, setSeed] = useState<number | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const [generation, setGeneration] = useState<number | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(""), [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<View | null>(null);
  const [menu, setMenu] = useState<Menu>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [toast, setToast] = useState("");
  const [speed, setSpeed] = useState(1);
  const [zoomed, setZoomed] = useState(true); // the Friend is the star: start close, the whole house is one tap away
  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [outfit, setOutfit] = useState<Outfit>({});
  const [owned, setOwned] = useState<ReadonlySet<string>>(() => new Set());
  const [spent, setSpent] = useState(0n);
  const [greeted, setGreeted] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [reveal, setReveal] = useState<GamePlay | null>(null);
  const [diary, setDiary] = useState<readonly { at: string; text: string }[]>([]);
  const [giftsOpened, setGiftsOpened] = useState(0);
  const [placing, setPlacing] = useState<{ def: string; move: string | null; free: boolean } | null>(null);
  const [storage, setStorage] = useState<Readonly<Record<string, number>>>({});
  const [bought, setBought] = useState<ReadonlyMap<string, string>>(() => new Map()); // uid → catalog id
  const [portraitPhone, setPortraitPhone] = useState(false), [rotateClosed, setRotateClosed] = useState(false);
  const [volume, setVolume] = useState(80), [motionPref, setMotionPref] = useState<"auto" | "on" | "off">("auto");
  const [hintClosed, setHintClosed] = useState(false);
  const lastLevel = useRef(0);
  const [hint, setHint] = useState<{ need: NeedKey; uid: string | null; action: string | null } | null>(null);
  const locked = useRef(false), epoch = useRef(0);
  const viewRef = useRef<View | null>(null); viewRef.current = view;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engine = useRef<Engine | null>(null);
  const sound = useRef<FriendSoundKit | null>(null);
  const scape = useRef<Soundscape | null>(null);
  const [musicOn, setMusicOn] = useState(true);
  const voiceRef = useRef(voiceFor(null, .5));
  const mutedRef = useRef(false);
  const toastTimer = useRef(0);

  const familyTemper = temperamentFor(family);
  const heirloom = family ? HEIRLOOM[family] : undefined;
  const traits = useMemo(() => (seed === null ? null : traitsFor(friendId, seed, familyTemper)), [friendId, seed, familyTemper]);
  const temper = useMemo(() => personalize(familyTemper, traits), [familyTemper, traits]);
  const nick = traits?.nickname ?? `Friend #${friendId.toString()}`;
  const strength = strengthOf(generation ?? null);
  const balance = snapshot ? snapshot.rfBalance - spent : 0n;

  const play = useCallback((cue: FriendSoundCue, volume = 1) => { if (!mutedRef.current) sound.current?.play(cue, { volume }); }, []);
  const flash = useCallback((text: string) => { setToast(text); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(""), 3500); }, []);

  /* ---------- session ---------- */
  useEffect(() => {
    let alive = true;
    sound.current = createFriendSoundKit({ muted: true });
    if (!mutedRef.current) sound.current.setMuted(false);
    scape.current = createSoundscape(); scape.current.setMuted(mutedRef.current);
    setSnapshot(null);
    client.read().then(v => { if (alive) setSnapshot(v); }).catch(cause => { if (alive) setLoadError(cause instanceof Error ? cause.message : "Could not load the game."); });
    const q = window.matchMedia("(prefers-reduced-motion: reduce)"), upd = () => setReducedMotion(q.matches); upd(); q.addEventListener("change", upd);
    const first = () => { if (!mutedRef.current) { void sound.current?.unlock(); void scape.current?.unlock(); } window.removeEventListener("pointerdown", first, true); window.removeEventListener("keydown", first, true); };
    window.addEventListener("pointerdown", first, true); window.addEventListener("keydown", first, true);
    return () => { alive = false; q.removeEventListener("change", upd); window.removeEventListener("pointerdown", first, true); window.removeEventListener("keydown", first, true); sound.current?.dispose(); sound.current = null; scape.current?.dispose(); scape.current = null; };
  }, [client, friendId, attempt]);

  useEffect(() => {
    let alive = true; setSprites(null); setLoadError("");
    createFriendReader().read(friendId).then(art => {
      if (!alive) return;
      setFamily(art.familyName); setSeed(art.seed);
      const clip = (facing: Facing, walking: boolean) => Array.from({ length: 8 }, (_, i) => spriteFrame(art, facing, walking, i, "right").frame.rows);
      const walk = Object.fromEntries(FACINGS.map(f => [f, clip(f, true)])) as Record<Facing, string[][]>;
      const idle = Object.fromEntries(FACINGS.map(f => [f, clip(f, false)])) as Record<Facing, string[][]>;
      setSprites({ walk, idle });
    }).catch(cause => { if (alive) setLoadError(cause instanceof Error ? cause.message : "Could not load your Friend's artwork."); });
    return () => { alive = false; };
  }, [friendId, attempt]);

  useEffect(() => {
    let alive = true; setGeneration(undefined);
    // Character strength only: a public, read-only lookup of this Friend's generation attribute. It is not an
    // ownership check (the SDK runtime verifies ownership before the game starts) and never gates play.
    createFriendPublicClient().readContract({ address: GENERATION_SPRITE_MANIFEST.generations, abi: GENERATION_ELIGIBILITY_ABI, functionName: "generation", args: [friendId] })
      .then(v => { if (alive) setGeneration(Number(v)); }).catch(() => { if (alive) setGeneration(null); });
    return () => { alive = false; };
  }, [friendId]);

  const note = useCallback((text: string) => {
    const at = viewRef.current ? clockText(viewRef.current.minute).replace("Day ", "D") : "";
    setDiary(d => [{ at, text }, ...d].slice(0, 40));
  }, []);

  // a touch screen held upright makes the 3:2 frame tiny: suggest turning the phone (the hint fades by itself)
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    const check = () => setPortraitPhone(coarse.matches && window.screen.height > window.screen.width);
    check(); window.addEventListener("resize", check); window.screen.orientation?.addEventListener("change", check);
    const timer = window.setTimeout(() => setRotateClosed(true), 8000);
    return () => { window.clearTimeout(timer); window.removeEventListener("resize", check); window.screen.orientation?.removeEventListener("change", check); };
  }, []);

  /* ---------- engine ---------- */
  const onEvent = useCallback((e: EngineEvent) => {
    if (e.type === "step") { scape.current?.step(e.surface); return; }
    if (e.type === "hum") { scape.current?.sfx("hum"); return; }
    if (e.type === "speech") scape.current?.babble(e.text, voiceRef.current);
    if (e.type === "start" && e.auto) note(`${ACTION[e.action].label} — its own choice${e.loved ? " (loves it)" : ""}`);
    if (e.type === "start" && !e.auto && e.disliked) note(`${ACTION[e.action].label} — did it for you, grudgingly`);
    if (e.type === "refuse") note(`Refused: ${ACTION[e.action].label.toLowerCase()}`);
    if (e.type === "wish") note(`Made a wish: ${ACTION[e.action].label.toLowerCase()}`);
    if (e.type === "wishDone") note(`Wish granted: ${ACTION[e.action].label.toLowerCase()} (+${e.points} friendship)`);
    if (e.type === "panel") { setPanel(e.panel); play("select", .5); }
    else if (e.type === "refuse") play("impact", .4);
    else if (e.type === "noStock") flash(e.kind === "snack" ? "No snacks left. Buy some in the shop." : "No meals left. Buy groceries in the shop.");
    else if (e.type === "wish") play("action-ready", .4);
    else if (e.type === "wishDone") { flash(`Wish granted! +${e.points} friendship`); play("reward", .7); }
    else if (e.type === "blocked") flash("Your Friend can't get there.");
  }, [play, flash, note]);
  const onEventRef = useRef(onEvent); onEventRef.current = onEvent;

  const ready = !!snapshot && !!sprites;
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas || !ready) return;
    let e: Engine;
    try { e = createEngine(canvas, ev => onEventRef.current(ev)); } catch (cause) { setLoadError(cause instanceof Error ? cause.message : "Could not start the game."); return; }
    engine.current = e; e.resize();
    const ro = new ResizeObserver(() => e.resize()); ro.observe(canvas);
    const tick = window.setInterval(() => setView(e.view()), 250);
    setView(e.view());
    return () => { ro.disconnect(); window.clearInterval(tick); e.destroy(); engine.current = null; };
  }, [ready]);
  useEffect(() => { if (sprites) engine.current?.setSprites(sprites); }, [sprites, ready]);
  useEffect(() => { engine.current?.setCharacter(temper, strength, traits?.quirk.id ?? null); }, [temper, strength, traits, ready]);
  useEffect(() => { if (traits) engine.current?.setAccent(traits.accent); }, [traits, ready]);
  useEffect(() => { engine.current?.setOutfit(outfit); }, [outfit, ready]);
  useEffect(() => { engine.current?.setPaused(paused); if (paused) setMenu(null); }, [paused, ready]);
  useEffect(() => { engine.current?.setSpeed(speed); }, [speed, ready]);
  useEffect(() => { engine.current?.setZoom(zoomed ? 1.7 : 1); }, [zoomed, ready]);
  useEffect(() => { if (placing) setZoomed(false); }, [placing]); // placing furniture needs the whole house
  voiceRef.current = voiceFor(family, strength);
  useEffect(() => { scape.current?.setActivity(view?.active ?? null); }, [view?.active]);
  const hourNow = view ? hourOf(view.minute) : 8;
  useEffect(() => { scape.current?.setHour(hourNow); }, [hourNow]);
  useEffect(() => { scape.current?.setPaused(paused); }, [paused]);
  useEffect(() => { scape.current?.setMusic(musicOn); }, [musicOn]);
  const lessMotion = motionPref === "auto" ? reducedMotion : motionPref === "on";
  useEffect(() => { engine.current?.setReducedMotion(lessMotion); }, [lessMotion, ready]);
  useEffect(() => { sound.current?.setVolume(.65 * volume / 80); scape.current?.setVolume(.8 * volume / 80); }, [volume]);
  useEffect(() => { const t = window.setTimeout(() => setHintClosed(true), 12000); return () => window.clearTimeout(t); }, []);
  // hint: the lowest need, and one random thing in the house that raises it (kept until that need changes)
  useEffect(() => {
    const e = engine.current; if (!view || !e) return;
    const low = NEEDS.reduce((a, b) => (view.needs[b] < view.needs[a] ? b : a));
    if (view.needs[low] >= 65) { if (hint) setHint(null); return; }
    const options = e.hintOptions(low);
    const still = hint && hint.need === low && (hint.uid === null ? options.length === 0 : options.some(o => o.uid === hint.uid && o.action === hint.action));
    if (still) return;
    const pick = options.length ? options[Math.floor(Math.random() * options.length)] : null;
    setHint({ need: low, uid: pick?.uid ?? null, action: pick?.action ?? null });
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps
  const hintBusy = !!hint?.action && view?.action === hint.action;
  useEffect(() => { engine.current?.setHint(hint?.uid && !hintBusy ? hint.uid : null); }, [hint, hintBusy]);
  function followHint() {
    if (!hint) return;
    if (!hint.action) { setPanel("shop"); return; }
    const a = ACTION[hint.action]; if (a) doAction(a, hint.uid === "friend" ? null : hint.uid);
  }
  // friendship level-ups
  const level = bondLevel(view?.friendship ?? 0);
  useEffect(() => {
    if (level > lastLevel.current) { engine.current?.say(`We're ${BOND_TITLES[level].toLowerCase()}s now!`); engine.current?.emote("sparkle", 2.5); play("reward", .6); note(`Friendship level ${level + 1}: ${BOND_TITLES[level]}`); }
    lastLevel.current = level;
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready && introDone && !greeted && engine.current) { setGreeted(true); window.setTimeout(() => engine.current?.greet(), 500); } }, [ready, introDone, greeted]);
  const showIntro = ready && !introDone && generation !== undefined && !!traits;
  useEffect(() => { if (showIntro) engine.current?.setPaused(true); else engine.current?.setPaused(paused); }, [showIntro, paused]);

  /* ---------- input ---------- */
  function onCanvasDown(ev: ReactPointerEvent<HTMLCanvasElement>) {
    if (paused || !engine.current) return;
    const r = ev.currentTarget.getBoundingClientRect();
    if (placing) { engine.current.placeAt(ev.clientX - r.left, ev.clientY - r.top); if (ev.pointerType === "mouse") confirmPlace(); return; }
    const p = engine.current.pick(ev.clientX - r.left, ev.clientY - r.top);
    if (p.kind === "friend") { setMenu({ kind: "friend", x: p.x, y: p.y }); play("select", .4); }
    else if (p.kind === "object") {
      if (!engine.current.menuFor(p.def).length && !DEF[p.def].spots.length && !bought.has(p.uid)) { setMenu(null); engine.current.walkTo(...nearFloor(p.x, p.y)); return; }
      setMenu({ kind: "object", uid: p.uid, def: p.def, x: p.x, y: p.y }); play("select", .4);
    } else if (p.kind === "floor") { setMenu(null); engine.current.walkTo(p.i, p.j); }
    else setMenu(null);
  }
  function nearFloor(x: number, y: number): [number, number] { const p = engine.current?.pick(x, y + 20); return p && p.kind === "floor" ? [p.i, p.j] : [6, 7.5]; }
  function onCanvasMove(ev: ReactPointerEvent<HTMLCanvasElement>) {
    if (!engine.current || ev.pointerType !== "mouse") return;
    const r = ev.currentTarget.getBoundingClientRect();
    if (placing) { engine.current.placeAt(ev.clientX - r.left, ev.clientY - r.top); ev.currentTarget.style.cursor = "crosshair"; return; }
    const p = engine.current.pick(ev.clientX - r.left, ev.clientY - r.top);
    engine.current.setHover(p.kind === "object" && (engine.current.menuFor(p.def).length || DEF[p.def].spots.length) ? p.uid : null);
    ev.currentTarget.style.cursor = p.kind === "object" || p.kind === "friend" ? "pointer" : "default";
  }
  function doAction(a: ActionDef, uid: string | null) {
    setMenu(null);
    if (a.panel === "gift") { setPanel("gift"); return; }
    const ok = engine.current?.command(a.id, uid);
    if (ok) play("action-start", .5);
  }

  const held = useRef(new Set<string>());
  useEffect(() => {
    if (paused || panel || placing) { held.current.clear(); engine.current?.setMove(0, 0); return; }
    const MAP: Record<string, [number, number]> = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] };
    const push = () => { let x = 0, y = 0; for (const k of held.current) { x += MAP[k][0]; y += MAP[k][1]; } engine.current?.setMove(Math.sign(x), Math.sign(y)); };
    const typing = (e: KeyboardEvent) => { const el = e.target as HTMLElement | null; return !!el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName); };
    const down = (e: KeyboardEvent) => {
      if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (MAP[e.code]) { e.preventDefault(); held.current.add(e.code); push(); setMenu(null); return; }
      if (e.code === "KeyE" && !e.repeat) {
        e.preventDefault(); const p = engine.current?.nearestUsable();
        if (p) { const a = engine.current!.friendAnchor(); setMenu({ kind: "object", uid: p.uid, def: p.def, x: a.x, y: a.y }); }
      }
      if (e.code === "KeyF" && !e.repeat) { const a = engine.current?.friendAnchor(); if (a) setMenu({ kind: "friend", x: a.x, y: a.y }); }
      if (e.code === "Escape") setMenu(null);
    };
    const up = (e: KeyboardEvent) => { if (MAP[e.code]) { held.current.delete(e.code); push(); } };
    const stop = () => { held.current.clear(); push(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", stop); document.addEventListener("visibilitychange", stop);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", stop); document.removeEventListener("visibilitychange", stop); stop(); };
  }, [paused, panel, !!placing]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!panel) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setPanel(null); };
    window.addEventListener("keydown", esc); return () => window.removeEventListener("keydown", esc);
  }, [panel]);

  function toggleSound() {
    const next = !muted; setMuted(next); mutedRef.current = next; sound.current?.setMuted(next); scape.current?.setMuted(next);
    if (!next) { void sound.current?.unlock(); void scape.current?.unlock(); sound.current?.play("select", { volume: .4 }); }
  }

  /* ---------- simulated shop spend (wardrobe for now) ---------- */
  function buyWear(item: WearItem) {
    if (paused) return;
    const cost = BigInt(item.price) * 10n ** 18n;
    if (balance < cost) { flash("Not enough RF (simulated)."); play("impact", .4); return; }
    setSpent(s => s + cost); setOwned(o => new Set([...o, item.id])); setOutfit(o => ({ ...o, [item.slot]: item.id }));
    play("purchase"); flash(`${item.name} bought: ${formatGameAmount(cost / 2n, 18)} RF burned, ${formatGameAmount(cost / 2n, 18)} RF to Friend rewards (simulated).`);
    engine.current?.boostNeed("fun", 8);
  }
  const toggleWear = (item: WearItem) => setOutfit(o => { const n: Partial<Record<Slot, string>> = { ...o }; if (n[item.slot] === item.id) delete n[item.slot]; else n[item.slot] = item.id; return n; });

  /* ---------- Gift Box: the SDK chance game (buy → play → settle; keep or sell back = redeem) ---------- */
  const definition = client.definition;
  async function act<T>(work: () => Promise<T>): Promise<T | undefined> {
    if (locked.current || paused) return undefined;
    const version = epoch.current; locked.current = true; setBusy(true); setError("");
    if (!mutedRef.current) void sound.current?.unlock();
    try { const value = await work(); const next = await client.read(); if (version === epoch.current) setSnapshot(next); return value; }
    catch (cause) { if (version === epoch.current) { setError(cause instanceof Error ? cause.message : "The action failed."); try { setSnapshot(await client.read()); } catch { /* keep the last snapshot */ } } return undefined; }
    finally { if (version === epoch.current) { locked.current = false; setBusy(false); } }
  }
  const maxPrize = maximumPrize(definition);
  const pendingGift = snapshot?.plays.find(p => p.outcomeId === null) ?? null;
  const boxes = snapshot?.consumables ?? 0n;
  const canBuyBox = !!snapshot && balance >= definition.price && snapshot.freeStake >= maxPrize && snapshot.freeStake + definition.price >= maxPrize;
  const evText = rfText(definition.outcomes.reduce((t, o) => t + BigInt(o.chanceBps) * o.reward, 0n) / 10000n);
  async function openGift() {
    setReveal(null);
    if (!pendingGift && boxes === 0n) {
      if (!canBuyBox) { setError(balance < definition.price ? "Not enough RF (simulated)." : "The gift fund is full right now. Sell a keepsake and try again."); return; }
      const bought = await act(async () => { await client.buy(1n); return true; });
      if (!bought) return;
      play("purchase", .7);
    }
    const committed = await act(async () => pendingGift ?? (await client.play(1n))[0]);
    if (!committed) return;
    play("anticipation", .6);
    const settled = await act(() => client.settle(committed.id));
    if (!settled) return;
    if (settled.outcomeId === null) { setError("The box is still opening. Try again in a moment."); return; }
    const k = KEEPSAKES[settled.outcomeId - 1];
    setReveal(settled); setGiftsOpened(n => n + 1);
    play(settled.outcomeId >= 5 ? "reveal-legendary" : settled.outcomeId >= 3 ? "reveal-rare" : "reveal-common");
    const lover = GIFT_LOVERS.has(temper.family), bond = Math.round(k.bond * (lover ? 1.5 : 1) * (traits?.quirk.id === "collector" ? 1.5 : 1) * (1 + strength * .5));
    engine.current?.addFriendship(bond); engine.current?.boostNeed("social", 10 + k.bond); engine.current?.boostNeed("fun", 6);
    engine.current?.emote(settled.outcomeId >= 3 ? "sparkle" : "heart", 2.6);
    engine.current?.say(lover ? `A ${k.name.toLowerCase()}! ${temper.voice.love[0]}` : settled.outcomeId >= 4 ? `A ${k.name.toLowerCase()}... wow.` : `Oh, a ${k.name.toLowerCase()}. Thank you!`);
    note(`Opened a Gift Box: ${k.name} (${k.rarity}, +${bond} friendship)`);
  }
  async function sellKeepsake(outcomeId: number) {
    const ok = await act(async () => { await client.redeem(outcomeId, 1n); return true; });
    if (ok) { const k = KEEPSAKES[outcomeId - 1]; play("reward", .6); flash(`${k.name} sold for ${rfText(definition.outcomes[outcomeId - 1].reward)} (simulated).`); note(`Sold a ${k.name.toLowerCase()}`); if (reveal?.outcomeId === outcomeId) setReveal(null); }
  }
  // keepsakes that are kept stand in the hutch, rarest first
  const hutchKey = snapshot ? snapshot.inventory.join(",") : "";
  useEffect(() => {
    if (!snapshot || !engine.current) return;
    const colors: string[] = [];
    for (let i = KEEPSAKES.length - 1; i >= 0; i--) for (let n = 0n; n < (snapshot.inventory[i] ?? 0n) && colors.length < 10; n++) colors.push(KEEPSAKES[i].shelf);
    engine.current.setKeepsakes(colors);
  }, [hutchKey, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Buy mode (simulated RF spend: 50% burned, 50% to Friend rewards) ---------- */
  function startBuy(id: string, free = false) {
    const item = CATALOG_DEF[id]; if (!item || paused) return;
    if (free) { setPanel(null); setMenu(null); setPlacing({ def: id, move: null, free: true }); engine.current?.startPlacing(id); return; }
    if (balance < BigInt(item.price) * RF) { flash("Not enough RF (simulated)."); play("impact", .4); return; }
    setPanel(null); setMenu(null); setPlacing({ def: id, move: null, free: false }); engine.current?.startPlacing(id); play("select", .4);
  }
  function startMove(uid: string) {
    const piece = engine.current?.pieceById(uid); if (!piece) return;
    if (paused) return;
    setMenu(null); setPlacing({ def: piece.def, move: uid, free: true }); engine.current?.startPlacing(piece.def, uid);
  }
  function confirmPlace() {
    if (!placing || !engine.current || paused) return;
    const item = CATALOG_DEF[placing.def];
    if (!placing.free && balance < BigInt(item.price) * RF) { flash("Not enough RF (simulated)."); return; }
    const uid = engine.current.confirmPlacing();
    if (!uid) { flash("It doesn't fit there. Try a free spot (green)."); play("impact", .3); return; }
    if (placing.free && !placing.move) { setBought(m => new Map(m).set(uid, placing.def)); setStorage(s => ({ ...s, [placing.def]: Math.max(0, (s[placing.def] ?? 0) - 1) })); play("select", .4); }
    else if (!placing.move) {
      const cost = BigInt(item.price) * RF;
      setSpent(s => s + cost); setBought(m => new Map(m).set(uid, placing.def)); play("purchase");
      flash(`${item.def.name} bought: ${formatGameAmount(cost / 2n, 18)} RF burned, ${formatGameAmount(cost / 2n, 18)} RF to Friend rewards (simulated).`);
      const acts = engine.current.menuFor(placing.def), loved = acts.find(a => temper.loves.includes(a.id)), hated = acts.find(a => temper.dislikes.includes(a.id));
      if (loved) { engine.current.say(`${pickOne(temper.voice.love)} A ${item.def.name.toLowerCase()}!`); engine.current.emote("heart", 2.4); engine.current.addFriendship(4); note(`New ${item.def.name.toLowerCase()} — loves it`); }
      else if (hated) { engine.current.emote("sweat", 2); note(`New ${item.def.name.toLowerCase()} — not impressed`); }
      else note(`New ${item.def.name.toLowerCase()}`);
    } else play("select", .4);
    setPlacing(null);
  }
  function cancelPlace() { engine.current?.cancelPlacing(); setPlacing(null); }
  function putAway(uid: string) {
    const id = bought.get(uid); if (!id || paused) return;
    engine.current?.removePiece(uid); setBought(m => { const n = new Map(m); n.delete(uid); return n; }); setStorage(s => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
    setMenu(null); play("select", .4); flash(`${CATALOG_DEF[id].def.name} put away. Place it again for free from Buy mode.`);
  }
  useEffect(() => {
    if (!placing) return;
    const key = (e: KeyboardEvent) => {
      const nudge: Record<string, [number, number]> = { ArrowLeft: [-.25, 0], ArrowRight: [.25, 0], ArrowUp: [0, -.25], ArrowDown: [0, .25] };
      if (nudge[e.code]) { e.preventDefault(); engine.current?.nudgePlacing(...nudge[e.code]); }
      else if (e.code === "KeyR") { e.preventDefault(); engine.current?.rotatePlacing(); }
      else if (e.code === "Enter") { e.preventDefault(); confirmPlace(); }
      else if (e.code === "Escape") { e.preventDefault(); cancelPlace(); }
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  });

  /* ---------- previews ---------- */
  const portrait = useMemo(() => {
    if (!sprites) return "";
    const c = document.createElement("canvas"); c.width = 20; c.height = 22; const g = c.getContext("2d"); if (!g) return "";
    drawFriend(g, sprites.idle.down[0], 2, 4, outfit, "down", 0, false); return c.toDataURL();
  }, [sprites, outfit]);
  const icon = useMemo(() => Object.fromEntries(Object.entries(ICONS).map(([k, v]) => [k, pixmapUrl(v, 3)])), []);
  const keepIcon = useMemo(() => KEEPSAKES.map(k => pixmapUrl(k.icon, 4)), []);
  const bigPortrait = useMemo(() => {
    if (!sprites) return "";
    const c = document.createElement("canvas"); c.width = 96; c.height = 104; const g = c.getContext("2d"); if (!g) return "";
    g.imageSmoothingEnabled = false; g.scale(5, 5); drawFriend(g, sprites.idle.down[0], 1.6, 2.4, outfit, "down", 0, false); return c.toDataURL();
  }, [sprites, outfit]);
  const catalogPreview = useMemo(() => Object.fromEntries(CATALOG.map(c => [c.def.id, pieceThumb(c.def.id)])), []);
  const wearPreview = useMemo(() => {
    const out: Record<string, string> = {}; if (!sprites) return out;
    for (const item of WARDROBE) {
      const c = document.createElement("canvas"); c.width = 42; c.height = 26; const g = c.getContext("2d"); if (!g) continue;
      drawFriend(g, sprites.idle.down[0], 3, 8, { [item.slot]: item.id }, "down", 0, false);
      drawFriend(g, sprites.idle.right[0], 23, 8, { [item.slot]: item.id }, "right", 0, false);
      out[item.id] = c.toDataURL();
    }
    return out;
  }, [sprites]);

  /* ---------- render ---------- */
  if (loadError) return <div className="fn-root fn-center" role="alert"><p>{loadError}</p><button type="button" className="fn-btn" onClick={() => { setLoadError(""); setAttempt(n => n + 1); }}>Retry</button></div>;
  if (!snapshot || !sprites) return <div className="fn-root fn-center" role="status"><div className="fn-loader" aria-hidden="true" /><p>Tidying up the nook…</p></div>;
  if (snapshot.friendId !== friendId) return <div className="fn-root fn-center" role="alert">This session does not match the selected Friend.</div>;

  const v = view;
  const menuActions = menu?.kind === "object" ? (engine.current?.menuFor(menu.def) ?? []) : menu?.kind === "friend" ? [ACTION.pet, ACTION.talk, ACTION.gift] : [];
  const menuOpen = !!menu && !paused && !placing && (menuActions.length > 0 || (menu.kind === "object" && bought.has(menu.uid)));
  const genText = generation === undefined ? "Gen …" : generation === null ? "Gen ?" : `Gen ${generation}`;
  const doingLabel = v?.action ? ACTION[v.action]?.label : v?.walking ? "Walking" : "Idle";

  return (
    <div className={`fn-root${lessMotion ? " fn-reduced" : ""}`}>
      <canvas ref={canvasRef} className="fn-canvas" width={960} height={640} aria-label="Your Friend's house. Click furniture to choose an action, click the floor to walk, or use the arrow keys."
        onPointerDown={onCanvasDown} onPointerMove={onCanvasMove} onPointerLeave={() => engine.current?.setHover(null)} />

      {/* top left: who this Friend is */}
      <button type="button" className="fn-card fn-id" onClick={() => setPanel("profile")} aria-label="Open your Friend's character card">
        {portrait && <img src={portrait} width={40} height={44} alt="" />}
        <span><strong>{nick} <small className="fn-token">#{friendId.toString()}</small></strong><small>{family ?? "…"} · {genText} · {temper.title}</small><small className="fn-bond">♥ {BOND_TITLES[level]}</small><small className="fn-doing">{doingLabel}{v ? ` · ${ROOM_NAME[v.room]}` : ""}</small></span>
      </button>

      {/* top right: money and tools */}
      <div className="fn-tools">
        <div className="fn-card fn-money" title="Simulated $RAREFRIENDS balance"><strong>{rfText(balance)}</strong><small>simulated</small></div>
        <button type="button" className="fn-icon" onClick={() => setPanel("shop")} aria-label="Shop" title="Shop: food and clothes"><img src={icon.apple} alt="" /></button>
        <button type="button" className="fn-icon" onClick={() => placing ? cancelPlace() : setPanel("buy")} aria-pressed={!!placing} aria-label="Buy mode: furniture" title="Buy mode: furniture"><img src={icon.sofa} alt="" /></button>
        <button type="button" className="fn-icon" onClick={() => setZoomed(z => !z)} aria-pressed={zoomed} aria-label={zoomed ? "Zoom out" : "Zoom in"} title="Zoom">{zoomed ? "−" : "+"}</button>
        <button type="button" className="fn-icon" onClick={toggleSound} aria-pressed={!muted} aria-label={muted ? "Sound off" : "Sound on"} title="Sound"><img src={muted ? icon.mute : icon.speaker} alt="" /></button>
        <button type="button" className="fn-icon" onClick={() => setPanel("help")} aria-label="How to play" title="How to play">?</button>
      </div>

      {/* bottom left: needs */}
      {v && <div className="fn-card fn-needs" aria-label="Needs">
        <div className="fn-need fn-happy" title="Happiness: the average of its needs, pulled down by the lowest"><img src={icon.sparkle} alt="" /><span>Happiness</span><i role="meter" aria-label="Happiness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v.mood}><b style={{ width: `${v.mood}%`, background: NEED_COLOR(v.mood) }} /></i><em>{v.mood}</em></div>
        {NEEDS.map(k => <div key={k} className={`fn-need${hint?.need === k ? " fn-low" : ""}`} title={NEED_LABEL[k]}><img src={icon[NEED_ICON[k]]} alt="" /><span>{NEED_LABEL[k]}</span><i role="meter" aria-label={NEED_LABEL[k]} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v.needs[k])}><b style={{ width: `${v.needs[k]}%`, background: NEED_COLOR(v.needs[k]) }} /></i></div>)}
        {hint && <button type="button" className="fn-hintbtn" onClick={followHint} disabled={paused || hintBusy} title="Suggested by the game">
          <img src={icon[hint.action ? ACTION[hint.action].icon : "apple"]} alt="" />
          <span><em>{NEED_LABEL[hint.need]} is low</em> {hintBusy ? "— on it!" : hint.action ? <>→ {ACTION[hint.action].label.toLowerCase()}{hint.uid && hint.uid !== "friend" ? ` · ${DEF[engine.current?.pieceById(hint.uid)?.def ?? ""]?.name ?? ""}` : ""}</> : "→ buy food in the shop"}</span>
        </button>}
        <div className="fn-mood">Feeling <strong>{moodLabel(v.mood)}</strong>{v.wish && <span className="fn-wish" title="Current wish"> · wishes to <img src={icon[ACTION[v.wish].icon]} alt="" /> {ACTION[v.wish].label.toLowerCase()}</span>}</div>
      </div>}

      {/* bottom right: time */}
      {v && <div className="fn-card fn-time">
        <span>{clockText(v.minute)}</span>
        {[0, 1, 3].map(s => <button key={s} type="button" className="fn-speed" aria-pressed={speed === s} onClick={() => setSpeed(s)} aria-label={s === 0 ? "Pause time" : `Speed ${s}×`}>{s === 0 ? "❚❚" : `${s}×`}</button>)}
      </div>}

      {toast && <div className="fn-toast" role="status">{toast}</div>}
      {!hintClosed && !panel && !placing && <div className="fn-card fn-hint" role="status"><span>Click furniture to pick an activity, the floor to walk. Leave your Friend alone to see its character.</span><button type="button" className="fn-btn fn-small" onClick={() => setHintClosed(true)}>Got it</button></div>}
      {showIntro && traits && <div className="fn-overlay fn-intro-wrap">
        <section className="fn-panel fn-intro" role="dialog" aria-modal="true" aria-label={`Meet ${nick}`}>
          <div className="fn-intro-head">
            {bigPortrait && <img src={bigPortrait} width={96} height={104} alt="" style={{ background: traits.accent.light }} />}
            <div>
              <p className="fn-sub">Meet your Friend</p>
              <h2>{nick}</h2>
              <p className="fn-sub">Friend #{friendId.toString()} · {family ?? "Unknown"} family · {genText}</p>
              <p className="fn-temper"><strong>{temper.title}</strong> — {temper.blurb}</p>
              <div className="fn-meter" role="meter" aria-label="Character strength" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(strength * 100)}><b style={{ width: `${Math.round(strength * 100)}%` }} /></div>
              <small>Character strength: {STRENGTH_LABEL(strength)} ({genText}; Gen 1 is the strongest)</small>
            </div>
          </div>
          <div className="fn-chips">
            <span className="fn-chip fn-love">♥ Loves: {familyTemper.loves.map(id => ACTION[id]?.label).filter(Boolean).slice(0, 4).join(", ")}</span>
            <span className="fn-chip fn-hate">✕ Dislikes: {familyTemper.dislikes.map(id => ACTION[id]?.label).filter(Boolean).join(", ") || "nothing, really"}</span>
          </div>
          {heirloom && <p className="fn-heir"><strong>Family heirloom: {heirloom.def.name}</strong> (in the living room) — {heirloom.blurb}</p>}
          <p className="fn-sub">Only {nick} has these:</p>
          <ul className="fn-mine">
            <li><strong>Favourite thing:</strong> {ACTION[traits.favorite]?.label}</li>
            <li><strong>Favourite colour:</strong> <i className="fn-swatch" style={{ background: traits.accent.top }} /> {traits.accent.name}</li>
            <li><strong>Favourite snack:</strong> {traits.snack}</li>
            <li><strong>Birthday:</strong> {traits.birthday.label}</li>
            <li><strong>Quirk:</strong> {traits.quirk.label} — {traits.quirk.blurb}</li>
            <li><strong>Says:</strong> “{traits.catchphrase}”</li>
          </ul>
          <p className="fn-note fn-intro-note">Family and generation come from the NFT; the rest is read from its own sprite seed, so every Friend is different. Character only changes behaviour, never prices, odds or rewards.</p>
          <div className="fn-row"><button type="button" className="fn-btn" ref={el => el?.focus({ preventScroll: true })} onClick={() => { setIntroDone(true); play("select", .5); }}>Welcome home, {nick}!</button></div>
        </section>
      </div>}
      {portraitPhone && !rotateClosed && <div className="fn-card fn-rotate" role="status">Turn your phone sideways for a bigger house <button type="button" className="fn-btn fn-small" onClick={() => setRotateClosed(true)}>OK</button></div>}
      {placing && <div className="fn-card fn-placebar" role="toolbar" aria-label="Placing furniture">
        <span>{placing.move ? "Moving" : "Placing"} <strong>{CATALOG_DEF[placing.def]?.def.name}</strong>{!placing.free && <> · {CATALOG_DEF[placing.def]?.price} RF</>}</span>
        <button type="button" className="fn-btn fn-small" onClick={() => engine.current?.rotatePlacing()}>Rotate (R)</button>
        <button type="button" className="fn-btn fn-small" onClick={confirmPlace}>Place here</button>
        <button type="button" className="fn-btn fn-small fn-plain" onClick={cancelPlace}>Cancel</button>
      </div>}

      {/* action menu next to the clicked thing */}
      {menu && menuOpen && <div className="fn-menu" style={{ left: Math.min(Math.max(menu.x, 90), 870), top: Math.min(Math.max(menu.y, 60), 560) }} role="menu">
        <p>{menu.kind === "friend" ? `${nick} (Friend #${friendId.toString()})` : DEF[menu.def].name}</p>
        {menuActions.map(a => {
          const pref = preference(temper, strength, a.id), tag = pref > 1.3 ? "loves" : pref < .8 ? "dislikes" : "";
          return <button key={a.id} type="button" role="menuitem" className="fn-item" onClick={() => doAction(a, menu.kind === "object" ? menu.uid : null)}>
            <img src={icon[a.icon]} alt="" />{a.label}{tag && <em className={`fn-tag fn-${tag}`}>{tag}</em>}
            {a.uses && <small>{a.uses === "snack" ? `${v?.stock.snacks ?? 0} snacks` : `${v?.stock.meals ?? 0} meals`}</small>}
          </button>;
        })}
        {menu.kind === "object" && bought.has(menu.uid) && <>
          <button type="button" role="menuitem" className="fn-item" onClick={() => startMove(menu.uid)}><img src={icon.sofa} alt="" />Move</button>
          <button type="button" role="menuitem" className="fn-item" onClick={() => putAway(menu.uid)}><img src={icon.gift} alt="" />Put away<small>to storage</small></button>
        </>}
        <button type="button" className="fn-item fn-cancel" onClick={() => setMenu(null)}>Close</button>
      </div>}

      {panel && <div className="fn-overlay" onPointerDown={e => { if (e.target === e.currentTarget) setPanel(null); }}>
        <section className="fn-panel" role="dialog" aria-modal="true" aria-label={panel}>
          <button type="button" className="fn-close" onClick={() => setPanel(null)} aria-label="Close">×</button>
          {panel === "profile" && <>
            <h2>{temper.title}</h2>
            <p className="fn-sub">{nick} · Friend #{friendId.toString()} · {family ?? "Unknown"} family · {genText}</p>
            <p>{temper.blurb}</p>
            <dl className="fn-traits">
              <dt>Character strength</dt><dd>{STRENGTH_LABEL(strength)} ({Math.round(strength * 100)}%) — Gen 1 is the strongest, Gen 6 the mildest.</dd>
              <dt>Loves</dt><dd>{temper.loves.map(id => ACTION[id]?.label).filter(Boolean).join(", ") || "—"}</dd>
              <dt>Dislikes</dt><dd>{temper.dislikes.map(id => ACTION[id]?.label).filter(Boolean).join(", ") || "Nothing, really"}</dd>
              <dt>Needs that drop faster</dt><dd>{Object.entries(temper.decay).filter(([, m]) => (m ?? 1) > 1).map(([k]) => NEED_LABEL[k as keyof typeof NEED_LABEL]).join(", ") || "—"}{temper.nightOwl ? " · awake at night" : ""}</dd>
              {traits && <><dt>Nickname</dt><dd>{traits.nickname}</dd>
              <dt>Favourite thing</dt><dd>{ACTION[traits.favorite]?.label ?? traits.favorite}{!DEF_OFFERS(traits.favorite) && " (find it in Buy mode)"}</dd>
              <dt>Favourite colour</dt><dd><i className="fn-swatch" style={{ background: traits.accent.top }} /> {traits.accent.name} — its blanket, cushion and rug</dd>
              <dt>Favourite snack</dt><dd>{traits.snack}</dd>
              <dt>Birthday</dt><dd>{traits.birthday.label}</dd>
              {heirloom && <><dt>Family heirloom</dt><dd>{heirloom.def.name}: {heirloom.action.label.toLowerCase()} (living room)</dd></>}
              <dt>Quirk</dt><dd>{traits.quirk.label}: {traits.quirk.blurb}</dd>
              <dt>Catchphrase</dt><dd>“{traits.catchphrase}”</dd></>}
              <dt>Friendship</dt><dd>{BOND_TITLES[level]} (level {level + 1}) · {v?.friendship ?? 0} points{level < BOND_LEVELS.length - 1 ? ` · next at ${BOND_LEVELS[level + 1]}` : ""}</dd>
            </dl>
            <h3>Diary</h3>
            {diary.length ? <ul className="fn-diary">{diary.slice(0, 12).map((d, n) => <li key={n}><small>{d.at}</small> {d.text}</li>)}</ul> : <p className="fn-sub">Leave your Friend alone for a bit: what it chooses by itself shows up here.</p>}
            <p className="fn-note">Personality only changes behaviour. It never changes prices, odds or rewards, and every generation plays the full game.</p>
          </>}
          {panel === "wardrobe" && <>
            <h2>Wardrobe</h2>
            <p className="fn-sub">Clothes are layered over your Friend's own artwork and come off in one tap.</p>
            {SLOTS.map(slot => <div key={slot} className="fn-row-group"><h3>{SLOT_LABEL[slot]}</h3>
              <div className="fn-grid">{WARDROBE.filter(w => w.slot === slot && !w.season).map(w => {
                const has = owned.has(w.id), on = outfit[w.slot] === w.id;
                return <button key={w.id} type="button" className={`fn-tile${on ? " fn-on" : ""}`} onClick={() => has ? toggleWear(w) : buyWear(w)}>
                  {wearPreview[w.id] && <img src={wearPreview[w.id]} width={84} height={52} alt="" />}
                  <strong>{w.name}</strong><small>{has ? (on ? "Wearing · tap to remove" : "Owned · tap to wear") : `${w.price} RF (simulated)`}</small>
                </button>;
              })}</div></div>)}
          </>}
          {panel === "keepsakes" && <>
            <h2>Keepsakes</h2>
            <p className="fn-sub">Kept keepsakes stand in the hutch. Looking at them cheers your Friend up (more keepsakes, more fun). Any keepsake can be sold back for RF (simulated).</p>
            <div className="fn-grid">{KEEPSAKES.map((k, i) => { const have = snapshot.inventory[i] ?? 0n; return <div key={k.name} className={`fn-tile${have > 0n ? "" : " fn-dim"}`}>
              <img src={keepIcon[i]} width={36} height={36} alt="" /><strong>{k.name}</strong><small>{k.rarity} · ×{have.toString()}</small>
              {have > 0n && <button type="button" className="fn-btn fn-small" disabled={busy || paused} onClick={() => void sellKeepsake(i + 1)}>Sell for {rfText(definition.outcomes[i].reward)}</button>}
            </div>; })}</div>
            <div className="fn-row"><button type="button" className="fn-btn" onClick={() => setPanel("gift")}>Open a Gift Box</button></div>
          </>}
          {panel === "gift" && <>
            <h2>Gift Box</h2>
            <p className="fn-sub">{rfText(definition.price)} per box (simulated). Your Friend opens it and reacts in its own way. Keep the keepsake for the hutch, or sell it back.</p>
            {reveal?.outcomeId ? <div className="fn-reveal" role="status">
              <img src={keepIcon[reveal.outcomeId - 1]} width={72} height={72} alt="" />
              <div><strong>{KEEPSAKES[reveal.outcomeId - 1].name}</strong> <small>{KEEPSAKES[reveal.outcomeId - 1].rarity}</small><p>{KEEPSAKES[reveal.outcomeId - 1].blurb}</p>
                <div className="fn-row"><button type="button" className="fn-btn" onClick={() => { setReveal(null); setPanel(null); }}>Keep it in the hutch</button>
                <button type="button" className="fn-btn fn-plain" disabled={busy} onClick={() => void sellKeepsake(reveal.outcomeId!)}>Sell for {rfText(definition.outcomes[reveal.outcomeId - 1].reward)}</button></div></div>
            </div> : <div className="fn-row">
              <button type="button" className="fn-btn" disabled={busy || paused || (!pendingGift && boxes === 0n && !canBuyBox)} onClick={() => void openGift()}>{busy ? "Opening…" : pendingGift ? "Finish opening the box" : boxes > 0n ? `Open a box (you have ${boxes.toString()})` : `Buy and open · ${rfText(definition.price)}`}</button>
              <span className="fn-sub">Balance: {rfText(balance)}</span>
            </div>}
            {error && <p className="fn-error" role="alert">{error}</p>}
            <table className="fn-odds"><thead><tr><th>Keepsake</th><th>Chance</th><th>Sell-back value</th></tr></thead><tbody>
              {definition.outcomes.map((o, i) => <tr key={o.name}><td><img src={keepIcon[i]} width={18} height={18} alt="" /> {KEEPSAKES[i].name} <small>({KEEPSAKES[i].rarity})</small></td><td>{(o.chanceBps / 100).toFixed(o.chanceBps % 100 ? 1 : 0)}%</td><td>{rfText(o.reward)}</td></tr>)}
            </tbody></table>
            <p className="fn-note">Expected sell-back value per box: {evText}. Odds and values come from game.json. Every box is backed by the game fund (the SDK reserves the top prize for each purchase). Purchases and rewards are simulated in this preview.</p>
          </>}
          {panel === "shop" && <>
            <h2>Shop</h2><p className="fn-sub">Simulated RF. Food is used by the fridge (snacks) and the stove or dinner table (meals).</p>
            <div className="fn-grid">
              <button type="button" className="fn-tile" disabled={paused} onClick={() => { const cost = 10n ** 18n; if (balance < cost) { flash("Not enough RF (simulated)."); return; } setSpent(s => s + cost); engine.current?.addStock(4, 0); play("purchase"); flash("4 snacks added (1 RF, simulated)."); }}><img src={icon.apple} alt="" /><strong>Snack pack ×4</strong><small>1 RF · you have {v?.stock.snacks ?? 0}</small></button>
              <button type="button" className="fn-tile" disabled={paused} onClick={() => { const cost = 2n * 10n ** 18n; if (balance < cost) { flash("Not enough RF (simulated)."); return; } setSpent(s => s + cost); engine.current?.addStock(0, 3); play("purchase"); flash("3 meals added (2 RF, simulated)."); }}><img src={icon.pot} alt="" /><strong>Groceries ×3 meals</strong><small>2 RF · you have {v?.stock.meals ?? 0}</small></button>
              <button type="button" className="fn-tile" onClick={() => setPanel("wardrobe")}><img src={icon.hat} alt="" /><strong>Clothes</strong><small>Open the wardrobe</small></button>
            </div>
          </>}
          {panel === "buy" && <>
            <h2>Buy mode</h2>
            <p className="fn-sub">New furniture for the house (simulated RF: half burned, half to Friend rewards). Each piece brings its own activity. Hearts show what your Friend loves.</p>
            <div className="fn-grid">{CATALOG.map(c => {
              const acts = engine.current?.menuFor(c.def.id) ?? [], all = ACTIONS_ON(c.def.id);
              const loved = all.some(a => temper.loves.includes(a)), hated = all.some(a => temper.dislikes.includes(a));
              return <button key={c.def.id} type="button" className="fn-tile" onClick={() => startBuy(c.def.id)} disabled={balance < BigInt(c.price) * RF}>
                {catalogPreview[c.def.id] && <img src={catalogPreview[c.def.id]} width={72} height={60} alt="" />}
                <strong>{c.def.name}{loved && <em className="fn-tag fn-loves">loves</em>}{hated && <em className="fn-tag fn-dislikes">dislikes</em>}</strong>
                <small>{c.blurb}</small>
                <small>{c.price} RF · {all.length ? all.map(a => ACTION[a].label).join(", ") : "decor"}</small>
                {void acts}
              </button>;
            })}</div>
            {Object.entries(storage).some(([, n]) => n > 0) && <><h3>In storage (free to place)</h3><div className="fn-grid">{Object.entries(storage).filter(([, n]) => n > 0).map(([id, n]) =>
              <button key={id} type="button" className="fn-tile" onClick={() => startBuy(id, true)}>{catalogPreview[id] && <img src={catalogPreview[id]} width={72} height={60} alt="" />}<strong>{CATALOG_DEF[id].def.name}</strong><small>×{n} · place for free</small></button>)}</div></>}
            <p className="fn-note">Click a free spot to place it (green = fits). Arrows move it, R rotates, Enter places, Esc cancels. Bought pieces can be moved or put away into storage; RF spent on furniture is not refunded.</p>
          </>}
          {panel === "help" && <>
            <h2>How to play</h2>
            <ul className="fn-help">
              <li>Click or tap furniture to choose what your Friend does. Click the floor to walk there.</li>
              <li>Arrows or WASD walk. <kbd>E</kbd> uses the nearest thing, <kbd>F</kbd> talks to your Friend, <kbd>Esc</kbd> closes.</li>
              <li>Leave it alone and it lives its own life: it picks what it likes, based on its family and generation.</li>
              <li>Fulfil its wishes (thought bubbles) for friendship. It may refuse things it dislikes.</li>
              <li>RF, purchases and rewards are simulated in this preview. A reload starts a fresh session.</li>
              <li>On a phone, open the preview in your wallet app's browser (for example MetaMask → Browser) and turn the phone sideways.</li>
            </ul>
            <h3>Settings</h3>
            <div className="fn-settings">
              <label><input type="checkbox" checked={musicOn} onChange={e => setMusicOn(e.target.checked)} /> Music (a cozy tune that follows the time of day)</label>
              <label>Sound volume <input type="range" min={0} max={100} step={5} value={volume} onChange={e => setVolume(Number(e.target.value))} aria-label="Sound volume" /> {volume}%</label>
              <label>Reduce motion <select value={motionPref} onChange={e => setMotionPref(e.target.value as "auto" | "on" | "off")} aria-label="Reduce motion"><option value="auto">Follow system ({reducedMotion ? "on" : "off"})</option><option value="on">On</option><option value="off">Off</option></select></label>
            </div>
          </>}
        </section>
      </div>}
    </div>
  );
}
