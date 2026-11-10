import type { SportType } from "./api/courts.ts";

export const SPORT_EMOJIS: Record<SportType, string> = {
  tennis: "🎾",
  padel: "🏓",
  squash: "🥎",
  badminton: "🏸",
  pickleball: "🥒",
};

export const SPORT_LABELS: Record<SportType, string> = {
  tennis: "Tennis",
  padel: "Padel",
  squash: "Squash",
  badminton: "Badminton",
  pickleball: "Pickleball",
};

export const SPORT_TYPES = Object.keys(SPORT_LABELS) as SportType[];
