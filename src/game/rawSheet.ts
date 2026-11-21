import type { Rect } from './types';

/**
 * Turns a "raw" AI-drawn pose sheet (a row or grid of poses on one flat
 * background colour) into a game-ready spritesheet canvas: background removed,
 * every pose scaled to the same body height, feet on the same line, one pose
 * per 256x256 cell, 5 cells per row.
 */

export const RAW_CELL = 256;
export const RAW_COLS = 5;
/** Feet line and standing body height shared with the bundled fighters. */
const FEET_Y = 229;
const BODY_HEIGHT = 200;
const MAX_POSE_WIDTH = 244;
const MAX_FRAMES = 10;
const MAX_SOURCE_SIDE = 2048;

export interface RawSheet {
  canvas: HTMLCanvasElement;
  frames: number;
  /** Tight box around each pose inside its 256x256 cell. */
  boxes: Rect[];
}

export interface RawSheetOptions {
  /** Mirror every pose. Use when the art faces right instead of left. */
  flip?: boolean;
  /** Force this many equal-width poses instead of auto-detecting them. */
  frames?: number;
}

interface Pose {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  feetX: number;
}

/**
 * Load the first URL that decodes as an image.
 * @param urls - Candidate URLs, tried in order.
 */
export async function loadFirstImage(urls: string[]): Promise<HTMLImageElement | null> {
  for (const url of urls) {
    const image = await loadImage(url);

    if (image) {
      return image;
    }
  }

  return null;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => resolve(image.naturalWidth > 0 ? image : null);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

/**
 * Slice a raw pose sheet into a normalized spritesheet.
 * @param image - The decoded source image.
 * @param options - Flip and frame-count overrides.
 * @returns The spritesheet, or null when no pose was found.
 */
export function sliceRawSheet(image: HTMLImageElement, options: RawSheetOptions = {}): RawSheet | null {
  const shrink = Math.min(1, MAX_SOURCE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * shrink));
  const height = Math.max(1, Math.round(image.naturalHeight * shrink));
  const source = makeCanvas(width, height);
  const sourceContext = source.getContext('2d', { willReadFrequently: true });

  if (!sourceContext) {
    return null;
  }

  sourceContext.drawImage(image, 0, 0, width, height);

  const pixels = sourceContext.getImageData(0, 0, width, height);

  removeBackground(pixels.data, width, height);
  sourceContext.putImageData(pixels, 0, 0);

  const mask = new Uint8Array(width * height);

  for (let index = 0; index < mask.length; index += 1) {
    mask[index] = pixels.data[index * 4 + 3] > 40 ? 1 : 0;
  }

  const detected = findPoses(mask, width, height);
  const poses = (
    options.frames && options.frames !== detected.length
      ? splitEvenly(mask, width, height, options.frames)
      : detected
  ).slice(0, MAX_FRAMES);

  if (poses.length === 0) {
    return null;
  }

  const tallest = Math.max(...poses.map((pose) => pose.height));
  const widest = Math.max(...poses.map((pose) => pose.width));
  const scale = Math.min(BODY_HEIGHT / tallest, MAX_POSE_WIDTH / widest);
  const rows = Math.ceil(poses.length / RAW_COLS);
  const canvas = makeCanvas(RAW_COLS * RAW_CELL, rows * RAW_CELL);
  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const boxes = poses.map((pose, frame) => {
    const drawWidth = Math.max(1, Math.round(pose.width * scale));
    const drawHeight = Math.max(1, Math.round(pose.height * scale));
    const centered = Math.round(RAW_CELL / 2 - (pose.feetX - pose.x) * scale);
    const left = Math.max(2, Math.min(RAW_CELL - 2 - drawWidth, centered));
    const top = FEET_Y - drawHeight;
    const cellX = (frame % RAW_COLS) * RAW_CELL;
    const cellY = Math.floor(frame / RAW_COLS) * RAW_CELL;

    context.save();

    if (options.flip) {
      context.translate(cellX + RAW_CELL, cellY);
      context.scale(-1, 1);
    } else {
      context.translate(cellX, cellY);
    }

    context.drawImage(source, pose.x, pose.y, pose.width, pose.height, left, top, drawWidth, drawHeight);
    context.restore();

    return {
      x: options.flip ? RAW_CELL - left - drawWidth : left,
      y: top,
      width: drawWidth,
      height: drawHeight
    };
  });

  return { canvas, frames: poses.length, boxes };
}

/**
 * Copy a spritesheet with its frames in reverse order (walk -> walk backward).
 * @param sheet - The sheet to reverse.
 */
export function reverseRawSheet(sheet: RawSheet): RawSheet {
  const canvas = makeCanvas(sheet.canvas.width, sheet.canvas.height);
  const context = canvas.getContext('2d');

  for (let frame = 0; frame < sheet.frames; frame += 1) {
    const from = sheet.frames - 1 - frame;

    context?.drawImage(
      sheet.canvas,
      (from % RAW_COLS) * RAW_CELL,
      Math.floor(from / RAW_COLS) * RAW_CELL,
      RAW_CELL,
      RAW_CELL,
      (frame % RAW_COLS) * RAW_CELL,
      Math.floor(frame / RAW_COLS) * RAW_CELL,
      RAW_CELL,
      RAW_CELL
    );
  }

  return { canvas, frames: sheet.frames, boxes: [...sheet.boxes].reverse() };
}

/**
 * Cut one frame out of a spritesheet as a square image (used for portraits).
 * @param sheet - The source sheet.
 * @param frame - Frame index to copy.
 */
export function frameToCanvas(sheet: RawSheet, frame = 0): HTMLCanvasElement {
  const canvas = makeCanvas(RAW_CELL, RAW_CELL);

  canvas
    .getContext('2d')
    ?.drawImage(
      sheet.canvas,
      (frame % RAW_COLS) * RAW_CELL,
      Math.floor(frame / RAW_COLS) * RAW_CELL,
      RAW_CELL,
      RAW_CELL,
      0,
      0,
      RAW_CELL,
      RAW_CELL
    );

  return canvas;
}

/**
 * A stand-in sheet (one grey silhouette with a question mark) for a fighter
 * whose images are missing, so the game still runs.
 */
export function placeholderRawSheet(): RawSheet {
  const canvas = makeCanvas(RAW_COLS * RAW_CELL, RAW_CELL);
  const context = canvas.getContext('2d');
  const box = { x: 88, y: FEET_Y - BODY_HEIGHT, width: 80, height: BODY_HEIGHT };

  if (context) {
    context.fillStyle = '#64748b';
    context.fillRect(box.x, box.y + 50, box.width, box.height - 50);
    context.beginPath();
    context.arc(RAW_CELL / 2, box.y + 26, 26, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#f8fafc';
    context.font = 'bold 64px monospace';
    context.textAlign = 'center';
    context.fillText('?', RAW_CELL / 2, box.y + 140);
  }

  return { canvas, frames: 1, boxes: [box] };
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  return canvas;
}

/**
 * Make the flat background transparent. The background colour is read from the
 * image border, so green, magenta or white backgrounds all work. Images that
 * are already transparent are left alone.
 */
function removeBackground(data: Uint8ClampedArray, width: number, height: number): void {
  const corners = [0, width - 1, (height - 1) * width, height * width - 1];

  if (corners.some((corner) => data[corner * 4 + 3] < 16)) {
    return;
  }

  const [red, green, blue] = borderColour(data, width, height);
  const greenScreen = green > red + 50 && green > blue + 50;
  const magentaScreen = red > green + 50 && blue > green + 50;

  const isBgColor = (offset: number, strict: boolean): boolean => {
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const dist = Math.hypot(r - red, g - green, b - blue);
    if (strict) {
      if (dist < 95) return true;
      if (greenScreen && g > 85 && g - r > 32 && g - b > 32) return true;
      if (magentaScreen && r > 150 && b > 150 && g < 105) return true;
      return false;
    }
    if (dist < 132) return true;
    if (greenScreen && g > r + 26 && g > b + 26 && g > 75) return true;
    if (magentaScreen && r > g + 34 && b > g + 34 && r > 100 && b > 100) return true;
    return false;
  };

  const total = width * height;
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

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + (width - 1));
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % width;
    const y = (idx - x) / width;
    if (x > 0) enqueue(idx - 1);
    if (x + 1 < width) enqueue(idx + 1);
    if (y > 0) enqueue(idx - width);
    if (y + 1 < height) enqueue(idx + width);
  }

  // Clear ALL enclosed chroma background gaps (even small 2px pockets between fingers/shoes)
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
      const cx = cur % width;
      const cy = (cur - cx) / width;
      const neighbors = [
        cx > 0 ? cur - 1 : -1,
        cx + 1 < width ? cur + 1 : -1,
        cy > 0 ? cur - width : -1,
        cy + 1 < height ? cur + width : -1
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

  // Two-ring outer contour cleanup + global green-spill clamp to eliminate any green halos/leafy specks
  for (let pass = 0; pass < 2; pass += 1) {
    const newlyCleared: number[] = [];
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const idx = y * width + x;
        if (bgMask[idx]) continue;
        const touchesBg =
          bgMask[idx - 1] ||
          bgMask[idx + 1] ||
          bgMask[idx - width] ||
          bgMask[idx + width] ||
          bgMask[idx - width - 1] ||
          bgMask[idx - width + 1] ||
          bgMask[idx + width - 1] ||
          bgMask[idx + width + 1];
        if (!touchesBg) continue;

        const offset = idx * 4;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];

        if (greenScreen && g > Math.max(r, b) + 22) {
          newlyCleared.push(idx);
          data[offset + 3] = 0;
        } else if (magentaScreen && r > g + 26 && b > g + 26) {
          newlyCleared.push(idx);
          data[offset + 3] = 0;
        } else {
          const dist = Math.hypot(r - red, g - green, b - blue);
          if (dist < 145) {
            data[offset + 3] = Math.round(Math.max(0, Math.min(255, ((dist - 75) / 70) * 255)));
          }
        }
      }
    }
    for (const idx of newlyCleared) {
      bgMask[idx] = 1;
    }
  }

  // Despill green/magenta reflections inside limbs/clothes gently without deleting interior pixels
  if (greenScreen || magentaScreen) {
    for (let idx = 0; idx < total; idx += 1) {
      if (bgMask[idx]) continue;
      const offset = idx * 4;
      if (data[offset + 3] === 0) continue;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];

      if (greenScreen && g > Math.max(r, b) + 14) {
        const cap = Math.max(r, b);
        data[offset + 1] = Math.round(cap + (g - cap) * 0.14);
      } else if (magentaScreen && r > g + 18 && b > g + 18) {
        data[offset] = Math.round(g + (r - g) * 0.25);
        data[offset + 2] = Math.round(g + (b - g) * 0.25);
      }
    }
  }

  // Erase only tiny detached noise specks (< 5px) while preserving detached fingers/sparks/details
  const speckSeen = new Uint8Array(total);
  const speckQueue: number[] = [];
  for (let idx = 0; idx < total; idx += 1) {
    if (speckSeen[idx] || data[idx * 4 + 3] <= 35) continue;
    speckQueue.length = 0;
    speckSeen[idx] = 1;
    speckQueue.push(idx);
    let qHead = 0;
    while (qHead < speckQueue.length) {
      const cur = speckQueue[qHead++];
      const cx = cur % width;
      const cy = (cur - cx) / width;
      const nbs = [
        cx > 0 ? cur - 1 : -1,
        cx + 1 < width ? cur + 1 : -1,
        cy > 0 ? cur - width : -1,
        cy + 1 < height ? cur + width : -1
      ];
      for (const n of nbs) {
        if (n >= 0 && !speckSeen[n] && data[n * 4 + 3] > 35) {
          speckSeen[n] = 1;
          speckQueue.push(n);
        }
      }
    }
    if (speckQueue.length < 5) {
      for (const p of speckQueue) {
        data[p * 4 + 3] = 0;
      }
    }
  }
}

function borderColour(data: Uint8ClampedArray, width: number, height: number): [number, number, number] {
  const samples: Array<[number, number, number]> = [];
  const push = (x: number, y: number): void => {
    const offset = (y * width + x) * 4;

    samples.push([data[offset], data[offset + 1], data[offset + 2]]);
  };

  for (let x = 0; x < width; x += 8) {
    push(x, 0);
    push(x, height - 1);
  }

  for (let y = 0; y < height; y += 8) {
    push(0, y);
    push(width - 1, y);
  }

  const median = (channel: 0 | 1 | 2): number =>
    samples.map((sample) => sample[channel]).sort((a, b) => a - b)[Math.floor(samples.length / 2)];

  return [median(0), median(1), median(2)];
}

/**
 * Find the poses: split the image into rows of poses, then each row into
 * poses, using the empty background between them. Small specks and text
 * labels are ignored.
 */
function findPoses(mask: Uint8Array, width: number, height: number): Pose[] {
  const rowCounts = new Array<number>(height).fill(0);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      rowCounts[y] += mask[y * width + x];
    }
  }

  const bands = findRuns(rowCounts, Math.max(2, width * 0.003), Math.max(4, height * 0.015));
  const tallestBand = Math.max(0, ...bands.map(([start, end]) => end - start));
  const poses: Pose[] = [];

  bands
    .filter(([start, end]) => end - start >= tallestBand * 0.3)
    .forEach(([bandTop, bandBottom]) => {
      const columnCounts = new Array<number>(width).fill(0);

      for (let y = bandTop; y < bandBottom; y += 1) {
        for (let x = 0; x < width; x += 1) {
          columnCounts[x] += mask[y * width + x];
        }
      }

      findRuns(columnCounts, 2, Math.max(4, width * 0.01)).forEach(([left, right]) => {
        const pose = measurePose(mask, width, left, right, bandTop, bandBottom);

        if (pose) {
          poses.push(pose);
        }
      });
    });

  const areas = poses.map((pose) => pose.area).sort((a, b) => a - b);
  const medianArea = areas[Math.floor(areas.length / 2)] ?? 0;

  return poses.filter((pose) => pose.area >= medianArea * 0.12);
}

/** Split the image into equal-width cells and take the pose inside each. */
function splitEvenly(mask: Uint8Array, width: number, height: number, frames: number): Pose[] {
  const poses: Pose[] = [];

  for (let frame = 0; frame < frames; frame += 1) {
    const pose = measurePose(
      mask,
      width,
      Math.round((frame * width) / frames),
      Math.round(((frame + 1) * width) / frames),
      0,
      height
    );

    if (pose) {
      poses.push(pose);
    }
  }

  return poses;
}

/** Runs of "filled" lines, merging runs separated by less than `minGap`. */
function findRuns(counts: number[], minCount: number, minGap: number): Array<[number, number]> {
  const runs: Array<[number, number]> = [];
  let start = -1;

  for (let index = 0; index <= counts.length; index += 1) {
    const filled = index < counts.length && counts[index] >= minCount;

    if (filled && start < 0) {
      start = index;
    } else if (!filled && start >= 0) {
      const previous = runs[runs.length - 1];

      if (previous && start - previous[1] < minGap) {
        previous[1] = index;
      } else {
        runs.push([start, index]);
      }

      start = -1;
    }
  }

  return runs;
}

/** Tight box, pixel count and feet centre of the pose inside a region. */
function measurePose(
  mask: Uint8Array,
  width: number,
  left: number,
  right: number,
  top: number,
  bottom: number
): Pose | null {
  let minX = right;
  let maxX = left - 1;
  let minY = bottom;
  let maxY = top - 1;
  let area = 0;

  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      if (mask[y * width + x]) {
        area += 1;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (area === 0) {
    return null;
  }

  const poseHeight = maxY - minY + 1;
  const feetTop = maxY - Math.max(2, Math.round(poseHeight * 0.1));
  let feetLeft = maxX;
  let feetRight = minX;

  for (let y = feetTop; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (mask[y * width + x]) {
        feetLeft = Math.min(feetLeft, x);
        feetRight = Math.max(feetRight, x);
      }
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: poseHeight,
    area,
    feetX: (feetLeft + feetRight) / 2
  };
}
