# Rare Friends: Friend Nook — design

Vibeathon category: **Character Spotlight**. Built with FriendSDK v0.1.2.

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
| 9 | Breakfast bar | Eat at the bar | Hunger |
| 10 | Dining table | Family dinner with you | Hunger, Social |
| 11 | TV | Watch TV / Play games | Fun |
| 12 | Sofa | Sit / Nap | Energy, Fun |
| 13 | Bookshelf | Pick a book | Fun |
| 14 | Reading chair | Read | Fun |
| 15 | Record player | Dance | Fun |
| 16 | Ball | Play ball with you | Fun, Social |
| 17 | Keepsake hutch | Keepsakes (gift collection) | — |
| 18 | The Friend | Pet / Talk / Open a gift | Social |

## Needs

Hunger, Energy, Fun, Hygiene, Social: 0–100, decaying per in-game hour. Mood is their weighted average
plus temperament modifiers. One in-game day lasts about 8 real minutes at 1× speed (pause, 1×, 3×).

## Character (the core)

| Family | Temperament | Loves | Dislikes | Quirk |
|---|---|---|---|---|
| Skeleton | Night owl | stargazing, TV at night, milk | baths | more energy at night |
| Mask | Performer | mirror, wardrobe, dancing | reading | mood swings faster |
| Family | Homebody | family dinner, pets, gifts | being alone | Social drops faster |
| Cellular | Foodie | cooking, snacks | skipping meals | Hunger drops faster |
| Asymmetry | Chaos gremlin | toys, dancing, games | sitting still | Fun drops faster |
| Hoverer | Dreamer | window seat, sleep | chores | sleeps longer |
| Colossus | Gentle giant | sofa, big meals | small chairs | moves slowly |
| Sparkling | Style icon | bath, mirror, outfits, gifts | mess | Hygiene matters more |
| Hollow | Introvert | books, reading chair | dancing, loud TV | Social drops slower |

- **Generation = character strength.** Gen 1 is the strongest (bigger preferences, more refusals of
  disliked actions, a signature idle), Gen 6 the mildest. Every generation plays the full game.
- **Free will.** When the player gives no orders, the Friend picks what to do by need urgency × taste.
- **Refusals.** Ordering a disliked action can get a "Nope" (chance grows with character strength).
- **Wishes.** A thought bubble shows a wish drawn from the Friend's likes. Fulfilling it gives
  Friendship points; Friendship levels unlock furniture and titles.
- **Voice.** Short speech lines and emotes per family (talk, idle, reactions to gifts and food).
- **The token itself.** Each trait is its own hash of the sprite seed and token ID: nickname, favourite colour
  (blanket, cushion, rug), a favourite activity outside the family's loves, snack, birthday, catchphrase and one
  of twelve quirks with real effects; a quirk may overrule the family (a Bookworm Mask reads).
- **Sound.** A composed tune per time of day, each with its own synthesized band (marimba morning, vibraphone
  swing, lo-fi Rhodes evening, music-box lullaby in 3/4, disco record for dancing); one-shots such as piano and
  twinkles take their notes from the chord the music is on.

## Controls

- Click / tap an object: action menu; the Friend walks there and does it.
- Click / tap the floor: walk there. Arrows / WASD: walk; E: use the nearest object; Esc: close.
- Mouse wheel / pinch or the zoom button: two zoom levels.

## Economy ($RAREFRIENDS, simulated in the preview)

- **Gift Box** (the SDK chance game, `game.json`): 1 RF. Opens one keepsake of five rarity tiers. Kept
  keepsakes sit on the hutch and give a Friendship bonus; any keepsake can be sold back for RF (redeem).
- **Shop** (simulated RF spend): snacks and meals (consumed by the fridge and the stove), clothes, and
  furniture/decor for Buy mode. Spent RF is split 50% burned, 50% to Friend rewards (simulated, labeled).
- Every price and odd shown in the UI is read from code or `game.json`; tests check the docs against them.

## Scope for the vibeathon

House, camera, walking, depth sorting; needs and clock; 18 interactions; 9 temperaments with
generation strength, wishes, refusals and voice lines; shop, wardrobe, Gift Box; Buy mode with a small
decor catalog; mobile layout; tests. No storage exists in the SDK sandbox: progress resets on reload.
