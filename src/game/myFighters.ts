/**
 * YOUR FIGHTERS — add one line per fighter.
 *
 *   id    the folder name: public/assets/<id>/   (english, lowercase, no spaces)
 *   name  the name shown in the game
 *   flip  true if your pictures face RIGHT (the game needs fighters facing LEFT)
 *
 * Pictures go in public/assets/<id>/ :
 *   idle  walk  punch  kick  hit  ko        (needed)
 *   jump  crouch  block  special  portrait  (bonus)
 *
 * Full rules: ADD_CHARACTER.md
 */
export type MyFighterSheetName =
  | 'idle'
  | 'walk'
  | 'punch'
  | 'kick'
  | 'hit'
  | 'ko'
  | 'jump'
  | 'crouch'
  | 'block'
  | 'special'
  | 'portrait';

export interface MyFighter {
  id: string;
  name: string;
  flip?: boolean;
  /** Only if auto-detect counts the poses wrong: { kick: 4 } */
  frames?: Record<string, number>;
  /** Optional direct file URLs per sheet instead of `/assets/<id>/<move>.*`. */
  sources?: Partial<Record<MyFighterSheetName, string>>;
}

export const MY_FIGHTERS: MyFighter[] = [
  {
    id: 'hero',
    name: 'Hero',
    frames: { idle: 4, walk: 4, punch: 4, kick: 4, hit: 4, ko: 4 },
    sources: {
      idle: '/assets/aistudio/idle_9d9c18bf.png',
      walk: '/assets/aistudio/walk_b3193d9b.png',
      punch: '/assets/aistudio/punch_35d9e505.png',
      kick: '/assets/aistudio/kick_2abfbc58.png',
      hit: '/assets/aistudio/hit_8596b5bc.png',
      ko: '/assets/aistudio/ko_05419fa2.png'
    }
  }
];
