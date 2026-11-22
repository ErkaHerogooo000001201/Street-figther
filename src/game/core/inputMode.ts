import type { ControlScheme, GameSettings } from '../types';

export type EffectiveInputMode = 'touch' | 'keyboard';

type InputModeListener = (mode: EffectiveInputMode) => void;

const listeners = new Set<InputModeListener>();
let listenersInstalled = false;
let lastDetectedMode: EffectiveInputMode = detectPhoneOrTouchViewport() ? 'touch' : 'keyboard';

const GAMEPLAY_KEY_PATTERN =
  /^(Arrow(Left|Right|Up|Down)|Key[WASDFGJKLCEVRPM]|Space|Enter|Escape|Tab|Digit[1-4])$/;

export function detectPhoneOrTouchViewport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  const noHover = window.matchMedia?.('(hover: none)')?.matches ?? false;
  const mobileUa =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent ?? '');
  const narrowTouch =
    typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 && window.innerWidth <= 1024;

  return coarsePointer || noHover || mobileUa || narrowTouch;
}

export function installInputModeTracking(): void {
  if (listenersInstalled || typeof window === 'undefined') {
    return;
  }
  listenersInstalled = true;

  const setDetected = (next: EffectiveInputMode): void => {
    if (next === lastDetectedMode) {
      return;
    }
    lastDetectedMode = next;
    listeners.forEach((listener) => listener(next));
  };

  window.addEventListener(
    'touchstart',
    () => {
      setDetected('touch');
    },
    { passive: true, capture: true }
  );

  window.addEventListener(
    'pointerdown',
    (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        setDetected('touch');
      }
    },
    { passive: true, capture: true }
  );

  window.addEventListener(
    'keydown',
    (event: KeyboardEvent) => {
      if (GAMEPLAY_KEY_PATTERN.test(event.code)) {
        setDetected('keyboard');
      }
    },
    { passive: true, capture: true }
  );
}

export function getDetectedInputMode(): EffectiveInputMode {
  installInputModeTracking();
  return lastDetectedMode;
}

export function resolveEffectiveInputMode(
  settings: Pick<GameSettings, 'controlScheme'>,
  isMobileShell: boolean
): EffectiveInputMode {
  installInputModeTracking();

  if (settings.controlScheme === 'touch') {
    return 'touch';
  }
  if (settings.controlScheme === 'keyboard') {
    return 'keyboard';
  }

  if (isMobileShell && lastDetectedMode === 'touch') {
    return 'touch';
  }
  if (isMobileShell && detectPhoneOrTouchViewport()) {
    return lastDetectedMode;
  }

  return lastDetectedMode;
}

export function subscribeDetectedInputMode(listener: InputModeListener): () => void {
  installInputModeTracking();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function formatControlSchemeLabel(
  scheme: ControlScheme,
  effectiveMode: EffectiveInputMode
): string {
  if (scheme === 'touch') {
    return 'TOUCH PAD';
  }
  if (scheme === 'keyboard') {
    return 'KEYBOARD';
  }
  return effectiveMode === 'touch' ? 'AUTO (TOUCH)' : 'AUTO (KEYS)';
}
