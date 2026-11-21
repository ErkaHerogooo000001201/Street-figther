import * as Phaser from 'phaser';

import { getCharacterDefinition } from './hero';
import { getSpecialMoveSpec } from './specialMoves';
import { FLASH_TINT, type VfxColor } from './vfx';

const CUTIN_DEPTH = 250;
const DEPTH_BACKDROP = CUTIN_DEPTH;
const DEPTH_STREAKS = CUTIN_DEPTH + 1;
const DEPTH_PORTRAIT = CUTIN_DEPTH + 2;
const DEPTH_CAPTION = CUTIN_DEPTH + 3;
const DEPTH_LETTERBOX = CUTIN_DEPTH + 4;
const DEPTH_FLASH = CUTIN_DEPTH + 5;

const SLIDE_IN_MS = 230;
const HOLD_MS = 380;
const SLIDE_OUT_MS = 230;
const TOTAL_MS = SLIDE_IN_MS + HOLD_MS + SLIDE_OUT_MS;

const STREAK_COUNT = 14;
const TRAPEZIUM_SLANT = 0.16;

export interface SuperCutInOptions {
  characterId: string;
  side: 'left' | 'right';
  color?: VfxColor;
  moveName?: string;
  themeColor?: number;
  isSecret?: boolean;
  secretTag?: string;
}

export function playSuperCutIn(scene: Phaser.Scene, options: SuperCutInOptions): number {
  const spec = getSpecialMoveSpec(options.characterId);
  const color = options.themeColor ?? spec.themeColor ?? FLASH_TINT[options.color ?? 'gold'];
  const moveName = (options.moveName ?? spec.name).toUpperCase();
  const cam = scene.cameras.main;
  const width = cam.width;
  const height = cam.height;
  const fromLeft = options.side === 'left';
  const layers: Phaser.GameObjects.GameObject[] = [];

  const track = <T extends Phaser.GameObjects.GameObject>(object: T): T => {
    layers.push(object);
    return object;
  };

  const barHeight = Math.round(height * 0.12);
  const outDelay = SLIDE_IN_MS + HOLD_MS;

  // 1) Lightbox dim.
  const lightbox = track(
    scene.add.rectangle(width / 2, height / 2, width, height, 0x05070d, 0).setScrollFactor(0).setDepth(DEPTH_BACKDROP)
  );
  scene.tweens.add({ targets: lightbox, alpha: 0.65, duration: SLIDE_IN_MS, ease: 'Quad.Out' });
  scene.tweens.add({ targets: lightbox, alpha: 0, delay: outDelay, duration: SLIDE_OUT_MS, ease: 'Quad.In' });

  // 2) Accent wash on the entry side.
  const wash = track(
    scene.add
      .rectangle(fromLeft ? 0 : width, height / 2, width * 0.72, height, color, 0.0)
      .setOrigin(fromLeft ? 0 : 1, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH_BACKDROP)
  );
  scene.tweens.add({ targets: wash, alpha: 0.25, duration: SLIDE_IN_MS, ease: 'Quad.Out' });
  scene.tweens.add({ targets: wash, alpha: 0, delay: outDelay, duration: SLIDE_OUT_MS, ease: 'Quad.In' });

  // 3) Accent speed bars sweeping across.
  const fromX = fromLeft ? -width * 0.4 : width * 1.4;
  const toX = fromLeft ? width * 1.4 : -width * 0.4;
  for (let index = 0; index < STREAK_COUNT; index += 1) {
    const y = Phaser.Math.Between(barHeight, height - barHeight);
    const streak = track(
      scene.add
        .rectangle(fromX, y, Phaser.Math.Between(width * 0.45, width * 0.95), Phaser.Math.Between(3, 11), color, 0.6)
        .setScrollFactor(0)
        .setDepth(DEPTH_STREAKS)
        .setAngle(fromLeft ? -7 : 7)
    );
    scene.tweens.add({ targets: streak, x: toX, alpha: 0, delay: index * 18, duration: 380, ease: 'Quad.Out' });
  }

  // 4) Portrait slamming in from the side.
  buildPortrait(scene, track, options, { width, height, fromLeft, color });

  // 5) Character name + Special/Secret move title entering from the opposite side.
  const captionFromX = fromLeft ? width + 260 : -260;
  const captionRestX = fromLeft ? width - 44 : 44;
  const animTargets: Phaser.GameObjects.GameObject[] = [];

  if (options.isSecret) {
    const secretBadge = track(
      scene.add
        .text(captionFromX, height * 0.34, `★ ${options.secretTag ?? 'HIDDEN SECRET ART'} ★`, {
          color: '#020617',
          backgroundColor: '#facc15',
          fontFamily: 'monospace',
          fontStyle: 'bold',
          fontSize: '16px',
          padding: { x: 10, y: 4 }
        })
        .setOrigin(fromLeft ? 1 : 0, 0.5)
        .setScrollFactor(0)
        .setDepth(DEPTH_CAPTION)
    );
    animTargets.push(secretBadge);
  }

  const caption = track(
    scene.add
      .text(captionFromX, height * 0.44, getCharacterDefinition(options.characterId).label.toUpperCase(), {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        fontSize: '42px',
        stroke: '#05070d',
        strokeThickness: 7
      })
      .setOrigin(fromLeft ? 1 : 0, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH_CAPTION)
  );
  animTargets.push(caption);

  const moveTitle = track(
    scene.add
      .text(captionFromX, height * 0.57, `${moveName}!`, {
        color: options.isSecret ? '#fef08a' : `#${color.toString(16).padStart(6, '0')}`,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        fontSize: options.isSecret ? '28px' : '30px',
        stroke: '#05070d',
        strokeThickness: 7
      })
      .setOrigin(fromLeft ? 1 : 0, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH_CAPTION)
  );
  animTargets.push(moveTitle);

  scene.tweens.add({ targets: animTargets, x: captionRestX, duration: SLIDE_IN_MS, ease: 'Back.Out' });
  scene.tweens.add({
    targets: animTargets,
    x: captionFromX,
    alpha: 0,
    delay: outDelay,
    duration: SLIDE_OUT_MS,
    ease: 'Back.In'
  });

  // 6) Cinematic letterbox bars framing the panel.
  const topBar = track(
    scene.add.rectangle(width / 2, -barHeight / 2, width, barHeight, 0x000000, 1).setScrollFactor(0).setDepth(DEPTH_LETTERBOX)
  );
  const bottomBar = track(
    scene.add
      .rectangle(width / 2, height + barHeight / 2, width, barHeight, 0x000000, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH_LETTERBOX)
  );
  scene.tweens.add({ targets: topBar, y: barHeight / 2, duration: SLIDE_IN_MS, ease: 'Cubic.Out' });
  scene.tweens.add({ targets: bottomBar, y: height - barHeight / 2, duration: SLIDE_IN_MS, ease: 'Cubic.Out' });
  scene.tweens.add({ targets: topBar, y: -barHeight / 2, delay: outDelay, duration: SLIDE_OUT_MS, ease: 'Cubic.In' });
  scene.tweens.add({
    targets: bottomBar,
    y: height + barHeight / 2,
    delay: outDelay,
    duration: SLIDE_OUT_MS,
    ease: 'Cubic.In'
  });

  // 7) Impact flash as the portrait lands.
  const flash = track(
    scene.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0).setScrollFactor(0).setDepth(DEPTH_FLASH)
  );
  scene.tweens.add({
    targets: flash,
    alpha: 0.6,
    delay: SLIDE_IN_MS - 50,
    duration: 70,
    yoyo: true,
    ease: 'Quad.Out'
  });

  scene.time.delayedCall(TOTAL_MS + 120, () => layers.forEach((object) => object.destroy()));

  return TOTAL_MS;
}

function buildPortrait(
  scene: Phaser.Scene,
  track: <T extends Phaser.GameObjects.GameObject>(object: T) => T,
  options: SuperCutInOptions,
  layout: { width: number; height: number; fromLeft: boolean; color: number }
): void {
  const { width, height, fromLeft, color } = layout;
  const portraitKey = getCharacterDefinition(options.characterId).portrait.key;
  if (!scene.textures.exists(portraitKey)) {
    return;
  }

  const source = scene.textures.get(portraitKey).getSourceImage();
  const scale = (height * 1.04) / source.height;
  const displayWidth = source.width * scale;
  const displayHeight = source.height * scale;
  const restX = fromLeft ? displayWidth * 0.42 : width - displayWidth * 0.42;
  const offX = fromLeft ? -displayWidth * 0.6 : width + displayWidth * 0.6;

  const portrait = track(
    scene.add
      .image(offX, height / 2, portraitKey)
      .setScrollFactor(0)
      .setDepth(DEPTH_PORTRAIT)
      .setScale(scale)
      .setFlipX(fromLeft)
  );

  const halfH = displayHeight * 0.5;
  const halfWBottom = displayWidth * 0.5;
  const halfWTop = halfWBottom - displayWidth * TRAPEZIUM_SLANT;
  const maskGraphics = track(
    scene.add.graphics({ x: offX, y: height / 2 }).setScrollFactor(0)
  );
  maskGraphics.fillStyle(0xffffff, 1);
  maskGraphics.beginPath();
  maskGraphics.moveTo(-halfWTop, -halfH);
  maskGraphics.lineTo(halfWTop, -halfH);
  maskGraphics.lineTo(halfWBottom, halfH);
  maskGraphics.lineTo(-halfWBottom, halfH);
  maskGraphics.closePath();
  maskGraphics.fillPath();
  maskGraphics.setVisible(false);
  portrait.setMask(maskGraphics.createGeometryMask());

  const outDelay = SLIDE_IN_MS + HOLD_MS;
  scene.tweens.add({ targets: [portrait, maskGraphics], x: restX, duration: SLIDE_IN_MS, ease: 'Back.Out' });
  scene.tweens.add({
    targets: portrait,
    scale: scale * 1.05,
    delay: SLIDE_IN_MS,
    duration: HOLD_MS,
    ease: 'Sine.InOut',
    yoyo: true
  });
  scene.tweens.add({ targets: [portrait, maskGraphics], x: offX, duration: SLIDE_OUT_MS, delay: outDelay, ease: 'Back.In' });
  scene.tweens.add({ targets: portrait, alpha: 0, delay: outDelay, duration: SLIDE_OUT_MS, ease: 'Quad.In' });

  const burst = track(
    scene.add.circle(restX, height / 2, 36, color, 0).setStrokeStyle(8, color, 0.9).setScrollFactor(0).setDepth(DEPTH_PORTRAIT)
  );
  scene.tweens.add({ targets: burst, scale: 7, alpha: 0, delay: SLIDE_IN_MS - 30, duration: 420, ease: 'Cubic.Out' });
}
