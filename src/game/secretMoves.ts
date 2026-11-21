import type { VfxColor } from './vfx';

export type SecretArchetype =
  | 'domain-expansion'
  | 'tailed-beast'
  | 'reality-slash'
  | 'cataclysm-burst';

export interface SecretMoveSpec {
  id: string;
  name: string;
  bannerTag: string;
  archetype: SecretArchetype;
  themeColor: number;
  secondaryColor: number;
  vfxColor: VfxColor;
  damage: number;
  knockback: number;
  hitstun: number;
  hits: number;
  range: number;
}

/**
 * Minimum consecutive unblocked combo hits and meter thresholds required to
 * unlock a fighter's hidden Secret Art mid-battle. Kept concealed until triggered.
 */
export const SECRET_COMBO_MIN_HITS = 2;
export const SECRET_COMBO_MIN_METER = 75;
export const SECRET_HIGH_COMBO_HITS = 3;
export const SECRET_HIGH_COMBO_METER = 55;

export const SECRET_MOVE_SPECS: Record<string, SecretMoveSpec> = {
  gojo: {
    id: 'gojo',
    name: 'Domain Expansion: Unlimited Void',
    bannerTag: 'DOMAIN EXPANSION',
    archetype: 'domain-expansion',
    themeColor: 0x6366f1,
    secondaryColor: 0x38bdf8,
    vfxColor: 'cyan',
    damage: 11,
    knockback: 260,
    hitstun: 460,
    hits: 5,
    range: 920
  },
  naruto: {
    id: 'naruto',
    name: 'Kurama: Nine-Tails Awakening',
    bannerTag: 'NINE-TAILS AWAKENED',
    archetype: 'tailed-beast',
    themeColor: 0xf97316,
    secondaryColor: 0xfef08a,
    vfxColor: 'orange',
    damage: 10,
    knockback: 290,
    hitstun: 360,
    hits: 5,
    range: 720
  },
  sukuna: {
    id: 'sukuna',
    name: 'Domain Expansion: Malevolent Shrine',
    bannerTag: 'DOMAIN EXPANSION',
    archetype: 'domain-expansion',
    themeColor: 0xdc2626,
    secondaryColor: 0xfb7185,
    vfxColor: 'red',
    damage: 11,
    knockback: 280,
    hitstun: 420,
    hits: 5,
    range: 900
  },
  erkhembayar: {
    id: 'erkhembayar',
    name: 'Tengri Storm: Eternal Blue Sky',
    bannerTag: 'HIDDEN SECRET ART',
    archetype: 'tailed-beast',
    themeColor: 0x2563eb,
    secondaryColor: 0x38bdf8,
    vfxColor: 'cyan',
    damage: 11,
    knockback: 280,
    hitstun: 380,
    hits: 5,
    range: 700
  },
  hero: {
    id: 'hero',
    name: 'Limit Break: Azure Meteor Ascent',
    bannerTag: 'HIDDEN SECRET ART',
    archetype: 'cataclysm-burst',
    themeColor: 0x38bdf8,
    secondaryColor: 0xfacc15,
    vfxColor: 'cyan',
    damage: 11,
    knockback: 290,
    hitstun: 380,
    hits: 5,
    range: 640
  },
  goku: {
    id: 'goku',
    name: 'Ultra Instinct: Dragon Kamehameha',
    bannerTag: 'ULTRA INSTINCT',
    archetype: 'cataclysm-burst',
    themeColor: 0xe2e8f0,
    secondaryColor: 0x38bdf8,
    vfxColor: 'cyan',
    damage: 11,
    knockback: 310,
    hitstun: 380,
    hits: 5,
    range: 780
  },
  vegeta: {
    id: 'vegeta',
    name: 'Ultra Ego: Hakai Big Bang',
    bannerTag: 'ULTRA EGO',
    archetype: 'cataclysm-burst',
    themeColor: 0xa855f7,
    secondaryColor: 0xfacc15,
    vfxColor: 'purple',
    damage: 11,
    knockback: 310,
    hitstun: 380,
    hits: 5,
    range: 740
  },
  frieza: {
    id: 'frieza',
    name: 'Black Frieza: Emperor Collapse',
    bannerTag: 'HIDDEN SECRET ART',
    archetype: 'domain-expansion',
    themeColor: 0x9333ea,
    secondaryColor: 0xf8fafc,
    vfxColor: 'purple',
    damage: 10,
    knockback: 270,
    hitstun: 400,
    hits: 5,
    range: 880
  },
  sasuke: {
    id: 'sasuke',
    name: "Susanoo: Indra's Arrow",
    bannerTag: 'SUSANOO AWAKENED',
    archetype: 'cataclysm-burst',
    themeColor: 0x8b5cf6,
    secondaryColor: 0x38bdf8,
    vfxColor: 'purple',
    damage: 11,
    knockback: 300,
    hitstun: 390,
    hits: 5,
    range: 760
  },
  madara: {
    id: 'madara',
    name: 'Infinite Tsukuyomi: Shattered Heaven',
    bannerTag: 'DOMAIN EXPANSION',
    archetype: 'domain-expansion',
    themeColor: 0xef4444,
    secondaryColor: 0xa855f7,
    vfxColor: 'red',
    damage: 11,
    knockback: 280,
    hitstun: 440,
    hits: 5,
    range: 920
  },
  luffy: {
    id: 'luffy',
    name: 'Gear 5: Bajrang Dawn Gatling',
    bannerTag: 'GEAR FIVE',
    archetype: 'cataclysm-burst',
    themeColor: 0xf8fafc,
    secondaryColor: 0xfde047,
    vfxColor: 'gold',
    damage: 10,
    knockback: 300,
    hitstun: 370,
    hits: 5,
    range: 660
  },
  zoro: {
    id: 'zoro',
    name: "King of Hell: Asura Dead Man's Game",
    bannerTag: 'HIDDEN SECRET ART',
    archetype: 'reality-slash',
    themeColor: 0x22c55e,
    secondaryColor: 0xc084fc,
    vfxColor: 'emerald',
    damage: 12,
    knockback: 280,
    hitstun: 390,
    hits: 4,
    range: 520
  },
  kaido: {
    id: 'kaido',
    name: 'Flame Dragon Torch: Ragnarok',
    bannerTag: 'HIDDEN SECRET ART',
    archetype: 'tailed-beast',
    themeColor: 0xdc2626,
    secondaryColor: 0xfacc15,
    vfxColor: 'orange',
    damage: 13,
    knockback: 350,
    hitstun: 420,
    hits: 4,
    range: 720
  },
  toji: {
    id: 'toji',
    name: 'Inverted Heaven: Zero Restraint',
    bannerTag: 'HIDDEN SECRET ART',
    archetype: 'reality-slash',
    themeColor: 0x94a3b8,
    secondaryColor: 0x38bdf8,
    vfxColor: 'cyan',
    damage: 12,
    knockback: 270,
    hitstun: 380,
    hits: 4,
    range: 520
  },
  tanjiro: {
    id: 'tanjiro',
    name: 'Sun Breathing 13th Form: Dawn',
    bannerTag: 'HIDDEN SECRET ART',
    archetype: 'reality-slash',
    themeColor: 0xf97316,
    secondaryColor: 0xfde047,
    vfxColor: 'orange',
    damage: 11,
    knockback: 270,
    hitstun: 370,
    hits: 5,
    range: 540
  },
  akaza: {
    id: 'akaza',
    name: 'Compass Needle: Blue Annihilation',
    bannerTag: 'HIDDEN SECRET ART',
    archetype: 'cataclysm-burst',
    themeColor: 0x38bdf8,
    secondaryColor: 0xf43f5e,
    vfxColor: 'cyan',
    damage: 10,
    knockback: 290,
    hitstun: 360,
    hits: 5,
    range: 640
  },
  muzan: {
    id: 'muzan',
    name: 'Demon King: Blood Moon Eclipse',
    bannerTag: 'DOMAIN EXPANSION',
    archetype: 'domain-expansion',
    themeColor: 0x991b1b,
    secondaryColor: 0xf87171,
    vfxColor: 'red',
    damage: 11,
    knockback: 275,
    hitstun: 420,
    hits: 5,
    range: 880
  },
  saitama: {
    id: 'saitama',
    name: 'Killer Move: Serious Table Flip',
    bannerTag: 'SERIOUS SERIES',
    archetype: 'cataclysm-burst',
    themeColor: 0xfacc15,
    secondaryColor: 0xef4444,
    vfxColor: 'gold',
    damage: 15,
    knockback: 420,
    hitstun: 480,
    hits: 4,
    range: 740
  },
  garou: {
    id: 'garou',
    name: 'Cosmic Fear: Gamma Ray Burst',
    bannerTag: 'COSMIC FEAR',
    archetype: 'domain-expansion',
    themeColor: 0x06b6d4,
    secondaryColor: 0xc084fc,
    vfxColor: 'cyan',
    damage: 11,
    knockback: 280,
    hitstun: 420,
    hits: 5,
    range: 880
  },
  boros: {
    id: 'boros',
    name: 'Meteoric Burst: Planet Roar',
    bannerTag: 'HIDDEN SECRET ART',
    archetype: 'cataclysm-burst',
    themeColor: 0xc084fc,
    secondaryColor: 0x38bdf8,
    vfxColor: 'purple',
    damage: 11,
    knockback: 310,
    hitstun: 390,
    hits: 5,
    range: 760
  },
  ryu: {
    id: 'ryu',
    name: 'Satsui no Hado: Raging Demon',
    bannerTag: 'SHUN GOKU SATSU',
    archetype: 'domain-expansion',
    themeColor: 0xef4444,
    secondaryColor: 0x60a5fa,
    vfxColor: 'red',
    damage: 11,
    knockback: 280,
    hitstun: 430,
    hits: 5,
    range: 840
  },
  chunli: {
    id: 'chunli',
    name: 'Hoyoku-sen: Phoenix Tempest',
    bannerTag: 'HIDDEN SECRET ART',
    archetype: 'reality-slash',
    themeColor: 0x38bdf8,
    secondaryColor: 0xfacc15,
    vfxColor: 'cyan',
    damage: 10,
    knockback: 260,
    hitstun: 350,
    hits: 5,
    range: 500
  },
  scorpion: {
    id: 'scorpion',
    name: 'Netherrealm Chains: Eternal Inferno',
    bannerTag: 'NETHERREALM',
    archetype: 'domain-expansion',
    themeColor: 0xf59e0b,
    secondaryColor: 0xdc2626,
    vfxColor: 'orange',
    damage: 11,
    knockback: 270,
    hitstun: 420,
    hits: 5,
    range: 860
  },
  subzero: {
    id: 'subzero',
    name: 'Lin Kuei: Absolute Zero Tomb',
    bannerTag: 'ABSOLUTE ZERO',
    archetype: 'domain-expansion',
    themeColor: 0x06b6d4,
    secondaryColor: 0xe0f2fe,
    vfxColor: 'cyan',
    damage: 10,
    knockback: 240,
    hitstun: 460,
    hits: 5,
    range: 860
  },
  kratos: {
    id: 'kratos',
    name: 'Blade of Olympus: Spartan Cataclysm',
    bannerTag: 'GOD OF WAR',
    archetype: 'cataclysm-burst',
    themeColor: 0xdc2626,
    secondaryColor: 0x38bdf8,
    vfxColor: 'red',
    damage: 12,
    knockback: 320,
    hitstun: 400,
    hits: 5,
    range: 680
  },
  cloud: {
    id: 'cloud',
    name: 'Omnislash Ver. 5: Advent Finale',
    bannerTag: 'LIMIT BREAK',
    archetype: 'reality-slash',
    themeColor: 0x22d3ee,
    secondaryColor: 0xfacc15,
    vfxColor: 'gold',
    damage: 12,
    knockback: 280,
    hitstun: 390,
    hits: 5,
    range: 520
  },
  dante: {
    id: 'dante',
    name: 'Sin Devil Trigger: Judgment',
    bannerTag: 'DEVIL TRIGGER',
    archetype: 'reality-slash',
    themeColor: 0xef4444,
    secondaryColor: 0xfde047,
    vfxColor: 'red',
    damage: 11,
    knockback: 280,
    hitstun: 380,
    hits: 5,
    range: 540
  },
  link: {
    id: 'link',
    name: 'Fierce Deity: Triforce Reckoning',
    bannerTag: 'FIERCE DEITY',
    archetype: 'reality-slash',
    themeColor: 0x22c55e,
    secondaryColor: 0xfacc15,
    vfxColor: 'emerald',
    damage: 11,
    knockback: 270,
    hitstun: 380,
    hits: 5,
    range: 520
  },
  megaman: {
    id: 'megaman',
    name: 'Double Gear: Hyper Giga Crush',
    bannerTag: 'DOUBLE GEAR',
    archetype: 'cataclysm-burst',
    themeColor: 0x0ea5e9,
    secondaryColor: 0x67e8f9,
    vfxColor: 'cyan',
    damage: 11,
    knockback: 300,
    hitstun: 370,
    hits: 5,
    range: 740
  },
  'red-brawler': {
    id: 'red-brawler',
    name: 'Inferno Fist: Molten Core',
    bannerTag: 'HIDDEN SECRET ART',
    archetype: 'cataclysm-burst',
    themeColor: 0xef4444,
    secondaryColor: 0xfacc15,
    vfxColor: 'red',
    damage: 11,
    knockback: 290,
    hitstun: 380,
    hits: 5,
    range: 640
  },
  'jiujitsu-fighter': {
    id: 'jiujitsu-fighter',
    name: 'Grandmaster Storm: Apex Lock',
    bannerTag: 'HIDDEN SECRET ART',
    archetype: 'reality-slash',
    themeColor: 0x38bdf8,
    secondaryColor: 0xfacc15,
    vfxColor: 'cyan',
    damage: 11,
    knockback: 270,
    hitstun: 380,
    hits: 5,
    range: 500
  },
  'green-boxer': {
    id: 'green-boxer',
    name: 'Champion Fury: Emerald Comet',
    bannerTag: 'HIDDEN SECRET ART',
    archetype: 'cataclysm-burst',
    themeColor: 0x22c55e,
    secondaryColor: 0xfde047,
    vfxColor: 'emerald',
    damage: 11,
    knockback: 290,
    hitstun: 370,
    hits: 5,
    range: 640
  }
};

const FALLBACK_SECRET: SecretMoveSpec = {
  id: 'default',
  name: 'True Awakening: Overdrive',
  bannerTag: 'HIDDEN SECRET ART',
  archetype: 'cataclysm-burst',
  themeColor: 0xfacc15,
  secondaryColor: 0x38bdf8,
  vfxColor: 'gold',
  damage: 11,
  knockback: 290,
  hitstun: 380,
  hits: 5,
  range: 680
};

export function getSecretMoveSpec(characterId: string): SecretMoveSpec {
  return SECRET_MOVE_SPECS[characterId] ?? FALLBACK_SECRET;
}

/**
 * Computes Hidden Secret Art cooldown in seconds scaled by move strength,
 * ranging from 10.0s to 15.0s (always longer than normal special cooldowns).
 */
export function getSecretCooldownSeconds(spec: SecretMoveSpec): number {
  const power = spec.damage * spec.hits + spec.knockback / 30 + spec.hitstun / 45;
  const raw = 2.0 + power * 0.15;
  return Math.round(Math.min(15.0, Math.max(10.0, raw)) * 10) / 10;
}
