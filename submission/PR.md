# Rare Friends: Friend Nook

![Humippy (Friend #7730, a Generation 3 Hoverer) in its isometric house](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/house.png)

🕹️ **Play: https://dedq3e.github.io/rare-friends-nook/**

🎬 **Demo with sound (47 s):** recorded from the real SDK runtime with Sparkling Friend #66666 read live from mainnet (only the wallet is mocked; `tests/video.mjs`). [File in the repository](https://github.com/DEDQ3E/rare-friends-nook/blob/main/media/friend-nook.webm).

https://github.com/user-attachments/assets/ba8e0824-cde9-49f6-81cb-2066e2926d94

![Dancing, watching TV, taking a bath](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/friend-nook.gif)

**Project name:** Rare Friends: Friend Nook
**Builder / contact:** [DEDQ3E](https://github.com/DEDQ3E) · Discord `dedq3e3` · Telegram [@DEDQ3E](https://t.me/DEDQ3E)
**Category:** Character Spotlight

**One sentence:** Your Generations Friend lives in a cozy isometric house like a Sim, and everything it does by itself comes from the NFT: its family sets its temperament, its generation how strong that character is, and its own sprite seed a name, a favourite colour, a favourite thing and a quirk no other Friend has (RF purchases and rewards are simulated in this preview).

Full submission: [`submissions/friend-nook/README.md`](https://github.com/DEDQ3E/rarefriends-vibeathon/blob/submission-friend-nook/submissions/friend-nook/README.md).

## What did you build?

A life sim with one star: a 12 × 10 tile pixel house (bedroom, bathroom, kitchen, living and dining room) in isometric cut-away view with day and night, five needs and 31 things to do on 27 kinds of furniture. Click furniture to choose, or leave your Friend alone and watch it choose by itself; the camera opens close on your Friend. The house is alive (TV channels and a video game, swimming fish, a turning record, steam, bath bubbles) with a composed, synthesized soundtrack for each time of day (marimba morning, vibraphone swing, lo-fi evening, music-box lullaby, a disco record) and a sound for every activity. A hint always points to one thing that raises the lowest need.

**The Rare Friends home loop, playable today.** The [Rare Friends site](https://rarefriends.com/) describes Friends whose happiness grows through play, gifts of food, toys and decorations, and homes upgraded with furniture, plants and play spaces. Friend Nook is that loop in one house: raise your Friend's Happiness meter (its five needs in one number), feed it, give it Gift Box keepsakes, and upgrade its home in Buy mode (a big plant, a toy piano, an arcade cabinet, an aquarium…). It is a virtual pet and familiar care game, two of the game types the Vibeathon page lists, with the Friend's own character as the star.

## How does it use Rare Friends?

- **Its own artwork:** canonical Generations frames through the SDK sprite reader, four facings, never recoloured, rotated or reshaped; clothes fitted to its own silhouette.
- **Family = temperament:** loves, dislikes, need rates, speed, voice lines and a signature idle per family. A Hoverer floats and naps, a Skeleton wakes at night, an Asymmetry zigzags between toys and the arcade. It may refuse what it dislikes.
- **Generation = character strength:** one read-only `generation(tokenId)` call sets it from Legendary (Gen 1) to Mild (Gen 6): stronger Friends care more, refuse more, gesture and speak more expressively.
- **The token itself:** from its sprite seed come a nickname, a favourite colour (its blanket, cushion and rug), a personal favourite activity, a snack, a birthday, a catchphrase and one of twelve quirks with real effects (night snacker, early bird, bookworm, sky watcher, cuddle bug…). Two Hoverers are different Friends.
- **A family heirloom:** each family brings one piece of its own (nine family heirlooms: a bone xylophone for a Skeleton, a cloud cushion for a Hoverer, a mirror ball for a Sparkling…) with an activity only that family has.
- **Memes about it:** the camera button makes a random meme about this Friend, one of fifteen meme templates filled from its own voice, temperament, quirk, heirloom and what it is doing, over a snapshot of it at home (the platform's *Make memes*).
- **A voice and a relationship:** speech is voiced in a family babble; a *Meet your Friend* card, then within seconds its first own choice, explained on screen ("Humippy's own choice: float on the cloud — the Hoverer family heirloom"), a diary of its own choices and friendship levels. Its favourite thing, colour, snack and quirk are secrets you find out by playing, and each session is a finished first day (08:00–22:00, reach Buddy) with a summary card and a meme; wishes have a timer, and some need a Buy-mode piece first.

The SDK runtime handles the wallet, Friend selection and the ownership gate; the game adds no wallet code.

**Ten real Friends, ten characters:** `tests/friends.mjs` plays ten real Generations Friends (eight families, Gen 1 to 6) through the real SDK runtime, their artwork, family, seed and generation read live from mainnet (only the wallet is mocked). Each of them in the same house at its first own choice, and what each chose by itself, are in the [submission README](https://github.com/DEDQ3E/rarefriends-vibeathon/blob/submission-friend-nook/submissions/friend-nook/README.md#ten-real-friends-ten-characters).

![Ten real Friends in one house, each at its first own choice](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/friends-rooms.png)

![The nine family heirlooms](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/heirlooms.png)

![Three random memes about Humippy (Friend #7730)](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/memes.png)

## How RF is spent, and the economy

| Loop | Player pays | Player gets back |
|---|---|---|
| **Gift Box** (SDK chance game) | 1 RF per box | one keepsake, 0.9165 RF on average when sold back; each box reserves the 5 RF top prize |
| **Food** | Snack pack ×4: 1 RF · Groceries ×3 meals: 2 RF | consumed by the fridge, bar, stove and family dinner |
| **Wardrobe** | 2–5 RF per piece (32 RF for all ten) | cosmetic, never refunded |
| **Buy mode** | 2–6 RF per piece (37 RF for all nine) | new activities, never refunded |

Keepsakes: Pressed Flower 45% (0.35 RF), Snow Globe 28% (0.7 RF), Music Box 17% (1.4 RF), Golden Locket 7% (2.5 RF), Star in a Jar 3% (5 RF). Kept ones stand in the hutch; any can be sold back at its fixed value. Per box: standard deviation 0.934 RF, 27% chance of 1 RF or more back. Food, clothes and furniture: 50% burned, 50% to Friend rewards (proposed split, simulated). Personality never changes prices, odds or rewards.

## What would be on-chain?

Nothing in this build. The Gift Box is a deployment of the SDK's `ChanceGame` with this `game.json` (`buy`, `play`, `settle`, `redeem` into the Friend's canonical NFT wallet). Food, clothes and furniture need a custom RF integration; needs, friendship and the house layout need storage FriendSDK v0.1.2 does not supply.

## How does it use randomness?

Paid outcomes only through the SDK chance game (Gift Box). Browser randomness only drives behaviour (free will, wishes, refusals, hints). Personal traits are deterministic from the token.

## Source code

https://github.com/DEDQ3E/rare-friends-nook (reviewed commit [`033466f`](https://github.com/DEDQ3E/rare-friends-nook/tree/033466f12e1ae90874291bc85076a41db61ab12e)) · FriendSDK v0.1.2, React 19, TypeScript, Canvas 2D, Web Audio · all art and sound made in code.

## Playable demo / how to run

https://dedq3e.github.io/rare-friends-nook/ (GitHub Pages, simulated economy). Needs a browser wallet on **Robinhood mainnet (4663)** holding a hardwired Generations NFT (generation ≥ 1); on phones, use the wallet app's browser, landscape. Locally: `npm ci && npm run dev` (Node 22+).

## How do you play?

Click or tap furniture to pick an action, the floor to walk; arrows / WASD, `E` use, `F` talk, `Esc` close. Keep its needs up (follow the hint), grant its wishes, pet it, make memes (camera), open Gift Boxes, buy food, clothes and furniture (arrows move, `R` rotates). Time: pause, 1× (a day is 8 minutes), 3×. Settings: volume, music, reduced motion.

## What have you tested?

`npm run typecheck`, `friendsdk check` (valid), `friendsdk test` (PASS at 960 px), `npm run docs` (every number in the docs matches `game.json` and the code), and ten real Friends read live from mainnet through the real runtime, browser checks with the SDK harness: furniture actions, the Gift Box through the SDK confirmations, Buy mode, a full unattended day, sound and mute, phone sizes, 60 fps. The live Pages build is byte-identical to `docs/`.

## Known limitations

No storage in the SDK sandbox (a reload starts fresh); the SDK test harness uses the mock wallet's Friend #7730 (the ten-Friend run mocks only the wallet; no Hollow in its list); the generation is one public read from inside the game (never an ownership check; falls back to medium strength); mobile needs the wallet app's browser; sound starts after the first click.

## Credits

DEDQ3E with Claude (Anthropic). FriendSDK v0.1.2 and the Generations artwork by Rare Friends. Wardrobe fitting reused from the builder's *Rare Friends: Expeditions*. No third-party assets. Apache-2.0.
