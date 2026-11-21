import type { GameSettings } from '../types';

export type VoiceEventKind = 'special' | 'secret' | 'ko';

type GeminiVoiceName = 'Fenrir' | 'Puck' | 'Charon' | 'Kore' | 'Zephyr';

interface CharacterVoiceProfile {
  voiceName: GeminiVoiceName;
  style: string;
  toneHz: number;
  specialLine: string;
  secretLine: string;
  koLine: string;
}

const VOICE_PROFILES: Record<string, CharacterVoiceProfile> = {
  goku: {
    voiceName: 'Puck',
    style: 'Fierce, bright Japanese shonen anime hero shouting with soaring fighting spirit',
    toneHz: 420,
    specialLine: 'Ka-me-ha-me-HAAA!',
    secretLine: 'Migatte no Gokui! Ryūken Kamehameha!',
    koLine: 'Ossu! What an awesome battle!'
  },
  vegeta: {
    voiceName: 'Fenrir',
    style: 'Proud, intense, raspy royal Saiyan rival roaring in Japanese anime style',
    toneHz: 330,
    specialLine: 'Final... FLASH!',
    secretLine: 'Wagamama no Gokui! Hakai Big Bang!',
    koLine: 'Hmph! Know the power of a Saiyan elite!'
  },
  frieza: {
    voiceName: 'Zephyr',
    style: 'Cold, theatrical, condescending anime emperor with chilling elegance',
    toneHz: 460,
    specialLine: 'Death Ball! Disappear!',
    secretLine: 'Golden... Black Frieza! Emperor Collapse!',
    koLine: 'Oho-ho-ho! Utterly powerless!'
  },
  naruto: {
    voiceName: 'Puck',
    style: 'Energetic, passionate young anime ninja shouting with fiery determination',
    toneHz: 440,
    specialLine: 'Odama Rasengan!',
    secretLine: 'Kurama! Ikuzo, dattebayo!',
    koLine: 'Shannaro! That is my ninja way, dattebayo!'
  },
  sasuke: {
    voiceName: 'Charon',
    style: 'Cool, sharp, brooding anime prodigy with icy precision',
    toneHz: 310,
    specialLine: 'Chidori!',
    secretLine: 'Susanoo... Indra no Ya!',
    koLine: 'Your eyes cannot follow me.'
  },
  madara: {
    voiceName: 'Charon',
    style: 'Deep, commanding legendary anime warlord speaking with overwhelming gravitas',
    toneHz: 210,
    specialLine: 'Katon! Gōka Mekkyaku!',
    secretLine: 'Genjitsu wo shire... Mugen Tsukuyomi!',
    koLine: 'What will you do about the second meteor?'
  },
  luffy: {
    voiceName: 'Puck',
    style: 'Fearless, exuberant anime pirate captain yelling with wild joy',
    toneHz: 450,
    specialLine: 'Gomu Gomu no... Jet Gatling!',
    secretLine: 'Gear Fifth! Bajrang Gun!',
    koLine: 'Shishishi! Kaizoku-ou ni ore wa naru!'
  },
  zoro: {
    voiceName: 'Fenrir',
    style: 'Gruff, stoic anime master swordsman delivering a razor-sharp battle roar',
    toneHz: 255,
    specialLine: 'Santōryū! Kokujō Ō Tatsumaki!',
    secretLine: 'En-Ō Santōryū! Kyūtōryū Asura!',
    koLine: 'Nani mo... nakatta.'
  },
  kaido: {
    voiceName: 'Charon',
    style: 'Booming, monstrous anime emperor laughing and unleashing thunderous force',
    toneHz: 185,
    specialLine: 'Raimei Hakke!',
    secretLine: 'Worororo! Kaen Daiko: Ragnarok!',
    koLine: 'Worororo! Come back when you are stronger!'
  },
  gojo: {
    voiceName: 'Zephyr',
    style: 'Effortlessly charismatic, playful yet chillingly absolute anime jujutsu master',
    toneHz: 370,
    specialLine: 'Kyoshiki... Murasaki!',
    secretLine: 'Ryōiki Tenkai... Muryōkūsho!',
    koLine: 'Tenjō tenge yuiga dokuson.'
  },
  sukuna: {
    voiceName: 'Charon',
    style: 'Sinister, domineering King of Curses speaking in deep terrifying amusement',
    toneHz: 200,
    specialLine: 'Kai! Hachi!',
    secretLine: 'Ryōiki Tenkai... Fukuma Mizushi!',
    koLine: 'Know your place, fool.'
  },
  toji: {
    voiceName: 'Fenrir',
    style: 'Deadpan, lethal, confident anime assassin striking at blinding speed',
    toneHz: 270,
    specialLine: 'Amanosakahoko! Heavenly Blitz!',
    secretLine: 'No cursed energy needed. Zero Restraint!',
    koLine: 'Job done. Pay up.'
  },
  tanjiro: {
    voiceName: 'Puck',
    style: 'Earnest, blazing-hearted anime demon slayer shouting a breathing technique',
    toneHz: 410,
    specialLine: 'Hinokami Kagura! Nichiun no Ryū Kaburimai!',
    secretLine: 'Hi no Kokyū, Jūsan no Kata! Dawn!',
    koLine: 'Kokoro wo moyase!'
  },
  akaza: {
    voiceName: 'Fenrir',
    style: 'Battle-crazed martial anime demon grinning with fierce excitement',
    toneHz: 325,
    specialLine: 'Hakai Satsu! Rashin!',
    secretLine: 'Shūshiki! Aogin Ranzankō!',
    koLine: 'Become strong! Fight me for eternity!'
  },
  muzan: {
    voiceName: 'Charon',
    style: 'Aristocratic, cold, wrathful anime Demon King commanding darkness',
    toneHz: 215,
    specialLine: 'Kekkijutsu! Crimson Whip Storm!',
    secretLine: 'Demon King! Blood Moon Eclipse!',
    koLine: 'Bow before perfection.'
  },
  saitama: {
    voiceName: 'Zephyr',
    style: 'Unbothered deadpan hero suddenly dropping into terrifying serious intensity',
    toneHz: 345,
    specialLine: 'Hissatsu Maji Shirīzu... Maji Naguri!',
    secretLine: 'Maji Chabudai Gaeshi!',
    koLine: 'Done in one punch again.'
  },
  garou: {
    voiceName: 'Fenrir',
    style: 'Sharp, rebellious anime martial artist howling in awakened fury',
    toneHz: 295,
    specialLine: 'Ryūsui Gansai-ken!',
    secretLine: 'Kami Satsu... Gamma-Ray Burst!',
    koLine: 'Absolute evil has arrived.'
  },
  boros: {
    voiceName: 'Charon',
    style: 'Thundering cosmic conqueror unleashing planet-shattering alien energy',
    toneHz: 225,
    specialLine: 'Hōsei Hōkōhō!',
    secretLine: 'Meteoric Burst! Planet Roar!',
    koLine: 'Finally, a worthy clash!'
  },
  ryu: {
    voiceName: 'Fenrir',
    style: 'Disciplined, resonant arcade martial artist channeling inner ki',
    toneHz: 290,
    specialLine: 'Shinkū... HADOUKEN!',
    secretLine: 'Isshun Sengeki! Shun Goku Satsu!',
    koLine: 'The answer lies in the heart of battle.'
  },
  chunli: {
    voiceName: 'Kore',
    style: 'Crisp, agile, confident female martial arts champion executing rapid kicks',
    toneHz: 510,
    specialLine: 'Hyakuretsukyaku! Lightning Legs!',
    secretLine: 'Hōyoku-sen! Spinning Tempest!',
    koLine: 'Yatta! Justice always prevails!'
  },
  scorpion: {
    voiceName: 'Charon',
    style: 'Gravelly, vengeful spectral ninja roaring from hellfire',
    toneHz: 220,
    specialLine: 'GET OVER HERE!',
    secretLine: 'Netherrealm Chains! Eternal Inferno!',
    koLine: 'Vengeance is mine!'
  },
  subzero: {
    voiceName: 'Charon',
    style: 'Calm, stoic Lin Kuei cryomancer speaking with freezing authority',
    toneHz: 245,
    specialLine: 'Feel the chill of the Lin Kuei!',
    secretLine: 'Absolute Zero! Frozen Tomb!',
    koLine: 'Winter has claimed you.'
  },
  kratos: {
    voiceName: 'Charon',
    style: 'Deep, thunderous, gravelly Spartan god roaring with unstoppable rage',
    toneHz: 175,
    specialLine: 'SPARTAN RAGE!',
    secretLine: 'Blade of Olympus! Feel my wrath!',
    koLine: 'The cycle ends here.'
  },
  cloud: {
    voiceName: 'Zephyr',
    style: 'Cool, stoic spiky-haired swordsman delivering a crisp Limit Break call',
    toneHz: 335,
    specialLine: 'Chōkyū Bushin Hanzan! Omnislash!',
    secretLine: 'Limit Break! Omnislash Version Five!',
    koLine: 'Not interested.'
  },
  dante: {
    voiceName: 'Fenrir',
    style: 'Cocky, stylish, playful devil hunter shouting with rockstar flair',
    toneHz: 315,
    specialLine: 'Jackpot!',
    secretLine: 'Sin Devil Trigger! Judgment!',
    koLine: 'Smokin Sexy Style!'
  },
  link: {
    voiceName: 'Puck',
    style: 'Heroic, spirited Hylian champion letting out a fierce battle cry',
    toneHz: 415,
    specialLine: 'HYAAAH! Triforce Spin!',
    secretLine: 'Fierce Deity! Triforce Reckoning!',
    koLine: 'Toriyaaah!'
  },
  megaman: {
    voiceName: 'Puck',
    style: 'Heroic, determined young cyborg defender firing a plasma cannon',
    toneHz: 465,
    specialLine: 'Hyper Mega Buster!',
    secretLine: 'Double Gear System! Hyper Giga Crush!',
    koLine: 'Mission complete!'
  },
  sonic: {
    voiceName: 'Puck',
    style: 'Cocky, supersonic, upbeat speedster cracking a grin mid-blitz',
    toneHz: 480,
    specialLine: 'Super Chaos Control! Blitz!',
    secretLine: 'Hyper Sonic! Chaos Emerald Supernova!',
    koLine: 'Way past cool! You are too slow!'
  },
  erkhembayar: {
    voiceName: 'Fenrir',
    style: 'Confident, charismatic anime street brawler bursting with heroic swagger',
    toneHz: 340,
    specialLine: 'Swag Cyclone Blitz!',
    secretLine: 'Tengri Storm! Eternal Blue Sky!',
    koLine: 'Pure swag! Victory belongs to the fearless!'
  },
  hero: {
    voiceName: 'Puck',
    style: 'Passionate anime protagonist unleashing an azure rising dragon strike',
    toneHz: 380,
    specialLine: 'Azure Dragon Upper!',
    secretLine: 'Limit Break! Azure Meteor Ascent!',
    koLine: 'Unbreakable spirit!'
  },
  'red-brawler': {
    voiceName: 'Fenrir',
    style: 'Hot-blooded arcade street fighter throwing a blazing uppercut',
    toneHz: 295,
    specialLine: 'Volcanic Uppercut!',
    secretLine: 'Inferno Fist! Molten Core!',
    koLine: 'Fired up!'
  },
  'jiujitsu-fighter': {
    voiceName: 'Fenrir',
    style: 'Sharp, focused martial arts grandmaster calling a lightning strike',
    toneHz: 305,
    specialLine: 'Thunder Spinarooni!',
    secretLine: 'Grandmaster Storm! Apex Lock!',
    koLine: 'Mastered the mat!'
  },
  'green-boxer': {
    voiceName: 'Fenrir',
    style: 'High-energy championship boxer unleashing a meteor combo',
    toneHz: 320,
    specialLine: 'Meteor Rush!',
    secretLine: 'Champion Fury! Emerald Comet!',
    koLine: 'Knockout!'
  },
  gohan: {
    voiceName: 'Puck',
    style: 'Explosive awakened anime warrior unleashing Beast power',
    toneHz: 360,
    specialLine: 'Makankosappo!',
    secretLine: 'Beast Awakened! Full Power!',
    koLine: 'Now it is my turn!'
  },
  trunks: {
    voiceName: 'Zephyr',
    style: 'Determined time-traveling swordsman slashing through despair',
    toneHz: 350,
    specialLine: 'Burning Attack!',
    secretLine: 'Sword of Hope! Slice everything!',
    koLine: 'The future is saved!'
  },
  piccolo: {
    voiceName: 'Charon',
    style: 'Deep stoic Namekian warrior shouting with thunderous focus',
    toneHz: 205,
    specialLine: 'Hellzone Grenade!',
    secretLine: 'Orange Awakening! Makankosappo!',
    koLine: 'Know your limits.'
  },
  broly: {
    voiceName: 'Charon',
    style: 'Berserk raging Saiyan titan roaring uncontrollably',
    toneHz: 165,
    specialLine: 'GIGANTIC OMEGA!',
    secretLine: 'My power is overflowing! RAAARGH!',
    koLine: 'Destroyed!'
  },
  cell: {
    voiceName: 'Charon',
    style: 'Arrogant, theatrical perfect bio-android with chilling poise',
    toneHz: 235,
    specialLine: 'Solar Kamehameha!',
    secretLine: 'Witness Perfection! Earth is finished!',
    koLine: 'Utterly perfection!'
  },
  kakashi: {
    voiceName: 'Zephyr',
    style: 'Calm, sharp elite ninja master executing Raikiri',
    toneHz: 300,
    specialLine: 'Raikiri!',
    secretLine: 'Double Mangekyo! Kamui Lightning!',
    koLine: 'Too many openings.'
  },
  itachi: {
    voiceName: 'Charon',
    style: 'Quiet, tragic Uchiha prodigy speaking with absolute authority',
    toneHz: 255,
    specialLine: 'Amaterasu!',
    secretLine: 'Tsukuyomi... Eternal Seal!',
    koLine: 'You lack hatred.'
  },
  obito: {
    voiceName: 'Charon',
    style: 'Hollow, masked ninja warlord warping dimensions',
    toneHz: 245,
    specialLine: 'Kamui!',
    secretLine: 'Ten-Tails Truth-Seeker Ruin!',
    koLine: 'This world means nothing.'
  },
  minato: {
    voiceName: 'Zephyr',
    style: 'Swift, confident Hokage striking faster than lightning',
    toneHz: 350,
    specialLine: 'Hiraishin! Rasengan!',
    secretLine: 'Flying Raijin Level Three!',
    koLine: 'Too fast for you.'
  },
  sanji: {
    voiceName: 'Fenrir',
    style: 'Fiery pirate chef kicking with blazing passion',
    toneHz: 325,
    specialLine: 'Diable Jambe! Ifrit!',
    secretLine: 'Ifrit Jambe! Boeuf Burst!',
    koLine: 'Order up!'
  },
  shanks: {
    voiceName: 'Charon',
    style: 'Commanding red-haired pirate emperor unleashing Conqueror Haki',
    toneHz: 240,
    specialLine: 'Kamusari! Divine Departure!',
    secretLine: 'Bow before Conqueror Haki!',
    koLine: 'Come fight us when you are ready!'
  },
  ace: {
    voiceName: 'Puck',
    style: 'Passionate flame-wielding pirate brother',
    toneHz: 355,
    specialLine: 'Dai Enkai! Entei!',
    secretLine: 'Great Flame Commandment!',
    koLine: 'Ashes to ashes!'
  },
  law: {
    voiceName: 'Zephyr',
    style: 'Cool, calculating surgeon of death commanding his Room',
    toneHz: 295,
    specialLine: 'ROOM! Gamma Knife!',
    secretLine: 'K-ROOM! Puncture Wille!',
    koLine: 'Operation complete.'
  },
  yuji: {
    voiceName: 'Puck',
    style: 'Fierce young jujutsu brawler landing Black Flash',
    toneHz: 390,
    specialLine: 'Kokusen! BLACK FLASH!',
    secretLine: 'Domain Expansion! Soul Shrine!',
    koLine: 'I will never stop swinging!'
  },
  megumi: {
    voiceName: 'Charon',
    style: 'Stoic shadow-technique sorcerer summoning shikigami',
    toneHz: 280,
    specialLine: 'Chimera Shadow Surge!',
    secretLine: 'Domain Expansion! Chimera Shadow Garden!',
    koLine: 'Shadows swallow all.'
  },
  yuta: {
    voiceName: 'Puck',
    style: 'Resolute cursed-sword prodigy fighting alongside Rika',
    toneHz: 375,
    specialLine: 'Come, Rika! Pure Love!',
    secretLine: 'Domain Expansion! Authentic Mutual Love!',
    koLine: 'Thanks for lending me your strength.'
  },
  geto: {
    voiceName: 'Charon',
    style: 'Composed yet ruthless curse manipulator',
    toneHz: 240,
    specialLine: 'Maximum... Uzumaki!',
    secretLine: 'Six Thousand Curses! Uzumaki!',
    koLine: 'Pathetic.'
  },
  zenitsu: {
    voiceName: 'Puck',
    style: 'Explosive, lightning-fast demon slayer shouting First Form',
    toneHz: 460,
    specialLine: 'Kaminari no Kokyu! Hekireki Issen!',
    secretLine: 'Seventh Form! Flaming Thunder God!',
    koLine: 'I actually pulled it off!'
  },
  inosuke: {
    voiceName: 'Fenrir',
    style: 'Feral boar-masked swordsman laughing in wild battle frenzy',
    toneHz: 360,
    specialLine: 'Kedamono no Kokyu! Rampage!',
    secretLine: 'HAHAHA! King of the Mountain Strike!',
    koLine: 'Fight me again, minion!'
  },
  rengoku: {
    voiceName: 'Fenrir',
    style: 'Blazing heroic Flame Hashira shouting with booming conviction',
    toneHz: 330,
    specialLine: 'Honoo no Kokyu! Ninth Form!',
    secretLine: 'SET YOUR HEART ABLAZE! RENGOKU!',
    koLine: 'My flame will never die!'
  },
  kokushibo: {
    voiceName: 'Charon',
    style: 'Ancient six-eyed demon samurai speaking in icy dread',
    toneHz: 195,
    specialLine: 'Tsuki no Kokyu! Catastrophe!',
    secretLine: 'Sixteenth Form! Moonbow Half Moon!',
    koLine: 'Worthy of nothing.'
  },
  genos: {
    voiceName: 'Zephyr',
    style: 'Focused cyborg disciple firing full incineration cannons',
    toneHz: 320,
    specialLine: 'Shokyakuhō! INCINERATE!',
    secretLine: 'Ten-Second Overdrive! True Spiral!',
    koLine: 'Target eliminated.'
  },
  bang: {
    voiceName: 'Charon',
    style: 'Wise elderly grandmaster striking with flowing precision',
    toneHz: 240,
    specialLine: 'Water Stream Fist!',
    secretLine: 'Exploding Heart Release Fist!',
    koLine: 'Your stance needs discipline.'
  },
  tatsumaki: {
    voiceName: 'Kore',
    style: 'Fierce, arrogant esper hero crushing foes telekinetically',
    toneHz: 530,
    specialLine: 'Don’t get in my way!',
    secretLine: 'Esper Domain! Be crushed to dust!',
    koLine: 'Huh. Barely warmed up.'
  },
  ichigo: {
    voiceName: 'Fenrir',
    style: 'Intense orange-haired Soul Reaper shouting Getsuga Tensho',
    toneHz: 325,
    specialLine: 'GETSUGA TENSHŌ!',
    secretLine: 'BANKAI! Tensa Zangetsu!',
    koLine: 'That settles it.'
  },
  aizen: {
    voiceName: 'Charon',
    style: 'Calm, omnipotent mastermind reciting Hado incantations',
    toneHz: 230,
    specialLine: 'Hadō no Kyūjū... Kurohitsugi!',
    secretLine: 'Kyōka Suigetsu! Hado 99!',
    koLine: 'All part of my plan.'
  },
  byakuya: {
    voiceName: 'Zephyr',
    style: 'Aristocratic noble captain releasing Senbonzakura',
    toneHz: 295,
    specialLine: 'Chire... Senbonzakura!',
    secretLine: 'Bankai! Senbonzakura Kageyoshi!',
    koLine: 'Scatter.'
  },
  kenpachi: {
    voiceName: 'Charon',
    style: 'Bloodthirsty berserker captain roaring with savage glee',
    toneHz: 185,
    specialLine: 'Nomero... NOZARASHI!',
    secretLine: 'HAHAHA! Cut everything in half!',
    koLine: 'Is that all?! Boring!'
  },
  eren: {
    voiceName: 'Fenrir',
    style: 'Furious Titan shifter roaring with unyielding defiance',
    toneHz: 265,
    specialLine: 'TATAKAE! Titan Slam!',
    secretLine: 'Hear me! The Rumbling begins!',
    koLine: 'I keep moving forward.'
  },
  levi: {
    voiceName: 'Charon',
    style: 'Cold, lethal captain slicing cleanly at impossible speed',
    toneHz: 270,
    specialLine: 'Tch. Spin Slash!',
    secretLine: 'Give up on your dreams and fall!',
    koLine: 'Too messy.'
  },
  mikasa: {
    voiceName: 'Kore',
    style: 'Fierce, resolute Ackerman soldier executing swift cuts',
    toneHz: 465,
    specialLine: 'Thunder Spear! Fire!',
    secretLine: 'I will cut down anything!',
    koLine: 'Threat neutralized.'
  },
  denji: {
    voiceName: 'Puck',
    style: 'Wild, maniacal Chainsaw hybrid revving engines',
    toneHz: 380,
    specialLine: 'VROOOOM! Chainsaw Shredder!',
    secretLine: 'HERO OF HELL! FULL DEVIL!',
    koLine: 'Hell yeah! Shredded!'
  },
  aki: {
    voiceName: 'Zephyr',
    style: 'Stoic devil hunter summoning the Fox Devil',
    toneHz: 295,
    specialLine: 'Kon!',
    secretLine: 'Curse Devil... Three Strikes!',
    koLine: 'Rest now.'
  },
  makima: {
    voiceName: 'Kore',
    style: 'Quiet, hypnotic, terrifyingly polite Control Devil',
    toneHz: 495,
    specialLine: 'Bang.',
    secretLine: 'Say your final wish.',
    koLine: 'You belong to me.'
  },
  deku: {
    voiceName: 'Puck',
    style: 'Heroic successor bursting with One For All lightning',
    toneHz: 420,
    specialLine: 'DETROIT SMASH!',
    secretLine: 'One For All 120%! GEARSHIFT!',
    koLine: 'I did it!'
  },
  bakugo: {
    voiceName: 'Fenrir',
    style: 'Explosive, screaming rival hero detonating blast waves',
    toneHz: 350,
    specialLine: 'DIE! HOWITZER IMPACT!',
    secretLine: 'CLUSTER AWAKENING! SUPERNOVA!',
    koLine: 'Know your place, extra!'
  },
  todoroki: {
    voiceName: 'Zephyr',
    style: 'Cool, collected dual-element prodigy unleashing frost and flame',
    toneHz: 315,
    specialLine: 'Flashfreeze Heatwave!',
    secretLine: 'Phosphor! Glacial Inferno!',
    koLine: 'It is over.'
  },
  allmight: {
    voiceName: 'Charon',
    style: 'Thundering Symbol of Peace shouting Plus Ultra',
    toneHz: 195,
    specialLine: 'UNITED STATES OF SMASH!',
    secretLine: 'GO BEYOND! PLUS ULTRA!',
    koLine: 'I AM HERE!'
  },
  jinwoo: {
    voiceName: 'Charon',
    style: 'Deep, chilling Shadow Monarch commanding his army',
    toneHz: 255,
    specialLine: 'Ruler’s Authority!',
    secretLine: 'ARISE! Shadow Domain!',
    koLine: 'Become my shadow.'
  },
  igris: {
    voiceName: 'Charon',
    style: 'Silent, armored blood-red knight commander',
    toneHz: 215,
    specialLine: 'Crimson Greatsword!',
    secretLine: 'Shadow Marshal! Blood Tempest!',
    koLine: 'For my liege.'
  },
  gon: {
    voiceName: 'Puck',
    style: 'Spirited young Hunter charging immense aura',
    toneHz: 440,
    specialLine: 'Saisho wa gu! Janken GU!',
    secretLine: 'Give me everything! ALL OF IT!',
    koLine: 'Yeah! We won!'
  },
  killua: {
    voiceName: 'Puck',
    style: 'Sharp, lightning-fast young assassin snapping electricity',
    toneHz: 410,
    specialLine: 'Kanmuru! Godspeed!',
    secretLine: 'Narukami! Lightning Domain!',
    koLine: 'Way too slow.'
  },
  hisoka: {
    voiceName: 'Zephyr',
    style: 'Playful, unnerving Nen magician giggling mid-fight',
    toneHz: 365,
    specialLine: 'Bungee Gum!',
    secretLine: 'Oooh, how deliciously thrilling!',
    koLine: 'Not ripe yet.'
  },
  jotaro: {
    voiceName: 'Charon',
    style: 'Deep, badass Stoic delinquent calling Star Platinum',
    toneHz: 215,
    specialLine: 'ORA ORA ORA ORA ORAAA!',
    secretLine: 'Star Platinum: ZA WARUDO!',
    koLine: 'Yare yare daze.'
  },
  dio: {
    voiceName: 'Charon',
    style: 'Maniacal immortal vampire shouting ZA WARUDO',
    toneHz: 225,
    specialLine: 'MUDA MUDA MUDA MUDAAA!',
    secretLine: 'ZA WARUDO! Time has stopped!',
    koLine: 'WRYYYYY! Victory is DIO’s!'
  },
  ken: {
    voiceName: 'Fenrir',
    style: 'Brash, fiery American karate champion',
    toneHz: 315,
    specialLine: 'SHINRYUKEN!',
    secretLine: 'Shippū Jinraikyaku! Inferno!',
    koLine: 'Attack me if you dare!'
  },
  akuma: {
    voiceName: 'Charon',
    style: 'Demonic martial arts master roaring with dark satsui',
    toneHz: 185,
    specialLine: 'Messatsu Gōhadō!',
    secretLine: 'Die a thousand deaths! MESSATSU!',
    koLine: 'Weakness is a sin.'
  },
  cammy: {
    voiceName: 'Kore',
    style: 'Crisp British special-ops fighter executing rapid strikes',
    toneHz: 500,
    specialLine: 'Spiral Arrow!',
    secretLine: 'Delta Red Assault! Gyro Drive!',
    koLine: 'Mission accomplished.'
  },
  raiden: {
    voiceName: 'Charon',
    style: 'Thundering Elder God of Earthrealm',
    toneHz: 225,
    specialLine: 'Thunder God Torpedo!',
    secretLine: 'By the Elder Gods! Electric Wrath!',
    koLine: 'Earthrealm endures.'
  },
  liukang: {
    voiceName: 'Fenrir',
    style: 'Disciplined Shaolin champion unleashing dragon flame',
    toneHz: 335,
    specialLine: 'Bicycle Fire Kick!',
    secretLine: 'Fire God Dragon! Mortal Ascension!',
    koLine: 'You challenged the wrong dragon.'
  },
  jin: {
    voiceName: 'Charon',
    style: 'Brooding Devil-gene martial artist',
    toneHz: 260,
    specialLine: 'Devil Electric Thrust!',
    secretLine: 'This ends here! Mishima Reckoning!',
    koLine: 'Power is everything.'
  },
  kazuya: {
    voiceName: 'Charon',
    style: 'Ruthless cold-blooded Devil Mishima patriarch',
    toneHz: 220,
    specialLine: 'DORYA! Devil Blaster!',
    secretLine: 'True Devil! Orbital Eradication!',
    koLine: 'Pathetic.'
  },
  heihachi: {
    voiceName: 'Charon',
    style: 'Thundering old Iron Fist warrior laughing fiercely',
    toneHz: 205,
    specialLine: 'Electric Wind God Fist!',
    secretLine: 'Witness the King of Iron Fist!',
    koLine: 'Still too green!'
  },
  shadow: {
    voiceName: 'Charon',
    style: 'Brooding, razor-sharp Ultimate Lifeform',
    toneHz: 280,
    specialLine: 'Chaos Spear!',
    secretLine: 'CHAOS BLAST! Inhibitor off!',
    koLine: 'I am the Ultimate Lifeform.'
  },
  knuckles: {
    voiceName: 'Fenrir',
    style: 'Hard-hitting echidna guardian smashing foes',
    toneHz: 300,
    specialLine: 'Maximum Heat Quake!',
    secretLine: 'Master Emerald! Meteor Quake!',
    koLine: 'Feel the power!'
  },
  vergil: {
    voiceName: 'Charon',
    style: 'Icy, supreme katana master slicing through reality',
    toneHz: 265,
    specialLine: 'Judgement Cut!',
    secretLine: 'Where is your motivation?! Dimension Cleave!',
    koLine: 'Foolishness.'
  },
  sephiroth: {
    voiceName: 'Charon',
    style: 'Cold, angelic One-Winged destructor',
    toneHz: 230,
    specialLine: 'Octaslash!',
    secretLine: 'Shall I give you despair? Supernova!',
    koLine: 'Join the Lifestream.'
  },
  ganondorf: {
    voiceName: 'Charon',
    style: 'Monstrous Demon King roaring dark calamitous power',
    toneHz: 165,
    specialLine: 'DORIYAH! Warlock Punch!',
    secretLine: 'Triforce of Power! Calamity!',
    koLine: 'Hyrule kneels!'
  },
  zero: {
    voiceName: 'Fenrir',
    style: 'Cool crimson Maverick Hunter wielding Z-Saber',
    toneHz: 315,
    specialLine: 'Rekkoha! Ryuenjin!',
    secretLine: 'Genmu Zero! Slash through!',
    koLine: 'Target neutralized.'
  },
  samus: {
    voiceName: 'Kore',
    style: 'Stoic galactic bounty hunter firing Hyper Beam',
    toneHz: 460,
    specialLine: 'Zero Laser! Fire!',
    secretLine: 'Metroid Suit! Hyper Beam Meltdown!',
    koLine: 'Bounty collected.'
  },
  doomslayer: {
    voiceName: 'Charon',
    style: 'Relentless silent Hellwalker unleashing pure rage',
    toneHz: 155,
    specialLine: 'CRUCIBLE! RIP AND TEAR!',
    secretLine: 'BFG-9000! Obliterate all!',
    koLine: 'Unrelenting.'
  },
  masterchief: {
    voiceName: 'Charon',
    style: 'Deep, gravelly super-soldier Spartan-117',
    toneHz: 205,
    specialLine: 'Spartan Laser! Fire!',
    secretLine: 'Finishing this fight! MAC Strike!',
    koLine: 'Need a weapon?'
  },
  geralt: {
    voiceName: 'Charon',
    style: 'Gruff monster-slaying Witcher casting Igni',
    toneHz: 225,
    specialLine: 'Igni! Silver Whirl!',
    secretLine: 'How do you like that silver?!',
    koLine: 'Wind’s howling.'
  },
  temuujin: {
    voiceName: 'Charon',
    style: 'Commanding conqueror of the eternal blue sky',
    toneHz: 225,
    specialLine: 'Golden Horde Charge!',
    secretLine: 'Eternal Blue Sky! Thunder!',
    koLine: 'Steppe supreme!'
  },
  bataar: {
    voiceName: 'Charon',
    style: 'Heavy heavyweight steppe champion smashing the arena',
    toneHz: 200,
    specialLine: 'Sky Wolf Earthbreaker!',
    secretLine: 'Mountain Breaker! Crush!',
    koLine: 'Unshakable!'
  },
  nomad: {
    voiceName: 'Zephyr',
    style: 'Swift wind-steppe assassin striking from shadow',
    toneHz: 330,
    specialLine: 'Falcon Wind Ambush!',
    secretLine: 'Ghost Arrow of the Steppes!',
    koLine: 'Gone with the wind.'
  },
  valkyrie: {
    voiceName: 'Kore',
    style: 'Fierce astral warrior calling down judgement',
    toneHz: 510,
    specialLine: 'Aether Tempest!',
    secretLine: 'Valhalla Ascent! Judgement!',
    koLine: 'Claimed in battle!'
  }
};

const DEFAULT_VOICE_PROFILE: CharacterVoiceProfile = {
  voiceName: 'Fenrir',
  style: 'Intense anime fighting game hero shouting a signature move',
  toneHz: 350,
  specialLine: 'Ultra Strike!',
  secretLine: 'True Awakening! Overdrive!',
  koLine: 'Victory!'
};

const audioCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string | null>>();
let voiceApiDisabled = false;
let activeAudioEl: HTMLAudioElement | null = null;
let sharedVoiceCtx: AudioContext | null = null;
let lastSpokenAt = 0;
let lastPriority: VoiceEventKind | null = null;

function getVoiceCtx(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    return null;
  }

  if (!sharedVoiceCtx) {
    sharedVoiceCtx = new Ctor();
  }
  if (sharedVoiceCtx.state === 'suspended') {
    void sharedVoiceCtx.resume().catch(() => {});
  }
  return sharedVoiceCtx;
}

function getProfile(characterId: string): CharacterVoiceProfile {
  return VOICE_PROFILES[characterId] ?? DEFAULT_VOICE_PROFILE;
}

export function getVoiceLine(characterId: string, event: VoiceEventKind): string {
  const profile = getProfile(characterId);
  if (event === 'secret') return profile.secretLine;
  if (event === 'ko') return profile.koLine;
  return profile.specialLine;
}

async function fetchGeminiVoiceAudio(characterId: string, event: VoiceEventKind): Promise<string | null> {
  if (voiceApiDisabled || typeof fetch === 'undefined') {
    return null;
  }

  const key = `${characterId}::${event}`;
  const existing = audioCache.get(key);
  if (existing) {
    return existing;
  }

  const pending = inFlightRequests.get(key);
  if (pending) {
    return pending;
  }

  const profile = getProfile(characterId);
  const text = getVoiceLine(characterId, event);
  const promise = (async () => {
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          style: profile.style,
          voiceName: profile.voiceName
        })
      });
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        audioBase64?: string;
        mimeType?: string;
      };
      if (!data.ok) {
        if (data.reason === 'no_api_key') {
          voiceApiDisabled = true;
        }
        return null;
      }
      if (!data.audioBase64) {
        return null;
      }
      const src = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
      audioCache.set(key, src);
      return src;
    } catch {
      return null;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Pre-warms Gemini 3.8 Flash TTS neural voices for the active fighters in the background
 * so special & secret lines fire instantaneously with expressive anime acting.
 */
export function warmFighterVoices(characterIds: string[]): void {
  if (voiceApiDisabled) {
    return;
  }
  const uniqueIds = Array.from(new Set(characterIds.filter(Boolean)));
  for (const id of uniqueIds) {
    void fetchGeminiVoiceAudio(id, 'special');
    void fetchGeminiVoiceAudio(id, 'secret');
    void fetchGeminiVoiceAudio(id, 'ko');
  }
}

/**
 * Clean, non-robotic anime resonance sting when offline/no API key is configured.
 * Replaces robotic speechSynthesis with warm multi-harmonic energy aura chords.
 */
function playAnimeAuraSting(toneHz: number, event: VoiceEventKind, volume: number): void {
  const ctx = getVoiceCtx();
  if (!ctx || volume <= 0) {
    return;
  }

  try {
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(event === 'secret' ? 3600 : 2400, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + (event === 'secret' ? 0.65 : 0.4));

    const peak = Math.min(0.36, (event === 'secret' ? 0.34 : 0.24) * volume);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (event === 'secret' ? 0.68 : 0.42));

    filter.connect(gain);
    gain.connect(ctx.destination);

    // Aggressive power chord + deep battle sub-drop (no cheerful chimes)
    const ratios = event === 'secret' ? [0.5, 1, 1.498, 2] : event === 'ko' ? [0.5, 1, 1.498] : [0.5, 1];
    ratios.forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? 'sawtooth' : 'square';
      const startFreq = Math.max(55, toneHz * 0.72 * ratio);
      osc.frequency.setValueAtTime(startFreq * 1.12, now + idx * 0.015);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 0.88, now + 0.26 + idx * 0.04);
      osc.connect(filter);
      osc.start(now + idx * 0.015);
      osc.stop(now + (event === 'secret' ? 0.7 : 0.44));
    });
  } catch {
    // Ignore autoplay restriction errors
  }
}

function playDataUrl(src: string, volume: number): void {
  if (typeof Audio === 'undefined') {
    return;
  }

  try {
    if (activeAudioEl) {
      activeAudioEl.pause();
      activeAudioEl.currentTime = 0;
    }
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, 0.92 * volume));
    activeAudioEl = audio;
    void audio.play().catch(() => {});
  } catch {
    // Gracefully ignore playback block
  }
}

/**
 * Plays expressive anime Gemini TTS voice audio when available, or a non-robotic
 * harmonic anime aura resonance sting when offline, and returns the battle line.
 */
export function playCharacterVoice(
  characterId: string,
  event: VoiceEventKind,
  settings: GameSettings
): string {
  const line = getVoiceLine(characterId, event);
  if (settings.muted || settings.sfxVolume <= 0) {
    return line;
  }

  const now = Date.now();
  if (now - lastSpokenAt < 950 && lastPriority === 'secret' && event === 'special') {
    return line;
  }
  lastSpokenAt = now;
  lastPriority = event;

  const cacheKey = `${characterId}::${event}`;
  const cachedSrc = audioCache.get(cacheKey);
  if (cachedSrc) {
    playDataUrl(cachedSrc, settings.sfxVolume);
    return line;
  }

  const profile = getProfile(characterId);
  playAnimeAuraSting(profile.toneHz, event, settings.sfxVolume);

  if (!voiceApiDisabled) {
    void fetchGeminiVoiceAudio(characterId, event).then((src) => {
      if (src && Date.now() - now < 1500) {
        playDataUrl(src, settings.sfxVolume);
      }
    });
  }

  return line;
}
