import { DEFAULT_SETTINGS } from '../settings';
import type { GameSettings } from '../types';

export interface StageMusicTheme {
  stageId: string;
  title: string;
  genre: string;
  bpm: number;
  accentColor: string;
}

type InstrumentStyle = 'rock-lead' | 'war-brass' | 'synthwave' | 'shamisen' | 'metal-shred' | 'trance-chip';
type BassStyle = 'gallop' | 'war-pulse' | 'analog-16' | 'taiko-drone' | 'chug' | 'psy-roll';
type DrumStyle = 'rock' | 'battle' | 'synthwave' | 'taiko' | 'thrash' | 'trance';

interface InternalTrackArrangement extends StageMusicTheme {
  audioUrl: string;
  bars: number;
  instrument: InstrumentStyle;
  bassStyle: BassStyle;
  drumStyle: DrumStyle;
  /** Chords per bar (MIDI note numbers for root + pad triad). */
  chords: number[][];
  /** 16th-note step melody across 1 bar or 2 bars in MIDI (0 = rest). */
  melody: number[];
  /** Bass pattern in MIDI (0 = rest), repeated per 16-step bar or 32-step 2-bar phrase. */
  bass: number[];
  /** Optional 16th-note arpeggio pattern (MIDI) for atmospheric sparkle. */
  arp?: number[];
}

const STAGE_TRACKS: Record<string, InternalTrackArrangement> = {
  'storm-citadel': {
    stageId: 'storm-citadel',
    title: 'Tempest Overlord',
    genre: 'Extreme Anime Metal',
    bpm: 174,
    accentColor: '#38bdf8',
    audioUrl: '',
    bars: 4,
    instrument: 'rock-lead',
    bassStyle: 'gallop',
    drumStyle: 'rock',
    // Em -> C -> D -> B7 (relentless lightning shred)
    chords: [
      [52, 59, 64, 67],
      [48, 55, 60, 64],
      [50, 57, 62, 66],
      [47, 54, 59, 63]
    ],
    melody: [
      76, 79, 83, 88, 86, 83, 79, 76, 74, 76, 79, 83, 86, 0, 83, 81,
      79, 83, 84, 88, 84, 83, 81, 79, 76, 79, 81, 83, 81, 79, 76, 0,
      78, 81, 86, 90, 86, 84, 83, 81, 79, 78, 76, 74, 76, 78, 81, 0,
      75, 79, 83, 87, 91, 87, 83, 79, 83, 81, 79, 76, 75, 76, 79, 0
    ],
    bass: [
      40, 40, 40, 47, 40, 40, 47, 40, 40, 40, 40, 47, 47, 43, 40, 43,
      36, 36, 36, 43, 36, 36, 43, 36, 36, 36, 36, 43, 43, 40, 36, 40,
      38, 38, 38, 45, 38, 38, 45, 38, 38, 38, 38, 45, 45, 42, 38, 42,
      35, 35, 39, 42, 47, 42, 39, 35, 47, 42, 39, 35, 39, 42, 47, 35
    ],
    arp: [
      64, 67, 71, 76, 79, 76, 71, 67, 60, 64, 67, 72, 76, 72, 67, 64,
      62, 66, 69, 74, 78, 74, 69, 66, 59, 63, 66, 71, 75, 71, 66, 63
    ]
  },
  'rooftop-sunset': {
    stageId: 'rooftop-sunset',
    title: 'Crimson Horizon',
    genre: 'Extreme Brawl Brass',
    bpm: 166,
    accentColor: '#fb923c',
    audioUrl: '',
    bars: 4,
    instrument: 'war-brass',
    bassStyle: 'war-pulse',
    drumStyle: 'battle',
    // Dm -> C -> Bb -> A7 (high-octane rooftop warfare)
    chords: [
      [38, 45, 50, 53],
      [36, 43, 48, 52],
      [34, 41, 46, 50],
      [33, 40, 45, 49]
    ],
    melody: [
      74, 77, 81, 0, 86, 81, 79, 77, 74, 72, 74, 77, 81, 84, 81, 0,
      72, 76, 79, 0, 84, 81, 79, 76, 77, 76, 74, 72, 74, 76, 79, 0,
      70, 74, 77, 0, 82, 81, 79, 77, 74, 72, 70, 72, 74, 77, 82, 0,
      73, 76, 81, 0, 85, 81, 79, 77, 76, 77, 79, 81, 85, 0, 81, 0
    ],
    bass: [
      38, 38, 38, 45, 38, 45, 38, 50, 38, 38, 38, 45, 41, 45, 38, 41,
      36, 36, 36, 43, 36, 43, 36, 48, 36, 36, 36, 43, 40, 43, 36, 40,
      34, 34, 34, 41, 34, 41, 34, 46, 34, 34, 34, 41, 38, 41, 34, 38,
      33, 33, 45, 33, 37, 40, 45, 37, 45, 40, 37, 33, 40, 45, 49, 33
    ]
  },
  'neon-alley': {
    stageId: 'neon-alley',
    title: 'Neon Velocity',
    genre: 'Dark Industrial Synth',
    bpm: 162,
    accentColor: '#e879f9',
    audioUrl: '',
    bars: 4,
    instrument: 'synthwave',
    bassStyle: 'analog-16',
    drumStyle: 'synthwave',
    // Am -> F -> G -> Em
    chords: [
      [45, 52, 57, 60],
      [41, 48, 53, 57],
      [43, 50, 55, 59],
      [40, 47, 52, 55]
    ],
    melody: [
      69, 72, 76, 81, 84, 81, 79, 76, 76, 74, 72, 74, 76, 79, 81, 0,
      77, 81, 84, 88, 84, 81, 77, 76, 76, 72, 74, 76, 79, 76, 74, 0,
      79, 83, 86, 91, 86, 83, 79, 76, 76, 74, 72, 71, 74, 76, 79, 0,
      76, 79, 83, 88, 83, 81, 79, 76, 74, 72, 71, 74, 76, 79, 83, 0
    ],
    bass: [
      33, 33, 45, 33, 33, 45, 33, 45, 33, 33, 45, 33, 33, 45, 33, 40,
      29, 29, 41, 29, 29, 41, 29, 41, 29, 29, 41, 29, 29, 41, 29, 36,
      31, 31, 43, 31, 31, 43, 31, 43, 31, 31, 43, 31, 31, 43, 31, 38,
      28, 28, 40, 28, 28, 40, 28, 40, 31, 35, 36, 40, 35, 33, 31, 28
    ],
    arp: [
      57, 60, 64, 69, 72, 69, 64, 60, 53, 57, 60, 65, 69, 65, 60, 57,
      55, 59, 62, 67, 71, 67, 62, 59, 52, 55, 59, 64, 67, 64, 59, 55
    ]
  },
  'temple-dojo': {
    stageId: 'temple-dojo',
    title: 'Sakura Blade',
    genre: 'Extreme Shamisen Core',
    bpm: 170,
    accentColor: '#f472b6',
    audioUrl: '',
    bars: 4,
    instrument: 'shamisen',
    bassStyle: 'taiko-drone',
    drumStyle: 'taiko',
    // D Hirajoshi
    chords: [
      [50, 57, 62, 65],
      [46, 53, 58, 62],
      [45, 52, 57, 60],
      [48, 55, 60, 64]
    ],
    melody: [
      74, 76, 77, 81, 82, 81, 77, 76, 74, 70, 74, 76, 77, 81, 86, 0,
      82, 81, 77, 81, 82, 86, 89, 0, 86, 82, 81, 77, 76, 74, 70, 0,
      69, 70, 74, 76, 77, 81, 82, 86, 82, 86, 89, 86, 82, 81, 77, 76,
      74, 77, 81, 86, 89, 86, 81, 77, 76, 74, 77, 81, 86, 81, 77, 74
    ],
    bass: [
      38, 38, 38, 45, 38, 38, 45, 38, 38, 38, 38, 41, 45, 41, 38, 45,
      34, 34, 34, 41, 34, 34, 41, 34, 34, 34, 34, 38, 41, 38, 34, 41,
      33, 33, 33, 40, 33, 33, 40, 33, 33, 33, 33, 38, 40, 38, 33, 40,
      36, 36, 36, 43, 36, 43, 36, 48, 36, 41, 45, 41, 38, 36, 38, 45
    ]
  },
  'volcano-arena': {
    stageId: 'volcano-arena',
    title: 'Magma Gauntlet',
    genre: 'Extreme Thrash Deathmatch',
    bpm: 186,
    accentColor: '#ef4444',
    audioUrl: '',
    bars: 4,
    instrument: 'metal-shred',
    bassStyle: 'chug',
    drumStyle: 'thrash',
    // E Phrygian Dominant
    chords: [
      [40, 47, 52, 56],
      [41, 48, 53, 57],
      [44, 51, 56, 59],
      [45, 52, 57, 60]
    ],
    melody: [
      76, 77, 80, 81, 83, 81, 80, 77, 76, 77, 80, 83, 88, 84, 83, 80,
      77, 80, 81, 84, 88, 84, 83, 81, 80, 77, 76, 72, 76, 80, 83, 0,
      76, 77, 80, 81, 83, 84, 88, 89, 88, 84, 83, 81, 80, 77, 76, 74,
      80, 83, 84, 88, 89, 88, 84, 83, 81, 80, 77, 76, 74, 76, 80, 0
    ],
    bass: [
      40, 40, 40, 40, 41, 40, 40, 40, 44, 40, 40, 40, 45, 41, 40, 41,
      40, 40, 40, 40, 41, 40, 40, 40, 48, 47, 45, 41, 40, 41, 44, 41,
      40, 40, 40, 40, 44, 40, 40, 40, 45, 40, 40, 40, 48, 47, 45, 44,
      41, 41, 44, 44, 45, 45, 48, 48, 47, 45, 44, 41, 40, 40, 41, 40
    ]
  },
  'space-station': {
    stageId: 'space-station',
    title: 'Orbital Overdrive',
    genre: 'Hyper Psy-Trance Shred',
    bpm: 172,
    accentColor: '#22d3ee',
    audioUrl: '',
    bars: 4,
    instrument: 'trance-chip',
    bassStyle: 'psy-roll',
    drumStyle: 'trance',
    // Gm -> Eb -> F -> Dm
    chords: [
      [55, 62, 67, 70],
      [51, 58, 63, 67],
      [53, 60, 65, 69],
      [50, 57, 62, 65]
    ],
    melody: [
      79, 82, 86, 82, 91, 86, 82, 79, 84, 82, 79, 77, 79, 82, 86, 0,
      75, 79, 82, 87, 91, 87, 82, 79, 86, 82, 79, 75, 79, 82, 87, 0,
      77, 81, 84, 89, 93, 89, 84, 81, 87, 86, 84, 81, 84, 86, 89, 0,
      74, 77, 81, 86, 89, 86, 81, 77, 84, 81, 77, 74, 77, 81, 86, 0
    ],
    bass: [
      43, 43, 55, 43, 43, 43, 55, 43, 43, 43, 55, 43, 43, 55, 43, 55,
      39, 39, 51, 39, 39, 39, 51, 39, 39, 39, 51, 39, 39, 51, 39, 51,
      41, 41, 53, 41, 41, 41, 53, 41, 41, 41, 53, 41, 41, 53, 41, 53,
      38, 38, 50, 38, 38, 38, 50, 38, 38, 41, 45, 50, 45, 41, 38, 45
    ],
    arp: [
      67, 70, 74, 79, 82, 79, 74, 70, 63, 67, 70, 75, 79, 75, 70, 67,
      65, 69, 72, 77, 81, 77, 72, 69, 62, 65, 69, 74, 77, 74, 69, 65
    ]
  },
  'glacier-fortress': {
    stageId: 'glacier-fortress',
    title: 'Aurora Shatter',
    genre: 'Arctic Hyper Rave',
    bpm: 164,
    accentColor: '#34d399',
    audioUrl: '',
    bars: 4,
    instrument: 'trance-chip',
    bassStyle: 'analog-16',
    drumStyle: 'trance',
    // Bm -> G -> A -> F#7
    chords: [
      [47, 54, 59, 62],
      [43, 50, 55, 59],
      [45, 52, 57, 61],
      [42, 49, 54, 58]
    ],
    melody: [
      71, 74, 78, 83, 86, 83, 81, 78, 78, 76, 74, 78, 83, 86, 83, 0,
      79, 83, 86, 91, 86, 83, 79, 78, 78, 74, 76, 78, 83, 79, 78, 0,
      81, 85, 88, 93, 88, 85, 81, 78, 78, 76, 74, 73, 76, 78, 81, 0,
      78, 82, 85, 90, 85, 83, 81, 78, 76, 74, 73, 78, 82, 85, 90, 0
    ],
    bass: [
      35, 35, 47, 35, 35, 47, 35, 47, 35, 35, 47, 35, 35, 47, 35, 42,
      31, 31, 43, 31, 31, 43, 31, 43, 31, 31, 43, 31, 31, 43, 31, 38,
      33, 33, 45, 33, 33, 45, 33, 45, 33, 33, 45, 33, 33, 45, 33, 40,
      30, 30, 42, 30, 30, 42, 30, 42, 34, 37, 42, 46, 42, 37, 34, 30
    ],
    arp: [
      59, 62, 66, 71, 74, 71, 66, 62, 55, 59, 62, 67, 71, 67, 62, 59,
      57, 61, 64, 69, 73, 69, 64, 61, 54, 58, 61, 66, 70, 66, 61, 58
    ]
  },
  'thunder-colosseum': {
    stageId: 'thunder-colosseum',
    title: 'Colosseum Fury',
    genre: 'Gladiator Power Metal',
    bpm: 178,
    accentColor: '#c084fc',
    audioUrl: '',
    bars: 4,
    instrument: 'war-brass',
    bassStyle: 'chug',
    drumStyle: 'battle',
    // C#m -> A -> B -> G#7
    chords: [
      [49, 56, 61, 64],
      [45, 52, 57, 61],
      [47, 54, 59, 63],
      [44, 51, 56, 60]
    ],
    melody: [
      73, 76, 80, 85, 88, 85, 83, 80, 76, 78, 80, 83, 85, 83, 80, 0,
      81, 85, 88, 92, 88, 85, 83, 81, 80, 78, 76, 73, 76, 80, 85, 0,
      78, 83, 87, 90, 87, 83, 80, 78, 76, 75, 73, 71, 75, 78, 83, 0,
      76, 80, 84, 88, 92, 88, 84, 80, 84, 83, 80, 76, 80, 84, 88, 0
    ],
    bass: [
      37, 37, 37, 44, 37, 44, 37, 49, 37, 37, 37, 44, 40, 44, 37, 40,
      33, 33, 33, 40, 33, 40, 33, 45, 33, 33, 33, 40, 37, 40, 33, 37,
      35, 35, 35, 42, 35, 42, 35, 47, 35, 35, 35, 42, 39, 42, 35, 39,
      32, 32, 44, 32, 36, 39, 44, 36, 44, 39, 36, 32, 39, 44, 48, 32
    ]
  },
  'shadow-shrine': {
    stageId: 'shadow-shrine',
    title: 'Blood Moon Torii',
    genre: 'Demon Shinobi Metal',
    bpm: 160,
    accentColor: '#f43f5e',
    audioUrl: '',
    bars: 4,
    instrument: 'shamisen',
    bassStyle: 'taiko-drone',
    drumStyle: 'taiko',
    // C In-sen
    chords: [
      [48, 55, 60, 61],
      [44, 51, 56, 60],
      [41, 48, 53, 55],
      [46, 53, 58, 60]
    ],
    melody: [
      72, 73, 77, 79, 84, 79, 77, 73, 72, 70, 72, 73, 77, 79, 84, 0,
      79, 80, 84, 85, 89, 85, 84, 80, 79, 77, 73, 72, 73, 77, 79, 0,
      70, 72, 73, 77, 79, 82, 84, 85, 84, 82, 79, 77, 79, 82, 84, 0,
      73, 77, 79, 84, 85, 84, 82, 79, 77, 73, 72, 70, 72, 73, 77, 0
    ],
    bass: [
      36, 36, 36, 43, 36, 36, 43, 36, 36, 36, 36, 37, 43, 37, 36, 43,
      32, 32, 32, 39, 32, 32, 39, 32, 32, 32, 32, 36, 39, 36, 32, 39,
      29, 29, 29, 36, 29, 29, 36, 29, 29, 29, 29, 34, 36, 34, 29, 36,
      34, 34, 34, 41, 34, 41, 34, 46, 34, 39, 43, 39, 37, 36, 34, 43
    ]
  }
};

export function getStageMusicTheme(stageId: string): StageMusicTheme {
  const track = STAGE_TRACKS[stageId] ?? STAGE_TRACKS['storm-citadel'];
  return {
    stageId: track.stageId,
    title: track.title,
    genre: track.genre,
    bpm: track.bpm,
    accentColor: track.accentColor
  };
}

let musicAudioCtx: AudioContext | null = null;
let musicMasterGain: GainNode | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let activeHtmlAudio: HTMLAudioElement | null = null;
let pendingAudioRetry: (() => void) | null = null;
let currentStageId: string | null = null;
let currentRequestToken = 0;
let currentSettings: GameSettings = { ...DEFAULT_SETTINGS };
let unlockListenersAttached = false;
const renderedTrackCache = new Map<string, AudioBuffer>();

function ensureAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') {
    return null;
  }

  if (!musicAudioCtx) {
    musicAudioCtx = new AudioContext();
    musicMasterGain = musicAudioCtx.createGain();
    musicMasterGain.gain.setValueAtTime(computeMusicGain(currentSettings), musicAudioCtx.currentTime);
    musicMasterGain.connect(musicAudioCtx.destination);
  }

  if (musicAudioCtx.state === 'suspended') {
    void musicAudioCtx.resume().catch(() => {});
    attachUnlockListeners();
  }

  return musicAudioCtx;
}

function attachUnlockListeners(): void {
  if (unlockListenersAttached || typeof window === 'undefined') {
    return;
  }
  unlockListenersAttached = true;

  const resume = (): void => {
    if (musicAudioCtx && musicAudioCtx.state === 'suspended') {
      void musicAudioCtx.resume().catch(() => {});
    }
    if (!musicAudioCtx || musicAudioCtx.state === 'running') {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
      unlockListenersAttached = false;
    }
  };

  window.addEventListener('pointerdown', resume, { passive: true });
  window.addEventListener('keydown', resume, { passive: true });
}

function clearPendingAudioRetry(): void {
  if (pendingAudioRetry && typeof window !== 'undefined') {
    window.removeEventListener('pointerdown', pendingAudioRetry);
    window.removeEventListener('keydown', pendingAudioRetry);
  }
  pendingAudioRetry = null;
}

let musicDucked = false;

function computeMusicGain(settings: GameSettings): number {
  if (settings.muted) {
    return 0;
  }
  const base = Math.max(0, Math.min(0.75, settings.musicVolume * 0.5));
  return musicDucked ? base * 0.22 : base;
}

function computeHtmlAudioVolume(settings: GameSettings): number {
  if (settings.muted) {
    return 0;
  }
  return Math.max(0, Math.min(1, settings.musicVolume * 0.72));
}

export function setStageMusicDucked(ducked: boolean): void {
  musicDucked = ducked;
  updateStageMusicSettings(currentSettings);
}

export function updateStageMusicSettings(settings: GameSettings): void {
  currentSettings = settings;
  if (activeHtmlAudio) {
    activeHtmlAudio.volume = computeHtmlAudioVolume(settings);
  }
  if (!musicAudioCtx || !musicMasterGain) {
    return;
  }
  const target = computeMusicGain(settings);
  musicMasterGain.gain.setTargetAtTime(target, musicAudioCtx.currentTime, 0.04);
}

export function stopStageMusic(): void {
  currentRequestToken += 1;
  currentStageId = null;
  clearPendingAudioRetry();
  if (activeHtmlAudio) {
    try {
      activeHtmlAudio.pause();
      activeHtmlAudio.src = '';
    } catch {
      // Ignore cleanup errors.
    }
    activeHtmlAudio = null;
  }
  if (currentSource) {
    try {
      currentSource.stop();
      currentSource.disconnect();
    } catch {
      // Ignore already-stopped source nodes.
    }
    currentSource = null;
  }
}

export function startStageMusic(stageId: string, settings: GameSettings): StageMusicTheme {
  const arrangement = STAGE_TRACKS[stageId] ?? STAGE_TRACKS['storm-citadel'];
  updateStageMusicSettings(settings);

  if (currentStageId === arrangement.stageId && (activeHtmlAudio || currentSource)) {
    return getStageMusicTheme(arrangement.stageId);
  }

  stopStageMusic();
  currentStageId = arrangement.stageId;
  const token = ++currentRequestToken;

  startProceduralFallback(arrangement, token);
  return getStageMusicTheme(arrangement.stageId);
}

function startProceduralFallback(arrangement: InternalTrackArrangement, token: number): void {
  const ctx = ensureAudioContext();
  if (!ctx || !musicMasterGain) {
    return;
  }

  void getOrRenderTrackBuffer(ctx, arrangement).then((buffer) => {
    if (!buffer || token !== currentRequestToken || !musicAudioCtx || !musicMasterGain) {
      return;
    }

    const source = musicAudioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(musicMasterGain);
    source.start(musicAudioCtx.currentTime + 0.02);
    currentSource = source;
  });
}

async function getOrRenderTrackBuffer(
  liveCtx: AudioContext,
  arrangement: InternalTrackArrangement
): Promise<AudioBuffer | null> {
  const cached = renderedTrackCache.get(arrangement.stageId);
  if (cached && cached.sampleRate === liveCtx.sampleRate) {
    return cached;
  }

  if (typeof OfflineAudioContext === 'undefined') {
    return null;
  }

  const stepDuration = 60 / arrangement.bpm / 4; // 16th-note seconds
  const totalSteps = arrangement.bars * 16;
  const loopDuration = totalSteps * stepDuration;
  const sampleRate = liveCtx.sampleRate;
  const frameCount = Math.ceil(loopDuration * sampleRate);

  const offline = new OfflineAudioContext(2, frameCount, sampleRate);
  const mixBus = offline.createGain();
  mixBus.gain.setValueAtTime(0.95, 0);

  // Extreme tube-style overdrive shaper + heavy limiter/compressor for punchy boss energy
  const satCurve = new Float32Array(new ArrayBuffer(256 * 4));
  for (let i = 0; i < 256; i += 1) {
    const x = (i * 2) / 256 - 1;
    satCurve[i] = Math.tanh(x * 1.65);
  }
  const saturator = offline.createWaveShaper();
  saturator.curve = satCurve;
  saturator.oversample = '2x';

  const compressor = offline.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-18, 0);
  compressor.knee.setValueAtTime(10, 0);
  compressor.ratio.setValueAtTime(6, 0);
  compressor.attack.setValueAtTime(0.002, 0);
  compressor.release.setValueAtTime(0.11, 0);

  mixBus.connect(saturator);
  saturator.connect(compressor);
  compressor.connect(offline.destination);

  const noiseBuf = createWhiteNoiseBuffer(offline);

  renderChords(offline, mixBus, arrangement, stepDuration);
  renderBass(offline, mixBus, arrangement, stepDuration, totalSteps);
  renderMelody(offline, mixBus, arrangement, stepDuration, totalSteps);
  if (arrangement.arp) {
    renderArpeggio(offline, mixBus, arrangement, stepDuration, totalSteps);
  }
  renderDrums(offline, mixBus, noiseBuf, arrangement, stepDuration, totalSteps);

  const buffer = await offline.startRendering();
  renderedTrackCache.set(arrangement.stageId, buffer);
  return buffer;
}

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function createWhiteNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * 0.6);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  // Deterministic PRNG for consistent musical textures
  let seed = 0x517cc1b7;
  for (let i = 0; i < len; i += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    ch[i] = (seed / 0xffffffff) * 2 - 1;
  }
  return buf;
}

function renderChords(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  arrangement: InternalTrackArrangement,
  stepSec: number
): void {
  const barSec = stepSec * 16;
  arrangement.chords.forEach((chord, barIndex) => {
    const startAt = barIndex * barSec;
    const isStab = arrangement.instrument === 'war-brass';

    chord.forEach((midi, voiceIdx) => {
      const freq = midiToHz(midi);
      const filter = ctx.createBiquadFilter();
      const panner = ctx.createStereoPanner();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isStab ? 2200 : 1250, startAt);
      panner.pan.setValueAtTime(voiceIdx % 2 === 0 ? -0.22 : 0.22, startAt);

      filter.connect(panner);
      panner.connect(dest);

      if (isStab) {
        // Relentless war-brass power stabs on strong beats
        const hits = [startAt, startAt + stepSec * 4, startAt + stepSec * 8, startAt + stepSec * 12];
        hits.forEach((hitAt) => {
          const hOsc = ctx.createOscillator();
          const hGain = ctx.createGain();
          hOsc.type = 'sawtooth';
          hOsc.frequency.setValueAtTime(freq, hitAt);
          hGain.gain.setValueAtTime(0.0001, hitAt);
          hGain.gain.linearRampToValueAtTime(0.05, hitAt + 0.012);
          hGain.gain.exponentialRampToValueAtTime(0.0001, hitAt + stepSec * 2.1);
          hOsc.connect(hGain);
          hGain.connect(filter);
          hOsc.start(hitAt);
          hOsc.stop(hitAt + stepSec * 2.2);
        });
        return;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type =
        arrangement.instrument === 'shamisen'
          ? 'sine'
          : arrangement.instrument === 'metal-shred'
            ? 'sawtooth'
            : 'triangle';
      osc.frequency.setValueAtTime(freq, startAt);
      osc.detune.setValueAtTime((voiceIdx % 2 === 0 ? -1 : 1) * 5, startAt);

      const amp = arrangement.instrument === 'trance-chip' ? 0.065 : 0.055;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(amp, startAt + 0.09);
      gain.gain.setValueAtTime(amp * 0.88, startAt + barSec - 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + barSec - 0.01);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      osc.start(startAt);
      osc.stop(startAt + barSec);
    });
  });
}

function renderBass(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  arrangement: InternalTrackArrangement,
  stepSec: number,
  totalSteps: number
): void {
  const pattern = arrangement.bass;
  for (let step = 0; step < totalSteps; step += 1) {
    const midi = pattern[step % pattern.length];
    if (!midi) {
      continue;
    }

    const startAt = step * stepSec;
    const dur =
      arrangement.bassStyle === 'taiko-drone'
        ? stepSec * 2.6
        : arrangement.bassStyle === 'analog-16' || arrangement.bassStyle === 'psy-roll'
          ? stepSec * 0.82
          : stepSec * 1.45;
    const freq = midiToHz(midi);

    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type =
      arrangement.bassStyle === 'war-pulse'
        ? 'sawtooth'
        : arrangement.bassStyle === 'taiko-drone'
          ? 'triangle'
          : 'sawtooth';
    sub.type = 'sine';

    osc.frequency.setValueAtTime(freq, startAt);
    sub.frequency.setValueAtTime(freq, startAt);

    filter.type = 'lowpass';
    const cutoffStart =
      arrangement.bassStyle === 'war-pulse'
        ? 1750
        : arrangement.bassStyle === 'chug'
          ? 1450
          : 1050;
    filter.Q.setValueAtTime(arrangement.bassStyle === 'psy-roll' ? 5.5 : 2.5, startAt);
    filter.frequency.setValueAtTime(cutoffStart, startAt);
    filter.frequency.exponentialRampToValueAtTime(210, startAt + dur);

    const peak = arrangement.bassStyle === 'chug' ? 0.24 : 0.2;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(peak, startAt + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(startAt);
    sub.start(startAt);
    osc.stop(startAt + dur + 0.02);
    sub.stop(startAt + dur + 0.02);
  }
}

function renderMelody(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  arrangement: InternalTrackArrangement,
  stepSec: number,
  totalSteps: number
): void {
  const pattern = arrangement.melody;
  for (let step = 0; step < totalSteps; step += 1) {
    const midi = pattern[step % pattern.length];
    if (!midi) {
      continue;
    }

    // Hold note until next non-zero step (up to 3 steps) so phrases sing smoothly
    let holdSteps = 1;
    while (step + holdSteps < totalSteps && holdSteps < 3 && pattern[(step + holdSteps) % pattern.length] === 0) {
      holdSteps += 1;
    }

    const startAt = step * stepSec;
    const dur = holdSteps * stepSec * 0.92;
    const freq = midiToHz(midi);

    switch (arrangement.instrument) {
      case 'shamisen':
        playShamisenPluck(ctx, dest, startAt, freq, Math.max(dur, stepSec * 1.6));
        break;
      case 'rock-lead':
      case 'metal-shred':
        playRockLead(ctx, dest, startAt, freq, dur, arrangement.instrument === 'metal-shred');
        break;
      case 'war-brass':
        playBrassLead(ctx, dest, startAt, freq, dur);
        break;
      case 'synthwave':
        playSynthLead(ctx, dest, startAt, freq, dur);
        break;
      case 'trance-chip':
        playTranceLead(ctx, dest, startAt, freq, dur);
        break;
    }
  }
}

function playRockLead(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startAt: number,
  freq: number,
  dur: number,
  heavy: boolean
): void {
  // Power-chord fifth harmony + detuned dual guitar shred
  const pairs: Array<{ ratio: number; detune: number; pan: number }> = [
    { ratio: 1, detune: -9, pan: -0.35 },
    { ratio: 1, detune: 9, pan: 0.35 },
    { ratio: 1.498, detune: 0, pan: 0 }
  ];

  pairs.forEach(({ ratio, detune, pan: panVal }) => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * ratio, startAt);
    osc.detune.setValueAtTime(detune, startAt);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(heavy ? 3.8 : 2.6, startAt);
    filter.frequency.setValueAtTime(heavy ? 4200 : 3600, startAt);
    filter.frequency.exponentialRampToValueAtTime(1150, startAt + dur);

    const amp = ratio > 1 ? 0.042 : heavy ? 0.098 : 0.088;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(amp, startAt + 0.01);
    gain.gain.setValueAtTime(amp * 0.82, startAt + dur * 0.72);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

    pan.pan.setValueAtTime(panVal, startAt);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(pan);
    pan.connect(dest);
    osc.start(startAt);
    osc.stop(startAt + dur + 0.02);
  });
}

function playBrassLead(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startAt: number,
  freq: number,
  dur: number
): void {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq * 0.985, startAt);
  osc.frequency.linearRampToValueAtTime(freq, startAt + 0.022);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, startAt);
  filter.frequency.linearRampToValueAtTime(3200, startAt + 0.045);
  filter.frequency.exponentialRampToValueAtTime(1100, startAt + dur);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(0.14, startAt + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start(startAt);
  osc.stop(startAt + dur + 0.02);
}

function playSynthLead(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startAt: number,
  freq: number,
  dur: number
): void {
  [0, 11].forEach((cents, idx) => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startAt);
    osc.detune.setValueAtTime(idx === 0 ? -cents : cents, startAt);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(3.0, startAt);
    filter.frequency.setValueAtTime(3600, startAt);
    filter.frequency.exponentialRampToValueAtTime(900, startAt + dur);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(0.08, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

    pan.pan.setValueAtTime(idx === 0 ? -0.32 : 0.32, startAt);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(pan);
    pan.connect(dest);
    osc.start(startAt);
    osc.stop(startAt + dur + 0.02);
  });
}

function playShamisenPluck(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startAt: number,
  freq: number,
  dur: number
): void {
  // Sharp plectrum attack + resonant string decay
  const carrier = ctx.createOscillator();
  const harmonic = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  carrier.type = 'triangle';
  harmonic.type = 'sawtooth';
  carrier.frequency.setValueAtTime(freq, startAt);
  harmonic.frequency.setValueAtTime(freq * 2, startAt);

  filter.type = 'bandpass';
  filter.Q.setValueAtTime(1.4, startAt);
  filter.frequency.setValueAtTime(Math.min(5200, freq * 4.5), startAt);
  filter.frequency.exponentialRampToValueAtTime(Math.max(420, freq * 1.4), startAt + dur);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(0.24, startAt + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

  carrier.connect(filter);
  harmonic.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  carrier.start(startAt);
  harmonic.start(startAt);
  carrier.stop(startAt + dur + 0.02);
  harmonic.stop(startAt + dur + 0.02);
}

function playTranceLead(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startAt: number,
  freq: number,
  dur: number
): void {
  const osc = ctx.createOscillator();
  const octave = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'square';
  octave.type = 'triangle';
  osc.frequency.setValueAtTime(freq, startAt);
  octave.frequency.setValueAtTime(freq * 2, startAt);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(4200, startAt);
  filter.frequency.exponentialRampToValueAtTime(1400, startAt + dur);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(0.11, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

  osc.connect(filter);
  octave.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(startAt);
  octave.start(startAt);
  osc.stop(startAt + dur + 0.02);
  octave.stop(startAt + dur + 0.02);
}

function renderArpeggio(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  arrangement: InternalTrackArrangement,
  stepSec: number,
  totalSteps: number
): void {
  const arp = arrangement.arp;
  if (!arp || arp.length === 0) {
    return;
  }

  for (let step = 0; step < totalSteps; step += 1) {
    const midi = arp[step % arp.length];
    if (!midi) {
      continue;
    }

    const startAt = step * stepSec;
    const dur = stepSec * 0.72;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();

    osc.type = arrangement.instrument === 'trance-chip' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(midiToHz(midi), startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(0.055, startAt + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

    pan.pan.setValueAtTime(step % 2 === 0 ? -0.42 : 0.42, startAt);

    osc.connect(gain);
    gain.connect(pan);
    pan.connect(dest);
    osc.start(startAt);
    osc.stop(startAt + dur + 0.01);
  }
}

function renderDrums(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  noiseBuf: AudioBuffer,
  arrangement: InternalTrackArrangement,
  stepSec: number,
  totalSteps: number
): void {
  for (let step = 0; step < totalSteps; step += 1) {
    const stepInBar = step % 16;
    const startAt = step * stepSec;

    switch (arrangement.drumStyle) {
      case 'rock':
        if (stepInBar % 2 === 0 && (stepInBar < 8 || stepInBar === 10 || stepInBar === 14)) {
          triggerKick(ctx, dest, startAt, 0.38, 165, 42);
        }
        if (stepInBar === 4 || stepInBar === 12) {
          triggerSnare(ctx, dest, noiseBuf, startAt, 0.3, 0.14);
        }
        if (stepInBar === 0) {
          triggerAnvil(ctx, dest, startAt, 0.12);
        }
        triggerHat(ctx, dest, noiseBuf, startAt, stepInBar % 2 === 0 ? 0.085 : 0.045, 0.04);
        break;

      case 'battle':
        // Relentless double-kick assault + heavy snare & steel crash accents
        if (stepInBar % 2 === 0) {
          triggerKick(ctx, dest, startAt, stepInBar % 4 === 0 ? 0.4 : 0.26, 170, 40);
        }
        if (stepInBar === 4 || stepInBar === 12 || stepInBar === 15) {
          triggerSnare(ctx, dest, noiseBuf, startAt, stepInBar === 15 ? 0.2 : 0.31, 0.14);
        }
        if (stepInBar === 0 || stepInBar === 8) {
          triggerAnvil(ctx, dest, startAt, 0.13);
        }
        triggerHat(ctx, dest, noiseBuf, startAt, stepInBar % 2 === 0 ? 0.08 : 0.042, 0.036);
        break;

      case 'synthwave':
        if (stepInBar % 4 === 0 || stepInBar === 14) {
          triggerKick(ctx, dest, startAt, 0.42, 160, 40);
        }
        if (stepInBar === 4 || stepInBar === 12) {
          triggerSnare(ctx, dest, noiseBuf, startAt, 0.32, 0.19);
        }
        if (stepInBar === 0) {
          triggerAnvil(ctx, dest, startAt, 0.09);
        }
        triggerHat(ctx, dest, noiseBuf, startAt, stepInBar % 4 === 2 ? 0.1 : 0.045, 0.06);
        break;

      case 'taiko':
        // Thundering war-taiko double-hits + steel blade clashes
        if (stepInBar === 0 || stepInBar === 2 || stepInBar === 6 || stepInBar === 8 || stepInBar === 10 || stepInBar === 14) {
          triggerKick(ctx, dest, startAt, 0.42, 122, 42);
        }
        if (stepInBar === 4 || stepInBar === 12) {
          triggerSnare(ctx, dest, noiseBuf, startAt, 0.26, 0.12);
          triggerWoodblock(ctx, dest, startAt, 980, 0.2);
        }
        if (stepInBar === 0) {
          triggerAnvil(ctx, dest, startAt, 0.11);
        }
        if (stepInBar === 10 || stepInBar === 15) {
          triggerWoodblock(ctx, dest, startAt, 1340, 0.13);
        }
        break;

      case 'thrash':
        // Nonstop 16th-note double-kick thrash + anvil crashes
        if (stepInBar % 2 === 0 || stepInBar === 15) {
          triggerKick(ctx, dest, startAt, stepInBar % 4 === 0 ? 0.42 : 0.28, 178, 38);
        }
        if (stepInBar === 4 || stepInBar === 12) {
          triggerSnare(ctx, dest, noiseBuf, startAt, 0.34, 0.15);
        }
        if (stepInBar === 0 || stepInBar === 8) {
          triggerAnvil(ctx, dest, startAt, 0.16);
        }
        triggerHat(ctx, dest, noiseBuf, startAt, 0.075, 0.038);
        break;

      case 'trance':
        if (stepInBar % 4 === 0 || stepInBar === 14) {
          triggerKick(ctx, dest, startAt, 0.4, 172, 42);
        }
        if (stepInBar === 4 || stepInBar === 12) {
          triggerSnare(ctx, dest, noiseBuf, startAt, 0.28, 0.12);
        }
        if (stepInBar === 0) {
          triggerAnvil(ctx, dest, startAt, 0.1);
        }
        triggerHat(ctx, dest, noiseBuf, startAt, stepInBar % 4 === 2 ? 0.11 : 0.05, stepInBar % 4 === 2 ? 0.075 : 0.03);
        break;
    }
  }
}

function triggerKick(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startAt: number,
  amp: number,
  startHz: number,
  endHz: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startHz, startAt);
  osc.frequency.exponentialRampToValueAtTime(endHz, startAt + 0.12);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(amp, startAt + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.18);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(startAt);
  osc.stop(startAt + 0.2);
}

function triggerSnare(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  noiseBuf: AudioBuffer,
  startAt: number,
  amp: number,
  duration: number
): void {
  const body = ctx.createOscillator();
  const bodyGain = ctx.createGain();
  body.type = 'triangle';
  body.frequency.setValueAtTime(210, startAt);
  body.frequency.exponentialRampToValueAtTime(110, startAt + 0.08);
  bodyGain.gain.setValueAtTime(amp * 0.65, startAt);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.1);
  body.connect(bodyGain);
  bodyGain.connect(dest);
  body.start(startAt);
  body.stop(startAt + 0.11);

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(1350, startAt);
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(amp, startAt);
  nGain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  noise.connect(filter);
  filter.connect(nGain);
  nGain.connect(dest);
  noise.start(startAt);
  noise.stop(startAt + duration + 0.02);
}

function triggerHat(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  noiseBuf: AudioBuffer,
  startAt: number,
  amp: number,
  duration: number
): void {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(6200, startAt);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(amp, startAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  noise.start(startAt);
  noise.stop(startAt + duration + 0.01);
}

function triggerWoodblock(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startAt: number,
  freq: number,
  amp: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startAt);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.72, startAt + 0.055);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(amp, startAt + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.075);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(startAt);
  osc.stop(startAt + 0.09);
}

function triggerAnvil(ctx: OfflineAudioContext, dest: AudioNode, startAt: number, amp: number): void {
  [520, 785, 1170].forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startAt);
    gain.gain.setValueAtTime(amp * 0.45, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.24);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(startAt);
    osc.stop(startAt + 0.26);
  });
}
