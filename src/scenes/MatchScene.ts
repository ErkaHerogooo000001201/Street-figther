import * as Phaser from 'phaser';

import {
  startStageMusic,
  stopStageMusic,
  updateStageMusicSettings,
  type StageMusicTheme
} from '../game/core/stageMusic';
import { getVoiceLine, playCharacterVoice, warmFighterVoices } from '../game/core/voiceAudio';
import { ensureCrossoverFighterPrepared } from '../game/crossoverRenderer';
import { Fighter, NEUTRAL_FIGHTER_INPUT, type FighterInput } from '../game/fighter';
import { getCharacterDefinition } from '../game/hero';
import { MatchHud } from '../game/matchHud';
import { getStageDefinition } from '../game/stageConfig';
import { playSuperCutIn } from '../game/superCutIn';
import { SCENE_KEYS, type BotDifficulty, type MatchConfig } from '../game/types';
import { spawnHitSpark, type VfxColor } from '../game/vfx';
import { BaseScene } from './BaseScene';

const GROUND_FRACTION = 0.82;
const EDGE_MARGIN = 170;
const DEPTH_FRONT = 8;
const DEPTH_BACK = 5;

const SPAWN_OFFSET_FRACTION = 0.18;
const CAMERA_LERP = 0.14;

const ROUNDS_TO_WIN = 2;
const ROUND_SECONDS = 60;
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
  specialQueued: boolean;
}

interface SpectatorActor {
  container: Phaser.GameObjects.Container;
  baseY: number;
  leftArm: Phaser.GameObjects.Rectangle;
  rightArm: Phaser.GameObjects.Rectangle;
  idleTween?: Phaser.Tweens.Tween;
  exciteUntil: number;
}

/**
 * The versus match: two fighters face off in a best-of-3 match. Supports
 * difficulty-scaled 1vCPU controls, full 1v1 local multiplayer, and live Earth
 * stage spectators reacting to combat.
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
  private overlay: Phaser.GameObjects.GameObject[] = [];
  private spectators: SpectatorActor[] = [];

  private touchState: TouchInputState = {
    left: false,
    right: false,
    block: false,
    jumpQueued: false,
    lightQueued: false,
    specialQueued: false
  };
  private specialPadBtn?: Phaser.GameObjects.Rectangle;
  private specialPadLabel?: Phaser.GameObjects.Text;

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
    this.overlay = [];
    this.spectators = [];
    this.specialPadBtn = undefined;
    this.specialPadLabel = undefined;
    this.touchState = {
      left: false,
      right: false,
      block: false,
      jumpQueued: false,
      lightQueued: false,
      specialQueued: false
    };

    this.markActiveScene(SCENE_KEYS.Match);
    this.cameras.main.setBackgroundColor(0x05070d);

    ensureCrossoverFighterPrepared(this, this.config.p1CharacterId);
    ensureCrossoverFighterPrepared(this, this.config.p2CharacterId);
    warmFighterVoices([this.config.p1CharacterId, this.config.p2CharacterId]);

    const groundY = Math.round(this.cameras.main.height * GROUND_FRACTION);
    this.buildStage();
    this.buildEarthSpectators(groundY);
    this.spawnFighters(groundY);
    this.registerKeys();
    this.createControlsLegend();
    if (this.config.mode === '1vcpu') {
      this.createOnScreenPad();
    }

    this.hud = new MatchHud(this, {
      mode: this.config.mode,
      p1CharacterId: this.config.p1CharacterId,
      p2CharacterId: this.config.p2CharacterId,
      roundsToWin: ROUNDS_TO_WIN,
      depth: HUD_DEPTH
    });
    this.hud.slideIn();

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

    const musicTheme = startStageMusic(this.config.stageId, this.app.settingsStore.getState());
    const unsubscribeMusicSettings = this.app.settingsStore.subscribe((settings) => {
      updateStageMusicSettings(settings);
    });
    this.showMusicToast(musicTheme);

    this.startRound();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsubscribeMusicSettings();
      stopStageMusic();
      this.spectators.forEach((s) => {
        s.idleTween?.stop();
        s.container.destroy(true);
      });
      this.spectators = [];
      this.p1?.destroy();
      this.p2?.destroy();
      this.hud?.destroy();
    });
  }

  update(time: number, delta: number): void {
    const seconds = delta / 1000;
    const fighting = this.phase === 'fighting';

    const p1Input = fighting ? this.readP1Input() : { ...NEUTRAL_FIGHTER_INPUT };
    const p2Input = fighting
      ? this.cpu
        ? this.cpu.update(time, this.p2, this.p1)
        : this.readKeys(this.p2Keys)
      : { ...NEUTRAL_FIGHTER_INPUT };

    p1Input.crouch = false;
    p2Input.crouch = false;

    this.p1.faceToward(this.p2.x);
    this.p2.faceToward(this.p1.x);
    this.updateSpectatorFacing();

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

      defender.applyHit(profile, attacker.facingDirection, blocked);
      defender.flashHit(blocked);
      attacker.markAttackConnected(attack.signature);
      attacker.registerOffense(blocked, isSpecial);
      defender.registerDefense(blocked);

      const specialColor = attacker.getSpecialSpec().vfxColor;
      this.spawnHitFx(attack.rect, hurt, blocked, isSpecial, finisher, specialColor);
    }
  }

  private spawnHitFx(
    attackRect: Phaser.Geom.Rectangle,
    hurtRect: Phaser.Geom.Rectangle,
    blocked: boolean,
    isSpecial: boolean,
    finisher: boolean,
    specialColor: VfxColor
  ): void {
    const sparkX = (Phaser.Geom.Rectangle.GetCenter(attackRect).x + Phaser.Geom.Rectangle.GetCenter(hurtRect).x) / 2;
    const sparkY = (Phaser.Geom.Rectangle.GetCenter(attackRect).y + Phaser.Geom.Rectangle.GetCenter(hurtRect).y) / 2;

    const color: VfxColor = blocked ? 'blue' : isSpecial ? specialColor : 'red';
    const sparkScale = finisher ? 1.65 : isSpecial ? 1.2 : 0.9;
    spawnHitSpark(this, sparkX, sparkY, color, sparkScale);

    if (!blocked) {
      this.exciteSpectators(finisher || isSpecial ? 'special' : 'hit');
    }

    if (finisher) {
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

    this.phase = 'roundEnd';
    this.showBanner('DRAW', '#e2e8f0', 1.1);
    this.time.delayedCall(1100, () => this.startRound());
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

  /**
   * Populates Earth stages (everything except Space Station) with animated
   * spectators lining the arena background who react dynamically to combat.
   */
  private buildEarthSpectators(groundY: number): void {
    if (this.config.stageId === 'space-station') {
      return;
    }

    const outfits = [
      { jacket: 0x334155, shirt: 0xe2e8f0, pants: 0x0f172a, hair: 0x1e293b, skin: 0xf1c27d },
      { jacket: 0x7f1d1d, shirt: 0xf8fafc, pants: 0x1e293b, hair: 0x0f172a, skin: 0xe0ac69 },
      { jacket: 0x1e3a8a, shirt: 0xfde68a, pants: 0x111827, hair: 0x78350f, skin: 0xffdbac },
      { jacket: 0x064e3b, shirt: 0xcbd5e1, pants: 0x1e293b, hair: 0x111827, skin: 0xc68642 },
      { jacket: 0x4c1d95, shirt: 0xfef08a, pants: 0x0f172a, hair: 0x451a03, skin: 0xf1c27d },
      { jacket: 0x78350f, shirt: 0xe2e8f0, pants: 0x1f2937, hair: 0x09090b, skin: 0x8d5524 }
    ];

    const minX = 160;
    const maxX = Math.max(minX + 200, this.stageWorldWidth - 160);
    const total = 14;
    const step = (maxX - minX) / Math.max(1, total - 1);

    for (let i = 0; i < total; i += 1) {
      const palette = outfits[i % outfits.length];
      const jitterX = ((i * 37) % 31) - 15;
      const x = Math.round(minX + i * step + jitterX);
      const depthRow = i % 2 === 0 ? 0 : 1;
      const y = groundY - (depthRow === 0 ? 18 : 26);
      const scale = depthRow === 0 ? 0.88 : 0.78;

      const shadow = this.add.ellipse(0, 2, 26, 8, 0x000000, 0.35);
      const leftLeg = this.add.rectangle(-5, -14, 7, 26, palette.pants, 1).setStrokeStyle(1, 0x020617, 0.8);
      const rightLeg = this.add.rectangle(5, -14, 7, 26, palette.pants, 1).setStrokeStyle(1, 0x020617, 0.8);
      const torso = this.add.rectangle(0, -39, 20, 28, palette.jacket, 1).setStrokeStyle(1.5, 0x020617, 0.85);
      const innerShirt = this.add.rectangle(0, -39, 6, 22, palette.shirt, 0.9);
      const leftArm = this.add.rectangle(-12, -39, 6, 22, palette.jacket, 1).setOrigin(0.5, 0.15).setStrokeStyle(1, 0x020617, 0.8);
      const rightArm = this.add.rectangle(12, -39, 6, 22, palette.jacket, 1).setOrigin(0.5, 0.15).setStrokeStyle(1, 0x020617, 0.8);
      const head = this.add.circle(0, -61, 8.5, palette.skin, 1).setStrokeStyle(1.5, 0x020617, 0.85);
      const hair = this.add.ellipse(0, -66, 17, 9, palette.hair, 1);

      const container = this.add
        .container(x, y, [shadow, leftLeg, rightLeg, leftArm, rightArm, torso, innerShirt, head, hair])
        .setDepth(3 - depthRow * 0.1)
        .setScale(scale)
        .setAlpha(0.92);

      const idleTween = this.tweens.add({
        targets: container,
        y: y - (3 + (i % 3)),
        duration: 420 + (i % 4) * 90,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
        delay: (i * 85) % 400
      });

      this.spectators.push({
        container,
        baseY: y,
        leftArm,
        rightArm,
        idleTween,
        exciteUntil: 0
      });
    }
  }

  private updateSpectatorFacing(): void {
    if (this.spectators.length === 0) {
      return;
    }
    const midX = (this.p1.x + this.p2.x) / 2;
    for (const s of this.spectators) {
      const wantDir = midX >= s.container.x ? 1 : -1;
      const absScale = Math.abs(s.container.scaleX);
      s.container.setScale(wantDir * absScale, s.container.scaleY);
    }
  }

  private exciteSpectators(level: 'hit' | 'special' | 'ko'): void {
    if (this.spectators.length === 0) {
      return;
    }
    const jumpPx = level === 'ko' ? 20 : level === 'special' ? 14 : 7;
    const armAngle = level === 'ko' ? 2.4 : level === 'special' ? 1.9 : 0.9;

    this.spectators.forEach((s, idx) => {
      if (level === 'hit' && idx % 2 === 1) {
        return;
      }
      this.tweens.add({
        targets: [s.leftArm, s.rightArm],
        rotation: -armAngle,
        duration: 140,
        yoyo: true,
        repeat: level === 'ko' ? 3 : 1
      });
      this.tweens.add({
        targets: s.container,
        y: s.baseY - jumpPx,
        duration: 150,
        yoyo: true,
        repeat: level === 'ko' ? 2 : 0,
        ease: 'Quad.Out'
      });
    });
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
        this.exciteSpectators('special');
        playSuperCutIn(this, { characterId: fighter.characterId, side: 'left' });
        this.showVoiceCallout(fighter.x, groundY - 220, getVoiceLine(fighter.characterId, 'special'), '#38bdf8');
      },
      onSecretStart: (fighter, secretSpec) => {
        this.exciteSpectators('special');
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
      onComboChange: (fighter, hits) => this.showComboPopup(fighter.x, groundY - 210, hits, '#38bdf8')
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
        this.exciteSpectators('special');
        playSuperCutIn(this, { characterId: fighter.characterId, side: 'right' });
        this.showVoiceCallout(fighter.x, groundY - 220, getVoiceLine(fighter.characterId, 'special'), '#f43f5e');
      },
      onSecretStart: (fighter, secretSpec) => {
        this.exciteSpectators('special');
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
      onComboChange: (fighter, hits) => this.showComboPopup(fighter.x, groundY - 210, hits, '#f43f5e')
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

    keyboard.on('keydown-ESC', () => this.goToMenu());
    keyboard.on('keydown-BACKSPACE', () => this.goToMenu());
    keyboard.on('keydown-R', () => {
      if (this.phase === 'matchOver') {
        this.rematch();
      }
    });
    keyboard.on('keydown-C', () => {
      if (this.phase === 'matchOver') {
        this.changeFighters();
      }
    });
  }

  private readP1Input(): FighterInput {
    const input = this.readKeys(this.p1Keys);

    input.left = input.left || this.touchState.left;
    input.right = input.right || this.touchState.right;
    input.block = input.block || this.touchState.block;
    input.jump = input.jump || this.touchState.jumpQueued;
    input.light = input.light || this.touchState.lightQueued;
    input.special = input.special || this.touchState.specialQueued;

    this.touchState.jumpQueued = false;
    this.touchState.lightQueued = false;
    this.touchState.specialQueued = false;

    return input;
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
        ? 'Move: A/D or Arrows  •  Jump: W/Up  •  Block: S/Down  •  Combo: Space/F  •  Special: E/V  •  Esc Menu'
        : 'P1: WASD, S Block, F/G Attack, E/V Special   •   P2: Arrows, Down Block, J/K Attack, L Special   •   Esc Menu';

    this.add
      .text(centerX, height - 20, text, {
        color: '#cbd5f5',
        fontFamily: 'monospace',
        fontSize: '12px',
        backgroundColor: 'rgba(2, 6, 23, 0.72)',
        padding: { x: 12, y: 5 }
      })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH)
      .setScrollFactor(0);
  }

  private createOnScreenPad(): void {
    const { width, height } = this.cameras.main;
    const y = height - 68;

    this.makeHoldPadButton(56, y, 58, 46, '◀', 0x1e293b, (down) => {
      this.touchState.left = down;
    });
    this.makeHoldPadButton(124, y, 58, 46, '▶', 0x1e293b, (down) => {
      this.touchState.right = down;
    });
    this.makeTapPadButton(196, y, 66, 46, 'JUMP', 0x1e293b, () => {
      this.touchState.jumpQueued = true;
    });

    this.makeHoldPadButton(width - 260, y, 78, 46, 'BLOCK', 0x1e3a8a, (down) => {
      this.touchState.block = down;
    });
    this.makeTapPadButton(width - 170, y, 82, 46, 'COMBO', 0x7f1d1d, () => {
      this.touchState.lightQueued = true;
    });

    const specialPair = this.makeTapPadButton(width - 72, y, 96, 46, 'SPECIAL', 0x334155, () => {
      this.touchState.specialQueued = true;
    });
    this.specialPadBtn = specialPair.rect;
    this.specialPadLabel = specialPair.label;
  }

  private makeHoldPadButton(
    x: number,
    y: number,
    w: number,
    h: number,
    caption: string,
    fill: number,
    onToggle: (down: boolean) => void
  ): void {
    const rect = this.add
      .rectangle(x, y, w, h, fill, 0.72)
      .setStrokeStyle(2, 0x64748b, 0.9)
      .setDepth(HUD_DEPTH)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, caption, {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH + 1)
      .setScrollFactor(0);

    rect.on('pointerdown', () => {
      rect.setFillStyle(0x38bdf8, 0.9);
      onToggle(true);
    });
    rect.on('pointerup', () => {
      rect.setFillStyle(fill, 0.72);
      onToggle(false);
    });
    rect.on('pointerout', () => {
      rect.setFillStyle(fill, 0.72);
      onToggle(false);
    });
  }

  private makeTapPadButton(
    x: number,
    y: number,
    w: number,
    h: number,
    caption: string,
    fill: number,
    onTap: () => void
  ): { rect: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
    const rect = this.add
      .rectangle(x, y, w, h, fill, 0.78)
      .setStrokeStyle(2, 0x94a3b8, 0.9)
      .setDepth(HUD_DEPTH)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const label = this.add
      .text(x, y, caption, {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH + 1)
      .setScrollFactor(0);

    rect.on('pointerdown', () => {
      rect.setScale(0.94);
      onTap();
    });
    rect.on('pointerup', () => rect.setScale(1));
    rect.on('pointerout', () => rect.setScale(1));

    return { rect, label };
  }

  private updateSpecialPadGlow(): void {
    if (!this.specialPadBtn || !this.specialPadLabel) {
      return;
    }

    const cd = this.p1.cooldownRemainingSeconds;
    const ready = this.phase === 'fighting' && (this.p1.isMeterReady || this.p1.isSecretReady);
    if (ready) {
      this.specialPadBtn.setFillStyle(0xeab308, 0.95).setStrokeStyle(2, 0xfef08a, 1);
      this.specialPadLabel.setText('SPECIAL').setColor('#020617');
    } else if (cd > 0.05) {
      this.specialPadBtn.setFillStyle(0x78350f, 0.78).setStrokeStyle(2, 0xf59e0b, 0.9);
      this.specialPadLabel.setText(`${cd.toFixed(1)}s`).setColor('#fde68a');
    } else {
      this.specialPadBtn.setFillStyle(0x334155, 0.55).setStrokeStyle(2, 0x64748b, 0.7);
      this.specialPadLabel.setText('SPECIAL').setColor('#94a3b8');
    }
  }

  private startRound(): void {
    this.phase = 'intro';
    this.roundTimeMs = ROUND_SECONDS * 1000;

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
      if (this.phase !== 'intro') {
        return;
      }

      this.showBanner('FIGHT!', '#facc15', 1.15);
      this.phase = 'fighting';
      this.p1.setFrozen(false);
      this.p2.setFrozen(false);

      this.time.delayedCall(650, () => this.hideBanner());
    });
  }

  private endRound(winner: 1 | 2, bannerText = 'K.O.', bannerColor = '#f43f5e'): void {
    if (this.phase !== 'fighting') {
      return;
    }

    this.phase = 'roundEnd';
    this.exciteSpectators('ko');

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
    this.showBanner(bannerText, bannerColor, 1.2);
    const koLine = playCharacterVoice(winnerId, 'ko', this.app.settingsStore.getState());
    this.showVoiceCallout(this.cameras.main.centerX, this.cameras.main.centerY + 48, koLine, bannerColor);

    this.time.delayedCall(1100, () => {
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

    const { centerX, centerY, width, height } = this.cameras.main;

    const dim = this.add
      .rectangle(centerX, centerY, width, height, 0x020617, 0.68)
      .setDepth(OVERLAY_DEPTH)
      .setScrollFactor(0);

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

    const rematch = this.makeOverlayButton(centerX, centerY + 24, 'Rematch  (R)', () => this.rematch());
    const changeFighter = this.makeOverlayButton(centerX, centerY + 80, 'Change Fighter  (C)', () =>
      this.changeFighters()
    );
    const menu = this.makeOverlayButton(centerX, centerY + 136, 'Main Menu  (Esc)', () => this.goToMenu());

    this.overlay = [dim, title, score, rematch, changeFighter, menu];
  }

  private makeOverlayButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '22px',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        padding: { x: 18, y: 10 }
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
    this.scene.start(SCENE_KEYS.CharacterSelect, {
      mode: this.config.mode,
      stageId: this.config.stageId,
      botDifficulty: this.botDifficulty
    });
  }

  private showMusicToast(theme: StageMusicTheme): void {
    const { centerX } = this.cameras.main;
    const toast = this.add
      .text(centerX, 114, `♪ ${theme.title}  •  ${theme.genre}`, {
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
    this.banner.setText(text).setColor(color).setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: this.banner, alpha: 1, scale: peakScale, duration: 260, ease: 'Back.Out' });
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
