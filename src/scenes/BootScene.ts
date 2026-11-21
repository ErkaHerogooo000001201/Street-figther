import * as Phaser from 'phaser';

import { preloadStarterAssets, registerStarterAnimations } from '../game/assets';
import { prepareCrossoverPortraits } from '../game/crossoverRenderer';
import { registerGeneratedAssets } from '../game/generatedAssets';
import { prepareMyFighters } from '../game/myFighterLoader';
import { registerTileAtlasFrames } from '../game/tileAtlas';
import { registerQuestUiAtlasFrames } from '../game/uiAtlas';
import { registerFightingUiAtlasFrames } from '../game/fightingUiAtlas';
import { SCENE_KEYS } from '../game/types';
import { BaseScene } from './BaseScene';

export class BootScene extends BaseScene {
  constructor() {
    super(SCENE_KEYS.Boot);
  }

  preload(): void {
    const { centerX, centerY } = this.cameras.main;
    this.cameras.main.setBackgroundColor(0x020617);

    this.add
      .text(centerX, centerY - 42, 'STREET FIGHTER', {
        color: '#facc15',
        fontFamily: 'monospace',
        fontSize: '34px',
        fontStyle: 'bold',
        stroke: '#7f1d1d',
        strokeThickness: 6
      })
      .setOrigin(0.5);

    const status = this.add
      .text(centerX, centerY + 34, 'LOADING FIGHTERS & STAGES...', {
        color: '#94a3b8',
        fontFamily: 'monospace',
        fontSize: '13px'
      })
      .setOrigin(0.5);

    const barWidth = 360;
    const barHeight = 14;
    this.add.rectangle(centerX, centerY, barWidth + 6, barHeight + 6, 0x0f172a).setStrokeStyle(2, 0x334155);
    const fill = this.add
      .rectangle(centerX - barWidth / 2, centerY, barWidth, barHeight, 0x38bdf8)
      .setOrigin(0, 0.5)
      .setScale(0.01, 1);

    this.load.on('progress', (value: number) => {
      fill.setScale(Math.max(0.01, Math.min(1, value)), 1);
      status.setText(
        value >= 0.99 ? 'SLICING PIXEL SPRITES...' : `LOADING ASSETS ${Math.round(value * 100)}%`
      );
    });

    preloadStarterAssets(this);
  }

  create(): void {
    this.markActiveScene(SCENE_KEYS.Boot);
    registerGeneratedAssets(this);
    cleanRedBrawlerTextures(this);
    prepareCrossoverPortraits(this);
    registerTileAtlasFrames(this);
    registerQuestUiAtlasFrames(this);
    registerFightingUiAtlasFrames(this);

    // Fighters from myFighters.ts are sliced from raw pictures first, because
    // their frame counts are only known once the pictures are read.
    void prepareMyFighters(this)
      .catch((error) => console.error('[my-fighter] could not prepare fighters', error))
      .then(() => {
        registerStarterAnimations(this);
        this.scene.start(SCENE_KEYS.Splash);
      });
  }
}

/**
 * Strips the bright neon #00FF00 background from red-brawler-portrait and
 * removes stray green chroma specks from red-brawler-special.
 */
function cleanRedBrawlerTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('red-brawler-portrait')) {
    const src = scene.textures.get('red-brawler-portrait').getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx && src.width > 0 && src.height > 0) {
      const grad = ctx.createRadialGradient(size * 0.5, size * 0.42, 16, size * 0.5, size * 0.5, size * 0.72);
      grad.addColorStop(0, '#ef4444');
      grad.addColorStop(0.55, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      const fg = document.createElement('canvas');
      fg.width = size;
      fg.height = size;
      const fgCtx = fg.getContext('2d', { willReadFrequently: true });
      if (fgCtx) {
        fgCtx.drawImage(src, 0, 0, size, size);
        const imgData = fgCtx.getImageData(0, 0, size, size);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          if (g > 110 && g - Math.max(r, b) > 45) {
            d[i + 3] = 0;
          } else if (g > Math.max(r, b) + 16) {
            const cap = Math.max(r, b);
            d[i + 1] = Math.round(cap + (g - cap) * 0.12);
          }
        }
        fgCtx.putImageData(imgData, 0, 0);
        ctx.drawImage(fg, 0, 0);
        scene.textures.remove('red-brawler-portrait');
        scene.textures.addCanvas('red-brawler-portrait', canvas);
      }
    }
  }

  if (scene.textures.exists('red-brawler-special')) {
    const tex = scene.textures.get('red-brawler-special');
    const src = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    if (src.width > 0 && src.height > 0) {
      const cols = Math.max(1, Math.floor(src.width / 256));
      const rows = Math.max(1, Math.floor(src.height / 256));
      const totalFrames = Math.max(1, tex.frameTotal > 1 ? tex.frameTotal - 1 : cols * rows);
      const canvas = document.createElement('canvas');
      canvas.width = src.width;
      canvas.height = src.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(src, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] === 0) continue;
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          if (g > Math.max(r, b) + 18) {
            const cap = Math.max(r, b);
            d[i + 1] = Math.round(cap + (g - cap) * 0.14);
          }
        }
        ctx.putImageData(imgData, 0, 0);
        scene.textures.remove('red-brawler-special');
        scene.textures.addSpriteSheet('red-brawler-special', canvas as unknown as HTMLImageElement, {
          frameWidth: 256,
          frameHeight: 256,
          startFrame: 0,
          endFrame: totalFrames - 1
        });
      }
    }
  }
}
