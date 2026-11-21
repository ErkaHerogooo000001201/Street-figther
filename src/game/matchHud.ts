import * as Phaser from 'phaser';

import { FIGHTING_UI_ATLAS_TEXTURE_KEY, getFightingUiAtlasFrame } from './fightingUiAtlas';
import { getCharacterDefinition } from './hero';
import { getSpecialMoveSpec } from './specialMoves';
import type { MatchMode } from './types';

const KEY = FIGHTING_UI_ATLAS_TEXTURE_KEY;

// Display sizing (screen pixels) for each atlas element.
const PAD = 20;
const TOP = 16;
const PORTRAIT_DISP = 96;
const HEALTH_DISP_W = 468;
const HEALTH_DISP_H = 88;
const NAME_DISP_W = 300;
const NAME_DISP_H = 33;
const TIMER_DISP_W = 96;
const TIMER_DISP_H = 94;
const PIP_DISP_H = 20;

// Special-meter bar (drawn below the win pips).
const METER_DISP_W = 280;
const METER_DISP_H = 12;
const METER_TRACK_COLOR = 0x0b1120;
const METER_FILL_COLOR = 0x38bdf8;
const METER_READY_COLOR = 0xfacc15;

// Health colour thresholds (fraction of max).
const HEALTH_WARN = 0.5;
const HEALTH_DANGER = 0.25;

// How far above its resting position the HUD starts before the intro slide.
const SLIDE_OFFSET = 170;

/** Geometry of a health-fill region in screen space, plus its drain anchor. */
interface FillGeometry {
  anchorX: number;
  topY: number;
  width: number;
  height: number;
  originX: 0 | 1;
}

/** Geometry of a special-meter fill region in screen space. */
interface MeterGeometry {
  anchorX: number;
  topY: number;
  width: number;
  height: number;
  originX: 0 | 1;
}

export interface MatchHudConfig {
  mode: MatchMode;
  p1CharacterId: string;
  p2CharacterId: string;
  roundsToWin: number;
  depth: number;
}

/**
 * The in-match heads-up display built from the fighting UI atlas: portrait
 * frames, color-coded health bars, a centre timer, name plates, and round-win
 * pips. The whole HUD slides in and the health bars fill on round start; bars
 * recolor (green/yellow/red) and blink when low.
 */
export class MatchHud {
  private readonly scene: Phaser.Scene;
  private readonly config: MatchHudConfig;
  private readonly root: Phaser.GameObjects.Container;

  private p1Fill!: Phaser.GameObjects.Image;
  private p2Fill!: Phaser.GameObjects.Image;
  private p1FillGeom!: FillGeometry;
  private p2FillGeom!: FillGeometry;
  private timerText!: Phaser.GameObjects.Text;
  private p1Pips: Phaser.GameObjects.Image[] = [];
  private p2Pips: Phaser.GameObjects.Image[] = [];

  private p1Meter!: Phaser.GameObjects.Rectangle;
  private p2Meter!: Phaser.GameObjects.Rectangle;
  private p1MeterGeom!: MeterGeometry;
  private p2MeterGeom!: MeterGeometry;
  private p1ReadyBadge!: Phaser.GameObjects.Text;
  private p2ReadyBadge!: Phaser.GameObjects.Text;
  private p1ReadyText = '';
  private p2ReadyText = '';
  private p1MeterReady = false;
  private p2MeterReady = false;
  private p1MeterGlow: Phaser.Tweens.Tween | null = null;
  private p2MeterGlow: Phaser.Tweens.Tween | null = null;
  private p1BadgeTween: Phaser.Tweens.Tween | null = null;
  private p2BadgeTween: Phaser.Tweens.Tween | null = null;

  private p1Frac = 1;
  private p2Frac = 1;
  private p1Blink: Phaser.Tweens.Tween | null = null;
  private p2Blink: Phaser.Tweens.Tween | null = null;

  /**
   * @param scene - The owning match scene.
   * @param config - Roster, mode, rounds, and render depth for the HUD.
   */
  constructor(scene: Phaser.Scene, config: MatchHudConfig) {
    this.scene = scene;
    this.config = config;
    this.root = scene.add.container(0, 0).setDepth(config.depth).setScrollFactor(0);

    this.build();
  }

  /** Constructs every HUD element into the root container. */
  private build(): void {
    const camWidth = this.scene.cameras.main.width;

    // --- Player 1 (left) ---
    const p1HealthX = PAD + PORTRAIT_DISP + 6;
    const healthY = TOP + 8;
    this.buildHealth('left', p1HealthX, healthY);
    this.buildPortrait('portrait-frame-gold-left', this.config.p1CharacterId, PAD + PORTRAIT_DISP / 2, true);
    this.buildNameplate('nameplate-gold-left', this.config.p1CharacterId, p1HealthX, healthY, false);
    const pipsY = healthY + HEALTH_DISP_H + NAME_DISP_H + 8;
    this.p1Pips = this.buildPips(p1HealthX, pipsY, false);

    // --- Player 2 (right) ---
    const p2HealthX = camWidth - PAD - PORTRAIT_DISP - 6 - HEALTH_DISP_W;
    this.buildHealth('right', p2HealthX, healthY);
    this.buildPortrait('portrait-frame-blue-right', this.config.p2CharacterId, camWidth - PAD - PORTRAIT_DISP / 2, false);
    this.buildNameplate('nameplate-gold-right', this.config.p2CharacterId, p2HealthX, healthY, true);
    this.p2Pips = this.buildPips(p2HealthX + HEALTH_DISP_W, pipsY, true);

    // --- Special meters (below the win pips) ---
    const meterY = pipsY + PIP_DISP_H + 8;
    this.buildMeter('left', p1HealthX, meterY, this.config.p1CharacterId);
    this.buildMeter('right', p2HealthX + HEALTH_DISP_W, meterY, this.config.p2CharacterId);

    // --- Timer (centre) ---
    this.buildTimer(camWidth / 2);

    this.applyHealth(1, 1);
    this.setMeter(0, 0);
    this.updateWins(0, 0);
  }

  /**
   * Builds one side's special-meter track, fill bar, and ready callout badge.
   * @param side - Which side the meter belongs to.
   * @param edgeX - The outer-edge anchor x in screen pixels.
   * @param topY - The bar's top y in screen pixels.
   * @param characterId - Fighter id to show its special move name.
   */
  private buildMeter(side: 'left' | 'right', edgeX: number, topY: number, characterId: string): void {
    const originX: 0 | 1 = side === 'left' ? 0 : 1;
    const geometry: MeterGeometry = { anchorX: edgeX, topY, width: METER_DISP_W, height: METER_DISP_H, originX };
    const spec = getSpecialMoveSpec(characterId);
    const keyHint = side === 'left' ? '[E / V]' : this.config.mode === '1vcpu' ? 'CPU' : '[L]';

    const track = this.scene.add
      .rectangle(edgeX, topY, METER_DISP_W, METER_DISP_H, METER_TRACK_COLOR, 0.85)
      .setOrigin(originX, 0)
      .setStrokeStyle(1, 0x1e293b, 1);
    this.root.add(track);

    const fill = this.scene.add
      .rectangle(edgeX, topY, METER_DISP_W, METER_DISP_H, METER_FILL_COLOR, 1)
      .setOrigin(originX, 0);
    this.root.add(fill);

    const readyLabel = `SPECIAL READY: ${spec.name.toUpperCase()} ${keyHint}`;
    const readyBadge = this.scene.add
      .text(edgeX, topY + METER_DISP_H + 4, readyLabel, {
        color: '#facc15',
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        backgroundColor: 'rgba(2, 6, 23, 0.78)',
        padding: { x: 6, y: 2 }
      })
      .setOrigin(originX, 0)
      .setVisible(false);
    this.root.add(readyBadge);

    if (side === 'left') {
      this.p1Meter = fill;
      this.p1MeterGeom = geometry;
      this.p1ReadyBadge = readyBadge;
      this.p1ReadyText = readyLabel;
    } else {
      this.p2Meter = fill;
      this.p2MeterGeom = geometry;
      this.p2ReadyBadge = readyBadge;
      this.p2ReadyText = readyLabel;
    }
  }

  /**
   * Builds one side's health frame and its drainable fill underneath.
   * @param side - Which side this bar belongs to.
   * @param frameX - Frame top-left x in screen pixels.
   * @param frameY - Frame top-left y in screen pixels.
   */
  private buildHealth(side: 'left' | 'right', frameX: number, frameY: number): void {
    const frameName = side === 'left' ? 'health-frame-left' : 'health-frame-right';
    const meta = getFightingUiAtlasFrame(frameName);
    const slot = meta.fillSlot ?? meta.bounds;
    const sx = HEALTH_DISP_W / meta.bounds.width;
    const sy = HEALTH_DISP_H / meta.bounds.height;

    const slotLeft = frameX + slot.x * sx;
    const slotTop = frameY + slot.y * sy;
    const slotWidth = slot.width * sx;
    const slotHeight = slot.height * sy;

    const geometry: FillGeometry =
      side === 'left'
        ? { anchorX: slotLeft, topY: slotTop, width: slotWidth, height: slotHeight, originX: 0 }
        : { anchorX: slotLeft + slotWidth, topY: slotTop, width: slotWidth, height: slotHeight, originX: 1 };

    const fill = this.scene.add
      .image(geometry.anchorX, geometry.topY, KEY, 'health-fill-green-left')
      .setOrigin(geometry.originX, 0);
    this.root.add(fill);

    const frame = this.scene.add
      .image(frameX, frameY, KEY, frameName)
      .setOrigin(0, 0)
      .setDisplaySize(HEALTH_DISP_W, HEALTH_DISP_H);
    this.root.add(frame);

    if (side === 'left') {
      this.p1Fill = fill;
      this.p1FillGeom = geometry;
    } else {
      this.p2Fill = fill;
      this.p2FillGeom = geometry;
    }
  }

  /**
   * Builds a portrait frame with the character portrait seated in its socket.
   * Portraits are authored facing left (canonical); the left (P1) socket flips
   * its portrait so both players face inward toward the centre of the screen.
   * @param frameName - The portrait frame atlas name.
   * @param characterId - The character whose portrait is shown.
   * @param centerX - Frame centre x in screen pixels.
   * @param faceRight - When true, flips the portrait to face right (the P1 socket).
   */
  private buildPortrait(frameName: string, characterId: string, centerX: number, faceRight: boolean): void {
    const meta = getFightingUiAtlasFrame(frameName);
    const centerY = TOP + PORTRAIT_DISP / 2;
    const sx = PORTRAIT_DISP / meta.bounds.width;
    const sy = PORTRAIT_DISP / meta.bounds.height;
    const socket = meta.portraitSocket ?? meta.bounds;

    const frameLeft = centerX - PORTRAIT_DISP / 2;
    const frameTop = centerY - PORTRAIT_DISP / 2;
    const socketCx = frameLeft + (socket.x + socket.width / 2) * sx;
    const socketCy = frameTop + (socket.y + socket.height / 2) * sy;

    const portraitKey = getCharacterDefinition(characterId).portrait.key;
    if (this.scene.textures.exists(portraitKey)) {
      const portrait = this.scene.add
        .image(socketCx, socketCy, portraitKey)
        .setDisplaySize(socket.width * sx, socket.height * sy)
        .setFlipX(faceRight);
      this.root.add(portrait);
    }

    const frame = this.scene.add.image(centerX, centerY, KEY, frameName).setDisplaySize(PORTRAIT_DISP, PORTRAIT_DISP);
    this.root.add(frame);
  }

  /**
   * Builds a name plate beneath a health bar with the character's name.
   * @param frameName - The nameplate atlas frame.
   * @param characterId - The character whose name is shown.
   * @param healthX - The health frame's top-left x (for alignment).
   * @param healthY - The health frame's top-left y.
   * @param rightAligned - When true, the plate hugs the bar's right edge.
   */
  private buildNameplate(
    frameName: string,
    characterId: string,
    healthX: number,
    healthY: number,
    rightAligned: boolean
  ): void {
    const meta = getFightingUiAtlasFrame(frameName);
    const plateX = rightAligned ? healthX + HEALTH_DISP_W - NAME_DISP_W : healthX;
    const plateY = healthY + HEALTH_DISP_H + 2;

    const plate = this.scene.add
      .image(plateX, plateY, KEY, frameName)
      .setOrigin(0, 0)
      .setDisplaySize(NAME_DISP_W, NAME_DISP_H);
    this.root.add(plate);

    const sx = NAME_DISP_W / meta.bounds.width;
    const sy = NAME_DISP_H / meta.bounds.height;
    const slot = meta.textSlot ?? meta.bounds;
    const textCx = plateX + (slot.x + slot.width / 2) * sx;
    const textCy = plateY + (slot.y + slot.height / 2) * sy;

    const name = getCharacterDefinition(characterId).label.toUpperCase();
    const label = this.scene.add
      .text(textCx, textCy, name, {
        color: '#fdf6e3',
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.root.add(label);
  }

  /**
   * Builds the round-win pip row for one side.
   * @param edgeX - The anchor x (outer edge of the row).
   * @param y - The row's top y.
   * @param rightAligned - When true, pips grow leftward from `edgeX`.
   * @returns The created pip images, outermost first.
   */
  private buildPips(edgeX: number, y: number, rightAligned: boolean): Phaser.GameObjects.Image[] {
    const meta = getFightingUiAtlasFrame('meter-pip-empty-1');
    const pipWidth = (PIP_DISP_H * meta.bounds.width) / meta.bounds.height;
    const gap = 6;
    const pips: Phaser.GameObjects.Image[] = [];

    for (let index = 0; index < this.config.roundsToWin; index += 1) {
      const offset = index * (pipWidth + gap);
      const x = rightAligned ? edgeX - offset : edgeX + offset;
      const pip = this.scene.add
        .image(x, y, KEY, 'meter-pip-empty-1')
        .setOrigin(rightAligned ? 1 : 0, 0)
        .setDisplaySize(pipWidth, PIP_DISP_H);
      this.root.add(pip);
      pips.push(pip);
    }

    return pips;
  }

  /**
   * Builds the centre timer frame and its number text.
   * @param centerX - The frame centre x in screen pixels.
   */
  private buildTimer(centerX: number): void {
    const meta = getFightingUiAtlasFrame('timer-frame');
    const centerY = TOP + TIMER_DISP_H / 2;
    const frame = this.scene.add.image(centerX, centerY, KEY, 'timer-frame').setDisplaySize(TIMER_DISP_W, TIMER_DISP_H);
    this.root.add(frame);

    const sx = TIMER_DISP_W / meta.bounds.width;
    const sy = TIMER_DISP_H / meta.bounds.height;
    const slot = meta.numberSlot ?? meta.bounds;
    const numberCx = centerX - TIMER_DISP_W / 2 + (slot.x + slot.width / 2) * sx;
    const numberCy = centerY - TIMER_DISP_H / 2 + (slot.y + slot.height / 2) * sy;

    this.timerText = this.scene.add
      .text(numberCx, numberCy, '0', {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '34px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.root.add(this.timerText);
  }

  /**
   * Sets both health bars to the given fractions (color + width + blink).
   * @param p1Frac - Player 1's health fraction (0..1).
   * @param p2Frac - Player 2's health fraction (0..1).
   */
  applyHealth(p1Frac: number, p2Frac: number): void {
    this.p1Frac = Phaser.Math.Clamp(p1Frac, 0, 1);
    this.p2Frac = Phaser.Math.Clamp(p2Frac, 0, 1);
    this.renderFill('left');
    this.renderFill('right');
  }

  /**
   * Sets both special meters and remaining cooldown timers, recolouring and pulsing
   * the bar when ready to fire, or showing amber cooldown readout while cooling down.
   * @param p1Frac - Player 1's meter fraction (0..1).
   * @param p2Frac - Player 2's meter fraction (0..1).
   * @param p1CooldownSec - Player 1's remaining special cooldown in seconds.
   * @param p2CooldownSec - Player 2's remaining special cooldown in seconds.
   */
  setMeter(p1Frac: number, p2Frac: number, p1CooldownSec = 0, p2CooldownSec = 0): void {
    this.renderMeter('left', Phaser.Math.Clamp(p1Frac, 0, 1), Math.max(0, p1CooldownSec));
    this.renderMeter('right', Phaser.Math.Clamp(p2Frac, 0, 1), Math.max(0, p2CooldownSec));
  }

  /**
   * Renders one side's meter: width by fraction, colour + glow when full & off cooldown.
   * @param side - Which meter to render.
   * @param frac - The meter fraction (0..1).
   * @param cooldownSec - Remaining cooldown in seconds.
   */
  private renderMeter(side: 'left' | 'right', frac: number, cooldownSec: number): void {
    const fill = side === 'left' ? this.p1Meter : this.p2Meter;
    const geometry = side === 'left' ? this.p1MeterGeom : this.p2MeterGeom;
    const badge = side === 'left' ? this.p1ReadyBadge : this.p2ReadyBadge;
    const readyText = side === 'left' ? this.p1ReadyText : this.p2ReadyText;
    const cooling = cooldownSec > 0.05;
    const ready = frac >= 1 && !cooling;

    fill.setDisplaySize(Math.max(0, geometry.width * frac), geometry.height);
    fill.setFillStyle(ready ? METER_READY_COLOR : cooling ? 0xf59e0b : METER_FILL_COLOR, 1);
    fill.setVisible(frac > 0);
    this.setMeterGlow(side, ready);

    if (cooling) {
      badge.setText(`COOLDOWN: ${cooldownSec.toFixed(1)}s`).setColor('#f59e0b').setVisible(true).setAlpha(1);
    } else if (ready) {
      badge.setText(readyText).setColor('#facc15');
    }
  }

  /**
   * Starts or stops the "ready" pulse on a full meter bar.
   * @param side - Which meter to manage.
   * @param active - Whether the bar should be pulsing.
   */
  private setMeterGlow(side: 'left' | 'right', active: boolean): void {
    const wasReady = side === 'left' ? this.p1MeterReady : this.p2MeterReady;
    if (active === wasReady) {
      return;
    }

    if (side === 'left') {
      this.p1MeterReady = active;
    } else {
      this.p2MeterReady = active;
    }

    const fill = side === 'left' ? this.p1Meter : this.p2Meter;
    const badge = side === 'left' ? this.p1ReadyBadge : this.p2ReadyBadge;
    const existing = side === 'left' ? this.p1MeterGlow : this.p2MeterGlow;
    const existingBadge = side === 'left' ? this.p1BadgeTween : this.p2BadgeTween;

    if (active) {
      const tween = this.scene.tweens.add({
        targets: fill,
        alpha: 0.45,
        duration: 320,
        yoyo: true,
        repeat: -1
      });
      badge.setVisible(true).setAlpha(1);
      const badgeTween = this.scene.tweens.add({
        targets: badge,
        alpha: 0.6,
        duration: 380,
        yoyo: true,
        repeat: -1
      });

      if (side === 'left') {
        this.p1MeterGlow = tween;
        this.p1BadgeTween = badgeTween;
      } else {
        this.p2MeterGlow = tween;
        this.p2BadgeTween = badgeTween;
      }

      return;
    }

    existing?.stop();
    existingBadge?.stop();
    fill.setAlpha(1);
    badge.setVisible(false).setAlpha(1);

    if (side === 'left') {
      this.p1MeterGlow = null;
      this.p1BadgeTween = null;
    } else {
      this.p2MeterGlow = null;
      this.p2BadgeTween = null;
    }
  }

  /**
   * Updates the timer readout and its low-time colour.
   * @param seconds - Whole seconds remaining.
   */
  setTime(seconds: number): void {
    this.timerText.setText(String(Math.max(0, seconds))).setColor(seconds <= 10 ? '#f87171' : '#f8fafc');
  }

  /**
   * Lights up won-round pips for both players.
   * @param p1Wins - Player 1's round wins.
   * @param p2Wins - Player 2's round wins.
   */
  updateWins(p1Wins: number, p2Wins: number): void {
    this.p1Pips.forEach((pip, index) => pip.setFrame(index < p1Wins ? 'meter-pip-gold-1' : 'meter-pip-empty-1'));
    this.p2Pips.forEach((pip, index) => pip.setFrame(index < p2Wins ? 'meter-pip-gold-1' : 'meter-pip-empty-1'));
  }

  /** Slides the HUD down into place from above (match start). */
  slideIn(): void {
    this.root.y = -SLIDE_OFFSET;
    this.scene.tweens.add({ targets: this.root, y: 0, duration: 900, ease: 'Back.Out' });
  }

  /**
   * Animates both health bars filling from empty to full (round start). The
   * recolor passes through red -> yellow -> green as they fill.
   */
  animateFill(): void {
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 950,
      ease: 'Cubic.Out',
      onUpdate: (tween) => {
        const value = tween.getValue() ?? 0;
        this.applyHealth(value, value);
      },
      onComplete: () => this.applyHealth(1, 1)
    });
  }

  /** Removes the HUD and stops its tweens. */
  destroy(): void {
    this.p1Blink?.stop();
    this.p2Blink?.stop();
    this.p1MeterGlow?.stop();
    this.p2MeterGlow?.stop();
    this.p1BadgeTween?.stop();
    this.p2BadgeTween?.stop();
    this.root.destroy(true);
  }

  /**
   * Renders one side's fill: width by fraction, frame by colour, plus low-health
   * blink management.
   * @param side - Which bar to render.
   */
  private renderFill(side: 'left' | 'right'): void {
    const frac = side === 'left' ? this.p1Frac : this.p2Frac;
    const fill = side === 'left' ? this.p1Fill : this.p2Fill;
    const geometry = side === 'left' ? this.p1FillGeom : this.p2FillGeom;

    fill.setFrame(colorFrame(frac));
    fill.setDisplaySize(Math.max(1, geometry.width * frac), geometry.height);
    fill.setVisible(frac > 0);

    const blinking = frac > 0 && frac <= HEALTH_DANGER;
    this.setBlink(side, blinking);
  }

  /**
   * Starts or stops the low-health blink for one side.
   * @param side - Which bar to manage.
   * @param active - Whether the bar should be blinking.
   */
  private setBlink(side: 'left' | 'right', active: boolean): void {
    const fill = side === 'left' ? this.p1Fill : this.p2Fill;
    const existing = side === 'left' ? this.p1Blink : this.p2Blink;

    if (active) {
      if (existing) {
        return;
      }

      const tween = this.scene.tweens.add({
        targets: fill,
        alpha: 0.3,
        duration: 220,
        yoyo: true,
        repeat: -1
      });

      if (side === 'left') {
        this.p1Blink = tween;
      } else {
        this.p2Blink = tween;
      }

      return;
    }

    if (existing) {
      existing.stop();
      fill.setAlpha(1);

      if (side === 'left') {
        this.p1Blink = null;
      } else {
        this.p2Blink = null;
      }
    }
  }
}

/**
 * Picks the health-fill atlas frame for a given fraction. The left-side colour
 * frames are reused for both players (the right side only ships a green fill).
 * @param frac - Health fraction (0..1).
 */
function colorFrame(frac: number): string {
  if (frac > HEALTH_WARN) {
    return 'health-fill-green-left';
  }

  if (frac > HEALTH_DANGER) {
    return 'health-fill-yellow-left';
  }

  return 'health-fill-red-left';
}
