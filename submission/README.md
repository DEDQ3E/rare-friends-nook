# Rare Friends: Friend Nook

![Humippy (Friend #7730, a Generation 3 Hoverer) in its isometric house](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/house.png)

🕹️ **Play: https://dedq3e.github.io/rare-friends-nook/**

🎬 **Demo with sound (47 s):** recorded from the real SDK runtime with Sparkling Friend #66666 read live from mainnet (only the wallet is mocked; `tests/video.mjs`). [File in the repository](https://github.com/DEDQ3E/rare-friends-nook/blob/main/media/friend-nook.webm).

https://github.com/user-attachments/assets/ba8e0824-cde9-49f6-81cb-2066e2926d94

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

A life sim with one star. The selected Friend moves into a 12 × 10 tile pixel house with a bedroom, a bathroom, a kitchen, a living room and a dining area, shown in isometric cut-away view with a day and night cycle. It has five needs (hunger, energy, fun, hygiene, social) and 31 things to do on 27 kinds of furniture: sleep, stargaze, bathe, cook, snack, eat dinner with you, watch TV, play video games, read, dance to the record player, play ball, paint, play the arcade and more. Click furniture to choose an action, or leave it alone and watch it choose by itself. The game opens close on the Friend, with the camera following it; the whole house is one tap away.

The house is alive: the TV shows three channels and a video game, fish swim, the record turns, the pan sizzles, steam rises, bubbles pop in the bath, and the house has its own composed, synthesized soundtrack: a marimba morning, a swinging vibraphone afternoon, a lo-fi Rhodes evening, a music-box lullaby at night and a disco record to dance to, plus a sound for every activity. A hint always points to one thing in the house that raises the lowest need. Gift Boxes (the SDK chance game) give keepsakes for the hutch, and Buy mode adds furniture you place yourself. Everything lives inside the SDK's 960 × 640 container, with a compact layout for phones.

**The Rare Friends home loop, playable today.** The [Rare Friends site](https://rarefriends.com/) describes Friends whose happiness grows through play, gifts of food, toys and decorations, and homes upgraded with furniture, plants and play spaces. Friend Nook is that loop in one house: raise your Friend's Happiness meter (its five needs in one number), feed it, give it Gift Box keepsakes, and upgrade its home in Buy mode (a big plant, a toy piano, an arcade cabinet, an aquarium…). It is a virtual pet and familiar care game, two of the game types the Vibeathon page lists, with the Friend's own character as the star.

## How does it use Rare Friends?

The Friend is the only character, and the game is about who it is.

- **Its own artwork.** The ownership-verified Friend is drawn from its canonical Generations frames through the SDK sprite reader (black mask, white one-pixel halo), in four facings: toward the camera uses the `down` frames, away `up`, sideways `left` / `right`. Its sprite is never recoloured, rotated or reshaped: asleep it rests upright under the blanket, in the bath the near rim and the foam are drawn over it. Clothes from the wardrobe are fitted to its own silhouette and come off in one tap.
- **Family = temperament.** Each of the nine families has its own loves, dislikes, need rates, walking speed, voice lines and a signature idle: a Hoverer floats and naps, a Skeleton rattles and wakes up at night, a Sparkling twinkles and lives in the bath, an Asymmetry zigzags between toys and the arcade, a Colossus moves slowly and owns the sofa, a Hollow wants books and quiet. It may refuse what it dislikes ("Water? On my bones? No.").
- **Generation = character strength.** One read-only `generation(tokenId)` call on the Generations contract sets how strong the character is, from Legendary (Gen 1) to Mild (Gen 6): stronger Friends care more about what they love, refuse more often, gesture more and speak more expressively. Every generation plays the full game.
- **The token itself = what makes it unique.** From the sprite seed the SDK returns, the game derives a nickname, a favourite colour (its blanket, cushion and living-room rug take that colour), a personal favourite activity outside its family's loves, a favourite snack, a birthday, a catchphrase and one of twelve quirks with real effects (chatterbox, quiet one, night snacker, early bird, sleepyhead, neat freak, collector, hummer, bookworm, speedy, sky watcher, cuddle bug). A quirk can even overrule the family: a Bookworm Mask reads although Masks dislike books. Two Hoverers are different Friends.
- **A family heirloom.** Each family brings one piece of its own into the house, at the front of the living room, with an activity only that family has and loves: a Skeleton rattles a tune on a bone xylophone, a Hoverer floats on its cloud cushion, a Sparkling dances under the mirror ball. There are nine family heirlooms, one per family.
- **A voice.** Speech is voiced as a babble of syllables whose pitch and timbre come from the family (a deep slow Colossus, an airy Hoverer, a clacky Skeleton), more expressive with stronger generations.
- **Memes about it.** The camera button makes a random meme about this Friend: one of fifteen meme templates filled from its own voice lines, temperament, quirk, birthday, snack, heirloom, needs and what it is doing, over a clean snapshot of it at home (the platform's *Make memes*). *Another meme* rolls a new one; the sandbox cannot save files, so share it as a screenshot.

  ![Three random memes about Humippy (Friend #7730)](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/memes.png)
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

![The nine family heirlooms, drawn by the game](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/heirlooms.png)

| Family | Heirloom | Activity |
|---|---|---|
| Skeleton | Bone xylophone | Rattle out a tune |
| Mask | Mask stand | Try on a mask |
| Family | Family photo table | Look at family photos |
| Cellular | Cell garden | Tend the cell garden |
| Asymmetry | Wobbly tower | Stack the wobbly tower |
| Hoverer | Cloud cushion | Float on the cloud |
| Colossus | Old boulder seat | Sit on the old boulder |
| Sparkling | Mirror ball | Dance under the mirror ball |
| Hollow | Quiet lantern | Sit by the quiet lantern |

## Ten real Friends, ten characters

Not only the SDK's sample Friend: `tests/friends.mjs` runs the game's real SDK runtime (wallet flow, fresh ownership check, sandboxed iframe) for a fixed list of ten real Generations Friends, with their artwork, family, seed and generation read **live from Robinhood mainnet**; only the wallet account and the ownership answers are mocked, as in `friendsdk test`. Eight of the nine families, generations 1 to 6, and two pairs from one family. Each card below is the game's own *Meet your Friend* card; then each Friend was left alone at 3× for about four in-game hours.

![Meet your Friend cards of ten real Friends](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/friends-cards.png)

| Friend | Family · generation | Nickname | Temperament · strength | Favourite thing | Colour | Quirk | Chose by itself (first 4 in-game hours) |
|---|---|---|---|---|---|---|---|
| #87846 | Mask · Gen 1 | Rox | Performer · Legendary | Look through the telescope | Rose | Sleepyhead | Dance ♥, Cook a meal, Try on a mask ♥ |
| #65001 | Cellular · Gen 1 | Nuraki | Foodie · Legendary | Browse books | Plum | Chatterbox | Cook a meal ♥, Read, Snack at the bar ♥ |
| #1969 | Asymmetry · Gen 1 | Veluri | Chaos Gremlin · Legendary | Stargaze | Mint | Early bird | Play video games ♥, Play video games ♥ |
| #15000 | Asymmetry · Gen 5 | Robo | Chaos Gremlin · Gentle | Cook a meal | Sunflower | Night snacker | Play with toys ♥, Cook a meal ♥ |
| #7730 | Hoverer · Gen 3 | Humippy | Dreamer · Distinct | Play arcade | Sunflower | Quiet one | Play video games, Snack at the bar, Nap ♥ |
| #20838 | Colossus · Gen 3 | Yeps | Gentle Giant · Distinct | Watch the fish | Coral | Sky watcher | Watch TV ♥, Cook a meal |
| #66666 | Sparkling · Gen 3 | Kikosh | Style Icon · Distinct | Relax | Moss | Sleepyhead | Dance under the mirror ball ♥, Cook a meal, Nap |
| #77777 | Skeleton · Gen 4 | Daluno | Night Owl · Clear | Watch the fish | Mint | Sleepyhead | Rattle out a tune ♥, Cook a meal, Nap |
| #444 | Skeleton · Gen 6 | Kozzy | Night Owl · Mild | Play with toys | Moss | Night snacker | Watch TV ♥, Grab a snack ♥ |
| #88888 | Family · Gen 5 | Luli | Homebody · Gentle | Flop on the bean bag | Lavender | Night snacker | Play video games, Look at family photos ♥, Snack at the bar, Look at family photos ♥ |

♥ = something it loves. Four of them went to their family heirloom on their own: Kikosh (Sparkling) danced under the mirror ball, Daluno (Skeleton) rattled out a tune on the bone xylophone, Rox (Mask) tried on the masks and Luli (Family) looked at the family photos twice. The two Asymmetries share a family but not a life: Robo (Gen 5) cooked, its personal favourite, while Veluri (Gen 1) stuck to video games. Each house takes its Friend's colour (blanket, cushion, rug), and the game opens close on the Friend:

![The same house, ten different lives](https://raw.githubusercontent.com/DEDQ3E/rare-friends-nook/main/media/friends-life.png)

## How RF is spent, and the economy

Four RF sinks, all simulated in the preview: **Gift Boxes** (1 RF, the SDK chance game: one of five keepsakes, 0.9165 RF back on average if sold), **food** (snacks and meals the Friend eats), **clothes** and **furniture** (Buy mode). Only keepsakes pay RF back. Personality never changes prices, odds or rewards.

<details><summary><b>Prices, keepsake odds and session statistics</b></summary>

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

</details>

## What would be on-chain?

Nothing in this build; no transaction is ever sent. The Gift Box needs no new contract: a deployment of the SDK's `ChanceGame` with this `game.json` (immutable price and outcome table).

<details><summary><b>How the Gift Box, food, clothes and furniture would work on chain</b></summary>

- `buy` pays RF from the Friend's canonical NFT wallet and mints Gift Boxes into it; each purchase reserves the 5 RF top prize.
- `play` burns a box and commits the opening; a sponsor pays the Dice fee, the oracle records one random word, and anyone can `settle`: the keepsake is minted as an ERC-1155 reward into the canonical NFT wallet.
- `redeem` burns a keepsake for its fixed RF, back into the same wallet, with no expiry.

The hutch would read the Friend wallet's keepsake balances. Food, clothes and furniture would be RF purchases into the Friend wallet with the 50% burn / 50% rewards split, which needs a custom RF integration; needs, the clock, friendship and the house layout need storage that FriendSDK v0.1.2 does not supply.

</details>

## How does it use randomness?

- **Paid outcomes:** only the Gift Box, through the SDK chance game (`buy` → `play` → `settle`); in the preview the SDK's simulated ledger picks the keepsake. The odds are the table above.
- **Behaviour only** (browser `Math.random`, no RF involved): which of the Friend's top three wanted activities it picks, wishes, whether it refuses something it dislikes, which hint is suggested, voice lines and particles.
- **Deterministic from the token:** nickname, favourite colour, favourite activity, snack, birthday, catchphrase and quirk each come from their own hash of the sprite seed and token ID, so the same Friend is always the same and neighbouring token IDs are unrelated.

## Source code

https://github.com/DEDQ3E/rare-friends-nook (reviewed commit: [`62af7dc`](https://github.com/DEDQ3E/rare-friends-nook/tree/62af7dc93b39d27fa9732c003b55a455c6c7a191)). FriendSDK v0.1.2, React 19, TypeScript, Canvas 2D, Web Audio. Everything is drawn and synthesized in code; no image or sound files.

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
- The camera button makes a random meme about your Friend; *Another meme* rolls again.
- Time runs at pause, 1× (a day is 8 minutes) or 3×. The camera follows your Friend close up; zoom out for the whole house (Buy mode zooms out by itself). Settings: volume, music, reduced motion.

## Costs and rewards

Preview balance: 20 RF (simulated, from the SDK). Gift Box 1 RF (odds and values above). Snack pack ×4: 1 RF; Groceries ×3 meals: 2 RF; the house starts with 3 snacks and 2 meals. Clothes 2–5 RF, furniture 2–6 RF, never refunded. Only keepsakes pay RF back, at their fixed values, through the SDK's `redeem`.

## What have you tested?

Typecheck, `friendsdk check` and `friendsdk test` pass; browser checks cover furniture actions, the Gift Box through the SDK confirmations, Buy mode, a full unattended day, sound, phone sizes and 60 fps; ten real Friends were played live from mainnet; a docs check ties every number here to the code.

<details><summary><b>All checks</b></summary>

- `npm run typecheck`, `npm run check` (`friendsdk check`: valid, expected reward 0.9165 RF, maximum 5 RF), `npm test` (`friendsdk test`: PASS at 960 px).
- Browser checks with the SDK test harness (Playwright): clicking furniture like a player (TV, bed, dinner, bath), the Gift Box through the SDK confirmations, Buy mode placing, a full unattended day at 3× (free will, wishes, night), activity close-ups with particles, a sound check (music and activity sounds are scheduled; muting stops them), phone sizes (844 × 390 and 390 × 844), and frame rate (60 fps).
- **Real Friends:** `tests/friends.mjs` (above) plays ten real Friends read live from mainnet through the real SDK runtime, with no browser errors; the README screenshots and GIF use the same live reads for #7730.
- **Video:** `tests/video.mjs` records the demo above, picture and sound together, straight from the running game.
- **Music:** `tests/music.mjs` records every track straight from the game's audio graph to check the mix (similar loudness across tracks, no clipping).
- `tests/docs.mjs` checks that every price, odd and value in this file and the README matches `game.json` and the code.
- Rules pass: canonical artwork never transformed, no wallet code, no storage, no parent-page access, everything simulated and labelled, purchases ignored while the runtime is paused.

</details>

## Known limitations

- The SDK sandbox has no storage: a reload starts a fresh house, clock and friendship.
- `friendsdk test` and the interaction tests use the SDK's mock wallet with Friend #7730, whose simulated ledger always returns the first keepsake. The ten-Friend run reads real artwork and generations but mocks the wallet; no Hollow Friend was in the fixed list, so that family is covered by code only.
- The generation is one public read of the Generations contract from inside the game (the same RPC the SDK sprite reader uses and the child CSP allows). It is never an ownership check; if it fails, the character uses medium strength.
- Mobile needs the wallet app's browser; in portrait the 3:2 frame is small (the game suggests turning the phone).
- Sound starts after the first click or key press (browser rule).

## Credits

Game design, code, pixel art, music and sound: DEDQ3E with Claude (Anthropic). FriendSDK v0.1.2 and the Rare Friends Generations artwork by Rare Friends. The wardrobe fitting (`fit.ts`, `wardrobe.ts`) is reused from the builder's own entry *Rare Friends: Expeditions*. No third-party assets. License: Apache-2.0.
