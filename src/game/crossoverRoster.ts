import type { CharacterDefinition } from './hero';
import { buildFighterCharacter, rect, type FighterActionSpec } from './fighterCharacter';

export type CrossoverHeadgear =
  | 'spiky-gold'
  | 'ninja-band'
  | 'straw-hat'
  | 'blindfold-white'
  | 'slayer-hair'
  | 'bald-cape'
  | 'karate-band'
  | 'scorpion-hood'
  | 'spartan'
  | 'hero-cap';

export type CrossoverWeapon = 'none' | 'katana' | 'sword-shield' | 'chaos-blades' | 'kunai';

export interface CrossoverVisualProfile {
  id: string;
  label: string;
  universe: 'Anime' | 'Game' | 'Original';
  origin: string;
  /** Existing sheet ID in CROSSOVER_SOURCE_SHEETS when sharing base poses with palette remap. */
  baseSheetId?: string;
  /** Optional hue rotation (degrees) applied cleanly to clothing/hair/aura when sharing a base sheet. */
  hueShiftDeg?: number;
  skin: string;
  skinShade: string;
  outfitPrimary: string;
  outfitSecondary: string;
  beltOrTrim: string;
  hairColor: string;
  eyeColor: string;
  auraColor: string;
  auraGlow: string;
  headgear: CrossoverHeadgear;
  weapon: CrossoverWeapon;
  capeColor?: string;
  scarMark?: 'cheek-whiskers' | 'chest-x' | 'forehead-scar' | 'omega-tattoo';
  gloveColor: string;
  bootColor: string;
}

export const CROSSOVER_PROFILES: CrossoverVisualProfile[] = [
  {
    id: 'goku',
    label: 'Goku',
    universe: 'Anime',
    origin: 'Dragon Ball',
    skin: '#f4c7a1',
    skinShade: '#d99f77',
    outfitPrimary: '#f97316',
    outfitSecondary: '#1d4ed8',
    beltOrTrim: '#2563eb',
    hairColor: '#facc15',
    eyeColor: '#22d3ee',
    auraColor: '#38bdf8',
    auraGlow: '#fde047',
    headgear: 'spiky-gold',
    weapon: 'none',
    gloveColor: '#1d4ed8',
    bootColor: '#1e3a8a'
  },
  {
    id: 'vegeta',
    label: 'Vegeta',
    universe: 'Anime',
    origin: 'Dragon Ball',
    skin: '#f4c7a1',
    skinShade: '#d99f77',
    outfitPrimary: '#1d4ed8',
    outfitSecondary: '#f8fafc',
    beltOrTrim: '#facc15',
    hairColor: '#0f172a',
    eyeColor: '#0f172a',
    auraColor: '#facc15',
    auraGlow: '#38bdf8',
    headgear: 'spiky-gold',
    weapon: 'none',
    gloveColor: '#f8fafc',
    bootColor: '#f8fafc'
  },
  {
    id: 'frieza',
    label: 'Frieza',
    universe: 'Anime',
    origin: 'Dragon Ball',
    skin: '#f8fafc',
    skinShade: '#cbd5e1',
    outfitPrimary: '#9333ea',
    outfitSecondary: '#f8fafc',
    beltOrTrim: '#a855f7',
    hairColor: '#9333ea',
    eyeColor: '#ef4444',
    auraColor: '#a855f7',
    auraGlow: '#e879f9',
    headgear: 'spartan',
    weapon: 'none',
    gloveColor: '#f8fafc',
    bootColor: '#f8fafc'
  },
  {
    id: 'naruto',
    label: 'Naruto',
    universe: 'Anime',
    origin: 'Naruto',
    skin: '#f6cca8',
    skinShade: '#dc9f77',
    outfitPrimary: '#fb923c',
    outfitSecondary: '#1e293b',
    beltOrTrim: '#e2e8f0',
    hairColor: '#fde047',
    eyeColor: '#38bdf8',
    auraColor: '#38bdf8',
    auraGlow: '#f97316',
    headgear: 'ninja-band',
    weapon: 'none',
    scarMark: 'cheek-whiskers',
    gloveColor: '#f6cca8',
    bootColor: '#1e293b'
  },
  {
    id: 'sasuke',
    label: 'Sasuke',
    universe: 'Anime',
    origin: 'Naruto',
    skin: '#f6d0b4',
    skinShade: '#d6a484',
    outfitPrimary: '#e2e8f0',
    outfitSecondary: '#1e293b',
    beltOrTrim: '#9333ea',
    hairColor: '#0f172a',
    eyeColor: '#ef4444',
    auraColor: '#38bdf8',
    auraGlow: '#a855f7',
    headgear: 'spiky-gold',
    weapon: 'katana',
    gloveColor: '#1e293b',
    bootColor: '#1e293b'
  },
  {
    id: 'madara',
    label: 'Madara',
    universe: 'Anime',
    origin: 'Naruto',
    skin: '#f2c7a8',
    skinShade: '#cf9a79',
    outfitPrimary: '#b91c1c',
    outfitSecondary: '#0f172a',
    beltOrTrim: '#f97316',
    hairColor: '#0f172a',
    eyeColor: '#ef4444',
    auraColor: '#f97316',
    auraGlow: '#dc2626',
    headgear: 'slayer-hair',
    weapon: 'katana',
    gloveColor: '#0f172a',
    bootColor: '#0f172a'
  },
  {
    id: 'luffy',
    label: 'Luffy',
    universe: 'Anime',
    origin: 'One Piece',
    skin: '#f3c6a0',
    skinShade: '#d49a72',
    outfitPrimary: '#dc2626',
    outfitSecondary: '#2563eb',
    beltOrTrim: '#facc15',
    hairColor: '#111827',
    eyeColor: '#111827',
    auraColor: '#fb7185',
    auraGlow: '#fde047',
    headgear: 'straw-hat',
    weapon: 'none',
    scarMark: 'chest-x',
    gloveColor: '#f3c6a0',
    bootColor: '#92400e'
  },
  {
    id: 'zoro',
    label: 'Zoro',
    universe: 'Anime',
    origin: 'One Piece',
    skin: '#f0c49f',
    skinShade: '#cf986e',
    outfitPrimary: '#15803d',
    outfitSecondary: '#111827',
    beltOrTrim: '#dc2626',
    hairColor: '#22c55e',
    eyeColor: '#111827',
    auraColor: '#22c55e',
    auraGlow: '#a855f7',
    headgear: 'karate-band',
    weapon: 'katana',
    gloveColor: '#f0c49f',
    bootColor: '#111827'
  },
  {
    id: 'kaido',
    label: 'Kaido',
    universe: 'Anime',
    origin: 'One Piece',
    skin: '#eab68f',
    skinShade: '#c68a62',
    outfitPrimary: '#7e22ce',
    outfitSecondary: '#3f3f46',
    beltOrTrim: '#facc15',
    hairColor: '#0f172a',
    eyeColor: '#ef4444',
    auraColor: '#facc15',
    auraGlow: '#a855f7',
    headgear: 'spartan',
    weapon: 'chaos-blades',
    gloveColor: '#18181b',
    bootColor: '#18181b'
  },
  {
    id: 'gojo',
    label: 'Gojo',
    universe: 'Anime',
    origin: 'Jujutsu Kaisen',
    skin: '#f7d8c4',
    skinShade: '#dfb29a',
    outfitPrimary: '#111827',
    outfitSecondary: '#1e1b4b',
    beltOrTrim: '#a855f7',
    hairColor: '#f8fafc',
    eyeColor: '#38bdf8',
    auraColor: '#a855f7',
    auraGlow: '#38bdf8',
    headgear: 'blindfold-white',
    weapon: 'none',
    gloveColor: '#f7d8c4',
    bootColor: '#0f172a'
  },
  {
    id: 'sukuna',
    label: 'Sukuna',
    universe: 'Anime',
    origin: 'Jujutsu Kaisen',
    skin: '#f4c7ab',
    skinShade: '#d49d7d',
    outfitPrimary: '#f1f5f9',
    outfitSecondary: '#111827',
    beltOrTrim: '#dc2626',
    hairColor: '#fb7185',
    eyeColor: '#ef4444',
    auraColor: '#ef4444',
    auraGlow: '#f97316',
    headgear: 'spiky-gold',
    weapon: 'chaos-blades',
    gloveColor: '#111827',
    bootColor: '#111827'
  },
  {
    id: 'toji',
    label: 'Toji',
    universe: 'Anime',
    origin: 'Jujutsu Kaisen',
    skin: '#ecc19c',
    skinShade: '#cb976f',
    outfitPrimary: '#0f172a',
    outfitSecondary: '#f8fafc',
    beltOrTrim: '#111827',
    hairColor: '#0f172a',
    eyeColor: '#22c55e',
    auraColor: '#e2e8f0',
    auraGlow: '#38bdf8',
    headgear: 'slayer-hair',
    weapon: 'kunai',
    gloveColor: '#ecc19c',
    bootColor: '#0f172a'
  },
  {
    id: 'tanjiro',
    label: 'Tanjiro',
    universe: 'Anime',
    origin: 'Demon Slayer',
    skin: '#f4cab0',
    skinShade: '#d89d7d',
    outfitPrimary: '#10b981',
    outfitSecondary: '#111827',
    beltOrTrim: '#f8fafc',
    hairColor: '#450a0a',
    eyeColor: '#b91c1c',
    auraColor: '#f97316',
    auraGlow: '#fde047',
    headgear: 'slayer-hair',
    weapon: 'katana',
    scarMark: 'forehead-scar',
    gloveColor: '#f4cab0',
    bootColor: '#111827'
  },
  {
    id: 'akaza',
    label: 'Akaza',
    universe: 'Anime',
    origin: 'Demon Slayer',
    skin: '#e2e8f0',
    skinShade: '#94a3b8',
    outfitPrimary: '#be123c',
    outfitSecondary: '#f8fafc',
    beltOrTrim: '#1d4ed8',
    hairColor: '#f43f5e',
    eyeColor: '#facc15',
    auraColor: '#38bdf8',
    auraGlow: '#f43f5e',
    headgear: 'spiky-gold',
    weapon: 'none',
    gloveColor: '#e2e8f0',
    bootColor: '#e2e8f0'
  },
  {
    id: 'muzan',
    label: 'Muzan',
    universe: 'Anime',
    origin: 'Demon Slayer',
    skin: '#f1f5f9',
    skinShade: '#cbd5e1',
    outfitPrimary: '#0f172a',
    outfitSecondary: '#f8fafc',
    beltOrTrim: '#dc2626',
    hairColor: '#0f172a',
    eyeColor: '#dc2626',
    auraColor: '#dc2626',
    auraGlow: '#991b1b',
    headgear: 'hero-cap',
    weapon: 'chaos-blades',
    gloveColor: '#f1f5f9',
    bootColor: '#0f172a'
  },
  {
    id: 'saitama',
    label: 'Saitama',
    universe: 'Anime',
    origin: 'One Punch Man',
    skin: '#f7cfb2',
    skinShade: '#dca37d',
    outfitPrimary: '#facc15',
    outfitSecondary: '#eab308',
    beltOrTrim: '#111827',
    hairColor: '#f7cfb2',
    eyeColor: '#111827',
    auraColor: '#facc15',
    auraGlow: '#ef4444',
    headgear: 'bald-cape',
    weapon: 'none',
    capeColor: '#f8fafc',
    gloveColor: '#dc2626',
    bootColor: '#dc2626'
  },
  {
    id: 'garou',
    label: 'Garou',
    universe: 'Anime',
    origin: 'One Punch Man',
    skin: '#f2c7a8',
    skinShade: '#cf9a79',
    outfitPrimary: '#111827',
    outfitSecondary: '#f8fafc',
    beltOrTrim: '#38bdf8',
    hairColor: '#e2e8f0',
    eyeColor: '#facc15',
    auraColor: '#06b6d4',
    auraGlow: '#38bdf8',
    headgear: 'spiky-gold',
    weapon: 'none',
    gloveColor: '#f2c7a8',
    bootColor: '#111827'
  },
  {
    id: 'boros',
    label: 'Boros',
    universe: 'Anime',
    origin: 'One Punch Man',
    skin: '#60a5fa',
    skinShade: '#3b82f6',
    outfitPrimary: '#facc15',
    outfitSecondary: '#1e3a8a',
    beltOrTrim: '#a855f7',
    hairColor: '#f472b6',
    eyeColor: '#22d3ee',
    auraColor: '#c084fc',
    auraGlow: '#38bdf8',
    headgear: 'spiky-gold',
    weapon: 'none',
    gloveColor: '#facc15',
    bootColor: '#facc15'
  },
  {
    id: 'ryu',
    label: 'Ryu',
    universe: 'Game',
    origin: 'Street Fighter',
    skin: '#eec09a',
    skinShade: '#cd946a',
    outfitPrimary: '#f8fafc',
    outfitSecondary: '#e2e8f0',
    beltOrTrim: '#111827',
    hairColor: '#292524',
    eyeColor: '#1c1917',
    auraColor: '#60a5fa',
    auraGlow: '#e0f2fe',
    headgear: 'karate-band',
    weapon: 'none',
    gloveColor: '#ef4444',
    bootColor: '#eec09a'
  },
  {
    id: 'chunli',
    label: 'Chun-Li',
    universe: 'Game',
    origin: 'Street Fighter',
    skin: '#f5ccb0',
    skinShade: '#d89d7d',
    outfitPrimary: '#2563eb',
    outfitSecondary: '#facc15',
    beltOrTrim: '#f8fafc',
    hairColor: '#1e1b4b',
    eyeColor: '#1e293b',
    auraColor: '#38bdf8',
    auraGlow: '#facc15',
    headgear: 'karate-band',
    weapon: 'none',
    gloveColor: '#78350f',
    bootColor: '#f8fafc'
  },
  {
    id: 'scorpion',
    label: 'Scorpion',
    universe: 'Game',
    origin: 'Mortal Kombat',
    skin: '#deb892',
    skinShade: '#b88d67',
    outfitPrimary: '#eab308',
    outfitSecondary: '#111827',
    beltOrTrim: '#78350f',
    hairColor: '#111827',
    eyeColor: '#fef08a',
    auraColor: '#f97316',
    auraGlow: '#ef4444',
    headgear: 'scorpion-hood',
    weapon: 'kunai',
    gloveColor: '#111827',
    bootColor: '#111827'
  },
  {
    id: 'subzero',
    label: 'Sub-Zero',
    universe: 'Game',
    origin: 'Mortal Kombat',
    skin: '#deb892',
    skinShade: '#b88d67',
    outfitPrimary: '#0ea5e9',
    outfitSecondary: '#0f172a',
    beltOrTrim: '#38bdf8',
    hairColor: '#0f172a',
    eyeColor: '#e0f2fe',
    auraColor: '#06b6d4',
    auraGlow: '#e0f2fe',
    headgear: 'scorpion-hood',
    weapon: 'none',
    gloveColor: '#0f172a',
    bootColor: '#0f172a'
  },
  {
    id: 'kratos',
    label: 'Kratos',
    universe: 'Game',
    origin: 'God of War',
    skin: '#e2e8f0',
    skinShade: '#94a3b8',
    outfitPrimary: '#78350f',
    outfitSecondary: '#451a03',
    beltOrTrim: '#d97706',
    hairColor: '#1e293b',
    eyeColor: '#f59e0b',
    auraColor: '#ef4444',
    auraGlow: '#f97316',
    headgear: 'spartan',
    weapon: 'chaos-blades',
    scarMark: 'omega-tattoo',
    gloveColor: '#78350f',
    bootColor: '#451a03'
  },
  {
    id: 'cloud',
    label: 'Cloud',
    universe: 'Game',
    origin: 'Final Fantasy VII',
    skin: '#f6d0ad',
    skinShade: '#d9a478',
    outfitPrimary: '#1e293b',
    outfitSecondary: '#334155',
    beltOrTrim: '#94a3b8',
    hairColor: '#fde047',
    eyeColor: '#22d3ee',
    auraColor: '#22d3ee',
    auraGlow: '#facc15',
    headgear: 'spiky-gold',
    weapon: 'katana',
    gloveColor: '#111827',
    bootColor: '#1e293b'
  },
  {
    id: 'dante',
    label: 'Dante',
    universe: 'Game',
    origin: 'Devil May Cry',
    skin: '#f4ccb0',
    skinShade: '#d29e7d',
    outfitPrimary: '#dc2626',
    outfitSecondary: '#111827',
    beltOrTrim: '#94a3b8',
    hairColor: '#e2e8f0',
    eyeColor: '#38bdf8',
    auraColor: '#ef4444',
    auraGlow: '#fde047',
    headgear: 'slayer-hair',
    weapon: 'katana',
    gloveColor: '#111827',
    bootColor: '#111827'
  },
  {
    id: 'link',
    label: 'Link',
    universe: 'Game',
    origin: 'Zelda',
    skin: '#f6cfa9',
    skinShade: '#d9a478',
    outfitPrimary: '#16a34a',
    outfitSecondary: '#f8fafc',
    beltOrTrim: '#92400e',
    hairColor: '#fde047',
    eyeColor: '#38bdf8',
    auraColor: '#22c55e',
    auraGlow: '#facc15',
    headgear: 'hero-cap',
    weapon: 'sword-shield',
    gloveColor: '#92400e',
    bootColor: '#78350f'
  },
  {
    id: 'megaman',
    label: 'Mega Man',
    universe: 'Game',
    origin: 'Mega Man',
    skin: '#f4c9a4',
    skinShade: '#d49d76',
    outfitPrimary: '#0284c7',
    outfitSecondary: '#22d3ee',
    beltOrTrim: '#ef4444',
    hairColor: '#0284c7',
    eyeColor: '#38bdf8',
    auraColor: '#0ea5e9',
    auraGlow: '#67e8f9',
    headgear: 'hero-cap',
    weapon: 'none',
    gloveColor: '#0284c7',
    bootColor: '#0284c7'
  },
  {
    id: 'erkhembayar',
    label: 'Erkhembayar',
    universe: 'Original',
    origin: 'Hero Swag Edition',
    skin: '#f2c7a4',
    skinShade: '#d09b75',
    outfitPrimary: '#2563eb',
    outfitSecondary: '#1d4ed8',
    beltOrTrim: '#f8fafc',
    hairColor: '#1e1b18',
    eyeColor: '#1e1b18',
    auraColor: '#2563eb',
    auraGlow: '#facc15',
    headgear: 'slayer-hair',
    weapon: 'none',
    gloveColor: '#f2c7a4',
    bootColor: '#2563eb'
  }
];

function buildCrossoverActions(profile: CrossoverVisualProfile): FighterActionSpec[] {
  const swordReach = profile.weapon !== 'none';
  const lightBounds = swordReach ? rect(8, 76, 102, 54) : rect(16, 82, 88, 48);
  const heavyBounds = swordReach ? rect(0, 44, 124, 92) : rect(8, 52, 110, 82);

  return [
    {
      action: 'idle',
      label: 'Idle',
      file: 'idle.png',
      frames: 6,
      frameRate: 8,
      repeat: -1,
      defaultVisual: rect(74, 30, 108, 200)
    },
    {
      action: 'walk-forward',
      label: 'Walk Forward',
      file: 'walk-forward.png',
      frames: 6,
      frameRate: 10,
      repeat: -1,
      defaultVisual: rect(70, 30, 114, 200)
    },
    {
      action: 'walk-backward',
      label: 'Walk Backward',
      file: 'walk-backward.png',
      frames: 6,
      frameRate: 10,
      repeat: -1,
      defaultVisual: rect(70, 30, 114, 200)
    },
    {
      action: 'crouch',
      label: 'Crouch',
      file: 'crouch.png',
      frames: 3,
      frameRate: 10,
      repeat: 0,
      defaultVisual: rect(72, 102, 112, 128)
    },
    {
      action: 'jump',
      label: 'Jump',
      file: 'jump.png',
      frames: 4,
      frameRate: 10,
      repeat: 0,
      defaultVisual: rect(70, 18, 116, 202)
    },
    {
      action: 'block-high',
      label: 'Block High',
      file: 'block-high.png',
      frames: 3,
      frameRate: 10,
      repeat: 0,
      defaultVisual: rect(74, 30, 108, 200),
      guard: rect(56, 40, 144, 128)
    },
    {
      action: 'block-low',
      label: 'Block Low',
      file: 'block-low.png',
      frames: 3,
      frameRate: 10,
      repeat: 0,
      defaultVisual: rect(72, 102, 112, 128),
      guard: rect(56, 104, 144, 124)
    },
    {
      action: 'hit-high',
      label: 'Hit High',
      file: 'hit-high.png',
      frames: 4,
      frameRate: 12,
      repeat: 0,
      defaultVisual: rect(74, 32, 112, 198)
    },
    {
      action: 'light-punch',
      label: 'Light Attack',
      file: 'light-punch.png',
      frames: 5,
      frameRate: 15,
      repeat: 0,
      defaultVisual: rect(56, 30, 134, 200),
      attack: { frames: [2, 3], bounds: lightBounds }
    },
    {
      action: 'heavy-kick',
      label: 'Heavy Attack',
      file: 'heavy-kick.png',
      frames: 6,
      frameRate: 13,
      repeat: 0,
      defaultVisual: rect(48, 28, 150, 202),
      attack: { frames: [2, 3, 4], bounds: heavyBounds }
    },
    {
      action: 'special-charge',
      label: 'Special Charge',
      file: 'special-charge.png',
      frames: 4,
      frameRate: 12,
      repeat: 0,
      defaultVisual: rect(64, 44, 128, 186)
    },
    {
      action: 'special',
      label: 'Special Move',
      file: 'special.png',
      frames: 8,
      frameRate: 14,
      repeat: 0,
      defaultVisual: rect(44, 24, 168, 206)
    },
    {
      action: 'knockdown',
      label: 'Knockdown',
      file: 'knockdown.png',
      frames: 5,
      frameRate: 10,
      repeat: 0,
      defaultVisual: rect(40, 148, 176, 82)
    }
  ];
}

export const CROSSOVER_CHARACTER_DEFINITIONS: CharacterDefinition[] = CROSSOVER_PROFILES.map((profile) => {
  const def = buildFighterCharacter({
    id: profile.id,
    label: profile.label,
    assetRoot: `/generated/${profile.id}`,
    anchorUsage: `${profile.label} (${profile.origin})`,
    actions: buildCrossoverActions(profile)
  });

  def.assets.forEach((asset) => {
    asset.auto = true;
  });

  return def;
});

export function getCrossoverProfile(characterId: string): CrossoverVisualProfile | undefined {
  return CROSSOVER_PROFILES.find((p) => p.id === characterId);
}
