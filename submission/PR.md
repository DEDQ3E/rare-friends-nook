# Rare Friends: Friend Nook

![Humippy (Friend #7730, a Generation 3 Hoverer) in its isometric house](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/house.png)

🕹️ **Play: https://dedq3e.github.io/rare-friends-nook/**

🎬 **Demo with sound (62 s):** the real SDK runtime with Sparkling Friend #66666 read live from mainnet, only the wallet mocked (`tests/video.mjs`).

https://github.com/user-attachments/assets/3081a86d-9c9d-491c-8f63-ebbe96be1ca4

**Project name:** Rare Friends: Friend Nook
**Builder / contact:** [DEDQ3E](https://github.com/DEDQ3E) · Discord `dedq3e3` · Telegram [@DEDQ3E](https://t.me/DEDQ3E)
**Category:** Character Spotlight

**One sentence:** Your Generations Friend lives in a cozy isometric house like a Sim, and everything it does by itself comes from the NFT: its family sets its temperament, its generation how strong that character is, its own sprite seed a name, a favourite colour and a favourite thing, and the shape of its own pixels its quirks, each with a reason shown on the card (RF purchases and rewards are simulated in this preview).

Full submission: [`submissions/friend-nook/README.md`](https://github.com/DEDQ3E/rarefriends-vibeathon/blob/submission-friend-nook/submissions/friend-nook/README.md).

## What did you build?

A life sim with one star: a 12 × 10 tile isometric pixel house with day and night and weather in the windows, five needs and 33 things to do on 28 kinds of furniture. Click furniture to choose, or leave your Friend alone and watch it choose by itself. The house is alive (TV, fish, a turning record, bath bubbles) with a synthesized soundtrack for each time of day and a sound for every activity.

It is the [Rare Friends](https://rarefriends.com/) home loop, playable today: raise your Friend's Happiness meter, feed it, give it Gift Box keepsakes and upgrade its home in Buy mode (a big plant, a toy piano, an arcade cabinet…). A virtual pet and familiar care game, with the Friend's own character as the star.

## How does it use Rare Friends?

- **Its own artwork:** canonical Generations frames through the SDK sprite reader, never recoloured or reshaped; clothes fitted to its own silhouette.
- **Family = temperament:** loves, dislikes, need rates, speed, voice and a signature idle per family. It may refuse what it dislikes.
- **Generation = character strength:** one read-only `generation(tokenId)` call, from Legendary (Gen 1) to Mild (Gen 6): stronger Friends care more, refuse more and speak more expressively.
- **The token itself:** its sprite seed gives a nickname, a favourite colour (its blanket, cushion and rug), a favourite activity, a birthday and a catchphrase; its favourite food is a riddle (below). Its quirks are read from its own pixels, not drawn from a list: the game measures the silhouette (mass, eye holes, symmetry, how much the legs move, height, sparkles, ears, head) and builds a main quirk and a habit from what stands out, each with a strength and a reason on the card ("Big eyes, so it loves the stars"). Sixteen quirks with real effects; two Hoverers are different Friends.
- **A food riddle:** eight shop foods, 1 RF a portion. Each family likes three and dislikes two (shown as a hint); each Friend loves one of its family's three and you find out by feeding it. For some Friends the loved food is already in the fridge, for some it has to be found, for some the fridge holds something they dislike. Same prices for everyone; only its reactions differ.
- **A birthday party:** once its birthday is found it asks, once a session, for a cake (3 RF, all burned), shared at the dining table; on its real birthday (UTC) it says so.
- **A family heirloom:** each family brings one piece (a bone xylophone for a Skeleton, a mirror ball for a Sparkling…) with an activity only that family has.
- **A family home:** the family decorates the house too: nine homes on the same floor plan, each with its own walls, wallpaper motif, floors, curtains, rugs and furniture materials (Moonlit Manor with bone wallpaper and black-lacquer furniture for a Skeleton, Cloud Loft with clouds and stars for a Hoverer, Stone Lodge in dark oak for a Colossus…). Only looks change: the same pieces, activities and prices.
- **Its first own choice, explained:** seconds after the *Meet your Friend* card it picks something it loves, and the game says why ("Humippy's own choice: float on the cloud — its family heirloom").
- **Three secrets and one day:** the card hides three traits (favourite thing, snack, birthday) until you find them by watching, feeding it the right food, talking and making friends. At 22:00 a recap card sums up the day together; one session is one day, since the SDK keeps no saves.
- **It sulks, and has neighbours:** left alone too long it sulks and refuses requests until you make up (sooner for a Gen 1 or a Homebody, hardly ever for an Introvert). The front door visits four real Generations Friends from a recorded snapshot (three next door by token number, one new this week; generations as of 2026-09-30; no network read, no owner data), played by the game, so every visit is simulated: your Friend steps into the neighbour's whole house, in its family's style, where it lives by itself; hug, dance or share a snack (from your own stock), and both characters decide how it goes; the neighbour remembers your last visit, and the street names your best friend (the neighbour you had the most good moments with) in the panel and in the day recap.
- **Memes about it:** the camera makes a random meme, one of twenty-one meme templates in today's formats (gm, POV, +1000 aura, let him cook, WAGMI) filled from its own voice, temperament, heirloom and what it is doing right now (the platform's *Make memes*).

The SDK runtime handles the wallet, Friend selection and the ownership gate; the game adds no wallet code.

**Ten real Friends, ten family homes:** `tests/friends.mjs` plays ten real Friends (eight families, Gen 1 to 6) through the real runtime, read live from mainnet. Each at its first own choice ([full table](https://github.com/DEDQ3E/rarefriends-vibeathon/blob/submission-friend-nook/submissions/friend-nook/README.md#ten-real-friends-ten-characters)):

![Ten real Friends, each in its family home at its first own choice](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/friends-rooms.png)

![The nine family homes: same floor plan, each family's own walls, wallpaper, floors and rugs](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/homes.png)

![The day's recap card: Day 1 with Humippy](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/recap.png)

## Costs and rewards (how RF is spent)

Everything is simulated; you start with 20 RF.

| Loop | Player pays | Player gets back |
|---|---|---|
| **Gift Box** (SDK chance game) | 1 RF per box | one keepsake, 0.9165 RF on average when sold back; 5 RF top prize |
| **Food** | Snack pack ×4: 1 RF · Groceries ×3 meals: 2 RF | eaten at the fridge, bar, stove and dinner |
| **Shop foods** (eight) | 1 RF per portion, same for every food | a loved one: extra friendship and the snack secret; a disliked one: a grumble |
| **Birthday cake** | 3 RF, once a session, after its birthday is found | a party at the dining table (100% burned) |
| **Wardrobe** | 2–5 RF per piece | cosmetic |
| **Buy mode** | 2–6 RF per piece | new activities; pieces it loves slow its needs, ones it dislikes speed them |

Keepsakes: Pressed Flower 45% (0.35 RF), Snow Globe 28% (0.7 RF), Music Box 17% (1.4 RF), Golden Locket 7% (2.5 RF), Star in a Jar 3% (5 RF); keep them in the hutch or sell them back, with no redemption expiry. Food, shop foods, clothes and furniture: 50% burned, 50% to Friend rewards; the birthday cake is 100% burned (proposed, simulated). Personality never changes prices, odds or rewards. A small *RF burned* counter in the HUD opens *Where your RF went*: spend per source, burned and to Friend rewards, with the Gift Boxes (the game's stake) listed separately. The RF prices are example values, set on the scale of the SDK's reference games (1 RF per consumable, about 0.90 RF back on average). To price higher, multiply every price and keepsake value by the same factor: the odds, the 91.65% average return and the balance between items stay the same.

## What would be on-chain?

Nothing in this build. The Gift Box is the SDK's `ChanceGame` with this `game.json` (`buy`, `play`, `settle`, `redeem` into the Friend's NFT wallet). Food, the shop foods, the birthday cake, clothes and furniture need a custom RF integration; needs, friendship and the house need storage FriendSDK v0.1.4 does not supply.

## How does it use randomness?

Paid outcomes only through the SDK chance game. Browser randomness only drives behaviour (free will, wishes, refusals, memes, the weather). Personal traits are deterministic from the token.

## Source code

https://github.com/DEDQ3E/rare-friends-nook (reviewed commit [`8184bf7`](https://github.com/DEDQ3E/rare-friends-nook/tree/8184bf72999a07ca91216818674a34026268c325)) · FriendSDK v0.1.4, React 19, TypeScript, Canvas 2D, Web Audio · all art and sound made in code.

## Playable demo / how to run

https://dedq3e.github.io/rare-friends-nook/ (simulated economy). Needs a browser wallet on **Robinhood mainnet (4663)** holding a hardwired Generations NFT (generation 1 or higher); on phones, the wallet app's browser, landscape. No RF funding or transaction signature is needed for the preview. Locally, with Node.js 22+:

```sh
git clone https://github.com/DEDQ3E/rare-friends-nook.git
cd rare-friends-nook
git checkout 8184bf72999a07ca91216818674a34026268c325
npm ci
npm run dev
```

## How do you play?

Click furniture to pick an action, the floor to walk; arrows / WASD, `E` use, `F` talk, `Esc` close. Keep its needs up (follow the hint), grant its wishes, find its three secrets, visit a neighbour (front door), make memes, open Gift Boxes, buy food, foods, clothes and furniture (find which food it loves), open Where your RF went. Time: pause, 1× (a day is 8 minutes), 3×.

## What have you tested?

`npm run typecheck`, `friendsdk check`, `friendsdk test` (PASS at 960 px), `npm run docs` (every number in the docs matches `game.json` and the code), unit checks for the quirks, the street, the RF split and the family food tables, ten real Friends read live from mainnet, and browser checks (including the food riddle, the birthday cake and the RF panel): furniture, the Gift Box through the SDK confirmations, Buy mode, a full day with secrets and the recap, sound and mute, phone sizes, 60 fps. The live Pages build is byte-identical to `docs/`.

**Real wallet:** everything was also checked by hand with a real wallet on Robinhood mainnet holding a Generations NFT, on the published build, on a computer and on a phone in the wallet app's browser: wallet connection, Friend selection and the ownership gate, the house, needs and free will, the Gift Box through the SDK confirmations, food, clothes and Buy mode (simulated economy, no RF spent), neighbour visits and memes. That run caught a FriendSDK v0.1.2 bug (a wallet holding a Friend found none on the public RPC); the build moved to the v0.1.3 hotfix, which finds it, and now runs on v0.1.4. The food riddle, the birthday cake, the *Where your RF went* panel, the street of real neighbours and the best-friend line were added after that run; they were checked by hand with a real wallet too, on a local build of the same code before publishing, and are covered by the browser tests with the mock wallet. The automated checks and the demo video use the SDK's mock wallet. The v0.1.4 preview bundle was scanned: neither `runtime.js` nor `game.js` contains transaction code (no `eth_sendTransaction`, `eth_sendRawTransaction`, signing, `writeContract` or ERC-20 `transferFrom`); the game reads the generation with a bare read-only client.

## Known limitations

No storage in the SDK sandbox (a reload starts fresh); no multiplayer in the SDK, so visits to the neighbours are simulated (real Friends from a snapshot, generations as of 2026-09-30); the SDK test harness uses its mock Friend #7730; no Hollow Friend was at hand for the ten-Friend run; mobile needs the wallet app's browser; sound starts after the first click. No funds are at risk in the preview: it never asks for a transaction, a signature or an RF approval; the wallet only connects, switches to Robinhood mainnet and proves ownership. The economy has never run against a deployed contract.

## Credits

DEDQ3E. FriendSDK v0.1.4 and the Generations artwork by Rare Friends; neighbours: real Generations Friends, canonical sprites recorded from the SDK's pinned registry (same roster as Rare Royale), no owner data. Wardrobe fitting reused from the builder's *Rare Friends: Expeditions*. No third-party assets. Apache-2.0.
