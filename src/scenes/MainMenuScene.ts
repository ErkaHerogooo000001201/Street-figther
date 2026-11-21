import * as Phaser from 'phaser';

import { AUDIO_KEYS, playAudioCue } from '../game/core/audio';
import { GAME_TAGLINE, GAME_TITLE } from '../game/constants';
import { ensureCrossoverFighterPrepared } from '../game/crossoverRenderer';
import { getCharacterAnimationByAction } from '../game/hero';
import { createTextButton, type TextButton } from '../game/ui';
import { SCENE_KEYS } from '../game/types';
import { BaseScene } from './BaseScene';

interface MenuOption {
  label: string;
  action: () => void;
}

export class MainMenuScene extends BaseScene {
  private selectedIndex = 0;

  private buttons: TextButton[] = [];

  private options: MenuOption[] = [];

  constructor() {
    super(SCENE_KEYS.MainMenu);
  }

  create(): void {
    this.buttons = [];
    this.selectedIndex = 0;
    this.options = [];

    this.markActiveScene(SCENE_KEYS.MainMenu);
    const camera = this.cameras.main;
    const { width, height, centerX, centerY } = camera;
    camera.setBackgroundColor(0x020617);

    // Subtle atmospheric stage backdrop
    if (this.textures.exists('rooftop-sunset-stage')) {
      const src = this.textures.get('rooftop-sunset-stage').getSourceImage() as HTMLImageElement;
      const scale = Math.max(width / Math.max(1, src.width), height / Math.max(1, src.height));
      this.add.image(centerX, centerY, 'rooftop-sunset-stage').setScale(scale).setAlpha(0.24).setDepth(0);
    }
    this.add.rectangle(centerX, centerY, width, height, 0x020617, 0.52).setDepth(0);

    // Flanking animated stances outside the center button column
    this.addFlankingStance('hero', Math.round(width * 0.14), Math.round(height * 0.85), true, 0x38bdf8);
    this.addFlankingStance('ryu', Math.round(width * 0.86), Math.round(height * 0.85), false, 0xf43f5e);

    // Crisp arcade header
    this.add
      .text(centerX, 68, GAME_TITLE.toUpperCase(), {
        color: '#facc15',
        fontFamily: 'monospace',
        fontSize: '46px',
        fontStyle: 'bold',
        stroke: '#7f1d1d',
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(centerX, 114, GAME_TAGLINE, {
        color: '#cbd5e1',
        fontFamily: 'monospace',
        fontSize: '15px',
        stroke: '#020617',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.renderMenu();

    const keyUp = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const keyDown = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const keyW = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    const keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    const keyEnter = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const keySpace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    keyUp?.on('down', () => this.moveSelection(-1));
    keyW?.on('down', () => this.moveSelection(-1));
    keyDown?.on('down', () => this.moveSelection(1));
    keyS?.on('down', () => this.moveSelection(1));
    keyEnter?.on('down', () => this.confirmOption(this.options[this.selectedIndex]));
    keySpace?.on('down', () => this.confirmOption(this.options[this.selectedIndex]));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearButtons();
      this.selectedIndex = 0;
      this.options = [];
    });

    this.createFooterHint('Arrow keys / WASD to navigate • Enter / Click to select');
  }

  private addFlankingStance(
    characterId: string,
    x: number,
    y: number,
    faceRight: boolean,
    auraColor: number
  ): void {
    try {
      ensureCrossoverFighterPrepared(this, characterId);
    } catch {
      // Ignore if fighter asset unavailable
    }

    const idleAnim = getCharacterAnimationByAction(characterId, 'idle');
    if (!idleAnim || !this.textures.exists(idleAnim.sheet.key)) {
      return;
    }

    this.add
      .ellipse(x, y - 6, 140, 26, auraColor, 0.2)
      .setStrokeStyle(2, auraColor, 0.55)
      .setDepth(1);

    const sprite = this.add
      .sprite(x, y, idleAnim.sheet.key, 0)
      .setOrigin(0.5, 0.9)
      .setScale(1.25)
      .setFlipX(faceRight)
      .setAlpha(0.75)
      .setDepth(2);

    if (this.anims.exists(idleAnim.key)) {
      sprite.play({ key: idleAnim.key, repeat: -1 });
    }
  }

  private moveSelection(direction: number): void {
    const next = Phaser.Math.Wrap(this.selectedIndex + direction, 0, this.buttons.length);
    this.setSelection(next);
  }

  private setSelection(index: number): void {
    this.selectedIndex = index;
    this.buttons.forEach((button, buttonIndex) => {
      button.setSelected(buttonIndex === index);
    });
  }

  private renderMenu(): void {
    this.clearButtons();

    this.options = [
      {
        label: 'Select Mode & Stage',
        action: () => this.scene.start(SCENE_KEYS.ModeSelect)
      },
      {
        label: 'Settings',
        action: () => this.scene.start(SCENE_KEYS.Settings)
      }
    ];

    const startY = 278;
    const spacing = 92;

    this.options.forEach((option, optionIndex) => {
      const button = createTextButton(this, {
        x: this.cameras.main.centerX,
        y: startY + optionIndex * spacing,
        width: 420,
        height: 62,
        label: option.label,
        onClick: () => this.confirmOption(option),
        onHover: () => this.setSelection(optionIndex)
      });
      button.group.setDepth(5);

      this.buttons.push(button);
    });

    this.setSelection(0);
  }

  private clearButtons(): void {
    this.buttons.forEach((button) => {
      button.destroy();
    });
    this.buttons = [];
  }

  private confirmOption(option?: MenuOption): void {
    if (!option) {
      return;
    }

    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
    option.action();
  }
}
