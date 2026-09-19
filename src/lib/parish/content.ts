export type StoryBeat = { title: string; body: string };

export type Story = {
  id: string;
  title: string;
  reference: string;
  hero: string;
  blurb: string;
  beats: StoryBeat[];
};

export const STORIES: Story[] = [
  {
    id: "creation",
    title: "Light in the dark",
    reference: "Genesis 1",
    hero: "The Maker",
    blurb: "God speaks, and a world appears.",
    beats: [
      { title: "Nothing yet", body: "Before houses, before trees, before your name — there was only God. He was not lonely. He chose to make a home." },
      { title: "Let there be light", body: "God spoke. Light ran across the dark. Day and night took their places like two friends sharing a room." },
      { title: "Sky, sea, seed", body: "He stretched a sky. He gathered seas. He filled the ground with seed that would keep giving bread." },
      { title: "Living things", body: "Fish took the water. Birds took the air. Cattle took the fields. Then God made people in His image — to care, to name, to walk with Him." },
      { title: "It was good", body: "On the seventh day He rested. The world was a gift, not an accident. You are part of that gift." },
    ],
  },
  {
    id: "ark",
    title: "The floating house",
    reference: "Genesis 6–9",
    hero: "Noah",
    blurb: "Rain falls. A family and the animals are kept.",
    beats: [
      { title: "A loud world", body: "People filled the earth with cruelty. God was grieved. He told Noah to build a great wooden house that could float." },
      { title: "Hammer and hope", body: "Noah obeyed when the sky was still dry. Neighbours laughed. The ark rose anyway." },
      { title: "Two by two", body: "Animals came. The door shut. Rain began — not a shower, a flood that covered the hills." },
      { title: "The dove", body: "Weeks later a dove brought an olive leaf. Dry ground was coming home." },
      { title: "A bow in the cloud", body: "God set a rainbow as a promise: the world would not be washed away like that again. Mercy has a colour." },
    ],
  },
  {
    id: "sea",
    title: "A path through water",
    reference: "Exodus 14",
    hero: "Moses",
    blurb: "The sea stands up so God’s people can walk.",
    beats: [
      { title: "Trapped", body: "Israel stood between soldiers and the sea. Fear said, go back. God said, stand still and see." },
      { title: "Lift the staff", body: "Moses stretched his hand. Wind tore a road of dry ground through the water, walls of sea on both sides." },
      { title: "Walk", body: "Families hurried through, children holding hands, the sea roaring like a held breath." },
      { title: "The chase ends", body: "The army followed. The waters returned. Israel sang on the other shore — free, not because they were strong, but because God made a way." },
    ],
  },
  {
    id: "giant",
    title: "Five stones",
    reference: "1 Samuel 17",
    hero: "David",
    blurb: "A shepherd boy faces a giant with a sling and a psalm.",
    beats: [
      { title: "The shout", body: "Goliath of Gath mocked Israel every morning. Soldiers hid. David the shepherd heard the name of God being laughed at." },
      { title: "Not armour", body: "Saul tried to dress him in a king’s mail. David took it off. He knew his sling. He knew his God." },
      { title: "For the living God", body: "You come with sword and spear, David said. I come in the name of the Lord of hosts." },
      { title: "One stone", body: "The stone flew. The giant fell. The valley learned that size is not the same as strength." },
    ],
  },
  {
    id: "lions",
    title: "The locked den",
    reference: "Daniel 6",
    hero: "Daniel",
    blurb: "Prayer is not stopped by a king’s law.",
    beats: [
      { title: "Windows open", body: "Daniel prayed toward Jerusalem three times a day, even when a new law said no one may pray except to the king." },
      { title: "The trap", body: "Jealous men caught him at the window. The king liked Daniel, but the law had his name on it." },
      { title: "Among lions", body: "The den was sealed. Night was long. At dawn the king called, and Daniel answered: God sent His angel. The mouths were shut." },
      { title: "A better law", body: "Daniel came out unhurt. The king learned what Daniel already knew — the living God rules, and prayer is worth the risk." },
    ],
  },
  {
    id: "fish",
    title: "The reluctant prophet",
    reference: "Jonah 1–3",
    hero: "Jonah",
    blurb: "A man runs from God and meets a great fish.",
    beats: [
      { title: "Go to Nineveh", body: "God sent Jonah to a city he did not love. Jonah bought a ticket the other way and slept in the hold." },
      { title: "The storm", body: "The sea stood up. Sailors threw cargo, then lots. Jonah said, throw me in. The sea went still." },
      { title: "Three days", body: "A great fish swallowed him. In the dark Jonah prayed. God spoke to the fish, and it spat him onto dry land." },
      { title: "Yet forty days", body: "Jonah walked Nineveh with a short sermon. The city turned. God had mercy — even on people Jonah wanted to stay angry at." },
    ],
  },
  {
    id: "manger",
    title: "A child in the night",
    reference: "Luke 2",
    hero: "Mary",
    blurb: "Heaven’s King arrives in a feeding trough.",
    beats: [
      { title: "No room", body: "Mary and Joseph came to Bethlehem for a census. The town was full. They laid the baby in a manger." },
      { title: "Shepherds", body: "Night-watch men saw the sky tear open with song: glory to God, peace on earth. They ran to see." },
      { title: "The sign", body: "A child wrapped in cloths. Not a palace. God had come close enough to hold." },
      { title: "Mary kept these things", body: "She treasured the night in her heart. The story did not end in the stable. It began there." },
    ],
  },
  {
    id: "tomb",
    title: "The stone rolled",
    reference: "John 20",
    hero: "Mary Magdalene",
    blurb: "Sunday morning breaks the last enemy.",
    beats: [
      { title: "Before dawn", body: "Mary Magdalene came to the tomb while it was still dark. The stone was gone. She ran to tell the others." },
      { title: "Linen, empty", body: "Peter and John looked in. Cloths lay folded. The body was not stolen in a hurry. Something else had happened." },
      { title: "Gardener?", body: "Mary wept. A man asked why. She thought He was the gardener until He said her name." },
      { title: "Go and tell", body: "Rabboni. Teacher. Alive. She became the first witness: I have seen the Lord. Death did not keep Him." },
    ],
  },
];

export type Riddle = { id: string; clue: string; answer: string; hint: string };

export const RIDDLES: Riddle[] = [
  { id: "r1", clue: "I built a boat before it rained. Who am I?", answer: "Noah", hint: "Rainbow" },
  { id: "r2", clue: "I faced a giant with a sling. Who am I?", answer: "David", hint: "Shepherd" },
  { id: "r3", clue: "The sea split when I lifted my staff. Who am I?", answer: "Moses", hint: "Exodus" },
  { id: "r4", clue: "Lions did not eat me because I prayed. Who am I?", answer: "Daniel", hint: "Windows" },
  { id: "r5", clue: "A great fish kept me three days. Who am I?", answer: "Jonah", hint: "Nineveh" },
  { id: "r6", clue: "I laid my firstborn in a manger. Who am I?", answer: "Mary", hint: "Bethlehem" },
  { id: "r7", clue: "I betrayed my friend for silver. Who am I?", answer: "Judas", hint: "Thirty" },
  { id: "r8", clue: "I denied Him three times before a rooster. Who am I?", answer: "Peter", hint: "Rock" },
  { id: "r9", clue: "I helped a beaten traveller when others walked past. Who am I?", answer: "Samaritan", hint: "Neighbour" },
  { id: "r10", clue: "I interpreted dreams in Egypt and forgave my brothers. Who am I?", answer: "Joseph", hint: "Coat" },
  { id: "r11", clue: "I was a queen who risked the throne for my people. Who am I?", answer: "Esther", hint: "If I perish" },
  { id: "r12", clue: "I baptised Jesus in the Jordan. Who am I?", answer: "John", hint: "Forerunner" },
];

export type Pair = { id: string; a: string; b: string };

export const PAIRS: Pair[] = [
  { id: "p1", a: "Noah", b: "Ark" },
  { id: "p2", a: "David", b: "Sling" },
  { id: "p3", a: "Moses", b: "Staff" },
  { id: "p4", a: "Daniel", b: "Lions" },
  { id: "p5", a: "Jonah", b: "Fish" },
  { id: "p6", a: "Mary", b: "Manger" },
  { id: "p7", a: "Peter", b: "Net" },
  { id: "p8", a: "Jesus", b: "Cross" },
];

export type KidQuiz = { id: string; prompt: string; options: string[]; answer: string };

export const KID_QUIZ: KidQuiz[] = [
  { id: "q1", prompt: "Who built the ark?", options: ["Moses", "Noah", "Jonah", "Paul"], answer: "Noah" },
  { id: "q2", prompt: "Where was Jesus born?", options: ["Nazareth", "Rome", "Bethlehem", "Jericho"], answer: "Bethlehem" },
  { id: "q3", prompt: "How many days was Jonah in the fish?", options: ["One", "Three", "Seven", "Forty"], answer: "Three" },
  { id: "q4", prompt: "Who killed Goliath?", options: ["Saul", "Samson", "David", "Solomon"], answer: "David" },
  { id: "q5", prompt: "What did God create first?", options: ["Animals", "Light", "People", "Rain"], answer: "Light" },
  { id: "q6", prompt: "Who was thrown into the lions’ den?", options: ["Daniel", "David", "Joseph", "Elijah"], answer: "Daniel" },
  { id: "q7", prompt: "Jesus fed a crowd with loaves and…", options: ["Dates", "Fish", "Honey", "Figs"], answer: "Fish" },
  { id: "q8", prompt: "On which day did Jesus rise?", options: ["Friday", "Saturday", "Sunday", "Monday"], answer: "Sunday" },
  { id: "q9", prompt: "Who led Israel through the Red Sea?", options: ["Aaron", "Joshua", "Moses", "Caleb"], answer: "Moses" },
  { id: "q10", prompt: "What is the first book of the Bible?", options: ["Exodus", "Matthew", "Psalms", "Genesis"], answer: "Genesis" },
];

export const SUNDAY_ACTS = [
  { id: "present", label: "I came to church" },
  { id: "sang", label: "I sang with the class" },
  { id: "verse", label: "I said a verse" },
  { id: "kind", label: "I did one kind thing" },
  { id: "listen", label: "I listened in the lesson" },
] as const;

export type Hymn = { id: string; title: string; lines: string[] };

export const HYMNS: Hymn[] = [
  {
    id: "loves",
    title: "Jesus loves me",
    lines: [
      "Jesus loves me, this I know,",
      "for the Bible tells me so.",
      "Little ones to Him belong;",
      "they are weak, but He is strong.",
      "Yes, Jesus loves me.",
      "The Bible tells me so.",
    ],
  },
  {
    id: "grace",
    title: "Amazing grace",
    lines: [
      "Amazing grace! how sweet the sound",
      "that saved a wretch like me.",
      "I once was lost, but now am found;",
      "was blind, but now I see.",
    ],
  },
  {
    id: "faithful",
    title: "Great is Thy faithfulness",
    lines: [
      "Great is Thy faithfulness, O God my Father.",
      "There is no shadow of turning with Thee.",
      "Morning by morning new mercies I see.",
      "All I have needed Thy hand hath provided.",
    ],
  },
];

export type ParishDesk = {
  stars: number;
  storiesRead: string[];
  heroes: string[];
  sunday: Record<string, string[]>;
  prayers: { id: string; text: string; at: string }[];
  bestWho: number;
  bestMatch: number;
  bestRace: number;
};

export const EMPTY_PARISH: ParishDesk = {
  stars: 0,
  storiesRead: [],
  heroes: [],
  sunday: {},
  prayers: [],
  bestWho: 0,
  bestMatch: 0,
  bestRace: 0,
};

export function storyById(id: string) {
  return STORIES.find((s) => s.id === id);
}
