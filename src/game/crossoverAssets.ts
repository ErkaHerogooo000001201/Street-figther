import stageStormCitadelUrl from '../assets/images/stage_storm_citadel_1795229522550.jpg';
import stageNeonAlleyUrl from '../assets/images/stage_neon_alley_1794712257696.jpg';
import stageTempleDojoUrl from '../assets/images/stage_temple_dojo_1794712258879.jpg';
import stageVolcanoArenaUrl from '../assets/images/stage_volcano_arena_1794712258502.jpg';
import stageSpaceStationUrl from '../assets/images/stage_space_station_1794712259947.jpg';

import sheetGokuUrl from '../assets/images/sheet_goku_1794712259751.jpg';
import sheetVegetaUrl from '../assets/images/sheet_vegeta_1794712815621.jpg';
import sheetFriezaUrl from '../assets/images/sheet_frieza_1794712818377.jpg';

import sheetNarutourl from '../assets/images/sheet_naruto_1794712262623.jpg';
import sheetSasukeUrl from '../assets/images/sheet_sasuke_1794712818930.jpg';
import sheetMadaraUrl from '../assets/images/sheet_madara_1794712819416.jpg';

import sheetLuffyUrl from '../assets/images/sheet_luffy_1794712263749.jpg';
import sheetZoroUrl from '../assets/images/sheet_zoro_1794712821132.jpg';
import sheetKaidoUrl from '../assets/images/sheet_kaido_1794712821644.jpg';

import sheetGojoUrl from '../assets/images/sheet_gojo_1794712262776.jpg';
import sheetSukunaUrl from '../assets/images/sheet_sukuna_1794712821320.jpg';
import sheetTojiUrl from '../assets/images/sheet_toji_1794712823012.jpg';

import sheetTanjiroUrl from '../assets/images/sheet_tanjiro_1794712264525.jpg';
import sheetAkazaUrl from '../assets/images/sheet_akaza_1794712824460.jpg';
import sheetMuzanUrl from '../assets/images/sheet_muzan_1794712918976.jpg';

import sheetSaitamaUrl from '../assets/images/sheet_saitama_1794712264790.jpg';
import sheetGarouUrl from '../assets/images/sheet_garou_1794712918805.jpg';
import sheetBorosUrl from '../assets/images/sheet_boros_1794712919802.jpg';

import sheetRyuUrl from '../assets/images/sheet_ryu_1794712266663.jpg';
import sheetChunliUrl from '../assets/images/sheet_chunli_1794712269240.jpg';
import sheetScorpionUrl from '../assets/images/sheet_scorpion_1794712269401.jpg';
import sheetSubzeroUrl from '../assets/images/sheet_subzero_1794712270194.jpg';
import sheetKratosUrl from '../assets/images/sheet_kratos_1794712270162.jpg';
import sheetCloudUrl from '../assets/images/sheet_cloud_1794712272123.jpg';
import sheetDanteUrl from '../assets/images/sheet_dante_1794712271985.jpg';
import sheetLinkUrl from '../assets/images/sheet_link_1794712273792.jpg';
import sheetMegamanUrl from '../assets/images/sheet_megaman_1794712275323.jpg';
import sheetSonicUrl from '../assets/images/sheet_sonic_1794712275408.jpg';
import sheetErkhembayarUrl from '../assets/images/sheet_erkhembayar_swag_1794715257007.jpg';

export const STAGE_ASSET_URLS = {
  stormCitadel: stageStormCitadelUrl,
  neonAlley: stageNeonAlleyUrl,
  templeDojo: stageTempleDojoUrl,
  volcanoArena: stageVolcanoArenaUrl,
  spaceStation: stageSpaceStationUrl
} as const;

export interface CrossoverSourceSheetSpec {
  id: string;
  textureKey: string;
  url: string;
  /** Bottom crop fraction (single or per-row [topRow, bottomRow]) to strip any generated text captions cleanly. */
  rowBottomCrop?: number | [number, number];
  /** Target standing body height inside the 256x256 canonical cell. */
  bodyHeight?: number;
  /** Inset cell borders and seed inside quadrants when a sheet contains thin grid divider lines. */
  trimGridLines?: boolean;
  /** Optional bespoke portrait photo URL to use instead of cropping the idle sprite. */
  portraitUrl?: string;
  /** Texture key for bespoke portrait photo preloaded at boot. */
  portraitKey?: string;
  /** Pose index in the 4x2 grid to use as idle/portrait when pose 0 faces backwards. */
  idlePoseIndex?: number;
}

export const CROSSOVER_SOURCE_SHEETS: CrossoverSourceSheetSpec[] = [
  // Dragon Ball
  { id: 'goku', textureKey: 'raw-sheet-goku', url: sheetGokuUrl },
  { id: 'vegeta', textureKey: 'raw-sheet-vegeta', url: sheetVegetaUrl },
  { id: 'frieza', textureKey: 'raw-sheet-frieza', url: sheetFriezaUrl, rowBottomCrop: [0.855, 0.90], bodyHeight: 192 },
  // Naruto
  { id: 'naruto', textureKey: 'raw-sheet-naruto', url: sheetNarutourl },
  { id: 'sasuke', textureKey: 'raw-sheet-sasuke', url: sheetSasukeUrl },
  { id: 'madara', textureKey: 'raw-sheet-madara', url: sheetMadaraUrl },
  // One Piece
  { id: 'luffy', textureKey: 'raw-sheet-luffy', url: sheetLuffyUrl },
  { id: 'zoro', textureKey: 'raw-sheet-zoro', url: sheetZoroUrl },
  { id: 'kaido', textureKey: 'raw-sheet-kaido', url: sheetKaidoUrl, trimGridLines: true, bodyHeight: 208 },
  // Jujutsu Kaisen
  { id: 'gojo', textureKey: 'raw-sheet-gojo', url: sheetGojoUrl },
  { id: 'sukuna', textureKey: 'raw-sheet-sukuna', url: sheetSukunaUrl },
  { id: 'toji', textureKey: 'raw-sheet-toji', url: sheetTojiUrl },
  // Demon Slayer
  { id: 'tanjiro', textureKey: 'raw-sheet-tanjiro', url: sheetTanjiroUrl },
  { id: 'akaza', textureKey: 'raw-sheet-akaza', url: sheetAkazaUrl },
  { id: 'muzan', textureKey: 'raw-sheet-muzan', url: sheetMuzanUrl },
  // One Punch Man
  { id: 'saitama', textureKey: 'raw-sheet-saitama', url: sheetSaitamaUrl },
  { id: 'garou', textureKey: 'raw-sheet-garou', url: sheetGarouUrl },
  { id: 'boros', textureKey: 'raw-sheet-boros', url: sheetBorosUrl, bodyHeight: 204 },
  // Video Game Legends
  { id: 'ryu', textureKey: 'raw-sheet-ryu', url: sheetRyuUrl },
  { id: 'chunli', textureKey: 'raw-sheet-chunli', url: sheetChunliUrl },
  { id: 'scorpion', textureKey: 'raw-sheet-scorpion', url: sheetScorpionUrl },
  { id: 'subzero', textureKey: 'raw-sheet-subzero', url: sheetSubzeroUrl, rowBottomCrop: [0.865, 0.918] },
  { id: 'kratos', textureKey: 'raw-sheet-kratos', url: sheetKratosUrl },
  { id: 'cloud', textureKey: 'raw-sheet-cloud', url: sheetCloudUrl },
  { id: 'dante', textureKey: 'raw-sheet-dante', url: sheetDanteUrl },
  { id: 'link', textureKey: 'raw-sheet-link', url: sheetLinkUrl },
  { id: 'megaman', textureKey: 'raw-sheet-megaman', url: sheetMegamanUrl, bodyHeight: 184 },
  { id: 'sonic', textureKey: 'raw-sheet-sonic', url: sheetSonicUrl, rowBottomCrop: [0.865, 0.902], bodyHeight: 176 },
  // Originals
  {
    id: 'erkhembayar',
    textureKey: 'raw-sheet-erkhembayar',
    url: sheetErkhembayarUrl,
    idlePoseIndex: 2
  }
];
