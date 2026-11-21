import { describe, expect, it } from 'vitest';

import { getStageMusicTheme } from './core/stageMusic';
import { CROSSOVER_PROFILES } from './crossoverRoster';
import { createDefaultFighterPlaygroundState, getFighterCombat } from './fighterConfig';
import { FIGHTER_CHARACTER_DEFINITIONS } from './hero';
import { getSecretCooldownSeconds, getSecretMoveSpec, SECRET_COMBO_MIN_HITS, SECRET_MOVE_SPECS } from './secretMoves';
import { getSpecialCooldownSeconds, getSpecialMoveSpec, SPECIAL_MOVE_SPECS } from './specialMoves';
import { STAGE_DEFINITIONS } from './stageConfig';

describe('crossover roster, special moves, and hidden secret moves', () => {
  it('registers 32 total fighters (28 crossover fighters, 3 starters, and custom Hero) without Sonic', () => {
    const ids = new Set(FIGHTER_CHARACTER_DEFINITIONS.map((c) => c.id));
    for (const profile of CROSSOVER_PROFILES) {
      expect(ids.has(profile.id)).toBe(true);
    }

    const animeRivals = [
      'vegeta',
      'frieza',
      'sasuke',
      'madara',
      'zoro',
      'kaido',
      'sukuna',
      'toji',
      'akaza',
      'muzan',
      'garou',
      'boros'
    ];
    for (const rivalId of animeRivals) {
      expect(ids.has(rivalId)).toBe(true);
    }

    expect(ids.has('sonic')).toBe(false);
    expect(ids.has('hero')).toBe(true);
    expect(ids.has('erkhembayar')).toBe(true);
    expect(ids.has('bayasaa')).toBe(false);
    expect(ids.has('red-brawler')).toBe(true);
    expect(ids.has('jiujitsu-fighter')).toBe(true);
    expect(ids.has('green-boxer')).toBe(true);
    expect(CROSSOVER_PROFILES.length).toBe(28);
    expect(ids.size).toBe(32);
  });

  it('gives every registered fighter a high maxHealth pool so matches last longer', () => {
    const defaultState = createDefaultFighterPlaygroundState();
    for (const fighter of FIGHTER_CHARACTER_DEFINITIONS) {
      const combat = getFighterCombat(defaultState, fighter.id);
      expect(combat.maxHealth).toBeGreaterThanOrEqual(300);
    }
  });

  it('gives every registered fighter a bespoke special move spec and distinct archetypes', () => {
    const archetypes = new Set<string>();
    const moveNames = new Set<string>();

    for (const fighter of FIGHTER_CHARACTER_DEFINITIONS) {
      const spec = getSpecialMoveSpec(fighter.id);
      expect(spec.id).toBe(fighter.id);
      expect(spec.name.length).toBeGreaterThan(0);
      expect(spec.damage).toBeGreaterThan(0);
      expect(spec.hits).toBeGreaterThanOrEqual(1);
      archetypes.add(spec.archetype);
      moveNames.add(spec.name);
    }

    expect(archetypes.size).toBeGreaterThanOrEqual(10);
    expect(Object.keys(SPECIAL_MOVE_SPECS).length).toBe(32);
    expect(moveNames.size).toBe(Object.keys(SPECIAL_MOVE_SPECS).length);
  });

  it('gives every fighter a hidden combo-triggered secret move (Domain Expansion, Nine-Tails, etc.)', () => {
    expect(SECRET_COMBO_MIN_HITS).toBeGreaterThanOrEqual(2);
    expect(getSecretMoveSpec('gojo').name.toLowerCase()).toContain('domain expansion');
    expect(getSecretMoveSpec('naruto').name.toLowerCase()).toContain('nine-tails');

    for (const fighter of FIGHTER_CHARACTER_DEFINITIONS) {
      const secret = getSecretMoveSpec(fighter.id);
      expect(secret.id).toBe(fighter.id);
      expect(secret.name.length).toBeGreaterThan(0);
      expect(secret.damage).toBeGreaterThan(0);
    }

    expect(Object.keys(SECRET_MOVE_SPECS).length).toBe(32);
  });

  it('scales special and secret move cooldowns directly by move strength', () => {
    const saitamaCd = getSpecialCooldownSeconds(getSpecialMoveSpec('saitama'));
    const kaidoCd = getSpecialCooldownSeconds(getSpecialMoveSpec('kaido'));
    const erkhembayarCd = getSpecialCooldownSeconds(getSpecialMoveSpec('erkhembayar'));
    expect(saitamaCd).toBeGreaterThan(erkhembayarCd);
    expect(kaidoCd).toBeGreaterThan(erkhembayarCd);

    for (const fighter of FIGHTER_CHARACTER_DEFINITIONS) {
      const specialCd = getSpecialCooldownSeconds(getSpecialMoveSpec(fighter.id));
      const secretCd = getSecretCooldownSeconds(getSecretMoveSpec(fighter.id));
      expect(specialCd).toBeGreaterThanOrEqual(3.5);
      expect(specialCd).toBeLessThanOrEqual(9.5);
      expect(secretCd).toBeGreaterThanOrEqual(10.0);
      expect(secretCd).toBeLessThanOrEqual(15.0);
      expect(secretCd).toBeGreaterThan(specialCd);
    }
  });

  it('assigns all 9 stages including storm-citadel and unique music per stage', () => {
    const stageIds = STAGE_DEFINITIONS.map((stage) => stage.id);
    expect(stageIds).not.toContain('rooftop-twilight');
    expect(stageIds).toContain('storm-citadel');
    expect(stageIds).toContain('glacier-fortress');
    expect(stageIds).toContain('thunder-colosseum');
    expect(stageIds).toContain('shadow-shrine');
    expect(stageIds).toHaveLength(9);

    const trackTitles = new Set<string>();
    const bpms = new Set<number>();
    for (const stage of STAGE_DEFINITIONS) {
      const theme = getStageMusicTheme(stage.id);
      expect(theme.stageId).toBe(stage.id);
      expect(theme.title.length).toBeGreaterThan(0);
      trackTitles.add(theme.title);
      bpms.add(theme.bpm);
    }

    expect(trackTitles.size).toBe(STAGE_DEFINITIONS.length);
    expect(bpms.size).toBe(STAGE_DEFINITIONS.length);
  });

  it('provides full combat action animations for every crossover fighter', () => {
    const requiredActions = [
      'idle',
      'walk-forward',
      'walk-backward',
      'jump',
      'block-high',
      'hit-high',
      'light-punch',
      'heavy-kick',
      'special-charge',
      'special',
      'knockdown'
    ];

    for (const profile of CROSSOVER_PROFILES) {
      const def = FIGHTER_CHARACTER_DEFINITIONS.find((c) => c.id === profile.id);
      expect(def).toBeDefined();
      const actions = new Set(def?.animations.map((a) => a.action));
      for (const req of requiredActions) {
        expect(actions.has(req)).toBe(true);
      }
    }
  });
});
