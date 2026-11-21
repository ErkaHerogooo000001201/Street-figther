import * as Phaser from 'phaser';

import { AUDIO_KEYS, playAudioCue } from '../game/core/audio';
import { ensureCrossoverFighterPrepared } from '../game/crossoverRenderer';
import { FIGHTER_CHARACTER_DEFINITIONS, getCharacterAnimationByAction } from '../game/hero';
import { STAGE_DEFINITIONS } from '../game/stageConfig';
import { createTextButton, type TextButton } from '../game/ui';
import { SCENE_KEYS } from '../game/types';
import { BaseScene } from './BaseScene';

interface SparkParticle {
  gfx: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  maxY: number;
}

const SHOWCASE_MATCHUPS: Array<{ left: string; right: string }> = [
  { left: 'hero', right: 'goku' },
  { left: 'erkhembayar', right: 'gojo' },
  { left: 'ryu', right: 'naruto' }
];

export class SplashScene extends BaseScene {
  private hasAdvanced = false;

  private gridGraphics?: Phaser.GameObjects.Graphics;

  private floorPhase = 0;

  private sparks: SparkParticle[] = [];

  private enterButton?: TextButton;

  private bgImage?: Phaser.GameObjects.Image;

  private bgDriftDir = 1;

  constructor() {
    super(SCENE_KEYS.Splash);
  }

  create(): void {
    this.hasAdvanced = false;
    this.sparks = [];
    this.floorPhase = 0;
    this.markActiveScene(SCENE_KEYS.Splash);

    const camera = this.cameras.main;
    const { width, height, centerX, centerY } = camera;
    camera.setBackgroundColor(0x020617);

    // 1. Atmospheric stage backdrop with dark dramatic scrim
    if (this.textures.exists('storm-citadel-stage')) {
      const src = this.textures.get('storm-citadel-stage').getSourceImage() as HTMLImageElement;
      const scale = Math.max(width / Math.max(1, src.width), height / Math.max(1, src.height)) * 1.08;
      this.bgImage = this.add
        .image(centerX, centerY, 'storm-citadel-stage')
        .setScale(scale)
        .setAlpha(0.36)
        .setDepth(0);
    }

    // Dual-corner energy glow + dark atmospheric gradient vignette
    this.add.rectangle(centerX, centerY, width, height, 0x020617, 0.56).setDepth(1);
    this.add.circle(width * 0.16, height * 0.58, 290, 0x0ea5e9, 0.14).setDepth(1);
    this.add.circle(width * 0.84, height * 0.58, 290, 0xf43f5e, 0.14).setDepth(1);
    this.add.rectangle(centerX, 62, width, 124, 0x020617, 0.65).setDepth(1);
    this.add.rectangle(centerX, height - 56, width, 112, 0x020617, 0.72).setDepth(1);

    // 2. Animated perspective arcade floor grid
    this.gridGraphics = this.add.graphics().setDepth(2);
    this.drawPerspectiveFloor(width, height);

    // 3. Diagonal arcade speed streaks behind fighters
    this.spawnSpeedStreaks(width, height);

    // 4. Rising arena sparks
    for (let i = 0; i < 24; i += 1) {
      const color = i % 3 === 0 ? 0xfacc15 : i % 3 === 1 ? 0x38bdf8 : 0xf43f5e;
      const dot = this.add
        .circle(
          Phaser.Math.Between(30, width - 30),
          Phaser.Math.Between(Math.round(height * 0.25), height - 20),
          Phaser.Math.Between(2, 4),
          color,
          Phaser.Math.FloatBetween(0.35, 0.85)
        )
        .setDepth(3);
      this.sparks.push({
        gfx: dot,
        vx: Phaser.Math.FloatBetween(-18, 18),
        vy: -Phaser.Math.FloatBetween(28, 72),
        maxY: height
      });
    }

    // 5. Featured animated rival standoff on Left vs Right
    const matchup = SHOWCASE_MATCHUPS[Math.floor(Math.random() * SHOWCASE_MATCHUPS.length)];
    this.prepareShowcaseSprites(matchup.left, matchup.right, width, height);

    // 6. Central blazing "STREET FIGHTER" title logo slam
    const logoY = Math.round(height * 0.27);
    const flare = this.add
      .ellipse(centerX, logoY + 14, 640, 120, 0xfacc15, 0.16)
      .setDepth(8);
    this.tweens.add({
      targets: flare,
      scaleX: 1.16,
      alpha: 0.28,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    const streetText = this.add
      .text(centerX, logoY - 34, 'STREET', {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '54px',
        fontStyle: 'bold',
        stroke: '#0ea5e9',
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setScale(1.85)
      .setAlpha(0);

    const fighterText = this.add
      .text(centerX, logoY + 28, 'FIGHTER', {
        color: '#facc15',
        fontFamily: 'monospace',
        fontSize: '74px',
        fontStyle: 'bold',
        stroke: '#7f1d1d',
        strokeThickness: 12
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setScale(2.1)
      .setAlpha(0);

    this.tweens.add({
      targets: streetText,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.Out'
    });

    this.tweens.add({
      targets: fighterText,
      scale: 1,
      alpha: 1,
      delay: 140,
      duration: 340,
      ease: 'Back.Out',
      onComplete: () => {
        camera.shake(170, 0.007);
        this.spawnTitleImpactBurst(centerX, logoY + 24);
      }
    });

    const taglineText = this.add
      .text(
        centerX,
        logoY + 88,
        `${FIGHTER_CHARACTER_DEFINITIONS.length} FIGHTERS  ·  UNIQUE SPECIALS & SECRET ARTS  ·  ${STAGE_DEFINITIONS.length} STAGES`,
        {
          color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        stroke: '#020617',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0);

    this.tweens.add({
      targets: taglineText,
      alpha: 1,
      delay: 360,
      duration: 320
    });

    // 7. Interactive "ENTER ARENA" arcade button
    const advanceToMenu = (): void => {
      if (this.hasAdvanced) {
        return;
      }

      this.hasAdvanced = true;
      playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
      camera.flash(200, 255, 255, 255);
      this.time.delayedCall(120, () => {
        this.scene.start(SCENE_KEYS.MainMenu);
      });
    };

    this.enterButton = createTextButton(this, {
      x: centerX,
      y: Math.round(height * 0.67),
      width: 310,
      height: 58,
      label: 'ENTER ARENA',
      onClick: advanceToMenu
    });
    this.enterButton.setSelected(true);
    this.enterButton.group.setDepth(15).setAlpha(0);
    this.tweens.add({
      targets: this.enterButton.group,
      alpha: 1,
      delay: 460,
      duration: 300
    });

    // 8. Pulsing arcade coin prompt at footer
    const promptText = this.add
      .text(
        centerX,
        height - 32,
        this.app.isMobileShell ? 'TAP SCREEN TO FIGHT' : 'PRESS ANY KEY OR CLICK TO FIGHT',
        {
          color: '#fde047',
          fontFamily: 'monospace',
          fontSize: '16px',
          fontStyle: 'bold',
          stroke: '#020617',
          strokeThickness: 5
        }
      )
      .setOrigin(0.5)
      .setDepth(15);

    this.tweens.add({
      targets: promptText,
      alpha: 0.32,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    this.input.once('pointerup', advanceToMenu);
    this.input.keyboard?.once('keydown', advanceToMenu);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.enterButton?.destroy();
      this.enterButton = undefined;
      this.sparks = [];
      this.gridGraphics = undefined;
      this.bgImage = undefined;
    });
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    const { width, height, centerX } = this.cameras.main;

    this.floorPhase = (this.floorPhase + dt * 1.4) % 1;
    this.drawPerspectiveFloor(width, height);

    if (this.bgImage) {
      this.bgImage.x += this.bgDriftDir * dt * 14;
      if (this.bgImage.x > centerX + 26) {
        this.bgDriftDir = -1;
      } else if (this.bgImage.x < centerX - 26) {
        this.bgDriftDir = 1;
      }
    }

    for (const spark of this.sparks) {
      spark.gfx.x += spark.vx * dt;
      spark.gfx.y += spark.vy * dt;
      if (spark.gfx.y < 10) {
        spark.gfx.y = spark.maxY - 12;
        spark.gfx.x = Phaser.Math.Between(30, width - 30);
      }
    }
  }

  private prepareShowcaseSprites(leftId: string, rightId: string, width: number, height: number): void {
    try {
      ensureCrossoverFighterPrepared(this, leftId);
      ensureCrossoverFighterPrepared(this, rightId);
    } catch {
      // Fallback gracefully if a showcase sheet fails
    }

    const floorY = Math.round(height * 0.84);
    const leftX = Math.round(width * 0.19);
    const rightX = Math.round(width * 0.81);

    this.spawnStanceFighter(leftId, leftX, floorY, true, 0x38bdf8, -140);
    this.spawnStanceFighter(rightId, rightX, floorY, false, 0xf43f5e, 140);
  }

  private spawnStanceFighter(
    characterId: string,
    targetX: number,
    floorY: number,
    faceRight: boolean,
    auraColor: number,
    slideOffsetX: number
  ): void {
    const idleAnim = getCharacterAnimationByAction(characterId, 'idle');
    if (!idleAnim || !this.textures.exists(idleAnim.sheet.key)) {
      return;
    }

    this.add.ellipse(targetX, floorY - 6, 154, 30, 0x000000, 0.55).setDepth(4);
    const glow = this.add
      .ellipse(targetX, floorY - 8, 178, 36, auraColor, 0.24)
      .setStrokeStyle(3, auraColor, 0.78)
      .setDepth(4);

    this.tweens.add({
      targets: glow,
      scaleX: 1.15,
      alpha: 0.42,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    const sprite = this.add
      .sprite(targetX + slideOffsetX, floorY, idleAnim.sheet.key, 0)
      .setOrigin(0.5, 0.9)
      .setScale(1.42)
      .setFlipX(faceRight)
      .setAlpha(0)
      .setDepth(6);

    if (this.anims.exists(idleAnim.key)) {
      sprite.play({ key: idleAnim.key, repeat: -1 });
    }

    this.tweens.add({
      targets: sprite,
      x: targetX,
      alpha: 1,
      duration: 460,
      ease: 'Cubic.Out'
    });
  }

  private spawnSpeedStreaks(width: number, height: number): void {
    for (let i = 0; i < 8; i += 1) {
      const fromLeft = i % 2 === 0;
      const y = Phaser.Math.Between(70, height - 90);
      const color = fromLeft ? 0x38bdf8 : 0xf43f5e;
      const streak = this.add
        .rectangle(fromLeft ? -260 : width + 260, y, Phaser.Math.Between(180, 380), 3, color, 0.35)
        .setAngle(fromLeft ? -6 : 6)
        .setDepth(2);

      this.tweens.add({
        targets: streak,
        x: fromLeft ? width + 260 : -260,
        delay: i * 190,
        duration: 1350,
        repeat: -1,
        repeatDelay: 420
      });
    }
  }

  private spawnTitleImpactBurst(x: number, y: number): void {
    const ring = this.add
      .ellipse(x, y, 120, 44, 0xfacc15, 0)
      .setStrokeStyle(6, 0xffffff, 0.95)
      .setDepth(12);

    this.tweens.add({
      targets: ring,
      scaleX: 5.5,
      scaleY: 2.8,
      alpha: 0,
      duration: 480,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy()
    });
  }

  private drawPerspectiveFloor(width: number, height: number): void {
    const g = this.gridGraphics;
    if (!g) {
      return;
    }

    g.clear();
    const horizonY = Math.round(height * 0.62);
    const vanishX = width / 2;

    g.lineStyle(1.5, 0x38bdf8, 0.2);

    // Radiating perspective lanes
    const rayCount = 14;
    for (let i = -rayCount; i <= rayCount; i += 1) {
      const bottomX = vanishX + i * 105;
      g.beginPath();
      g.moveTo(vanishX + i * 18, horizonY);
      g.lineTo(bottomX, height);
      g.strokePath();
    }

    // Scrolling horizontal horizon bands
    const bandCount = 8;
    for (let i = 0; i < bandCount; i += 1) {
      const t = (i + this.floorPhase) / bandCount;
      const y = horizonY + Math.pow(t, 1.85) * (height - horizonY);
      g.lineStyle(1 + t * 1.5, 0x38bdf8, 0.08 + t * 0.24);
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(width, y);
      g.strokePath();
    }
  }
}
