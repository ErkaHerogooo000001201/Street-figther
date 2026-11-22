import * as Phaser from 'phaser';

import {
  resolveEffectiveInputMode,
  subscribeDetectedInputMode,
  type EffectiveInputMode
} from '../game/core/inputMode';
import { preloadIntroMusic, startIntroMusic, stopIntroMusic } from '../game/core/introMusic';
import { getAppContext } from '../game/context';
import type { AppContext } from '../game/context';
import { SCENE_KEYS, type SceneKey } from '../game/types';

export abstract class BaseScene extends Phaser.Scene {
  protected get app(): AppContext {
    return getAppContext();
  }

  protected markActiveScene(sceneKey: SceneKey): void {
    this.app.debugStore.patchState({ activeScene: sceneKey });
    if (sceneKey === SCENE_KEYS.Match) {
      stopIntroMusic();
    } else if (sceneKey === SCENE_KEYS.Boot) {
      preloadIntroMusic();
    } else {
      startIntroMusic(this.app.settingsStore.getState());
    }
  }

  protected getEffectiveInputMode(): EffectiveInputMode {
    return resolveEffectiveInputMode(this.app.settingsStore.getState(), this.app.isMobileShell);
  }

  protected subscribeEffectiveInputMode(onChange: (mode: EffectiveInputMode) => void): () => void {
    let lastMode = this.getEffectiveInputMode();

    const notifyIfChanged = (): void => {
      const next = this.getEffectiveInputMode();
      if (next !== lastMode) {
        lastMode = next;
        onChange(next);
      }
    };

    const unsubDetected = subscribeDetectedInputMode(notifyIfChanged);
    const unsubSettings = this.app.settingsStore.subscribe(notifyIfChanged);

    const cleanup = (): void => {
      unsubDetected();
      unsubSettings();
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    return cleanup;
  }

  protected createHeading(title: string, subtitle: string): void {
    const { centerX } = this.cameras.main;

    this.add
      .text(centerX, 56, title, {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '34px'
      })
      .setOrigin(0.5);

    if (subtitle) {
      this.add
        .text(centerX, 92, subtitle, {
          color: '#94a3b8',
          fontFamily: 'monospace',
          fontSize: '16px'
        })
        .setOrigin(0.5);
    }
  }

  protected createFooterHint(text: string): Phaser.GameObjects.Text {
    const { centerX, height } = this.cameras.main;

    return this.add
      .text(centerX, height - 24, text, {
        color: '#94a3b8',
        fontFamily: 'monospace',
        fontSize: '14px'
      })
      .setOrigin(0.5)
      .setDepth(100);
  }

  protected createMenuButton(
    x = 24,
    y = 30,
    label = '← MENU'
  ): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        padding: { x: 16, y: 11 },
        stroke: '#334155',
        strokeThickness: 2
      })
      .setOrigin(0, 0.5)
      .setDepth(120)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setColor('#facc15'));
    button.on('pointerout', () => button.setColor('#e2e8f0'));
    button.on('pointerdown', () => this.goToMenu());

    return button;
  }

  protected goToMenu(): void {
    this.scene.start(SCENE_KEYS.MainMenu);
  }
}
