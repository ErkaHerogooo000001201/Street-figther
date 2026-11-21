import * as Phaser from 'phaser';

import { AUDIO_KEYS, playAudioCue } from '../game/core/audio';
import { createSelectionCard, type SelectionCard } from '../game/ui';
import { SCENE_KEYS, type BotDifficulty, type MatchMode } from '../game/types';
import { BaseScene } from './BaseScene';

interface ModeOption {
  mode: MatchMode;
  title: string;
  subtitle: string;
  texture: string;
}

interface DifficultyOption {
  difficulty: BotDifficulty;
  title: string;
  subtitle: string;
  accent: number;
}

const MODE_OPTIONS: ModeOption[] = [
  { mode: '1v1', title: '1 VS 1', subtitle: 'Two players, one keyboard', texture: 'mode-card-1v1' },
  { mode: '1vcpu', title: '1 VS CPU', subtitle: 'You pick, then choose AI tier', texture: 'mode-card-1vcpu' }
];

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { difficulty: 'easy', title: 'EASY', subtitle: 'Warm-up AI', accent: 0x22c55e },
  { difficulty: 'normal', title: 'NORMAL', subtitle: 'Balanced Duel', accent: 0x38bdf8 },
  { difficulty: 'hard', title: 'HARD', subtitle: 'Fast & Aggressive', accent: 0xfacc15 },
  { difficulty: 'nightmare', title: 'NIGHTMARE', subtitle: 'Boss Reflexes', accent: 0xf43f5e }
];

const ACCENT = 0x38bdf8;

/**
 * First step of the Play flow: choose a local two-player match or 1 vs CPU.
 * Selecting 1 vs CPU reveals the Bot Difficulty selection step right afterward.
 */
export class ModeSelectScene extends BaseScene {
  private step: 'mode' | 'difficulty' = 'mode';
  private cards: SelectionCard[] = [];
  private selectedIndex = 0;
  private subtitleText?: Phaser.GameObjects.Text;
  private stepBackBtn?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.ModeSelect);
  }

  create(): void {
    this.step = 'mode';
    this.cards = [];
    this.selectedIndex = 0;

    this.markActiveScene(SCENE_KEYS.ModeSelect);
    this.cameras.main.setBackgroundColor(0x020617);
    this.createHeading('Select Mode', '');
    this.createMenuButton(24, 30);

    const { centerX, width } = this.cameras.main;
    this.subtitleText = this.add
      .text(centerX, 92, 'How do you want to play?', {
        color: '#94a3b8',
        fontFamily: 'monospace',
        fontSize: '16px'
      })
      .setOrigin(0.5);

    this.stepBackBtn = this.add
      .text(width - 24, 30, '← MODES', {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        padding: { x: 14, y: 8 },
        stroke: '#334155',
        strokeThickness: 2
      })
      .setOrigin(1, 0.5)
      .setDepth(120)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });

    this.stepBackBtn.on('pointerover', () => this.stepBackBtn?.setColor('#facc15'));
    this.stepBackBtn.on('pointerout', () => this.stepBackBtn?.setColor('#e2e8f0'));
    this.stepBackBtn.on('pointerdown', () => this.showModeStep());

    this.showModeStep();
    this.registerInput();

    this.createFooterHint('← → / A D / Tap to choose • Enter / Space to confirm • Esc Menu');

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearCards();
    });
  }

  private clearCards(): void {
    this.cards.forEach((card) => card.destroy());
    this.cards = [];
  }

  private showModeStep(): void {
    this.step = 'mode';
    this.clearCards();
    this.subtitleText?.setText('How do you want to play?');
    this.stepBackBtn?.setVisible(false);

    const { centerX, centerY } = this.cameras.main;
    const cardWidth = 320;
    const cardHeight = 250;
    const gap = 60;
    const totalWidth = cardWidth * MODE_OPTIONS.length + gap * (MODE_OPTIONS.length - 1);
    const startX = centerX - totalWidth / 2 + cardWidth / 2;

    MODE_OPTIONS.forEach((option, index) => {
      const card = createSelectionCard(this, {
        x: startX + index * (cardWidth + gap),
        y: centerY + 6,
        width: cardWidth,
        height: cardHeight,
        title: option.title,
        subtitle: option.subtitle,
        texture: option.texture,
        imageMaxSize: 162,
        imageOffsetY: -46,
        onHover: () => this.setSelection(index),
        onClick: () => this.confirmCurrent(index)
      });

      this.cards.push(card);
    });

    this.setSelection(0);
  }

  private showDifficultyStep(): void {
    this.step = 'difficulty';
    this.clearCards();
    this.subtitleText?.setText('1 vs CPU — Choose Bot Difficulty');
    this.stepBackBtn?.setVisible(true);

    const { centerX, centerY } = this.cameras.main;
    const cardWidth = 228;
    const cardHeight = 196;
    const gap = 28;
    const totalWidth = cardWidth * DIFFICULTY_OPTIONS.length + gap * (DIFFICULTY_OPTIONS.length - 1);
    const startX = centerX - totalWidth / 2 + cardWidth / 2;

    const currentBot = this.app.settingsStore.getState().botDifficulty ?? 'hard';
    const initialIdx = Math.max(
      0,
      DIFFICULTY_OPTIONS.findIndex((o) => o.difficulty === currentBot)
    );

    DIFFICULTY_OPTIONS.forEach((option, index) => {
      const card = createSelectionCard(this, {
        x: startX + index * (cardWidth + gap),
        y: centerY + 12,
        width: cardWidth,
        height: cardHeight,
        title: option.title,
        subtitle: option.subtitle,
        titleFontSize: '22px',
        onHover: () => this.setSelection(index),
        onClick: () => this.confirmCurrent(index)
      });

      this.cards.push(card);
    });

    this.setSelection(initialIdx);
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
    keyboard.on('keydown-ENTER', () => this.confirmCurrent(this.selectedIndex));
    keyboard.on('keydown-SPACE', () => this.confirmCurrent(this.selectedIndex));
    keyboard.on('keydown-ESC', () => this.goToMenu());
    keyboard.on('keydown-BACKSPACE', () => {
      if (this.step === 'difficulty') {
        this.showModeStep();
      } else {
        this.goToMenu();
      }
    });
  }

  private moveSelection(direction: number): void {
    if (this.cards.length === 0) {
      return;
    }
    const next = Phaser.Math.Wrap(this.selectedIndex + direction, 0, this.cards.length);
    this.setSelection(next);
  }

  private setSelection(index: number): void {
    this.selectedIndex = index;
    this.cards.forEach((card, cardIndex) => {
      const accent =
        this.step === 'difficulty'
          ? (DIFFICULTY_OPTIONS[cardIndex]?.accent ?? ACCENT)
          : ACCENT;
      card.setSelected(cardIndex === index, accent);
    });
  }

  private confirmCurrent(index: number): void {
    this.setSelection(index);
    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());

    if (this.step === 'mode') {
      const picked = MODE_OPTIONS[index];
      if (picked.mode === '1vcpu') {
        this.showDifficultyStep();
        return;
      }

      this.scene.start(SCENE_KEYS.LevelSelect, { mode: picked.mode });
      return;
    }

    const chosenDifficulty = DIFFICULTY_OPTIONS[index]?.difficulty ?? 'hard';
    this.app.settingsStore.patchState({ botDifficulty: chosenDifficulty });
    this.scene.start(SCENE_KEYS.LevelSelect, {
      mode: '1vcpu',
      botDifficulty: chosenDifficulty
    });
  }
}
