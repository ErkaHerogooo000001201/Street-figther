import * as Phaser from 'phaser';

import { AUDIO_KEYS, playAudioCue } from '../game/core/audio';
import { startIntroMusic } from '../game/core/introMusic';
import { STAGE_DEFINITIONS } from '../game/stageConfig';
import { createSelectionCard, type SelectionCard } from '../game/ui';
import { SCENE_KEYS, type BotDifficulty, type MatchMode } from '../game/types';
import { BaseScene } from './BaseScene';

interface LevelSelectData {
  mode: MatchMode;
  botDifficulty?: BotDifficulty;
}

const ACCENT = 0xfacc15;
const GRID_COLS = 3;

/**
 * Stage selection screen showing all 9 fighting arenas in a 3x3 grid on one screen.
 */
export class LevelSelectScene extends BaseScene {
  private mode: MatchMode = '1v1';
  private botDifficulty?: BotDifficulty;
  private cards: SelectionCard[] = [];
  private selectedIndex = 0;

  constructor() {
    super(SCENE_KEYS.LevelSelect);
  }

  init(data: LevelSelectData): void {
    this.mode = data?.mode ?? '1v1';
    this.botDifficulty = data?.botDifficulty;
  }

  create(): void {
    this.cards = [];
    this.selectedIndex = 0;

    this.markActiveScene(SCENE_KEYS.LevelSelect);
    startIntroMusic(this.app.settingsStore.getState());
    this.cameras.main.setBackgroundColor(0x020617);
    const botLabel = (this.botDifficulty ?? this.app.settingsStore.getState().botDifficulty).toUpperCase();
    this.createHeading(
      'Select Stage',
      this.mode === '1v1'
        ? `1 vs 1 Local • All ${STAGE_DEFINITIONS.length} Arenas`
        : `1 vs CPU (${botLabel}) • All ${STAGE_DEFINITIONS.length} Arenas`
    );

    this.createMenuButton(24, 30);

    const modeBackBtn = this.add
      .text(this.cameras.main.width - 24, 30, '← MODE', {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        padding: { x: 16, y: 12 },
        stroke: '#334155',
        strokeThickness: 2
      })
      .setOrigin(1, 0.5)
      .setDepth(120)
      .setInteractive({ useHandCursor: true });
    modeBackBtn.on('pointerover', () => modeBackBtn.setColor('#facc15'));
    modeBackBtn.on('pointerout', () => modeBackBtn.setColor('#e2e8f0'));
    modeBackBtn.on('pointerdown', () => this.scene.start(SCENE_KEYS.ModeSelect));

    this.buildCards();
    this.registerInput();
    this.setSelection(0);

    const footerHint = this.createFooterHint('');
    const syncFooter = (mode: 'touch' | 'keyboard'): void => {
      footerHint.setText(
        mode === 'touch'
          ? 'Tap any arena to battle'
          : 'WASD / Arrows / Tap to choose • Enter / Space to confirm • Esc Menu'
      );
    };
    syncFooter(this.getEffectiveInputMode());
    this.subscribeEffectiveInputMode(syncFooter);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cards.forEach((card) => card.destroy());
      this.cards = [];
    });
  }

  private buildCards(): void {
    const { centerX } = this.cameras.main;
    const cardWidth = 340;
    const cardHeight = 158;
    const gapX = 28;
    const gapY = 16;
    const totalWidth = cardWidth * GRID_COLS + gapX * (GRID_COLS - 1);
    const startX = centerX - totalWidth / 2 + cardWidth / 2;
    const startY = 204;

    STAGE_DEFINITIONS.forEach((stage, index) => {
      const col = index % GRID_COLS;
      const row = Math.floor(index / GRID_COLS);
      const x = startX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      const card = createSelectionCard(this, {
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        title: stage.label,
        titleFontSize: '16px',
        texture: this.textures.exists(stage.key) ? stage.key : undefined,
        imageMaxSize: 196,
        imageOffsetY: -16,
        onHover: () => this.setSelection(index),
        onClick: () => this.confirm(index)
      });

      this.cards.push(card);
    });
  }

  private registerInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    keyboard.on('keydown-LEFT', () => this.moveSelection(-1));
    keyboard.on('keydown-A', () => this.moveSelection(-1));
    keyboard.on('keydown-RIGHT', () => this.moveSelection(1));
    keyboard.on('keydown-D', () => this.moveSelection(1));
    keyboard.on('keydown-UP', () => this.moveSelection(-GRID_COLS));
    keyboard.on('keydown-W', () => this.moveSelection(-GRID_COLS));
    keyboard.on('keydown-DOWN', () => this.moveSelection(GRID_COLS));
    keyboard.on('keydown-S', () => this.moveSelection(GRID_COLS));
    keyboard.on('keydown-ENTER', () => this.confirm(this.selectedIndex));
    keyboard.on('keydown-SPACE', () => this.confirm(this.selectedIndex));
    keyboard.on('keydown-ESC', () => this.goToMenu());
    keyboard.on('keydown-BACKSPACE', () => this.scene.start(SCENE_KEYS.ModeSelect));
  }

  private moveSelection(delta: number): void {
    const next = Phaser.Math.Wrap(this.selectedIndex + delta, 0, this.cards.length);
    this.setSelection(next);
  }

  private setSelection(index: number): void {
    this.selectedIndex = index;
    this.cards.forEach((card, cardIndex) => card.setSelected(cardIndex === index, ACCENT));
  }

  private confirm(index: number): void {
    this.setSelection(index);
    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
    this.scene.start(SCENE_KEYS.CharacterSelect, {
      mode: this.mode,
      stageId: STAGE_DEFINITIONS[index].id,
      botDifficulty: this.botDifficulty
    });
  }
}
