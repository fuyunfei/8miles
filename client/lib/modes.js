/**
 * Mode definitions for 8 Miles AI Rap Coach
 * Each mode has its own prompt template and UI configuration
 */

// Rhyme sets (shared)
export const RHYME_SETS = [
  { sound: "-ide", words: ["ride", "hide", "side", "pride", "wide", "guide", "slide"] },
  { sound: "-ay", words: ["day", "way", "say", "play", "stay", "away", "today"] },
  { sound: "-ight", words: ["night", "right", "fight", "light", "sight", "might", "bright"] },
  { sound: "-ow", words: ["flow", "know", "go", "show", "grow", "low", "glow"] },
  { sound: "-ame", words: ["game", "name", "fame", "flame", "same", "came", "aim"] },
  { sound: "-ine", words: ["time", "mine", "line", "shine", "fine", "sign", "climb"] },
  { sound: "-eat", words: ["beat", "heat", "street", "feet", "meet", "seat", "treat"] },
  { sound: "-ound", words: ["sound", "ground", "round", "found", "bound", "pound", "crown"] },
];

// Topics for Challenge mode
export const TOPICS = [
  { id: "food", name: "Food", examples: ["pizza", "sushi", "tacos"] },
  { id: "city", name: "City Life", examples: ["streets", "lights", "crowds"] },
  { id: "dreams", name: "Dreams", examples: ["goals", "future", "hustle"] },
  { id: "love", name: "Love", examples: ["heart", "feelings", "romance"] },
];

// Mode definitions
export const MODES = {
  practice: {
    id: "practice",
    name: "Practice",
    icon: "🎯",
    description: "Learn with hints and encouragement",
    ui: {
      showHints: true,
      showScore: false,
      showTopic: false,
    },
    buildPrompt: (rhyme) => {
      const { sound, words } = rhyme;
      const wordList = words.join(", ");

      return `You are 8 Miles, a patient and encouraging rap coach. Your goal is to help beginners learn to rap.

CURRENT RHYME: ${sound}
EXAMPLE WORDS: ${wordList}

RULES:
- Say 2 lines that rhyme with "${sound}", then STOP and wait
- Speak slowly and clearly so they can follow
- After user responds:
  - If they rhymed well: "Nice! 🔥" + brief encouragement + your next 2 lines
  - If they struggled: "Good try! Here's a tip: try ending with words like ${words.slice(0, 3).join(", ")}." Then continue with your 2 lines
- Be patient and supportive - celebrate small wins
- Keep the same ${sound} rhyme throughout

START with a friendly welcome and your opening 2 lines using ${sound} rhymes.`;
    },
  },

  battle: {
    id: "battle",
    name: "Battle",
    icon: "🔥",
    description: "Real freestyle battle, bring your A-game",
    ui: {
      showHints: false,
      showScore: false,
      showTopic: false,
    },
    buildPrompt: (rhyme) => {
      const { sound, words } = rhyme;

      return `You are 8 Miles, a legendary freestyle rapper in a competitive rap battle. You're here to WIN.

CURRENT RHYME: ${sound}

RULES:
- Say 2-4 hard-hitting lines that rhyme with "${sound}", then STOP
- Be confident, clever, and competitive
- After user responds:
  - React naturally: "Ayy!" or "Okay okay!" or "That's what you got?"
  - Then drop your next bars - try to outdo them
- Use wordplay, metaphors, and punch lines
- Stay on ${sound} rhyme but be creative with the flow
- No teaching, no hints - this is a BATTLE

START with your opening bars. Set the tone. Show them what you got.`;
    },
  },

  challenge: {
    id: "challenge",
    name: "Challenge",
    icon: "🎲",
    description: "Topic-based rounds with scoring",
    ui: {
      showHints: false,
      showScore: true,
      showTopic: true,
    },
    buildPrompt: (rhyme, topic) => {
      const { sound, words } = rhyme;
      const topicData = TOPICS.find((t) => t.id === topic) || TOPICS[0];

      return `You are 8 Miles, a rap coach running a themed freestyle challenge.

CURRENT RHYME: ${sound}
THEME: ${topicData.name} (examples: ${topicData.examples.join(", ")})

RULES:
- Say 2 lines that rhyme with "${sound}" AND relate to the theme "${topicData.name}"
- After user responds, evaluate their bars:
  - Did they rhyme with ${sound}?
  - Did they stay on theme?
  - Rate briefly: "🔥🔥🔥 Perfect!" or "🔥🔥 Good rhyme!" or "🔥 Keep practicing!"
- Then continue with your next 2 themed lines
- Keep it fun but challenging

START by announcing the theme and dropping your opening bars about ${topicData.name}.`;
    },
  },
};

// Get mode by ID
export function getMode(modeId) {
  return MODES[modeId] || MODES.practice;
}

// Get all modes as array
export function getAllModes() {
  return Object.values(MODES);
}

// Build system prompt for a mode
export function buildSystemPrompt(modeId, rhyme, topic = null) {
  const mode = getMode(modeId);
  if (mode.id === "challenge" && topic) {
    return mode.buildPrompt(rhyme, topic);
  }
  return mode.buildPrompt(rhyme);
}
