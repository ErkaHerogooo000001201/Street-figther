import { DEFAULT_SETTINGS } from '../settings';
import type { GameSettings } from '../types';

export const INTRO_MUSIC_META = {
  title: 'Final Round (Take 1)',
  artist: 'FlashingStrait',
  url: '/assets/audio/intro.m4a'
} as const;

let introAudioCtx: AudioContext | null = null;
let introGainNode: GainNode | null = null;
let activeSource: AudioBufferSourceNode | null = null;
let decodedBuffer: AudioBuffer | null = null;
let decodePromise: Promise<AudioBuffer | null> | null = null;

let fallbackAudio: HTMLAudioElement | null = null;
let shouldPlay = false;
let currentSettings: GameSettings = { ...DEFAULT_SETTINGS };
let unlockAttached = false;
const stateListeners = new Set<() => void>();

function notifyStateListeners(): void {
  stateListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener errors.
    }
  });
}

function computeIntroVolume(settings: GameSettings): number {
  if (settings.muted) {
    return 0;
  }
  return Math.max(0, Math.min(1, settings.musicVolume * 0.72));
}

function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') {
    return null;
  }
  if (!introAudioCtx) {
    introAudioCtx = new AudioContext();
    introGainNode = introAudioCtx.createGain();
    introGainNode.gain.setValueAtTime(computeIntroVolume(currentSettings), introAudioCtx.currentTime);
    introGainNode.connect(introAudioCtx.destination);
    introAudioCtx.addEventListener('statechange', () => {
      if (introAudioCtx?.state === 'running' && shouldPlay && !isIntroMusicPlaying()) {
        tryPlayIntroMusic();
      }
      notifyStateListeners();
    });
  }
  return introAudioCtx;
}

function ensureDecodedBuffer(): Promise<AudioBuffer | null> {
  if (decodedBuffer) {
    return Promise.resolve(decodedBuffer);
  }
  if (decodePromise) {
    return decodePromise;
  }
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return Promise.resolve(null);
  }
  const ctx = getOrCreateAudioContext();
  if (!ctx) {
    return Promise.resolve(null);
  }

  decodePromise = fetch(INTRO_MUSIC_META.url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch intro music (${response.status})`);
      }
      return response.arrayBuffer();
    })
    .then((bytes) => ctx.decodeAudioData(bytes))
    .then((buffer) => {
      decodedBuffer = buffer;
      if (shouldPlay && !isIntroMusicPlaying() && ctx.state === 'running') {
        tryPlayIntroMusic();
      }
      return buffer;
    })
    .catch(() => {
      decodePromise = null;
      return null;
    });

  return decodePromise;
}

function ensureFallbackAudio(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') {
    return null;
  }
  if (!fallbackAudio) {
    fallbackAudio = new Audio(INTRO_MUSIC_META.url);
    fallbackAudio.loop = true;
    fallbackAudio.preload = 'auto';
    fallbackAudio.addEventListener('play', notifyStateListeners);
    fallbackAudio.addEventListener('pause', notifyStateListeners);
  }
  return fallbackAudio;
}

function stopFallbackAudio(resetTime: boolean): void {
  if (!fallbackAudio) {
    return;
  }
  try {
    if (!fallbackAudio.paused) {
      fallbackAudio.pause();
    }
    if (resetTime) {
      fallbackAudio.currentTime = 0;
    }
  } catch {
    // Ignore audio element cleanup errors.
  }
}

function stopWebAudioSource(): void {
  if (!activeSource) {
    return;
  }
  const src = activeSource;
  activeSource = null;
  try {
    src.stop();
    src.disconnect();
  } catch {
    // Ignore already-stopped source nodes.
  }
}

function handleUnlockGesture(): void {
  const ctx = getOrCreateAudioContext();
  if (ctx && ctx.state === 'suspended') {
    void ctx.resume().then(() => {
      if (shouldPlay && !isIntroMusicPlaying()) {
        tryPlayIntroMusic();
      }
    }).catch(() => {});
  }

  if (shouldPlay && !isIntroMusicPlaying()) {
    tryPlayIntroMusic();
  }
}

function ensureUnlockListeners(): void {
  if (unlockAttached || typeof window === 'undefined') {
    return;
  }
  unlockAttached = true;
  window.addEventListener('pointerdown', handleUnlockGesture, { capture: true, passive: true });
  window.addEventListener('touchstart', handleUnlockGesture, { capture: true, passive: true });
  window.addEventListener('keydown', handleUnlockGesture, { capture: true, passive: true });
  window.addEventListener('click', handleUnlockGesture, { capture: true, passive: true });
}

function tryPlayIntroMusic(): void {
  if (!shouldPlay) {
    return;
  }

  const volume = computeIntroVolume(currentSettings);
  if (volume <= 0) {
    return;
  }

  if (isIntroMusicPlaying()) {
    return;
  }

  const ctx = getOrCreateAudioContext();
  if (ctx && introGainNode) {
    introGainNode.gain.setValueAtTime(volume, ctx.currentTime);
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }
    if (decodedBuffer && ctx.state === 'running') {
      stopFallbackAudio(false);
      stopWebAudioSource();
      const source = ctx.createBufferSource();
      source.buffer = decodedBuffer;
      source.loop = true;
      source.connect(introGainNode);
      source.start(0);
      activeSource = source;
      notifyStateListeners();
      return;
    }
  }

  const audio = ensureFallbackAudio();
  if (!audio) {
    return;
  }
  audio.volume = volume;
  if (!audio.paused) {
    return;
  }

  try {
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      void playPromise
        .then(() => {
          if (!shouldPlay) {
            stopFallbackAudio(true);
            return;
          }
          notifyStateListeners();
        })
        .catch(() => {
          ensureUnlockListeners();
          notifyStateListeners();
        });
    } else {
      notifyStateListeners();
    }
  } catch {
    ensureUnlockListeners();
    notifyStateListeners();
  }
}

export function preloadIntroMusic(): void {
  ensureUnlockListeners();
  ensureFallbackAudio();
  void ensureDecodedBuffer();
}

export function isIntroMusicPlaying(): boolean {
  if (!shouldPlay || computeIntroVolume(currentSettings) <= 0) {
    return false;
  }
  if (activeSource && introAudioCtx?.state === 'running') {
    return true;
  }
  return Boolean(fallbackAudio && !fallbackAudio.paused && fallbackAudio.volume > 0);
}

export function subscribeIntroMusicState(listener: () => void): () => void {
  stateListeners.add(listener);
  return () => {
    stateListeners.delete(listener);
  };
}

export function startIntroMusic(settings: GameSettings): void {
  currentSettings = settings;
  shouldPlay = true;
  ensureUnlockListeners();
  void ensureDecodedBuffer();

  const volume = computeIntroVolume(settings);
  if (introAudioCtx && introGainNode) {
    introGainNode.gain.setValueAtTime(volume, introAudioCtx.currentTime);
  }
  if (fallbackAudio) {
    fallbackAudio.volume = volume;
  }

  if (!isIntroMusicPlaying() && volume > 0) {
    tryPlayIntroMusic();
  } else {
    notifyStateListeners();
  }
}

export function updateIntroMusicSettings(settings: GameSettings): void {
  currentSettings = settings;
  const volume = computeIntroVolume(settings);

  if (introAudioCtx && introGainNode) {
    introGainNode.gain.setTargetAtTime(volume, introAudioCtx.currentTime, 0.03);
  }
  if (fallbackAudio) {
    fallbackAudio.volume = volume;
  }

  if (shouldPlay && volume > 0 && !isIntroMusicPlaying()) {
    tryPlayIntroMusic();
  } else {
    notifyStateListeners();
  }
}

export function stopIntroMusic(): void {
  shouldPlay = false;
  stopWebAudioSource();
  stopFallbackAudio(true);
  notifyStateListeners();
}
