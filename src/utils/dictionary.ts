// Standard GamePigeon Anagrams scoring rule
export function calculateWordScore(word: string): number {
  const len = word.length;
  switch (len) {
    case 3:
      return 100;
    case 4:
      return 400;
    case 5:
      return 1200;
    case 6:
      return 2000;
    case 7:
      return 3000;
    default:
      return len > 7 ? 4000 : 0;
  }
}

// Curated 6-letter and 7-letter roots that yield exciting, rich anagram puzzles
export const PUZZLE_ROOTS = [
  'SPRAWL', // WASPRL from the screenshot!
  'PLANET',
  'STREAM',
  'CASTLE',
  'FLOWER',
  'GARDEN',
  'SILVER',
  'FROZEN',
  'BASKET',
  'YELLOW',
  'TRAVEL',
  'WONDER',
  'BRIDGE',
  'MONKEY',
  'ROCKET',
  'KNIGHT',
  'DRAGON',
  'SPRING',
  'FOREST',
  'WINTER',
  'SUMMER',
  'GOLDEN',
  'BRIGHT',
  'SHADOW',
  'NATURE',
  'SPIRIT',
  'MASTER',
  'HEROIC',
  'PRINCE',
  'FRIEND',
  'FAMILY',
  'SIMPLE',
  'LITTLE',
  'PERSON',
  'SYSTEM',
  'ACTIVE',
  'ACTION',
  'BEAUTY',
  'CAMERA',
  'CHARGE',
  'CIRCLE',
  'COFFEE',
  'DANGER',
  'DESERT',
  'DOCTOR',
  'DOLLAR',
  'ENERGY',
  'ENGINE',
  'FAMILY',
  'FARMER',
  'FINGER',
  'FUTURE',
  'GARDEN',
  'GUITAR',
  'HAMMER',
  'HEALTH',
  'HUNTER',
  'ISLAND',
  'JACKET',
  'JUNGLE',
  'LEADER',
  'MARKET',
  'MEMORY',
  'MINUTE',
  'MIRROR',
  'MOTION',
  'MUSEUM',
  'NATION',
  'NOTICE',
  'NUMBER',
  'OBJECT',
  'ORANGE',
  'PALACE',
  'PENCIL',
  'PIRATE',
  'POCKET',
  'PRISON',
  'RABBIT',
  'RECORD',
  'RIVER',
  'ROCKET',
  'SAILOR',
  'SAMPLE',
  'SCHOOL',
  'SEASON',
  'SECRET',
  'SHADOW',
  'SHIELD',
  'SIGNAL',
  'SILVER',
  'SISTER',
  'SOCKET',
  'SPIDER',
  'SPIRIT',
  'SQUARE',
  'STATUE',
  'STRIPE',
  'STUDIO',
  'SUMMER',
  'SUNSET',
  'TARGET',
  'TEMPLE',
  'TICKET',
  'TIMBER',
  'TOWEL',
  'TRAVEL',
  'TUNNEL',
  'VALLEY',
  'VESSEL',
  'VICTIM',
  'VILLAGE',
  'VOICE',
  'VOLUME',
  'WEAPON',
  'WINDOW',
  'WINTER',
  'WIZARD',
  'WONDER',
  'WRITER',
  'YELLOW'
];

// Rich core dictionary word list
import { EXTENDED_WORD_LIST } from './wordList';

export const DICTIONARY = new Set(EXTENDED_WORD_LIST);

// Check if a word can be formed from given pool of letters
export function canFormWord(word: string, letterPool: string): boolean {
  const poolCount: Record<string, number> = {};
  for (const ch of letterPool.toUpperCase()) {
    poolCount[ch] = (poolCount[ch] || 0) + 1;
  }

  for (const ch of word.toUpperCase()) {
    if (!poolCount[ch] || poolCount[ch] <= 0) {
      return false;
    }
    poolCount[ch]--;
  }
  return true;
}

// Find all valid dictionary words that can be made with these letters
export function findAllValidAnagrams(letters: string): string[] {
  const cleanLetters = letters.toUpperCase();
  const valid: string[] = [];

  for (const word of EXTENDED_WORD_LIST) {
    if (word.length >= 3 && word.length <= cleanLetters.length && canFormWord(word, cleanLetters)) {
      valid.push(word);
    }
  }

  // Sort by length descending, then alphabetical
  return valid.sort((a, b) => b.length - a.length || a.localeCompare(b));
}

// Select a random root or generate a scramble
export function getRandomPuzzle(length: 6 | 7 = 6): { root: string; scrambled: string; allValidWords: string[]; maxScore: number } {
  const filteredRoots = PUZZLE_ROOTS.filter(r => r.length === length);
  const root = filteredRoots[Math.floor(Math.random() * filteredRoots.length)] || 'SPRAWL';
  
  // Scramble letters
  let letters = root.split('');
  // Shuffle until it is not identical to root
  for (let tries = 0; tries < 10; tries++) {
    letters = shuffleArray(letters);
    if (letters.join('') !== root) break;
  }

  const allValidWords = findAllValidAnagrams(root);
  const maxScore = allValidWords.reduce((sum, w) => sum + calculateWordScore(w), 0);

  return {
    root,
    scrambled: letters.join(''),
    allValidWords,
    maxScore,
  };
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
