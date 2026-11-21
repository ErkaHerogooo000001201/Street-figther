import { FIGHTER_CHARACTER_DEFINITIONS, getCharacterDefinition } from './hero';
import { RED_BRAWLER_CHARACTER_ID } from './redBrawler';
import { GREEN_BOXER_CHARACTER_ID } from './greenBoxer';
import { JIUJITSU_FIGHTER_CHARACTER_ID } from './jiujitsuFighter';
import type {
  AttackKind,
  AttackProfile,
  FighterBoundsVisibility,
  FighterCombat,
  FighterPlaygroundDebugState,
  FighterStats
} from './types';

export const FIGHTER_PLAYGROUND_CONFIG_FILE = '/configs/fighter-playground.json';
export const FIGHTER_PLAYGROUND_CONFIG_SAVE_TARGET = 'configs/fighter-playground.json';

/**
 * Baseline movement/physics stats applied to any fighter without a bespoke
 * override. These mirror the playground's original tuning constants.
 */
export const DEFAULT_FIGHTER_STATS: FighterStats = {
  walkSpeed: 230,
  airDrift: 190,
  jump: 980,
  gravity: 2300,
  scale: 1.4
};

/**
 * Per-character starting balance. Tunable in the playground debug panel and
 * persisted to `public/configs/fighter-playground.json`.
 */
const FIGHTER_STAT_OVERRIDES: Record<string, Partial<FighterStats>> = {
  [RED_BRAWLER_CHARACTER_ID]: {},
  [GREEN_BOXER_CHARACTER_ID]: { walkSpeed: 250, jump: 1000 },
  [JIUJITSU_FIGHTER_CHARACTER_ID]: { walkSpeed: 240, airDrift: 210, jump: 1040 },
  erkhembayar: { walkSpeed: 260, airDrift: 210, jump: 1030 },
  hero: { walkSpeed: 245, airDrift: 200, jump: 1000 },
  goku: { walkSpeed: 265, airDrift: 230, jump: 1060 },
  vegeta: { walkSpeed: 265, airDrift: 230, jump: 1050 },
  frieza: { walkSpeed: 255, airDrift: 235, jump: 1040 },
  naruto: { walkSpeed: 280, airDrift: 240, jump: 1080 },
  sasuke: { walkSpeed: 285, airDrift: 245, jump: 1080 },
  madara: { walkSpeed: 245, airDrift: 215, jump: 1020 },
  luffy: { walkSpeed: 255, airDrift: 210, jump: 1040 },
  zoro: { walkSpeed: 260, airDrift: 215, jump: 1030 },
  kaido: { walkSpeed: 210, airDrift: 170, jump: 940 },
  gojo: { walkSpeed: 245, airDrift: 230, jump: 1020 },
  sukuna: { walkSpeed: 270, airDrift: 225, jump: 1060 },
  toji: { walkSpeed: 300, airDrift: 260, jump: 1100 },
  tanjiro: { walkSpeed: 265, airDrift: 220, jump: 1050 },
  akaza: { walkSpeed: 285, airDrift: 240, jump: 1080 },
  muzan: { walkSpeed: 250, airDrift: 220, jump: 1030 },
  saitama: { walkSpeed: 260, airDrift: 200, jump: 1040 },
  garou: { walkSpeed: 285, airDrift: 245, jump: 1080 },
  boros: { walkSpeed: 255, airDrift: 225, jump: 1040 },
  ryu: { walkSpeed: 235, airDrift: 190, jump: 990 },
  chunli: { walkSpeed: 280, airDrift: 240, jump: 1080 },
  scorpion: { walkSpeed: 250, airDrift: 210, jump: 1020 },
  subzero: { walkSpeed: 245, airDrift: 205, jump: 1010 },
  kratos: { walkSpeed: 215, airDrift: 175, jump: 950 },
  cloud: { walkSpeed: 240, airDrift: 205, jump: 1010 },
  dante: { walkSpeed: 265, airDrift: 235, jump: 1060 },
  link: { walkSpeed: 245, airDrift: 205, jump: 1010 },
  megaman: { walkSpeed: 245, airDrift: 210, jump: 1020 },
  sonic: { walkSpeed: 330, airDrift: 290, jump: 1120 },
  // Expanded roster movement stats
  gohan: { walkSpeed: 280, airDrift: 240, jump: 1070 },
  trunks: { walkSpeed: 265, airDrift: 225, jump: 1040 },
  piccolo: { walkSpeed: 240, airDrift: 205, jump: 1000 },
  broly: { walkSpeed: 220, airDrift: 175, jump: 950 },
  cell: { walkSpeed: 260, airDrift: 230, jump: 1045 },
  kakashi: { walkSpeed: 280, airDrift: 240, jump: 1070 },
  itachi: { walkSpeed: 270, airDrift: 235, jump: 1060 },
  obito: { walkSpeed: 255, airDrift: 225, jump: 1030 },
  minato: { walkSpeed: 315, airDrift: 275, jump: 1100 },
  sanji: { walkSpeed: 290, airDrift: 255, jump: 1100 },
  shanks: { walkSpeed: 265, airDrift: 220, jump: 1040 },
  ace: { walkSpeed: 265, airDrift: 225, jump: 1045 },
  law: { walkSpeed: 260, airDrift: 225, jump: 1040 },
  yuji: { walkSpeed: 285, airDrift: 240, jump: 1080 },
  megumi: { walkSpeed: 255, airDrift: 215, jump: 1030 },
  yuta: { walkSpeed: 270, airDrift: 230, jump: 1050 },
  geto: { walkSpeed: 245, airDrift: 220, jump: 1010 },
  zenitsu: { walkSpeed: 315, airDrift: 270, jump: 1090 },
  inosuke: { walkSpeed: 285, airDrift: 235, jump: 1070 },
  rengoku: { walkSpeed: 265, airDrift: 220, jump: 1045 },
  kokushibo: { walkSpeed: 265, airDrift: 230, jump: 1045 },
  genos: { walkSpeed: 280, airDrift: 245, jump: 1060 },
  bang: { walkSpeed: 265, airDrift: 220, jump: 1040 },
  tatsumaki: { walkSpeed: 250, airDrift: 255, jump: 1075 },
  ichigo: { walkSpeed: 285, airDrift: 245, jump: 1075 },
  aizen: { walkSpeed: 255, airDrift: 230, jump: 1030 },
  byakuya: { walkSpeed: 260, airDrift: 225, jump: 1040 },
  kenpachi: { walkSpeed: 225, airDrift: 185, jump: 960 },
  eren: { walkSpeed: 230, airDrift: 185, jump: 970 },
  levi: { walkSpeed: 315, airDrift: 280, jump: 1110 },
  mikasa: { walkSpeed: 295, airDrift: 260, jump: 1090 },
  denji: { walkSpeed: 275, airDrift: 225, jump: 1050 },
  aki: { walkSpeed: 255, airDrift: 215, jump: 1030 },
  makima: { walkSpeed: 245, airDrift: 220, jump: 1020 },
  deku: { walkSpeed: 285, airDrift: 250, jump: 1095 },
  bakugo: { walkSpeed: 280, airDrift: 255, jump: 1090 },
  todoroki: { walkSpeed: 250, airDrift: 215, jump: 1025 },
  allmight: { walkSpeed: 245, airDrift: 205, jump: 1040 },
  jinwoo: { walkSpeed: 295, airDrift: 260, jump: 1090 },
  igris: { walkSpeed: 270, airDrift: 235, jump: 1055 },
  gon: { walkSpeed: 275, airDrift: 230, jump: 1065 },
  killua: { walkSpeed: 315, airDrift: 275, jump: 1105 },
  hisoka: { walkSpeed: 265, airDrift: 235, jump: 1050 },
  jotaro: { walkSpeed: 240, airDrift: 200, jump: 1000 },
  dio: { walkSpeed: 255, airDrift: 225, jump: 1035 },
  ken: { walkSpeed: 250, airDrift: 205, jump: 1015 },
  akuma: { walkSpeed: 255, airDrift: 220, jump: 1035 },
  cammy: { walkSpeed: 290, airDrift: 250, jump: 1085 },
  raiden: { walkSpeed: 255, airDrift: 230, jump: 1035 },
  liukang: { walkSpeed: 265, airDrift: 220, jump: 1045 },
  jin: { walkSpeed: 260, airDrift: 215, jump: 1035 },
  kazuya: { walkSpeed: 245, airDrift: 210, jump: 1015 },
  heihachi: { walkSpeed: 235, airDrift: 195, jump: 990 },
  shadow: { walkSpeed: 325, airDrift: 285, jump: 1115 },
  knuckles: { walkSpeed: 265, airDrift: 220, jump: 1045 },
  vergil: { walkSpeed: 290, airDrift: 255, jump: 1080 },
  sephiroth: { walkSpeed: 260, airDrift: 235, jump: 1045 },
  ganondorf: { walkSpeed: 205, airDrift: 165, jump: 930 },
  zero: { walkSpeed: 275, airDrift: 235, jump: 1065 },
  samus: { walkSpeed: 245, airDrift: 215, jump: 1020 },
  doomslayer: { walkSpeed: 235, airDrift: 190, jump: 980 },
  masterchief: { walkSpeed: 240, airDrift: 200, jump: 1000 },
  geralt: { walkSpeed: 255, airDrift: 215, jump: 1030 },
  temuujin: { walkSpeed: 255, airDrift: 210, jump: 1030 },
  bataar: { walkSpeed: 220, airDrift: 180, jump: 960 },
  nomad: { walkSpeed: 280, airDrift: 240, jump: 1075 },
  valkyrie: { walkSpeed: 275, airDrift: 245, jump: 1075 }
};

/**
 * Editable stat field metadata used to render the debug panel inputs and to
 * clamp values to sane ranges.
 */
export interface FighterStatField {
  id: keyof FighterStats;
  label: string;
  min: number;
  max: number;
  step: number;
}

export const FIGHTER_STAT_FIELDS: FighterStatField[] = [
  { id: 'walkSpeed', label: 'Walk speed', min: 40, max: 600, step: 5 },
  { id: 'airDrift', label: 'Air drift', min: 0, max: 600, step: 5 },
  { id: 'jump', label: 'Jump power', min: 200, max: 2000, step: 10 },
  { id: 'gravity', label: 'Gravity', min: 400, max: 5000, step: 25 },
  { id: 'scale', label: 'Scale', min: 0.5, max: 3, step: 0.05 }
];

/**
 * Baseline combat tuning applied to any fighter without a bespoke override.
 * The light attack ("high") is fast and light; the heavy attack ("low") hits
 * harder, pushes further, and stuns longer.
 */
export const DEFAULT_FIGHTER_COMBAT: FighterCombat = {
  maxHealth: 340,
  highDamage: 7,
  highKnockback: 180,
  highHitstun: 280,
  lowDamage: 12,
  lowKnockback: 340,
  lowHitstun: 440,
  specialDamage: 6,
  specialKnockback: 150,
  specialHitstun: 240
};

/**
 * Per-character combat balance. Tunable in the playground debug panel and
 * persisted alongside the movement stats.
 */
const FIGHTER_COMBAT_OVERRIDES: Record<string, Partial<FighterCombat>> = {
  [RED_BRAWLER_CHARACTER_ID]: { maxHealth: 340, specialDamage: 7, specialKnockback: 170 },
  [GREEN_BOXER_CHARACTER_ID]: { maxHealth: 335, highDamage: 9, highKnockback: 220, lowDamage: 10, lowKnockback: 300 },
  [JIUJITSU_FIGHTER_CHARACTER_ID]: {
    maxHealth: 350,
    highDamage: 6,
    lowDamage: 14,
    lowKnockback: 380,
    lowHitstun: 480,
    specialDamage: 5,
    specialHitstun: 220
  },
  erkhembayar: {
    maxHealth: 365,
    highDamage: 8,
    highKnockback: 205,
    highHitstun: 295,
    lowDamage: 15,
    lowKnockback: 365,
    lowHitstun: 465,
    specialDamage: 9,
    specialKnockback: 210,
    specialHitstun: 270
  },
  hero: {
    maxHealth: 355,
    highDamage: 8,
    highKnockback: 200,
    highHitstun: 290,
    lowDamage: 14,
    lowKnockback: 360,
    lowHitstun: 460,
    specialDamage: 9,
    specialKnockback: 210,
    specialHitstun: 270
  },
  goku: { maxHealth: 360, highDamage: 8, lowDamage: 14, specialDamage: 7 },
  vegeta: { maxHealth: 355, highDamage: 8, lowDamage: 14, specialDamage: 7 },
  frieza: { maxHealth: 340, highDamage: 7, lowDamage: 13, specialDamage: 8 },
  naruto: { maxHealth: 350, highDamage: 7, lowDamage: 13, specialDamage: 7 },
  sasuke: { maxHealth: 345, highDamage: 8, lowDamage: 14, specialDamage: 8 },
  madara: { maxHealth: 380, highDamage: 9, lowDamage: 15, specialDamage: 10 },
  luffy: { maxHealth: 375, highDamage: 8, lowDamage: 14, specialDamage: 6 },
  zoro: { maxHealth: 360, highDamage: 9, lowDamage: 15, specialDamage: 11 },
  kaido: { maxHealth: 430, highDamage: 10, highKnockback: 240, lowDamage: 17, lowKnockback: 420, specialDamage: 38 },
  gojo: { maxHealth: 365, highDamage: 7, lowDamage: 13, specialDamage: 7 },
  sukuna: { maxHealth: 385, highDamage: 9, lowDamage: 15, specialDamage: 9 },
  toji: { maxHealth: 335, highDamage: 8, lowDamage: 14, specialDamage: 11 },
  tanjiro: { maxHealth: 345, highDamage: 8, lowDamage: 15, specialDamage: 11 },
  akaza: { maxHealth: 360, highDamage: 8, lowDamage: 14, specialDamage: 7 },
  muzan: { maxHealth: 380, highDamage: 8, lowDamage: 15, specialDamage: 9 },
  saitama: { maxHealth: 360, highDamage: 10, highKnockback: 260, lowDamage: 17, lowKnockback: 440, specialDamage: 40 },
  garou: { maxHealth: 360, highDamage: 8, lowDamage: 14, specialDamage: 10 },
  boros: { maxHealth: 395, highDamage: 9, lowDamage: 15, specialDamage: 8 },
  ryu: { maxHealth: 355, highDamage: 8, lowDamage: 14, specialDamage: 7 },
  chunli: { maxHealth: 330, highDamage: 7, lowDamage: 13, specialDamage: 6 },
  scorpion: { maxHealth: 350, highDamage: 8, lowDamage: 14, specialDamage: 10 },
  subzero: { maxHealth: 350, highDamage: 8, lowDamage: 14, specialDamage: 8 },
  kratos: { maxHealth: 410, highDamage: 9, highKnockback: 220, lowDamage: 16, lowKnockback: 400, specialDamage: 9 },
  cloud: { maxHealth: 355, highDamage: 9, lowDamage: 16, specialDamage: 11 },
  dante: { maxHealth: 350, highDamage: 8, lowDamage: 14, specialDamage: 8 },
  link: { maxHealth: 350, highDamage: 8, lowDamage: 14, specialDamage: 10 },
  megaman: { maxHealth: 340, highDamage: 7, lowDamage: 13, specialDamage: 7 },
  sonic: { maxHealth: 320, highDamage: 7, lowDamage: 12, specialDamage: 8 },
  // Expanded roster high-vitality combat stats
  gohan: { maxHealth: 360, highDamage: 8, lowDamage: 15, specialDamage: 8 },
  trunks: { maxHealth: 345, highDamage: 8, lowDamage: 14, specialDamage: 10 },
  piccolo: { maxHealth: 380, highDamage: 8, lowDamage: 15, specialDamage: 8 },
  broly: { maxHealth: 435, highDamage: 10, highKnockback: 250, lowDamage: 17, lowKnockback: 430, specialDamage: 38 },
  cell: { maxHealth: 375, highDamage: 8, lowDamage: 14, specialDamage: 8 },
  kakashi: { maxHealth: 340, highDamage: 8, lowDamage: 14, specialDamage: 9 },
  itachi: { maxHealth: 340, highDamage: 8, lowDamage: 14, specialDamage: 9 },
  obito: { maxHealth: 360, highDamage: 8, lowDamage: 14, specialDamage: 9 },
  minato: { maxHealth: 335, highDamage: 8, lowDamage: 13, specialDamage: 8 },
  sanji: { maxHealth: 345, highDamage: 8, lowDamage: 14, specialDamage: 8 },
  shanks: { maxHealth: 380, highDamage: 9, lowDamage: 16, specialDamage: 11 },
  ace: { maxHealth: 345, highDamage: 8, lowDamage: 14, specialDamage: 8 },
  law: { maxHealth: 345, highDamage: 8, lowDamage: 14, specialDamage: 10 },
  yuji: { maxHealth: 355, highDamage: 8, lowDamage: 15, specialDamage: 7 },
  megumi: { maxHealth: 335, highDamage: 7, lowDamage: 13, specialDamage: 8 },
  yuta: { maxHealth: 360, highDamage: 8, lowDamage: 15, specialDamage: 10 },
  geto: { maxHealth: 355, highDamage: 8, lowDamage: 14, specialDamage: 8 },
  zenitsu: { maxHealth: 325, highDamage: 8, lowDamage: 13, specialDamage: 8 },
  inosuke: { maxHealth: 345, highDamage: 8, lowDamage: 14, specialDamage: 9 },
  rengoku: { maxHealth: 365, highDamage: 9, lowDamage: 15, specialDamage: 11 },
  kokushibo: { maxHealth: 385, highDamage: 9, lowDamage: 16, specialDamage: 11 },
  genos: { maxHealth: 340, highDamage: 8, lowDamage: 14, specialDamage: 8 },
  bang: { maxHealth: 360, highDamage: 8, lowDamage: 14, specialDamage: 9 },
  tatsumaki: { maxHealth: 335, highDamage: 7, lowDamage: 13, specialDamage: 8 },
  ichigo: { maxHealth: 360, highDamage: 8, lowDamage: 15, specialDamage: 11 },
  aizen: { maxHealth: 380, highDamage: 9, lowDamage: 15, specialDamage: 9 },
  byakuya: { maxHealth: 350, highDamage: 8, lowDamage: 14, specialDamage: 9 },
  kenpachi: { maxHealth: 415, highDamage: 10, highKnockback: 230, lowDamage: 17, lowKnockback: 400, specialDamage: 36 },
  eren: { maxHealth: 405, highDamage: 9, highKnockback: 220, lowDamage: 16, specialDamage: 9 },
  levi: { maxHealth: 330, highDamage: 8, lowDamage: 14, specialDamage: 9 },
  mikasa: { maxHealth: 335, highDamage: 8, lowDamage: 14, specialDamage: 9 },
  denji: { maxHealth: 355, highDamage: 8, lowDamage: 15, specialDamage: 9 },
  aki: { maxHealth: 335, highDamage: 8, lowDamage: 14, specialDamage: 10 },
  makima: { maxHealth: 365, highDamage: 8, lowDamage: 14, specialDamage: 9 },
  deku: { maxHealth: 350, highDamage: 8, lowDamage: 15, specialDamage: 9 },
  bakugo: { maxHealth: 345, highDamage: 8, lowDamage: 14, specialDamage: 8 },
  todoroki: { maxHealth: 345, highDamage: 7, lowDamage: 14, specialDamage: 9 },
  allmight: { maxHealth: 420, highDamage: 10, highKnockback: 245, lowDamage: 17, lowKnockback: 420, specialDamage: 39 },
  jinwoo: { maxHealth: 365, highDamage: 8, lowDamage: 15, specialDamage: 10 },
  igris: { maxHealth: 365, highDamage: 9, lowDamage: 15, specialDamage: 11 },
  gon: { maxHealth: 345, highDamage: 8, lowDamage: 15, specialDamage: 34 },
  killua: { maxHealth: 330, highDamage: 8, lowDamage: 13, specialDamage: 8 },
  hisoka: { maxHealth: 350, highDamage: 8, lowDamage: 14, specialDamage: 8 },
  jotaro: { maxHealth: 375, highDamage: 9, lowDamage: 15, specialDamage: 7 },
  dio: { maxHealth: 380, highDamage: 9, lowDamage: 15, specialDamage: 9 },
  ken: { maxHealth: 350, highDamage: 8, lowDamage: 14, specialDamage: 9 },
  akuma: { maxHealth: 345, highDamage: 9, lowDamage: 16, specialDamage: 9 },
  cammy: { maxHealth: 325, highDamage: 7, lowDamage: 13, specialDamage: 8 },
  raiden: { maxHealth: 355, highDamage: 8, lowDamage: 14, specialDamage: 10 },
  liukang: { maxHealth: 350, highDamage: 8, lowDamage: 14, specialDamage: 7 },
  jin: { maxHealth: 360, highDamage: 8, lowDamage: 15, specialDamage: 9 },
  kazuya: { maxHealth: 365, highDamage: 9, lowDamage: 15, specialDamage: 8 },
  heihachi: { maxHealth: 375, highDamage: 9, lowDamage: 16, specialDamage: 10 },
  shadow: { maxHealth: 325, highDamage: 8, lowDamage: 13, specialDamage: 8 },
  knuckles: { maxHealth: 365, highDamage: 9, lowDamage: 15, specialDamage: 9 },
  vergil: { maxHealth: 355, highDamage: 9, lowDamage: 15, specialDamage: 10 },
  sephiroth: { maxHealth: 375, highDamage: 9, lowDamage: 15, specialDamage: 11 },
  ganondorf: { maxHealth: 425, highDamage: 10, highKnockback: 245, lowDamage: 18, lowKnockback: 425, specialDamage: 40 },
  zero: { maxHealth: 345, highDamage: 8, lowDamage: 14, specialDamage: 11 },
  samus: { maxHealth: 365, highDamage: 8, lowDamage: 14, specialDamage: 8 },
  doomslayer: { maxHealth: 410, highDamage: 9, highKnockback: 230, lowDamage: 16, lowKnockback: 400, specialDamage: 10 },
  masterchief: { maxHealth: 395, highDamage: 8, lowDamage: 15, specialDamage: 8 },
  geralt: { maxHealth: 360, highDamage: 8, lowDamage: 15, specialDamage: 10 },
  temuujin: { maxHealth: 370, highDamage: 9, lowDamage: 15, specialDamage: 10 },
  bataar: { maxHealth: 400, highDamage: 9, lowDamage: 16, specialDamage: 9 },
  nomad: { maxHealth: 340, highDamage: 8, lowDamage: 14, specialDamage: 10 },
  valkyrie: { maxHealth: 345, highDamage: 8, lowDamage: 14, specialDamage: 10 }
};

/**
 * Editable combat field metadata used to render the debug panel inputs and to
 * clamp values to sane ranges.
 */
export interface FighterCombatField {
  id: keyof FighterCombat;
  label: string;
  min: number;
  max: number;
  step: number;
}

export const FIGHTER_COMBAT_FIELDS: FighterCombatField[] = [
  { id: 'maxHealth', label: 'Max HP', min: 50, max: 900, step: 10 },
  { id: 'highDamage', label: 'High dmg', min: 1, max: 50, step: 1 },
  { id: 'highKnockback', label: 'High kb', min: 0, max: 800, step: 10 },
  { id: 'highHitstun', label: 'High stun', min: 0, max: 1200, step: 20 },
  { id: 'lowDamage', label: 'Low dmg', min: 1, max: 50, step: 1 },
  { id: 'lowKnockback', label: 'Low kb', min: 0, max: 800, step: 10 },
  { id: 'lowHitstun', label: 'Low stun', min: 0, max: 1200, step: 20 },
  { id: 'specialDamage', label: 'Special dmg', min: 1, max: 50, step: 1 },
  { id: 'specialKnockback', label: 'Special kb', min: 0, max: 800, step: 10 },
  { id: 'specialHitstun', label: 'Special stun', min: 0, max: 1200, step: 20 }
];

/**
 * Debug bounds overlay metadata, shared by the playground panel (colour
 * swatches) and the scene renderer (stroke/fill colours).
 */
export interface FighterBoundsField {
  id: keyof FighterBoundsVisibility;
  label: string;
  color: string;
}

export const FIGHTER_BOUNDS_FIELDS: FighterBoundsField[] = [
  { id: 'visual', label: 'Visual', color: '#38bdf8' },
  { id: 'collision', label: 'Collision', color: '#facc15' },
  { id: 'hit', label: 'Hit', color: '#22c55e' },
  { id: 'attack', label: 'Attack', color: '#f43f5e' },
  { id: 'guard', label: 'Guard', color: '#a855f7' }
];

export interface FighterPlaygroundConfigExport {
  version: number;
  savedAt: string;
  characterId: string;
  reverseWalk: boolean;
  stats: Record<string, FighterStats>;
  combat: Record<string, FighterCombat>;
}

/**
 * Build the default per-character stats map for every selectable fighter.
 */
export function buildDefaultFighterStats(): Record<string, FighterStats> {
  const stats: Record<string, FighterStats> = {};

  FIGHTER_CHARACTER_DEFINITIONS.forEach((character) => {
    stats[character.id] = clampFighterStats({
      ...DEFAULT_FIGHTER_STATS,
      ...FIGHTER_STAT_OVERRIDES[character.id]
    });
  });

  return stats;
}

/**
 * Build the default per-character combat map for every selectable fighter.
 */
export function buildDefaultFighterCombat(): Record<string, FighterCombat> {
  const combat: Record<string, FighterCombat> = {};

  FIGHTER_CHARACTER_DEFINITIONS.forEach((character) => {
    combat[character.id] = clampFighterCombat({
      ...DEFAULT_FIGHTER_COMBAT,
      ...FIGHTER_COMBAT_OVERRIDES[character.id]
    });
  });

  return combat;
}

/**
 * Build the default Fighter Playground debug state (default selection + stats).
 */
export function createDefaultFighterPlaygroundState(): FighterPlaygroundDebugState {
  return {
    characterId: defaultFighterCharacterId(),
    stats: buildDefaultFighterStats(),
    combat: buildDefaultFighterCombat(),
    bounds: { visual: false, collision: false, hit: false, attack: false, guard: false },
    reverseWalk: false,
    fillSpecial: false,
    saveStatus: 'Loaded from public/configs/fighter-playground.json'
  };
}

/**
 * Resolve the stats for a character, falling back to defaults when absent.
 * @param state - The current playground debug state.
 * @param characterId - The character to resolve stats for.
 */
export function getFighterStats(
  state: FighterPlaygroundDebugState,
  characterId: string
): FighterStats {
  return state.stats[characterId] ?? clampFighterStats(DEFAULT_FIGHTER_STATS);
}

/**
 * Resolve the combat tuning for a character, falling back to defaults.
 * @param state - The current playground debug state.
 * @param characterId - The character to resolve combat for.
 */
export function getFighterCombat(
  state: FighterPlaygroundDebugState,
  characterId: string
): FighterCombat {
  return state.combat?.[characterId] ?? clampFighterCombat(DEFAULT_FIGHTER_COMBAT);
}

/**
 * Resolve a single attack's profile (damage/knockback/hitstun + guard height)
 * for the given attack button.
 * @param combat - The character's combat tuning.
 * @param kind - Which attack: `high` (light) or `low` (heavy).
 */
export function getAttackProfile(combat: FighterCombat, kind: AttackKind): AttackProfile {
  if (kind === 'high') {
    return {
      kind: 'high',
      height: 'high',
      damage: combat.highDamage,
      knockback: combat.highKnockback,
      hitstun: combat.highHitstun
    };
  }

  if (kind === 'special') {
    return {
      kind: 'special',
      height: 'high',
      damage: combat.specialDamage,
      knockback: combat.specialKnockback,
      hitstun: combat.specialHitstun
    };
  }

  return {
    kind: 'low',
    height: 'low',
    damage: combat.lowDamage,
    knockback: combat.lowKnockback,
    hitstun: combat.lowHitstun
  };
}

/**
 * Serialize the playground stats for persistence.
 * @param state - The current playground debug state.
 */
export function buildFighterPlaygroundConfigExport(
  state: FighterPlaygroundDebugState
): FighterPlaygroundConfigExport {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    characterId: normalizeFighterCharacterId(state.characterId),
    reverseWalk: Boolean(state.reverseWalk),
    stats: normalizeFighterStatsMap(state.stats),
    combat: normalizeFighterCombatMap(state.combat)
  };
}

/**
 * Fetch the persisted playground config, returning null when unavailable.
 */
export async function loadFighterPlaygroundConfig(): Promise<Partial<FighterPlaygroundConfigExport> | null> {
  try {
    const response = await fetch(FIGHTER_PLAYGROUND_CONFIG_FILE, { cache: 'no-store' });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Partial<FighterPlaygroundConfigExport>;
  } catch {
    return null;
  }
}

/**
 * Merge a persisted config into the current playground state, keeping defaults
 * for any missing characters or fields.
 * @param current - The current playground debug state.
 * @param saved - The persisted config (may be partial or null).
 */
export function mergeFighterPlaygroundState(
  current: FighterPlaygroundDebugState,
  saved: Partial<FighterPlaygroundConfigExport> | null
): FighterPlaygroundDebugState {
  if (!saved) {
    return current;
  }

  const mergedStats: Record<string, FighterStats> = { ...current.stats };

  if (saved.stats && typeof saved.stats === 'object') {
    FIGHTER_CHARACTER_DEFINITIONS.forEach((character) => {
      const savedStats = saved.stats?.[character.id];

      if (savedStats) {
        mergedStats[character.id] = clampFighterStats({
          ...mergedStats[character.id],
          ...savedStats
        });
      }
    });
  }

  const mergedCombat: Record<string, FighterCombat> = { ...current.combat };

  if (saved.combat && typeof saved.combat === 'object') {
    FIGHTER_CHARACTER_DEFINITIONS.forEach((character) => {
      const savedCombat = saved.combat?.[character.id];

      if (savedCombat) {
        mergedCombat[character.id] = clampFighterCombat({
          ...mergedCombat[character.id],
          ...savedCombat
        });
      }
    });
  }

  return {
    ...current,
    characterId: normalizeFighterCharacterId(saved.characterId ?? current.characterId),
    reverseWalk: typeof saved.reverseWalk === 'boolean' ? saved.reverseWalk : current.reverseWalk,
    stats: mergedStats,
    combat: mergedCombat
  };
}

/**
 * Clamp a stats object to the configured field ranges, filling missing fields.
 * @param value - Partial stats to clamp.
 */
export function clampFighterStats(value: Partial<FighterStats>): FighterStats {
  const result = {} as FighterStats;

  FIGHTER_STAT_FIELDS.forEach((field) => {
    result[field.id] = clamp(value[field.id], field.min, field.max, DEFAULT_FIGHTER_STATS[field.id]);
  });

  return result;
}

/**
 * Clamp a combat object to the configured field ranges, filling missing fields.
 * @param value - Partial combat tuning to clamp.
 */
export function clampFighterCombat(value: Partial<FighterCombat>): FighterCombat {
  const result = {} as FighterCombat;

  FIGHTER_COMBAT_FIELDS.forEach((field) => {
    result[field.id] = clamp(value[field.id], field.min, field.max, DEFAULT_FIGHTER_COMBAT[field.id]);
  });

  return result;
}

/**
 * Default selectable fighter (first fighter in the roster, preferring the red brawler).
 */
export function defaultFighterCharacterId(): string {
  const preferred = FIGHTER_CHARACTER_DEFINITIONS.find(
    (character) => character.id === RED_BRAWLER_CHARACTER_ID
  );

  return preferred?.id ?? FIGHTER_CHARACTER_DEFINITIONS[0]?.id ?? RED_BRAWLER_CHARACTER_ID;
}

function normalizeFighterCharacterId(value: unknown): string {
  if (typeof value === 'string' && FIGHTER_CHARACTER_DEFINITIONS.some((character) => character.id === value)) {
    return getCharacterDefinition(value).id;
  }

  return defaultFighterCharacterId();
}

function normalizeFighterStatsMap(value: unknown): Record<string, FighterStats> {
  const stats: Record<string, FighterStats> = {};

  FIGHTER_CHARACTER_DEFINITIONS.forEach((character) => {
    const candidate = (value as Record<string, Partial<FighterStats>> | undefined)?.[character.id];
    stats[character.id] = clampFighterStats({
      ...DEFAULT_FIGHTER_STATS,
      ...FIGHTER_STAT_OVERRIDES[character.id],
      ...candidate
    });
  });

  return stats;
}

function normalizeFighterCombatMap(value: unknown): Record<string, FighterCombat> {
  const combat: Record<string, FighterCombat> = {};

  FIGHTER_CHARACTER_DEFINITIONS.forEach((character) => {
    const candidate = (value as Record<string, Partial<FighterCombat>> | undefined)?.[character.id];
    combat[character.id] = clampFighterCombat({
      ...DEFAULT_FIGHTER_COMBAT,
      ...FIGHTER_COMBAT_OVERRIDES[character.id],
      ...candidate
    });
  });

  return combat;
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}
