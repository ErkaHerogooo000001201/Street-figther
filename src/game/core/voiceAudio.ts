import type { GameSettings } from '../types';

export type VoiceEventKind = 'special' | 'secret' | 'ko';

type GeminiVoiceName = 'Fenrir' | 'Puck' | 'Charon' | 'Kore' | 'Zephyr';

interface CharacterVoiceProfile {
  voiceName: GeminiVoiceName;
  style: string;
  toneHz: number;
  specialLine: string;
  secretLine: string;
  koLine: string;
}

const VOICE_PROFILES: Record<string, CharacterVoiceProfile> = {
  goku: {
    voiceName: 'Puck',
    style: 'Fierce, bright Japanese shonen anime hero shouting with soaring fighting spirit',
    toneHz: 420,
    specialLine: 'Ka-me-ha-me-HAAA!',
    secretLine: 'Migatte no Gokui! Ryūken Kamehameha!',
    koLine: 'Ossu! What an awesome battle!'
  },
  vegeta: {
    voiceName: 'Fenrir',
    style: 'Proud, intense, raspy royal Saiyan rival roaring in Japanese anime style',
    toneHz: 330,
    specialLine: 'Final... FLASH!',
    secretLine: 'Wagamama no Gokui! Hakai Big Bang!',
    koLine: 'Hmph! Know the power of a Saiyan elite!'
  },
  frieza: {
    voiceName: 'Zephyr',
    style: 'Cold, theatrical, condescending anime emperor with chilling elegance',
    toneHz: 460,
    specialLine: 'Death Ball! Disappear!',
    secretLine: 'Golden... Black Frieza! Emperor Collapse!',
    koLine: 'Oho-ho-ho! Utterly powerless!'
  },
  naruto: {
    voiceName: 'Puck',
    style: 'Energetic, passionate young anime ninja shouting with fiery determination',
    toneHz: 440,
    specialLine: 'Odama Rasengan!',
    secretLine: 'Kurama! Ikuzo, dattebayo!',
    koLine: 'Shannaro! That is my ninja way, dattebayo!'
  },
  sasuke: {
    voiceName: 'Charon',
    style: 'Cool, sharp, brooding anime prodigy with icy precision',
    toneHz: 310,
    specialLine: 'Chidori!',
    secretLine: 'Susanoo... Indra no Ya!',
    koLine: 'Your eyes cannot follow me.'
  },
  madara: {
    voiceName: 'Charon',
    style: 'Deep, commanding legendary anime warlord speaking with overwhelming gravitas',
    toneHz: 210,
    specialLine: 'Katon! Gōka Mekkyaku!',
    secretLine: 'Genjitsu wo shire... Mugen Tsukuyomi!',
    koLine: 'What will you do about the second meteor?'
  },
  luffy: {
    voiceName: 'Puck',
    style: 'Fearless, exuberant anime pirate captain yelling with wild joy',
    toneHz: 450,
    specialLine: 'Gomu Gomu no... Jet Gatling!',
    secretLine: 'Gear Fifth! Bajrang Gun!',
    koLine: 'Shishishi! Kaizoku-ou ni ore wa naru!'
  },
  zoro: {
    voiceName: 'Fenrir',
    style: 'Gruff, stoic anime master swordsman delivering a razor-sharp battle roar',
    toneHz: 255,
    specialLine: 'Santōryū! Kokujō Ō Tatsumaki!',
    secretLine: 'En-Ō Santōryū! Kyūtōryū Asura!',
    koLine: 'Nani mo... nakatta.'
  },
  kaido: {
    voiceName: 'Charon',
    style: 'Booming, monstrous anime emperor laughing and unleashing thunderous force',
    toneHz: 185,
    specialLine: 'Raimei Hakke!',
    secretLine: 'Worororo! Kaen Daiko: Ragnarok!',
    koLine: 'Worororo! Come back when you are stronger!'
  },
  gojo: {
    voiceName: 'Zephyr',
    style: 'Effortlessly charismatic, playful yet chillingly absolute anime jujutsu master',
    toneHz: 370,
    specialLine: 'Kyoshiki... Murasaki!',
    secretLine: 'Ryōiki Tenkai... Muryōkūsho!',
    koLine: 'Tenjō tenge yuiga dokuson.'
  },
  sukuna: {
    voiceName: 'Charon',
    style: 'Sinister, domineering King of Curses speaking in deep terrifying amusement',
    toneHz: 200,
    specialLine: 'Kai! Hachi!',
    secretLine: 'Ryōiki Tenkai... Fukuma Mizushi!',
    koLine: 'Know your place, fool.'
  },
  toji: {
    voiceName: 'Fenrir',
    style: 'Deadpan, lethal, confident anime assassin striking at blinding speed',
    toneHz: 270,
    specialLine: 'Amanosakahoko! Heavenly Blitz!',
    secretLine: 'No cursed energy needed. Zero Restraint!',
    koLine: 'Job done. Pay up.'
  },
  tanjiro: {
    voiceName: 'Puck',
    style: 'Earnest, blazing-hearted anime demon slayer shouting a breathing technique',
    toneHz: 410,
    specialLine: 'Hinokami Kagura! Nichiun no Ryū Kaburimai!',
    secretLine: 'Hi no Kokyū, Jūsan no Kata! Dawn!',
    koLine: 'Kokoro wo moyase!'
  },
  akaza: {
    voiceName: 'Fenrir',
    style: 'Battle-crazed martial anime demon grinning with fierce excitement',
    toneHz: 325,
    specialLine: 'Hakai Satsu! Rashin!',
    secretLine: 'Shūshiki! Aogin Ranzankō!',
    koLine: 'Become strong! Fight me for eternity!'
  },
  muzan: {
    voiceName: 'Charon',
    style: 'Aristocratic, cold, wrathful anime Demon King commanding darkness',
    toneHz: 215,
    specialLine: 'Kekkijutsu! Crimson Whip Storm!',
    secretLine: 'Demon King! Blood Moon Eclipse!',
    koLine: 'Bow before perfection.'
  },
  saitama: {
    voiceName: 'Zephyr',
    style: 'Unbothered deadpan hero suddenly dropping into terrifying serious intensity',
    toneHz: 345,
    specialLine: 'Hissatsu Maji Shirīzu... Maji Naguri!',
    secretLine: 'Maji Chabudai Gaeshi!',
    koLine: 'Done in one punch again.'
  },
  garou: {
    voiceName: 'Fenrir',
    style: 'Sharp, rebellious anime martial artist howling in awakened fury',
    toneHz: 295,
    specialLine: 'Ryūsui Gansai-ken!',
    secretLine: 'Kami Satsu... Gamma-Ray Burst!',
    koLine: 'Absolute evil has arrived.'
  },
  boros: {
    voiceName: 'Charon',
    style: 'Thundering cosmic conqueror unleashing planet-shattering alien energy',
    toneHz: 225,
    specialLine: 'Hōsei Hōkōhō!',
    secretLine: 'Meteoric Burst! Planet Roar!',
    koLine: 'Finally, a worthy clash!'
  },
  ryu: {
    voiceName: 'Fenrir',
    style: 'Disciplined, resonant arcade martial artist channeling inner ki',
    toneHz: 290,
    specialLine: 'Shinkū... HADOUKEN!',
    secretLine: 'Isshun Sengeki! Shun Goku Satsu!',
    koLine: 'The answer lies in the heart of battle.'
  },
  chunli: {
    voiceName: 'Kore',
    style: 'Crisp, agile, confident female martial arts champion executing rapid kicks',
    toneHz: 510,
    specialLine: 'Hyakuretsukyaku! Lightning Legs!',
    secretLine: 'Hōyoku-sen! Spinning Tempest!',
    koLine: 'Yatta! Justice always prevails!'
  },
  scorpion: {
    voiceName: 'Charon',
    style: 'Gravelly, vengeful spectral ninja roaring from hellfire',
    toneHz: 220,
    specialLine: 'GET OVER HERE!',
    secretLine: 'Netherrealm Chains! Eternal Inferno!',
    koLine: 'Vengeance is mine!'
  },
  subzero: {
    voiceName: 'Charon',
    style: 'Calm, stoic Lin Kuei cryomancer speaking with freezing authority',
    toneHz: 245,
    specialLine: 'Feel the chill of the Lin Kuei!',
    secretLine: 'Absolute Zero! Frozen Tomb!',
    koLine: 'Winter has claimed you.'
  },
  kratos: {
    voiceName: 'Charon',
    style: 'Deep, thunderous, gravelly Spartan god roaring with unstoppable rage',
    toneHz: 175,
    specialLine: 'SPARTAN RAGE!',
    secretLine: 'Blade of Olympus! Feel my wrath!',
    koLine: 'The cycle ends here.'
  },
  cloud: {
    voiceName: 'Zephyr',
    style: 'Cool, stoic spiky-haired swordsman delivering a crisp Limit Break call',
    toneHz: 335,
    specialLine: 'Chōkyū Bushin Hanzan! Omnislash!',
    secretLine: 'Limit Break! Omnislash Version Five!',
    koLine: 'Not interested.'
  },
  dante: {
    voiceName: 'Fenrir',
    style: 'Cocky, stylish, playful devil hunter shouting with rockstar flair',
    toneHz: 315,
    specialLine: 'Jackpot!',
    secretLine: 'Sin Devil Trigger! Judgment!',
    koLine: 'Smokin Sexy Style!'
  },
  link: {
    voiceName: 'Puck',
    style: 'Heroic, spirited Hylian champion letting out a fierce battle cry',
    toneHz: 415,
    specialLine: 'HYAAAH! Triforce Spin!',
    secretLine: 'Fierce Deity! Triforce Reckoning!',
    koLine: 'Toriyaaah!'
  },
  megaman: {
    voiceName: 'Puck',
    style: 'Heroic, determined young cyborg defender firing a plasma cannon',
    toneHz: 465,
    specialLine: 'Hyper Mega Buster!',
    secretLine: 'Double Gear System! Hyper Giga Crush!',
    koLine: 'Mission complete!'
  },
  erkhembayar: {
    voiceName: 'Fenrir',
    style: 'Confident, charismatic anime street brawler bursting with heroic swagger',
    toneHz: 340,
    specialLine: 'Swag Cyclone Blitz!',
    secretLine: 'Tengri Storm! Eternal Blue Sky!',
    koLine: 'Pure swag! Victory belongs to the fearless!'
  },
  hero: {
    voiceName: 'Puck',
    style: 'Passionate anime protagonist unleashing an azure rising dragon strike',
    toneHz: 380,
    specialLine: 'Azure Dragon Upper!',
    secretLine: 'Limit Break! Azure Meteor Ascent!',
    koLine: 'Unbreakable spirit!'
  },
  'red-brawler': {
    voiceName: 'Fenrir',
    style: 'Hot-blooded arcade street fighter throwing a blazing uppercut',
    toneHz: 295,
    specialLine: 'Volcanic Uppercut!',
    secretLine: 'Inferno Fist! Molten Core!',
    koLine: 'Fired up!'
  },
  'jiujitsu-fighter': {
    voiceName: 'Fenrir',
    style: 'Sharp, focused martial arts grandmaster calling a lightning strike',
    toneHz: 305,
    specialLine: 'Thunder Spinarooni!',
    secretLine: 'Grandmaster Storm! Apex Lock!',
    koLine: 'Mastered the mat!'
  },
  'green-boxer': {
    voiceName: 'Fenrir',
    style: 'High-energy championship boxer unleashing a meteor combo',
    toneHz: 320,
    specialLine: 'Meteor Rush!',
    secretLine: 'Champion Fury! Emerald Comet!',
    koLine: 'Knockout!'
  }
};

const DEFAULT_VOICE_PROFILE: CharacterVoiceProfile = {
  voiceName: 'Fenrir',
  style: 'Intense anime fighting game hero shouting a signature move',
  toneHz: 350,
  specialLine: 'Ultra Strike!',
  secretLine: 'True Awakening! Overdrive!',
  koLine: 'Victory!'
};

const audioCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string | null>>();
let voiceApiDisabled = false;
let activeAudioEl: HTMLAudioElement | null = null;
let sharedVoiceCtx: AudioContext | null = null;
let lastSpokenAt = 0;
let lastPriority: VoiceEventKind | null = null;

function getVoiceCtx(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    return null;
  }

  if (!sharedVoiceCtx) {
    sharedVoiceCtx = new Ctor();
  }
  if (sharedVoiceCtx.state === 'suspended') {
    void sharedVoiceCtx.resume().catch(() => {});
  }
  return sharedVoiceCtx;
}

function getProfile(characterId: string): CharacterVoiceProfile {
  return VOICE_PROFILES[characterId] ?? DEFAULT_VOICE_PROFILE;
}

export function getVoiceLine(characterId: string, event: VoiceEventKind): string {
  const profile = getProfile(characterId);
  if (event === 'secret') return profile.secretLine;
  if (event === 'ko') return profile.koLine;
  return profile.specialLine;
}

async function fetchGeminiVoiceAudio(characterId: string, event: VoiceEventKind): Promise<string | null> {
  if (voiceApiDisabled || typeof fetch === 'undefined') {
    return null;
  }

  const key = `${characterId}::${event}`;
  const existing = audioCache.get(key);
  if (existing) {
    return existing;
  }

  const pending = inFlightRequests.get(key);
  if (pending) {
    return pending;
  }

  const profile = getProfile(characterId);
  const text = getVoiceLine(characterId, event);
  const promise = (async () => {
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          style: profile.style,
          voiceName: profile.voiceName
        })
      });
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        audioBase64?: string;
        mimeType?: string;
      };
      if (!data.ok) {
        if (data.reason === 'no_api_key') {
          voiceApiDisabled = true;
        }
        return null;
      }
      if (!data.audioBase64) {
        return null;
      }
      const src = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
      audioCache.set(key, src);
      return src;
    } catch {
      return null;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Pre-warms Gemini 3.8 Flash TTS neural voices for the active fighters in the background
 * so special & secret lines fire instantaneously with expressive anime acting.
 */
export function warmFighterVoices(characterIds: string[]): void {
  if (voiceApiDisabled) {
    return;
  }
  const uniqueIds = Array.from(new Set(characterIds.filter(Boolean)));
  for (const id of uniqueIds) {
    void fetchGeminiVoiceAudio(id, 'special');
    void fetchGeminiVoiceAudio(id, 'secret');
    void fetchGeminiVoiceAudio(id, 'ko');
  }
}

/**
 * Clean, non-robotic anime resonance sting when offline/no API key is configured.
 * Replaces robotic speechSynthesis with warm multi-harmonic energy aura chords.
 */
function playAnimeAuraSting(toneHz: number, event: VoiceEventKind, volume: number): void {
  const ctx = getVoiceCtx();
  if (!ctx || volume <= 0) {
    return;
  }

  try {
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(event === 'secret' ? 3600 : 2400, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + (event === 'secret' ? 0.65 : 0.4));

    const peak = Math.min(0.36, (event === 'secret' ? 0.34 : 0.24) * volume);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (event === 'secret' ? 0.68 : 0.42));

    filter.connect(gain);
    gain.connect(ctx.destination);

    // Aggressive power chord + deep battle sub-drop (no cheerful chimes)
    const ratios = event === 'secret' ? [0.5, 1, 1.498, 2] : event === 'ko' ? [0.5, 1, 1.498] : [0.5, 1];
    ratios.forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? 'sawtooth' : 'square';
      const startFreq = Math.max(55, toneHz * 0.72 * ratio);
      osc.frequency.setValueAtTime(startFreq * 1.12, now + idx * 0.015);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 0.88, now + 0.26 + idx * 0.04);
      osc.connect(filter);
      osc.start(now + idx * 0.015);
      osc.stop(now + (event === 'secret' ? 0.7 : 0.44));
    });
  } catch {
    // Ignore autoplay restriction errors
  }
}

function playDataUrl(src: string, volume: number): void {
  if (typeof Audio === 'undefined') {
    return;
  }

  try {
    if (activeAudioEl) {
      activeAudioEl.pause();
      activeAudioEl.currentTime = 0;
    }
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, 0.92 * volume));
    activeAudioEl = audio;
    void audio.play().catch(() => {});
  } catch {
    // Gracefully ignore playback block
  }
}

/**
 * Plays expressive anime Gemini TTS voice audio when available, or a non-robotic
 * harmonic anime aura resonance sting when offline, and returns the battle line.
 */
export function playCharacterVoice(
  characterId: string,
  event: VoiceEventKind,
  settings: GameSettings
): string {
  const line = getVoiceLine(characterId, event);
  if (settings.muted || settings.sfxVolume <= 0) {
    return line;
  }

  const now = Date.now();
  if (now - lastSpokenAt < 950 && lastPriority === 'secret' && event === 'special') {
    return line;
  }
  lastSpokenAt = now;
  lastPriority = event;

  const cacheKey = `${characterId}::${event}`;
  const cachedSrc = audioCache.get(cacheKey);
  if (cachedSrc) {
    playDataUrl(cachedSrc, settings.sfxVolume);
    return line;
  }

  const profile = getProfile(characterId);
  playAnimeAuraSting(profile.toneHz, event, settings.sfxVolume);

  if (!voiceApiDisabled) {
    void fetchGeminiVoiceAudio(characterId, event).then((src) => {
      if (src && Date.now() - now < 1500) {
        playDataUrl(src, settings.sfxVolume);
      }
    });
  }

  return line;
}
