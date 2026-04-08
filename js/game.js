'use strict';

// ─── roundRect polyfill for older browsers / WebKit ──────────────────────────
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.arcTo(x + w, y, x + w, y + r, r);
    this.lineTo(x + w, y + h - r);
    this.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.lineTo(x + r, y + h);
    this.arcTo(x, y + h, x, y + h - r, r);
    this.lineTo(x, y + r);
    this.arcTo(x, y, x + r, y, r);
    this.closePath();
    return this;
  };
}

// ─── Main game controller ─────────────────────────────────────────────────────

class Game {
  constructor() {
    this.canvas   = document.getElementById('game-canvas');
    this.ctx      = this.canvas.getContext('2d');

    this.renderer = new Renderer(this.canvas);
    this.input    = new Input();
    this.ui       = new UI(this.canvas, this.ctx);

    this.state    = STATE.TITLE;
    this.prevTime = 0;

    // Current dungeon/level pointers
    this.dungeonIdx = 0;
    this.levelIdx   = 0;

    // Live objects
    this.dungeon      = null;
    this.player       = null;
    this.enemies      = [];
    this.spellManager = new SpellManager();

    // Level-up banner timer (counts down from levelUpBannerDuration to 0)
    this.levelUpTimer            = 0;
    this.levelUpBannerDuration   = 2.5;
    this._pendingSpellSelect     = false;

    // Deferred advance callback (set once, called by button click)
    this._advanceCallback = null;

    this._bindEvents();
    this.renderer.resize();

    // Start render loop
    const loop = t => { this._loop(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  // ── Event binding ──────────────────────────────────────────────────────────
  _bindEvents() {
    window.addEventListener('resize', () => this.renderer.resize());
    this.input.bind(this.canvas);

    const handlePt = (mx, my) => {
      switch (this.state) {
        case STATE.TITLE:
          if (this.ui.handleTitleClick(mx, my)) {
            this._goToCharSelect();
          }
          break;
        case STATE.CHAR_SELECT:
          this.ui.handleCharSelectClick(mx, my);
          break;
        case STATE.SPELL_SELECT:
          this.ui.handleSpellSelectClick(mx, my);
          break;
        case STATE.GAME_OVER:
          this.ui.handleGameOverClick(mx, my);
          break;
        case STATE.NEXT_LEVEL:
          if (this._advanceCallback) this.ui.handleNextLevelClick(mx, my);
          break;
        case STATE.PLAYING:
          if (this.player) this.ui.handleMobileSpellBtnClick(mx, my, this.player);
          break;
      }
    };

    this.canvas.addEventListener('click', e => {
      const r = this.canvas.getBoundingClientRect();
      handlePt(
        (e.clientX - r.left) * (this.canvas.width  / r.width),
        (e.clientY - r.top)  * (this.canvas.height / r.height),
      );
    });

    this.canvas.addEventListener('touchend', e => {
      e.preventDefault();
      const r = this.canvas.getBoundingClientRect();
      const t = e.changedTouches[0];
      handlePt(
        (t.clientX - r.left) * (this.canvas.width  / r.width),
        (t.clientY - r.top)  * (this.canvas.height / r.height),
      );
    }, { passive: false });
  }

  // ── State transitions ──────────────────────────────────────────────────────

  _goToCharSelect() {
    this.state = STATE.CHAR_SELECT;
    this.ui.renderCharSelect(gender => this._startGame(gender));
  }

  _startGame(gender) {
    this.dungeonIdx   = 0;
    this.levelIdx     = 0;
    this.player       = null;
    this.spellManager = new SpellManager();
    this._loadLevel(gender);
    this.state = STATE.PLAYING;
  }

  _loadLevel(gender) {
    const cfg    = DUNGEONS[this.dungeonIdx];
    this.dungeon = new Dungeon(cfg, this.levelIdx);

    if (!this.player) {
      this.player = new Player(gender || 'male', this.dungeon.startX, this.dungeon.startY);
    } else {
      this.player.x = this.dungeon.startX;
      this.player.y = this.dungeon.startY;
      this.player.alive = true;
      this.player.effects = {};
    }

    // Snap camera
    this.renderer.camX = this.player.x - this.renderer.W / 2;
    this.renderer.camY = this.player.y - this.renderer.H / 2;

    const diff = 1 + (this.dungeonIdx * 0.4) + (this.levelIdx * 0.2);
    this.enemies      = this.dungeon.enemySpawns.map(s => new Enemy(s.type, s.x, s.y, diff));
    this.spellManager = new SpellManager();
    this.levelUpTimer = 0;
    this._pendingSpellSelect = false;
  }

  _advanceLevel() {
    const cfg             = DUNGEONS[this.dungeonIdx];
    const isDungeonClear  = this.levelIdx >= cfg.levels - 1;
    const isGameClear     = this.dungeonIdx >= DUNGEONS.length - 1 && isDungeonClear;
    const gender          = this.player?.gender || 'male';

    this._advanceCallback = () => {
      this._advanceCallback = null;
      if (isGameClear) {
        this.player = null;
        this._goToCharSelect();
      } else if (isDungeonClear) {
        this.dungeonIdx++;
        this.levelIdx = 0;
        this._loadLevel(gender);
        this.state = STATE.PLAYING;
      } else {
        this.levelIdx++;
        this._loadLevel(gender);
        this.state = STATE.PLAYING;
      }
    };

    this.ui.renderNextLevel(cfg, this.dungeonIdx, this.levelIdx, this._advanceCallback);
    this.state = STATE.NEXT_LEVEL;
  }

  // ── Main loop ─────────────────────────────────────────────────────────────
  _loop(timestamp) {
    const dt = Math.min((timestamp - this.prevTime) / 1000, 0.05);
    this.prevTime = timestamp;
    this._update(dt);
    this._render();
  }

  // ── Update ────────────────────────────────────────────────────────────────
  _update(dt) {
    if (this.state !== STATE.PLAYING) return;

    const p = this.player;
    if (!p || !p.alive) {
      this.state = STATE.GAME_OVER;
      this.ui.renderGameOver(p, () => {
        this.player = null;
        this._goToCharSelect();
      });
      return;
    }

    p.update(dt, this.input, this.dungeon, this.spellManager);
    this._handleCasting();
    for (const e of this.enemies) {
      if (e.alive) e.update(dt, p, this.dungeon, this.spellManager);
    }
    this.spellManager.update(dt, this.dungeon, this.enemies);
    this._handleEnemyDeaths(p);

    // Level-up banner countdown
    if (this.levelUpTimer > 0) {
      this.levelUpTimer -= dt;
      if (this.levelUpTimer <= 0 && this._pendingSpellSelect) {
        this._pendingSpellSelect = false;
        this._openSpellSelect();
      }
    }

    // Stair check – all enemies must be dead first
    // stairX/Y are already tile coords; convert to world px
    const stx = this.dungeon.stairX * TILE + TILE / 2;
    const sty = this.dungeon.stairY * TILE + TILE / 2;
    if (dist(p.x, p.y, stx, sty) < TILE * 1.3) {
      if (this.enemies.every(e => !e.alive)) {
        this._advanceLevel();
        return;
      }
    }

    this.renderer.updateCamera(p, this.dungeon);
    this.input.endFrame();
  }

  _handleEnemyDeaths(player) {
    for (const e of this.enemies) {
      if (!e.alive && !e._deathHandled) {
        e._deathHandled = true;
        this.spellManager.spawnDeathParticles(e.x, e.y, ENEMY_TYPES[e.type].color || '#666');
        const result = player.gainXP(e.def.xpReward);
        if (result === 'levelUp') {
          player.levelUp();
          this.levelUpTimer = this.levelUpBannerDuration;
          if (player.pendingSpellChoice) this._pendingSpellSelect = true;
        }
      }
    }
  }

  _openSpellSelect() {
    this.state = STATE.SPELL_SELECT;
    this.ui.renderSpellSelect(this.player, spellKey => {
      this.player.unlockSpell(spellKey);
      this.state = STATE.PLAYING;
    });
  }

  _handleCasting() {
    const p = this.player;
    if (!p) return;

    const wantCast = this.input.keys['Space']     ||
                     this.input.keys['KeyF']       ||
                     this.input.mouse.down;
    if (!wantCast || !p.canCast(p.activeSpell)) return;

    let tx, ty;
    const isTouchDevice = 'ontouchstart' in window;
    if (isTouchDevice) {
      let nearest = null, nearestD = Infinity;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = dist(p.x, p.y, e.x, e.y);
        if (d < nearestD) { nearestD = d; nearest = e; }
      }
      if (nearest) { tx = nearest.x; ty = nearest.y; }
      else { tx = p.x + p.facing.x * 100; ty = p.y + p.facing.y * 100; }
    } else {
      tx = this.input.mouse.x + this.renderer.camX;
      ty = this.input.mouse.y + this.renderer.camY;
    }

    p.castSpell(p.activeSpell);
    this.spellManager.cast(p.x, p.y, tx, ty, p.activeSpell, p.damageMultiplier);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  _render() {
    const ctx = this.ctx;
    const W   = this.renderer.W;
    const H   = this.renderer.H;

    switch (this.state) {

      case STATE.TITLE:
        this.ui._renderTitleFrame();
        break;

      case STATE.CHAR_SELECT:
        this.ui._renderCharSelectFrame();
        break;

      case STATE.PLAYING:
      case STATE.SPELL_SELECT: {
        const cfg = DUNGEONS[this.dungeonIdx];
        this.renderer.renderFrame(
          this.dungeon, cfg, this.player, this.enemies, this.spellManager);

        if (this.levelUpTimer > 0) {
          this.ui.renderLevelUpBanner(this.player, this.levelUpTimer / this.levelUpBannerDuration);
        }
        if (this.player) this.ui.renderMobileSpellBar(this.player);

        // HUD text
        ctx.fillStyle = 'rgba(200,180,255,0.45)';
        ctx.font      = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${cfg.name}  ·  Level ${this.levelIdx + 1}/${cfg.levels}`, W / 2, 18);
        const alive = this.enemies.filter(e => e.alive).length;
        ctx.fillText(
          alive > 0
            ? `${alive} enemies remain – defeat all, then reach the portal`
            : 'All enemies slain! Find the portal ▼',
          W / 2, H - 8);
        ctx.textAlign = 'left';

        if (this.state === STATE.SPELL_SELECT) {
          this.ui._renderSpellSelectFrame(this.player);
        }
        break;
      }

      case STATE.NEXT_LEVEL: {
        const cfg = DUNGEONS[this.dungeonIdx];
        if (this.dungeon && this.player) {
          this.renderer.renderFrame(
            this.dungeon, cfg, this.player, this.enemies, this.spellManager);
        } else {
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, W, H);
        }
        // Render the overlay (uses stored callbacks, safe to re-call)
        this.ui.renderNextLevel(cfg, this.dungeonIdx, this.levelIdx, this._advanceCallback);
        break;
      }

      case STATE.GAME_OVER:
        ctx.fillStyle = 'rgba(0,0,0,0.88)';
        ctx.fillRect(0, 0, W, H);
        // renderGameOver re-registers the callback safely (idempotent)
        this.ui.renderGameOver(this.player, () => {
          this.player = null;
          this._goToCharSelect();
        });
        break;
    }
  }
}

// ── Boot ────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => { window._game = new Game(); });
