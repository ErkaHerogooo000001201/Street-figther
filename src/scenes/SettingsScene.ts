import * as Phaser from 'phaser';

import { AUDIO_KEYS, playAudioCue } from '../game/core/audio';
import { formatControlSchemeLabel } from '../game/core/inputMode';
import { startIntroMusic } from '../game/core/introMusic';
import { createTextButton, type TextButton } from '../game/ui';
import { BOT_DIFFICULTIES, CONTROL_SCHEMES, DEFAULT_SETTINGS } from '../game/settings';
import { SCENE_KEYS } from '../game/types';
import { BaseScene } from './BaseScene';

const ROW_COUNT = 7;

export class SettingsScene extends BaseScene {
  private sfxValue!: Phaser.GameObjects.Text;

  private musicValue!: Phaser.GameObjects.Text;

  private botValue!: Phaser.GameObjects.Text;

  private controlsValue!: Phaser.GameObjects.Text;

  private muteValue!: Phaser.GameObjects.Text;

  private sfxDownButton!: TextButton;

  private sfxUpButton!: TextButton;

  private musicDownButton!: TextButton;

  private musicUpButton!: TextButton;

  private botButton!: TextButton;

  private controlsButton!: TextButton;

  private muteButton!: TextButton;

  private resetButton!: TextButton;

  private backButton!: TextButton;

  private selectedRow = 0;

  constructor() {
    super(SCENE_KEYS.Settings);
  }

  create(): void {
    this.markActiveScene(SCENE_KEYS.Settings);
    startIntroMusic(this.app.settingsStore.getState());
    this.cameras.main.setBackgroundColor(0x020617);
    this.createHeading('Settings', '');
    this.createMenuButton(24, 30);

    const centerX = this.cameras.main.centerX;
    const camera = this.cameras.main;
    const panel = this.add.image(centerX, camera.centerY + 18, 'ui-panel');
    panel.setDisplaySize(560, 560);

    const valueStyle = {
      color: '#cbd5e1',
      fontFamily: 'monospace',
      fontSize: '20px'
    };

    this.sfxValue = this.add.text(centerX, 146, '', valueStyle).setOrigin(0.5);
    this.musicValue = this.add.text(centerX, 176, '', valueStyle).setOrigin(0.5);
    this.botValue = this.add.text(centerX, 206, '', { ...valueStyle, color: '#facc15' }).setOrigin(0.5);
    this.controlsValue = this.add.text(centerX, 236, '', { ...valueStyle, color: '#38bdf8' }).setOrigin(0.5);
    this.muteValue = this.add.text(centerX, 266, '', valueStyle).setOrigin(0.5);

    const buttonY = [316, 366, 416, 466, 516, 566, 616];
    const wideButtonWidth = 320;
    const halfButtonWidth = 150;
    const buttonHeight = 44;

    this.sfxDownButton = createTextButton(this, {
      x: centerX - 85,
      y: buttonY[0],
      width: halfButtonWidth,
      height: buttonHeight,
      label: 'SFX -',
      onClick: () => this.changeVolume('sfx', -0.1),
      onHover: () => this.setSelection(0)
    });

    this.sfxUpButton = createTextButton(this, {
      x: centerX + 85,
      y: buttonY[0],
      width: halfButtonWidth,
      height: buttonHeight,
      label: 'SFX +',
      onClick: () => this.changeVolume('sfx', 0.1),
      onHover: () => this.setSelection(0)
    });

    this.musicDownButton = createTextButton(this, {
      x: centerX - 85,
      y: buttonY[1],
      width: halfButtonWidth,
      height: buttonHeight,
      label: 'Music -',
      onClick: () => this.changeVolume('music', -0.1),
      onHover: () => this.setSelection(1)
    });

    this.musicUpButton = createTextButton(this, {
      x: centerX + 85,
      y: buttonY[1],
      width: halfButtonWidth,
      height: buttonHeight,
      label: 'Music +',
      onClick: () => this.changeVolume('music', 0.1),
      onHover: () => this.setSelection(1)
    });

    this.botButton = createTextButton(this, {
      x: centerX,
      y: buttonY[2],
      width: wideButtonWidth,
      height: buttonHeight,
      label: 'Bot Difficulty',
      onClick: () => this.cycleBotDifficulty(1),
      onHover: () => this.setSelection(2)
    });

    this.controlsButton = createTextButton(this, {
      x: centerX,
      y: buttonY[3],
      width: wideButtonWidth,
      height: buttonHeight,
      label: 'Controls Mode',
      onClick: () => this.cycleControlScheme(1),
      onHover: () => this.setSelection(3)
    });

    this.muteButton = createTextButton(this, {
      x: centerX,
      y: buttonY[4],
      width: wideButtonWidth,
      height: buttonHeight,
      label: 'Toggle mute',
      onClick: () => this.toggleMute(),
      onHover: () => this.setSelection(4)
    });

    this.resetButton = createTextButton(this, {
      x: centerX,
      y: buttonY[5],
      width: wideButtonWidth,
      height: buttonHeight,
      label: 'Reset defaults',
      onClick: () => this.resetDefaults(),
      onHover: () => this.setSelection(5)
    });

    this.backButton = createTextButton(this, {
      x: centerX,
      y: buttonY[6],
      width: wideButtonWidth,
      height: buttonHeight,
      label: 'Back to menu',
      onClick: () => this.goToMenu(),
      onHover: () => this.setSelection(6)
    });

    this.setSelection(0);

    this.input.keyboard?.on('keydown-UP', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-W', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-S', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-LEFT', () => this.handleLeft());
    this.input.keyboard?.on('keydown-RIGHT', () => this.handleRight());
    this.input.keyboard?.on('keydown-ESC', () => this.goToMenu());
    this.input.keyboard?.on('keydown-BACKSPACE', () => this.goToMenu());
    this.input.keyboard?.on('keydown-ENTER', () => this.activateSelection());
    this.input.keyboard?.on('keydown-SPACE', () => this.activateSelection());

    const syncSettingsText = (): void => {
      const settings = this.app.settingsStore.getState();
      this.sfxValue.setText(`SFX: ${Math.round(settings.sfxVolume * 100)}%`);
      this.musicValue.setText(`Music: ${Math.round(settings.musicVolume * 100)}%`);
      this.botValue.setText(`Bot Difficulty: ${settings.botDifficulty.toUpperCase()}`);
      this.controlsValue.setText(
        `Controls: ${formatControlSchemeLabel(settings.controlScheme, this.getEffectiveInputMode())}`
      );
      this.muteValue.setText(`Mute: ${settings.muted ? 'On' : 'Off'}`);
    };

    const unsubscribe = this.app.settingsStore.subscribe(() => syncSettingsText());
    this.subscribeEffectiveInputMode(() => syncSettingsText());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);

    const footerHint = this.createFooterHint('');
    const syncFooter = (mode: 'touch' | 'keyboard'): void => {
      footerHint.setText(
        mode === 'touch'
          ? 'Tap buttons to adjust settings'
          : 'Up/Down select • Left/Right adjust • Enter/Space select • Esc back'
      );
    };
    syncFooter(this.getEffectiveInputMode());
    this.subscribeEffectiveInputMode(syncFooter);
  }

  private changeVolume(kind: 'sfx' | 'music', delta: number): void {
    const current = this.app.settingsStore.getState();
    const key = kind === 'sfx' ? 'sfxVolume' : 'musicVolume';
    const nextVolume = Math.max(0, Math.min(1, current[key] + delta));

    this.app.settingsStore.patchState({ [key]: Number(nextVolume.toFixed(2)) });
    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
  }

  private cycleBotDifficulty(direction: number): void {
    const current = this.app.settingsStore.getState().botDifficulty;
    const idx = BOT_DIFFICULTIES.indexOf(current);
    const nextIdx = Phaser.Math.Wrap((idx === -1 ? 2 : idx) + direction, 0, BOT_DIFFICULTIES.length);
    this.app.settingsStore.patchState({ botDifficulty: BOT_DIFFICULTIES[nextIdx] });
    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
  }

  private cycleControlScheme(direction: number): void {
    const current = this.app.settingsStore.getState().controlScheme;
    const idx = CONTROL_SCHEMES.indexOf(current);
    const nextIdx = Phaser.Math.Wrap((idx === -1 ? 0 : idx) + direction, 0, CONTROL_SCHEMES.length);
    this.app.settingsStore.patchState({ controlScheme: CONTROL_SCHEMES[nextIdx] });
    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
  }

  private toggleMute(): void {
    const settings = this.app.settingsStore.getState();
    this.app.settingsStore.patchState({ muted: !settings.muted });
    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
  }

  private resetDefaults(): void {
    this.app.settingsStore.setState(DEFAULT_SETTINGS);
    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
  }

  private moveSelection(direction: number): void {
    const nextIndex = Phaser.Math.Wrap(this.selectedRow + direction, 0, ROW_COUNT);
    this.setSelection(nextIndex);
  }

  private setSelection(index: number): void {
    this.selectedRow = index;
    this.sfxDownButton.setSelected(index === 0);
    this.sfxUpButton.setSelected(index === 0);
    this.musicDownButton.setSelected(index === 1);
    this.musicUpButton.setSelected(index === 1);
    this.botButton.setSelected(index === 2);
    this.controlsButton.setSelected(index === 3);
    this.muteButton.setSelected(index === 4);
    this.resetButton.setSelected(index === 5);
    this.backButton.setSelected(index === 6);
  }

  private activateSelection(): void {
    if (this.selectedRow === 2) {
      this.cycleBotDifficulty(1);
      return;
    }

    if (this.selectedRow === 3) {
      this.cycleControlScheme(1);
      return;
    }

    if (this.selectedRow === 4) {
      this.toggleMute();
      return;
    }

    if (this.selectedRow === 5) {
      this.resetDefaults();
      return;
    }

    if (this.selectedRow === 6) {
      this.goToMenu();
    }
  }

  private handleLeft(): void {
    if (this.selectedRow === 0) {
      this.changeVolume('sfx', -0.1);
      return;
    }

    if (this.selectedRow === 1) {
      this.changeVolume('music', -0.1);
      return;
    }

    if (this.selectedRow === 2) {
      this.cycleBotDifficulty(-1);
      return;
    }

    if (this.selectedRow === 3) {
      this.cycleControlScheme(-1);
      return;
    }

    if (this.selectedRow === 4) {
      this.toggleMute();
    }
  }

  private handleRight(): void {
    if (this.selectedRow === 0) {
      this.changeVolume('sfx', 0.1);
      return;
    }

    if (this.selectedRow === 1) {
      this.changeVolume('music', 0.1);
      return;
    }

    if (this.selectedRow === 2) {
      this.cycleBotDifficulty(1);
      return;
    }

    if (this.selectedRow === 3) {
      this.cycleControlScheme(1);
      return;
    }

    if (this.selectedRow === 4) {
      this.toggleMute();
    }
  }
}
