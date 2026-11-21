import type { ImageAsset } from './assets';
import { STAGE_ASSET_URLS } from './crossoverAssets';
import type { StagePreviewDebugState } from './types';

export interface StageDefinition {
  id: string;
  label: string;
  key: string;
  url: string;
  width: number;
  height: number;
}

export interface StageLayout {
  scale: number;
  displayWidth: number;
  displayHeight: number;
  maxScroll: number;
}

export const STAGE_PREVIEW_DEFAULT_PAN_SPEED = 140;
export const STAGE_PREVIEW_MIN_PAN_SPEED = 20;
export const STAGE_PREVIEW_MAX_PAN_SPEED = 600;

const STAGE_ASSET_ROOT = '/assets/backgrounds';

export const STAGE_DEFINITIONS: StageDefinition[] = [
  {
    id: 'storm-citadel',
    label: 'Storm Sky Citadel',
    key: 'storm-citadel-stage',
    url: STAGE_ASSET_URLS.stormCitadel,
    width: 1376,
    height: 768
  },
  {
    id: 'rooftop-sunset',
    label: 'Rooftop Sunset',
    key: 'rooftop-sunset-stage',
    url: `${STAGE_ASSET_ROOT}/rooftop-sunset-stage.png`,
    width: 2048,
    height: 768
  },
  {
    id: 'neon-alley',
    label: 'Cyber Neon Alley',
    key: 'neon-alley-stage',
    url: STAGE_ASSET_URLS.neonAlley,
    width: 1376,
    height: 768
  },
  {
    id: 'temple-dojo',
    label: 'Sakura Temple Dojo',
    key: 'temple-dojo-stage',
    url: STAGE_ASSET_URLS.templeDojo,
    width: 1376,
    height: 768
  },
  {
    id: 'volcano-arena',
    label: 'Volcanic Fortress',
    key: 'volcano-arena-stage',
    url: STAGE_ASSET_URLS.volcanoArena,
    width: 1376,
    height: 768
  },
  {
    id: 'space-station',
    label: 'Orbital Space Deck',
    key: 'space-station-stage',
    url: STAGE_ASSET_URLS.spaceStation,
    width: 1376,
    height: 768
  },
  {
    id: 'glacier-fortress',
    label: 'Glacier Ice Fortress',
    key: 'glacier-fortress-stage',
    url: STAGE_ASSET_URLS.glacierFortress,
    width: 1376,
    height: 768
  },
  {
    id: 'thunder-colosseum',
    label: 'Thunder Colosseum',
    key: 'thunder-colosseum-stage',
    url: STAGE_ASSET_URLS.thunderColosseum,
    width: 1376,
    height: 768
  },
  {
    id: 'shadow-shrine',
    label: 'Shadow Moon Shrine',
    key: 'shadow-shrine-stage',
    url: STAGE_ASSET_URLS.shadowShrine,
    width: 1376,
    height: 768
  }
];

export const STAGE_IMAGE_ASSETS: ImageAsset[] = STAGE_DEFINITIONS.map((stage) => ({
  kind: 'image',
  key: stage.key,
  url: stage.url,
  width: stage.width,
  height: stage.height,
  usage: `${stage.label} fighting arena background`
}));

export const DEFAULT_STAGE_PREVIEW_STATE: StagePreviewDebugState = {
  stageId: STAGE_DEFINITIONS[0].id,
  scrollX: 0,
  maxScroll: 0,
  displayWidth: 0,
  autoPan: false,
  panSpeed: STAGE_PREVIEW_DEFAULT_PAN_SPEED,
  showGuides: true
};

export function getStageDefinition(stageId: string): StageDefinition {
  return STAGE_DEFINITIONS.find((stage) => stage.id === stageId) ?? STAGE_DEFINITIONS[0];
}

export function getStageLayout(
  stageId: string,
  viewportWidth: number,
  viewportHeight: number
): StageLayout {
  const stage = getStageDefinition(stageId);
  const scale = viewportHeight / stage.height;
  const displayWidth = stage.width * scale;

  return {
    scale,
    displayWidth,
    displayHeight: viewportHeight,
    maxScroll: Math.max(0, displayWidth - viewportWidth)
  };
}

export function clampStageScroll(value: number, maxScroll: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(0, maxScroll), Math.max(0, value));
}

export function clampStagePanSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return STAGE_PREVIEW_DEFAULT_PAN_SPEED;
  }

  return Math.min(STAGE_PREVIEW_MAX_PAN_SPEED, Math.max(STAGE_PREVIEW_MIN_PAN_SPEED, Math.round(value)));
}
