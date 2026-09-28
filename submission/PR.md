# Rare Friends: Friend Nook

![Humippy (Friend #7730, a Generation 3 Hoverer) in its isometric house](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/house.png)

🕹️ **Play: https://dedq3e.github.io/rare-friends-nook/**

🎬 **Demo with sound (50 s):** the real SDK runtime with Sparkling Friend #66666 read live from mainnet, only the wallet mocked ([file](https://github.com/DEDQ3E/rare-friends-nook/blob/main/media/friend-nook.webm), `tests/video.mjs`).

https://github.com/user-attachments/assets/9e056e7d-26f8-48e5-ada4-28adf4106d07

**Project name:** Rare Friends: Friend Nook
**Builder / contact:** [DEDQ3E](https://github.com/DEDQ3E) · Discord `dedq3e3` · Telegram [@DEDQ3E](https://t.me/DEDQ3E)
**Category:** Character Spotlight

**One sentence:** Your Generations Friend lives in a cozy isometric house like a Sim, and everything it does by itself comes from the NFT: its family sets its temperament, its generation how strong that character is, and its own sprite seed a name, a favourite colour, a favourite thing and a quirk no other Friend has (RF purchases and rewards are simulated in this preview).

Full submission: [`submissions/friend-nook/README.md`](https://github.com/DEDQ3E/rarefriends-vibeathon/blob/submission-friend-nook/submissions/friend-nook/README.md).

## What did you build?

A life sim with one star: a 12 × 10 tile isometric pixel house with day and night, five needs and 31 things to do on 27 kinds of furniture. Click furniture to choose, or leave your Friend alone and watch it choose by itself. The house is alive (TV, fish, a turning record, bath bubbles) with a synthesized soundtrack for each time of day and a sound for every activity.

It is the [Rare Friends](https://rarefriends.com/) home loop, playable today: raise your Friend's Happiness meter, feed it, give it Gift Box keepsakes and upgrade its home in Buy mode (a big plant, a toy piano, an arcade cabinet…). A virtual pet and familiar care game, with the Friend's own character as the star.

## How does it use Rare Friends?

- **Its own artwork:** canonical Generations frames through the SDK sprite reader, never recoloured or reshaped; clothes fitted to its own silhouette.
- **Family = temperament:** loves, dislikes, need rates, speed, voice and a signature idle per family. It may refuse what it dislikes.
- **Generation = character strength:** one read-only `generation(tokenId)` call, from Legendary (Gen 1) to Mild (Gen 6): stronger Friends care more, refuse more and speak more expressively.
- **The token itself:** its sprite seed gives a nickname, a favourite colour (its blanket, cushion and rug), a favourite activity, a snack, a birthday, a catchphrase and one of twelve quirks with real effects. Two Hoverers are different Friends.
- **A family heirloom:** each family brings one piece (a bone xylophone for a Skeleton, a mirror ball for a Sparkling…) with an activity only that family has.
- **Its first own choice, explained:** seconds after the *Meet your Friend* card it picks something it loves, and the game says why ("Humippy's own choice: float on the cloud — its family heirloom").
- **Four secrets and one day:** the card hides four traits (favourite thing, snack, birthday, quirk) until you find them by watching, feeding, talking and making friends. At 22:00 a recap card sums up the day together; one session is one day, since the SDK keeps no saves.
- **Memes about it:** the camera makes a random meme, one of fifteen meme templates filled from its own voice, temperament and heirloom (the platform's *Make memes*).

The SDK runtime handles the wallet, Friend selection and the ownership gate; the game adds no wallet code.

**Ten real Friends, one house:** `tests/friends.mjs` plays ten real Friends (eight families, Gen 1 to 6) through the real runtime, read live from mainnet. Each at its first own choice ([full table](https://github.com/DEDQ3E/rarefriends-vibeathon/blob/submission-friend-nook/submissions/friend-nook/README.md#ten-real-friends-ten-characters)):

![Ten real Friends in the same house, each at its first own choice](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/friends-rooms.png)

![The day's recap card: Day 1 with Humippy](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/recap.png)

## How RF is spent, and the economy

| Loop | Player pays | Player gets back |
|---|---|---|
| **Gift Box** (SDK chance game) | 1 RF per box | one keepsake, 0.9165 RF on average when sold back; 5 RF top prize |
| **Food** | Snack pack ×4: 1 RF · Groceries ×3 meals: 2 RF | eaten at the fridge, bar, stove and dinner |
| **Wardrobe** | 2–5 RF per piece | cosmetic |
| **Buy mode** | 2–6 RF per piece | new activities |

Keepsakes: Pressed Flower 45% (0.35 RF), Snow Globe 28% (0.7 RF), Music Box 17% (1.4 RF), Golden Locket 7% (2.5 RF), Star in a Jar 3% (5 RF); keep them in the hutch or sell them back. Food, clothes and furniture: 50% burned, 50% to Friend rewards (proposed, simulated). Personality never changes prices, odds or rewards.

## What would be on-chain?

Nothing in this build. The Gift Box is the SDK's `ChanceGame` with this `game.json` (`buy`, `play`, `settle`, `redeem` into the Friend's NFT wallet). Food, clothes and furniture need a custom RF integration; needs, friendship and the house need storage FriendSDK v0.1.2 does not supply.

## How does it use randomness?

Paid outcomes only through the SDK chance game. Browser randomness only drives behaviour (free will, wishes, refusals, memes). Personal traits are deterministic from the token.

## Source code

https://github.com/DEDQ3E/rare-friends-nook (reviewed commit [`b15f95b`](https://github.com/DEDQ3E/rare-friends-nook/tree/b15f95b7f03267a3e6f30a1f35dedb4325b3bf06)) · FriendSDK v0.1.2, React 19, TypeScript, Canvas 2D, Web Audio · all art and sound made in code.

## Playable demo / how to run

https://dedq3e.github.io/rare-friends-nook/ (simulated economy). Needs a browser wallet on **Robinhood mainnet (4663)** holding a hardwired Generations NFT (generation 1 or higher); on phones, the wallet app's browser, landscape. Locally: `npm ci && npm run dev` (Node 22+).

## How do you play?

Click furniture to pick an action, the floor to walk; arrows / WASD, `E` use, `F` talk, `Esc` close. Keep its needs up (follow the hint), grant its wishes, find its four secrets, make memes, open Gift Boxes, buy food, clothes and furniture. Time: pause, 1× (a day is 8 minutes), 3×.

## What have you tested?

`npm run typecheck`, `friendsdk check`, `friendsdk test` (PASS at 960 px), `npm run docs` (every number in the docs matches `game.json` and the code), ten real Friends read live from mainnet, and browser checks: furniture, the Gift Box through the SDK confirmations, Buy mode, a full day with secrets and the recap, sound and mute, phone sizes, 60 fps. The live Pages build is byte-identical to `docs/`.

## Known limitations

No storage in the SDK sandbox (a reload starts fresh); the SDK test harness uses its mock Friend #7730; no Hollow Friend was at hand for the ten-Friend run; mobile needs the wallet app's browser; sound starts after the first click.

## Credits

DEDQ3E with Claude (Anthropic). FriendSDK v0.1.2 and the Generations artwork by Rare Friends. Wardrobe fitting reused from the builder's *Rare Friends: Expeditions*. No third-party assets. Apache-2.0.
