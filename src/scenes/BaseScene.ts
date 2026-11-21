import * as Phaser from 'phaser';

import { getAppContext } from '../game/context';
import type { AppContext } from '../game/context';
import { SCENE_KEYS, type SceneKey } from '../game/types';

export abstract class BaseScene extends Phaser.Scene {
  protected get app(): AppContext {
    return getAppContext();
  }

  protected markActiveScene(sceneKey: SceneKey): void {
    this.app.debugStore.patchState({ activeScene: sceneKey });
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

  protected createFooterHint(text: string): void {
    const { centerX, height } = this.cameras.main;

    this.add
      .text(centerX, height - 28, text, {
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
        padding: { x: 14, y: 8 },
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
