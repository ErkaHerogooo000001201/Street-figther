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
    title: 'Eclipse Judgment Overture',
    genre: 'Orchestral Battle Rock',
    bpm: 148,
    accentColor: '#38bdf8',
    bars: 4,
    instrument: 'rock-lead',
    bassStyle: 'gallop',
    drumStyle: 'rock',
    // Dm -> Bb -> C -> A7 (relentless minor duel)
    chords: [
      [50, 57, 62, 65],
      [46, 53, 58, 62],
      [48, 55, 60, 63],
      [45, 52, 57, 61]
    ],
    melody: [
      74, 0, 74, 75, 77, 0, 81, 0, 79, 77, 75, 0, 74, 0, 72, 0,
      70, 0, 70, 72, 74, 0, 77, 0, 75, 74, 72, 0, 69, 0, 72, 0,
      74, 0, 75, 77, 81, 0, 82, 0, 81, 79, 77, 0, 75, 0, 74, 0,
      73, 0, 76, 0, 81, 0, 79, 0, 77, 0, 75, 0, 73, 0, 69, 0
    ],
    bass: [
      38, 38, 0, 38, 38, 38, 0, 38, 38, 0, 38, 38, 45, 0, 41, 0,
      34, 34, 0, 34, 34, 34, 0, 34, 34, 0, 34, 34, 41, 0, 38, 0,
      36, 36, 0, 36, 36, 36, 0, 36, 36, 0, 36, 36, 43, 0, 39, 0,
      33, 33, 0, 33, 33, 33, 0, 33, 37, 0, 40, 0, 45, 0, 43, 0
    ],
    arp: [
      62, 65, 69, 74, 62, 65, 69, 74, 58, 62, 65, 70, 58, 62, 65, 70,
      60, 63, 67, 72, 60, 63, 67, 72, 57, 61, 64, 69, 57, 61, 64, 69
    ]
  },
  'rooftop-sunset': {
    stageId: 'rooftop-sunset',
    title: 'Blood Horizon Showdown',
    genre: 'Hardcore Arena Brass & Shred',
    bpm: 146,
    accentColor: '#fb923c',
    bars: 4,
    instrument: 'war-brass',
    bassStyle: 'war-pulse',
    drumStyle: 'battle',
    // Em -> F -> Dm -> B7 (dark Spanish Phrygian showdown)
    chords: [
      [40, 47, 52, 55],
      [41, 48, 53, 57],
      [38, 45, 50, 53],
      [47, 51, 54, 59]
    ],
    melody: [
      76, 0, 77, 76, 79, 0, 83, 0, 81, 79, 77, 0, 76, 0, 72, 0,
      77, 0, 79, 81, 84, 0, 81, 0, 79, 77, 76, 0, 74, 0, 71, 0,
      74, 0, 76, 77, 81, 0, 79, 0, 77, 76, 74, 0, 72, 0, 69, 0,
      75, 0, 79, 0, 83, 0, 81, 0, 79, 0, 76, 0, 75, 0, 71, 0
    ],
    bass: [
      40, 40, 40, 0, 40, 40, 47, 0, 40, 40, 40, 0, 43, 0, 41, 0,
      41, 41, 41, 0, 41, 41, 48, 0, 41, 41, 41, 0, 45, 0, 41, 0,
      38, 38, 38, 0, 38, 38, 45, 0, 38, 38, 38, 0, 41, 0, 40, 0,
      35, 35, 47, 0, 35, 35, 42, 0, 35, 0, 39, 0, 42, 0, 35, 0
    ]
  },
  'neon-alley': {
    stageId: 'neon-alley',
    title: 'Cyberpunk Execution Protocol',
    genre: 'Industrial Darksynth',
    bpm: 140,
    accentColor: '#e879f9',
    bars: 4,
    instrument: 'synthwave',
    bassStyle: 'analog-16',
    drumStyle: 'synthwave',
    // Cm -> Ab -> G -> Fm
    chords: [
      [48, 55, 60, 63],
      [44, 51, 56, 60],
      [43, 50, 55, 59],
      [41, 48, 53, 56]
    ],
    melody: [
      72, 0, 75, 0, 79, 0, 75, 0, 77, 0, 75, 0, 74, 0, 72, 0,
      68, 0, 72, 0, 75, 0, 79, 0, 80, 0, 79, 0, 75, 0, 72, 0,
      74, 0, 79, 0, 83, 0, 79, 0, 77, 0, 74, 0, 71, 0, 67, 0,
      72, 0, 75, 0, 77, 0, 80, 0, 79, 0, 77, 0, 75, 0, 72, 0
    ],
    bass: [
      36, 36, 48, 36, 36, 36, 48, 36, 36, 36, 48, 36, 36, 36, 48, 36,
      32, 32, 44, 32, 32, 32, 44, 32, 32, 32, 44, 32, 32, 32, 44, 32,
      31, 31, 43, 31, 31, 31, 43, 31, 31, 31, 43, 31, 31, 31, 43, 31,
      29, 29, 41, 29, 29, 29, 41, 29, 31, 0, 35, 0, 36, 0, 34, 0
    ],
    arp: [
      60, 63, 67, 72, 67, 63, 60, 63, 56, 60, 63, 68, 63, 60, 56, 60,
      55, 59, 62, 67, 62, 59, 55, 59, 53, 56, 60, 65, 60, 56, 53, 56
    ]
  },
  'temple-dojo': {
    stageId: 'temple-dojo',
    title: 'Bloodshed & War Taiko',
    genre: 'War Shamisen & Taiko',
    bpm: 142,
    accentColor: '#f472b6',
    bars: 4,
    instrument: 'shamisen',
    bassStyle: 'taiko-drone',
    drumStyle: 'taiko',
    // E Hirajoshi: E, F, A, B, C
    chords: [
      [52, 59, 64, 65],
      [48, 55, 60, 64],
      [45, 52, 57, 60],
      [47, 53, 59, 64]
    ],
    melody: [
      76, 77, 81, 0, 83, 81, 77, 76, 0, 72, 76, 77, 81, 0, 76, 0,
      72, 76, 77, 0, 81, 0, 84, 83, 81, 77, 76, 0, 72, 71, 69, 0,
      69, 71, 72, 76, 0, 77, 81, 0, 83, 84, 83, 81, 77, 0, 76, 0,
      71, 72, 76, 77, 83, 0, 81, 77, 76, 0, 72, 0, 71, 0, 64, 0
    ],
    bass: [
      40, 0, 40, 40, 40, 0, 47, 0, 40, 0, 40, 40, 41, 0, 40, 0,
      36, 0, 36, 36, 36, 0, 43, 0, 36, 0, 36, 36, 40, 0, 36, 0,
      33, 0, 33, 33, 33, 0, 40, 0, 33, 0, 33, 33, 36, 0, 33, 0,
      35, 0, 35, 35, 41, 0, 35, 0, 35, 0, 40, 0, 47, 0, 40, 0
    ]
  },
  'volcano-arena': {
    stageId: 'volcano-arena',
    title: 'Magma Execution Fury',
    genre: 'Thrash Boss Metal',
    bpm: 158,
    accentColor: '#ef4444',
    bars: 4,
    instrument: 'metal-shred',
    bassStyle: 'chug',
    drumStyle: 'thrash',
    // D Phrygian Dominant: D - Eb - F# - G - A - Bb - C
    chords: [
      [38, 45, 50, 54],
      [39, 46, 51, 55],
      [42, 49, 54, 57],
      [43, 50, 55, 58]
    ],
    melody: [
      74, 0, 75, 74, 78, 0, 79, 0, 81, 0, 79, 78, 75, 0, 74, 0,
      75, 0, 78, 79, 82, 0, 81, 0, 79, 78, 75, 0, 74, 70, 69, 0,
      74, 75, 78, 79, 81, 82, 86, 0, 82, 81, 79, 78, 75, 74, 72, 0,
      78, 0, 81, 0, 82, 0, 86, 0, 81, 0, 78, 0, 75, 0, 74, 0
    ],
    bass: [
      38, 38, 38, 38, 39, 38, 38, 38, 42, 38, 38, 38, 43, 0, 39, 0,
      38, 38, 38, 38, 39, 38, 38, 38, 46, 0, 45, 0, 43, 0, 39, 0,
      38, 38, 38, 38, 42, 38, 38, 38, 43, 38, 38, 38, 46, 0, 45, 0,
      39, 39, 42, 42, 43, 43, 46, 46, 45, 0, 43, 0, 39, 0, 38, 0
    ]
  },
  'space-station': {
    stageId: 'space-station',
    title: 'Orbital Annihilation',
    genre: 'Dark Psy-Battle Trance',
    bpm: 144,
    accentColor: '#22d3ee',
    bars: 4,
    instrument: 'trance-chip',
    bassStyle: 'psy-roll',
    drumStyle: 'trance',
    // F#m -> D -> E -> C#m
    chords: [
      [54, 61, 66, 69],
      [50, 57, 62, 66],
      [52, 59, 64, 68],
      [49, 56, 61, 64]
    ],
    melody: [
      78, 0, 81, 0, 85, 0, 81, 0, 83, 0, 81, 0, 78, 0, 76, 0,
      74, 0, 78, 0, 81, 0, 86, 0, 85, 0, 81, 0, 78, 0, 74, 0,
      76, 0, 80, 0, 83, 0, 88, 0, 86, 0, 85, 0, 83, 0, 80, 0,
      73, 0, 76, 0, 80, 0, 85, 0, 83, 0, 80, 0, 76, 0, 73, 0
    ],
    bass: [
      42, 42, 54, 42, 42, 42, 54, 42, 42, 42, 54, 42, 42, 42, 54, 42,
      38, 38, 50, 38, 38, 38, 50, 38, 38, 38, 50, 38, 38, 38, 50, 38,
      40, 40, 52, 40, 40, 40, 52, 40, 40, 40, 52, 40, 40, 40, 52, 40,
      37, 37, 49, 37, 37, 37, 49, 37, 37, 37, 49, 37, 40, 0, 44, 0
    ],
    arp: [
      66, 69, 73, 78, 73, 69, 66, 69, 62, 66, 69, 74, 69, 66, 62, 66,
      64, 68, 71, 76, 71, 68, 64, 68, 61, 64, 68, 73, 68, 64, 61, 64
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

function computeMusicGain(settings: GameSettings): number {
  if (settings.muted) {
    return 0;
  }
  return Math.max(0, Math.min(0.65, settings.musicVolume * 0.42));
}

export function updateStageMusicSettings(settings: GameSettings): void {
  currentSettings = settings;
  if (!musicAudioCtx || !musicMasterGain) {
    return;
  }
  const target = computeMusicGain(settings);
  musicMasterGain.gain.setTargetAtTime(target, musicAudioCtx.currentTime, 0.04);
}

export function stopStageMusic(): void {
  currentRequestToken += 1;
  currentStageId = null;
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

  if (currentStageId === arrangement.stageId && currentSource) {
    return getStageMusicTheme(arrangement.stageId);
  }

  stopStageMusic();
  currentStageId = arrangement.stageId;
  const token = ++currentRequestToken;

  const ctx = ensureAudioContext();
  if (!ctx || !musicMasterGain) {
    return getStageMusicTheme(arrangement.stageId);
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

  return getStageMusicTheme(arrangement.stageId);
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
  mixBus.gain.setValueAtTime(0.82, 0);

  // Warm master compressor so punches & chords sit cohesively without clipping
  const compressor = offline.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-14, 0);
  compressor.knee.setValueAtTime(12, 0);
  compressor.ratio.setValueAtTime(4, 0);
  compressor.attack.setValueAtTime(0.004, 0);
  compressor.release.setValueAtTime(0.16, 0);

  mixBus.connect(compressor);
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
  [-7, 7].forEach((detuneCents, idx) => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();

    osc.type = heavy ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(freq, startAt);
    osc.detune.setValueAtTime(detuneCents, startAt);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(heavy ? 3.2 : 1.8, startAt);
    filter.frequency.setValueAtTime(heavy ? 3200 : 2800, startAt);
    filter.frequency.exponentialRampToValueAtTime(950, startAt + dur);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(heavy ? 0.095 : 0.085, startAt + 0.015);
    gain.gain.setValueAtTime(heavy ? 0.075 : 0.068, startAt + dur * 0.72);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

    pan.pan.setValueAtTime(idx === 0 ? -0.25 : 0.25, startAt);

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
        if (stepInBar === 0 || stepInBar === 6 || stepInBar === 8 || stepInBar === 10) {
          triggerKick(ctx, dest, startAt, 0.34, 150, 44);
        }
        if (stepInBar === 4 || stepInBar === 12) {
          triggerSnare(ctx, dest, noiseBuf, startAt, 0.24, 0.14);
        }
        if (stepInBar % 2 === 0) {
          triggerHat(ctx, dest, noiseBuf, startAt, stepInBar % 4 === 2 ? 0.08 : 0.045, 0.045);
        }
        break;

      case 'battle':
        // Double-kick battleground drive + heavy snare & crash accents
        if (stepInBar === 0 || stepInBar === 2 || stepInBar === 6 || stepInBar === 8 || stepInBar === 10) {
          triggerKick(ctx, dest, startAt, 0.36, 155, 42);
        }
        if (stepInBar === 4 || stepInBar === 12) {
          triggerSnare(ctx, dest, noiseBuf, startAt, 0.27, 0.14);
        }
        if (stepInBar === 0) {
          triggerAnvil(ctx, dest, startAt, 0.1);
        }
        triggerHat(ctx, dest, noiseBuf, startAt, stepInBar % 2 === 0 ? 0.065 : 0.032, 0.036);
        break;

      case 'synthwave':
        if (stepInBar % 4 === 0) {
          triggerKick(ctx, dest, startAt, 0.36, 145, 42);
        }
        if (stepInBar === 4 || stepInBar === 12) {
          triggerSnare(ctx, dest, noiseBuf, startAt, 0.26, 0.18);
        }
        if (stepInBar % 4 === 2) {
          triggerHat(ctx, dest, noiseBuf, startAt, 0.085, 0.075);
        }
        break;

      case 'taiko':
        // Booming taiko beats + sharp wooden clack accents
        if (stepInBar === 0 || stepInBar === 6 || stepInBar === 8 || stepInBar === 14) {
          triggerKick(ctx, dest, startAt, 0.38, 108, 46);
        }
        if (stepInBar === 4 || stepInBar === 12) {
          triggerWoodblock(ctx, dest, startAt, 940, 0.18);
        }
        if (stepInBar === 10 || stepInBar === 15) {
          triggerWoodblock(ctx, dest, startAt, 1280, 0.11);
        }
        break;

      case 'thrash':
        // Double-kick metal assault + anvil crash on downbeat
        if (stepInBar % 2 === 0) {
          triggerKick(ctx, dest, startAt, stepInBar % 4 === 0 ? 0.34 : 0.22, 165, 42);
        }
        if (stepInBar === 4 || stepInBar === 12) {
          triggerSnare(ctx, dest, noiseBuf, startAt, 0.28, 0.15);
        }
        if (stepInBar === 0) {
          triggerAnvil(ctx, dest, startAt, 0.14);
        }
        triggerHat(ctx, dest, noiseBuf, startAt, 0.055, 0.038);
        break;

      case 'trance':
        if (stepInBar % 4 === 0) {
          triggerKick(ctx, dest, startAt, 0.35, 160, 44);
        }
        if (stepInBar === 4 || stepInBar === 12) {
          triggerSnare(ctx, dest, noiseBuf, startAt, 0.22, 0.12);
        }
        triggerHat(ctx, dest, noiseBuf, startAt, stepInBar % 4 === 2 ? 0.095 : 0.038, stepInBar % 4 === 2 ? 0.08 : 0.03);
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
