# Rare Friends: Friend Nook — design

Vibeathon category: **Character Spotlight**. Built with FriendSDK v0.1.4.

## Pitch

Your Rare Friend lives in a small isometric pixel house, like a Sim. It has needs, free will and a
personality that comes from its NFT: the **family** decides its temperament, likes and dislikes; the
**generation** decides how strong that character is. Two different Friends in the same house behave
differently. That difference is the game.

## Look

- Cozy pixel diorama, isometric 2:1, 12 × 10 tile house, cut-away front walls (walls-down view).
- Five zones: bedroom, bathroom, kitchen (open to dining), living room, dining area.
- Night and day: window sky, lamp glow and a room tint follow the in-game clock.
- The Friend is always drawn from its canonical frames (black mask, white halo). Clothes are layered over
  it, fitted to its own silhouette, and come off in one tap. The Friend's own sprite is never changed.
- Isometric facings from the four canonical directions: toward the camera = `down`, away = `up`,
  sideways = `left` / `right`. Colossus has no up/down frames, so the SDK's horizontal fallback is used.

## Layout and interactions

Stand spots are the tiles the Friend walks to before an action. If a spot is blocked, the nearest free
neighbour is used.

| # | Object | Action | Needs |
|---|---|---|---|
| 1 | Bed | Sleep / Nap | Energy |
| 2 | Wardrobe | Change outfit | Fun |
| 3 | Window seat | Stargaze (night) / Daydream | Fun |
| 4 | Toy chest | Play with toys | Fun |
| 5 | Bathtub | Take a bath | Hygiene |
| 6 | Sink and mirror | Wash up / Admire self | Hygiene, Fun |
| 7 | Stove | Cook a meal (uses a meal) | Hunger ++ |
| 8 | Fridge | Grab a snack (uses a snack) | Hunger + |
| 9 | Breakfast bar | Snack at the bar | Hunger |
| 10 | Dining table | Family dinner with you | Hunger, Social |
| 11 | TV | Watch TV / Play games | Fun |
| 12 | Sofa | Relax / Nap | Energy, Fun |
| 13 | Bookshelf | Browse books | Fun |
| 14 | Reading chair | Read | Fun |
| 15 | Record player | Dance | Fun |
| 16 | Ball | Play ball with you | Fun, Social |
| 17 | Keepsake hutch | Keepsakes (gift collection) | — |
| 18 | The Friend | Pet / Talk / Open a gift | Social |
| 19 | Front door | Visit a neighbour (simulated) | Social |

## Needs

Hunger, Energy, Fun, Hygiene, Social: 0–100, decaying per in-game hour. Happiness (0–100, shown as its own meter) mixes their average with the
lowest need; the family's temperament changes how fast each need drops. One in-game day lasts about 8 real minutes at 1× speed (pause, 1×, 3×).

## Character (the core)

| Family | Temperament | Loves | Dislikes | Quirk |
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

Every family also loves its own heirloom (below).

- **Generation = character strength.** Gen 1 is the strongest (bigger preferences, more refusals of
  disliked actions, a signature idle), Gen 6 the mildest. Every generation plays the full game.
- **Free will.** When the player gives no orders, the Friend picks what to do by need urgency × taste.
  Its first own choice comes seconds after the welcome and is something it loves; a line on screen says it was its own
  choice and why (its favourite, its family heirloom, its temperament, its quirk, or a low need), then at most once a minute.
- **Refusals.** Ordering a disliked action can get a "Nope" (chance grows with character strength).
- **Wishes.** A thought bubble shows a wish drawn from the Friend's likes. Fulfilling it gives
  Friendship points; Friendship levels are titles, from Stranger to Forever Friend.
- **Voice.** Short speech lines and emotes per family (talk, idle, reactions to gifts and food).
- **The token itself.** Nickname, favourite colour (blanket, cushion, rug), a favourite activity outside the family's
  loves, birthday and catchphrase are each their own hash of the sprite seed and token ID. The favourite food is a riddle (below).
  The quirks are NOT
  hashed: `pixels.ts` measures the Friend's own 16 × 16 silhouette (mass, eye holes, symmetry, walk motion, height,
  sparkles, ears or antennae, head size, legs) as ratios of its size; each measurement past a fixed cut-off is a pole
  (big eyes, light build, ...) with a strength 0.4 to 1, and the two strongest on different axes become the main quirk
  and a habit (none standing out: easygoing). Sixteen quirks with effects that scale with strength (need decay, walking
  speed, talk rate, loved activities, night snacks, humming, gift bonus); a quirk may overrule the family (a Bookworm Mask
  reads). The card shows each with its reason ("Big eyes, so it loves the stars"). Cut-offs are constants set from the
  ten tested Friends (`tests/pixel-traits.ts`); a Friend beyond them lands at full strength.
- **The food riddle.** Eight shop foods (`FOODS` in `sim.ts`, 1 RF a portion, eaten at the fridge, one action each). `FAMILY_FOOD` in `traits.ts`
  gives each family three liked and two disliked foods (shown on the card); a Friend loves one of its family's three (hash of the
  token) and dislikes the family's two: they become `food:<id>` loves and dislikes, so free will, refusals (a disliked food may be
  refused), hearts and wishes work like any activity. A loved food: +5 friendship and the favourite-snack secret; a disliked one: hunger
  barely filled and mood -10. The fridge at move-in varies by token: stocked (2 portions of its loved food), hunt (nothing special), picky
  (2 portions of a disliked food). The Friend sometimes wishes for "something tasty" (its loved food, at most once a game day, unnamed
  until the secret is found). Prices never change with personality.
- **Three secrets.** The card shows family, generation, temperament, heirloom, colour, catchphrase and the quirks with their
  reasons, and hides three traits until they are found: favourite thing (it does it), favourite snack (feed it the right food), birthday
  (talk to it). Each find: a line on screen, 3 friendship points, and the character card fills in.
- **One day, one arc.** No saves in the SDK sandbox, so a session is one day: at 22:00 a recap card (own choices and how
  many it loves, refusals, wishes, gifts, friendship, secrets found, a meme of the day).
- **Memes.** The camera: a random two-line meme in today's formats (gm/gn, POV, +1000 aura, let him cook, locked in, side
  quest, WAGMI, HODL) written from the Friend's character; the templates that fit the moment weigh more, and a meme never
  spoils a secret that is still hidden.
- **Sulking.** Left alone too long (no petting, talking, dinner, ball or Gift Box with you) it sulks and refuses your
  requests until you make up: pet it or talk to it (1 to 3 times, by character strength) or open a Gift Box. How soon
  depends on family (Homebody fastest, Introvert hardly ever) and generation.
- **Neighbours, simulated visits.** No multiplayer in the SDK: the front door opens a street of four real Generations Friends
  from a recorded snapshot (`street.json`, 35 Friends, all families and generations, built by `scripts/street.ts` from the SDK's
  pinned registry; picked from the Rare Royale roster; no owner data, no network read at play time because the SDK test harness
  allows reading only the chosen Friend): the three closest token numbers live next door, one is new this week (hash of the ISO
  week in UTC and the token ID); the generation is the one at the snapshot. The two SDK sample Friends are the fallback only if
  the snapshot is empty. The game plays them and labels every visit simulated. A visit is the neighbour's whole house in its
  family's style, run by a second engine: the neighbour lives there by itself (free will) and your Friend is the guest,
  who walks over for each thing you do together; hug, say hi, dance or share a snack, and both temperaments decide the
  reaction. Each engine puts its own home and colour into the shared drawing state before it builds or draws.
- **Family heirloom.** Each family brings one piece into the house (front of the living room) with its own loved
  activity: bone xylophone, mask stand, family photo table, cell garden, wobbly tower, cloud cushion, old boulder
  seat, mirror ball, quiet lantern.
- **Family home.** The same floor plan decorated per family (`homes.ts`): walls, wallpaper motif, floors, curtains,
  rugs, trim and furniture materials (light and dark wood, sofa and chair upholstery; heirlooms keep their own colours). Moonlit Manor (Skeleton, bone wallpaper), Backstage (Mask, harlequin diamonds), Cozy Cottage (Family, hearts), Greenhouse Lab (Cellular, cells), Funhouse (Asymmetry, zigzags), Cloud Loft (Hoverer, clouds and stars), Stone Lodge (Colossus, stone walls), Glam Suite (Sparkling, sparkles) and Quiet Library (Hollow, leaves). Neighbours' rooms use their own family's colours. Looks only.
- **Camera.** The game opens close on the Friend and follows it; the whole house is one tap away.
- **Weather.** Clear, cloudy, rain, snow or a storm in the windows (`weather.ts`), changing every 4 in-game hours;
  the street shares one sky, so a visit shows the same weather. Looks only.
- **Sound.** A composed tune per time of day, each with its own synthesized band (marimba morning, vibraphone
  swing, lo-fi Rhodes evening, music-box lullaby in 3/4, disco record for dancing); one-shots such as piano and
  twinkles take their notes from the chord the music is on.

## Controls

- Click / tap an object: action menu; the Friend walks there and does it.
- Click / tap the floor: walk there. Arrows / WASD: walk; E: use the nearest object; Esc: close.
- The zoom button: close up (the camera follows the Friend; the game starts here) or the whole house.
- The camera button: meme mode, a random two-line caption written from the Friend's own character (voice, temperament,
  quirk, heirloom, needs, current activity) over a clean snapshot of it; *Another meme* rolls again.
- Buy mode: arrows move the piece, R rotates, Enter places, Esc cancels.
- Home comfort: each piece with an activity it loves (beyond the house it moved into) makes its needs drop 6% slower,
  each piece it only dislikes 6% faster (between 30% slower and 24% faster); it grumbles about bought pieces it
  dislikes, and is glad or sorry when one is put away. The character card shows the comfort.
- Best friend on the street: the neighbour with the most good moments (good vibes or better) is named in the neighbours panel and in the day recap.
- Neighbours remember: the next visit is greeted by how the last one went; a good visit fills social (+35), an awkward
  one barely (+4); a shared snack comes out of your stock.

## Economy ($RAREFRIENDS, simulated in the preview)

- **Gift Box** (the SDK chance game, `game.json`): 1 RF. Opens one keepsake of five rarity tiers, which gives
  Friendship when opened. Kept keepsakes stand in the hutch; any keepsake can be sold back for RF (redeem).
- **Shop** (simulated RF spend): snacks and meals (consumed by the fridge and the stove), clothes, and
  furniture/decor for Buy mode. Spent RF is split 50% burned, 50% to Friend rewards (simulated, labeled); the shop foods (1 RF a portion) the same way, the birthday cake (3 RF) 100% burned. `ledger.ts` keeps the books per source (food, treats, cake, wardrobe, furniture); the HUD shows an *RF burned* counter and opens *Where your RF went* (spent, burned, to Friend rewards per source; the Gift Box stake separately).
- Every price and odd shown in the UI is read from code or `game.json`; tests check the docs against them.
- The RF prices are example values on the scale of the SDK's reference games (1 RF per consumable, about 0.90 RF
  back). To price higher, multiply every price and keepsake value by the same factor: odds, the 91.65% return and
  the balance between items stay the same.

## Scope for the vibeathon

House, camera, walking, depth sorting; needs and clock; 33 activities on 28 kinds of furniture plus nine
family heirlooms; 9 family homes; 9 temperaments with generation strength, per-token traits, wishes, refusals and voice lines;
shop, wardrobe, Gift Box; Buy mode with a nine-piece catalog; mobile layout; tests. No storage exists in the SDK sandbox: progress resets on reload.
