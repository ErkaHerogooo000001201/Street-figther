import * as Phaser from 'phaser';

import { playCombatSfx } from './core/combatAudio';
import { playCharacterVoice } from './core/voiceAudio';
import type { AppContext } from './context';
import { FIGHTER_BOUNDS_FIELDS, getAttackProfile, getFighterCombat, getFighterStats } from './fighterConfig';
import {
  findCharacterAnimationKeyByAction,
  getCharacterAnimationDefinition,
  getCharacterDefinition,
  resolveHeroBoundsFrame,
  type CharacterDefinition,
  type HeroAnimationDefinition,
  type HeroBoundsFrame
} from './hero';
import {
  getSecretCooldownSeconds,
  getSecretMoveSpec,
  SECRET_COMBO_MIN_HITS,
  SECRET_COMBO_MIN_METER,
  SECRET_HIGH_COMBO_HITS,
  SECRET_HIGH_COMBO_METER,
  type SecretMoveSpec
} from './secretMoves';
import { getSpecialCooldownSeconds, getSpecialMoveSpec, type SpecialMoveSpec } from './specialMoves';
import {
  spawnAfterimage,
  spawnBeamVfx,
  spawnCataclysmBurstVfx,
  spawnChainArcVfx,
  spawnChargeAura,
  spawnCycloneRingsVfx,
  spawnDomainExpansionVfx,
  spawnHellfirePillarVfx,
  spawnRealitySlashVfx,
  spawnShockwaveConeVfx,
  spawnTailedBeastVfx,
  spawnTeleportFlameVfx
} from './vfx';
import type {
  AttackKind,
  AttackProfile,
  FighterBoundsVisibility,
  FighterCombat,
  FighterStats,
  Rect
} from './types';

const KNOCKBACK_FRICTION = 720;
const BLOCKSTUN_SECONDS = 0.14;

const METER_MAX = 100;
const METER_START = 25;
const METER_GAIN_ON_HIT = 18;
const METER_GAIN_ON_TAKE = 12;
const METER_GAIN_ON_BLOCK = 8;
const METER_PASSIVE_PER_SEC = 6.0;
const SUPER_FREEZE_MS = 340;

export interface ActiveAttack {
  rect: Phaser.Geom.Rectangle;
  profile: AttackProfile;
  signature: number;
  finisher: boolean;
}

const BOUNDS_ALPHA_ACTIVE = 0.95;
const BOUNDS_ALPHA_INACTIVE = 0.28;
const SHADOW_FOOT_OFFSET = 24;

const BOUNDS_COLORS: Record<keyof FighterBoundsVisibility, number> = Object.fromEntries(
  FIGHTER_BOUNDS_FIELDS.map((field) => [field.id, Number.parseInt(field.color.slice(1), 16)])
) as Record<keyof FighterBoundsVisibility, number>;

export interface FighterInput {
  left: boolean;
  right: boolean;
  crouch: boolean;
  block: boolean;
  jump: boolean;
  light: boolean;
  heavy: boolean;
  special: boolean;
}

export const NEUTRAL_FIGHTER_INPUT: FighterInput = {
  left: false,
  right: false,
  crouch: false,
  block: false,
  jump: false,
  light: false,
  heavy: false,
  special: false
};

interface FighterActionKeys {
  idle: string;
  walkForward: string;
  walkBackward: string;
  crouch: string;
  jump: string;
  blockHigh: string;
  blockLow: string;
  hitHigh: string;
  lightPunch: string;
  heavy: string;
  specialCharge: string;
  special: string;
  knockdown: string;
}

interface SpecialZoneInstance {
  signature: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  life: number;
  tickInterval: number;
  tickCooldown: number;
  hitsRemaining: number;
  damage: number;
  knockback: number;
  hitstun: number;
  visual?: Phaser.GameObjects.Container;
}

export interface FighterOptions {
  scene: Phaser.Scene;
  app: AppContext;
  characterId: string;
  x: number;
  groundY: number;
  facing: 1 | -1;
  minX: number;
  maxX: number;
  depth?: number;
  onSpecialStart?: (fighter: Fighter) => void;
  onSecretStart?: (fighter: Fighter, spec: SecretMoveSpec) => void;
  onComboChange?: (fighter: Fighter, comboHits: number) => void;
}

export class Fighter {
  private readonly scene: Phaser.Scene;
  private readonly app: AppContext;
  private readonly character: CharacterDefinition;
  private readonly actionKeys: FighterActionKeys;
  private readonly specialSpec: SpecialMoveSpec;
  private readonly secretSpec: SecretMoveSpec;
  private facing: 1 | -1;
  private minX: number;
  private maxX: number;
  private readonly groundY: number;

  private sprite!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private boundsGraphics!: Phaser.GameObjects.Graphics;
  private depthBase = 5;
  private posX: number;
  private velocityY = 0;
  private grounded = true;
  private locked = false;
  private frozen = true;
  private currentAnimKey = '';
  private currentReverse = false;

  private maxHealth: number;
  private health: number;
  private hitstunTimer = 0;
  private stunIsBlock = false;
  private stunBlockLow = false;
  private knockbackVel = 0;
  private defeated = false;
  private attackId = 0;
  private attackConnected = true;
  private attackActiveLast = false;
  private meter = METER_START;
  private specialCooldownTimer = 0;
  private appliedScale = 0;
  private readonly hasSpecial: boolean;
  private readonly onSpecialStart?: (fighter: Fighter) => void;
  private readonly onSecretStart?: (fighter: Fighter, spec: SecretMoveSpec) => void;
  private readonly onComboChange?: (fighter: Fighter, comboHits: number) => void;

  // Auto-combo, hidden secret combo window & special movement state
  private queuedComboHeavy = false;
  private comboHits = 0;
  private comboTimer = 0;
  private dashVelX = 0;
  private dashTimer = 0;
  private afterimageTimer = 0;
  private specialZones: SpecialZoneInstance[] = [];
  private blitzPassesLeft = 0;
  private blitzTimer = 0;
  private opponentLastX: number | undefined;

  constructor(options: FighterOptions) {
    this.scene = options.scene;
    this.app = options.app;
    this.onSpecialStart = options.onSpecialStart;
    this.onSecretStart = options.onSecretStart;
    this.onComboChange = options.onComboChange;
    this.character = getCharacterDefinition(options.characterId);
    this.specialSpec = getSpecialMoveSpec(this.character.id);
    this.secretSpec = getSecretMoveSpec(this.character.id);
    this.facing = options.facing;
    this.minX = options.minX;
    this.maxX = options.maxX;
    this.groundY = options.groundY;
    this.posX = Phaser.Math.Clamp(options.x, options.minX, options.maxX);
    this.actionKeys = this.resolveActionKeys();
    this.hasSpecial = findCharacterAnimationKeyByAction(this.character.id, 'special') !== null;
    this.maxHealth = this.combat().maxHealth;
    this.health = this.maxHealth;
    this.build(options.depth ?? 5);
  }

  get characterId(): string {
    return this.character.id;
  }

  get label(): string {
    return this.character.label;
  }

  get x(): number {
    return this.posX;
  }

  get facingDirection(): 1 | -1 {
    return this.facing;
  }

  get health01(): number {
    return this.maxHealth > 0 ? Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1) : 0;
  }

  get isDefeated(): boolean {
    return this.defeated;
  }

  get meter01(): number {
    return METER_MAX > 0 ? Phaser.Math.Clamp(this.meter / METER_MAX, 0, 1) : 0;
  }

  get cooldownRemainingSeconds(): number {
    return this.specialCooldownTimer;
  }

  get isMeterReady(): boolean {
    return this.hasSpecial && this.specialCooldownTimer <= 0 && this.meter >= METER_MAX;
  }

  get isSecretReady(): boolean {
    if (!this.hasSpecial || this.specialCooldownTimer > 0) {
      return false;
    }

    return (
      (this.comboHits >= SECRET_COMBO_MIN_HITS && this.meter >= SECRET_COMBO_MIN_METER) ||
      (this.comboHits >= SECRET_HIGH_COMBO_HITS && this.meter >= SECRET_HIGH_COMBO_METER)
    );
  }

  get isAttacking(): boolean {
    return this.currentAttackKind() !== null || this.specialZones.length > 0;
  }

  get isAirborne(): boolean {
    return !this.grounded;
  }

  get isBlocking(): boolean {
    return (
      this.currentAnimKey === this.actionKeys.blockHigh ||
      this.currentAnimKey === this.actionKeys.blockLow
    );
  }

  getSpecialSpec(): SpecialMoveSpec {
    return this.specialSpec;
  }

  gainMeter(amount: number): void {
    if (this.defeated) {
      return;
    }

    this.meter = Phaser.Math.Clamp(this.meter + amount, 0, METER_MAX);
  }

  registerOffense(blocked: boolean, isSpecial: boolean): void {
    if (isSpecial) {
      return;
    }

    this.gainMeter(blocked ? METER_GAIN_ON_BLOCK : METER_GAIN_ON_HIT);
    if (!blocked) {
      this.comboHits += 1;
      this.comboTimer = 2.2;
      if (this.comboHits >= 2) {
        this.onComboChange?.(this, this.comboHits);
      }
    }
  }

  registerDefense(blocked: boolean): void {
    this.gainMeter(blocked ? METER_GAIN_ON_BLOCK : METER_GAIN_ON_TAKE);
  }

  fillMeter(): void {
    this.meter = METER_MAX;
  }

  regenHealth(amount: number): void {
    if (!this.defeated) {
      this.health = Math.min(this.maxHealth, this.health + amount);
    }
  }

  setVisualScale(scale: number): void {
    if (this.appliedScale === scale) {
      return;
    }

    this.appliedScale = scale;
    this.sprite.setScale(scale);
    this.shadow.setSize(Math.round(107 * scale), Math.round(24 * scale));
    this.shadow.y = this.groundY - SHADOW_FOOT_OFFSET * scale;
    this.updateShadow();
  }

  setDepthBase(base: number): void {
    if (this.depthBase === base) {
      return;
    }

    this.depthBase = base;
    this.applyDepths();
  }

  faceToward(targetX: number): void {
    this.opponentLastX = targetX;
    if (this.locked) {
      return;
    }

    const delta = targetX - this.posX;
    if (Math.abs(delta) < 12) {
      return;
    }

    const desired: 1 | -1 = delta >= 0 ? 1 : -1;
    if (desired !== this.facing) {
      this.facing = desired;
      this.sprite.setFlipX(this.facing === 1);
    }
  }

  setFrozen(frozen: boolean): void {
    this.frozen = frozen;
  }

  setHorizontalBounds(minX: number, maxX: number): void {
    this.minX = minX;
    this.maxX = Math.max(minX, maxX);
    this.posX = Phaser.Math.Clamp(this.posX, this.minX, this.maxX);
    this.sprite.x = this.posX;
    this.shadow.x = this.posX;
  }

  getActiveAttack(): ActiveAttack | null {
    const attacks = this.getActiveAttacks();
    return attacks[0] ?? null;
  }

  /**
   * Returns all currently active attacks (normal melee swing plus any active
   * special projectiles, beams, or eruption zones ready to tick).
   */
  getActiveAttacks(): ActiveAttack[] {
    if (this.defeated) {
      return [];
    }

    const results: ActiveAttack[] = [];

    if (!this.attackConnected) {
      const kind = this.currentAttackKind();
      if (kind !== null && kind !== 'special') {
        const animation = this.currentAnimation();
        if (animation) {
          const frame = this.resolvedFrame(animation);
          if (frame?.attack) {
            results.push({
              rect: this.frameRectToWorld(animation, frame.attack),
              profile: getAttackProfile(this.combat(), kind),
              signature: this.attackId,
              finisher: false
            });
          }
        }
      }
    }

    for (const zone of this.specialZones) {
      if (zone.hitsRemaining > 0 && zone.tickCooldown <= 0) {
        results.push({
          rect: new Phaser.Geom.Rectangle(
            zone.x - zone.width / 2,
            zone.y - zone.height / 2,
            zone.width,
            zone.height
          ),
          profile: {
            kind: 'special',
            height: 'high',
            damage: zone.damage,
            knockback: zone.knockback,
            hitstun: zone.hitstun,
            finisher: zone.hitsRemaining === 1
          },
          signature: zone.signature,
          finisher: zone.hitsRemaining === 1
        });
      }
    }

    return results;
  }

  /** Marks an attack signature as having connected on this frame. */
  markAttackConnected(signature?: number): void {
    if (signature === undefined || signature === this.attackId) {
      this.attackConnected = true;
    }

    const zone = this.specialZones.find((z) => z.signature === signature);
    if (zone) {
      zone.hitsRemaining = Math.max(0, zone.hitsRemaining - 1);
      zone.tickCooldown = zone.tickInterval;
      if (zone.hitsRemaining === 0 && zone.vx !== 0) {
        zone.life = Math.min(zone.life, 0.08);
      }
    }
  }

  flashHit(blocked: boolean): void {
    this.sprite.setTint(blocked ? 0x93c5fd : 0xff7a7a);
    this.scene.time.delayedCall(100, () => this.sprite?.clearTint());
  }

  getHurtRect(): Phaser.Geom.Rectangle | null {
    const animation = this.currentAnimation();
    if (!animation) {
      return null;
    }

    const frame = this.resolvedFrame(animation);
    const rect = frame?.hit ?? frame?.visual;

    return rect ? this.frameRectToWorld(animation, rect) : null;
  }

  getGuardRect(): Phaser.Geom.Rectangle | null {
    if (this.defeated) {
      return null;
    }

    const animation = this.currentAnimation();
    if (!animation) {
      return null;
    }

    const frame = this.resolvedFrame(animation);

    return frame?.guard ? this.frameRectToWorld(animation, frame.guard) : null;
  }

  applyHit(profile: AttackProfile, attackerFacing: 1 | -1, blocked: boolean): void {
    if (this.defeated) {
      return;
    }

    const settings = this.app.settingsStore.getState();

    if (blocked) {
      this.knockbackVel = attackerFacing * profile.knockback * 0.35;
      this.hitstunTimer = Math.max(this.hitstunTimer, BLOCKSTUN_SECONDS);
      this.stunIsBlock = true;
      this.stunBlockLow = this.currentAnimKey === this.actionKeys.blockLow;
      this.locked = false;
      this.dashTimer = 0;
      playCombatSfx('block', settings);
      return;
    }

    this.health = Math.max(0, this.health - profile.damage);
    this.knockbackVel = attackerFacing * profile.knockback;
    this.queuedComboHeavy = false;
    this.comboHits = 0;
    this.comboTimer = 0;
    this.dashTimer = 0;
    this.blitzPassesLeft = 0;

    if (this.health <= 0) {
      this.defeated = true;
      this.locked = true;
      this.stunIsBlock = false;
      this.hitstunTimer = 0;
      this.playState(this.actionKeys.knockdown, false);
      playCombatSfx('ko', settings);
      return;
    }

    playCombatSfx(profile.kind === 'high' ? 'light' : 'heavy', settings);
    this.stunIsBlock = false;
    this.locked = false;
    this.hitstunTimer = profile.hitstun / 1000;
    this.currentAnimKey = '';
    this.playState(this.actionKeys.hitHigh, false);
  }

  resetForRound(x: number, facing: 1 | -1): void {
    this.clearSpecialZones();
    this.posX = Phaser.Math.Clamp(x, this.minX, this.maxX);
    this.facing = facing;
    this.maxHealth = this.combat().maxHealth;
    this.health = this.maxHealth;
    this.velocityY = 0;
    this.grounded = true;
    this.locked = false;
    this.defeated = false;
    this.frozen = true;
    this.hitstunTimer = 0;
    this.stunIsBlock = false;
    this.stunBlockLow = false;
    this.knockbackVel = 0;
    this.attackConnected = true;
    this.attackActiveLast = false;
    this.queuedComboHeavy = false;
    this.comboHits = 0;
    this.comboTimer = 0;
    this.dashVelX = 0;
    this.dashTimer = 0;
    this.blitzPassesLeft = 0;
    this.meter = METER_START;
    this.specialCooldownTimer = 0;
    this.currentAnimKey = '';
    this.currentReverse = false;

    this.sprite.setPosition(this.posX, this.groundY).setFlipX(this.facing === 1);
    this.sprite.clearTint();
    this.playState(this.actionKeys.idle, true);
    this.updateShadow();
  }

  update(seconds: number, input: FighterInput, opponentX?: number): void {
    if (opponentX !== undefined) {
      this.opponentLastX = opponentX;
    }

    this.updateSpecialZones(seconds);

    if (this.defeated) {
      this.playState(this.actionKeys.knockdown, false);
      if (this.sprite.y < this.groundY || !this.grounded) {
        this.velocityY += this.stats().gravity * seconds;
        this.sprite.y = Math.min(this.groundY, this.sprite.y + this.velocityY * seconds);
        if (this.sprite.y >= this.groundY) {
          this.sprite.y = this.groundY;
          this.velocityY = 0;
          this.grounded = true;
        }
      }
      this.applyKnockback(seconds);
      this.updateShadow();
      this.drawBoundsOverlay();
      return;
    }

    if (this.frozen) {
      this.playState(this.actionKeys.idle, true);
      this.drawBoundsOverlay();
      return;
    }

    if (this.specialCooldownTimer > 0) {
      this.specialCooldownTimer = Math.max(0, this.specialCooldownTimer - seconds);
    }

    // Passive meter trickle during live fighting
    this.gainMeter(METER_PASSIVE_PER_SEC * seconds);

    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - seconds);
      if (this.comboTimer === 0) {
        this.comboHits = 0;
      }
    }

    // Handle active special dashes / blitz passes
    this.updateSpecialMotion(seconds);

    if (this.hitstunTimer > 0) {
      this.hitstunTimer = Math.max(0, this.hitstunTimer - seconds);
      this.applyKnockback(seconds);
      this.playState(
        this.stunIsBlock
          ? this.stunBlockLow
            ? this.actionKeys.blockLow
            : this.actionKeys.blockHigh
          : this.actionKeys.hitHigh,
        false
      );
      this.updateShadow();

      if (this.hitstunTimer === 0) {
        this.currentAnimKey = '';
      }

      this.drawBoundsOverlay();
      return;
    }

    // Combo-cancel directly from landed Light/Heavy into Hidden Secret Art
    if (
      this.locked &&
      (this.currentAnimKey === this.actionKeys.lightPunch || this.currentAnimKey === this.actionKeys.heavy) &&
      input.special &&
      this.isSecretReady
    ) {
      this.sprite.removeAllListeners(`animationcomplete-${this.currentAnimKey}`);
      this.startSpecial(true);
      this.drawBoundsOverlay();
      return;
    }

    // One-button auto-combo: pressing light while mid-lightPunch queues heavy!
    if (this.locked && this.currentAnimKey === this.actionKeys.lightPunch && input.light) {
      this.queuedComboHeavy = true;
    }

    if (!this.grounded) {
      this.updateAirborne(seconds, input);
    } else if (!this.locked) {
      this.updateGrounded(seconds, input);
    }

    this.updateAttackWindow();
    this.drawBoundsOverlay();
  }

  destroy(): void {
    this.clearSpecialZones();
    this.sprite?.removeAllListeners();
    this.sprite?.destroy();
    this.shadow?.destroy();
    this.boundsGraphics?.destroy();
  }

  private resolveActionKeys(): FighterActionKeys {
    const key = (action: string): string =>
      findCharacterAnimationKeyByAction(this.character.id, action) ?? this.character.animations[0].key;

    return {
      idle: key('idle'),
      walkForward: key('walk-forward'),
      walkBackward: key('walk-backward'),
      crouch: key('crouch'),
      jump: key('jump'),
      blockHigh: key('block-high'),
      blockLow: findCharacterAnimationKeyByAction(this.character.id, 'block-low') ?? key('block-high'),
      hitHigh: key('hit-high'),
      lightPunch: key('light-punch'),
      heavy:
        findCharacterAnimationKeyByAction(this.character.id, 'heavy-kick') ??
        findCharacterAnimationKeyByAction(this.character.id, 'heavy-punch') ??
        key('light-punch'),
      specialCharge: findCharacterAnimationKeyByAction(this.character.id, 'special-charge') ?? key('crouch'),
      special: findCharacterAnimationKeyByAction(this.character.id, 'special') ?? key('heavy-kick'),
      knockdown: key('knockdown')
    };
  }

  private stats(): FighterStats {
    return getFighterStats(this.app.debugStore.getState().fighterPlayground, this.character.id);
  }

  private combat(): FighterCombat {
    return getFighterCombat(this.app.debugStore.getState().fighterPlayground, this.character.id);
  }

  private currentAttackKind(): AttackKind | null {
    if (!this.locked) {
      return null;
    }
    if (this.currentAnimKey === this.actionKeys.lightPunch) {
      return 'high';
    }
    if (this.currentAnimKey === this.actionKeys.heavy) {
      return 'low';
    }
    if (this.currentAnimKey === this.actionKeys.special) {
      return 'special';
    }

    return null;
  }

  private currentAnimation(): HeroAnimationDefinition | null {
    const animKey = this.sprite.anims.currentAnim?.key ?? this.currentAnimKey;
    if (!animKey) {
      return null;
    }

    return getCharacterAnimationDefinition(this.character.id, animKey);
  }

  private applyKnockback(seconds: number): void {
    if (this.knockbackVel === 0) {
      return;
    }

    this.posX = Phaser.Math.Clamp(this.posX + this.knockbackVel * seconds, this.minX, this.maxX);
    this.sprite.x = this.posX;

    const decay = KNOCKBACK_FRICTION * seconds;
    this.knockbackVel =
      this.knockbackVel > 0
        ? Math.max(0, this.knockbackVel - decay)
        : Math.min(0, this.knockbackVel + decay);
  }

  private build(depth: number): void {
    const scale = this.stats().scale;
    this.appliedScale = scale;
    this.depthBase = depth;

    this.shadow = this.scene.add
      .ellipse(
        this.posX,
        this.groundY - SHADOW_FOOT_OFFSET * scale,
        Math.round(107 * scale),
        Math.round(24 * scale),
        0x000000,
        1
      )
      .setAlpha(0.32)
      .setDepth(depth - 1);

    this.sprite = this.scene.add
      .sprite(this.posX, this.groundY, this.actionKeys.idle, 0)
      .setOrigin(0.5, this.character.anchor.y)
      .setScale(scale)
      .setFlipX(this.facing === 1)
      .setDepth(depth);

    this.boundsGraphics = this.scene.add.graphics().setDepth(depth + 45);

    this.playState(this.actionKeys.idle, true);
  }

  private applyDepths(): void {
    this.shadow.setDepth(this.depthBase - 1);
    this.sprite.setDepth(this.depthBase);
    this.boundsGraphics.setDepth(this.depthBase + 45);
  }

  private updateAirborne(seconds: number, input: FighterInput): void {
    const stats = this.stats();
    this.velocityY += stats.gravity * seconds;
    let nextY = this.sprite.y + this.velocityY * seconds;

    const drift = this.horizontalDirection(input);
    if (drift !== 0) {
      this.posX = Phaser.Math.Clamp(this.posX + drift * stats.airDrift * seconds, this.minX, this.maxX);
      this.sprite.x = this.posX;
    }

    if (nextY >= this.groundY) {
      nextY = this.groundY;
      this.velocityY = 0;
      this.grounded = true;
      this.currentAnimKey = '';
      this.currentReverse = false;
    }

    this.sprite.y = nextY;
    this.updateShadow();
  }

  private updateGrounded(seconds: number, input: FighterInput): void {
    if (input.special) {
      if (this.isSecretReady) {
        this.startSpecial(true);
        return;
      }
      if (this.isMeterReady) {
        this.startSpecial(false);
        return;
      }
    }
    if (input.jump) {
      this.startJump();
      return;
    }
    if (input.light) {
      this.startOneShot(this.actionKeys.lightPunch);
      return;
    }
    if (input.heavy) {
      this.startOneShot(this.actionKeys.heavy);
      return;
    }
    if (input.block) {
      this.playState(input.crouch ? this.actionKeys.blockLow : this.actionKeys.blockHigh, false);
      return;
    }
    if (input.crouch) {
      this.playState(this.actionKeys.crouch, false);
      return;
    }

    const direction = this.horizontalDirection(input);
    if (direction !== 0) {
      const stats = this.stats();
      this.posX = Phaser.Math.Clamp(this.posX + direction * stats.walkSpeed * seconds, this.minX, this.maxX);
      this.sprite.x = this.posX;
      this.updateShadow();
      this.playWalk(direction === this.facing);
      return;
    }

    this.playState(this.actionKeys.idle, true);
  }

  private horizontalDirection(input: FighterInput): number {
    return (input.right ? 1 : 0) - (input.left ? 1 : 0);
  }

  private playState(animKey: string, loop: boolean, reverse = false): void {
    if (this.currentAnimKey === animKey && this.currentReverse === reverse) {
      return;
    }

    this.currentAnimKey = animKey;
    this.currentReverse = reverse;

    const config: Phaser.Types.Animations.PlayAnimationConfig = { key: animKey, repeat: loop ? -1 : 0 };
    if (reverse) {
      this.sprite.playReverse(config, false);
    } else {
      this.sprite.play(config, false);
    }
  }

  private playWalk(movingForward: boolean): void {
    if (movingForward) {
      this.playState(this.actionKeys.walkForward, true);
      return;
    }

    const reverseWalk = this.app.debugStore.getState().fighterPlayground.reverseWalk;
    if (reverseWalk) {
      this.playState(this.actionKeys.walkForward, true, true);
      return;
    }

    this.playState(this.actionKeys.walkBackward, true);
  }

  private startOneShot(animKey: string): void {
    this.locked = true;
    this.queuedComboHeavy = false;
    this.currentAnimKey = animKey;
    this.currentReverse = false;
    this.attackId += 1;
    this.attackConnected = false;
    this.sprite.removeAllListeners(`animationcomplete-${animKey}`);
    this.sprite.play({ key: animKey, repeat: 0 }, true);
    this.sprite.once(`animationcomplete-${animKey}`, () => {
      if (this.defeated) {
        return;
      }

      if (animKey === this.actionKeys.lightPunch && this.queuedComboHeavy) {
        this.queuedComboHeavy = false;
        this.startOneShot(this.actionKeys.heavy);
        return;
      }

      this.locked = false;
      this.currentAnimKey = '';

      if (this.grounded) {
        this.playState(this.actionKeys.idle, true);
      }
    });
  }

  private startSpecial(isSecret = false): void {
    this.locked = true;
    this.queuedComboHeavy = false;
    this.comboHits = 0;
    this.comboTimer = 0;
    this.meter = 0;
    this.currentReverse = false;
    this.attackConnected = true;
    this.attackActiveLast = false;

    const settings = this.app.settingsStore.getState();
    playCombatSfx('charge', settings);

    if (isSecret) {
      playCharacterVoice(this.character.id, 'secret', settings);
      this.onSecretStart?.(this, this.secretSpec);
    } else {
      playCharacterVoice(this.character.id, 'special', settings);
      this.onSpecialStart?.(this);
    }

    spawnChargeAura(
      this.scene,
      this.sprite.x,
      this.sprite.y - this.sprite.displayHeight * 0.45,
      isSecret ? this.secretSpec.vfxColor : this.specialSpec.vfxColor
    );

    this.currentAnimKey = this.actionKeys.specialCharge;
    this.sprite.removeAllListeners(`animationcomplete-${this.actionKeys.specialCharge}`);
    this.sprite.play({ key: this.actionKeys.specialCharge, repeat: 0 }, true);
    this.sprite.once(`animationcomplete-${this.actionKeys.specialCharge}`, () => {
      if (this.defeated) {
        return;
      }

      this.scene.time.delayedCall(isSecret ? SUPER_FREEZE_MS + 80 : SUPER_FREEZE_MS, () => {
        if (!this.defeated) {
          this.executeSpecial(isSecret);
        }
      });
    });
  }

  private executeSpecial(isSecret = false): void {
    this.currentAnimKey = this.actionKeys.special;
    this.attackId += 1;
    this.attackConnected = true;
    this.attackActiveLast = false;
    this.sprite.removeAllListeners(`animationcomplete-${this.actionKeys.special}`);
    this.sprite.play({ key: this.actionKeys.special, repeat: 0 }, true);

    const settings = this.app.settingsStore.getState();
    if (isSecret) {
      this.specialCooldownTimer = getSecretCooldownSeconds(this.secretSpec);
      playCombatSfx('secret', settings);
      this.launchSecretArchetype();
    } else {
      this.specialCooldownTimer = getSpecialCooldownSeconds(this.specialSpec);
      playCombatSfx('special', settings);
      this.launchSpecialArchetype();
    }

    this.sprite.once(`animationcomplete-${this.actionKeys.special}`, () => {
      this.locked = false;
      this.dashTimer = 0;
      this.dashVelX = 0;
      this.blitzPassesLeft = 0;
      this.currentAnimKey = '';

      if (this.grounded) {
        this.playState(this.actionKeys.idle, true);
      }
    });
  }

  private launchSecretArchetype(): void {
    const spec = this.secretSpec;
    const midY = this.groundY - 120;
    const dir = this.facing;
    const targetX = this.opponentLastX ?? this.posX + dir * 240;

    switch (spec.archetype) {
      case 'domain-expansion': {
        spawnDomainExpansionVfx(this.scene, this.posX, this.groundY, spec.themeColor, spec.secondaryColor);
        this.scene.cameras.main.shake(460, 0.016);
        this.addSpecialZone({
          x: (this.posX + targetX) / 2,
          y: midY - 20,
          width: spec.range,
          height: 290,
          vx: 0,
          vy: 0,
          life: 1.05,
          tickInterval: 0.16,
          hitsRemaining: spec.hits,
          damage: spec.damage,
          knockback: spec.knockback,
          hitstun: spec.hitstun
        });
        break;
      }

      case 'tailed-beast': {
        spawnTailedBeastVfx(this.scene, this.posX, this.groundY, dir, spec.themeColor, spec.secondaryColor);
        this.dashVelX = dir * 480;
        this.dashTimer = 0.52;
        const startX = this.posX + dir * 72;
        const container = this.scene.add.container(startX, midY - 16).setDepth(92);
        const aura = this.scene.add.circle(0, 0, 74, spec.themeColor, 0.35).setStrokeStyle(5, spec.secondaryColor, 0.95);
        const bomb = this.scene.add.circle(0, 0, 50, 0x111827, 0.92).setStrokeStyle(6, spec.themeColor, 1);
        const core = this.scene.add.circle(0, 0, 24, spec.secondaryColor, 0.95);
        container.add([aura, bomb, core]);
        this.scene.tweens.add({
          targets: aura,
          scale: 1.25,
          duration: 140,
          yoyo: true,
          repeat: -1
        });
        this.scene.cameras.main.shake(380, 0.014);

        this.addSpecialZone({
          x: startX,
          y: midY - 16,
          width: 175,
          height: 175,
          vx: dir * 680,
          vy: 0,
          life: 1.25,
          tickInterval: 0.11,
          hitsRemaining: spec.hits,
          damage: spec.damage,
          knockback: spec.knockback,
          hitstun: spec.hitstun,
          visual: container
        });
        break;
      }

      case 'reality-slash': {
        const jumpX = Phaser.Math.Clamp(targetX - dir * 95, this.minX, this.maxX);
        this.posX = jumpX;
        this.sprite.x = this.posX;
        this.updateShadow();
        this.dashVelX = dir * 320;
        this.dashTimer = 0.4;
        spawnRealitySlashVfx(this.scene, targetX, this.groundY, spec.themeColor, spec.secondaryColor);
        this.scene.cameras.main.shake(360, 0.015);
        this.addSpecialZone({
          x: targetX,
          y: midY - 10,
          width: spec.range,
          height: 220,
          vx: 0,
          vy: 0,
          life: 0.78,
          tickInterval: 0.12,
          hitsRemaining: spec.hits,
          damage: spec.damage,
          knockback: spec.knockback,
          hitstun: spec.hitstun
        });
        break;
      }

      case 'cataclysm-burst': {
        this.dashVelX = dir * 420;
        this.dashTimer = 0.4;
        spawnCataclysmBurstVfx(this.scene, this.posX, this.groundY, dir, spec.themeColor, spec.secondaryColor);
        this.scene.cameras.main.shake(420, 0.018);
        this.addSpecialZone({
          x: this.posX + dir * (spec.range * 0.45),
          y: midY - 25,
          width: spec.range,
          height: 240,
          vx: dir * 240,
          vy: 0,
          life: 0.85,
          tickInterval: 0.13,
          hitsRemaining: spec.hits,
          damage: spec.damage,
          knockback: spec.knockback,
          hitstun: spec.hitstun
        });
        break;
      }
    }
  }

  private launchSpecialArchetype(): void {
    const spec = this.specialSpec;
    const midY = this.groundY - 120;
    const dir = this.facing;

    switch (spec.archetype) {
      case 'beam': {
        const originX = this.posX + dir * 48;
        spawnBeamVfx(this.scene, originX, midY - 12, dir, spec.range, spec.themeColor, spec.secondaryColor, 580);
        this.addSpecialZone({
          x: originX + dir * (spec.range / 2),
          y: midY - 12,
          width: spec.range,
          height: 112,
          vx: 0,
          vy: 0,
          life: 0.56,
          tickInterval: 0.1,
          hitsRemaining: spec.hits,
          damage: spec.damage,
          knockback: spec.knockback,
          hitstun: spec.hitstun
        });
        break;
      }

      case 'void-orb': {
        const startX = this.posX + dir * 70;
        const container = this.scene.add.container(startX, midY - 16).setDepth(90);
        const outer = this.scene.add.circle(0, 0, 58, spec.themeColor, 0.72).setStrokeStyle(5, 0xffffff, 0.9);
        const inner = this.scene.add.circle(0, 0, 32, 0x090d1a, 0.95).setStrokeStyle(3, spec.secondaryColor, 1);
        container.add([outer, inner]);
        this.scene.tweens.add({
          targets: outer,
          scale: 1.18,
          duration: 180,
          yoyo: true,
          repeat: -1
        });

        this.addSpecialZone({
          x: startX,
          y: midY - 16,
          width: 130,
          height: 130,
          vx: dir * spec.speed,
          vy: 0,
          life: 1.75,
          tickInterval: 0.14,
          hitsRemaining: spec.hits,
          damage: spec.damage,
          knockback: spec.knockback,
          hitstun: spec.hitstun,
          visual: container
        });
        break;
      }

      case 'orb-dash': {
        this.dashVelX = dir * spec.speed;
        this.dashTimer = 0.52;
        const startX = this.posX + dir * 64;
        const container = this.scene.add.container(startX, midY - 10).setDepth(90);
        const orb = this.scene.add.circle(0, 0, 44, spec.secondaryColor, 0.8).setStrokeStyle(4, 0xffffff, 0.95);
        const ring = this.scene.add.circle(0, 0, 56, spec.themeColor, 0).setStrokeStyle(3, spec.themeColor, 0.9);
        container.add([orb, ring]);

        this.addSpecialZone({
          x: startX,
          y: midY - 10,
          width: 120,
          height: 120,
          vx: dir * spec.speed,
          vy: 0,
          life: 0.56,
          tickInterval: 0.095,
          hitsRemaining: spec.hits,
          damage: spec.damage,
          knockback: spec.knockback,
          hitstun: spec.hitstun,
          visual: container
        });
        break;
      }

      case 'rush-barrage': {
        this.dashVelX = dir * (spec.speed * 0.72);
        this.dashTimer = 0.58;
        const zoneX = this.posX + dir * 88;
        const container = this.scene.add.container(zoneX, midY - 10).setDepth(90);
        for (let i = 0; i < 4; i += 1) {
          const fist = this.scene.add.circle(
            dir * (i * 18 - 10),
            (i - 1.5) * 18,
            16,
            i % 2 === 0 ? spec.themeColor : spec.secondaryColor,
            0.82
          );
          container.add(fist);
        }
        this.scene.tweens.add({
          targets: container,
          scaleX: 1.25,
          duration: 80,
          yoyo: true,
          repeat: 6
        });

        this.addSpecialZone({
          x: zoneX,
          y: midY - 10,
          width: 170,
          height: 130,
          vx: dir * (spec.speed * 0.72),
          vy: 0,
          life: 0.62,
          tickInterval: 0.09,
          hitsRemaining: spec.hits,
          damage: spec.damage,
          knockback: spec.knockback,
          hitstun: spec.hitstun,
          visual: container
        });
        break;
      }

      case 'slash-wave': {
        this.dashVelX = dir * 420;
        this.dashTimer = 0.22;
        const waveX = this.posX + dir * 70;
        const container = this.scene.add.container(waveX, midY - 18).setDepth(90);
        const arc = this.scene.add
          .ellipse(0, 0, 56, 150, spec.themeColor, 0.85)
          .setStrokeStyle(5, spec.secondaryColor, 1);
        const inner = this.scene.add.ellipse(dir * 6, 0, 22, 126, 0xffffff, 0.9);
        container.add([arc, inner]);

        this.addSpecialZone({
          x: waveX,
          y: midY - 18,
          width: 96,
          height: 165,
          vx: dir * spec.speed,
          vy: 0,
          life: 1.05,
          tickInterval: 0.14,
          hitsRemaining: spec.hits,
          damage: spec.damage,
          knockback: spec.knockback,
          hitstun: spec.hitstun,
          visual: container
        });
        break;
      }

      case 'one-punch': {
        const originX = this.posX + dir * 45;
        this.dashVelX = dir * 320;
        this.dashTimer = 0.15;
        spawnShockwaveConeVfx(this.scene, originX, midY - 15, dir, spec.range, spec.themeColor);
        this.scene.cameras.main.shake(300, 0.018);

        this.addSpecialZone({
          x: originX + dir * (spec.range / 2),
          y: midY - 15,
          width: spec.range,
          height: 160,
          vx: 0,
          vy: 0,
          life: 0.25,
          tickInterval: 0.25,
          hitsRemaining: 1,
          damage: spec.damage,
          knockback: spec.knockback,
          hitstun: spec.hitstun
        });
        break;
      }

      case 'teleport-eruption': {
        spawnTeleportFlameVfx(this.scene, this.posX, this.groundY - 70, spec.themeColor);
        const targetX = this.opponentLastX ?? this.posX + dir * 240;
        const behindOffset = targetX > this.posX ? 110 : -110;
        let nextX = targetX + behindOffset;
        if (nextX < this.minX + 30 || nextX > this.maxX - 30) {
          nextX = targetX - behindOffset;
        }
        this.posX = Phaser.Math.Clamp(nextX, this.minX, this.maxX);
        this.sprite.x = this.posX;
        this.facing = targetX >= this.posX ? 1 : -1;
        this.sprite.setFlipX(this.facing === 1);
        this.updateShadow();
        spawnTeleportFlameVfx(this.scene, this.posX, this.groundY - 70, spec.secondaryColor);

        spawnHellfirePillarVfx(this.scene, targetX, this.groundY, spec.themeColor, spec.secondaryColor);
        this.addSpecialZone({
          x: targetX,
          y: this.groundY - 125,
          width: 140,
          height: 250,
          vx: 0,
          vy: 0,
          life: 0.54,
          tickInterval: 0.14,
          hitsRemaining: spec.hits,
          damage: spec.damage,
          knockback: spec.knockback,
          hitstun: spec.hitstun
        });
        break;
      }

      case 'chain-whirlwind': {
        this.dashVelX = dir * 350;
        this.dashTimer = 0.48;
        spawnChainArcVfx(this.scene, this.posX + dir * 40, midY - 10, spec.themeColor, 115);
        this.addSpecialZone({
          x: this.posX + dir * 35,
          y: midY - 10,
          width: 220,
          height: 150,
          vx: dir * 350,
          vy: 0,
          life: 0.56,
          tickInterval: 0.12,
          hitsRemaining: spec.hits,
          damage: spec.damage,
          knockback: spec.knockback,
          hitstun: spec.hitstun
        });
        break;
      }

      case 'ricochet-blitz': {
        this.blitzPassesLeft = spec.hits;
        this.blitzTimer = 0;
        this.dashVelX = dir * spec.speed;
        this.dashTimer = 0.16 * spec.hits;
        this.addSpecialZone({
          x: this.posX,
          y: midY - 10,
          width: 135,
          height: 130,
          vx: 0,
          vy: 0,
          life: 0.16 * spec.hits + 0.05,
          tickInterval: 0.14,
          hitsRemaining: spec.hits,
          damage: spec.damage,
          knockback: spec.knockback,
          hitstun: spec.hitstun
        });
        break;
      }

      case 'rising-cyclone': {
        this.grounded = false;
        this.velocityY = -430;
        this.dashVelX = dir * 160;
        this.dashTimer = 0.42;
        spawnCycloneRingsVfx(this.scene, this.posX + dir * 30, this.groundY, spec.themeColor, spec.secondaryColor);
        this.addSpecialZone({
          x: this.posX + dir * 56,
          y: midY - 24,
          width: 156,
          height: 180,
          vx: dir * 160,
          vy: -120,
          life: 0.56,
          tickInterval: 0.14,
          hitsRemaining: spec.hits,
          damage: spec.damage,
          knockback: spec.knockback,
          hitstun: spec.hitstun
        });
        break;
      }

      case 'ground-shockwave': {
        for (const waveDir of [-1, 1] as const) {
          const container = this.scene.add.container(this.posX + waveDir * 40, this.groundY - 38).setDepth(90);
          const bolt = this.scene.add
            .ellipse(0, 0, 74, 46, spec.themeColor, 0.85)
            .setStrokeStyle(4, spec.secondaryColor, 1);
          container.add(bolt);

          this.addSpecialZone({
            x: this.posX + waveDir * 40,
            y: this.groundY - 38,
            width: 90,
            height: 76,
            vx: waveDir * spec.speed,
            vy: 0,
            life: 0.9,
            tickInterval: 0.14,
            hitsRemaining: 2,
            damage: spec.damage,
            knockback: spec.knockback,
            hitstun: spec.hitstun,
            visual: container
          });
        }
        break;
      }
    }
  }

  private addSpecialZone(zone: Omit<SpecialZoneInstance, 'signature' | 'tickCooldown'>): void {
    this.attackId += 1;
    this.specialZones.push({
      ...zone,
      signature: this.attackId,
      tickCooldown: 0
    });
  }

  private updateSpecialMotion(seconds: number): void {
    if (this.blitzPassesLeft > 0) {
      this.blitzTimer -= seconds;
      if (this.blitzTimer <= 0) {
        this.blitzPassesLeft -= 1;
        this.blitzTimer = 0.15;
        if (this.opponentLastX !== undefined) {
          this.facing = this.opponentLastX >= this.posX ? 1 : -1;
          this.sprite.setFlipX(this.facing === 1);
        }
        this.dashVelX = this.facing * this.specialSpec.speed;
      }
    }

    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - seconds);
      this.posX = Phaser.Math.Clamp(this.posX + this.dashVelX * seconds, this.minX, this.maxX);
      this.sprite.x = this.posX;
      this.updateShadow();

      // Keep attached special zone aligned with sonic blitz or cyclone
      if (this.specialSpec.archetype === 'ricochet-blitz' && this.specialZones.length > 0) {
        const active = this.specialZones[this.specialZones.length - 1];
        active.x = this.posX;
      }

      this.afterimageTimer -= seconds;
      if (this.afterimageTimer <= 0) {
        this.afterimageTimer = 0.065;
        spawnAfterimage(this.scene, this.sprite, this.specialSpec.themeColor);
      }

      if (this.dashTimer === 0) {
        this.dashVelX = 0;
      }
    }
  }

  private updateSpecialZones(seconds: number): void {
    for (let i = this.specialZones.length - 1; i >= 0; i -= 1) {
      const zone = this.specialZones[i];
      zone.life -= seconds;
      zone.tickCooldown = Math.max(0, zone.tickCooldown - seconds);
      zone.x += zone.vx * seconds;
      zone.y += zone.vy * seconds;
      zone.visual?.setPosition(zone.x, zone.y);

      if (zone.life <= 0) {
        zone.visual?.destroy();
        this.specialZones.splice(i, 1);
      }
    }
  }

  private clearSpecialZones(): void {
    this.specialZones.forEach((zone) => zone.visual?.destroy());
    this.specialZones = [];
  }

  private updateAttackWindow(): void {
    const active = this.isAttackActiveFrame();

    if (active && !this.attackActiveLast) {
      this.attackConnected = false;
    }

    this.attackActiveLast = active;
  }

  private isAttackActiveFrame(): boolean {
    const kind = this.currentAttackKind();
    if (kind === null || kind === 'special') {
      return false;
    }

    const animation = this.currentAnimation();
    if (!animation) {
      return false;
    }

    return Boolean(this.resolvedFrame(animation).attack);
  }

  private startJump(): void {
    this.grounded = false;
    this.velocityY = -Math.abs(this.stats().jump);
    this.currentAnimKey = this.actionKeys.jump;
    this.currentReverse = false;
    this.sprite.play({ key: this.actionKeys.jump, repeat: 0 }, true);
    playCombatSfx('jump', this.app.settingsStore.getState());
  }

  private drawBoundsOverlay(): void {
    this.boundsGraphics.clear();

    const bounds = this.app.debugStore.getState().fighterPlayground.bounds;
    if (FIGHTER_BOUNDS_FIELDS.every((field) => !bounds[field.id])) {
      return;
    }

    const animKey = this.sprite.anims.currentAnim?.key ?? this.currentAnimKey;
    if (!animKey) {
      return;
    }

    const animation = getCharacterAnimationDefinition(this.character.id, animKey);
    if (animation.bounds.length === 0) {
      return;
    }

    const boundsFrame = this.resolvedFrame(animation);

    FIGHTER_BOUNDS_FIELDS.forEach((field) => {
      if (!bounds[field.id]) {
        return;
      }

      const active = boundsFrame[field.id];
      const rect = active ?? this.representativeBoundsRect(animation, field.id);
      if (!rect) {
        return;
      }

      this.strokeBoundsRect(animation, rect, BOUNDS_COLORS[field.id], active ? BOUNDS_ALPHA_ACTIVE : BOUNDS_ALPHA_INACTIVE);
    });
  }

  private representativeBoundsRect(
    animation: HeroAnimationDefinition,
    kind: keyof FighterBoundsVisibility
  ): Rect | null {
    for (const frame of animation.bounds) {
      const rect = frame[kind];
      if (rect) {
        return rect;
      }
    }

    return null;
  }

  private strokeBoundsRect(animation: HeroAnimationDefinition, rect: Rect, color: number, alpha: number): void {
    const world = this.frameRectToWorld(animation, rect);

    this.boundsGraphics.fillStyle(color, alpha * 0.18);
    this.boundsGraphics.fillRect(world.x, world.y, world.width, world.height);
    this.boundsGraphics.lineStyle(2, color, alpha);
    this.boundsGraphics.strokeRect(world.x, world.y, world.width, world.height);
  }

  private frameRectToWorld(animation: HeroAnimationDefinition, rect: Rect): Phaser.Geom.Rectangle {
    const frameWidth = animation.sheet.frameWidth;
    const left = this.sprite.x - this.sprite.displayWidth * this.sprite.originX;
    const top = this.sprite.y - this.sprite.displayHeight * this.sprite.originY;
    const scaleX = this.sprite.displayWidth / frameWidth;
    const scaleY = this.sprite.displayHeight / animation.sheet.frameHeight;
    const localX = this.sprite.flipX ? frameWidth - (rect.x + rect.width) : rect.x;

    return new Phaser.Geom.Rectangle(left + localX * scaleX, top + rect.y * scaleY, rect.width * scaleX, rect.height * scaleY);
  }

  private resolvedFrame(animation: HeroAnimationDefinition): HeroBoundsFrame {
    const overrides = this.app.debugStore.getState().characterGym.boundsOverrides;

    return resolveHeroBoundsFrame(animation, this.currentFrameIndex(animation), overrides);
  }

  private currentFrameIndex(animation: HeroAnimationDefinition): number {
    const frameName = Number(this.sprite.frame.name);
    const lastFrame = animation.sheet.frames - 1;

    if (Number.isFinite(frameName)) {
      return Phaser.Math.Clamp(frameName, 0, lastFrame);
    }

    return 0;
  }

  private updateShadow(): void {
    const airborneLift = Phaser.Math.Clamp((this.groundY - this.sprite.y) / 220, 0, 1);

    this.shadow.x = this.posX;
    this.shadow.setScale(1 - airborneLift * 0.45);
    this.shadow.setAlpha(0.32 - airborneLift * 0.18);
  }
}
