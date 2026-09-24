/** Character: the Friend's sprite family decides its temperament (likes, dislikes, how fast each need drops,
 * how it talks); its Generation decides how strong that character is. Gen 1 = strongest, Gen 6 = mildest.
 * Personality only changes behaviour and flavour. It never changes prices, odds, rewards, or who may play. */
import type { NeedKey } from "./sim.js";

export type Temperament = Readonly<{
  family: string;
  title: string;          // temperament name
  blurb: string;
  loves: readonly string[];    // action ids
  dislikes: readonly string[]; // action ids
  decay: Readonly<Partial<Record<NeedKey, number>>>; // multipliers on need decay
  nightOwl?: boolean;     // Skeleton: energy drains slower at night, faster by day
  speed: number;          // walking speed multiplier
  voice: Readonly<{ hello: readonly string[]; idle: readonly string[]; love: readonly string[]; nope: readonly string[]; hungry: string; tired: string; bored: string; grubby: string; lonely: string }>;
}>;

export const TEMPERAMENTS: Readonly<Record<string, Temperament>> = {
  Skeleton: { family: "Skeleton", title: "Night Owl", blurb: "Wakes up when the stars do. Dry humour, strong bones.",
    loves: ["stargaze", "tv", "snack", "telescope"], dislikes: ["bath"], decay: { hygiene: .7 }, nightOwl: true, speed: 1,
    voice: { hello: ["Oh, it's you. Good. The night is young."], idle: ["Is it night yet?", "I've got a bone to pick with the sun.", "Milk. For the bones."], love: ["Now we're talking.", "Spine-tingling!"], nope: ["Water? On my bones? No.", "I'll pass. Rattle rattle."], hungry: "My ribs are showing. More than usual.", tired: "Even skeletons need a nap.", bored: "Bored to the bone.", grubby: "I'm dusty. That's my style.", lonely: "Stay a while. It's quiet in here." } },
  Mask: { family: "Mask", title: "Performer", blurb: "Every room is a stage. Changes moods as fast as outfits.",
    loves: ["admire", "dress", "dance", "primp", "paint"], dislikes: ["read", "book"], decay: { fun: 1.3, social: 1.2 }, speed: 1.05,
    voice: { hello: ["Ta-da! Your favourite star is here."], idle: ["Is that my best side?", "Applause is also food.", "I need a costume change."], love: ["Bravo! Encore!", "A star is born. Again."], nope: ["Books? No audience there.", "Boring script. Pass."], hungry: "A hungry star can't shine.", tired: "Curtain call... I need sleep.", bored: "Where is my audience?", grubby: "I can't go on stage like this!", lonely: "A show needs a crowd. Play with me?" } },
  Family: { family: "Family", title: "Homebody", blurb: "Happiest at the dinner table with you. Hates being alone.",
    loves: ["dinner", "pet", "talk", "ball", "piano"], dislikes: [], decay: { social: 1.5 }, speed: 1,
    voice: { hello: ["You're home! I saved you a seat."], idle: ["Dinner together later?", "Home is where you are.", "Tell me about your day!"], love: ["This is the best.", "Together is better."], nope: ["Only if you stay with me."], hungry: "Shall we eat together?", tired: "Tuck me in?", bored: "Play with me?", grubby: "Bath time, then hugs.", lonely: "I missed you. Stay?" } },
  Cellular: { family: "Cellular", title: "Foodie", blurb: "Grows by the snack. Knows every shelf in the fridge.",
    loves: ["cook", "snack", "bar", "dinner", "fish"], dislikes: [], decay: { hunger: 1.6 }, speed: 1,
    voice: { hello: ["Hi! Did you bring snacks?"], idle: ["I could eat.", "What's for dinner?", "Divide and snack."], love: ["Mmm! Chef's kiss.", "Nom nom nom."], nope: ["Not now, I'm digesting."], hungry: "Hungry! So hungry!", tired: "Food coma incoming.", bored: "Let's cook something!", grubby: "I've got sauce everywhere.", lonely: "Eating alone is sad." } },
  Asymmetry: { family: "Asymmetry", title: "Chaos Gremlin", blurb: "Can't sit still. Toys everywhere, music loud.",
    loves: ["toys", "dance", "games", "ball", "arcade", "piano"], dislikes: ["sit", "read", "lounge"], decay: { fun: 1.6, energy: 1.2 }, speed: 1.25,
    voice: { hello: ["Hey hey hey! Let's break something! Kidding."], idle: ["Zoom!", "What does this button do?", "Left, right, left, left!"], love: ["Wheee!", "Again! Again!"], nope: ["Sit still? Impossible.", "Nope, too calm."], hungry: "Fuel! I need fuel!", tired: "Battery at one percent.", bored: "BORED. Bored bored bored.", grubby: "Mud is a lifestyle.", lonely: "Chase me!" } },
  Hoverer: { family: "Hoverer", title: "Dreamer", blurb: "Floats through the day, lives for starry nights and soft beds.",
    loves: ["stargaze", "sleep", "nap", "telescope"], dislikes: ["cook"], decay: { energy: 1.3, fun: .9 }, speed: .95,
    voice: { hello: ["Oh... hello. I was dreaming about you."], idle: ["The clouds look soft today.", "Can we look at the stars?", "Floating is the best feeling."], love: ["Dreamy...", "Like floating on a cloud."], nope: ["Cooking? Too much gravity.", "Maybe after a nap."], hungry: "Something light, please.", tired: "Sleepy... so sleepy...", bored: "I want to see the stars.", grubby: "A bubble bath would be nice.", lonely: "Stay and dream with me." } },
  Colossus: { family: "Colossus", title: "Gentle Giant", blurb: "Big, slow and soft-hearted. The sofa is its throne.",
    loves: ["sit", "tv", "dinner", "nap", "lounge"], dislikes: ["bar", "toys"], decay: { hunger: 1.3, energy: 1.1 }, speed: .75,
    voice: { hello: ["Hello, little friend. Mind the doorway."], idle: ["Slow and steady.", "This sofa gets me.", "Big day. Big snack."], love: ["Cosy.", "Ahh. Perfect."], nope: ["Those stools are too small.", "Tiny toys. Big paws."], hungry: "Need a big meal.", tired: "Time to hibernate.", bored: "A little TV?", grubby: "Big body, big bath.", lonely: "Sit with me?" } },
  Sparkling: { family: "Sparkling", title: "Style Icon", blurb: "Always shining. Loves baths, mirrors, outfits and gifts.",
    loves: ["bath", "admire", "dress", "gift", "primp"], dislikes: ["toys"], decay: { hygiene: 1.6, fun: 1.1 }, speed: 1,
    voice: { hello: ["Hi, gorgeous! Do I sparkle today?"], idle: ["Shine on.", "Is there glitter in my eye?", "New outfit, new me."], love: ["Fabulous!", "I'm sparkling!"], nope: ["Toys? And get dusty?", "Not in this outfit."], hungry: "A fancy snack, please.", tired: "Beauty sleep time.", bored: "Let's go shopping!", grubby: "I'm NOT sparkling. Bath!", lonely: "Tell me I look great?" } },
  Hollow: { family: "Hollow", title: "Introvert", blurb: "Quiet corners, good books, and no loud music, thanks.",
    loves: ["read", "book", "stargaze", "fish", "paint"], dislikes: ["dance", "games", "arcade"], decay: { social: .6, fun: .9 }, speed: .95,
    voice: { hello: ["...Hi. Nice to see you. Quietly."], idle: ["Chapter twelve was good.", "Shh. The house is thinking.", "I like this corner."], love: ["Peaceful.", "Just right."], nope: ["Too loud. No thanks.", "Maybe another time. Or never."], hungry: "A quiet snack?", tired: "I'll curl up now.", bored: "Got any new books?", grubby: "A calm bath, maybe.", lonely: "You can stay. If you're quiet." } },
};

/** Unknown or unlisted families fall back to a balanced temperament. */
export const BALANCED: Temperament = { family: "Unknown", title: "Easygoing", blurb: "Takes life as it comes.", loves: ["ball", "tv"], dislikes: [], decay: {}, speed: 1,
  voice: { hello: ["Hi there!"], idle: ["What a nice house.", "La la la."], love: ["Yay!"], nope: ["Not now."], hungry: "I'm hungry.", tired: "I'm sleepy.", bored: "I'm bored.", grubby: "I need a wash.", lonely: "Play with me?" } };

export const temperamentFor = (family: string | null): Temperament => (family && TEMPERAMENTS[family]) || BALANCED;

/** Character strength 0…1 from the Generation: Gen 1 → 1.0 … Gen 6 → 0.17; unknown → 0.5. */
export const strengthOf = (generation: number | null) => (generation && generation >= 1 && generation <= 6 ? (7 - generation) / 6 : .5);
export const STRENGTH_LABEL = (s: number) => (s >= .95 ? "Legendary" : s >= .8 ? "Strong" : s >= .6 ? "Distinct" : s >= .4 ? "Clear" : s >= .25 ? "Gentle" : "Mild");

/** How much this Friend wants an action: loved actions are boosted, disliked ones damped, by strength. */
export function preference(t: Temperament, strength: number, action: string): number {
  if (t.loves.includes(action)) return 1 + .8 * strength + .2;
  if (t.dislikes.includes(action)) return Math.max(.1, .7 - .6 * strength);
  return 1;
}
/** Chance to refuse an ordered action it dislikes. */
export const refuseChance = (t: Temperament, strength: number, action: string) => (t.dislikes.includes(action) ? .2 + .45 * strength : 0);

/** Friendship: points from actions, wishes, gifts and new furniture it loves. Levels are titles only. */
export const BOND_LEVELS = [0, 15, 40, 80, 140, 220, 320, 450, 600, 800] as const;
export const BOND_TITLES = ["Stranger", "Acquaintance", "Buddy", "Pal", "Good Friend", "Close Friend", "Best Friend", "Soulmate", "Family", "Forever Friend"] as const;
export const bondLevel = (points: number) => { let l = 0; for (let i = 0; i < BOND_LEVELS.length; i++) if (points >= BOND_LEVELS[i]) l = i; return l; };
