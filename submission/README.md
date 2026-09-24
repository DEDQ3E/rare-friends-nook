# Rare Friends: Friend Nook

![Wori, a Generation 1 Hoverer, in its isometric house](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/house.png)

🕹️ **Play: https://dedq3e.github.io/rare-friends-nook/**

![Dancing to the record player, watching TV, taking a bath](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/friend-nook.gif)

**Project name**
Rare Friends: Friend Nook

**Builder / contact**
[DEDQ3E](https://github.com/DEDQ3E) · Discord `dedq3e3` · Telegram [@DEDQ3E](https://t.me/DEDQ3E)

**Category**
Character Spotlight

**One sentence**
Your Generations Friend lives in a cozy isometric house like a Sim, and everything it does by itself comes from the NFT: its family sets its temperament, its generation how strong that character is, and its own sprite seed a name, a favourite colour, a favourite thing and a quirk no other Friend has (RF purchases and rewards are simulated in this preview).

## What did you build?

A life sim with one star. The selected Friend moves into a 12 × 10 tile pixel house with a bedroom, a bathroom, a kitchen, a living room and a dining area, shown in isometric cut-away view with a day and night cycle. It has five needs (hunger, energy, fun, hygiene, social) and 31 things to do on 27 kinds of furniture: sleep, stargaze, bathe, cook, snack, eat dinner with you, watch TV, play video games, read, dance to the record player, play ball, paint, play the arcade and more. Click furniture to choose an action, or leave it alone and watch it choose by itself.

The house is alive: the TV shows three channels and a video game, fish swim, the record turns, the pan sizzles, steam rises, bubbles pop in the bath, and the whole house has procedural music that follows the time of day plus a sound for every activity. A hint always points to one thing in the house that raises the lowest need. Gift Boxes (the SDK chance game) give keepsakes for the hutch, and Buy mode adds furniture you place yourself. Everything lives inside the SDK's 960 × 640 container, with a compact layout for phones.

## How does it use Rare Friends?

The Friend is the only character, and the game is about who it is.

- **Its own artwork.** The ownership-verified Friend is drawn from its canonical Generations frames through the SDK sprite reader (black mask, white one-pixel halo), in four facings: toward the camera uses the `down` frames, away `up`, sideways `left` / `right`. Its sprite is never recoloured, rotated or reshaped: asleep it rests upright under the blanket, in the bath the near rim and the foam are drawn over it. Clothes from the wardrobe are fitted to its own silhouette and come off in one tap.
- **Family = temperament.** Each of the nine families has its own loves, dislikes, need rates, walking speed, voice lines and a signature idle: a Hoverer floats and naps, a Skeleton rattles and wakes up at night, a Sparkling twinkles and lives in the bath, an Asymmetry zigzags between toys and the arcade, a Colossus moves slowly and owns the sofa, a Hollow wants books and quiet. It may refuse what it dislikes ("Water? On my bones? No.").
- **Generation = character strength.** One read-only `generation(tokenId)` call on the Generations contract sets how strong the character is, from Legendary (Gen 1) to Mild (Gen 6): stronger Friends care more about what they love, refuse more often, gesture more and speak more expressively. Every generation plays the full game.
- **The token itself = what makes it unique.** From the sprite seed the SDK returns, the game derives a nickname, a favourite colour (its blanket, cushion and living-room rug take that colour), a personal favourite activity outside its family's loves, a favourite snack, a birthday, a catchphrase and one quirk with real effects (chatterbox, man of few words, night snacker, early bird, sleepyhead, neat freak, collector, hummer). Two Hoverers are different Friends.
- **A voice.** Speech is voiced as a babble of syllables whose pitch and timbre come from the family (a deep slow Colossus, an airy Hoverer, a clacky Skeleton), more expressive with stronger generations.
- **A relationship.** A *Meet your Friend* card opens first; a diary records what it chose by itself, what it refused and which wishes you granted; friendship levels go from Stranger to Forever Friend.

The SDK runtime handles the wallet, Friend selection and the ownership gate; the game adds no wallet code and never looks up other tokens.

![The Meet your Friend card](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/intro.png)

| Family | Temperament | Loves | Dislikes | Quirk of the family |
|---|---|---|---|---|
| Skeleton | Night Owl | stargazing, TV, snacks, telescope | baths | more energy at night |
| Mask | Performer | mirror, wardrobe, dancing, vanity, painting | reading | fun and social drop faster |
| Family | Homebody | family dinner, pets, talks, ball, piano | — | social drops faster |
| Cellular | Foodie | cooking, snacks, dinner, aquarium | — | hunger drops faster |
| Asymmetry | Chaos Gremlin | toys, dancing, games, ball, arcade, piano | relaxing, reading, bean bag | fastest walker |
| Hoverer | Dreamer | stargazing, sleep, naps, telescope | cooking | energy drops faster |
| Colossus | Gentle Giant | sofa, TV, dinner, naps, bean bag | bar stools, toys | slowest walker |
| Sparkling | Style Icon | bath, mirror, outfits, gifts, vanity | toys | hygiene drops faster |
| Hollow | Introvert | reading, books, stargazing, aquarium, painting | dancing, games, arcade | social drops slower |

## How RF is spent, and the economy

| Loop | Player pays | Player gets back | Where the rest goes |
|---|---|---|---|
| **Gift Box** (SDK chance game) | 1 RF per box | one keepsake, worth 0.9165 RF on average when sold back | 8.35% edge stays in the game fund; every box reserves the 5 RF top prize |
| **Food** (consumed by actions) | Snack pack ×4: 1 RF · Groceries ×3 meals: 2 RF | snacks for the fridge and bar, meals for the stove and family dinner | 50% burned, 50% to Friend rewards (proposed split) |
| **Wardrobe** (cosmetic) | 2–5 RF per piece, 32 RF for all ten | nothing: never refunded | 50% burned, 50% to Friend rewards |
| **Buy mode** (durable furniture) | 2–6 RF per piece, 37 RF for all nine | new activities; pieces can be moved or put away, never refunded | 50% burned, 50% to Friend rewards |

**Keepsakes** (outcomes of `game.json`, same order):

| Keepsake | Rarity | Chance | Sell-back value | Friendship when opened |
|---|---|---:|---:|---:|
| Pressed Flower | Common | 45% | 0.35 RF | 2 |
| Snow Globe | Uncommon | 28% | 0.7 RF | 4 |
| Music Box | Rare | 17% | 1.4 RF | 7 |
| Golden Locket | Epic | 7% | 2.5 RF | 11 |
| Star in a Jar | Legendary | 3% | 5 RF | 18 |

Friendship from a gift grows with character strength (×1 to ×1.5), is ×1.5 for gift-loving families (Sparkling, Family, Mask) and ×1.5 again for a Collector. Kept keepsakes stand in the hutch and make *Look at keepsakes* more fun (+2 fun each, up to +20). Holding keeps RF in the game as backing; selling gives it back at the fixed value.

**Per box:** expected return 0.9165 RF, standard deviation 0.934 RF, 27% chance of getting 1 RF or more back. **Sessions** (exact distribution, every keepsake sold): 10 boxes return 9.17 RF on average (median 8.75, 90th percentile 13.10, 33.4% of sessions end ahead); 30 boxes return 27.50 RF (median 27.10, 90th percentile 34.30, 29.5% ahead).

Why players keep spending: food runs out (a Foodie eats faster), furniture opens new activities its family loves (a Hoverer lights up at the telescope), outfits are fitted to its own body, and wishes and friendship reward looking after it. Personality never changes prices, odds or rewards.

## What would be on-chain?

Nothing in this build; no transaction is ever sent. The Gift Box needs no new contract: a deployment of the SDK's `ChanceGame` with this `game.json` (immutable price and outcome table).

- `buy` pays RF from the Friend's canonical NFT wallet and mints Gift Boxes into it; each purchase reserves the 5 RF top prize.
- `play` burns a box and commits the opening; a sponsor pays the Dice fee, the oracle records one random word, and anyone can `settle`: the keepsake is minted as an ERC-1155 reward into the canonical NFT wallet.
- `redeem` burns a keepsake for its fixed RF, back into the same wallet, with no expiry.

The hutch would read the Friend wallet's keepsake balances. Food, clothes and furniture would be RF purchases into the Friend wallet with the 50% burn / 50% rewards split, which needs a custom RF integration; needs, the clock, friendship and the house layout need storage that FriendSDK v0.1.2 does not supply.

## How does it use randomness?

- **Paid outcomes:** only the Gift Box, through the SDK chance game (`buy` → `play` → `settle`); in the preview the SDK's simulated ledger picks the keepsake. The odds are the table above.
- **Behaviour only** (browser `Math.random`, no RF involved): which of the Friend's top three wanted activities it picks, wishes, whether it refuses something it dislikes, which hint is suggested, voice lines and particles.
- **Deterministic from the token:** nickname, favourite colour, favourite activity, snack, birthday, catchphrase and quirk come from a seeded generator over the sprite seed and token ID, so the same Friend is always the same.

## Source code

https://github.com/DEDQ3E/rare-friends-nook (reviewed commit: [`18b148f`](https://github.com/DEDQ3E/rare-friends-nook/tree/18b148f25b2dec7765b468cd3715fa74db8a6f14)). FriendSDK v0.1.2, React 19, TypeScript, Canvas 2D, Web Audio. Everything is drawn and synthesized in code; no image or sound files.

## Playable demo / how to run

**Preview:** https://dedq3e.github.io/rare-friends-nook/ (GitHub Pages, simulated economy). Requires a browser wallet connected to **Robinhood mainnet (chain 4663)** holding a hardwired Rare Friends Generations NFT (generation 1 or higher). On a phone, open the link in the wallet app's browser (for example MetaMask → Browser) and turn the phone sideways.

**Locally** (Node.js 22 or newer):

```
git clone https://github.com/DEDQ3E/rare-friends-nook
cd rare-friends-nook
npm ci
npm run dev
```

On Windows, `play.bat` serves the prebuilt `docs/` folder on http://localhost:4183.

## How do you play?

- Click or tap furniture to choose what your Friend does; click the floor to walk. Arrows / WASD walk, `E` uses the nearest thing, `F` talks to your Friend, `Esc` closes.
- Keep its five needs up. The panel names the lowest need and points (with an arrow in the house) to one thing that raises it; one tap sends your Friend there.
- Leave it alone and it lives its own life, choosing by need and by taste. Grant its wishes (thought bubbles) for friendship; it may refuse things it dislikes.
- Pet it, talk to it, open Gift Boxes with it. Buy food, clothes and furniture; place furniture anywhere free (arrows move it, `R` rotates).
- Time runs at pause, 1× (a day is 8 minutes) or 3×. Zoom in to follow your Friend. Settings: volume, music, reduced motion.

## Costs and rewards

Preview balance: 20 RF (simulated, from the SDK). Gift Box 1 RF (odds and values above). Snack pack ×4: 1 RF; Groceries ×3 meals: 2 RF; the house starts with 3 snacks and 2 meals. Clothes 2–5 RF, furniture 2–6 RF, never refunded. Only keepsakes pay RF back, at their fixed values, through the SDK's `redeem`.

## What have you tested?

- `npm run typecheck`, `npm run check` (`friendsdk check`: valid, expected reward 0.9165 RF, maximum 5 RF), `npm test` (`friendsdk test`: PASS at 960 px).
- Browser checks with the SDK test harness (Playwright): clicking furniture like a player (TV, bed, dinner, bath), the Gift Box through the SDK confirmations, Buy mode placing, a full unattended day at 3× (free will, wishes, night), activity close-ups with particles, a sound check (music and activity sounds are scheduled; muting stops them), phone sizes (844 × 390 and 390 × 844), and frame rate (60 fps).
- `tests/docs.mjs` checks that every price, odd and value in this file and the README matches `game.json` and the code.
- Rules pass: canonical artwork never transformed, no wallet code, no storage, no parent-page access, everything simulated and labelled, purchases ignored while the runtime is paused.

## Known limitations

- The SDK sandbox has no storage: a reload starts a fresh house, clock and friendship.
- Automated tests use the SDK's mock wallet with Friend #7730, whose simulated ledger always returns the first keepsake; other families are covered by code, not by a live test.
- The generation is one public read of the Generations contract from inside the game (the same RPC the SDK sprite reader uses and the child CSP allows). It is never an ownership check; if it fails, the character uses medium strength.
- Mobile needs the wallet app's browser; in portrait the 3:2 frame is small (the game suggests turning the phone).
- Sound starts after the first click or key press (browser rule).

## Credits

Game design, code, pixel art, music and sound: DEDQ3E with Claude (Anthropic). FriendSDK v0.1.2 and the Rare Friends Generations artwork by Rare Friends. The wardrobe fitting (`fit.ts`, `wardrobe.ts`) is reused from the builder's own entry *Rare Friends: Expeditions*. No third-party assets. License: Apache-2.0.
