import * as Phaser from 'phaser';

import { AUDIO_KEYS, playAudioCue } from '../game/core/audio';
import { FIGHTER_CHARACTER_DEFINITIONS, type CharacterDefinition } from '../game/hero';
import { MY_FIGHTER_IDS } from '../game/myFighterLoader';
import { BOT_DIFFICULTIES } from '../game/settings';
import { getSpecialMoveSpec } from '../game/specialMoves';
import { getStageDefinition, STAGE_DEFINITIONS } from '../game/stageConfig';
import { SCENE_KEYS, type BotDifficulty, type MatchMode } from '../game/types';
import { BaseScene } from './BaseScene';

interface CharacterSelectData {
  mode: MatchMode;
  stageId: string;
  botDifficulty?: BotDifficulty;
}

type UniverseFilter = 'All' | 'Anime' | 'Game' | 'Original';

interface FilterTabOption {
  id: UniverseFilter;
  label: string;
  hotkey: string;
}

const FILTER_OPTIONS: FilterTabOption[] = [
  { id: 'All', label: 'ALL', hotkey: '1' },
  { id: 'Anime', label: 'ANIME', hotkey: '2' },
  { id: 'Game', label: 'GAMES', hotkey: '3' },
  { id: 'Original', label: 'ORIGINALS', hotkey: '4' }
];

const PAGE_SIZE = 28;
const P1_COLOR = 0x38bdf8;
const P2_COLOR = 0xf43f5e;

const BASE_ROSTER_ORDER = [
  'hero',
  'erkhembayar',
  'goku',
  'vegeta',
  'frieza',
  'naruto',
  'sasuke',
  'madara',
  'luffy',
  'zoro',
  'kaido',
  'gojo',
  'sukuna',
  'toji',
  'tanjiro',
  'akaza',
  'muzan',
  'saitama',
  'garou',
  'boros',
  'ryu',
  'chunli',
  'scorpion',
  'subzero',
  'kratos',
  'cloud',
  'dante',
  'link',
  'megaman',
  'sonic',
  'red-brawler',
  'jiujitsu-fighter',
  'green-boxer'
];

function buildSelectableRoster(): CharacterDefinition[] {
  const orderedIds = Array.from(new Set([...MY_FIGHTER_IDS, ...BASE_ROSTER_ORDER]));
  const result: CharacterDefinition[] = [];
  for (const id of orderedIds) {
    const found = FIGHTER_CHARACTER_DEFINITIONS.find((c) => c.id === id);
    if (found) {
      result.push(found);
    }
  }
  for (const character of FIGHTER_CHARACTER_DEFINITIONS) {
    if (!result.some((c) => c.id === character.id)) {
      result.push(character);
    }
  }
  return result;
}

interface GridLayout {
  cols: number;
  cardWidth: number;
  cardHeight: number;
  gapX: number;
  gapY: number;
  portraitSize: number;
  portraitY: number;
  nameY: number;
  nameFontSize: string;
  originY: number;
  originFontSize: string;
}

function resolveGridLayout(count: number): GridLayout {
  if (count > 18) {
    return {
      cols: 7,
      cardWidth: 148,
      cardHeight: 86,
      gapX: 12,
      gapY: 10,
      portraitSize: 44,
      portraitY: -14,
      nameY: 16,
      nameFontSize: '12px',
      originY: 31,
      originFontSize: '9px'
    };
  }
  if (count > 10) {
    return {
      cols: 6,
      cardWidth: 170,
      cardHeight: 106,
      gapX: 14,
      gapY: 14,
      portraitSize: 54,
      portraitY: -18,
      nameY: 20,
      nameFontSize: '14px',
      originY: 36,
      originFontSize: '10px'
    };
  }
  return {
    cols: 5,
    cardWidth: 176,
    cardHeight: 112,
    gapX: 16,
    gapY: 16,
    portraitSize: 56,
    portraitY: -18,
    nameY: 21,
    nameFontSize: '14px',
    originY: 38,
    originFontSize: '10px'
  };
}

interface GridCard {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  flash: Phaser.GameObjects.Rectangle;
  flashLock(onComplete: () => void): void;
  destroy(): void;
}

interface PlayerCursor {
  page: number;
  index: number;
  locked: boolean;
  characterId: string;
  outline: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

interface SpotlightPanel {
  title: Phaser.GameObjects.Text;
  origin: Phaser.GameObjects.Text;
  specialName: Phaser.GameObjects.Text;
  specialDesc: Phaser.GameObjects.Text;
  portrait: Phaser.GameObjects.Image;
  accentBar: Phaser.GameObjects.Rectangle;
}

interface FilterTabButton {
  id: UniverseFilter;
  bg: Phaser.GameObjects.Rectangle;
  underline: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

/**
 * Character Select screen displaying the 100-fighter roster across clean pages
 * with universe filter tabs, special move spotlights, stage toggle, Bot
 * Difficulty toggle, 2D keyboard navigation, and click lock.
 */
export class CharacterSelectScene extends BaseScene {
  private mode: MatchMode = '1v1';
  private stageId = STAGE_DEFINITIONS[0].id;
  private botDifficulty: BotDifficulty = 'hard';
  private allRoster: CharacterDefinition[] = [];
  private roster: CharacterDefinition[] = [];
  private pagedRoster: CharacterDefinition[] = [];
  private currentPage = 0;
  private totalPages = 1;
  private activeFilter: UniverseFilter = 'All';
  private layout: GridLayout = resolveGridLayout(PAGE_SIZE);
  private filterTabs: FilterTabButton[] = [];
  private cards: GridCard[] = [];
  private cardPositions: Array<{ x: number; y: number }> = [];
  private p1!: PlayerCursor;
  private p2!: PlayerCursor;
  private p1Spotlight!: SpotlightPanel;
  private p2Spotlight!: SpotlightPanel;
  private stageButtonText!: Phaser.GameObjects.Text;
  private botButtonText?: Phaser.GameObjects.Text;
  private prevPageBtn!: Phaser.GameObjects.Text;
  private nextPageBtn!: Phaser.GameObjects.Text;
  private pageStatusText!: Phaser.GameObjects.Text;
  private transitioning = false;

  constructor() {
    super(SCENE_KEYS.CharacterSelect);
  }

  init(data: CharacterSelectData): void {
    this.mode = data?.mode ?? '1vcpu';
    this.stageId = data?.stageId || STAGE_DEFINITIONS[0].id;
    this.botDifficulty = data?.botDifficulty ?? this.app.settingsStore.getState().botDifficulty ?? 'hard';
  }

  create(): void {
    this.allRoster = buildSelectableRoster();
    this.activeFilter = 'All';
    this.roster = [...this.allRoster];
    this.currentPage = 0;
    this.totalPages = Math.max(1, Math.ceil(this.roster.length / PAGE_SIZE));
    this.pagedRoster = this.roster.slice(0, PAGE_SIZE);
    this.layout = resolveGridLayout(this.pagedRoster.length);
    this.filterTabs = [];
    this.cards = [];
    this.cardPositions = [];
    this.transitioning = false;

    this.markActiveScene(SCENE_KEYS.CharacterSelect);
    this.cameras.main.setBackgroundColor(0x020617);

    const { centerX } = this.cameras.main;
    this.add
      .text(centerX, 24, `Select Fighter (${this.allRoster.length})`, {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '26px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(
        centerX,
        49,
        this.mode === '1v1'
          ? 'P1: WASD + Space/F  •  P2: Arrows + Enter  •  Click cards to lock'
          : 'Click any fighter (or WASD / Arrows + Enter) to fight!',
        {
          color: '#94a3b8',
          fontFamily: 'monospace',
          fontSize: '12px'
        }
      )
      .setOrigin(0.5);

    this.buildTopControls();
    this.buildFilterTabs();
    this.buildPageBar();
    this.buildCards();
    this.buildSpotlights();
    this.buildCursors();
    this.registerInput();

    this.createFooterHint('1-4 / Q: Filter  •  [ / ]: Page  •  B: Bot Level  •  Tab: Stage  •  Esc: Back');

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cards.forEach((card) => card.destroy());
      this.cards = [];
      this.filterTabs = [];
    });
  }

  private buildTopControls(): void {
    if (this.mode === '1vcpu') {
      this.botButtonText = this.add
        .text(24, 24, `Bot: ${this.botDifficulty.toUpperCase()} [B]`, {
          color: '#facc15',
          fontFamily: 'monospace',
          fontSize: '13px',
          fontStyle: 'bold',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          padding: { x: 10, y: 6 }
        })
        .setOrigin(0, 0.5)
        .setDepth(30)
        .setInteractive({ useHandCursor: true });

      this.botButtonText.on('pointerover', () => this.botButtonText?.setColor('#fef08a'));
      this.botButtonText.on('pointerout', () => this.botButtonText?.setColor('#facc15'));
      this.botButtonText.on('pointerdown', () => this.cycleBotDifficulty());
    }

    const stage = getStageDefinition(this.stageId);
    this.stageButtonText = this.add
      .text(this.cameras.main.width - 24, 24, `Stage: ${stage.label} [Tab]`, {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        padding: { x: 10, y: 6 }
      })
      .setOrigin(1, 0.5)
      .setDepth(30)
      .setInteractive({ useHandCursor: true });

    this.stageButtonText.on('pointerover', () => this.stageButtonText.setColor('#facc15'));
    this.stageButtonText.on('pointerout', () => this.stageButtonText.setColor('#e2e8f0'));
    this.stageButtonText.on('pointerdown', () => this.cycleStage());
  }

  private cycleBotDifficulty(): void {
    if (this.transitioning || this.mode !== '1vcpu') {
      return;
    }
    const idx = BOT_DIFFICULTIES.indexOf(this.botDifficulty);
    this.botDifficulty = BOT_DIFFICULTIES[(idx + 1) % BOT_DIFFICULTIES.length];
    this.app.settingsStore.patchState({ botDifficulty: this.botDifficulty });
    this.botButtonText?.setText(`Bot: ${this.botDifficulty.toUpperCase()} [B]`);
    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
  }

  private cycleStage(): void {
    if (this.transitioning) {
      return;
    }
    const idx = STAGE_DEFINITIONS.findIndex((s) => s.id === this.stageId);
    const next = STAGE_DEFINITIONS[(idx + 1) % STAGE_DEFINITIONS.length];
    this.stageId = next.id;
    this.stageButtonText.setText(`Stage: ${next.label} [Tab]`);
    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
  }

  private buildFilterTabs(): void {
    const { centerX } = this.cameras.main;
    const tabW = 148;
    const tabH = 26;
    const gap = 10;
    const totalW = FILTER_OPTIONS.length * tabW + (FILTER_OPTIONS.length - 1) * gap;
    const startX = centerX - totalW / 2 + tabW / 2;
    const y = 76;

    FILTER_OPTIONS.forEach((opt, idx) => {
      const count =
        opt.id === 'All'
          ? this.allRoster.length
          : this.allRoster.filter((c) => getSpecialMoveSpec(c.id).universe === opt.id).length;

      const x = startX + idx * (tabW + gap);
      const bg = this.add
        .rectangle(x, y, tabW, tabH, 0x0f172a, 0.94)
        .setStrokeStyle(1, 0x334155, 1)
        .setDepth(25)
        .setInteractive({ useHandCursor: true });

      const underline = this.add
        .rectangle(x, y + tabH / 2 - 1.5, tabW - 4, 3, 0x38bdf8, 1)
        .setDepth(26);

      const text = this.add
        .text(x, y - 1, `[${opt.hotkey}] ${opt.label} (${count})`, {
          color: '#cbd5e1',
          fontFamily: 'monospace',
          fontSize: '11px',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setDepth(27);

      bg.on('pointerover', () => {
        if (this.activeFilter !== opt.id) {
          bg.setFillStyle(0x1e293b, 1);
          text.setColor('#f8fafc');
        }
      });
      bg.on('pointerout', () => this.refreshFilterTabs());
      bg.on('pointerdown', () => this.applyFilter(opt.id));

      this.filterTabs.push({ id: opt.id, bg, underline, text });
    });

    this.refreshFilterTabs();
  }

  private buildPageBar(): void {
    const { centerX } = this.cameras.main;
    const y = 524;

    this.prevPageBtn = this.add
      .text(centerX - 185, y, '◀ PREV [[]', {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        padding: { x: 10, y: 4 }
      })
      .setOrigin(0.5)
      .setDepth(25)
      .setInteractive({ useHandCursor: true });

    this.pageStatusText = this.add
      .text(centerX, y, '', {
        color: '#facc15',
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(25);

    this.nextPageBtn = this.add
      .text(centerX + 185, y, 'NEXT []] ▶', {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        padding: { x: 10, y: 4 }
      })
      .setOrigin(0.5)
      .setDepth(25)
      .setInteractive({ useHandCursor: true });

    this.prevPageBtn.on('pointerover', () => this.prevPageBtn.setColor('#38bdf8'));
    this.prevPageBtn.on('pointerout', () => this.refreshPageBar());
    this.prevPageBtn.on('pointerdown', () => this.changePage(-1));

    this.nextPageBtn.on('pointerover', () => this.nextPageBtn.setColor('#38bdf8'));
    this.nextPageBtn.on('pointerout', () => this.refreshPageBar());
    this.nextPageBtn.on('pointerdown', () => this.changePage(1));

    this.refreshPageBar();
  }

  private refreshPageBar(): void {
    const startIdx = this.currentPage * PAGE_SIZE + 1;
    const endIdx = Math.min(this.roster.length, (this.currentPage + 1) * PAGE_SIZE);
    this.pageStatusText.setText(
      `PAGE ${this.currentPage + 1} / ${this.totalPages}  •  #${startIdx}-${endIdx} of ${this.roster.length}`
    );

    const multiPage = this.totalPages > 1;
    this.prevPageBtn.setVisible(multiPage).setColor('#e2e8f0');
    this.nextPageBtn.setVisible(multiPage).setColor('#e2e8f0');
  }

  private refreshFilterTabs(): void {
    this.filterTabs.forEach((tab) => {
      const active = tab.id === this.activeFilter;
      tab.bg.setFillStyle(active ? 0x1e293b : 0x0f172a, active ? 1 : 0.9);
      tab.bg.setStrokeStyle(active ? 2 : 1, active ? 0x38bdf8 : 0x334155, 1);
      tab.underline.setVisible(active);
      tab.text.setColor(active ? '#f8fafc' : '#94a3b8');
    });
  }

  private applyFilter(filter: UniverseFilter): void {
    if (this.transitioning || this.p1.locked || this.p2.locked || this.activeFilter === filter) {
      return;
    }

    this.activeFilter = filter;
    this.roster =
      filter === 'All'
        ? [...this.allRoster]
        : this.allRoster.filter((c) => getSpecialMoveSpec(c.id).universe === filter);

    if (this.roster.length === 0) {
      this.roster = [...this.allRoster];
      this.activeFilter = 'All';
    }

    this.currentPage = 0;
    this.totalPages = Math.max(1, Math.ceil(this.roster.length / PAGE_SIZE));
    this.pagedRoster = this.roster.slice(0, PAGE_SIZE);
    this.layout = resolveGridLayout(this.pagedRoster.length);
    this.refreshFilterTabs();
    this.refreshPageBar();
    this.rebuildCardsAndResetCursors();
    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
  }

  private cycleFilter(): void {
    const idx = FILTER_OPTIONS.findIndex((o) => o.id === this.activeFilter);
    const next = FILTER_OPTIONS[(idx + 1) % FILTER_OPTIONS.length];
    this.applyFilter(next.id);
  }

  private changePage(delta: number, preferEndIndex = false): void {
    if (this.transitioning || this.totalPages <= 1) {
      return;
    }
    const targetPage = Phaser.Math.Wrap(this.currentPage + delta, 0, this.totalPages);
    this.setPage(targetPage, preferEndIndex);
    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
  }

  private setPage(page: number, preferEndIndex = false): void {
    this.currentPage = Phaser.Math.Clamp(page, 0, this.totalPages - 1);
    const start = this.currentPage * PAGE_SIZE;
    this.pagedRoster = this.roster.slice(start, start + PAGE_SIZE);
    this.layout = resolveGridLayout(this.pagedRoster.length);

    this.cards.forEach((card) => card.destroy());
    this.cards = [];
    this.cardPositions = [];
    this.buildCards();
    this.refreshPageBar();

    this.p1.outline.setSize(this.layout.cardWidth + 8, this.layout.cardHeight + 8);
    this.p2.outline.setSize(this.layout.cardWidth + 8, this.layout.cardHeight + 8);

    const unlockedCursor = !this.p1.locked ? this.p1 : this.mode === '1v1' && !this.p2.locked ? this.p2 : null;
    if (unlockedCursor) {
      unlockedCursor.page = this.currentPage;
      unlockedCursor.index = preferEndIndex ? this.pagedRoster.length - 1 : 0;
      if (this.mode === '1v1' && this.otherCursor(unlockedCursor).page === this.currentPage) {
        const other = this.otherCursor(unlockedCursor);
        if (unlockedCursor.index === other.index && this.pagedRoster.length > 1) {
          unlockedCursor.index = unlockedCursor.index === 0 ? 1 : unlockedCursor.index - 1;
        }
      }
      const picked = this.pagedRoster[unlockedCursor.index];
      if (picked) {
        unlockedCursor.characterId = picked.id;
      }
    }

    this.refreshCursor(this.p1);
    this.refreshCursor(this.p2);
  }

  private rebuildCardsAndResetCursors(): void {
    this.cards.forEach((card) => card.destroy());
    this.cards = [];
    this.cardPositions = [];
    this.buildCards();

    this.p1.page = 0;
    this.p1.index = 0;
    this.p1.characterId = this.pagedRoster[0]?.id ?? this.allRoster[0].id;

    const p2Idx = this.mode === '1v1' ? Math.min(1, this.pagedRoster.length - 1) : 0;
    this.p2.page = 0;
    this.p2.index = p2Idx;
    this.p2.characterId = this.pagedRoster[p2Idx]?.id ?? this.allRoster[0].id;

    this.p1.outline.setSize(this.layout.cardWidth + 8, this.layout.cardHeight + 8);
    this.p2.outline.setSize(this.layout.cardWidth + 8, this.layout.cardHeight + 8);

    this.refreshCursor(this.p1);
    this.refreshCursor(this.p2);
    this.updateSpotlight(this.p1Spotlight, this.findCharacterById(this.p1.characterId), false);
    this.updateSpotlight(
      this.p2Spotlight,
      this.findCharacterById(this.p2.characterId),
      this.mode === '1vcpu' && !this.p2.locked
    );
  }

  private buildCards(): void {
    const { centerX } = this.cameras.main;
    const { cols, cardWidth, cardHeight, gapX, gapY } = this.layout;
    const rows = Math.ceil(this.pagedRoster.length / cols);
    const gridW =
      Math.min(cols, this.pagedRoster.length) * cardWidth + (Math.min(cols, this.pagedRoster.length) - 1) * gapX;
    const gridH = rows * cardHeight + Math.max(0, rows - 1) * gapY;

    const areaTop = 100;
    const areaBottom = 502;
    const startX = centerX - gridW / 2 + cardWidth / 2;
    const startY = areaTop + Math.max(0, (areaBottom - areaTop - gridH) / 2) + cardHeight / 2;

    this.pagedRoster.forEach((character, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);
      this.cardPositions.push({ x, y });

      const spec = getSpecialMoveSpec(character.id);
      const card = this.createGridCard(x, y, character, spec.themeColor, spec.origin, index);
      this.cards.push(card);
    });
  }

  private createGridCard(
    x: number,
    y: number,
    character: CharacterDefinition,
    themeColor: number,
    origin: string,
    index: number
  ): GridCard {
    const { cardWidth, cardHeight, portraitSize, portraitY, nameY, nameFontSize, originY, originFontSize } = this.layout;

    const bg = this.add
      .rectangle(0, 0, cardWidth, cardHeight, 0x0f172a, 0.94)
      .setStrokeStyle(2, 0x334155, 1);

    const accentStripe = this.add
      .rectangle(0, -cardHeight / 2 + 2, cardWidth - 4, 3, themeColor, 0.9)
      .setOrigin(0.5);

    const children: Phaser.GameObjects.GameObject[] = [bg, accentStripe];

    if (this.textures.exists(character.portrait.key)) {
      const img = this.add.image(0, portraitY, character.portrait.key).setOrigin(0.5);
      const src = Math.max(img.width, img.height) || portraitSize;
      img.setScale(portraitSize / src);
      children.push(img);
    }

    const nameText = this.add
      .text(0, nameY, character.label, {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: nameFontSize,
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    children.push(nameText);

    const originText = this.add
      .text(0, originY, origin, {
        color: '#94a3b8',
        fontFamily: 'monospace',
        fontSize: originFontSize
      })
      .setOrigin(0.5);
    children.push(originText);

    const flash = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xffffff, 0).setOrigin(0.5);
    children.push(flash);

    const container = this.add.container(x, y, children);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => this.hoverCard(index));
    bg.on('pointerdown', () => this.clickCard(index));

    return {
      container,
      bg,
      flash,
      flashLock: (onComplete: () => void) => {
        this.tweens.add({
          targets: flash,
          alpha: { from: 0, to: 0.85 },
          duration: 85,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            flash.setAlpha(0);
            onComplete();
          }
        });
      },
      destroy: () => container.destroy(true)
    };
  }

  private buildSpotlights(): void {
    const { centerX } = this.cameras.main;
    const panelY = 602;
    this.p1Spotlight = this.createSpotlight(centerX - 295, panelY, 'P1', P1_COLOR, true);
    this.p2Spotlight = this.createSpotlight(
      centerX + 295,
      panelY,
      this.mode === '1vcpu' ? 'CPU' : 'P2',
      P2_COLOR,
      false
    );
  }

  private createSpotlight(
    x: number,
    y: number,
    sideLabel: string,
    sideColor: number,
    faceRight: boolean
  ): SpotlightPanel {
    const panelW = 550;
    const panelH = 114;
    const bg = this.add
      .rectangle(x, y, panelW, panelH, 0x0f172a, 0.92)
      .setStrokeStyle(2, sideColor, 0.8);

    const accentBar = this.add.rectangle(x - panelW / 2 + 4, y, 6, panelH - 8, sideColor, 1);

    const portraitX = faceRight ? x - panelW / 2 + 60 : x + panelW / 2 - 60;
    this.add
      .rectangle(portraitX, y, 88, 88, 0x020617, 0.9)
      .setStrokeStyle(2, 0x334155, 1);

    const portrait = this.add.image(portraitX, y, this.roster[0].portrait.key).setFlipX(faceRight);
    const maxP = 80;
    const pSrc = Math.max(portrait.width, portrait.height) || maxP;
    portrait.setScale(maxP / pSrc);

    const textLeft = faceRight ? portraitX + 58 : x - panelW / 2 + 20;
    const sideBadge = this.add
      .text(textLeft, y - 36, sideLabel, {
        color: '#020617',
        backgroundColor: colorToCss(sideColor),
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        padding: { x: 6, y: 2 }
      })
      .setOrigin(0, 0.5);

    const title = this.add
      .text(sideBadge.x + sideBadge.width + 12, y - 36, '', {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold'
      })
      .setOrigin(0, 0.5);

    const origin = this.add
      .text(textLeft, y - 14, '', {
        color: '#94a3b8',
        fontFamily: 'monospace',
        fontSize: '12px'
      })
      .setOrigin(0, 0.5);

    const specialName = this.add
      .text(textLeft, y + 10, '', {
        color: '#facc15',
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold'
      })
      .setOrigin(0, 0.5);

    const specialDesc = this.add
      .text(textLeft, y + 34, '', {
        color: '#cbd5e1',
        fontFamily: 'monospace',
        fontSize: '11px',
        wordWrap: { width: panelW - 146 }
      })
      .setOrigin(0, 0.5);

    bg.setDepth(5);
    return { title, origin, specialName, specialDesc, portrait, accentBar };
  }

  private findCharacterById(id: string): CharacterDefinition {
    return this.allRoster.find((c) => c.id === id) ?? this.allRoster[0];
  }

  private updateSpotlight(panel: SpotlightPanel, character: CharacterDefinition | undefined, hidden = false): void {
    if (!character) {
      return;
    }

    if (hidden) {
      panel.title.setText('??? (Random from 99 Rivals)');
      panel.origin.setText(`CPU Challenger • ${this.botDifficulty.toUpperCase()} AI`);
      panel.specialName.setText('SPECIAL: Pick your fighter first');
      panel.specialDesc.setText('Click any fighter above to battle across all 100 fighters.');
      panel.portrait.setAlpha(0.25);
      return;
    }

    const spec = getSpecialMoveSpec(character.id);
    panel.portrait.setAlpha(1);
    if (this.textures.exists(character.portrait.key)) {
      panel.portrait.setTexture(character.portrait.key);
      const maxP = 80;
      const pSrc = Math.max(panel.portrait.width, panel.portrait.height) || maxP;
      panel.portrait.setScale(maxP / pSrc);
    }

    panel.title.setText(character.label);
    panel.origin.setText(`${spec.universe} • ${spec.origin}`);
    panel.specialName.setText(`SPECIAL: ${spec.name}`).setColor(colorToCss(spec.themeColor));
    panel.specialDesc.setText(spec.tagline);
    panel.accentBar.setFillStyle(spec.themeColor, 1);
  }

  private buildCursors(): void {
    const p1Char = this.pagedRoster[0] ?? this.allRoster[0];
    this.p1 = this.createCursor('P1', P1_COLOR, 0, p1Char.id);

    const p2Start = this.mode === '1v1' ? Math.min(1, this.cards.length - 1) : 0;
    const p2Char = this.pagedRoster[p2Start] ?? p1Char;
    this.p2 = this.createCursor(this.mode === '1vcpu' ? 'CPU' : 'P2', P2_COLOR, p2Start, p2Char.id);

    if (this.mode === '1vcpu') {
      this.p2.outline.setVisible(false);
      this.p2.label.setVisible(false);
    }

    this.refreshCursor(this.p1);
    this.refreshCursor(this.p2);
    this.updateSpotlight(this.p1Spotlight, p1Char, false);
    this.updateSpotlight(this.p2Spotlight, p2Char, this.mode === '1vcpu' && !this.p2.locked);
  }

  private createCursor(label: string, color: number, index: number, characterId: string): PlayerCursor {
    const outline = this.add
      .rectangle(0, 0, this.layout.cardWidth + 8, this.layout.cardHeight + 8, color, 0)
      .setStrokeStyle(3, color, 1)
      .setDepth(20);

    const text = this.add
      .text(0, 0, label, {
        color: '#020617',
        backgroundColor: colorToCss(color),
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        padding: { x: 5, y: 1 }
      })
      .setOrigin(0.5)
      .setDepth(21);

    return { page: 0, index, locked: false, characterId, outline, label: text };
  }

  private refreshCursor(cursor: PlayerCursor): void {
    const isP2HiddenCpu = cursor === this.p2 && this.mode === '1vcpu' && !cursor.locked;
    const onVisiblePage = cursor.page === this.currentPage;
    const position = this.cardPositions[cursor.index];

    if (isP2HiddenCpu || !onVisiblePage || !position) {
      cursor.outline.setVisible(false);
      cursor.label.setVisible(false);
    } else {
      cursor.outline.setVisible(true);
      cursor.label.setVisible(true);
      cursor.outline.setPosition(position.x, position.y);
      cursor.outline.setStrokeStyle(cursor.locked ? 5 : 3, cursor.outline.strokeColor, 1);
      const badgeOffsetX =
        cursor === this.p1 ? -this.layout.cardWidth / 2 + 18 : this.layout.cardWidth / 2 - 20;
      cursor.label.setPosition(position.x + badgeOffsetX, position.y - this.layout.cardHeight / 2 - 9);
    }

    const character = this.findCharacterById(cursor.characterId);
    if (cursor === this.p1) {
      this.updateSpotlight(this.p1Spotlight, character, false);
    } else if (this.mode === '1v1' || cursor.locked) {
      this.updateSpotlight(this.p2Spotlight, character, false);
    }
  }

  private registerInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    if (this.mode === '1v1') {
      keyboard.on('keydown-A', () => this.movePlayer(this.p1, -1));
      keyboard.on('keydown-D', () => this.movePlayer(this.p1, 1));
      keyboard.on('keydown-W', () => this.movePlayer(this.p1, -this.layout.cols));
      keyboard.on('keydown-S', () => this.movePlayer(this.p1, this.layout.cols));

      keyboard.on('keydown-LEFT', () => this.movePlayer(this.p2, -1));
      keyboard.on('keydown-RIGHT', () => this.movePlayer(this.p2, 1));
      keyboard.on('keydown-UP', () => this.movePlayer(this.p2, -this.layout.cols));
      keyboard.on('keydown-DOWN', () => this.movePlayer(this.p2, this.layout.cols));

      keyboard.on('keydown-SPACE', () => this.confirmPlayer(this.p1));
      keyboard.on('keydown-F', () => this.confirmPlayer(this.p1));
      keyboard.on('keydown-ENTER', () => this.confirmPlayer(this.p2));
    } else {
      const move = (delta: number): void => this.movePlayer(this.p1, delta);
      keyboard.on('keydown-A', () => move(-1));
      keyboard.on('keydown-LEFT', () => move(-1));
      keyboard.on('keydown-D', () => move(1));
      keyboard.on('keydown-RIGHT', () => move(1));
      keyboard.on('keydown-W', () => move(-this.layout.cols));
      keyboard.on('keydown-UP', () => move(-this.layout.cols));
      keyboard.on('keydown-S', () => move(this.layout.cols));
      keyboard.on('keydown-DOWN', () => move(this.layout.cols));
      keyboard.on('keydown-SPACE', () => this.confirmPlayer(this.p1));
      keyboard.on('keydown-F', () => this.confirmPlayer(this.p1));
      keyboard.on('keydown-ENTER', () => this.confirmPlayer(this.p1));
      keyboard.on('keydown-B', () => this.cycleBotDifficulty());
    }

    keyboard.on('keydown-ONE', () => this.applyFilter('All'));
    keyboard.on('keydown-TWO', () => this.applyFilter('Anime'));
    keyboard.on('keydown-THREE', () => this.applyFilter('Game'));
    keyboard.on('keydown-FOUR', () => this.applyFilter('Original'));
    keyboard.on('keydown-Q', () => this.cycleFilter());
    keyboard.on('keydown-OPEN_BRACKET', () => this.changePage(-1));
    keyboard.on('keydown-CLOSED_BRACKET', () => this.changePage(1));
    keyboard.on('keydown-PAGE_UP', () => this.changePage(-1));
    keyboard.on('keydown-PAGE_DOWN', () => this.changePage(1));

    keyboard.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      this.cycleStage();
    });
    keyboard.on('keydown-ESC', () => this.goBack());
    keyboard.on('keydown-BACKSPACE', () => this.goBack());
  }

  private movePlayer(cursor: PlayerCursor, delta: number): void {
    if (this.transitioning || cursor.locked) {
      return;
    }

    if (cursor.page !== this.currentPage) {
      cursor.page = this.currentPage;
      cursor.index = 0;
    }

    const count = this.cards.length;
    if (count === 0) {
      return;
    }

    // Turn pages cleanly when stepping past first/last card in 1vCPU or unlocked 1v1
    if (this.totalPages > 1) {
      if (delta === -1 && cursor.index === 0) {
        this.changePage(-1, true);
        return;
      }
      if (delta === 1 && cursor.index === count - 1) {
        this.changePage(1, false);
        return;
      }
    }

    const other = this.otherCursor(cursor);
    let next = Phaser.Math.Wrap(cursor.index + delta, 0, count);

    if (this.mode === '1v1' && other.page === this.currentPage && next === other.index) {
      const step = delta >= 0 ? 1 : -1;
      const skip = Phaser.Math.Wrap(next + step, 0, count);

      if (skip !== cursor.index) {
        next = skip;
      } else if (!other.locked) {
        other.index = cursor.index;
        other.characterId = this.pagedRoster[other.index]?.id ?? other.characterId;
        cursor.index = next;
        cursor.characterId = this.pagedRoster[cursor.index]?.id ?? cursor.characterId;
        this.refreshCursor(cursor);
        this.refreshCursor(other);
        return;
      } else {
        return;
      }
    }

    cursor.page = this.currentPage;
    cursor.index = next;
    cursor.characterId = this.pagedRoster[next]?.id ?? cursor.characterId;
    this.refreshCursor(cursor);
  }

  private otherCursor(cursor: PlayerCursor): PlayerCursor {
    return cursor === this.p1 ? this.p2 : this.p1;
  }

  private hoverCard(index: number): void {
    if (this.transitioning) {
      return;
    }
    const char = this.pagedRoster[index];
    if (!char) {
      return;
    }

    if (this.mode === '1vcpu' && !this.p1.locked) {
      this.p1.page = this.currentPage;
      this.p1.index = index;
      this.p1.characterId = char.id;
      this.refreshCursor(this.p1);
    } else if (this.mode === '1v1') {
      const p2OnSame = this.p2.page === this.currentPage && index === this.p2.index;
      const p1OnSame = this.p1.page === this.currentPage && index === this.p1.index;
      if (!this.p1.locked && !p2OnSame) {
        this.p1.page = this.currentPage;
        this.p1.index = index;
        this.p1.characterId = char.id;
        this.refreshCursor(this.p1);
      } else if (this.p1.locked && !this.p2.locked && !p1OnSame) {
        this.p2.page = this.currentPage;
        this.p2.index = index;
        this.p2.characterId = char.id;
        this.refreshCursor(this.p2);
      }
    }
  }

  private clickCard(index: number): void {
    if (this.transitioning) {
      return;
    }
    const char = this.pagedRoster[index];
    if (!char) {
      return;
    }

    if (this.mode === '1vcpu') {
      this.p1.page = this.currentPage;
      this.p1.index = index;
      this.p1.characterId = char.id;
      this.refreshCursor(this.p1);
      this.confirmPlayer(this.p1);
      return;
    }

    const p2OnSame = this.p2.page === this.currentPage && index === this.p2.index;
    const p1OnSame = this.p1.page === this.currentPage && index === this.p1.index;

    if (!this.p1.locked && !p2OnSame) {
      this.p1.page = this.currentPage;
      this.p1.index = index;
      this.p1.characterId = char.id;
      this.refreshCursor(this.p1);
      this.confirmPlayer(this.p1);
    } else if (this.p1.locked && !this.p2.locked && !p1OnSame) {
      this.p2.page = this.currentPage;
      this.p2.index = index;
      this.p2.characterId = char.id;
      this.refreshCursor(this.p2);
      this.confirmPlayer(this.p2);
    }
  }

  private confirmPlayer(cursor: PlayerCursor): void {
    if (this.transitioning || cursor.locked) {
      return;
    }

    if (cursor.page === this.currentPage && this.pagedRoster[cursor.index]) {
      cursor.characterId = this.pagedRoster[cursor.index].id;
    }

    cursor.locked = true;
    this.refreshCursor(cursor);
    playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());

    const card = cursor.page === this.currentPage ? this.cards[cursor.index] : undefined;
    const onDone = (): void => {
      if (this.mode === '1vcpu') {
        this.runCpuSelection();
        return;
      }

      if (this.p1.locked && this.p2.locked) {
        this.startMatch();
      }
    };

    if (card) {
      card.flashLock(onDone);
    } else {
      onDone();
    }
  }

  private runCpuSelection(): void {
    if (this.transitioning) {
      return;
    }

    this.transitioning = true;

    const p1Id = this.p1.characterId;
    const allChoices = this.allRoster.filter((c) => c.id !== p1Id);
    const picked = allChoices.length > 0 ? Phaser.Math.RND.pick(allChoices) : this.findCharacterById(p1Id);

    this.p2.characterId = picked.id;
    this.p2.locked = true;
    this.updateSpotlight(this.p2Spotlight, picked, false);

    // If opponent sits on another page of the active roster, flip there to spotlight & flash!
    const rosterIdx = this.roster.findIndex((c) => c.id === picked.id);
    if (rosterIdx !== -1) {
      const targetPage = Math.floor(rosterIdx / PAGE_SIZE);
      const indexInPage = rosterIdx % PAGE_SIZE;
      if (targetPage !== this.currentPage) {
        this.setPage(targetPage);
      }
      this.p2.page = targetPage;
      this.p2.index = indexInPage;
      this.p2.label.setText('CPU');
      this.refreshCursor(this.p2);

      this.time.delayedCall(420, () => {
        playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
        const cpuCard = this.cards[indexInPage];
        if (cpuCard) {
          cpuCard.flashLock(() => this.startMatch());
        } else {
          this.startMatch();
        }
      });
      return;
    }

    this.time.delayedCall(420, () => {
      playAudioCue(this, AUDIO_KEYS.uiConfirm, this.app.settingsStore.getState());
      this.startMatch();
    });
  }

  private startMatch(): void {
    if (this.transitioning && this.mode === '1v1') {
      return;
    }

    this.transitioning = true;

    this.scene.start(SCENE_KEYS.Match, {
      mode: this.mode,
      stageId: this.stageId,
      p1CharacterId: this.p1.characterId,
      p2CharacterId: this.p2.characterId,
      botDifficulty: this.botDifficulty
    });
  }

  private goBack(): void {
    if (this.transitioning) {
      return;
    }

    this.scene.start(SCENE_KEYS.MainMenu);
  }
}

function colorToCss(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
