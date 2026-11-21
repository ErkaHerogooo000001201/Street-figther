import * as Phaser from 'phaser';

import { FIGHTING_UI_ATLAS_TEXTURE_KEY } from './fightingUiAtlas';

/** Render depth for combat VFX: above fighters, below the HUD. */
const VFX_DEPTH = 90;

/** Tint/spark colour keyed to the kind of impact or special theme. */
export type VfxColor = 'red' | 'gold' | 'blue' | 'purple' | 'emerald' | 'cyan' | 'orange';

const SPARK_FRAME: Record<VfxColor, string> = {
  red: 'icon-hit-red',
  gold: 'icon-hit-gold',
  blue: 'icon-hit-blue',
  purple: 'icon-hit-blue',
  emerald: 'icon-hit-gold',
  cyan: 'icon-hit-blue',
  orange: 'icon-hit-red'
};

export const FLASH_TINT: Record<VfxColor, number> = {
  red: 0xff5a5a,
  gold: 0xffd24a,
  blue: 0x7ec8ff,
  purple: 0xc084fc,
  emerald: 0x34d399,
  cyan: 0x38bdf8,
  orange: 0xfb923c
};

export function spawnHitSpark(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: VfxColor = 'red',
  scale = 1
): void {
  const frame = SPARK_FRAME[color];
  if (!scene.textures.exists(FIGHTING_UI_ATLAS_TEXTURE_KEY)) {
    spawnImpactFlash(scene, x, y, color, 40 * scale);
    return;
  }

  const spark = scene.add
    .image(x, y, FIGHTING_UI_ATLAS_TEXTURE_KEY, frame)
    .setDepth(VFX_DEPTH)
    .setScrollFactor(1)
    .setScale(0.2 * scale)
    .setAngle(Phaser.Math.Between(-30, 30))
    .setAlpha(1);

  scene.tweens.add({
    targets: spark,
    scale,
    alpha: 0,
    duration: 220,
    ease: 'Cubic.Out',
    onComplete: () => spark.destroy()
  });

  spawnImpactFlash(scene, x, y, color, 34 * scale);
}

export function spawnImpactFlash(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: VfxColor,
  radius = 40
): void {
  const ring = scene.add
    .circle(x, y, radius * 0.3, FLASH_TINT[color], 0.55)
    .setDepth(VFX_DEPTH - 1)
    .setScrollFactor(1);

  scene.tweens.add({
    targets: ring,
    scale: 2.4,
    alpha: 0,
    duration: 260,
    ease: 'Cubic.Out',
    onComplete: () => ring.destroy()
  });
}

export function spawnChargeAura(scene: Phaser.Scene, x: number, y: number, color: VfxColor = 'gold'): void {
  for (let index = 0; index < 3; index += 1) {
    const ring = scene.add
      .circle(x, y, 20, FLASH_TINT[color], 0)
      .setStrokeStyle(4, FLASH_TINT[color], 0.9)
      .setDepth(VFX_DEPTH - 1)
      .setScrollFactor(1)
      .setScale(1.7);

    scene.tweens.add({
      targets: ring,
      scale: 0.2,
      alpha: 0,
      delay: index * 110,
      duration: 420,
      ease: 'Sine.In',
      onComplete: () => ring.destroy()
    });
  }
}

export function spawnBeamVfx(
  scene: Phaser.Scene,
  originX: number,
  originY: number,
  facing: 1 | -1,
  range: number,
  color: number,
  secondaryColor: number,
  durationMs = 560
): void {
  const outer = scene.add
    .rectangle(originX, originY, 32, 68, color, 0.72)
    .setOrigin(facing === 1 ? 0 : 1, 0.5)
    .setDepth(VFX_DEPTH);
  const core = scene.add
    .rectangle(originX, originY, 32, 28, 0xffffff, 0.95)
    .setOrigin(facing === 1 ? 0 : 1, 0.5)
    .setDepth(VFX_DEPTH + 1);
  const orb = scene.add
    .circle(originX, originY, 36, secondaryColor, 0.9)
    .setStrokeStyle(4, 0xffffff, 0.9)
    .setDepth(VFX_DEPTH + 1);

  scene.tweens.add({
    targets: [outer, core],
    width: range,
    duration: 130,
    ease: 'Cubic.Out'
  });

  scene.tweens.add({
    targets: [outer, core, orb],
    alpha: 0,
    scaleY: 0.25,
    delay: durationMs - 180,
    duration: 180,
    ease: 'Quad.In',
    onComplete: () => {
      outer.destroy();
      core.destroy();
      orb.destroy();
    }
  });

  for (let i = 0; i < 4; i += 1) {
    const ring = scene.add
      .ellipse(originX + facing * (40 + i * 70), originY, 16, 84, secondaryColor, 0)
      .setStrokeStyle(3, 0xffffff, 0.8)
      .setDepth(VFX_DEPTH + 1);
    scene.tweens.add({
      targets: ring,
      x: originX + facing * (range * 0.85),
      alpha: 0,
      scaleY: 1.4,
      delay: i * 55,
      duration: 320,
      onComplete: () => ring.destroy()
    });
  }
}

export function spawnShockwaveConeVfx(
  scene: Phaser.Scene,
  originX: number,
  originY: number,
  facing: 1 | -1,
  range: number,
  color: number
): void {
  const flash = scene.add.rectangle(
    scene.cameras.main.width / 2,
    scene.cameras.main.height / 2,
    scene.cameras.main.width,
    scene.cameras.main.height,
    0xffffff,
    0.55
  ).setScrollFactor(0).setDepth(VFX_DEPTH + 10);

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 240,
    onComplete: () => flash.destroy()
  });

  for (let i = 0; i < 5; i += 1) {
    const cone = scene.add
      .triangle(
        originX + facing * 30,
        originY,
        0,
        0,
        facing * (120 + i * 75),
        -70 - i * 18,
        facing * (120 + i * 75),
        70 + i * 18,
        i % 2 === 0 ? color : 0xf8fafc,
        0.55 - i * 0.08
      )
      .setDepth(VFX_DEPTH);

    scene.tweens.add({
      targets: cone,
      x: originX + facing * (range * 0.45),
      scaleX: 1.4,
      scaleY: 1.35,
      alpha: 0,
      delay: i * 35,
      duration: 340,
      ease: 'Cubic.Out',
      onComplete: () => cone.destroy()
    });
  }
}

export function spawnHellfirePillarVfx(
  scene: Phaser.Scene,
  x: number,
  groundY: number,
  color: number,
  secondaryColor: number
): void {
  const pillar = scene.add
    .rectangle(x, groundY, 96, 10, color, 0.85)
    .setOrigin(0.5, 1)
    .setDepth(VFX_DEPTH);
  const core = scene.add
    .rectangle(x, groundY, 44, 10, secondaryColor, 0.95)
    .setOrigin(0.5, 1)
    .setDepth(VFX_DEPTH + 1);

  scene.tweens.add({
    targets: [pillar, core],
    height: 310,
    duration: 180,
    ease: 'Cubic.Out'
  });

  scene.tweens.add({
    targets: [pillar, core],
    alpha: 0,
    scaleX: 0.25,
    delay: 320,
    duration: 220,
    onComplete: () => {
      pillar.destroy();
      core.destroy();
    }
  });
}

export function spawnCycloneRingsVfx(
  scene: Phaser.Scene,
  x: number,
  groundY: number,
  color: number,
  secondaryColor: number
): void {
  const pillar = scene.add
    .rectangle(x, groundY, 72, 20, color, 0.48)
    .setOrigin(0.5, 1)
    .setDepth(VFX_DEPTH - 1);
  const core = scene.add
    .rectangle(x, groundY, 28, 20, secondaryColor, 0.82)
    .setOrigin(0.5, 1)
    .setDepth(VFX_DEPTH);

  scene.tweens.add({
    targets: [pillar, core],
    height: 245,
    duration: 150,
    ease: 'Cubic.Out',
    onComplete: () => {
      scene.tweens.add({
        targets: [pillar, core],
        alpha: 0,
        scaleX: 0.2,
        duration: 240,
        onComplete: () => {
          pillar.destroy();
          core.destroy();
        }
      });
    }
  });

  // Clean horizontal shockwave rings rising straight up the impact column (zero spinning leaf-like rectangles)
  for (let i = 0; i < 3; i += 1) {
    const ring = scene.add
      .ellipse(x, groundY - 22 - i * 42, 118 - i * 16, 18, color, 0)
      .setStrokeStyle(4, i % 2 === 0 ? secondaryColor : 0xffffff, 0.92)
      .setDepth(VFX_DEPTH + 1);

    scene.tweens.add({
      targets: ring,
      y: ring.y - 78,
      scaleX: 1.55,
      scaleY: 1.15,
      alpha: 0,
      delay: i * 45,
      duration: 280,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy()
    });
  }
}

export function spawnTeleportFlameVfx(scene: Phaser.Scene, x: number, y: number, color: number): void {
  for (let i = 0; i < 6; i += 1) {
    const flame = scene.add
      .circle(x + Phaser.Math.Between(-24, 24), y + Phaser.Math.Between(-50, 20), Phaser.Math.Between(12, 22), color, 0.85)
      .setDepth(VFX_DEPTH);
    scene.tweens.add({
      targets: flame,
      y: flame.y - 55,
      scale: 0.2,
      alpha: 0,
      duration: 260,
      onComplete: () => flame.destroy()
    });
  }
}

export function spawnAfterimage(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  tint: number
): void {
  const ghost = scene.add
    .sprite(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
    .setOrigin(sprite.originX, sprite.originY)
    .setScale(sprite.scaleX, sprite.scaleY)
    .setFlipX(sprite.flipX)
    .setTint(tint)
    .setAlpha(0.55)
    .setDepth(sprite.depth - 1);

  scene.tweens.add({
    targets: ghost,
    alpha: 0,
    duration: 210,
    onComplete: () => ghost.destroy()
  });
}

export function spawnChainArcVfx(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  radius = 120
): void {
  const arc = scene.add
    .circle(x, y, radius, color, 0.14)
    .setStrokeStyle(6, color, 0.95)
    .setDepth(VFX_DEPTH);
  scene.tweens.add({
    targets: arc,
    scale: 1.35,
    alpha: 0,
    duration: 260,
    ease: 'Cubic.Out',
    onComplete: () => arc.destroy()
  });
}

export function spawnDomainExpansionVfx(
  scene: Phaser.Scene,
  originX: number,
  groundY: number,
  themeColor: number,
  secondaryColor: number
): void {
  const cam = scene.cameras.main;
  const w = cam.width;
  const h = cam.height;

  // Deep domain veil over arena
  const dome = scene.add
    .rectangle(w / 2, h / 2, w, h, 0x030510, 0)
    .setScrollFactor(0)
    .setDepth(4);
  scene.tweens.add({
    targets: dome,
    alpha: 0.78,
    duration: 220,
    ease: 'Cubic.Out',
    onComplete: () => {
      scene.tweens.add({
        targets: dome,
        alpha: 0,
        delay: 1150,
        duration: 420,
        onComplete: () => dome.destroy()
      });
    }
  });

  // Expanding barrier ring from caster
  const barrier = scene.add
    .circle(originX, groundY - 120, 48, themeColor, 0.12)
    .setStrokeStyle(7, secondaryColor, 1)
    .setDepth(VFX_DEPTH);
  scene.tweens.add({
    targets: barrier,
    scale: 18,
    alpha: 0,
    duration: 620,
    ease: 'Cubic.Out',
    onComplete: () => barrier.destroy()
  });

  // Crisp vertical energy pillars & glowing void pulses
  for (let i = 0; i < 10; i += 1) {
    const sx = cam.scrollX + 90 + ((w - 180) * i) / 9;
    const beam = scene.add
      .rectangle(sx, groundY, i % 2 === 0 ? 10 : 6, 480, i % 2 === 0 ? themeColor : secondaryColor, 0.7)
      .setOrigin(0.5, 1)
      .setDepth(VFX_DEPTH + 1);

    scene.tweens.add({
      targets: beam,
      alpha: 0,
      scaleX: 2.1,
      delay: 90 + i * 45,
      duration: 620,
      ease: 'Cubic.Out',
      onComplete: () => beam.destroy()
    });
  }
}

export function spawnTailedBeastVfx(
  scene: Phaser.Scene,
  originX: number,
  groundY: number,
  facing: 1 | -1,
  themeColor: number,
  secondaryColor: number
): void {
  const centerY = groundY - 115;

  // 9 sharp pointed chakra spikes fanning behind the awakened fighter (no wobbling ellipses)
  for (let t = 0; t < 9; t += 1) {
    const spread = (t - 4) * 13;
    const angleDeg = (facing === 1 ? 180 : 0) + (facing === 1 ? -spread : spread);
    const length = 165 + (t % 2) * 38;
    const tail = scene.add
      .triangle(
        originX - facing * 22,
        centerY,
        0,
        -12,
        length,
        0,
        0,
        12,
        t % 2 === 0 ? themeColor : secondaryColor,
        0.88
      )
      .setOrigin(0, 0.5)
      .setAngle(angleDeg)
      .setDepth(VFX_DEPTH - 2);

    scene.tweens.add({
      targets: tail,
      scaleX: 1.32,
      alpha: 0,
      delay: t * 30,
      duration: 580,
      ease: 'Cubic.Out',
      onComplete: () => tail.destroy()
    });
  }

  // Nine-Tails roaring cloak flash
  const cloak = scene.add
    .circle(originX, centerY, 72, themeColor, 0.45)
    .setStrokeStyle(5, secondaryColor, 1)
    .setDepth(VFX_DEPTH - 1);
  scene.tweens.add({
    targets: cloak,
    scale: 1.75,
    alpha: 0,
    duration: 860,
    ease: 'Quad.Out',
    onComplete: () => cloak.destroy()
  });
}

export function spawnRealitySlashVfx(
  scene: Phaser.Scene,
  targetX: number,
  groundY: number,
  themeColor: number,
  secondaryColor: number
): void {
  const centerY = groundY - 120;
  for (let i = 0; i < 10; i += 1) {
    const angle = -65 + i * 16 + Phaser.Math.Between(-8, 8);
    const slash = scene.add
      .rectangle(
        targetX + Phaser.Math.Between(-75, 75),
        centerY + Phaser.Math.Between(-75, 55),
        Phaser.Math.Between(260, 420),
        i % 2 === 0 ? 9 : 5,
        i % 2 === 0 ? 0xffffff : themeColor,
        0.95
      )
      .setStrokeStyle(2, secondaryColor, 0.9)
      .setAngle(angle)
      .setDepth(VFX_DEPTH + 2);

    scene.tweens.add({
      targets: slash,
      scaleX: 1.35,
      scaleY: 0.1,
      alpha: 0,
      delay: i * 55,
      duration: 340,
      ease: 'Cubic.Out',
      onComplete: () => slash.destroy()
    });
  }
}

export function spawnCataclysmBurstVfx(
  scene: Phaser.Scene,
  originX: number,
  groundY: number,
  facing: 1 | -1,
  themeColor: number,
  secondaryColor: number
): void {
  const impactX = originX + facing * 170;
  spawnHellfirePillarVfx(scene, impactX, groundY, themeColor, secondaryColor);
  spawnShockwaveConeVfx(scene, originX + facing * 35, groundY - 125, facing, 560, themeColor);
  spawnCycloneRingsVfx(scene, impactX, groundY, secondaryColor, themeColor);
}

/**
 * Dramatic anime-fighter K.O. finish burst: screen-wide white-to-crimson flash,
 * slamming cinema bars, double expanding shockwave rings, radial speed rays,
 * and flying spark shards centered on the defeated fighter.
 */
export function spawnKoFinishVfx(
  scene: Phaser.Scene,
  x: number,
  groundY: number,
  accentColor = 0xf43f5e
): void {
  const cam = scene.cameras.main;
  const w = cam.width;
  const h = cam.height;
  const impactY = groundY - 96;

  // 1. High-contrast white-into-crimson impact flash with guaranteed auto-destroy
  const whiteFlash = scene.add
    .rectangle(w / 2, h / 2, w, h, 0xffffff, 0.42)
    .setScrollFactor(0)
    .setDepth(VFX_DEPTH + 40);
  scene.tweens.add({
    targets: whiteFlash,
    alpha: 0,
    duration: 180,
    ease: 'Cubic.Out',
    onComplete: () => whiteFlash.destroy()
  });
  scene.time.delayedCall(260, () => {
    if (whiteFlash.scene) {
      whiteFlash.destroy();
    }
  });

  const crimsonVeil = scene.add
    .rectangle(w / 2, h / 2, w, h, accentColor, 0.3)
    .setScrollFactor(0)
    .setDepth(VFX_DEPTH + 39);
  scene.tweens.add({
    targets: crimsonVeil,
    alpha: 0,
    delay: 90,
    duration: 520,
    ease: 'Quad.Out',
    onComplete: () => crimsonVeil.destroy()
  });
  scene.time.delayedCall(720, () => {
    if (crimsonVeil.scene) {
      crimsonVeil.destroy();
    }
  });

  // 2. Cinema letterbox bars slamming in on top & bottom
  const topBar = scene.add.rectangle(w / 2, 0, w, 58, 0x020617, 0.94).setOrigin(0.5, 0).setScrollFactor(0).setDepth(VFX_DEPTH + 41);
  const botBar = scene.add.rectangle(w / 2, h, w, 58, 0x020617, 0.94).setOrigin(0.5, 1).setScrollFactor(0).setDepth(VFX_DEPTH + 41);
  topBar.setScale(1, 0.05);
  botBar.setScale(1, 0.05);
  scene.tweens.add({
    targets: [topBar, botBar],
    scaleY: 1,
    duration: 140,
    ease: 'Cubic.Out',
    onComplete: () => {
      scene.tweens.add({
        targets: [topBar, botBar],
        alpha: 0,
        delay: 980,
        duration: 320,
        onComplete: () => {
          topBar.destroy();
          botBar.destroy();
        }
      });
    }
  });
  scene.time.delayedCall(1600, () => {
    if (topBar.scene) topBar.destroy();
    if (botBar.scene) botBar.destroy();
  });

  // 3. Concentric shockwave rings from KO point
  const ringConfigs = [
    { radius: 34, stroke: 8, color: 0xffffff, endScale: 9.5, delay: 0, duration: 480 },
    { radius: 28, stroke: 6, color: 0xfacc15, endScale: 8.2, delay: 55, duration: 540 },
    { radius: 24, stroke: 5, color: accentColor, endScale: 7.0, delay: 110, duration: 600 }
  ];
  ringConfigs.forEach((cfg) => {
    const ring = scene.add
      .circle(x, impactY, cfg.radius, cfg.color, 0)
      .setStrokeStyle(cfg.stroke, cfg.color, 0.98)
      .setDepth(VFX_DEPTH + 10);
    scene.tweens.add({
      targets: ring,
      scale: cfg.endScale,
      alpha: 0,
      delay: cfg.delay,
      duration: cfg.duration,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy()
    });
  });

  // 4. 12 radial anime speed-rays
  for (let i = 0; i < 12; i += 1) {
    const angleDeg = (360 / 12) * i + Phaser.Math.Between(-8, 8);
    const rayColor = i % 3 === 0 ? 0xffffff : i % 3 === 1 ? 0xfacc15 : accentColor;
    const ray = scene.add
      .rectangle(x, impactY, Phaser.Math.Between(140, 260), i % 2 === 0 ? 8 : 5, rayColor, 0.96)
      .setOrigin(0, 0.5)
      .setAngle(angleDeg)
      .setDepth(VFX_DEPTH + 11);
    scene.tweens.add({
      targets: ray,
      scaleX: 2.2,
      scaleY: 0.15,
      alpha: 0,
      duration: 420 + (i % 3) * 70,
      ease: 'Cubic.Out',
      onComplete: () => ray.destroy()
    });
  }

  // 5. Flying glowing spark shards
  for (let i = 0; i < 16; i += 1) {
    const rad = (Math.PI * 2 * i) / 16 + Phaser.Math.FloatBetween(-0.18, 0.18);
    const dist = Phaser.Math.Between(130, 320);
    const shard = scene.add
      .circle(x, impactY, Phaser.Math.Between(4, 8), i % 2 === 0 ? 0xfacc15 : 0xffffff, 1)
      .setStrokeStyle(2, accentColor, 0.9)
      .setDepth(VFX_DEPTH + 12);
    scene.tweens.add({
      targets: shard,
      x: x + Math.cos(rad) * dist,
      y: impactY + Math.sin(rad) * dist * 0.8,
      scale: 0.15,
      alpha: 0,
      duration: Phaser.Math.Between(380, 620),
      ease: 'Quad.Out',
      onComplete: () => shard.destroy()
    });
  }
}


