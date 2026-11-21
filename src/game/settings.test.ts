import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS, sanitizeSettings } from './settings';

describe('sanitizeSettings', () => {
  it('normalizes valid persisted settings', () => {
    expect(
      sanitizeSettings({
        sfxVolume: 0.4,
        musicVolume: 0.2,
        muted: true,
        botDifficulty: 'nightmare'
      })
    ).toEqual({
      sfxVolume: 0.4,
      musicVolume: 0.2,
      muted: true,
      botDifficulty: 'nightmare'
    });
  });

  it('normalizes legacy single-volume persisted settings', () => {
    expect(
      sanitizeSettings({
        volume: 0.35,
        muted: false
      })
    ).toEqual({
      sfxVolume: 0.35,
      musicVolume: 0.35,
      muted: false,
      botDifficulty: 'hard'
    });
  });

  it('falls back when persisted settings are invalid', () => {
    expect(
      sanitizeSettings({
        sfxVolume: 99,
        musicVolume: -1,
        botDifficulty: 'invalid'
      })
    ).toEqual(DEFAULT_SETTINGS);
  });
});
