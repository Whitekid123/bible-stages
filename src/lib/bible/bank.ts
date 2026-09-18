import { hashString, seededRng, shuffle } from "@/lib/utils";
import type { Question, SectionId, StageId } from "./types";

type Seed = {
  prompt: string;
  answer: string;
  distractors: string[];
  aliases?: string[];
  reference?: string;
  blank?: string;
};

let seq = 0;

function make(
  stage: StageId,
  section: SectionId,
  seed: {
    prompt: string;
    answer: string;
    distractors: string[];
    aliases?: string[];
    reference?: string;
  },
): Question {
  seq += 1;
  const id = `${stage}-${section}-${seq}`;
  const rand = seededRng(hashString(id));
  const options = shuffle([seed.answer, ...seed.distractors.slice(0, 3)], rand);
  return {
    id,
    stage,
    section,
    prompt: seed.prompt,
    options,
    answer: seed.answer,
    aliases: seed.aliases ?? [],
    reference: seed.reference,
  };
}

function take(stage: StageId, section: SectionId, seeds: Seed[], count: number): Question[] {
  const out: Question[] = [];
  for (const seed of seeds) {
    if (out.length >= count) break;
    const prompt = section === "blank" && seed.blank ? seed.blank : seed.prompt;
    if (section === "blank" && !seed.blank) continue;
    out.push(
      make(stage, section, {
        prompt,
        answer: seed.answer,
        distractors: seed.distractors,
        aliases: seed.aliases,
        reference: seed.reference,
      }),
    );
  }
  return out;
}

const GOD = ["a king", "the wind", "an angel"];
const PEOPLE = ["Moses", "David", "Jonah", "Noah", "Abraham", "Peter", "Paul"];

const LITTLE: Seed[] = [
  { prompt: "Who made the world?", answer: "God", distractors: GOD, blank: "______ made the world.", aliases: ["the lord", "lord", "jehovah"] },
  { prompt: "Who made you?", answer: "God", distractors: ["my teacher", "the king", "a star"], blank: "______ made you." },
  { prompt: "Who made the sun?", answer: "God", distractors: ["the moon", "fire", "people"] },
  { prompt: "Who made the moon?", answer: "God", distractors: ["the sun", "the sea", "a king"] },
  { prompt: "Who made the stars?", answer: "God", distractors: ["night", "people", "birds"] },
  { prompt: "Who made the trees?", answer: "God", distractors: ["farmers only", "the rain", "the wind"] },
  { prompt: "Who made the fish?", answer: "God", distractors: ["the sea", "Noah", "boats"] },
  { prompt: "Who made the birds?", answer: "God", distractors: ["the sky", "trees", "people"] },
  { prompt: "Who made the animals?", answer: "God", distractors: ["Noah", "Adam", "the ark"] },
  { prompt: "Who made the flowers?", answer: "God", distractors: ["bees", "rain", "people"] },
  { prompt: "God is ______.", answer: "love", distractors: ["mean", "asleep", "lost"], blank: "God is ______.", aliases: ["loving"] },
  { prompt: "The Bible is ______.", answer: "God's Word", distractors: ["a newspaper", "a toy book", "a map only"], blank: "The Bible is ______.", aliases: ["gods word", "the word of god", "scripture", "holy bible"] },
  { prompt: "We talk to God by ______.", answer: "prayer", distractors: ["shouting at the sky", "running", "sleeping"], blank: "We talk to God by ______.", aliases: ["praying", "prayers"] },
  { prompt: "Who is God's Son?", answer: "Jesus", distractors: ["Moses", "David", "Noah"], blank: "God's Son is ______.", aliases: ["jesus christ", "christ", "jesus christ of nazareth"] },
  { prompt: "Jesus loves ______.", answer: "children", distractors: ["only kings", "only angels", "no one"], aliases: ["kids", "little children"] },
  { prompt: "Jesus loves you. Is that true?", answer: "Yes", distractors: ["No", "Only on Sundays", "Only kings"] },
  { prompt: "Where was baby Jesus born?", answer: "Bethlehem", distractors: ["Egypt", "Rome", "the sea"], blank: "Baby Jesus was born in ______." },
  { prompt: "Baby Jesus slept in a ______.", answer: "manger", distractors: ["palace", "boat", "tent"], blank: "Baby Jesus slept in a ______.", aliases: ["a manger", "feeding trough"] },
  { prompt: "Who was the mother of Jesus?", answer: "Mary", distractors: ["Hannah", "Ruth", "Esther"], blank: "The mother of Jesus was ______." },
  { prompt: "Who was the earthly father of Jesus?", answer: "Joseph", distractors: ["David", "Peter", "Moses"] },
  { prompt: "What did the shepherds come to see?", answer: "Baby Jesus", distractors: ["a king in a palace", "a giant", "the ark"] },
  { prompt: "A bright ______ led the wise men.", answer: "star", distractors: ["lamp", "rainbow", "cloud"], blank: "A bright ______ led the wise men." },
  { prompt: "Who built the ark?", answer: "Noah", distractors: ["Moses", "David", "Jonah"], blank: "______ built the ark." },
  { prompt: "What did Noah put on the ark?", answer: "Animals", distractors: ["Cars", "Gold only", "Soldiers"] },
  { prompt: "How many of each kind of animal went on the ark?", answer: "Two", distractors: ["Ten", "One hundred", "Seven hundred"], aliases: ["2", "two of each"] },
  { prompt: "After the flood, God set a ______ in the sky.", answer: "rainbow", distractors: ["ladder", "sword", "crown"], blank: "After the flood God set a ______ in the sky." },
  { prompt: "The rainbow is a sign of God's ______.", answer: "promise", distractors: ["anger", "sleep", "joke"] },
  { prompt: "David fought a giant named ______.", answer: "Goliath", distractors: ["Pharaoh", "Jonah", "Herod"], blank: "David fought a giant named ______." },
  { prompt: "What did David use to fight Goliath?", answer: "A sling and a stone", distractors: ["A sword from a king", "A chariot", "A net"] },
  { prompt: "Daniel was put in a den of ______.", answer: "lions", distractors: ["snakes", "dogs", "birds"], blank: "Daniel was put in a den of ______." },
  { prompt: "Who kept Daniel safe?", answer: "God", distractors: ["the king", "the lions", "soldiers"] },
  { prompt: "Jonah was swallowed by a great ______.", answer: "fish", distractors: ["whale trainer", "lion", "bird"], blank: "Jonah was swallowed by a great ______.", aliases: ["whale", "great fish", "big fish"] },
  { prompt: "God told Jonah to go to ______.", answer: "Nineveh", distractors: ["Rome", "Bethlehem", "Egypt"] },
  { prompt: "Moses led God's people out of ______.", answer: "Egypt", distractors: ["Rome", "Babylon", "Spain"], blank: "Moses led God's people out of ______." },
  { prompt: "God parted the ______ for Moses and the people.", answer: "Red Sea", distractors: ["Jordan only", "the clouds", "a river of gold"], aliases: ["red sea", "the red sea"] },
  { prompt: "God gave Moses the Ten ______.", answer: "Commandments", distractors: ["Coins", "Crowns", "Boats"] },
  { prompt: "Adam was the first ______.", answer: "man", distractors: ["king", "angel", "fish"], blank: "Adam was the first ______." },
  { prompt: "Eve was the first ______.", answer: "woman", distractors: ["queen", "bird", "teacher"], blank: "Eve was the first ______." },
  { prompt: "Adam and Eve lived in the Garden of ______.", answer: "Eden", distractors: ["Gethsemane", "Olives", "Jericho"] },
  { prompt: "Joseph had a coat of many ______.", answer: "colours", distractors: ["holes", "stones", "buttons"], aliases: ["colors", "color", "colour"] },
  { prompt: "Jesus healed ______ people.", answer: "sick", distractors: ["angry", "invisible", "wooden"] },
  { prompt: "Jesus fed a big crowd with loaves and ______.", answer: "fish", distractors: ["stones", "apples", "coins"] },
  { prompt: "How many loaves did Jesus use to feed the crowd?", answer: "Five", distractors: ["Fifty", "Two", "Twelve"], aliases: ["5"] },
  { prompt: "How many fish did Jesus use to feed the crowd?", answer: "Two", distractors: ["Twenty", "Seven", "One"], aliases: ["2"] },
  { prompt: "Jesus stopped a storm on the ______.", answer: "sea", distractors: ["mountain", "desert", "road"] },
  { prompt: "Jesus walked on the ______.", answer: "water", distractors: ["clouds", "fire", "sand"], blank: "Jesus walked on the ______." },
  { prompt: "Zacchaeus climbed a ______ to see Jesus.", answer: "tree", distractors: ["wall", "camel", "roof"], blank: "Zacchaeus climbed a ______ to see Jesus." },
  { prompt: "A lost sheep was found by the ______.", answer: "shepherd", distractors: ["soldier", "king", "baker"] },
  { prompt: "The Good Samaritan helped a hurt ______.", answer: "man", distractors: ["lion", "boat", "star"] },
  { prompt: "Jesus died on a ______.", answer: "cross", distractors: ["bed", "throne", "boat"], blank: "Jesus died on a ______." },
  { prompt: "On the third day, Jesus ______.", answer: "rose from the dead", distractors: ["sailed away", "hid in Egypt", "became a king in Rome"], aliases: ["rose again", "rose", "came back to life", "was raised", "resurrected"] },
  { prompt: "At Easter we remember that Jesus is ______.", answer: "alive", distractors: ["asleep", "lost", "angry"] },
  { prompt: "At Christmas we remember the birth of ______.", answer: "Jesus", distractors: ["Moses", "David", "Noah"] },
  { prompt: "How should we treat other people?", answer: "With love", distractors: ["With unkind words", "By hiding", "By ignoring them"] },
  { prompt: "God can ______ us when we pray.", answer: "hear", distractors: ["forget", "fear", "leave"] },
  { prompt: "God is always ______.", answer: "with us", distractors: ["too busy", "far away forever", "asleep"] },
  { prompt: "The first people were ______.", answer: "Adam and Eve", distractors: ["David and Goliath", "Mary and Joseph", "Noah and Jonah"] },
  { prompt: "Who shut the door of the ark?", answer: "God", distractors: ["Noah's sons", "the animals", "the king"] },
  { prompt: "Samuel heard God call his ______.", answer: "name", distractors: ["dog", "king", "boat"] },
  { prompt: "Hannah prayed for a ______.", answer: "son", distractors: ["palace", "horse", "crown"] },
  { prompt: "Baby Moses was placed in a ______ on the river.", answer: "basket", distractors: ["chariot", "ark of gold", "tent"], blank: "Baby Moses was placed in a ______." },
  { prompt: "The wise men brought gifts to ______.", answer: "Jesus", distractors: ["Herod", "Pharaoh", "Pilate"] },
  { prompt: "Jesus said, Let the little children ______.", answer: "come to me", distractors: ["go away", "be quiet forever", "stay outside"] },
  { prompt: "We go to church to ______ God.", answer: "worship", distractors: ["hide from", "forget", "scare"], aliases: ["praise", "honour", "honor", "love"] },
  { prompt: "God wants us to tell the ______.", answer: "truth", distractors: ["jokes only", "secrets of others", "lies"] },
  { prompt: "God wants us to ______ our parents.", answer: "honour", distractors: ["ignore", "fear forever", "leave"], aliases: ["honor", "obey", "respect"] },
  { prompt: "Light was made on the first ______.", answer: "day", distractors: ["year", "night only", "week"] },
  { prompt: "On the seventh day God ______.", answer: "rested", distractors: ["made the sea", "made people twice", "hid"], blank: "On the seventh day God ______." },
  { prompt: "Jesus is sometimes called the Good ______.", answer: "Shepherd", distractors: ["Soldier", "Farmer", "Pilot"] },
  { prompt: "Jesus is the ______ of the world.", answer: "light", distractors: ["storm", "shadow", "king of Egypt"] },
  { prompt: "People followed Jesus because he ______ them.", answer: "loved", distractors: ["taxed", "forgot", "chased"] },
  { prompt: "A kind person in Jesus' story was the Good ______.", answer: "Samaritan", distractors: ["Pharaoh", "Giant", "Pirate"] },
  { prompt: "The Bible tells us about ______.", answer: "God", distractors: ["the weather only", "sports only", "cooking only"] },
  { prompt: "Prayer can be as simple as saying ______.", answer: "thank you, God", distractors: ["go away", "I am the king", "silence forever"] },
  { prompt: "Who opened the lions' mouths? Nobody — God kept them ______.", answer: "shut", distractors: ["singing", "dancing", "lost"] },
  { prompt: "Noah was a man who ______ God.", answer: "obeyed", distractors: ["hid from", "forgot", "fought"] },
  { prompt: "Mary wrapped baby Jesus in ______.", answer: "swaddling cloths", distractors: ["a king's robe", "leaves", "armour"], aliases: ["cloths", "swaddling clothes", "clothes"] },
  { prompt: "Angels told the shepherds, Do not be ______.", answer: "afraid", distractors: ["happy", "late", "hungry"] },
  { prompt: "Jesus grew up in ______.", answer: "Nazareth", distractors: ["Rome", "Babylon", "Nineveh"] },
  { prompt: "Peter was a ______ before he followed Jesus.", answer: "fisherman", distractors: ["soldier", "king", "farmer"] },
  { prompt: "Jesus called Peter to ______ him.", answer: "follow", distractors: ["fight", "tax", "leave"] },
  { prompt: "God cares when we are ______.", answer: "sad", distractors: ["only when we are kings", "never", "only at night"] },
  { prompt: "We should ______ with others.", answer: "share", distractors: ["hide food", "shout", "run away"] },
  { prompt: "The first book of the Bible is ______.", answer: "Genesis", distractors: ["Matthew", "Psalms", "Exodus"] },
  { prompt: "Genesis means ______.", answer: "beginnings", distractors: ["endings", "songs", "laws"], aliases: ["beginning", "origin", "origins"] },
  { prompt: "Who closed the mouths of the lions?", answer: "God", distractors: ["Daniel", "the king", "an army"] },
  { prompt: "Jesus is ______.", answer: "alive", distractors: ["only a story", "gone forever", "a giant"] },
  { prompt: "God made day and ______.", answer: "night", distractors: ["chariots", "coins", "palaces"] },
  { prompt: "The ark floated on the ______.", answer: "water", distractors: ["sand", "clouds", "grass"] },
  { prompt: "A dove brought Noah an ______ leaf.", answer: "olive", distractors: ["gold", "palm only", "fig cake"] },
  { prompt: "Jesus blessed the little ______.", answer: "children", distractors: ["soldiers", "coins", "boats"] },
  { prompt: "We sing to God because we are ______.", answer: "glad", distractors: ["angry at him", "lost forever", "kings only"], aliases: ["happy", "joyful", "thankful"] },
  { prompt: "The Bible says God so loved the ______.", answer: "world", distractors: ["stars only", "sea only", "kings only"] },
  { prompt: "John 3:16 is about God's ______.", answer: "love", distractors: ["boats", "taxes", "giants"] },
  { prompt: "When we do wrong, we should say ______.", answer: "sorry", distractors: ["I won", "hide it", "blame others"], aliases: ["i am sorry", "sorry god", "forgive me"] },
  { prompt: "God can ______ us when we say sorry.", answer: "forgive", distractors: ["forget us", "laugh at us", "leave us"] },
  { prompt: "A church is a place to ______ about God.", answer: "learn", distractors: ["sleep only", "hide treasure", "race"] },
  { prompt: "Jesus is called the Lamb of ______.", answer: "God", distractors: ["Egypt", "Rome", "the sea"] },
  { prompt: "The wise men found Jesus by following a ______.", answer: "star", distractors: ["map of Rome", "soldier", "rainbow"] },
  { prompt: "God told Noah to ______ the ark.", answer: "build", distractors: ["burn", "hide", "sell"] },
  { prompt: "David was a young ______.", answer: "shepherd", distractors: ["pharaoh", "sailor", "tax collector"] },
  { prompt: "Goliath was a ______.", answer: "giant", distractors: ["small boy", "fish", "bird"] },
  { prompt: "Lions did not ______ Daniel.", answer: "hurt", distractors: ["see", "hear", "smell"], aliases: ["eat", "kill", "harm"] },
  { prompt: "Jonah finally ______ God.", answer: "obeyed", distractors: ["forgot", "fought", "crowned"] },
  { prompt: "Jesus is our ______.", answer: "Saviour", distractors: ["Pharaoh", "Goliath", "Pilate"], aliases: ["savior", "lord", "lord and saviour", "lord and savior"] },
  { prompt: "God made people in his ______.", answer: "image", distractors: ["army", "palace", "boat"], aliases: ["likeness", "image and likeness"] },
  { prompt: "The first two people disobeyed God by eating the ______.", answer: "fruit", distractors: ["bread", "fish", "lamb"], aliases: ["forbidden fruit", "the fruit"] },
  { prompt: "An angel told Mary she would have a ______.", answer: "baby", distractors: ["crown", "palace", "garden"], aliases: ["son", "a son", "a baby"] },
  { prompt: "Jesus' friends were called ______.", answer: "disciples", distractors: ["soldiers", "giants", "kings"], aliases: ["the disciples", "apostles"] },
  { prompt: "How many close disciples did Jesus choose?", answer: "Twelve", distractors: ["Two", "Twenty", "One hundred"], aliases: ["12", "12 disciples"] },
  { prompt: "After Jesus rose, he told his friends to tell ______.", answer: "everyone", distractors: ["no one", "only kings", "only angels"] },
  { prompt: "Which word describes God?", answer: "good", distractors: ["unkind", "asleep", "lost"] },
  { prompt: "We should love God with all our ______.", answer: "heart", distractors: ["coins", "shoes", "boats"] },
];

const GROWING: Seed[] = [
  { prompt: "Who led Israel out of Egypt?", answer: "Moses", distractors: PEOPLE.filter((p) => p !== "Moses"), blank: "______ led Israel out of Egypt." },
  { prompt: "What burning thing did Moses see that was not destroyed?", answer: "A bush", distractors: ["A palace", "A chariot", "A mountain of gold"] },
  { prompt: "God told Moses to take off his ______.", answer: "sandals", distractors: ["crown", "coat", "ring"], aliases: ["shoes"] },
  { prompt: "How many plagues did God send on Egypt?", answer: "Ten", distractors: ["Three", "Forty", "Twelve"], aliases: ["10"] },
  { prompt: "The last plague was the death of the ______.", answer: "firstborn", distractors: ["cattle only", "pharaoh only", "fish"] },
  { prompt: "Israel painted ______ on their doorposts at Passover.", answer: "lamb's blood", distractors: ["gold dust", "olive oil", "water"], aliases: ["blood", "the blood of a lamb"] },
  { prompt: "God gave the Ten Commandments on Mount ______.", answer: "Sinai", distractors: ["Zion only", "Ararat", "Olives"] },
  { prompt: "The first commandment is to have no other ______.", answer: "gods", distractors: ["friends", "books", "meals"] },
  { prompt: "We must not steal. That is one of the ______.", answer: "Ten Commandments", distractors: ["Psalms", "parables", "plagues"] },
  { prompt: "Joshua led Israel into the ______ land.", answer: "promised", distractors: ["empty", "Roman", "frozen"] },
  { prompt: "The walls of ______ fell down.", answer: "Jericho", distractors: ["Bethlehem", "Nazareth", "Rome"], blank: "The walls of ______ fell down." },
  { prompt: "Rahab hid the ______ in Jericho.", answer: "spies", distractors: ["gold", "animals", "bread"] },
  { prompt: "Ruth said to Naomi, Your God will be ______.", answer: "my God", distractors: ["forgotten", "the king's god", "no one's"] },
  { prompt: "Samuel's mother was ______.", answer: "Hannah", distractors: ["Ruth", "Mary", "Esther"] },
  { prompt: "The first king of Israel was ______.", answer: "Saul", distractors: ["David", "Solomon", "Moses"], blank: "The first king of Israel was ______." },
  { prompt: "David was a man after God's own ______.", answer: "heart", distractors: ["crown", "army", "palace"] },
  { prompt: "Solomon asked God for ______.", answer: "wisdom", distractors: ["gold only", "a long sword", "more horses"], blank: "Solomon asked God for ______." },
  { prompt: "Solomon built a ______ for God in Jerusalem.", answer: "temple", distractors: ["ship", "tower of Babel", "palace for Pharaoh"] },
  { prompt: "Elijah was fed by ______.", answer: "ravens", distractors: ["lions", "soldiers", "fishermen"] },
  { prompt: "Elijah prayed and fire fell on Mount ______.", answer: "Carmel", distractors: ["Sinai", "Ararat", "Zion"] },
  { prompt: "Elisha received a double share of Elijah's ______.", answer: "spirit", distractors: ["gold", "land", "horses"] },
  { prompt: "Naaman was healed of leprosy in the ______ River.", answer: "Jordan", distractors: ["Nile", "Red Sea", "Euphrates"] },
  { prompt: "Esther became a ______ and helped save her people.", answer: "queen", distractors: ["judge", "prophet of Nineveh", "soldier"] },
  { prompt: "Job stayed ______ even when he suffered.", answer: "faithful", distractors: ["silent forever", "angry at everyone", "rich by stealing"] },
  { prompt: "Daniel prayed even when the king made a ______.", answer: "law against it", distractors: ["feast", "song", "garden"] },
  { prompt: "Shadrach, Meshach and Abednego were thrown into a ______.", answer: "fiery furnace", distractors: ["well", "den of snakes", "prison of Rome"] },
  { prompt: "A fourth person in the furnace looked like a ______ of God.", answer: "son", distractors: ["soldier", "king", "bird"] },
  { prompt: "Jonah ran away by getting on a ______.", answer: "ship", distractors: ["camel", "chariot", "ark"] },
  { prompt: "When Jonah preached, Nineveh ______.", answer: "repented", distractors: ["attacked Israel", "crowned Jonah", "slept"] },
  { prompt: "Jesus was born in the town of David, which is ______.", answer: "Bethlehem", distractors: ["Jericho", "Nineveh", "Rome"] },
  { prompt: "John the Baptist ______ Jesus.", answer: "baptized", distractors: ["crowned", "arrested", "ignored"], blank: "John the Baptist ______ Jesus." },
  { prompt: "Jesus was baptized in the River ______.", answer: "Jordan", distractors: ["Nile", "Euphrates", "Tiber"] },
  { prompt: "After Jesus was baptized, a voice said, This is my ______.", answer: "beloved Son", distractors: ["first king", "new prophet only", "high priest"] },
  { prompt: "Jesus was tempted in the ______.", answer: "wilderness", distractors: ["palace", "temple treasury", "fishing boat"] },
  { prompt: "Jesus' first miracle was turning water into ______.", answer: "wine", distractors: ["blood", "oil", "milk"], blank: "Jesus turned water into ______." },
  { prompt: "That first miracle was at a ______ in Cana.", answer: "wedding", distractors: ["funeral", "battle", "census"] },
  { prompt: "Jesus called fishermen to become fishers of ______.", answer: "men", distractors: ["gold", "fish only", "kings"], aliases: ["people", "men and women"] },
  { prompt: "Peter, Andrew, James and John were ______.", answer: "disciples", distractors: ["Pharisees", "soldiers", "kings"] },
  { prompt: "Matthew was a ______ collector before he followed Jesus.", answer: "tax", distractors: ["coin", "sheep", "water"] },
  { prompt: "Jesus taught the people on a mountain in the ______.", answer: "Sermon on the Mount", distractors: ["ten plagues", "song of Moses", "council of Rome"] },
  { prompt: "Blessed are the poor in ______.", answer: "spirit", distractors: ["gold", "land", "boats"] },
  { prompt: "Jesus taught us to pray, Our Father in ______.", answer: "heaven", distractors: ["Egypt", "Rome", "the sea"] },
  { prompt: "In the Lord's Prayer we ask for our daily ______.", answer: "bread", distractors: ["gold", "swords", "horses"] },
  { prompt: "Jesus said to love your ______.", answer: "neighbour", distractors: ["only your family", "only the rich", "only kings"], aliases: ["neighbor", "neighbor as yourself", "neighbour as yourself"] },
  { prompt: "The story of the prodigal son is about a father who ______.", answer: "forgives", distractors: ["forgets his son", "sells the farm", "leaves home"] },
  { prompt: "In a parable, seed fell on different kinds of ______.", answer: "ground", distractors: ["clouds", "boats", "thrones"] },
  { prompt: "Jesus raised Lazarus from the ______.", answer: "dead", distractors: ["river", "roof", "tree"] },
  { prompt: "Mary and Martha were sisters of ______.", answer: "Lazarus", distractors: ["Peter", "Moses", "Jonah"] },
  { prompt: "Jesus rode into Jerusalem on a ______.", answer: "donkey", distractors: ["war horse", "camel", "chariot"] },
  { prompt: "People waved ______ branches as Jesus entered Jerusalem.", answer: "palm", distractors: ["olive only", "fig", "cedar"] },
  { prompt: "Judas betrayed Jesus for thirty pieces of ______.", answer: "silver", distractors: ["gold", "bronze", "bread"] },
  { prompt: "Jesus prayed in the Garden of ______.", answer: "Gethsemane", distractors: ["Eden", "Olives only", "Jericho"] },
  { prompt: "Peter denied Jesus ______ times.", answer: "three", distractors: ["seven", "twelve", "one"], aliases: ["3"] },
  { prompt: "Pilate washed his ______.", answer: "hands", distractors: ["feet", "crown", "sword"] },
  { prompt: "Jesus was crucified at ______.", answer: "Golgotha", distractors: ["Bethlehem", "Nazareth", "Nineveh"], aliases: ["calvary", "the place of the skull"] },
  { prompt: "The sky grew dark when Jesus was on the ______.", answer: "cross", distractors: ["boat", "mountain of transfiguration", "roof"] },
  { prompt: "Joseph of Arimathea placed Jesus in a ______.", answer: "tomb", distractors: ["palace", "boat", "manger"] },
  { prompt: "On the first day of the week, the tomb was ______.", answer: "empty", distractors: ["locked by soldiers forever", "full of gifts", "burned"] },
  { prompt: "Mary Magdalene saw the risen ______.", answer: "Jesus", distractors: ["Pilate", "Herod", "Caesar"] },
  { prompt: "Thomas wanted to see the ______ in Jesus' hands.", answer: "wounds", distractors: ["rings", "scrolls", "coins"], aliases: ["marks", "holes", "nail marks"] },
  { prompt: "Jesus told Thomas, Stop doubting and ______.", answer: "believe", distractors: ["leave", "hide", "fight"] },
  { prompt: "Before he went to heaven, Jesus gave the Great ______.", answer: "Commission", distractors: ["Census", "Command of Pharaoh", "Tax"] },
  { prompt: "Jesus said he would be with us ______.", answer: "always", distractors: ["until winter", "only in church", "only at Christmas"] },
  { prompt: "The Holy Spirit came at ______.", answer: "Pentecost", distractors: ["Passover only", "Hanukkah", "the flood"] },
  { prompt: "At Pentecost the disciples spoke in other ______.", answer: "languages", distractors: ["riddles only", "whispers", "songs of Rome"] },
  { prompt: "The disciples were first called Christians in ______.", answer: "Antioch", distractors: ["Rome", "Bethlehem", "Jericho"] },
  { prompt: "Saul met Jesus on the road to ______.", answer: "Damascus", distractors: ["Jericho", "Nineveh", "Bethlehem"] },
  { prompt: "Saul's name was also ______.", answer: "Paul", distractors: ["Peter", "John", "Luke"] },
  { prompt: "Paul was a missionary who planted ______.", answer: "churches", distractors: ["palaces", "armies", "gardens of Babylon"] },
  { prompt: "Paul and Silas sang in ______.", answer: "prison", distractors: ["the temple choir only", "a palace", "a boat of kings"] },
  { prompt: "The fruit of the Spirit includes ______.", answer: "love", distractors: ["anger", "fear of people", "greed"] },
  { prompt: "Another fruit of the Spirit is ______.", answer: "joy", distractors: ["jealousy", "boasting", "laziness"] },
  { prompt: "Peace is a fruit of the Spirit.", answer: "True", distractors: ["False", "Only in the Old Testament", "Only for kings"] },
  { prompt: "The armour of God includes the belt of ______.", answer: "truth", distractors: ["gold", "silence", "fear"] },
  { prompt: "The sword of the Spirit is the ______ of God.", answer: "word", distractors: ["anger", "army", "throne"] },
  { prompt: "Psalm 23 begins, The Lord is my ______.", answer: "shepherd", distractors: ["soldier", "farmer", "king of Egypt"], blank: "The Lord is my ______." },
  { prompt: "Genesis 1:1 says, In the beginning God created the heavens and the ______.", answer: "earth", distractors: ["temple", "throne", "sea only"] },
  { prompt: "The four Gospels are Matthew, Mark, Luke and ______.", answer: "John", distractors: ["Paul", "Peter", "James"] },
  { prompt: "A Gospel is a book about the life of ______.", answer: "Jesus", distractors: ["Moses", "David", "Abraham"] },
  { prompt: "Bethany was the home of Mary, Martha and ______.", answer: "Lazarus", distractors: ["Nicodemus", "Zacchaeus", "Bartimaeus"] },
  { prompt: "Bartimaeus was a ______ man Jesus healed.", answer: "blind", distractors: ["rich", "Roman", "silent"] },
  { prompt: "Nicodemus visited Jesus at ______.", answer: "night", distractors: ["dawn in the palace", "noon at the well", "the cross only"] },
  { prompt: "Jesus told Nicodemus he must be ______ again.", answer: "born", distractors: ["crowned", "silent", "rich"] },
  { prompt: "The woman at the well lived in ______.", answer: "Samaria", distractors: ["Rome", "Egypt", "Babylon"] },
  { prompt: "Jesus is the bread of ______.", answer: "life", distractors: ["Egypt", "war", "Rome"] },
  { prompt: "Jesus is the way, the truth and the ______.", answer: "life", distractors: ["law of Moses only", "temple", "storm"] },
  { prompt: "The shortest verse in the Bible is Jesus ______.", answer: "wept", distractors: ["slept", "ran", "sang"] },
  { prompt: "Stephen was the first Christian ______.", answer: "martyr", distractors: ["king", "high priest", "tax collector"] },
  { prompt: "Dorcas was known for making ______ for the poor.", answer: "clothes", distractors: ["swords", "coins", "boats"] },
  { prompt: "Lydia sold purple ______.", answer: "cloth", distractors: ["spices", "fish", "oil"] },
  { prompt: "Ananias and Sapphira lied about their ______.", answer: "gift", distractors: ["names", "hometown", "ages"] },
  { prompt: "The early church shared what they ______.", answer: "had", distractors: ["hid", "sold to Pharaoh", "buried"] },
  { prompt: "Jesus calmed the storm by ______.", answer: "speaking", distractors: ["rowing faster", "hiding", "calling soldiers"] },
  { prompt: "Five thousand men were fed from a boy's ______.", answer: "lunch", distractors: ["treasure", "flock", "net"], aliases: ["loaves and fish", "five loaves and two fish"] },
  { prompt: "The wise builder built his house on the ______.", answer: "rock", distractors: ["sand", "water", "grass"] },
  { prompt: "The foolish builder built on the ______.", answer: "sand", distractors: ["rock", "mountain", "gold"] },
  { prompt: "A mustard seed grows into a large ______.", answer: "tree", distractors: ["stone", "cloud", "river"] },
  { prompt: "Jesus said we should forgive ______ times seven.", answer: "seventy", distractors: ["two", "twelve", "forty"], aliases: ["70", "seventy-seven", "77"] },
  { prompt: "The lost coin was found by a woman who ______.", answer: "searched her house", distractors: ["bought a new one", "waited a year", "asked a king"] },
  { prompt: "Angels are ______ of God.", answer: "messengers", distractors: ["kings of earth", "animals", "stars"] },
  { prompt: "The devil tempted Jesus with ______.", answer: "food, power and testing God", distractors: ["sleep", "a boat", "a new coat"] },
  { prompt: "Jesus answered temptation with ______.", answer: "Scripture", distractors: ["a sword", "silence only", "a miracle of gold"] },
];

const JUNIORS: Seed[] = [
  { prompt: "How many books are in the Bible?", answer: "66", distractors: ["27", "39", "100"], aliases: ["sixty-six", "sixty six"] },
  { prompt: "How many books are in the Old Testament?", answer: "39", distractors: ["27", "66", "12"], aliases: ["thirty-nine", "thirty nine"] },
  { prompt: "How many books are in the New Testament?", answer: "27", distractors: ["39", "66", "4"], aliases: ["twenty-seven", "twenty seven"] },
  { prompt: "The last book of the Old Testament is ______.", answer: "Malachi", distractors: ["Micah", "Matthew", "Revelation"] },
  { prompt: "The last book of the Bible is ______.", answer: "Revelation", distractors: ["Malachi", "Jude", "Acts"] },
  { prompt: "The first book of the New Testament is ______.", answer: "Matthew", distractors: ["Genesis", "Acts", "Romans"] },
  { prompt: "Who wrote many of the New Testament letters?", answer: "Paul", distractors: ["Moses", "David", "Solomon"] },
  { prompt: "Which Gospel was written by a doctor?", answer: "Luke", distractors: ["Mark", "John", "Matthew"] },
  { prompt: "Which Gospel starts with the Word became flesh?", answer: "John", distractors: ["Matthew", "Mark", "Luke"] },
  { prompt: "Acts tells the story of the early ______.", answer: "church", distractors: ["kings of Israel", "flood", "exodus"] },
  { prompt: "The Pentateuch is the first ______ books of the Bible.", answer: "five", distractors: ["ten", "twelve", "four"], aliases: ["5"] },
  { prompt: "The Pentateuch is also called the Law of ______.", answer: "Moses", distractors: ["David", "Paul", "Peter"] },
  { prompt: "Leviticus is mostly about ______ and worship.", answer: "priests", distractors: ["boats", "Rome", "dreams"] },
  { prompt: "Numbers is named for a ______ of Israel.", answer: "census", distractors: ["song", "plague of frogs", "king"] },
  { prompt: "Deuteronomy means ______ law.", answer: "second", distractors: ["hidden", "Roman", "new Greek"] },
  { prompt: "The book of Psalms is a book of ______.", answer: "songs and prayers", distractors: ["laws only", "lists of kings only", "letters of Paul"] },
  { prompt: "David wrote many of the ______.", answer: "Psalms", distractors: ["Proverbs", "Gospels", "Prophets"] },
  { prompt: "Solomon wrote much of ______.", answer: "Proverbs", distractors: ["Acts", "Genesis", "Revelation"] },
  { prompt: "The fear of the Lord is the beginning of ______.", answer: "wisdom", distractors: ["wealth", "war", "worry"] },
  { prompt: "Isaiah prophesied that a ______ would be born.", answer: "child", distractors: ["giant", "pharaoh", "roman emperor"], aliases: ["son", "messiah", "immanuel"] },
  { prompt: "Immanuel means God ______.", answer: "with us", distractors: ["against us", "far away", "of the past"] },
  { prompt: "Micah said the Messiah would be born in ______.", answer: "Bethlehem", distractors: ["Jerusalem only", "Nazareth", "Hebron"] },
  { prompt: "Jeremiah is sometimes called the ______ prophet.", answer: "weeping", distractors: ["silent", "warrior", "farmer"] },
  { prompt: "Ezekiel saw a valley of dry ______.", answer: "bones", distractors: ["boats", "coins", "scrolls"] },
  { prompt: "Hosea was told to keep loving his wife ______.", answer: "Gomer", distractors: ["Ruth", "Naomi", "Esther"] },
  { prompt: "Jonah's plant was eaten by a ______.", answer: "worm", distractors: ["bird", "lion", "fish"] },
  { prompt: "The exile took Judah to ______.", answer: "Babylon", distractors: ["Egypt only", "Rome", "Nineveh only"] },
  { prompt: "Cyrus allowed the Jews to return and rebuild the ______.", answer: "temple", distractors: ["ark", "tower of Babel", "palace of Pharaoh"] },
  { prompt: "Nehemiah rebuilt the ______ of Jerusalem.", answer: "walls", distractors: ["navy", "pyramids", "colosseum"] },
  { prompt: "Ezra was a ______ who taught the Law.", answer: "scribe", distractors: ["soldier", "fisherman", "tax collector"] },
  { prompt: "The boy Samuel served in the house of ______.", answer: "Eli", distractors: ["Saul", "Pharaoh", "Pilate"] },
  { prompt: "David was anointed by ______.", answer: "Samuel", distractors: ["Nathan only", "Saul", "Solomon"] },
  { prompt: "Jonathan was a loyal friend of ______.", answer: "David", distractors: ["Saul's enemy Goliath", "Moses", "Jonah"] },
  { prompt: "Absalom rebelled against his father ______.", answer: "David", distractors: ["Saul", "Solomon", "Samuel"] },
  { prompt: "Nathan the prophet confronted David about ______.", answer: "Bathsheba", distractors: ["Goliath", "the ark's size", "Jerusalem's walls"] },
  { prompt: "The ark of the covenant held the stone ______.", answer: "tablets", distractors: ["crowns", "coins", "maps"], aliases: ["tablets of the law", "ten commandments"] },
  { prompt: "Uzzah died when he touched the ______.", answer: "ark", distractors: ["temple veil", "golden calf", "Jordan"] },
  { prompt: "The golden calf was made while Moses was on the ______.", answer: "mountain", distractors: ["sea", "throne", "battlefield"] },
  { prompt: "Aaron was Moses' ______.", answer: "brother", distractors: ["son", "enemy", "king"] },
  { prompt: "Miriam was Moses' ______.", answer: "sister", distractors: ["wife", "mother", "queen"] },
  { prompt: "Caleb and Joshua believed Israel could take the ______.", answer: "land", distractors: ["sea", "stars", "ark"] },
  { prompt: "Ten spies brought a fearful report about ______.", answer: "Canaan", distractors: ["Egypt", "Rome", "Nineveh"] },
  { prompt: "Israel wandered in the wilderness for ______ years.", answer: "40", distractors: ["7", "12", "70"], aliases: ["forty", "forty years"] },
  { prompt: "Manna was ______ from heaven.", answer: "bread", distractors: ["gold", "water", "fire"] },
  { prompt: "Water came from a ______ when Moses struck it.", answer: "rock", distractors: ["tree", "cloud", "well of Rome"] },
  { prompt: "Balaam's ______ spoke to him.", answer: "donkey", distractors: ["camel", "servant", "king"] },
  { prompt: "Gideon asked God for a sign with a ______.", answer: "fleece", distractors: ["sword", "crown", "scroll"] },
  { prompt: "Gideon defeated Midian with only ______ men.", answer: "300", distractors: ["3000", "30", "3"], aliases: ["three hundred"] },
  { prompt: "Samson's strength was in his ______.", answer: "hair", distractors: ["armour", "height", "sword"] },
  { prompt: "Delilah betrayed ______.", answer: "Samson", distractors: ["Samuel", "Solomon", "Saul"] },
  { prompt: "Deborah was a ______ of Israel.", answer: "judge", distractors: ["queen of Persia", "Pharisee", "Roman"] },
  { prompt: "Boaz married ______.", answer: "Ruth", distractors: ["Naomi", "Hannah", "Esther"] },
  { prompt: "Ruth was from ______.", answer: "Moab", distractors: ["Egypt", "Rome", "Assyria"] },
  { prompt: "The kinsman-redeemer in Ruth is a picture of ______.", answer: "Christ", distractors: ["Pharaoh", "Goliath", "Caesar"], aliases: ["jesus", "jesus christ"] },
  { prompt: "Hezekiah prayed and God added ______ years to his life.", answer: "15", distractors: ["40", "7", "3"], aliases: ["fifteen"] },
  { prompt: "Josiah found the Book of the ______.", answer: "Law", distractors: ["Wars", "Kings of Rome", "Psalms only"] },
  { prompt: "Ahab was a wicked king; his wife was ______.", answer: "Jezebel", distractors: ["Esther", "Ruth", "Mary"] },
  { prompt: "Elijah was taken up to heaven in a ______ of fire.", answer: "chariot", distractors: ["boat", "cloud of locusts", "whirlwind of sand"] },
  { prompt: "The river Jordan parted for ______ as it had for Moses.", answer: "Joshua", distractors: ["Jonah", "Paul", "Pilate"] },
  { prompt: "Twelve stones were taken from the Jordan as a ______.", answer: "memorial", distractors: ["weapon", "tax", "crown"] },
  { prompt: "The Passover meal became the Lord's ______ in the New Testament.", answer: "Supper", distractors: ["Census", "Tax", "War"], aliases: ["communion", "eucharist", "breaking of bread"] },
  { prompt: "Jesus said the bread was his ______.", answer: "body", distractors: ["law", "throne", "nation"] },
  { prompt: "Jesus said the cup was his ______.", answer: "blood", distractors: ["baptism", "crown", "word only"] },
  { prompt: "The veil of the temple was torn when Jesus ______.", answer: "died", distractors: ["was born", "was baptized", "walked on water"] },
  { prompt: "That torn veil means we may come ______ to God.", answer: "near", distractors: ["only once a year", "never", "through Pharaoh"] },
  { prompt: "Jesus is our great high ______.", answer: "priest", distractors: ["pharaoh", "centurion", "tax collector"] },
  { prompt: "The book of Hebrews says we walk by ______.", answer: "faith", distractors: ["sight only", "gold", "the law of Rome"] },
  { prompt: "Faith is being sure of what we ______ for.", answer: "hope", distractors: ["own", "fear", "hide"] },
  { prompt: "James says faith without works is ______.", answer: "dead", distractors: ["enough", "hidden", "gold"] },
  { prompt: "Peter wrote letters to ______ Christians.", answer: "suffering", distractors: ["Roman emperors only", "Pharaoh", "the giant"] },
  { prompt: "John wrote, God is ______.", answer: "love", distractors: ["distant", "finished", "silent"] },
  { prompt: "In Revelation, John was on the island of ______.", answer: "Patmos", distractors: ["Crete", "Malta", "Cyprus"] },
  { prompt: "Revelation shows Jesus as King of ______.", answer: "kings", distractors: ["Egypt", "the fish", "the storm"] },
  { prompt: "The new heaven and new earth have no more ______.", answer: "tears", distractors: ["light", "songs", "trees"] },
  { prompt: "The Beatitudes are found in Matthew ______.", answer: "5", distractors: ["1", "28", "13"], aliases: ["chapter 5", "matthew 5"] },
  { prompt: "The Great Commission is in Matthew ______.", answer: "28", distractors: ["1", "5", "6"], aliases: ["chapter 28"] },
  { prompt: "John 3:16 says whoever believes shall not ______.", answer: "perish", distractors: ["pray", "work", "sleep"] },
  { prompt: "The wages of sin is ______.", answer: "death", distractors: ["gold", "a long life", "a crown"] },
  { prompt: "The gift of God is eternal ______.", answer: "life", distractors: ["gold", "land", "fame"] },
  { prompt: "All have sinned and fall short of the ______ of God.", answer: "glory", distractors: ["temple", "law of Rome", "sea"] },
  { prompt: "We are saved by grace through ______.", answer: "faith", distractors: ["money", "family name", "works of the law only"] },
  { prompt: "The church is called the ______ of Christ.", answer: "body", distractors: ["army of Rome", "court", "market"] },
  { prompt: "Baptism is a sign that we ______ with Christ.", answer: "die and rise", distractors: ["become rich", "join an army", "leave the world of people"] },
  { prompt: "The Holy Spirit is the ______ Jesus promised.", answer: "Helper", distractors: ["tax", "sword of Rome", "king of Israel"], aliases: ["comforter", "advocate", "counsellor", "counselor"] },
  { prompt: "There is one God in three persons: Father, Son and ______.", answer: "Holy Spirit", distractors: ["angels", "prophets", "apostles"], aliases: ["spirit", "holy ghost"] },
  { prompt: "Jesus is fully God and fully ______.", answer: "man", distractors: ["angel", "prophet only", "king of Egypt only"] },
  { prompt: "The Bible is inspired by ______.", answer: "God", distractors: ["kings only", "poets only", "Rome"] },
  { prompt: "Thy word is a lamp to my ______.", answer: "feet", distractors: ["house", "crown", "boat"] },
  { prompt: "The book of Proverbs warns against the ______.", answer: "sluggard", distractors: ["shepherd", "child", "priest"] },
  { prompt: "A friend loves at all ______.", answer: "times", distractors: ["feasts", "markets", "wars"] },
  { prompt: "Train up a child in the way he should ______.", answer: "go", distractors: ["hide", "rule Rome", "flee"] },
  { prompt: "Remember your Creator in the days of your ______.", answer: "youth", distractors: ["wealth", "exile", "kingship"] },
  { prompt: "To everything there is a ______.", answer: "season", distractors: ["tax", "soldier", "ship"] },
  { prompt: "Isaiah saw the Lord high and ______.", answer: "lifted up", distractors: ["asleep", "in Egypt", "on a fish"] },
  { prompt: "Holy, holy, holy is the Lord of ______.", answer: "hosts", distractors: ["Egypt", "the sea only", "Rome"] },
  { prompt: "Here am I; ______ me.", answer: "send", distractors: ["hide", "crown", "forget"] },
  { prompt: "Jonah boarded a ship at ______.", answer: "Joppa", distractors: ["Jericho", "Bethlehem", "Nazareth"] },
  { prompt: "The sailors threw Jonah into the ______.", answer: "sea", distractors: ["fire", "prison", "desert"] },
  { prompt: "Daniel's friends would not bow to a ______.", answer: "statue", distractors: ["king's dog", "tree", "scroll"] },
  { prompt: "The writing on the wall appeared at ______ feast.", answer: "Belshazzar's", distractors: ["Pharaoh's", "Herod's", "Pilate's"] },
  { prompt: "Mene, mene, tekel, upharsin meant the kingdom was ______.", answer: "finished", distractors: ["beginning", "blessed", "doubled"] },
];

const YOUTH: Seed[] = [
  { prompt: "Who is traditionally said to have written Genesis?", answer: "Moses", distractors: ["David", "Ezra", "Paul"] },
  { prompt: "The Abrahamic covenant promised land, descendants and ______.", answer: "blessing", distractors: ["a temple immediately", "a Roman peace", "gold mines"] },
  { prompt: "God's covenant sign with Noah was the ______.", answer: "rainbow", distractors: ["sabbath", "circumcision", "temple"] },
  { prompt: "Circumcision was the sign of the covenant with ______.", answer: "Abraham", distractors: ["Noah", "David", "Paul"] },
  { prompt: "The Sabbath was given as a sign in the Law of ______.", answer: "Moses", distractors: ["David", "Solomon", "Ezra"] },
  { prompt: "Melchizedek was king of Salem and priest of ______.", answer: "God Most High", distractors: ["Baal", "Pharaoh", "Caesar"] },
  { prompt: "Abraham was willing to offer ______ on Mount Moriah.", answer: "Isaac", distractors: ["Ishmael", "Jacob", "Joseph"] },
  { prompt: "Jacob's name was changed to ______.", answer: "Israel", distractors: ["Judah", "Ephraim", "Abraham"] },
  { prompt: "Jacob had ______ sons, who became tribes of Israel.", answer: "12", distractors: ["10", "7", "3"], aliases: ["twelve"] },
  { prompt: "Joseph was sold into slavery in ______.", answer: "Egypt", distractors: ["Babylon", "Rome", "Assyria"] },
  { prompt: "Joseph told his brothers, You meant evil, but God meant it for ______.", answer: "good", distractors: ["gold", "revenge", "silence"] },
  { prompt: "The Passover lamb points forward to ______.", answer: "Christ", distractors: ["Moses", "David", "Aaron"], aliases: ["jesus", "jesus christ"] },
  { prompt: "The Day of Atonement is also called ______.", answer: "Yom Kippur", distractors: ["Hanukkah", "Purim", "Pentecost"] },
  { prompt: "The high priest entered the Most Holy Place ______ a year.", answer: "once", distractors: ["weekly", "daily", "never"], aliases: ["1", "one time"] },
  { prompt: "Blood on the mercy seat showed that sin needs ______.", answer: "atonement", distractors: ["gold", "silence", "exile only"] },
  { prompt: "The bronze serpent in the wilderness pointed to ______.", answer: "the cross", distractors: ["the ark", "the temple tax", "Rome"] },
  { prompt: "Jesus told Nicodemus that the Son of Man must be ______ up.", answer: "lifted", distractors: ["hidden", "crowned in Rome", "sent to Egypt"] },
  { prompt: "The Davidic covenant promised an everlasting ______.", answer: "king", distractors: ["priest of Levi only", "prophet from Moab", "judge"], aliases: ["throne", "kingdom"] },
  { prompt: "The Messiah is called Son of ______ in the Gospels.", answer: "David", distractors: ["Aaron", "Levi", "Samuel"] },
  { prompt: "Bethlehem Ephrathah is named in the prophet ______.", answer: "Micah", distractors: ["Jonah", "Amos", "Obadiah"] },
  { prompt: "The suffering servant of Isaiah 53 is fulfilled in ______.", answer: "Jesus", distractors: ["Jeremiah", "Job", "John the Baptist"] },
  { prompt: "He was pierced for our ______.", answer: "transgressions", distractors: ["songs", "tithes", "feasts"], aliases: ["sins"] },
  { prompt: "By his wounds we are ______.", answer: "healed", distractors: ["taxed", "crowned", "forgotten"] },
  { prompt: "The word became flesh and dwelt among us is in ______.", answer: "John 1", distractors: ["Luke 2", "Matthew 1", "Acts 2"] },
  { prompt: "Jesus' two natures are sometimes called the ______ union.", answer: "hypostatic", distractors: ["roman", "mosaic", "davidic"] },
  { prompt: "Justification means being declared ______.", answer: "righteous", distractors: ["perfectly sinless in practice instantly", "a Jew", "a Roman citizen"] },
  { prompt: "Sanctification is the work of becoming more like ______.", answer: "Christ", distractors: ["Moses", "David", "Paul"] },
  { prompt: "Glorification is the final making new of ______.", answer: "believers", distractors: ["the temple of stone only", "Israel's kings", "the law"] },
  { prompt: "The church's mission is to make ______ of all nations.", answer: "disciples", distractors: ["soldiers", "tax collectors", "kings"] },
  { prompt: "Pentecost is fifty days after ______.", answer: "Passover", distractors: ["Christmas", "the exile", "the flood"] },
  { prompt: "The council of Jerusalem is in Acts ______.", answer: "15", distractors: ["2", "9", "28"] },
  { prompt: "That council decided Gentiles need not keep all of the ______.", answer: "Mosaic ceremonial law", distractors: ["Ten Commandments of love", "Great Commission", "Lord's Prayer"] },
  { prompt: "Romans 8 says there is now no ______ for those in Christ.", answer: "condemnation", distractors: ["suffering", "prayer", "mission"] },
  { prompt: "Nothing can separate us from the ______ of God.", answer: "love", distractors: ["law", "temple", "census"] },
  { prompt: "1 Corinthians 13 is the chapter about ______.", answer: "love", distractors: ["spiritual gifts only", "the resurrection only", "money"] },
  { prompt: "1 Corinthians 15 is the great chapter on ______.", answer: "resurrection", distractors: ["marriage", "tongues", "the Lord's Supper only"] },
  { prompt: "If Christ has not been raised, our faith is ______.", answer: "futile", distractors: ["stronger", "hidden", "enough anyway"] },
  { prompt: "Galatians says we are not justified by works of the ______.", answer: "law", distractors: ["Spirit", "gospel", "cross"] },
  { prompt: "The fruit of the Spirit is listed in Galatians ______.", answer: "5", distractors: ["1", "3", "6"] },
  { prompt: "Ephesians says we are saved by grace, not by ______.", answer: "works", distractors: ["faith", "Christ", "the Spirit"] },
  { prompt: "Put on the whole ______ of God.", answer: "armour", distractors: ["robe of a priest only", "crown", "cloak of Elijah"], aliases: ["armor"] },
  { prompt: "Philippians says to rejoice in the Lord ______.", answer: "always", distractors: ["on feast days", "when rich", "in Jerusalem only"] },
  { prompt: "The mind of Christ is described in Philippians ______.", answer: "2", distractors: ["1", "3", "4"] },
  { prompt: "Colossians says Jesus is the image of the invisible ______.", answer: "God", distractors: ["temple", "law", "church"] },
  { prompt: "1 Thessalonians teaches the Lord will ______.", answer: "return", distractors: ["rebuild Babel", "crown Caesar", "end prayer"] },
  { prompt: "1 Timothy says the church is the pillar and foundation of the ______.", answer: "truth", distractors: ["empire", "temple tax", "census"] },
  { prompt: "2 Timothy says all Scripture is God-______.", answer: "breathed", distractors: ["copied from Rome", "optional", "only for prophets"] },
  { prompt: "Titus was left in ______ to appoint elders.", answer: "Crete", distractors: ["Rome", "Corinth", "Ephesus"] },
  { prompt: "Philemon is a letter about a runaway slave named ______.", answer: "Onesimus", distractors: ["Timothy", "Titus", "Luke"] },
  { prompt: "Hebrews 11 is the hall of ______.", answer: "faith", distractors: ["kings", "priests", "psalms"] },
  { prompt: "Without faith it is impossible to ______ God.", answer: "please", distractors: ["see", "name", "tax"] },
  { prompt: "James says the tongue is a small part but makes great ______.", answer: "boasts", distractors: ["temples", "boats", "laws"] },
  { prompt: "1 Peter says we are a chosen ______.", answer: "people", distractors: ["army of Rome", "tribe of Levi only", "school of Pharisees"] },
  { prompt: "2 Peter says prophecy never had its origin in the human ______.", answer: "will", distractors: ["temple", "king", "scroll"] },
  { prompt: "1 John says if we confess our sins, he is faithful to ______.", answer: "forgive", distractors: ["forget us", "punish without mercy", "delay forever"] },
  { prompt: "Jude tells us to contend for the ______.", answer: "faith", distractors: ["temple", "throne of David immediately", "law of Rome"] },
  { prompt: "The seven churches of Revelation are in ______.", answer: "Asia", distractors: ["Judea only", "Egypt", "Rome only"] },
  { prompt: "Jesus is the Alpha and the ______.", answer: "Omega", distractors: ["Levite", "Caesar", "first priest"] },
  { prompt: "The tree of life appears in Genesis and in ______.", answer: "Revelation", distractors: ["Exodus", "Psalms", "Acts"] },
  { prompt: "Paradise lost in Eden is restored in the new ______.", answer: "Jerusalem", distractors: ["Rome", "Babylon", "Nineveh"] },
  { prompt: "The four living creatures appear in Ezekiel and in ______.", answer: "Revelation", distractors: ["Jonah", "Ruth", "Nehemiah"] },
  { prompt: "Typology reads earlier Scripture as pointing to ______.", answer: "Christ", distractors: ["Rome", "the exile only", "Solomon's wealth"] },
  { prompt: "The already and not yet refers to the ______ of God.", answer: "kingdom", distractors: ["temple", "census", "empire"] },
  { prompt: "Jesus preached, The kingdom of God is ______.", answer: "at hand", distractors: ["only after death", "only for Israel forever", "cancelled"] },
  { prompt: "The Beatitudes describe the character of ______ people.", answer: "kingdom", distractors: ["Roman", "wealthy only", "Levite only"] },
  { prompt: "The transfiguration showed Jesus' ______ glory.", answer: "divine", distractors: ["roman", "hidden forever", "borrowed"] },
  { prompt: "Moses and Elijah appeared with Jesus on the ______.", answer: "mountain", distractors: ["sea", "cross", "road to Emmaus"] },
  { prompt: "On the road to Emmaus, Jesus explained the ______ about himself.", answer: "Scriptures", distractors: ["Roman law", "tax code", "psalms of Pharaoh"] },
  { prompt: "The church began in ______ at Pentecost.", answer: "Jerusalem", distractors: ["Rome", "Antioch", "Damascus"] },
  { prompt: "Persecution scattered the church, which spread the ______.", answer: "gospel", distractors: ["empire", "tax", "law of Pharaoh"] },
  { prompt: "Philip explained Isaiah to the Ethiopian ______.", answer: "eunuch", distractors: ["king", "soldier", "priest of Dagon"] },
  { prompt: "Cornelius was a ______ who believed.", answer: "Gentile centurion", distractors: ["Levite", "Pharisee", "Sadducee"] },
  { prompt: "Peter learned that God does not show ______.", answer: "favouritism", distractors: ["mercy", "power", "patience"], aliases: ["favoritism", "partiality"] },
  { prompt: "Paul's first missionary journey began from ______.", answer: "Antioch", distractors: ["Rome", "Athens", "Jerusalem only"] },
  { prompt: "In Athens Paul preached at the ______.", answer: "Areopagus", distractors: ["temple of Jerusalem", "pool of Bethesda", "Red Sea"] },
  { prompt: "Priscilla and Aquila explained the way of God more ______ to Apollos.", answer: "adequately", distractors: ["quietly so no one heard", "in Latin only", "by a vision"] },
  { prompt: "The love of money is a root of all kinds of ______.", answer: "evil", distractors: ["wisdom", "worship", "mission"] },
  { prompt: "Do not be conformed to this world, but be ______.", answer: "transformed", distractors: ["hidden", "crowned", "silent"] },
  { prompt: "Present your bodies as a living ______.", answer: "sacrifice", distractors: ["temple tax", "statue", "census"] },
  { prompt: "The just shall live by ______.", answer: "faith", distractors: ["sight", "the sword", "the census"] },
  { prompt: "Habakkuk asked how long the wicked would ______.", answer: "prosper", distractors: ["pray", "sing", "fast"] },
  { prompt: "Amos said, Let justice roll down like ______.", answer: "waters", distractors: ["fire", "gold", "chariots"] },
  { prompt: "Micah 6:8 — act justly, love mercy, walk ______ with your God.", answer: "humbly", distractors: ["richly", "silently", "rarely"] },
  { prompt: "Malachi promised Elijah would come before the day of the ______.", answer: "Lord", distractors: ["kings", "census", "flood"] },
  { prompt: "Jesus said John the Baptist was the Elijah who was to ______.", answer: "come", distractors: ["rule Rome", "rebuild the temple alone", "write a Gospel"] },
  { prompt: "The last enemy to be destroyed is ______.", answer: "death", distractors: ["Rome", "the sea", "the law"] },
  { prompt: "Maranatha means Come, ______.", answer: "Lord", distractors: ["King Saul", "Elijah only", "the census"] },
  { prompt: "The Lord's Prayer asks that God's ______ come.", answer: "kingdom", distractors: ["army", "tax", "temple of stone only"] },
  { prompt: "Hallowed be your ______.", answer: "name", distractors: ["throne of David only", "temple", "nation"] },
  { prompt: "Lead us not into ______.", answer: "temptation", distractors: ["the wilderness of Sinai forever", "exile", "the sea"] },
  { prompt: "Deliver us from ______.", answer: "evil", distractors: ["Egypt only", "Rome only", "rain"] },
  { prompt: "The apocrypha is not part of the 66-book ______ used here.", answer: "canon", distractors: ["psalter", "lectionary of Rome", "Pentateuch"] },
  { prompt: "Hermeneutics is the study of how we ______ the Bible.", answer: "interpret", distractors: ["print", "sell", "hide"] },
  { prompt: "Context means reading a verse in its ______.", answer: "passage and book", distractors: ["favourite hymn only", "Roman history only", "isolation forever"] },
  { prompt: "The Gospels are ______, not identical copies.", answer: "four portraits", distractors: ["one copied four times", "letters of Paul", "laws"] },
  { prompt: "Synoptic Gospels are Matthew, Mark and ______.", answer: "Luke", distractors: ["John", "Acts", "Romans"] },
  { prompt: "John's Gospel is built around signs and ______ statements.", answer: "I am", distractors: ["woe to you", "blessed are", "thus says Pharaoh"] },
  { prompt: "I am the good ______.", answer: "shepherd", distractors: ["soldier", "tax collector", "Levite"] },
  { prompt: "I am the true ______.", answer: "vine", distractors: ["olive of Rome", "cedar of Lebanon only", "fig of Egypt"] },
  { prompt: "I am the resurrection and the ______.", answer: "life", distractors: ["law", "temple", "census"] },
];

const OT_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah",
  "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Songs", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
  "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
];

const NT_BOOKS = [
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
  "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
  "1 John", "2 John", "3 John", "Jude", "Revelation",
];

function bookSeeds(): Seed[] {
  const seeds: Seed[] = [];
  const all = [...OT_BOOKS, ...NT_BOOKS];
  for (let i = 0; i < all.length - 1; i++) {
    const next = all[i + 1];
    const others = all.filter((b) => b !== next && b !== all[i]).slice(i % 10, i % 10 + 3);
    seeds.push({
      prompt: `Which book comes after ${all[i]}?`,
      answer: next,
      distractors: others.length === 3 ? others : ["Ruth", "Acts", "Jude"],
    });
  }
  for (let i = 1; i < all.length; i++) {
    const prev = all[i - 1];
    const others = all.filter((b) => b !== prev && b !== all[i]).slice((i + 4) % 12, (i + 4) % 12 + 3);
    seeds.push({
      prompt: `Which book comes before ${all[i]}?`,
      answer: prev,
      distractors: others.length === 3 ? others : ["Job", "Mark", "Titus"],
    });
  }
  for (const book of OT_BOOKS) {
    seeds.push({
      prompt: `Is ${book} in the Old or New Testament?`,
      answer: "Old Testament",
      distractors: ["New Testament", "neither", "both equally"],
      aliases: ["old", "ot", "old testament"],
    });
  }
  for (const book of NT_BOOKS) {
    seeds.push({
      prompt: `Is ${book} in the Old or New Testament?`,
      answer: "New Testament",
      distractors: ["Old Testament", "neither", "both equally"],
      aliases: ["new", "nt", "new testament"],
    });
  }
  return seeds;
}

function extraBlanks(from: Seed[]): Seed[] {
  return from.filter((s) => s.blank);
}

function padWithBooks(stage: StageId, section: SectionId, have: Question[], need: number, start: number) {
  if (stage === "little" || stage === "growing") {
    return have.slice(0, need);
  }
  const extras = bookSeeds().slice(start);
  const more = take(stage, section, extras, Math.max(0, need - have.length));
  return have.concat(more).slice(0, need);
}

function uniqueByPrompt(items: Question[]) {
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const q of items) {
    const key = `${q.section}:${q.prompt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

function buildStage(
  stage: StageId,
  objectiveNeed: number,
  blankNeed: number,
  pools: Seed[][],
  bookOffset: number,
): Question[] {
  const objSeeds = pools.flat();
  let objective = uniqueByPrompt(take(stage, "objective", objSeeds, objectiveNeed + 20));
  objective = padWithBooks(stage, "objective", objective, objectiveNeed, bookOffset);

  const blankSeeds = [...extraBlanks(objSeeds), ...objSeeds.map((s) => ({
    ...s,
    blank: s.blank ?? s.prompt.replace(s.answer, "______"),
  }))];
  let blanks = uniqueByPrompt(take(stage, "blank", blankSeeds, blankNeed + 10));
  if (blanks.length < blankNeed) {
    const filler: Seed[] = bookSeeds()
      .slice(bookOffset, bookOffset + 80)
      .map((s) => ({
        ...s,
        blank: `${s.prompt.replace(/\?$/, "")} is ______.`,
      }));
    blanks = uniqueByPrompt(blanks.concat(take(stage, "blank", filler, blankNeed)));
  }
  blanks = blanks.slice(0, blankNeed);
  objective = objective.slice(0, objectiveNeed);
  return [...objective, ...blanks];
}

const BANK: Question[] = [
  ...buildStage("little", 100, 25, [LITTLE], 0),
  ...buildStage("growing", 100, 25, [GROWING, LITTLE], 8),
  ...buildStage("juniors", 100, 25, [JUNIORS, GROWING], 20),
  ...buildStage("youth", 100, 25, [YOUTH, JUNIORS], 40),
  ...buildStage("general", 200, 50, [LITTLE, GROWING, JUNIORS, YOUTH], 0),
];

export const QUESTIONS: Question[] = BANK;

export function questionsForStage(stage: StageId, section?: SectionId) {
  return QUESTIONS.filter((q) => q.stage === stage && (section ? q.section === section : true));
}

export function questionById(id: string) {
  return QUESTIONS.find((q) => q.id === id);
}

export function bankStats() {
  const stats = {} as Record<StageId, { objective: number; blank: number }>;
  for (const q of QUESTIONS) {
    stats[q.stage] ??= { objective: 0, blank: 0 };
    stats[q.stage][q.section] += 1;
  }
  return stats;
}
