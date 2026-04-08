'use strict';

// ─── Dungeon generation ───────────────────────────────────────────────────────

class Room {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
  }
  get cx() { return Math.floor(this.x + this.w / 2); }
  get cy() { return Math.floor(this.y + this.h / 2); }
  overlaps(other, pad = 1) {
    return !(this.x + this.w + pad <= other.x ||
             other.x + other.w + pad <= this.x ||
             this.y + this.h + pad <= other.y ||
             other.y + other.h + pad <= this.y);
  }
}

class Dungeon {
  /**
   * @param {object} dungeonConfig – entry from DUNGEONS array
   * @param {number} levelIndex    – 0-based level inside this dungeon
   */
  constructor(dungeonConfig, levelIndex) {
    this.config = dungeonConfig;
    this.levelIndex = levelIndex;
    this.grid = [];          // 2D: T_WALL | T_FLOOR | T_STAIR
    this.rooms = [];
    this.enemySpawns = [];   // {type, x, y} in world px
    this.startX = 0;
    this.startY = 0;
    this.stairX = 0;
    this.stairY = 0;
    this._generate();
  }

  _generate() {
    // Fill grid with walls
    this.grid = Array.from({ length: MAP_H }, () => new Array(MAP_W).fill(T_WALL));

    const targetRooms = this.config.roomsBase + this.levelIndex * 2;
    const rooms = [];

    // Place rooms
    for (let attempt = 0; attempt < 400; attempt++) {
      if (rooms.length >= targetRooms) break;
      const w = rng(5, 10);
      const h = rng(5, 10);
      const x = rng(1, MAP_W - w - 2);
      const y = rng(1, MAP_H - h - 2);
      const room = new Room(x, y, w, h);
      if (!rooms.some(r => r.overlaps(room, 1))) {
        rooms.push(room);
        this._carveRoom(room);
      }
    }

    // Sort rooms roughly top-left → bottom-right for corridor logic
    rooms.sort((a, b) => (a.cx + a.cy) - (b.cx + b.cy));

    // Connect each room to the previous one
    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1];
      const b = rooms[i];
      if (Math.random() < 0.5) {
        this._carveHCorridor(a.cx, b.cx, a.cy);
        this._carveVCorridor(a.cy, b.cy, b.cx);
      } else {
        this._carveVCorridor(a.cy, b.cy, a.cx);
        this._carveHCorridor(a.cx, b.cx, b.cy);
      }
    }

    this.rooms = rooms;

    // Player starts in first room
    const first = rooms[0];
    this.startX = first.cx * TILE + TILE / 2;
    this.startY = first.cy * TILE + TILE / 2;

    // Stairs in last room center
    const last = rooms[rooms.length - 1];
    this.stairX = last.cx;
    this.stairY = last.cy;
    this.grid[last.cy][last.cx] = T_STAIR;

    // Spawn enemies in every room except the first
    const difficulty = 1 + this.levelIndex * 0.3;
    for (let i = 1; i < rooms.length; i++) {
      const room = rooms[i];
      const count = rng(this.config.minEnemies, this.config.maxEnemies);
      for (let j = 0; j < count; j++) {
        const ex = rng(room.x + 1, room.x + room.w - 2);
        const ey = rng(room.y + 1, room.y + room.h - 2);
        const pool = this.config.enemyPool;
        const type = pool[rng(0, pool.length - 1)];
        this.enemySpawns.push({
          type,
          x: ex * TILE + TILE / 2,
          y: ey * TILE + TILE / 2,
          difficulty,
        });
      }
    }
  }

  _carveRoom(room) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        this.grid[y][x] = T_FLOOR;
      }
    }
  }

  _carveHCorridor(x1, x2, y) {
    const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
    for (let x = lo; x <= hi; x++) {
      if (this.grid[y]) this.grid[y][x] = T_FLOOR;
      if (this.grid[y - 1]) this.grid[y - 1][x] = T_FLOOR;
    }
  }

  _carveVCorridor(y1, y2, x) {
    const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
    for (let y = lo; y <= hi; y++) {
      if (this.grid[y]) {
        this.grid[y][x] = T_FLOOR;
        if (this.grid[y][x + 1] !== undefined) this.grid[y][x + 1] = T_FLOOR;
      }
    }
  }

  /** Returns true if world-px position (wx,wy) is walkable */
  isWalkable(wx, wy) {
    const tx = Math.floor(wx / TILE);
    const ty = Math.floor(wy / TILE);
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
    return this.grid[ty][tx] !== T_WALL;
  }

  /** Returns true if tile coords are a wall */
  isWall(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
    return this.grid[ty][tx] === T_WALL;
  }

  getTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return T_WALL;
    return this.grid[ty][tx];
  }

  worldW() { return MAP_W * TILE; }
  worldH() { return MAP_H * TILE; }
}
