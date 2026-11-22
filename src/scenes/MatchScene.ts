import * as Phaser from 'phaser';

import { formatControlSchemeLabel } from '../game/core/inputMode';
import { stopIntroMusic } from '../game/core/introMusic';
import {
  setStageMusicDucked,
  startStageMusic,
  stopStageMusic,
  updateStageMusicSettings,
  type StageMusicTheme
} from '../game/core/stageMusic';
import { getVoiceLine, playCharacterVoice, warmFighterVoices } from '../game/core/voiceAudio';
import { ensureCrossoverFighterPrepared } from '../game/crossoverRenderer';
import { Fighter, NEUTRAL_FIGHTER_INPUT, type BlockOutcome, type FighterInput } from '../game/fighter';
import { getCharacterDefinition } from '../game/hero';
import { MatchHud } from '../game/matchHud';
import { CONTROL_SCHEMES } from '../game/settings';
import { getStageDefinition } from '../game/stageConfig';
import { playSuperCutIn } from '../game/superCutIn';
import { SCENE_KEYS, type BotDifficulty, type MatchConfig } from '../game/types';
import { spawnHitSpark, spawnKoFinishVfx, type VfxColor } from '../game/vfx';
import { BaseScene } from './BaseScene';

const GROUND_FRACTION = 0.82;
const EDGE_MARGIN = 170;
const DEPTH_FRONT = 8;
const DEPTH_BACK = 5;

const SPAWN_OFFSET_FRACTION = 0.18;
const CAMERA_LERP = 0.14;

const ROUNDS_TO_WIN = 2;
const ROUND_SECONDS = 90;
const HUD_DEPTH = 100;
const BANNER_DEPTH = 200;
const OVERLAY_DEPTH = 300;

type MatchPhase = 'intro' | 'fighting' | 'roundEnd' | 'matchOver';

interface PlayerKeys {
  left: Phaser.Input.Keyboard.Key[];
  right: Phaser.Input.Keyboard.Key[];
  block: Phaser.Input.Keyboard.Key[];
  jump: Phaser.Input.Keyboard.Key[];
  light: Phaser.Input.Keyboard.Key[];
  heavy: Phaser.Input.Keyboard.Key[];
  special: Phaser.Input.Keyboard.Key[];
}

interface TouchInputState {
  left: boolean;
  right: boolean;
  block: boolean;
  jumpQueued: boolean;
  lightQueued: boolean;
  heavyQueued: boolean;
  specialQueued: boolean;
}

interface PadSpecialButton {
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

function createEmptyTouchState(): TouchInputState {
  return {
    left: false,
    right: false,
    block: false,
    jumpQueued: false,
    lightQueued: false,
    heavyQueued: false,
    specialQueued: false
  };
}

/**
 * The versus match: two fighters face off in a best-of-3 match. Supports
 * adaptive phone touch controls (both 1P arcade pad and 2P split dual pads)
 * as well as full desktop keyboard multiplayer, switching live by how it is played.
 */
export class MatchScene extends BaseScene {
  private config: MatchConfig = {
    mode: '1vcpu',
    stageId: 'storm-citadel',
    p1CharacterId: '',
    p2CharacterId: '',
    botDifficulty: 'hard'
  };

  private botDifficulty: BotDifficulty = 'hard';
  private p1!: Fighter;
  private p2!: Fighter;
  private p1Keys!: PlayerKeys;
  private p2Keys!: PlayerKeys;
  private cpu?: CpuController;

  private phase: MatchPhase = 'intro';
  private roundNumber = 1;
  private p1Wins = 0;
  private p2Wins = 0;

  private spawnX1 = 0;
  private spawnX2 = 0;

  private stageWorldWidth = 0;
  private maxScroll = 0;

  private hud!: MatchHud;
  private banner!: Phaser.GameObjects.Text;
  private roundTimeMs = ROUND_SECONDS * 1000;
  private koFreezeRemainingMs = 0;
  private paused = false;
  private overlay: Phaser.GameObjects.GameObject[] = [];
  private pauseOverlay: Phaser.GameObjects.GameObject[] = [];
  private pauseBtn?: Phaser.GameObjects.Text;
  private controlsLegendText?: Phaser.GameObjects.Text;

  private p1TouchState: TouchInputState = createEmptyTouchState();
  private p2TouchState: TouchInputState = createEmptyTouchState();
  private p1SinglePad?: Phaser.GameObjects.Container;
  private dualPad?: Phaser.GameObjects.Container;
  private resetTouchHoldVisuals: Array<() => void> = [];
  private p1SingleSpecial?: PadSpecialButton;
  private p1DualSpecial?: PadSpecialButton;
  private p2DualSpecial?: PadSpecialButton;
  private p1SingleGuardBtn?: Phaser.GameObjects.Rectangle;
  private p1DualGuardBtn?: Phaser.GameObjects.Rectangle;
  private p2DualGuardBtn?: Phaser.GameObjects.Rectangle;
  private roundToken = 0;

  constructor() {
    super(SCENE_KEYS.Match);
  }

  init(data: MatchConfig): void {
    if (data) {
      this.config = data;
    }
  }

  create(): void {
    this.botDifficulty =
      this.config.botDifficulty ?? this.app.settingsStore.getState().botDifficulty ?? 'hard';
    this.cpu = undefined;
    this.phase = 'intro';
    this.roundNumber = 1;
    this.p1Wins = 0;
    this.p2Wins = 0;
    this.paused = false;
    this.overlay = [];
    this.pauseOverlay = [];
    this.pauseBtn = undefined;
    this.controlsLegendText = undefined;
    this.koFreezeRemainingMs = 0;
    this.p1SinglePad = undefined;
    this.dualPad = undefined;
    this.resetTouchHoldVisuals = [];
    this.p1SingleSpecial = undefined;
    this.p1DualSpecial = undefined;
    this.p2DualSpecial = undefined;
    this.p1SingleGuardBtn = undefined;
    this.p1DualGuardBtn = undefined;
    this.p2DualGuardBtn = undefined;
    this.roundToken = 0;
    this.cleanupPauseSystems();
    this.p1TouchState = createEmptyTouchState();
    this.p2TouchState = createEmptyTouchState();

    this.markActiveScene(SCENE_KEYS.Match);
    this.cameras.main.setBackgroundColor(0x05070d);
    this.input.addPointer(7);

    ensureCrossoverFighterPrepared(this, this.config.p1CharacterId);
    ensureCrossoverFighterPrepared(this, this.config.p2CharacterId);
    warmFighterVoices([this.config.p1CharacterId, this.config.p2CharacterId]);

    const groundY = Math.round(this.cameras.main.height * GROUND_FRACTION);
    this.buildStage();
    this.spawnFighters(groundY);
    this.registerKeys();
    this.createControlsLegend();
    this.createTouchPads();
    this.syncControlLayout();
    this.subscribeEffectiveInputMode(() => this.syncControlLayout());

    this.hud = new MatchHud(this, {
      mode: this.config.mode,
      p1CharacterId: this.config.p1CharacterId,
      p2CharacterId: this.config.p2CharacterId,
      roundsToWin: ROUNDS_TO_WIN,
      depth: HUD_DEPTH
    });
    this.hud.slideIn();

    this.pauseBtn = this.createPauseButton(this.cameras.main.centerX, 126);

    this.banner = this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY - 40, '', {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '64px',
        stroke: '#020617',
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setDepth(BANNER_DEPTH)
      .setScrollFactor(0)
      .setAlpha(0);

    if (this.config.mode === '1vcpu') {
      this.cpu = new CpuController(this.botDifficulty);
      this.add
        .text(this.cameras.main.width - 28, 108, `CPU: ${this.botDifficulty.toUpperCase()}`, {
          color: this.botDifficulty === 'nightmare' ? '#f43f5e' : '#facc15',
          fontFamily: 'monospace',
          fontSize: '12px',
          fontStyle: 'bold',
          backgroundColor: 'rgba(2, 6, 23, 0.8)',
          padding: { x: 8, y: 3 }
        })
        .setOrigin(1, 0)
        .setDepth(HUD_DEPTH + 1)
        .setScrollFactor(0);
    }

    stopIntroMusic();
    const musicTheme = startStageMusic(this.config.stageId, this.app.settingsStore.getState());
    const unsubscribeMusicSettings = this.app.settingsStore.subscribe((settings) => {
      updateStageMusicSettings(settings);
    });
    this.showMusicToast(musicTheme);

    this.startRound();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.paused = false;
      this.cleanupPauseSystems();
      this.destroyPauseOverlay();
      unsubscribeMusicSettings();
      stopStageMusic();
      this.p1?.destroy();
      this.p2?.destroy();
      this.hud?.destroy();
    });
  }

  update(time: number, delta: number): void {
    if (this.paused) {
      return;
    }

    if (this.koFreezeRemainingMs > 0) {
      this.koFreezeRemainingMs = Math.max(0, this.koFreezeRemainingMs - delta);
      this.updateCamera(false);
      this.hud.setMeter(
        this.p1.meter01,
        this.p2.meter01,
        this.p1.cooldownRemainingSeconds,
        this.p2.cooldownRemainingSeconds
      );
      this.hud.setTime(Math.ceil(this.roundTimeMs / 1000));
      this.hud.updateWins(this.p1Wins, this.p2Wins);
      return;
    }

    const seconds = delta / 1000;
    const fighting = this.phase === 'fighting';

    const p1Input = fighting ? this.readP1Input() : { ...NEUTRAL_FIGHTER_INPUT };
    const p2Input = fighting
      ? this.cpu
        ? this.cpu.update(time, this.p2, this.p1)
        : this.readP2Input()
      : { ...NEUTRAL_FIGHTER_INPUT };

    p1Input.crouch = false;
    p2Input.crouch = false;

    this.p1.faceToward(this.p2.x);
    this.p2.faceToward(this.p1.x);

    if (fighting) {
      if (isActing(p1Input)) {
        this.p1.setDepthBase(DEPTH_FRONT);
        this.p2.setDepthBase(DEPTH_BACK);
      } else if (isActing(p2Input)) {
        this.p2.setDepthBase(DEPTH_FRONT);
        this.p1.setDepthBase(DEPTH_BACK);
      }
    }

    this.p1.update(seconds, p1Input, this.p2.x);
    this.p2.update(seconds, p2Input, this.p1.x);

    this.updateCamera(false);
    this.updateSpecialPadGlow();

    if (fighting) {
      this.resolveCombat();
      this.checkForKnockout();

      if (this.phase === 'fighting') {
        this.tickRoundTimer(delta);
        this.hud.applyHealth(this.p1.health01, this.p2.health01);
      }
    }

    this.hud.setMeter(
      this.p1.meter01,
      this.p2.meter01,
      this.p1.cooldownRemainingSeconds,
      this.p2.cooldownRemainingSeconds
    );
    this.hud.setTime(Math.ceil(this.roundTimeMs / 1000));
    this.hud.updateWins(this.p1Wins, this.p2Wins);
  }

  private resolveCombat(): void {
    this.tryHit(this.p1, this.p2);
    this.tryHit(this.p2, this.p1);
  }

  private tryHit(attacker: Fighter, defender: Fighter): void {
    if (defender.isDefeated) {
      return;
    }

    const attacks = attacker.getActiveAttacks();
    if (attacks.length === 0) {
      return;
    }

    const hurt = defender.getHurtRect();
    if (!hurt) {
      return;
    }

    const guard = defender.getGuardRect();

    for (const attack of attacks) {
      if (!Phaser.Geom.Intersects.RectangleToRectangle(attack.rect, hurt)) {
        continue;
      }

      const blocked = guard !== null && Phaser.Geom.Intersects.RectangleToRectangle(attack.rect, guard);
      const isSpecial = attack.profile.kind === 'special';
      const finisher = attack.finisher && !blocked;

      const profile = finisher
        ? { ...attack.profile, knockback: attack.profile.knockback * 1.6, hitstun: attack.profile.hitstun * 1.35 }
        : attack.profile;

      const outcome = defender.applyHit(profile, attacker.facingDirection, blocked);
      defender.flashHit(blocked, outcome);
      attacker.markAttackConnected(attack.signature);
      const countAsBlocked = outcome === 'block' || outcome === 'parry';
      attacker.registerOffense(countAsBlocked, isSpecial);
      defender.registerDefense(countAsBlocked);

      const specialColor = attacker.getSpecialSpec().vfxColor;
      this.spawnHitFx(attack.rect, hurt, blocked, isSpecial, finisher, specialColor, outcome);
    }
  }

  private spawnHitFx(
    attackRect: Phaser.Geom.Rectangle,
    hurtRect: Phaser.Geom.Rectangle,
    blocked: boolean,
    isSpecial: boolean,
    finisher: boolean,
    specialColor: VfxColor,
    outcome: BlockOutcome = blocked ? 'block' : 'hit'
  ): void {
    const sparkX = (Phaser.Geom.Rectangle.GetCenter(attackRect).x + Phaser.Geom.Rectangle.GetCenter(hurtRect).x) / 2;
    const sparkY = (Phaser.Geom.Rectangle.GetCenter(attackRect).y + Phaser.Geom.Rectangle.GetCenter(hurtRect).y) / 2;

    const color: VfxColor =
      outcome === 'parry'
        ? 'gold'
        : outcome === 'guardBreak'
          ? 'orange'
          : blocked
            ? 'blue'
            : isSpecial
              ? specialColor
              : 'red';
    const sparkScale =
      outcome === 'guardBreak'
        ? 1.55
        : outcome === 'parry'
          ? 1.35
          : finisher
            ? 1.65
            : isSpecial
              ? 1.2
              : 0.9;
    spawnHitSpark(this, sparkX, sparkY, color, sparkScale);

    if (outcome === 'guardBreak') {
      this.cameras.main.shake(210, 0.012);
    } else if (outcome === 'parry') {
      this.cameras.main.shake(70, 0.004);
    } else if (finisher) {
      this.cameras.main.shake(220, 0.012);
    } else if (isSpecial) {
      this.cameras.main.shake(blocked ? 60 : 100, blocked ? 0.003 : 0.006);
    } else {
      this.cameras.main.shake(blocked ? 60 : 110, blocked ? 0.003 : 0.006);
    }
  }

  private checkForKnockout(): void {
    if (this.p1.isDefeated) {
      this.endRound(2);
    } else if (this.p2.isDefeated) {
      this.endRound(1);
    }
  }

  private tickRoundTimer(delta: number): void {
    this.roundTimeMs = Math.max(0, this.roundTimeMs - delta);

    if (this.roundTimeMs <= 0) {
      this.resolveTimeOut();
    }
  }

  private resolveTimeOut(): void {
    const p1 = this.p1.health01;
    const p2 = this.p2.health01;

    if (p1 > p2) {
      this.endRound(1, 'TIME UP', '#facc15');
    } else if (p2 > p1) {
      this.endRound(2, 'TIME UP', '#facc15');
    } else {
      this.drawRound();
    }
  }

  private drawRound(): void {
    if (this.phase !== 'fighting') {
      return;
    }

    const token = this.roundToken;
    this.phase = 'roundEnd';
    this.showBanner('DRAW', '#e2e8f0', 1.1);
    this.time.delayedCall(1100, () => {
      if (!this.scene.isActive() || this.roundToken !== token) {
        return;
      }
      this.startRound();
    });
  }

  private buildStage(): void {
    const cam = this.cameras.main;
    const stage = getStageDefinition(this.config.stageId);
    const source = this.textures.get(stage.key).getSourceImage();
    const scale = cam.height / (source.height || stage.height);
    this.stageWorldWidth = (source.width || stage.width) * scale;
    this.maxScroll = Math.max(0, this.stageWorldWidth - cam.width);

    this.add.image(0, 0, stage.key).setOrigin(0, 0).setScale(scale).setDepth(0);
    cam.setBounds(0, 0, this.stageWorldWidth, cam.height);
  }

  private spawnFighters(groundY: number): void {
    const cam = this.cameras.main;
    const minX = EDGE_MARGIN;
    const maxX = this.stageWorldWidth - EDGE_MARGIN;
    const center = this.stageWorldWidth / 2;
    this.spawnX1 = Math.round(center - cam.width * SPAWN_OFFSET_FRACTION);
    this.spawnX2 = Math.round(center + cam.width * SPAWN_OFFSET_FRACTION);

    this.p1 = new Fighter({
      scene: this,
      app: this.app,
      characterId: this.config.p1CharacterId,
      x: this.spawnX1,
      groundY,
      facing: 1,
      minX,
      maxX,
      depth: DEPTH_FRONT,
      onSpecialStart: (fighter) => {
        playSuperCutIn(this, { characterId: fighter.characterId, side: 'left' });
        this.showVoiceCallout(fighter.x, groundY - 220, getVoiceLine(fighter.characterId, 'special'), '#38bdf8');
      },
      onSecretStart: (fighter, secretSpec) => {
        this.cameras.main.shake(260, 0.012);
        playSuperCutIn(this, {
          characterId: fighter.characterId,
          side: 'left',
          moveName: secretSpec.name,
          themeColor: secretSpec.themeColor,
          isSecret: true,
          secretTag: secretSpec.bannerTag
        });
        this.showVoiceCallout(fighter.x, groundY - 235, getVoiceLine(fighter.characterId, 'secret'), '#facc15');
      },
      onComboChange: (fighter, hits) => this.showComboPopup(fighter.x, groundY - 210, hits, '#38bdf8'),
      onGuardEvent: (fighter, kind) => {
        if (kind === 'parry') {
          this.showGuardCallout(fighter.x, groundY - 228, 'PARRY!', '#facc15');
        } else {
          this.showGuardCallout(fighter.x, groundY - 228, 'GUARD BREAK!', '#f97316');
          this.cameras.main.shake(210, 0.011);
        }
      }
    });

    this.p2 = new Fighter({
      scene: this,
      app: this.app,
      characterId: this.config.p2CharacterId,
      x: this.spawnX2,
      groundY,
      facing: -1,
      minX,
      maxX,
      depth: DEPTH_BACK,
      onSpecialStart: (fighter) => {
        playSuperCutIn(this, { characterId: fighter.characterId, side: 'right' });
        this.showVoiceCallout(fighter.x, groundY - 220, getVoiceLine(fighter.characterId, 'special'), '#f43f5e');
      },
      onSecretStart: (fighter, secretSpec) => {
        this.cameras.main.shake(260, 0.012);
        playSuperCutIn(this, {
          characterId: fighter.characterId,
          side: 'right',
          moveName: secretSpec.name,
          themeColor: secretSpec.themeColor,
          isSecret: true,
          secretTag: secretSpec.bannerTag
        });
        this.showVoiceCallout(fighter.x, groundY - 235, getVoiceLine(fighter.characterId, 'secret'), '#facc15');
      },
      onComboChange: (fighter, hits) => this.showComboPopup(fighter.x, groundY - 210, hits, '#f43f5e'),
      onGuardEvent: (fighter, kind) => {
        if (kind === 'parry') {
          this.showGuardCallout(fighter.x, groundY - 228, 'PARRY!', '#facc15');
        } else {
          this.showGuardCallout(fighter.x, groundY - 228, 'GUARD BREAK!', '#f97316');
          this.cameras.main.shake(210, 0.011);
        }
      }
    });
  }

  private showGuardCallout(x: number, y: number, text: string, color: string): void {
    const label = this.add
      .text(x, y, text, {
        color,
        fontFamily: 'monospace',
        fontSize: '24px',
        fontStyle: 'bold',
        stroke: '#020617',
        strokeThickness: 6
      })
      .setOrigin(0.5)
      .setDepth(BANNER_DEPTH - 2);

    this.tweens.add({
      targets: label,
      y: y - 38,
      alpha: 0,
      scale: 1.15,
      duration: 620,
      ease: 'Cubic.Out',
      onComplete: () => label.destroy()
    });
  }

  private showComboPopup(x: number, y: number, hits: number, color: string): void {
    const label = this.add
      .text(x, y, `${hits} HIT COMBO!`, {
        color,
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        stroke: '#020617',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(BANNER_DEPTH - 5);

    this.tweens.add({
      targets: label,
      y: y - 34,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.Out',
      onComplete: () => label.destroy()
    });
  }

  private showVoiceCallout(x: number, y: number, line: string, color: string): void {
    const badge = this.add
      .text(x, y, `"${line}"`, {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: 'rgba(2, 6, 23, 0.86)',
        padding: { x: 10, y: 4 },
        stroke: color,
        strokeThickness: 2
      })
      .setOrigin(0.5)
      .setDepth(BANNER_DEPTH + 10);

    this.tweens.add({
      targets: badge,
      y: y - 26,
      alpha: 0,
      delay: 750,
      duration: 450,
      ease: 'Cubic.Out',
      onComplete: () => badge.destroy()
    });
  }

  private updateCamera(snap: boolean): void {
    const cam = this.cameras.main;
    const viewWidth = cam.width;
    const midpoint = (this.p1.x + this.p2.x) / 2;
    const targetScroll = Phaser.Math.Clamp(midpoint - viewWidth / 2, 0, this.maxScroll);
    const scrollX = snap ? targetScroll : Phaser.Math.Linear(cam.scrollX, targetScroll, CAMERA_LERP);

    cam.setScroll(scrollX, 0);

    const leftWall = scrollX + EDGE_MARGIN;
    const rightWall = scrollX + viewWidth - EDGE_MARGIN;
    this.p1.setHorizontalBounds(leftWall, rightWall);
    this.p2.setHorizontalBounds(leftWall, rightWall);
  }

  private registerKeys(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('MatchScene requires keyboard input');
    }

    const codes = Phaser.Input.Keyboard.KeyCodes;

    if (this.config.mode === '1vcpu') {
      this.p1Keys = {
        left: [keyboard.addKey(codes.A), keyboard.addKey(codes.LEFT)],
        right: [keyboard.addKey(codes.D), keyboard.addKey(codes.RIGHT)],
        block: [
          keyboard.addKey(codes.S),
          keyboard.addKey(codes.DOWN),
          keyboard.addKey(codes.C),
          keyboard.addKey(codes.SHIFT)
        ],
        jump: [keyboard.addKey(codes.W), keyboard.addKey(codes.UP)],
        light: [keyboard.addKey(codes.SPACE), keyboard.addKey(codes.F), keyboard.addKey(codes.J)],
        heavy: [keyboard.addKey(codes.G), keyboard.addKey(codes.K)],
        special: [keyboard.addKey(codes.E), keyboard.addKey(codes.V), keyboard.addKey(codes.ENTER)]
      };

      this.p2Keys = {
        left: [],
        right: [],
        block: [],
        jump: [],
        light: [],
        heavy: [],
        special: []
      };
    } else {
      this.p1Keys = {
        left: [keyboard.addKey(codes.A)],
        right: [keyboard.addKey(codes.D)],
        block: [keyboard.addKey(codes.S), keyboard.addKey(codes.C)],
        jump: [keyboard.addKey(codes.W)],
        light: [keyboard.addKey(codes.F)],
        heavy: [keyboard.addKey(codes.G)],
        special: [keyboard.addKey(codes.E), keyboard.addKey(codes.V)]
      };

      this.p2Keys = {
        left: [keyboard.addKey(codes.LEFT)],
        right: [keyboard.addKey(codes.RIGHT)],
        block: [keyboard.addKey(codes.DOWN), keyboard.addKey(codes.FORWARD_SLASH)],
        jump: [keyboard.addKey(codes.UP)],
        light: [keyboard.addKey(codes.J), keyboard.addKey(codes.COMMA)],
        heavy: [keyboard.addKey(codes.K), keyboard.addKey(codes.PERIOD)],
        special: [keyboard.addKey(codes.L), keyboard.addKey(codes.SEMICOLON)]
      };
    }

    keyboard.on('keydown-ESC', () => {
      if (this.phase === 'matchOver') {
        this.goToMenu();
        return;
      }
      this.togglePause();
    });
    keyboard.on('keydown-P', () => {
      if (this.phase !== 'matchOver') {
        this.togglePause();
      }
    });
    keyboard.on('keydown-M', () => {
      if (this.paused) {
        this.toggleMuteFromPause();
      }
    });
    keyboard.on('keydown-BACKSPACE', () => {
      if (this.paused || this.phase === 'matchOver') {
        this.goToMenu();
      }
    });
    keyboard.on('keydown-R', () => {
      if (this.phase === 'matchOver') {
        this.rematch();
      } else if (this.paused) {
        this.restartFromPause();
      }
    });
    keyboard.on('keydown-C', () => {
      if (this.phase === 'matchOver' || this.paused) {
        this.changeFighters();
      }
    });
  }

  private readP1Input(): FighterInput {
    return this.mergeTouchInput(this.readKeys(this.p1Keys), this.p1TouchState);
  }

  private readP2Input(): FighterInput {
    return this.mergeTouchInput(this.readKeys(this.p2Keys), this.p2TouchState);
  }

  private mergeTouchInput(input: FighterInput, touch: TouchInputState): FighterInput {
    input.left = input.left || touch.left;
    input.right = input.right || touch.right;
    input.block = input.block || touch.block;
    input.jump = input.jump || touch.jumpQueued;
    input.light = input.light || touch.lightQueued;
    input.heavy = input.heavy || touch.heavyQueued;
    input.special = input.special || touch.specialQueued;

    touch.jumpQueued = false;
    touch.lightQueued = false;
    touch.heavyQueued = false;
    touch.specialQueued = false;

    return input;
  }

  private resetAllTouchStates(): void {
    this.p1TouchState = createEmptyTouchState();
    this.p2TouchState = createEmptyTouchState();
    this.resetTouchHoldVisuals.forEach((reset) => reset());
  }

  private readKeys(keys: PlayerKeys): FighterInput {
    const isAnyDown = (list: Phaser.Input.Keyboard.Key[]): boolean => list.some((k) => k.isDown);
    const isAnyJustDown = (list: Phaser.Input.Keyboard.Key[]): boolean =>
      list.some((k) => Phaser.Input.Keyboard.JustDown(k));

    return {
      left: isAnyDown(keys.left),
      right: isAnyDown(keys.right),
      crouch: false,
      block: isAnyDown(keys.block),
      jump: isAnyJustDown(keys.jump),
      light: isAnyJustDown(keys.light),
      heavy: isAnyJustDown(keys.heavy),
      special: isAnyJustDown(keys.special)
    };
  }

  private createControlsLegend(): void {
    const { centerX, height } = this.cameras.main;
    const text =
      this.config.mode === '1vcpu'
        ? 'Move: A/D or Arrows  •  Jump: W/Up  •  Tap Block = Parry / Hold = Guard  •  Attack: Space/F/G  •  Special: E/V  •  Esc/P Pause'
        : 'P1: WASD, S Guard/Parry, F/G Attack, E/V Special   •   P2: Arrows, Down Guard/Parry, J/K Attack, L Special   •   Esc/P Pause';

    this.controlsLegendText = this.add
      .text(centerX, height - 16, text, {
        color: '#cbd5f5',
        fontFamily: 'monospace',
        fontSize: '11px',
        backgroundColor: 'rgba(2, 6, 23, 0.72)',
        padding: { x: 10, y: 4 }
      })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH)
      .setScrollFactor(0);
  }

  private createTouchPads(): void {
    this.p1SinglePad = this.buildSinglePlayerPad();
    if (this.config.mode === '1v1') {
      this.dualPad = this.buildDualPlayerPad();
    }
  }

  private buildSinglePlayerPad(): Phaser.GameObjects.Container {
    const { width, height } = this.cameras.main;
    const container = this.add.container(0, 0).setDepth(HUD_DEPTH).setScrollFactor(0);
    const y = height - 66;

    this.makeHoldPadButton(container, 64, y, 84, 72, '◀', 0x1e293b, 0x38bdf8, (down) => {
      this.p1TouchState.left = down;
    });
    this.makeHoldPadButton(container, 158, y, 84, 72, '▶', 0x1e293b, 0x38bdf8, (down) => {
      this.p1TouchState.right = down;
    });
    this.makeTapPadButton(container, 258, y, 92, 72, 'JUMP', 0x1e293b, 0x38bdf8, () => {
      this.p1TouchState.jumpQueued = true;
    });

    this.p1SingleGuardBtn = this.makeHoldPadButton(
      container,
      width - 388,
      y,
      94,
      72,
      'GUARD',
      0x1e3a8a,
      0x38bdf8,
      (down) => {
        this.p1TouchState.block = down;
      }
    );
    this.makeTapPadButton(container, width - 284, y, 90, 72, 'PUNCH', 0x7f1d1d, 0xf87171, () => {
      this.p1TouchState.lightQueued = true;
    });
    this.makeTapPadButton(container, width - 184, y, 86, 72, 'KICK', 0x9a3412, 0xfb923c, () => {
      this.p1TouchState.heavyQueued = true;
    });

    this.p1SingleSpecial = this.makeTapPadButton(
      container,
      width - 74,
      y,
      110,
      72,
      'SPECIAL',
      0x334155,
      0x64748b,
      () => {
        this.p1TouchState.specialQueued = true;
      }
    );

    return container;
  }

  private buildDualPlayerPad(): Phaser.GameObjects.Container {
    const { centerX, height } = this.cameras.main;
    const container = this.add.container(0, 0).setDepth(HUD_DEPTH).setScrollFactor(0);
    const y = height - 66;

    // Subtle center dead-zone divider between P1 (left half) and P2 (right half)
    const divider = this.add.rectangle(centerX, y, 2, 76, 0x475569, 0.7);
    const splitLabel = this.add
      .text(centerX, y - 50, 'P1  |  P2', {
        color: '#94a3b8',
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        backgroundColor: 'rgba(2, 6, 23, 0.8)',
        padding: { x: 8, y: 2 }
      })
      .setOrigin(0.5);
    container.add([divider, splitLabel]);

    // P1 Half (left: x = 19..593, cyan accent)
    this.makeHoldPadButton(container, 54, y, 70, 74, '◀', 0x0f172a, 0x38bdf8, (down) => {
      this.p1TouchState.left = down;
    });
    this.makeHoldPadButton(container, 132, y, 70, 74, '▶', 0x0f172a, 0x38bdf8, (down) => {
      this.p1TouchState.right = down;
    });
    this.makeTapPadButton(container, 210, y, 70, 74, 'JMP', 0x0f172a, 0x38bdf8, () => {
      this.p1TouchState.jumpQueued = true;
    });
    this.p1DualGuardBtn = this.makeHoldPadButton(
      container,
      302,
      y,
      74,
      74,
      'GRD',
      0x1e3a8a,
      0x38bdf8,
      (down) => {
        this.p1TouchState.block = down;
      }
    );
    this.makeTapPadButton(container, 384, y, 74, 74, 'PNC', 0x7f1d1d, 0x38bdf8, () => {
      this.p1TouchState.lightQueued = true;
    });
    this.makeTapPadButton(container, 466, y, 74, 74, 'KCK', 0x9a3412, 0x38bdf8, () => {
      this.p1TouchState.heavyQueued = true;
    });
    this.p1DualSpecial = this.makeTapPadButton(
      container,
      552,
      y,
      82,
      74,
      'SPL',
      0x334155,
      0x38bdf8,
      () => {
        this.p1TouchState.specialQueued = true;
      }
    );

    // P2 Half (right: x = 693..1267, rose accent)
    this.makeHoldPadButton(container, 728, y, 70, 74, '◀', 0x0f172a, 0xf43f5e, (down) => {
      this.p2TouchState.left = down;
    });
    this.makeHoldPadButton(container, 806, y, 70, 74, '▶', 0x0f172a, 0xf43f5e, (down) => {
      this.p2TouchState.right = down;
    });
    this.makeTapPadButton(container, 884, y, 70, 74, 'JMP', 0x0f172a, 0xf43f5e, () => {
      this.p2TouchState.jumpQueued = true;
    });
    this.p2DualGuardBtn = this.makeHoldPadButton(
      container,
      976,
      y,
      74,
      74,
      'GRD',
      0x1e3a8a,
      0xf43f5e,
      (down) => {
        this.p2TouchState.block = down;
      }
    );
    this.makeTapPadButton(container, 1058, y, 74, 74, 'PNC', 0x7f1d1d, 0xf43f5e, () => {
      this.p2TouchState.lightQueued = true;
    });
    this.makeTapPadButton(container, 1140, y, 74, 74, 'KCK', 0x9a3412, 0xf43f5e, () => {
      this.p2TouchState.heavyQueued = true;
    });
    this.p2DualSpecial = this.makeTapPadButton(
      container,
      1226,
      y,
      82,
      74,
      'SPL',
      0x334155,
      0xf43f5e,
      () => {
        this.p2TouchState.specialQueued = true;
      }
    );

    return container;
  }

  private syncControlLayout(): void {
    const mode = this.getEffectiveInputMode();
    const isTouch = mode === 'touch';
    const overlayBlocking = this.paused || this.phase === 'matchOver';

    if (isTouch && !overlayBlocking) {
      this.controlsLegendText?.setVisible(false);
      if (this.config.mode === '1v1') {
        this.p1SinglePad?.setVisible(false);
        this.dualPad?.setVisible(true);
      } else {
        this.dualPad?.setVisible(false);
        this.p1SinglePad?.setVisible(true);
      }
    } else {
      this.p1SinglePad?.setVisible(false);
      this.dualPad?.setVisible(false);
      this.controlsLegendText?.setVisible(!isTouch);
      this.resetAllTouchStates();
    }

    if (this.paused) {
      this.syncPauseOverlayLabels();
    }
  }

  private makeHoldPadButton(
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    w: number,
    h: number,
    caption: string,
    fill: number,
    strokeColor: number,
    onToggle: (down: boolean) => void
  ): Phaser.GameObjects.Rectangle {
    const rect = this.add
      .rectangle(x, y, w, h, fill, 0.72)
      .setStrokeStyle(2, strokeColor, 0.9)
      .setInteractive({ useHandCursor: true });

    const label = this.add
      .text(x, y, caption, {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    parent.add([rect, label]);

    const activePointers = new Set<number>();
    const syncState = (): void => {
      const down = activePointers.size > 0;
      rect.setFillStyle(down ? strokeColor : fill, down ? 0.92 : 0.72);
      label.setColor(down ? '#020617' : '#f8fafc');
      onToggle(down);
    };

    this.resetTouchHoldVisuals.push(() => {
      if (activePointers.size > 0) {
        activePointers.clear();
        syncState();
      }
    });

    rect.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      activePointers.add(pointer.id);
      syncState();
    });
    const release = (pointer: Phaser.Input.Pointer): void => {
      if (activePointers.delete(pointer.id)) {
        syncState();
      }
    };
    rect.on('pointerup', release);
    rect.on('pointerupoutside', release);
    rect.on('pointercancel', release);
    rect.on('pointerout', release);

    return rect;
  }

  private makeTapPadButton(
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    w: number,
    h: number,
    caption: string,
    fill: number,
    strokeColor: number,
    onTap: () => void
  ): PadSpecialButton {
    const rect = this.add
      .rectangle(x, y, w, h, fill, 0.78)
      .setStrokeStyle(2, strokeColor, 0.9)
      .setInteractive({ useHandCursor: true });

    const label = this.add
      .text(x, y, caption, {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    parent.add([rect, label]);

    rect.on('pointerdown', () => {
      rect.setScale(0.94);
      onTap();
    });
    const resetScale = (): void => {
      rect.setScale(1);
    };
    rect.on('pointerup', resetScale);
    rect.on('pointerupoutside', resetScale);
    rect.on('pointercancel', resetScale);
    rect.on('pointerout', resetScale);

    return { rect, label };
  }

  private updateSpecialPadGlow(): void {
    this.syncFighterPadVisuals(
      this.p1,
      this.p1SingleSpecial,
      this.p1SingleGuardBtn,
      'SPECIAL',
      0x38bdf8
    );
    this.syncFighterPadVisuals(this.p1, this.p1DualSpecial, this.p1DualGuardBtn, 'SPL', 0x38bdf8);
    this.syncFighterPadVisuals(this.p2, this.p2DualSpecial, this.p2DualGuardBtn, 'SPL', 0xf43f5e);
  }

  private syncFighterPadVisuals(
    fighter: Fighter,
    specialBtn: PadSpecialButton | undefined,
    guardBtn: Phaser.GameObjects.Rectangle | undefined,
    readyCaption: string,
    baseGuardStroke: number
  ): void {
    if (guardBtn) {
      const guard = fighter.guard01;
      const guardStroke = guard <= 0.25 ? 0xf43f5e : guard <= 0.55 ? 0xf59e0b : baseGuardStroke;
      guardBtn.setStrokeStyle(2, guardStroke, 0.95);
    }

    if (!specialBtn) {
      return;
    }

    const cd = fighter.cooldownRemainingSeconds;
    const ready = this.phase === 'fighting' && (fighter.isMeterReady || fighter.isSecretReady);
    if (ready) {
      const secretGlow = fighter.isSecretReady;
      specialBtn.rect
        .setFillStyle(secretGlow ? 0xf97316 : 0xeab308, 0.95)
        .setStrokeStyle(2, 0xfef08a, 1);
      specialBtn.label.setText(secretGlow ? 'SECRET!' : readyCaption).setColor('#020617');
    } else if (cd > 0.05) {
      specialBtn.rect.setFillStyle(0x78350f, 0.78).setStrokeStyle(2, 0xf59e0b, 0.9);
      specialBtn.label.setText(`${cd.toFixed(1)}s`).setColor('#fde68a');
    } else {
      specialBtn.rect.setFillStyle(0x334155, 0.55).setStrokeStyle(2, 0x64748b, 0.7);
      specialBtn.label.setText(readyCaption).setColor('#94a3b8');
    }
  }

  private startRound(): void {
    this.roundToken += 1;
    const token = this.roundToken;
    this.phase = 'intro';
    this.roundTimeMs = ROUND_SECONDS * 1000;
    this.koFreezeRemainingMs = 0;
    this.cameras.main.setZoom(1);
    this.syncControlLayout();

    const fullMin = EDGE_MARGIN;
    const fullMax = this.stageWorldWidth - EDGE_MARGIN;
    this.p1.setHorizontalBounds(fullMin, fullMax);
    this.p2.setHorizontalBounds(fullMin, fullMax);

    this.p1.resetForRound(this.spawnX1, 1);
    this.p2.resetForRound(this.spawnX2, -1);
    this.p1.setDepthBase(DEPTH_FRONT);
    this.p2.setDepthBase(DEPTH_BACK);
    this.updateCamera(true);
    this.hud.animateFill();
    this.hud.updateWins(this.p1Wins, this.p2Wins);

    this.showBanner(`ROUND ${this.roundNumber}`, '#f8fafc');

    this.time.delayedCall(900, () => {
      if (!this.scene.isActive() || this.roundToken !== token || this.phase !== 'intro') {
        return;
      }

      this.showBanner('FIGHT!', '#facc15', 1.15);
      this.phase = 'fighting';
      this.p1.setFrozen(false);
      this.p2.setFrozen(false);

      this.time.delayedCall(650, () => {
        if (this.scene.isActive() && this.roundToken === token) {
          this.hideBanner();
        }
      });
    });
  }

  private endRound(winner: 1 | 2, bannerText = 'K.O.', bannerColor = '#f43f5e'): void {
    if (this.phase !== 'fighting') {
      return;
    }

    const token = this.roundToken;
    this.phase = 'roundEnd';
    this.hud.applyHealth(this.p1.health01, this.p2.health01);

    if (winner === 1) {
      this.p1Wins += 1;
    } else {
      this.p2Wins += 1;
    }

    const winnerId = winner === 1 ? this.config.p1CharacterId : this.config.p2CharacterId;
    const winnerName =
      winner === 1
        ? `P1 ${getCharacterDefinition(this.config.p1CharacterId).label}`
        : `${this.config.mode === '1vcpu' ? 'CPU' : 'P2'} ${getCharacterDefinition(this.config.p2CharacterId).label}`;

    const isKo = bannerText === 'K.O.';
    if (isKo) {
      const loser = winner === 1 ? this.p2 : this.p1;
      const groundY = Math.round(this.cameras.main.height * GROUND_FRACTION);
      this.koFreezeRemainingMs = 240;

      spawnKoFinishVfx(this, loser.x, groundY, 0xf43f5e);
      const cam = this.cameras.main;
      cam.shake(380, 0.018);
      cam.zoomTo(1.14, 150, Phaser.Math.Easing.Cubic.Out, true);
      this.time.delayedCall(650, () => {
        if (!this.scene.isActive() || this.roundToken !== token) {
          return;
        }
        cam.zoomTo(1, 420, Phaser.Math.Easing.Cubic.Out, true);
      });

      this.showKoSlamBanner('K.O.!!');
    } else {
      this.showBanner(bannerText, bannerColor, 1.2);
    }

    let koLine = getVoiceLine(winnerId, 'ko');
    try {
      koLine = playCharacterVoice(winnerId, 'ko', this.app.settingsStore.getState());
    } catch {
      // Keep fallback voice line if audio context is unavailable
    }
    this.showVoiceCallout(this.cameras.main.centerX, this.cameras.main.centerY + 62, koLine, bannerColor);

    this.time.delayedCall(isKo ? 1650 : 1100, () => {
      if (!this.scene.isActive() || this.roundToken !== token) {
        return;
      }
      const matchOver = this.p1Wins >= ROUNDS_TO_WIN || this.p2Wins >= ROUNDS_TO_WIN;

      if (matchOver) {
        this.endMatch(winnerName);
      } else {
        this.roundNumber += 1;
        this.startRound();
      }
    });
  }

  private endMatch(winnerName: string): void {
    this.phase = 'matchOver';
    this.hideBanner();
    this.syncControlLayout();

    const { centerX, centerY, width, height } = this.cameras.main;

    const dim = this.add
      .rectangle(centerX, centerY, width, height, 0x020617, 0.68)
      .setDepth(OVERLAY_DEPTH)
      .setScrollFactor(0)
      .setInteractive();

    const title = this.add
      .text(centerX, centerY - 104, `${winnerName}  WINS!`, {
        color: '#facc15',
        fontFamily: 'monospace',
        fontSize: '46px',
        stroke: '#020617',
        strokeThickness: 6,
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(OVERLAY_DEPTH)
      .setScrollFactor(0);

    const score = this.add
      .text(centerX, centerY - 46, `${this.p1Wins} - ${this.p2Wins}`, {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '28px'
      })
      .setOrigin(0.5)
      .setDepth(OVERLAY_DEPTH)
      .setScrollFactor(0);

    const isTouch = this.getEffectiveInputMode() === 'touch';
    const rematch = this.makeOverlayButton(
      centerX,
      centerY + 24,
      isTouch ? 'Rematch' : 'Rematch  (R)',
      () => this.rematch()
    );
    const changeFighter = this.makeOverlayButton(
      centerX,
      centerY + 84,
      isTouch ? 'Change Fighter' : 'Change Fighter  (C)',
      () => this.changeFighters()
    );
    const menu = this.makeOverlayButton(
      centerX,
      centerY + 144,
      isTouch ? 'Main Menu' : 'Main Menu  (Esc)',
      () => this.goToMenu()
    );

    this.overlay = [dim, title, score, rematch, changeFighter, menu];
  }

  private makeOverlayButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '22px',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        padding: { x: 24, y: 12 },
        stroke: '#334155',
        strokeThickness: 2
      })
      .setOrigin(0.5)
      .setDepth(OVERLAY_DEPTH)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setColor('#facc15'));
    button.on('pointerout', () => button.setColor('#e2e8f0'));
    button.on('pointerdown', onClick);

    return button;
  }

  private createPauseButton(x: number, y: number): Phaser.GameObjects.Text {
    const btn = this.add
      .text(x, y, '⏸ PAUSE', {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        padding: { x: 18, y: 12 },
        stroke: '#334155',
        strokeThickness: 2
      })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH + 5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#facc15'));
    btn.on('pointerout', () => btn.setColor('#e2e8f0'));
    btn.on('pointerdown', () => this.togglePause());
    return btn;
  }

  private togglePause(): void {
    if (this.phase === 'matchOver') {
      return;
    }
    if (this.paused) {
      this.resumeMatch();
    } else {
      this.pauseMatch();
    }
  }

  private pauseMatch(): void {
    if (this.paused || this.phase === 'matchOver') {
      return;
    }

    this.paused = true;
    this.syncControlLayout();

    this.time.paused = true;
    this.tweens.pauseAll();
    this.anims.pauseAll();
    setStageMusicDucked(true);
    this.pauseBtn?.setText('▶ RESUME');

    this.buildPauseOverlay();
  }

  private resumeMatch(): void {
    if (!this.paused) {
      return;
    }

    this.paused = false;
    this.destroyPauseOverlay();
    this.cleanupPauseSystems();
    this.pauseBtn?.setText('⏸ PAUSE');
    this.syncControlLayout();
  }

  private cleanupPauseSystems(): void {
    this.time.paused = false;
    this.tweens.resumeAll();
    this.anims.resumeAll();
    setStageMusicDucked(false);
  }

  private destroyPauseOverlay(): void {
    this.pauseOverlay.forEach((object) => object.destroy());
    this.pauseOverlay = [];
  }

  private buildPauseOverlay(): void {
    this.destroyPauseOverlay();
    const { centerX, centerY, width, height } = this.cameras.main;
    const depth = OVERLAY_DEPTH + 20;
    const stageLabel = getStageDefinition(this.config.stageId).label.toUpperCase();

    const dim = this.add
      .rectangle(centerX, centerY, width, height, 0x020617, 0.74)
      .setDepth(depth)
      .setScrollFactor(0)
      .setInteractive();

    const panel = this.add
      .rectangle(centerX, centerY, 446, 504, 0x0f172a, 0.96)
      .setStrokeStyle(2, 0x334155, 1)
      .setDepth(depth + 1)
      .setScrollFactor(0);

    const title = this.add
      .text(centerX, centerY - 202, 'PAUSED', {
        color: '#facc15',
        fontFamily: 'monospace',
        fontSize: '38px',
        fontStyle: 'bold',
        stroke: '#020617',
        strokeThickness: 6
      })
      .setOrigin(0.5)
      .setDepth(depth + 2)
      .setScrollFactor(0);

    const subtitle = this.add
      .text(centerX, centerY - 162, `${stageLabel}  ·  ROUND ${this.roundNumber}`, {
        color: '#94a3b8',
        fontFamily: 'monospace',
        fontSize: '14px'
      })
      .setOrigin(0.5)
      .setDepth(depth + 2)
      .setScrollFactor(0);

    const isTouch = this.getEffectiveInputMode() === 'touch';

    const resumeBtn = this.makePauseButton(
      centerX,
      centerY - 104,
      isTouch ? 'Resume Match' : 'Resume Match  (Esc / P)',
      depth + 2,
      true,
      () => this.resumeMatch()
    );
    resumeBtn.setData('pauseBtnKind', 'resume');

    const controlsBtn = this.makePauseButton(
      centerX,
      centerY - 48,
      this.getPauseControlsLabel(),
      depth + 2,
      false,
      () => this.cycleControlsFromPause()
    );
    controlsBtn.setData('pauseBtnKind', 'controls');

    const soundBtn = this.makePauseButton(
      centerX,
      centerY + 8,
      this.getPauseSoundLabel(),
      depth + 2,
      false,
      () => this.toggleMuteFromPause()
    );
    soundBtn.setData('pauseBtnKind', 'sound');

    const restartBtn = this.makePauseButton(
      centerX,
      centerY + 64,
      isTouch ? 'Restart Match' : 'Restart Match  (R)',
      depth + 2,
      false,
      () => this.restartFromPause()
    );
    restartBtn.setData('pauseBtnKind', 'restart');

    const fighterBtn = this.makePauseButton(
      centerX,
      centerY + 120,
      isTouch ? 'Change Fighter' : 'Change Fighter  (C)',
      depth + 2,
      false,
      () => this.changeFighters()
    );
    fighterBtn.setData('pauseBtnKind', 'fighter');

    const menuBtn = this.makePauseButton(
      centerX,
      centerY + 176,
      'Main Menu',
      depth + 2,
      false,
      () => this.goToMenu()
    );

    this.pauseOverlay = [
      dim,
      panel,
      title,
      subtitle,
      resumeBtn.bg,
      resumeBtn.label,
      controlsBtn.bg,
      controlsBtn.label,
      soundBtn.bg,
      soundBtn.label,
      restartBtn.bg,
      restartBtn.label,
      fighterBtn.bg,
      fighterBtn.label,
      menuBtn.bg,
      menuBtn.label
    ];
  }

  private syncPauseOverlayLabels(): void {
    const isTouch = this.getEffectiveInputMode() === 'touch';
    for (const item of this.pauseOverlay) {
      if (!(item instanceof Phaser.GameObjects.Rectangle)) {
        continue;
      }
      const kind = item.getData('pauseBtnKind') as string | undefined;
      const label = item.getData('labelRef') as Phaser.GameObjects.Text | undefined;
      if (!kind || !label) {
        continue;
      }
      if (kind === 'resume') {
        label.setText(isTouch ? 'Resume Match' : 'Resume Match  (Esc / P)');
      } else if (kind === 'controls') {
        label.setText(this.getPauseControlsLabel());
      } else if (kind === 'sound') {
        label.setText(this.getPauseSoundLabel());
      } else if (kind === 'restart') {
        label.setText(isTouch ? 'Restart Match' : 'Restart Match  (R)');
      } else if (kind === 'fighter') {
        label.setText(isTouch ? 'Change Fighter' : 'Change Fighter  (C)');
      }
    }
  }

  private getPauseControlsLabel(): string {
    const scheme = this.app.settingsStore.getState().controlScheme;
    return `Controls: ${formatControlSchemeLabel(scheme, this.getEffectiveInputMode())}`;
  }

  private cycleControlsFromPause(): void {
    const current = this.app.settingsStore.getState().controlScheme;
    const idx = CONTROL_SCHEMES.indexOf(current);
    const next = CONTROL_SCHEMES[(idx + 1) % CONTROL_SCHEMES.length];
    this.app.settingsStore.patchState({ controlScheme: next });
    this.syncPauseOverlayLabels();
  }

  private getPauseSoundLabel(): string {
    const isTouch = this.getEffectiveInputMode() === 'touch';
    const muted = this.app.settingsStore.getState().muted;
    if (isTouch) {
      return muted ? 'Sound: MUTED' : 'Sound: ON';
    }
    return muted ? 'Sound: MUTED  (M)' : 'Sound: ON  (M)';
  }

  private toggleMuteFromPause(): void {
    const current = this.app.settingsStore.getState();
    this.app.settingsStore.patchState({ muted: !current.muted });
    this.syncPauseOverlayLabels();
  }

  private makePauseButton(
    x: number,
    y: number,
    caption: string,
    depth: number,
    primary: boolean,
    onClick: () => void
  ): { bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text; setData: (k: string, v: unknown) => void } {
    const baseFill = primary ? 0x1e293b : 0x0f172a;
    const baseStroke = primary ? 0xfacc15 : 0x334155;
    const baseText = primary ? '#facc15' : '#e2e8f0';

    const bg = this.add
      .rectangle(x, y, 356, 48, baseFill, 0.96)
      .setStrokeStyle(2, baseStroke, 1)
      .setDepth(depth)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const label = this.add
      .text(x, y, caption, {
        color: baseText,
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: primary ? 'bold' : 'normal'
      })
      .setOrigin(0.5)
      .setDepth(depth + 1)
      .setScrollFactor(0);

    bg.setData('labelRef', label);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x1e293b, 1).setStrokeStyle(2, 0xfacc15, 1);
      label.setColor('#facc15');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(baseFill, 0.96).setStrokeStyle(2, baseStroke, 1);
      label.setColor(baseText);
    });
    bg.on('pointerdown', onClick);

    return {
      bg,
      label,
      setData: (k: string, v: unknown) => bg.setData(k, v)
    };
  }

  private restartFromPause(): void {
    this.resumeMatch();
    this.rematch();
  }

  private rematch(): void {
    this.overlay.forEach((object) => object.destroy());
    this.overlay = [];
    this.roundNumber = 1;
    this.p1Wins = 0;
    this.p2Wins = 0;
    this.cpu = this.config.mode === '1vcpu' ? new CpuController(this.botDifficulty) : undefined;
    this.startRound();
  }

  private changeFighters(): void {
    this.paused = false;
    this.destroyPauseOverlay();
    this.cleanupPauseSystems();
    stopStageMusic();
    this.scene.start(SCENE_KEYS.CharacterSelect, {
      mode: this.config.mode,
      stageId: this.config.stageId,
      botDifficulty: this.botDifficulty
    });
  }

  protected override goToMenu(): void {
    this.paused = false;
    this.destroyPauseOverlay();
    this.cleanupPauseSystems();
    stopStageMusic();
    super.goToMenu();
  }

  private showMusicToast(theme: StageMusicTheme): void {
    const { centerX } = this.cameras.main;
    const toast = this.add
      .text(centerX, 158, `♪ ${theme.title}  •  ${theme.genre}`, {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        backgroundColor: 'rgba(2, 6, 23, 0.84)',
        padding: { x: 12, y: 5 },
        stroke: theme.accentColor,
        strokeThickness: 2
      })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH + 2)
      .setScrollFactor(0)
      .setAlpha(0);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      duration: 280,
      onComplete: () => {
        this.tweens.add({
          targets: toast,
          alpha: 0,
          delay: 2600,
          duration: 500,
          onComplete: () => toast.destroy()
        });
      }
    });
  }

  private showBanner(text: string, color: string, peakScale = 1): void {
    this.banner.setStroke('#020617', 8).setText(text).setColor(color).setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: this.banner, alpha: 1, scale: peakScale, duration: 260, ease: 'Back.Out' });
  }

  private showKoSlamBanner(text: string): void {
    this.banner.setText(text).setColor('#facc15').setStroke('#9f1239', 12).setScale(2.4).setAlpha(0);
    this.tweens.add({
      targets: this.banner,
      alpha: 1,
      scale: 1.35,
      duration: 210,
      ease: 'Back.Out'
    });
  }

  private hideBanner(): void {
    this.tweens.add({ targets: this.banner, alpha: 0, duration: 300 });
  }
}

function isActing(input: FighterInput): boolean {
  return input.left || input.right || input.jump || input.light || input.heavy || input.special;
}

interface CpuTuning {
  minThinkMs: number;
  maxThinkMs: number;
  blockRate: number;
  comboRate: number;
  specialRate: number;
  antiAirRate: number;
  aggressionRate: number;
}

const CPU_TUNING_BY_DIFFICULTY: Record<BotDifficulty, CpuTuning> = {
  easy: {
    minThinkMs: 360,
    maxThinkMs: 680,
    blockRate: 0.18,
    comboRate: 0.30,
    specialRate: 0.35,
    antiAirRate: 0.10,
    aggressionRate: 0.55
  },
  normal: {
    minThinkMs: 185,
    maxThinkMs: 340,
    blockRate: 0.48,
    comboRate: 0.62,
    specialRate: 0.60,
    antiAirRate: 0.35,
    aggressionRate: 0.78
  },
  hard: {
    minThinkMs: 85,
    maxThinkMs: 165,
    blockRate: 0.78,
    comboRate: 0.86,
    specialRate: 0.84,
    antiAirRate: 0.68,
    aggressionRate: 0.90
  },
  nightmare: {
    minThinkMs: 42,
    maxThinkMs: 92,
    blockRate: 0.94,
    comboRate: 0.96,
    specialRate: 0.95,
    antiAirRate: 0.88,
    aggressionRate: 0.97
  }
};

/**
 * Reactive, difficulty-scaled CPU combat AI: blocks incoming attacks and
 * projectiles, anti-airs jump-ins, closes distance aggressively, chains combos,
 * and cashes out meter/secrets reliably at Hard & Nightmare tiers.
 */
class CpuController {
  private nextDecisionAt = 0;
  private holdUntil = 0;
  private moveDir = 0;
  private holdBlock = false;
  private queuedSecondHitAt = 0;
  private queuedThirdHitAt = 0;
  private queuedSpecialAt = 0;

  constructor(private readonly difficulty: BotDifficulty) {}

  update(timeMs: number, cpu: Fighter, target: Fighter): FighterInput {
    const tuning = CPU_TUNING_BY_DIFFICULTY[this.difficulty] ?? CPU_TUNING_BY_DIFFICULTY.hard;
    const input: FighterInput = { ...NEUTRAL_FIGHTER_INPUT };
    const dist = Math.abs(target.x - cpu.x);
    const dirToward = target.x >= cpu.x ? 1 : -1;
    const specialReady = cpu.isMeterReady || cpu.isSecretReady;
    const effectiveRange = Math.max(220, cpu.getSpecialSpec().range * 0.92);

    // Execute queued combo chain steps
    if (this.queuedSecondHitAt > 0 && timeMs >= this.queuedSecondHitAt) {
      this.queuedSecondHitAt = 0;
      input.light = true;
    }
    if (this.queuedThirdHitAt > 0 && timeMs >= this.queuedThirdHitAt) {
      this.queuedThirdHitAt = 0;
      input.heavy = true;
    }
    if (this.queuedSpecialAt > 0 && timeMs >= this.queuedSpecialAt) {
      this.queuedSpecialAt = 0;
      if (specialReady && dist <= effectiveRange + 30) {
        input.special = true;
      }
    }

    // Immediate reactive defense when player is swinging or throwing energy in range
    if (timeMs >= this.nextDecisionAt || (target.isAttacking && dist < 210 && !this.holdBlock)) {
      this.decide(timeMs, dist, dirToward, target, specialReady, effectiveRange, tuning, input);
      this.nextDecisionAt = timeMs + Phaser.Math.Between(tuning.minThinkMs, tuning.maxThinkMs);
    }

    if (timeMs < this.holdUntil) {
      if (this.moveDir < 0) {
        input.left = true;
      } else if (this.moveDir > 0) {
        input.right = true;
      }
      input.block = input.block || this.holdBlock;
    } else {
      this.moveDir = 0;
      this.holdBlock = false;
    }

    return input;
  }

  private decide(
    timeMs: number,
    dist: number,
    dirToward: number,
    target: Fighter,
    specialReady: boolean,
    effectiveRange: number,
    tuning: CpuTuning,
    input: FighterInput
  ): void {
    // 1. Reactive Guard / Jump-In Counter against player offense
    if (target.isAttacking) {
      if (dist <= 205 && Math.random() < tuning.blockRate) {
        this.holdBlock = true;
        this.moveDir = 0;
        this.holdUntil = timeMs + Phaser.Math.Between(160, 290);
        return;
      }
      if (dist > 205 && dist < 390 && Math.random() < tuning.aggressionRate * 0.45) {
        input.jump = true;
        this.moveDir = dirToward;
        this.holdUntil = timeMs + 320;
        return;
      }
    }

    // 2. Anti-air intercept if player leaps in close
    if (target.isAirborne && dist < 175 && Math.random() < tuning.antiAirRate) {
      input.heavy = true;
      return;
    }

    // 3. Fire Special / Hidden Secret Art whenever in range and off cooldown
    if (specialReady && dist <= effectiveRange && Math.random() < tuning.specialRate) {
      input.special = true;
      return;
    }

    // 4. Aggressive gap-closing outside melee range
    if (dist > 142) {
      this.holdBlock = false;
      this.moveDir = Math.random() < tuning.aggressionRate ? dirToward : -dirToward;
      this.holdUntil = timeMs + Phaser.Math.Between(120, 260);
      if (dist > 260 && Math.random() < 0.22) {
        input.jump = true;
      }
      return;
    }

    // 5. Close-range pressure & multi-hit combos
    this.holdBlock = false;
    const roll = Math.random();

    if (target.isBlocking && roll < 0.42) {
      // Mix up pressure with heavy kick or jump-in crossup against turtle guards
      if (Math.random() < 0.6) {
        input.heavy = true;
      } else {
        input.jump = true;
        this.moveDir = dirToward;
        this.holdUntil = timeMs + 260;
      }
      return;
    }

    if (roll < 0.56) {
      input.light = true;
      if (Math.random() < tuning.comboRate) {
        this.queuedSecondHitAt = timeMs + 105;
        if (Math.random() < tuning.comboRate * 0.72) {
          this.queuedThirdHitAt = timeMs + 225;
        }
        if (specialReady && Math.random() < tuning.specialRate) {
          this.queuedSpecialAt = timeMs + 320;
        }
      }
      this.moveDir = dirToward;
      this.holdUntil = timeMs + 120;
      return;
    }

    if (roll < 0.78) {
      input.heavy = true;
      if (specialReady && Math.random() < tuning.specialRate) {
        this.queuedSpecialAt = timeMs + 190;
      }
      return;
    }

    if (roll < 0.90) {
      this.holdBlock = true;
      this.holdUntil = timeMs + Phaser.Math.Between(160, 300);
      return;
    }

    // Micro step back to bait whiff and re-engage
    this.moveDir = -dirToward;
    this.holdUntil = timeMs + 130;
  }
}
