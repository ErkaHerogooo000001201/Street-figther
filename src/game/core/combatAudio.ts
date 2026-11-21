import type { GameSettings } from '../types';

let sharedAudioCtx: AudioContext | null = null;
let sharedNoiseBuffer: AudioBuffer | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') {
    return null;
  }

  sharedAudioCtx ??= new AudioContext();
  if (sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (sharedNoiseBuffer && sharedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return sharedNoiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 1.2);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  sharedNoiseBuffer = buffer;
  return buffer;
}

function sfxGain(settings: GameSettings, baseVolume: number): number {
  if (settings.muted) {
    return 0;
  }

  return Math.max(0, Math.min(1, baseVolume * settings.sfxVolume));
}

export type CombatSfxKind =
  | 'light'
  | 'heavy'
  | 'block'
  | 'jump'
  | 'charge'
  | 'special'
  | 'secret'
  | 'ko';

let sharedDriveCurve: Float32Array<ArrayBuffer> | null = null;

function getDriveNode(ctx: AudioContext): WaveShaperNode {
  if (!sharedDriveCurve) {
    const samples = 256;
    sharedDriveCurve = new Float32Array(new ArrayBuffer(samples * 4));
    for (let i = 0; i < samples; i += 1) {
      const x = (i * 2) / samples - 1;
      sharedDriveCurve[i] = Math.tanh(x * 2.6);
    }
  }
  const shaper = ctx.createWaveShaper();
  shaper.curve = sharedDriveCurve;
  shaper.oversample = '2x';
  return shaper;
}

export function playCombatSfx(kind: CombatSfxKind, settings: GameSettings): void {
  const volume = sfxGain(settings, 0.44);
  if (volume <= 0) {
    return;
  }

  const ctx = getCtx();
  if (!ctx) {
    return;
  }

  const now = ctx.currentTime;

  switch (kind) {
    case 'light': {
      // Snappy bone-impact punch thud + sharp slap crack
      tone(ctx, now, 'triangle', 220, 54, 0.095, volume * 1.05, true);
      filteredNoise(ctx, now, 'bandpass', 2400, 1.1, 0.06, volume * 0.72);
      break;
    }
    case 'heavy': {
      // Devastating heavy crunch + sub-bass chest slam + crunch noise
      tone(ctx, now, 'sine', 180, 34, 0.25, volume * 1.25, true);
      tone(ctx, now, 'sawtooth', 290, 58, 0.16, volume * 0.72, true);
      filteredNoise(ctx, now, 'lowpass', 2800, 1.1, 0.17, volume * 0.88);
      break;
    }
    case 'block': {
      // Sharp steel-on-steel parry clang
      tone(ctx, now, 'square', 1120, 680, 0.075, volume * 0.45, true);
      tone(ctx, now, 'triangle', 1640, 1040, 0.055, volume * 0.36);
      filteredNoise(ctx, now, 'highpass', 2600, 1.8, 0.05, volume * 0.42);
      break;
    }
    case 'jump': {
      // Tight burst dash-leap snap
      filteredNoise(ctx, now, 'bandpass', 780, 1.5, 0.1, volume * 0.44, 1580);
      tone(ctx, now, 'triangle', 175, 420, 0.085, volume * 0.28);
      break;
    }
    case 'charge': {
      // Aggressive power surge roar
      filteredNoise(ctx, now, 'bandpass', 520, 2.0, 0.36, volume * 0.56, 2600);
      tone(ctx, now, 'sawtooth', 160, 440, 0.34, volume * 0.55, true);
      tone(ctx, now + 0.03, 'square', 240, 660, 0.32, volume * 0.34, true);
      break;
    }
    case 'special': {
      // Earth-shaking shockwave boom + distorted energy roar
      tone(ctx, now, 'sine', 195, 32, 0.46, volume * 1.3, true);
      tone(ctx, now, 'sawtooth', 420, 110, 0.36, volume * 0.65, true);
      tone(ctx, now + 0.03, 'triangle', 640, 240, 0.3, volume * 0.42);
      filteredNoise(ctx, now, 'lowpass', 3600, 1.3, 0.4, volume * 0.85, 380);
      break;
    }
    case 'secret': {
      // Reality-shattering sub drop + thunderous cinematic blast
      tone(ctx, now, 'sine', 110, 26, 0.82, volume * 1.35, true);
      tone(ctx, now, 'sawtooth', 220, 440, 0.48, volume * 0.6, true);
      tone(ctx, now + 0.05, 'square', 330, 165, 0.58, volume * 0.42, true);
      filteredNoise(ctx, now, 'bandpass', 500, 1.1, 0.72, volume * 0.95, 3200);
      break;
    }
    case 'ko': {
      // Brutal cinematic KO shockwave + deep echoing thunder
      tone(ctx, now, 'sine', 150, 24, 0.72, volume * 1.35, true);
      tone(ctx, now + 0.04, 'sawtooth', 210, 42, 0.54, volume * 0.72, true);
      filteredNoise(ctx, now, 'lowpass', 2600, 1.0, 0.6, volume * 0.96, 180);
      break;
    }
  }
}

function tone(
  ctx: AudioContext,
  startAt: number,
  type: OscillatorType,
  startFreq: number,
  endFreq: number,
  duration: number,
  peakGain: number,
  drive = false
): void {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, startFreq), startAt);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startAt + duration);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3400, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(filter);
  if (drive) {
    const shaper = getDriveNode(ctx);
    filter.connect(shaper);
    shaper.connect(gain);
  } else {
    filter.connect(gain);
  }
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.03);
}

function filteredNoise(
  ctx: AudioContext,
  startAt: number,
  filterType: BiquadFilterType,
  startFreq: number,
  q: number,
  duration: number,
  peakGain: number,
  endFreq?: number
): void {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.Q.setValueAtTime(q, startAt);
  filter.frequency.setValueAtTime(Math.max(40, startFreq), startAt);
  if (endFreq !== undefined) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), startAt + duration);
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(startAt);
  src.stop(startAt + duration + 0.02);
}
