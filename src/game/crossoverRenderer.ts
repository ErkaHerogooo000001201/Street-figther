import type * as Phaser from 'phaser';

import { CROSSOVER_SOURCE_SHEETS, type CrossoverSourceSheetSpec } from './crossoverAssets';
import { CROSSOVER_CHARACTER_DEFINITIONS, CROSSOVER_PROFILES } from './crossoverRoster';
import type { HeroAnimationDefinition } from './hero';
import { getSpecialMoveSpec } from './specialMoves';

const CELL = 256;
const COLS = 5;
const FOOT_Y = 229;
const DEFAULT_BODY_HEIGHT = 198;
const MAX_POSE_WIDTH = 242;

interface ExtractedPose {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  feetX: number;
}

interface DrawPoseOptions {
  scaleMul?: number;
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
  auraColor?: string;
  auraAlpha?: number;
  flashWhite?: number;
}

const cachedIdlePoseBySource = new Map<string, ExtractedPose>();
const cachedFullPosesBySource = new Map<string, ExtractedPose[]>();

/**
 * Fast boot step: creates only the Character Select / HUD portrait texture for
 * every crossover fighter (~10x faster than slicing all 13 combat sheets up front).
 */
export function prepareCrossoverPortraits(scene: Phaser.Scene): void {
  for (const profile of CROSSOVER_PROFILES) {
    const def = CROSSOVER_CHARACTER_DEFINITIONS.find((c) => c.id === profile.id);
    const sourceId = profile.baseSheetId ?? profile.id;
    const sheetSpec = CROSSOVER_SOURCE_SHEETS.find((s) => s.id === sourceId);
    if (!def || !sheetSpec) {
      continue;
    }

    const moveSpec = getSpecialMoveSpec(profile.id);
    const auraColor = `#${moveSpec.themeColor.toString(16).padStart(6, '0')}`;

    if (sheetSpec.portraitKey && scene.textures.exists(sheetSpec.portraitKey)) {
      renderPhotoPortrait(scene, sheetSpec.portraitKey, def.portrait.key, auraColor);
      continue;
    }

    let idlePose = cachedIdlePoseBySource.get(sheetSpec.id);
    if (!idlePose) {
      const extracted = extractIdlePortraitPose(scene, sheetSpec);
      if (extracted) {
        cachedIdlePoseBySource.set(sheetSpec.id, extracted);
        idlePose = extracted;
      }
    }
    if (idlePose) {
      const tinted = profile.baseSheetId
        ? recolorPose(idlePose, profile.hueShiftDeg ?? 0, profile.outfitPrimary)
        : idlePose;
      renderPortrait(scene, tinted, def.portrait.key, auraColor);
    }
  }
}

/**
 * Ensures all 13 combat action spritesheets and Phaser animations for a specific
 * crossover fighter are sliced and registered on demand (~15ms per fighter).
 */
export function ensureCrossoverFighterPrepared(scene: Phaser.Scene, characterId: string): void {
  const profile = CROSSOVER_PROFILES.find((p) => p.id === characterId);
  const def = CROSSOVER_CHARACTER_DEFINITIONS.find((c) => c.id === characterId);
  const sourceId = profile?.baseSheetId ?? characterId;
  const sheetSpec = CROSSOVER_SOURCE_SHEETS.find((s) => s.id === sourceId);
  if (!profile || !def || !sheetSpec) {
    return;
  }

  const firstKey = def.animations[0]?.sheet.key;
  if (firstKey && scene.textures.exists(firstKey)) {
    registerDefAnimations(scene, def.animations);
    return;
  }

  let basePoses = cachedFullPosesBySource.get(sheetSpec.id);
  if (!basePoses) {
    const extracted = extractPosesFromTexture(scene, sheetSpec);
    if (!extracted || extracted.length === 0) {
      console.warn(`[crossover] Missing or empty pose sheet for ${profile.id}`);
      return;
    }
    while (extracted.length < 8) {
      extracted.push(extracted[0]);
    }
    cachedFullPosesBySource.set(sheetSpec.id, extracted);
    basePoses = extracted;
  }

  const poses = profile.baseSheetId
    ? basePoses.map((pose) => recolorPose(pose, profile.hueShiftDeg ?? 0, profile.outfitPrimary))
    : [...basePoses];

  const idleIdx = sheetSpec.idlePoseIndex ?? 0;
  const idlePose = poses[idleIdx] ?? poses[0];
  if (idleIdx !== 0) {
    poses[0] = idlePose;
  }

  const bodyHeight = sheetSpec.bodyHeight ?? DEFAULT_BODY_HEIGHT;
  const baseScale = bodyHeight / Math.max(1, idlePose.height);
  const moveSpec = getSpecialMoveSpec(profile.id);
  const auraColor = `#${moveSpec.themeColor.toString(16).padStart(6, '0')}`;

  for (const anim of def.animations) {
    buildActionSheet(scene, anim, poses, baseScale, auraColor);
  }

  if (!scene.textures.exists(def.portrait.key)) {
    if (sheetSpec.portraitKey && scene.textures.exists(sheetSpec.portraitKey)) {
      renderPhotoPortrait(scene, sheetSpec.portraitKey, def.portrait.key, auraColor);
    } else {
      renderPortrait(scene, idlePose, def.portrait.key, auraColor);
    }
  }
  renderAnchor(scene, idlePose, baseScale, def.anchorAsset.key);
  registerDefAnimations(scene, def.animations);
}

/**
 * Legacy batch entry point: prepares portraits + all crossover sheets.
 */
export function prepareCrossoverFighters(scene: Phaser.Scene): void {
  prepareCrossoverPortraits(scene);
  for (const profile of CROSSOVER_PROFILES) {
    ensureCrossoverFighterPrepared(scene, profile.id);
  }
}

function registerDefAnimations(scene: Phaser.Scene, animations: HeroAnimationDefinition[]): void {
  for (const anim of animations) {
    if (scene.anims.exists(anim.key) || !scene.textures.exists(anim.sheet.key)) {
      continue;
    }
    scene.anims.create({
      key: anim.key,
      frames: scene.anims.generateFrameNumbers(anim.sheet.key, {
        start: 0,
        end: anim.sheet.frames - 1
      }),
      frameRate: anim.frameRate,
      repeat: anim.repeat
    });
  }
}

function extractIdlePortraitPose(
  scene: Phaser.Scene,
  spec: CrossoverSourceSheetSpec
): ExtractedPose | null {
  if (!scene.textures.exists(spec.textureKey)) {
    return null;
  }

  const srcImage = scene.textures.get(spec.textureKey).getSourceImage() as
    | HTMLImageElement
    | HTMLCanvasElement;
  const fullW = srcImage.width;
  const fullH = srcImage.height;
  if (!fullW || !fullH) {
    return null;
  }

  const poseIdx = spec.idlePoseIndex ?? 0;
  const rowIdx = Math.floor(poseIdx / 4);
  const colIdx = poseIdx % 4;

  const cropFraction = Array.isArray(spec.rowBottomCrop)
    ? spec.rowBottomCrop[rowIdx]
    : spec.rowBottomCrop ?? 1;
  const cellW = Math.round(fullW * 0.27);
  const srcX = Math.max(0, Math.min(fullW - cellW, Math.round(colIdx * (fullW * 0.25) - fullW * 0.01)));
  const srcY = rowIdx === 0 ? 0 : Math.floor(fullH / 2);
  const cellH = Math.round((fullH / 2) * cropFraction);
  const inset = spec.trimGridLines ? 6 : 0;

  const canvas = document.createElement('canvas');
  canvas.width = cellW;
  canvas.height = cellH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return null;
  }

  ctx.drawImage(srcImage, srcX, srcY, cellW, cellH, 0, 0, cellW, cellH);
  const imgData = ctx.getImageData(0, 0, cellW, cellH);
  cleanChromaBackground(imgData.data, cellW, cellH, Boolean(spec.trimGridLines));
  ctx.putImageData(imgData, 0, 0);

  const mask = new Uint8Array(cellW * cellH);
  for (let i = 0; i < mask.length; i += 1) {
    mask[i] = imgData.data[i * 4 + 3] > 35 ? 1 : 0;
  }

  return extractCellPose(
    canvas,
    mask,
    cellW,
    inset,
    cellW - inset,
    inset,
    cellH - inset
  );
}

function renderPhotoPortrait(
  scene: Phaser.Scene,
  sourceKey: string,
  targetKey: string,
  auraColor: string
): void {
  if (scene.textures.exists(targetKey)) {
    scene.textures.remove(targetKey);
  }
  const srcImage = scene.textures.get(sourceKey).getSourceImage() as
    | HTMLImageElement
    | HTMLCanvasElement;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(srcImage, 0, 0, size, size);

  // Subtle colored border frame matching arcade roster style
  ctx.strokeStyle = auraColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  scene.textures.addCanvas(targetKey, canvas);
}

function extractPosesFromTexture(
  scene: Phaser.Scene,
  spec: CrossoverSourceSheetSpec
): ExtractedPose[] | null {
  if (!scene.textures.exists(spec.textureKey)) {
    return null;
  }

  const srcImage = scene.textures.get(spec.textureKey).getSourceImage() as
    | HTMLImageElement
    | HTMLCanvasElement;
  const w = srcImage.width;
  const h = srcImage.height;
  if (!w || !h) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return null;
  }

  ctx.drawImage(srcImage, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  cleanChromaBackground(imgData.data, w, h, Boolean(spec.trimGridLines));
  ctx.putImageData(imgData, 0, 0);

  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i += 1) {
    mask[i] = imgData.data[i * 4 + 3] > 35 ? 1 : 0;
  }

  const poses: ExtractedPose[] = [];
  const halfH = Math.floor(h / 2);
  const gridInset = spec.trimGridLines ? 7 : 0;

  for (let row = 0; row < 2; row += 1) {
    const rawTop = row === 0 ? 0 : halfH;
    const rowSpan = row === 0 ? halfH : h - halfH;
    const cropFraction = Array.isArray(spec.rowBottomCrop)
      ? spec.rowBottomCrop[row]
      : spec.rowBottomCrop ?? 1;
    const rowTop = rawTop + (row === 1 ? gridInset : gridInset > 0 ? 4 : 0);
    const rowBottom = rawTop + Math.floor(rowSpan * cropFraction) - (row === 0 ? gridInset : gridInset > 0 ? 4 : 0);

    const split1 = findBestVerticalSplit(mask, w, rowTop, rowBottom, Math.round(w * 0.25), Math.round(w * 0.08));
    const split2 = findBestVerticalSplit(mask, w, rowTop, rowBottom, Math.round(w * 0.5), Math.round(w * 0.08));
    const split3 = findBestVerticalSplit(mask, w, rowTop, rowBottom, Math.round(w * 0.75), Math.round(w * 0.08));
    const colBounds: Array<[number, number]> = [
      [gridInset > 0 ? 4 : 0, split1 - gridInset],
      [split1 + gridInset, split2 - gridInset],
      [split2 + gridInset, split3 - gridInset],
      [split3 + gridInset, gridInset > 0 ? w - 4 : w]
    ];

    for (const [colLeft, colRight] of colBounds) {
      const pose = extractCellPose(canvas, mask, w, colLeft, colRight, rowTop, rowBottom);
      if (pose) {
        poses.push(pose);
      }
    }
  }

  return poses;
}

/**
 * Removes solid neon green or magenta background using edge-connected flood-fill,
 * enclosed neon hole detection, and 1px fringe despill so interior eye/armor
 * greens and character outlines remain 100% intact.
 */
function cleanChromaBackground(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  seedGridCells = false
): void {
  const [bgR, bgG, bgB] = sampleBorderMedian(data, w, h);
  const isGreenBg = bgG > bgR + 60 && bgG > bgB + 60;
  const isMagentaBg = bgR > bgG + 60 && bgB > bgG + 60;

  const isBgColor = (offset: number, strict: boolean): boolean => {
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const dist = Math.hypot(r - bgR, g - bgG, b - bgB);

    if (strict) {
      if (dist < 88) return true;
      if (isGreenBg && g > 175 && g - r > 85 && g - b > 85) return true;
      if (isMagentaBg && r > 170 && b > 170 && g < 95) return true;
      return false;
    }

    if (dist < 126) return true;
    if (isGreenBg && g > r + 42 && g > b + 42 && g > 110) return true;
    if (isMagentaBg && r > g + 42 && b > g + 42 && r > 110 && b > 110) return true;
    return false;
  };

  const total = w * h;
  const bgMask = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const enqueue = (idx: number): void => {
    if (bgMask[idx] === 0 && isBgColor(idx * 4, false)) {
      bgMask[idx] = 1;
      queue[tail++] = idx;
    }
  };

  // Seed outer borders + horizontal middle seam
  const midY = Math.floor(h / 2);
  for (let x = 0; x < w; x += 1) {
    enqueue(x);
    enqueue((h - 1) * w + x);
    if (isBgColor((midY * w + x) * 4, true)) {
      enqueue(midY * w + x);
    }
  }
  for (let y = 0; y < h; y += 1) {
    enqueue(y * w);
    enqueue(y * w + (w - 1));
  }

  // If the sheet has thin black divider lines separating the 4x2 cells, seed interior cell corners
  if (seedGridCells) {
    for (let row = 0; row < 2; row += 1) {
      const yTop = Math.round((row * h) / 2 + 12);
      const yBot = Math.round(((row + 1) * h) / 2 - 12);
      for (let col = 0; col < 4; col += 1) {
        const xLeft = Math.round((col * w) / 4 + 12);
        const xRight = Math.round(((col + 1) * w) / 4 - 12);
        enqueue(yTop * w + xLeft);
        enqueue(yTop * w + xRight);
        enqueue(yBot * w + xLeft);
        enqueue(yBot * w + xRight);
      }
    }
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0) enqueue(idx - 1);
    if (x + 1 < w) enqueue(idx + 1);
    if (y > 0) enqueue(idx - w);
    if (y + 1 < h) enqueue(idx + w);
  }

  // Secondary pass for enclosed background gaps (e.g. under bent arms or between legs)
  const visited = new Uint8Array(total);
  const region: number[] = [];
  for (let idx = 0; idx < total; idx += 1) {
    if (bgMask[idx] || visited[idx] || !isBgColor(idx * 4, true)) {
      continue;
    }
    region.length = 0;
    visited[idx] = 1;
    let rHead = 0;
    region.push(idx);
    while (rHead < region.length) {
      const cur = region[rHead++];
      const cx = cur % w;
      const cy = (cur - cx) / w;
      const neighbors = [
        cx > 0 ? cur - 1 : -1,
        cx + 1 < w ? cur + 1 : -1,
        cy > 0 ? cur - w : -1,
        cy + 1 < h ? cur + w : -1
      ];
      for (const n of neighbors) {
        if (n >= 0 && !bgMask[n] && !visited[n] && isBgColor(n * 4, true)) {
          visited[n] = 1;
          region.push(n);
        }
      }
    }
    if (region.length >= 2) {
      for (const p of region) {
        bgMask[p] = 1;
      }
    }
  }

  for (let idx = 0; idx < total; idx += 1) {
    if (bgMask[idx]) {
      data[idx * 4 + 3] = 0;
    }
  }

  // Two-pass edge despill cleanup on outer contour pixels
  for (let pass = 0; pass < 2; pass += 1) {
    const newlyCleared: number[] = [];
    for (let y = 1; y < h - 1; y += 1) {
      for (let x = 1; x < w - 1; x += 1) {
        const idx = y * w + x;
        if (bgMask[idx]) continue;

        const touchesBg =
          bgMask[idx - 1] ||
          bgMask[idx + 1] ||
          bgMask[idx - w] ||
          bgMask[idx + w] ||
          bgMask[idx - w - 1] ||
          bgMask[idx - w + 1] ||
          bgMask[idx + w - 1] ||
          bgMask[idx + w + 1];
        if (!touchesBg) continue;

        const off = idx * 4;
        let r = data[off];
        let g = data[off + 1];
        let b = data[off + 2];

        if (isGreenBg && g > Math.max(r, b) + 22) {
          newlyCleared.push(idx);
          data[off + 3] = 0;
        } else if (isMagentaBg && r > g + 26 && b > g + 26) {
          newlyCleared.push(idx);
          data[off + 3] = 0;
        } else {
          if (isGreenBg && g > Math.max(r, b) + 14) {
            const cap = Math.max(r, b);
            g = Math.round(cap + (g - cap) * 0.15);
            data[off + 1] = g;
          } else if (isMagentaBg && r > g + 18 && b > g + 18) {
            r = Math.round(g + (r - g) * 0.2);
            b = Math.round(g + (b - g) * 0.2);
            data[off] = r;
            data[off + 2] = b;
          }

          const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
          if (dist < 145) {
            data[off + 3] = Math.round(Math.max(0, Math.min(255, ((dist - 70) / 75) * 255)));
          }
        }
      }
    }
    for (const idx of newlyCleared) {
      bgMask[idx] = 1;
    }
  }
}

function sampleBorderMedian(data: Uint8ClampedArray, w: number, h: number): [number, number, number] {
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const push = (x: number, y: number): void => {
    const off = (y * w + x) * 4;
    rs.push(data[off]);
    gs.push(data[off + 1]);
    bs.push(data[off + 2]);
  };
  for (let x = 0; x < w; x += 12) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y += 12) {
    push(0, y);
    push(w - 1, y);
  }
  rs.sort((a, b) => a - b);
  gs.sort((a, b) => a - b);
  bs.sort((a, b) => a - b);
  const mid = Math.floor(rs.length / 2);
  return [rs[mid] ?? 0, gs[mid] ?? 255, bs[mid] ?? 0];
}

function findBestVerticalSplit(
  mask: Uint8Array,
  w: number,
  top: number,
  bottom: number,
  targetX: number,
  radius: number
): number {
  let bestX = targetX;
  let bestCount = Number.POSITIVE_INFINITY;
  const minX = Math.max(8, targetX - radius);
  const maxX = Math.min(w - 8, targetX + radius);

  for (let x = minX; x <= maxX; x += 1) {
    let count = 0;
    for (let y = top; y < bottom; y += 2) {
      count += mask[y * w + x];
    }
    const distBias = Math.abs(x - targetX) * 0.01;
    if (count + distBias < bestCount) {
      bestCount = count + distBias;
      bestX = x;
      if (count === 0 && Math.abs(x - targetX) < 6) {
        return x;
      }
    }
  }
  return bestX;
}

function extractCellPose(
  sourceCanvas: HTMLCanvasElement,
  mask: Uint8Array,
  fullW: number,
  left: number,
  right: number,
  top: number,
  bottom: number
): ExtractedPose | null {
  // Collect vertical foreground bands; only filter detached bottom caption strips so weapons/auras/limbs stay intact
  const rowCounts: number[] = [];
  for (let y = top; y < bottom; y += 1) {
    let c = 0;
    for (let x = left; x < right; x += 1) {
      c += mask[y * fullW + x];
    }
    rowCounts.push(c);
  }

  interface VBand {
    top: number;
    bottom: number;
    height: number;
  }
  const bands: VBand[] = [];
  let bandStart = -1;
  let gapRun = 0;

  for (let i = 0; i <= rowCounts.length; i += 1) {
    const filled = i < rowCounts.length && rowCounts[i] >= 2;
    if (filled) {
      if (bandStart < 0) bandStart = i;
      gapRun = 0;
    } else if (bandStart >= 0) {
      gapRun += 1;
      if (gapRun >= 2 || i === rowCounts.length) {
        const end = i - gapRun + 1;
        bands.push({ top: top + bandStart, bottom: top + end, height: end - bandStart });
        bandStart = -1;
        gapRun = 0;
      }
    }
  }

  if (bands.length === 0) {
    return null;
  }

  const mainBand = bands.reduce((best, cur) => (cur.height > best.height ? cur : best), bands[0]);
  if (mainBand.height < 20) {
    return null;
  }

  const keptBands = bands.filter((band) => {
    const isBottomCaption =
      band !== mainBand &&
      band.height <= 18 &&
      band.bottom > top + Math.round(rowCounts.length * 0.8) &&
      band.top - mainBand.bottom >= 10;
    return !isBottomCaption;
  });

  const activeTop = Math.min(...keptBands.map((b) => b.top));
  const activeBottom = Math.max(...keptBands.map((b) => b.bottom));

  let minX = right;
  let maxX = left - 1;
  let minY = activeBottom;
  let maxY = activeTop - 1;

  for (const band of keptBands) {
    for (let y = band.top; y < band.bottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        if (mask[y * fullW + x]) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  const pw = maxX - minX + 1;
  const ph = maxY - minY + 1;
  const feetStart = maxY - Math.max(3, Math.round(ph * 0.08));
  let feetSum = 0;
  let feetCount = 0;

  for (let y = feetStart; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (mask[y * fullW + x]) {
        feetSum += x - minX;
        feetCount += 1;
      }
    }
  }

  const poseCanvas = document.createElement('canvas');
  poseCanvas.width = pw;
  poseCanvas.height = ph;
  const pCtx = poseCanvas.getContext('2d');
  if (!pCtx) {
    return null;
  }
  pCtx.drawImage(sourceCanvas, minX, minY, pw, ph, 0, 0, pw, ph);

  return {
    canvas: poseCanvas,
    width: pw,
    height: ph,
    feetX: feetCount > 0 ? feetSum / feetCount : pw / 2
  };
}

function buildActionSheet(
  scene: Phaser.Scene,
  anim: HeroAnimationDefinition,
  poses: ExtractedPose[],
  baseScale: number,
  auraColor: string
): void {
  const key = anim.sheet.key;
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }

  const frames = anim.sheet.frames;
  const cols = Math.min(COLS, frames);
  const rows = Math.ceil(frames / COLS);
  const canvas = document.createElement('canvas');
  canvas.width = cols * CELL;
  canvas.height = rows * CELL;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const [pIdle, pWalk, pBlock, pJump, pLight, pHeavy, pHit, pSpecial] = poses;

  for (let i = 0; i < frames; i += 1) {
    const cx = (i % COLS) * CELL;
    const cy = Math.floor(i / COLS) * CELL;
    const t = frames <= 1 ? 0 : i / (frames - 1);

    let pose = pIdle;
    let opts: DrawPoseOptions = {};

    switch (anim.action) {
      case 'idle': {
        const wave = Math.sin(t * Math.PI * 2);
        pose = pIdle;
        opts = {
          scaleY: 1 - 0.018 * (0.5 + 0.5 * wave),
          scaleX: 1 + 0.012 * (0.5 + 0.5 * wave)
        };
        break;
      }
      case 'walk-forward': {
        const bob = Math.abs(Math.sin(t * Math.PI * 2));
        pose = pWalk;
        opts = {
          offsetX: 0,
          offsetY: -bob * 4,
          scaleY: 1 - 0.014 * bob,
          scaleX: 1 + 0.01 * bob
        };
        break;
      }
      case 'walk-backward': {
        const bob = Math.abs(Math.sin(t * Math.PI * 2));
        pose = pWalk;
        opts = {
          offsetX: 0,
          offsetY: -bob * 3,
          scaleY: 1 - 0.01 * bob
        };
        break;
      }
      case 'crouch': {
        const crouchDepth = 0.22 * Math.min(1, t * 1.6);
        pose = pBlock;
        opts = {
          scaleY: 1 - crouchDepth,
          scaleX: 1 + crouchDepth * 0.35
        };
        break;
      }
      case 'jump': {
        pose = pJump;
        opts = {
          offsetY: -12 - Math.sin(t * Math.PI) * 16
        };
        break;
      }
      case 'block-high': {
        pose = pBlock;
        opts = { offsetX: 3 };
        break;
      }
      case 'block-low': {
        pose = pBlock;
        opts = { scaleY: 0.78, scaleX: 1.08, offsetX: 4 };
        break;
      }
      case 'hit-high': {
        pose = i < frames - 1 ? pHit : pIdle;
        opts = {
          offsetX: i === 0 ? 10 : i === 1 ? 14 : i === 2 ? 7 : 0
        };
        break;
      }
      case 'light-punch': {
        if (i === 0) {
          pose = pIdle;
          opts = { offsetX: 4 };
        } else if (i === 1) {
          pose = pLight;
          opts = { offsetX: -4 };
        } else if (i === 2 || i === 3) {
          pose = pLight;
          opts = { offsetX: -14 };
        } else {
          pose = pIdle;
          opts = { offsetX: 0 };
        }
        break;
      }
      case 'heavy-kick': {
        if (i === 0) {
          pose = pIdle;
          opts = { offsetX: 6 };
        } else if (i === 1) {
          pose = pHeavy;
          opts = { offsetX: -4, offsetY: -4 };
        } else if (i >= 2 && i <= 4) {
          pose = pHeavy;
          opts = { offsetX: -16, offsetY: -6 };
        } else {
          pose = pIdle;
        }
        break;
      }
      case 'special-charge': {
        pose = pBlock;
        opts = {
          scaleY: 0.94,
          scaleX: 1.04,
          auraColor,
          auraAlpha: 0.25 + 0.35 * t
        };
        break;
      }
      case 'special': {
        pose = i === 0 ? pBlock : i === frames - 1 ? pIdle : pSpecial;
        opts = {
          offsetX: i >= 1 && i <= 5 ? -10 : 0,
          auraColor,
          auraAlpha: i >= 1 && i <= 6 ? 0.42 : 0.15
        };
        break;
      }
      case 'knockdown': {
        const fall = Math.min(1, t * 1.35);
        pose = pHit;
        opts = {
          rotation: fall * (Math.PI * 0.48),
          offsetX: Math.sin(fall * Math.PI) * 14
        };
        break;
      }
      default:
        pose = pIdle;
    }

    drawPoseInCell(ctx, cx, cy, pose, baseScale, opts);
  }

  scene.textures.addSpriteSheet(key, canvas as unknown as HTMLImageElement, {
    frameWidth: CELL,
    frameHeight: CELL,
    startFrame: 0,
    endFrame: frames - 1
  });
}

function drawPoseInCell(
  ctx: CanvasRenderingContext2D,
  cellX: number,
  cellY: number,
  pose: ExtractedPose,
  baseScale: number,
  opts: DrawPoseOptions
): void {
  const offsetX = opts.offsetX ?? 0;
  const offsetY = opts.offsetY ?? 0;
  const maxWidthScale = MAX_POSE_WIDTH / Math.max(1, pose.width);
  const availableHeight = Math.max(48, FOOT_Y - 8 - Math.max(0, -offsetY));
  const maxHeightScale = availableHeight / Math.max(1, pose.height);
  const s = Math.min(baseScale, maxWidthScale, maxHeightScale) * (opts.scaleMul ?? 1);
  let sx = s * (opts.scaleX ?? 1);
  let sy = s * (opts.scaleY ?? 1);

  let drawW = Math.max(1, Math.round(pose.width * sx));
  let drawH = Math.max(1, Math.round(pose.height * sy));
  const angle = opts.rotation ?? 0;

  if (angle !== 0) {
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    const rotW = drawW * cos + drawH * sin;
    const rotH = drawW * sin + drawH * cos;
    const rotFit = Math.min(1, (CELL - 20) / Math.max(1, rotW), (CELL - 24) / Math.max(1, rotH));
    if (rotFit < 1) {
      sx *= rotFit;
      sy *= rotFit;
      drawW = Math.max(1, Math.round(pose.width * sx));
      drawH = Math.max(1, Math.round(pose.height * sy));
    }
  }

  // Source generated poses face RIGHT -> flip horizontally so canonical pose faces LEFT
  const flippedFootX = (pose.width - pose.feetX) * sx;
  let anchorX = cellX + CELL / 2 + offsetX;
  let anchorY = cellY + FOOT_Y + offsetY;
  let drawLeft: number;

  if (angle !== 0) {
    const localLeft = -flippedFootX;
    const localRight = localLeft + drawW;
    const localTop = -drawH;
    const localBot = 0;
    const pivotY = -18;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const corners: Array<[number, number]> = [
      [localLeft, localTop],
      [localRight, localTop],
      [localRight, localBot],
      [localLeft, localBot]
    ];
    let minRx = Number.POSITIVE_INFINITY;
    let maxRx = Number.NEGATIVE_INFINITY;
    let minRy = Number.POSITIVE_INFINITY;
    let maxRy = Number.NEGATIVE_INFINITY;
    for (const [px, py] of corners) {
      const dy = py - pivotY;
      const rx = px * cos - dy * sin;
      const ry = px * sin + dy * cos + pivotY;
      if (rx < minRx) minRx = rx;
      if (rx > maxRx) maxRx = rx;
      if (ry < minRy) minRy = ry;
      if (ry > maxRy) maxRy = ry;
    }

    const desiredMidX = cellX + CELL / 2 + offsetX;
    const rawAnchorX = desiredMidX - (minRx + maxRx) / 2;
    anchorX = Math.max(cellX + 8 - minRx, Math.min(cellX + CELL - 8 - maxRx, rawAnchorX));

    const rawAnchorY = cellY + FOOT_Y + offsetY - maxRy;
    anchorY = Math.max(cellY + 8 - minRy, Math.min(cellY + CELL - 8 - maxRy, rawAnchorY));
    drawLeft = localLeft;
  } else {
    // Clamp draw rect inside [cellX + 4, cellX + CELL - 4] accounting for offsetX/offsetY so skills never clip
    const rawLeft = -flippedFootX;
    const minLeft = -CELL / 2 + 4 - offsetX;
    const maxLeft = CELL / 2 - 4 - drawW - offsetX;
    drawLeft = Math.max(minLeft, Math.min(maxLeft, rawLeft));
    anchorY = Math.max(cellY + drawH + 4, Math.min(cellY + CELL - 4, anchorY));
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(cellX, cellY, CELL, CELL);
  ctx.clip();

  if (opts.auraColor && opts.auraAlpha && opts.auraAlpha > 0) {
    const grad = ctx.createRadialGradient(
      anchorX,
      anchorY - drawH * 0.5,
      10,
      anchorX,
      anchorY - drawH * 0.5,
      drawH * 0.62
    );
    grad.addColorStop(0, `${opts.auraColor}88`);
    grad.addColorStop(1, `${opts.auraColor}00`);
    ctx.globalAlpha = opts.auraAlpha;
    ctx.fillStyle = grad;
    ctx.fillRect(cellX, cellY, CELL, CELL);
    ctx.globalAlpha = 1;
  }

  ctx.translate(anchorX, anchorY);
  if (angle !== 0) {
    ctx.translate(0, -18);
    ctx.rotate(angle);
    ctx.translate(0, 18);
  }

  const drawTop = -drawH;

  ctx.save();
  ctx.translate(drawLeft + drawW, drawTop);
  ctx.scale(-1, 1);
  ctx.drawImage(pose.canvas, 0, 0, pose.width, pose.height, 0, 0, drawW, drawH);
  ctx.restore();

  ctx.restore();
}

function renderPortrait(
  scene: Phaser.Scene,
  idlePose: ExtractedPose,
  key: string,
  auraColor: string
): void {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const bgGrad = ctx.createRadialGradient(size * 0.5, size * 0.42, 16, size * 0.5, size * 0.5, size * 0.72);
  bgGrad.addColorStop(0, auraColor);
  bgGrad.addColorStop(0.55, '#0f172a');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Upper 62% crop (head, face, upper torso) flipped LEFT
  const cropH = Math.max(24, Math.round(idlePose.height * 0.64));
  const fitScale = (size * 0.92) / Math.max(idlePose.width, cropH);
  const drawW = Math.round(idlePose.width * fitScale);
  const drawH = Math.round(cropH * fitScale);
  const drawX = Math.round((size - drawW) / 2);
  const drawY = Math.round(size - drawH + 8);

  ctx.save();
  ctx.translate(drawX + drawW, drawY);
  ctx.scale(-1, 1);
  ctx.drawImage(idlePose.canvas, 0, 0, idlePose.width, cropH, 0, 0, drawW, drawH);
  ctx.restore();

  scene.textures.addCanvas(key, canvas);
}

function renderAnchor(
  scene: Phaser.Scene,
  idlePose: ExtractedPose,
  baseScale: number,
  key: string
): void {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }

  const canvas = document.createElement('canvas');
  canvas.width = CELL;
  canvas.height = CELL;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  drawPoseInCell(ctx, 0, 0, idlePose, baseScale, {});
  scene.textures.addCanvas(key, canvas);
}

function recolorPose(pose: ExtractedPose, hueShiftDeg: number, accentHex?: string): ExtractedPose {
  const out = document.createElement('canvas');
  out.width = pose.width;
  out.height = pose.height;
  const ctx = out.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return pose;
  }

  ctx.drawImage(pose.canvas, 0, 0);
  const img = ctx.getImageData(0, 0, pose.width, pose.height);
  const d = img.data;

  const targetRgb = accentHex ? parseHexRgb(accentHex) : null;
  const targetHsv = targetRgb ? rgbToHsv(targetRgb[0], targetRgb[1], targetRgb[2]) : null;
  const colorizeLightCloth = Math.abs(hueShiftDeg) <= 1 && targetHsv !== null;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 16) continue;
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const [h, s, v] = rgbToHsv(r, g, b);

    // Keep dark ink outlines intact
    if (v < 0.18) continue;

    // Preserve natural warm skin tones
    const isSkin = h >= 8 && h <= 42 && s >= 0.16 && s <= 0.68 && v > 0.44;
    if (isSkin) continue;

    let nextH = h;
    let nextS = s;
    const nextV = v;

    if (s >= 0.16) {
      nextH = (h + hueShiftDeg + 360) % 360;
    } else if (colorizeLightCloth && targetHsv && v > 0.42 && v < 0.92) {
      nextH = targetHsv[0];
      nextS = Math.min(0.85, Math.max(0.45, targetHsv[1] * 0.78));
    } else {
      continue;
    }

    const [nr, ng, nb] = hsvToRgb(nextH, nextS, nextV);
    d[i] = nr;
    d[i + 1] = ng;
    d[i + 2] = nb;
  }

  ctx.putImageData(img, 0, 0);
  return {
    canvas: out,
    width: pose.width,
    height: pose.height,
    feetX: pose.feetX
  };
}

function parseHexRgb(hex: string): [number, number, number] | null {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  if (clean.length !== 6) return null;
  const num = Number.parseInt(clean, 16);
  if (!Number.isFinite(num)) return null;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta > 1e-5) {
    if (max === rn) {
      h = 60 * (((gn - bn) / delta) % 6);
    } else if (max === gn) {
      h = 60 * ((bn - rn) / delta + 2);
    } else {
      h = 60 * ((rn - gn) / delta + 4);
    }
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  return [h, s, max];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (h < 60) {
    rp = c;
    gp = x;
  } else if (h < 120) {
    rp = x;
    gp = c;
  } else if (h < 180) {
    gp = c;
    bp = x;
  } else if (h < 240) {
    gp = x;
    bp = c;
  } else if (h < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }

  return [
    Math.round((rp + m) * 255),
    Math.round((gp + m) * 255),
    Math.round((bp + m) * 255)
  ];
}

