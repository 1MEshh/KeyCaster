export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or Lucide icon name
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_session",
    title: "First Cast",
    description: "Complete your first practice session.",
    icon: "🪄",
    rarity: "common",
  },
  {
    id: "flawless",
    title: "Flawless Cast",
    description: "Finish a session with 100% accuracy.",
    icon: "🎯",
    rarity: "rare",
  },
  {
    id: "speed_demon_80",
    title: "Speed Demon",
    description: "Achieve 80+ WPM in any session.",
    icon: "⚡",
    rarity: "rare",
  },
  {
    id: "century_club",
    title: "Century Club",
    description: "Surpass 100 WPM in a session.",
    icon: "🔥",
    rarity: "epic",
  },
  {
    id: "grandmaster_120",
    title: "Mach 2",
    description: "Reach an incredible 120+ WPM.",
    icon: "👑",
    rarity: "legendary",
  },
  {
    id: "streak_3",
    title: "Daily Dedication",
    description: "Maintain a 3-day practice streak.",
    icon: "📅",
    rarity: "common",
  },
  {
    id: "streak_7",
    title: "Iron Caster",
    description: "Maintain a 7-day practice streak.",
    icon: "🛡️",
    rarity: "epic",
  },
  {
    id: "words_50",
    title: "Word Initiate",
    description: "Type 50 words across your sessions.",
    icon: "📚",
    rarity: "common",
  },
  {
    id: "words_250",
    title: "Word Scholar",
    description: "Type 250 words total.",
    icon: "📜",
    rarity: "rare",
  },
  {
    id: "blind_master",
    title: "Acoustic Sense",
    description: "Complete a session with Blind Mode active.",
    icon: "🎧",
    rarity: "rare",
  },
  {
    id: "night_owl",
    title: "Night Owl",
    description: "Practice between midnight and 5:00 AM.",
    icon: "🦉",
    rarity: "rare",
  },
];
