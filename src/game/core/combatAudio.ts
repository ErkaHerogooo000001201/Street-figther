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
  | 'parry'
  | 'guardBreak'
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
      sharedDriveCurve[i] = Math.tanh(x * 3.1);
    }
  }
  const shaper = ctx.createWaveShaper();
  shaper.curve = sharedDriveCurve;
  shaper.oversample = '2x';
  return shaper;
}

/**
 * Inharmonic steel modal ratios mimicking real metallic plates, blades, and anvils.
 */
const STEEL_RATIOS = [1.0, 1.56, 2.24, 2.91, 3.84, 5.17];

export function playCombatSfx(kind: CombatSfxKind, settings: GameSettings): void {
  const volume = sfxGain(settings, 0.46);
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
      // Crisp steel gauntlet strike + tight low body thud + metallic snap
      metallicCluster(ctx, now, 780, 0.14, volume * 0.62, 1.015);
      filteredNoise(ctx, now, 'bandpass', 3800, 2.2, 0.045, volume * 0.72, 1900);
      tone(ctx, now, 'sine', 165, 50, 0.085, volume * 0.9, true);
      break;
    }
    case 'heavy': {
      // Heavy iron-plate smash: deep sub slam + brutal steel clang + crunch burst
      metallicCluster(ctx, now, 520, 0.28, volume * 0.78, 0.985);
      metallicCluster(ctx, now + 0.012, 1080, 0.22, volume * 0.42, 0.99);
      filteredNoise(ctx, now, 'bandpass', 2600, 1.8, 0.11, volume * 0.85, 850);
      tone(ctx, now, 'sine', 155, 32, 0.24, volume * 1.25, true);
      break;
    }
    case 'block': {
      // Heavy steel-on-steel shield clang (damped metallic plate impact)
      metallicCluster(ctx, now, 690, 0.19, volume * 0.72, 0.992);
      filteredNoise(ctx, now, 'highpass', 3200, 2.4, 0.042, volume * 0.65);
      tone(ctx, now, 'triangle', 260, 110, 0.07, volume * 0.35);
      break;
    }
    case 'parry': {
      // Razor-sharp katana/blade parry: bright ringing high-steel clash!
      metallicCluster(ctx, now, 1340, 0.42, volume * 0.88, 1.004);
      metallicCluster(ctx, now + 0.008, 2010, 0.34, volume * 0.56, 0.998);
      filteredNoise(ctx, now, 'highpass', 4800, 2.6, 0.055, volume * 0.82);
      break;
    }
    case 'guardBreak': {
      // Shattering armor & cracked steel anvil impact + stagger drop
      metallicCluster(ctx, now, 440, 0.52, volume * 0.95, 0.94);
      metallicCluster(ctx, now + 0.02, 1180, 0.38, volume * 0.68, 0.86);
      filteredNoise(ctx, now, 'bandpass', 2100, 1.4, 0.24, volume * 0.92, 420);
      tone(ctx, now, 'sine', 140, 28, 0.36, volume * 1.25, true);
      break;
    }
    case 'jump': {
      // Tight armored step-off & air slice
      filteredNoise(ctx, now, 'bandpass', 920, 1.8, 0.085, volume * 0.42, 1850);
      metallicCluster(ctx, now, 640, 0.06, volume * 0.18, 1.06);
      break;
    }
    case 'charge': {
      // Metallic blade draw + rising energy turbine resonance
      metallicCluster(ctx, now, 620, 0.32, volume * 0.48, 1.28);
      filteredNoise(ctx, now, 'bandpass', 780, 2.4, 0.32, volume * 0.58, 3400);
      tone(ctx, now, 'sawtooth', 145, 420, 0.32, volume * 0.46, true);
      break;
    }
    case 'special': {
      // Roaring steel shockwave + heavy metallic bell impact + sub drop
      metallicCluster(ctx, now, 480, 0.52, volume * 0.85, 0.96);
      metallicCluster(ctx, now + 0.02, 960, 0.44, volume * 0.55, 0.98);
      filteredNoise(ctx, now, 'bandpass', 3200, 1.5, 0.34, volume * 0.86, 480);
      tone(ctx, now, 'sine', 180, 30, 0.44, volume * 1.3, true);
      break;
    }
    case 'secret': {
      // Cataclysmic iron temple-gong + razor steel shimmer + abyssal drop
      metallicCluster(ctx, now, 320, 0.9, volume * 0.95, 0.985);
      metallicCluster(ctx, now + 0.018, 860, 0.72, volume * 0.65, 1.012);
      filteredNoise(ctx, now, 'bandpass', 640, 1.2, 0.66, volume * 0.95, 3600);
      tone(ctx, now, 'sine', 115, 24, 0.8, volume * 1.35, true);
      break;
    }
    case 'ko': {
      // Monumental crashing iron gong + shattering metal burst + deep KO boom
      metallicCluster(ctx, now, 360, 1.05, volume * 1.0, 0.982);
      metallicCluster(ctx, now + 0.015, 790, 0.82, volume * 0.72, 0.992);
      filteredNoise(ctx, now, 'bandpass', 2800, 1.2, 0.58, volume * 0.98, 220);
      tone(ctx, now, 'sine', 160, 22, 0.92, volume * 1.4, true);
      break;
    }
  }
}

/**
 * Generates an inharmonic metallic resonance cluster using FM modulation and
 * high-Q ringing partials so hits sound like steel colliding with steel.
 */
function metallicCluster(
  ctx: AudioContext,
  startAt: number,
  baseFreq: number,
  duration: number,
  peakGain: number,
  pitchDrift = 1.0
): void {
  const bus = ctx.createGain();
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.setValueAtTime(Math.max(220, baseFreq * 0.65), startAt);

  bus.gain.setValueAtTime(0.0001, startAt);
  bus.gain.linearRampToValueAtTime(peakGain, startAt + 0.002);
  bus.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  // Fast FM modulator adds crisp metallic clang attack
  const mod = ctx.createOscillator();
  const modGain = ctx.createGain();
  mod.type = 'triangle';
  mod.frequency.setValueAtTime(baseFreq * 1.414, startAt);
  modGain.gain.setValueAtTime(baseFreq * 0.95, startAt);
  modGain.gain.exponentialRampToValueAtTime(8, startAt + Math.min(0.08, duration * 0.45));
  mod.connect(modGain);
  mod.start(startAt);
  mod.stop(startAt + duration + 0.03);

  STEEL_RATIOS.forEach((ratio, idx) => {
    const osc = ctx.createOscillator();
    const partialGain = ctx.createGain();
    const freq = Math.min(9200, baseFreq * ratio);
    const partialDur = duration * Math.pow(0.84, idx);

    osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, startAt);
    if (pitchDrift !== 1.0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * pitchDrift), startAt + partialDur);
    }

    if (idx < 3) {
      modGain.connect(osc.frequency);
    }

    const weight = (1 / (idx + 1.3)) * 0.48;
    partialGain.gain.setValueAtTime(weight, startAt);
    partialGain.gain.exponentialRampToValueAtTime(0.001, startAt + partialDur);

    osc.connect(partialGain);
    partialGain.connect(hpf);
    osc.start(startAt);
    osc.stop(startAt + partialDur + 0.03);
  });

  hpf.connect(bus);
  bus.connect(ctx.destination);
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
  gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.004);
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
  gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(startAt);
  src.stop(startAt + duration + 0.02);
}
