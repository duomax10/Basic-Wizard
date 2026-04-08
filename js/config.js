'use strict';

// ─── Tile constants ──────────────────────────────────────────────────────────
const TILE     = 32;
const MAP_W    = 52;   // tiles wide
const MAP_H    = 52;   // tiles tall
const T_WALL   = 0;
const T_FLOOR  = 1;
const T_STAIR  = 2;

// ─── Game-state keys ─────────────────────────────────────────────────────────
const STATE = {
  TITLE       : 'title',
  CHAR_SELECT : 'charSelect',
  PLAYING     : 'playing',
  SPELL_SELECT: 'spellSelect',
  LEVEL_UP    : 'levelUp',
  GAME_OVER   : 'gameOver',
  NEXT_LEVEL  : 'nextLevel',
  VICTORY     : 'victory',
};

// ─── Dungeons – add objects here to add new dungeons ────────────────────────
const DUNGEONS = [
  {
    id          : 0,
    name        : 'Crypts of Shadow',
    theme       : 'crypt',
    levels      : 3,
    floorColor  : '#1a1520',
    wallColor   : '#0e0c12',
    wallTopColor: '#3a2d50',
    accentColor : '#4a3060',
    torchColor  : '#ff8800',
    enemyPool   : ['goblin','skeleton','zombie','spider','ghost'],
    roomsBase   : 7,
    minEnemies  : 2,
    maxEnemies  : 5,
  },
  {
    id          : 1,
    name        : 'Orcish Stronghold',
    theme       : 'stronghold',
    levels      : 3,
    floorColor  : '#1a1005',
    wallColor   : '#0d0802',
    wallTopColor: '#4a2e10',
    accentColor : '#5a3a10',
    torchColor  : '#ff6600',
    enemyPool   : ['orc','goblin','troll','werewolf','darkelf'],
    roomsBase   : 8,
    minEnemies  : 3,
    maxEnemies  : 6,
  },
  {
    id          : 2,
    name        : 'Infernal Depths',
    theme       : 'infernal',
    levels      : 3,
    floorColor  : '#1a0505',
    wallColor   : '#0d0202',
    wallTopColor: '#440a0a',
    accentColor : '#660000',
    torchColor  : '#ff3300',
    enemyPool   : ['demon','vampire','dragon','werewolf','darkelf'],
    roomsBase   : 9,
    minEnemies  : 3,
    maxEnemies  : 7,
  },
];

// ─── Enemy type definitions – add keys here to add new enemy types ───────────
const ENEMY_TYPES = {
  goblin: {
    name         : 'Goblin',
    color        : '#44aa44',
    maxHp        : 25,
    damage       : 5,
    speed        : 1.8,
    xpReward     : 10,
    size         : 16,
    attackRange  : 32,
    detectRange  : 200,
    attackCooldown: 1200,
    isRanged     : false,
    special      : null,
  },
  skeleton: {
    name         : 'Skeleton',
    maxHp        : 35,
    damage       : 8,
    speed        : 1.2,
    xpReward     : 15,
    size         : 18,
    attackRange  : 36,
    detectRange  : 180,
    attackCooldown: 1500,
    isRanged     : false,
    special      : null,
  },
  orc: {
    name         : 'Orc',
    maxHp        : 65,
    damage       : 14,
    speed        : 1.0,
    xpReward     : 25,
    size         : 22,
    attackRange  : 42,
    detectRange  : 160,
    attackCooldown: 2000,
    isRanged     : false,
    special      : null,
  },
  zombie: {
    name         : 'Zombie',
    maxHp        : 50,
    damage       : 7,
    speed        : 0.6,
    xpReward     : 12,
    size         : 20,
    attackRange  : 34,
    detectRange  : 130,
    attackCooldown: 2500,
    isRanged     : false,
    special      : 'poison',
    poisonDamage : 2,
    poisonDuration: 5000,
  },
  darkelf: {
    name            : 'Dark Elf',
    maxHp           : 40,
    damage          : 12,
    speed           : 2.0,
    xpReward        : 30,
    size            : 17,
    attackRange     : 190,
    detectRange     : 220,
    attackCooldown  : 2000,
    isRanged        : true,
    projectileSpeed : 4,
    projectileColor : '#aa44ff',
    special         : null,
  },
  troll: {
    name         : 'Troll',
    maxHp        : 110,
    damage       : 20,
    speed        : 0.8,
    xpReward     : 45,
    size         : 26,
    attackRange  : 46,
    detectRange  : 150,
    attackCooldown: 2500,
    isRanged     : false,
    special      : 'regen',
    regenRate    : 3,    // hp/s
  },
  vampire: {
    name          : 'Vampire',
    maxHp         : 75,
    damage        : 18,
    speed         : 1.6,
    xpReward      : 45,
    size          : 20,
    attackRange   : 36,
    detectRange   : 200,
    attackCooldown: 1800,
    isRanged      : false,
    special       : 'lifesteal',
    lifeStealPct  : 0.3,
  },
  demon: {
    name         : 'Demon',
    maxHp        : 85,
    damage       : 22,
    speed        : 1.4,
    xpReward     : 55,
    size         : 24,
    attackRange  : 42,
    detectRange  : 210,
    attackCooldown: 1600,
    isRanged     : false,
    special      : null,
  },
  spider: {
    name          : 'Giant Spider',
    maxHp         : 30,
    damage        : 7,
    speed         : 2.2,
    xpReward      : 15,
    size          : 17,
    attackRange   : 30,
    detectRange   : 170,
    attackCooldown: 1000,
    isRanged      : false,
    special       : 'poison',
    poisonDamage  : 3,
    poisonDuration: 4000,
  },
  dragon: {
    name            : 'Dragon Hatchling',
    maxHp           : 95,
    damage          : 20,
    speed           : 1.3,
    xpReward        : 65,
    size            : 26,
    attackRange     : 180,
    detectRange     : 230,
    attackCooldown  : 2200,
    isRanged        : true,
    projectileSpeed : 3.5,
    projectileColor : '#ff6600',
    special         : 'burn',
    burnDamage      : 4,
    burnDuration    : 3000,
  },
  ghost: {
    name         : 'Ghost',
    maxHp        : 35,
    damage       : 9,
    speed        : 1.4,
    xpReward     : 20,
    size         : 20,
    attackRange  : 36,
    detectRange  : 210,
    attackCooldown: 1600,
    isRanged     : false,
    special      : 'phasing',
  },
  werewolf: {
    name         : 'Werewolf',
    maxHp        : 80,
    damage       : 22,
    speed        : 2.1,
    xpReward     : 42,
    size         : 23,
    attackRange  : 40,
    detectRange  : 230,
    attackCooldown: 1400,
    isRanged     : false,
    special      : null,
  },
};

// ─── Spell definitions – add keys here to add new spells ─────────────────────
const SPELL_TYPES = {
  fireball: {
    name         : 'Fireball',
    icon         : '🔥',
    color        : '#ff4400',
    glowColor    : '#ff9900',
    trailColor   : '#ff6600',
    damage       : 25,
    speed        : 5.5,
    radius       : 8,
    unlockLevel  : 1,
    cooldown     : 500,
    manaCost     : 15,
    description  : 'Ignites enemies, dealing burn damage over time.',
    special      : 'burn',
    burnDamage   : 4,
    burnInterval : 800,
    burnDuration : 3000,
  },
  ice: {
    name         : 'Ice Shard',
    icon         : '❄️',
    color        : '#88ddff',
    glowColor    : '#ccffff',
    trailColor   : '#aaeeff',
    damage       : 20,
    speed        : 5.0,
    radius       : 7,
    unlockLevel  : 3,
    cooldown     : 500,
    manaCost     : 15,
    description  : 'Slows enemies to a crawl for several seconds.',
    special      : 'slow',
    slowFactor   : 0.35,
    slowDuration : 3000,
  },
  lightning: {
    name         : 'Lightning',
    icon         : '⚡',
    color        : '#ffffff',
    glowColor    : '#aaaaff',
    trailColor   : '#8888ff',
    damage       : 22,
    speed        : 8.0,
    radius       : 6,
    unlockLevel  : 3,
    cooldown     : 600,
    manaCost     : 20,
    description  : 'Chains between nearby enemies for bonus damage.',
    special      : 'chain',
    chainDamage  : 12,
    chainRange   : 130,
    maxChains    : 3,
  },
};

// ─── Player base stats ────────────────────────────────────────────────────────
const PLAYER_CONFIG = {
  maxHp           : 100,
  maxMana         : 100,
  manaRegenRate   : 6,   // per second
  baseSpeed       : 2.5,
  hpPerLevel      : 15,
  manaPerLevel    : 10,
  damageBonusPerLevel: 0.1,  // multiplicative
};

// ─── XP thresholds per level (index = level, value = total XP needed) ────────
const XP_THRESHOLDS = [0, 80, 200, 370, 590, 870, 1220, 1650, 2180, 2820, 3600];
// Level 10 is max

// ─── Helper ───────────────────────────────────────────────────────────────────
function rng(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
