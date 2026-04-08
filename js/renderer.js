'use strict';

// ─── Main render pipeline ─────────────────────────────────────────────────────

class Renderer {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.camX    = 0;
    this.camY    = 0;
    this._shakeDx = 0;
    this._shakeDy = 0;
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  get W() { return this.canvas.width; }
  get H() { return this.canvas.height; }

  updateCamera(player, dungeon) {
    const targetX = player.x - this.W / 2;
    const targetY = player.y - this.H / 2;
    // Smooth follow
    this.camX += (targetX - this.camX) * 0.12;
    this.camY += (targetY - this.camY) * 0.12;
    // Clamp to dungeon bounds
    this.camX = clamp(this.camX, 0, dungeon.worldW() - this.W);
    this.camY = clamp(this.camY, 0, dungeon.worldH() - this.H);

    // Screen shake
    const shake = player.screenShake;
    this._shakeDx = shake > 0 ? (Math.random() - 0.5) * shake * 2 : 0;
    this._shakeDy = shake > 0 ? (Math.random() - 0.5) * shake * 2 : 0;
  }

  renderFrame(dungeon, dungeonConfig, player, enemies, spellManager, input) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    const cx = Math.round(this.camX + this._shakeDx);
    const cy = Math.round(this.camY + this._shakeDy);

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // ── Dungeon tiles
    this._renderTiles(ctx, dungeon, dungeonConfig, cx, cy);

    // ── Torches/ambient glow on floor (every few rooms)
    this._renderTorches(ctx, dungeon, dungeonConfig, cx, cy);

    // ── Entities (enemies first, then player on top)
    const sorted = [...enemies].sort((a, b) => a.y - b.y);
    for (const e of sorted) {
      if (!e.alive) continue;
      const sx = e.x - cx, sy = e.y - cy;
      if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) continue;
      e.render(ctx, cx, cy);
    }
    player.render(ctx, cx, cy);

    // ── Spells / particles
    spellManager.render(ctx, cx, cy);

    // ── HUD
    this._renderHUD(ctx, player, dungeonConfig);

    // ── Minimap
    this._renderMinimap(ctx, dungeon, player, W, H);

    // ── Mobile joystick + cast button
    this._renderJoystick(ctx, W, H, input);
  }

  _renderTiles(ctx, dungeon, cfg, cx, cy) {
    const startTX = Math.max(0, Math.floor(cx / TILE) - 1);
    const startTY = Math.max(0, Math.floor(cy / TILE) - 1);
    const endTX   = Math.min(MAP_W - 1, startTX + Math.ceil(this.W / TILE) + 2);
    const endTY   = Math.min(MAP_H - 1, startTY + Math.ceil(this.H / TILE) + 2);

    for (let ty = startTY; ty <= endTY; ty++) {
      for (let tx = startTX; tx <= endTX; tx++) {
        const tile = dungeon.getTile(tx, ty);
        const px   = tx * TILE - cx;
        const py   = ty * TILE - cy;
        if (tile === T_WALL) {
          const isTop = dungeon.getTile(tx, ty + 1) !== T_WALL;
          drawWallTile(ctx, px, py, cfg, isTop);
        } else if (tile === T_FLOOR) {
          drawFloorTile(ctx, px, py, cfg);
        } else if (tile === T_STAIR) {
          drawFloorTile(ctx, px, py, cfg);
          drawStairTile(ctx, px, py);
        }
      }
    }
  }

  _renderTorches(ctx, dungeon, cfg, cx, cy) {
    // Subtle radial light pools near room centers
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const room of dungeon.rooms) {
      const rx = room.cx * TILE - cx;
      const ry = room.cy * TILE - cy;
      if (rx < -200 || rx > this.W + 200 || ry < -200 || ry > this.H + 200) continue;
      const pulse = 0.04 + Math.sin(Date.now() * 0.002 + room.cx) * 0.01;
      const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, room.w * TILE * 0.6);
      grad.addColorStop(0, `rgba(${cfg.torchColor.slice(1).match(/../g)
        .map(h => parseInt(h, 16)).join(',')},${pulse})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(rx - room.w * TILE, ry - room.h * TILE, room.w * TILE * 2, room.h * TILE * 2);
    }
    ctx.restore();
  }

  _renderHUD(ctx, player, cfg) {
    const W = this.W;
    const pad = 14;
    const barW = Math.min(200, W * 0.32);
    const barH = 16;

    // Background panel
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(pad - 4, pad - 4, barW + 8, barH * 2 + 24, 6);
    ctx.fill();

    // HP bar
    _drawBar(ctx, pad, pad, barW, barH, player.hp / player.maxHp, '#cc2200', '#ff4444', '#660000');
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(barH * 0.75)}px monospace`;
    ctx.fillText(`♥ ${Math.ceil(player.hp)}/${player.maxHp}`, pad + 4, pad + barH - 3);

    // Mana bar
    const my = pad + barH + 8;
    _drawBar(ctx, pad, my, barW, barH, player.mana / player.maxMana, '#1144cc', '#4488ff', '#001144');
    ctx.fillStyle = '#fff';
    ctx.fillText(`✦ ${Math.floor(player.mana)}/${player.maxMana}`, pad + 4, my + barH - 3);

    // XP bar (thin strip below)
    const xy = my + barH + 6;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(pad, xy, barW, 5);
    ctx.fillStyle = '#ffdd44';
    ctx.fillRect(pad, xy, barW * player.getXPPercent(), 5);

    // Level badge
    ctx.fillStyle = '#ffdd44';
    ctx.font = `bold ${Math.round(barH * 0.8)}px monospace`;
    ctx.fillText(`LVL ${player.level}`, pad, xy + 18);

    // Active spell icon
    const spellDef = SPELL_TYPES[player.activeSpell];
    const si = W - 70;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(si - 4, pad - 4, 64, 58, 8);
    ctx.fill();
    ctx.font = '32px sans-serif';
    ctx.fillText(spellDef.icon, si + 6, pad + 34);

    // Cooldown overlay
    const cdRatio = (player.spellCooldowns[player.activeSpell] || 0) / (spellDef.cooldown);
    if (cdRatio > 0) {
      ctx.fillStyle = `rgba(0,0,0,${cdRatio * 0.7})`;
      ctx.beginPath();
      ctx.roundRect(si - 4, pad - 4, 64, 58, 8);
      ctx.fill();
    }

    ctx.fillStyle = '#fff';
    ctx.font = `11px monospace`;
    ctx.fillText(spellDef.name, si - 2, pad + 54);

    // Known spell slots (small icons bottom of HUD area)
    if (player.knownSpells.length > 1) {
      for (let i = 0; i < player.knownSpells.length; i++) {
        const sk = player.knownSpells[i];
        const bx = si - 2 + i * 28;
        const by = pad + 60;
        ctx.fillStyle = sk === player.activeSpell ? 'rgba(255,220,100,0.3)' : 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.roundRect(bx, by, 24, 24, 4);
        ctx.fill();
        ctx.font = '14px sans-serif';
        ctx.fillText(SPELL_TYPES[sk].icon, bx + 4, by + 18);
      }
    }

    // Status effects
    let effectX = pad;
    const ey = this.H - 40;
    if (player.effects.burn) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(effectX, ey, 70, 26);
      ctx.fillStyle = '#ff4400';
      ctx.font = '13px monospace';
      ctx.fillText('🔥 Burning', effectX + 4, ey + 18);
      effectX += 78;
    }
    if (player.effects.poison) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(effectX, ey, 74, 26);
      ctx.fillStyle = '#44ff44';
      ctx.font = '13px monospace';
      ctx.fillText('☠ Poison', effectX + 4, ey + 18);
    }
  }

  _renderMinimap(ctx, dungeon, player, W, H) {
    const mmW   = 120;
    const mmH   = 120;
    const scale = mmW / (MAP_W * TILE);
    const ox    = W - mmW - 14;
    const oy    = H - mmH - 14;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(ox - 2, oy - 2, mmW + 4, mmH + 4);

    // Tiles
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const tile = dungeon.getTile(tx, ty);
        if (tile === T_WALL) continue;
        const mx = ox + tx * TILE * scale;
        const my = oy + ty * TILE * scale;
        const ts = Math.max(1.5, TILE * scale);
        ctx.fillStyle = tile === T_STAIR ? '#aa88ff' : '#556677';
        ctx.fillRect(mx, my, ts, ts);
      }
    }

    // Player dot
    const px = ox + player.x * scale;
    const py = oy + player.y * scale;
    ctx.fillStyle = '#ffee44';
    ctx.shadowColor = '#ffee44';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  _renderJoystick(ctx, W, H, input) {
    const isTouchDevice = 'ontouchstart' in window;
    if (!isTouchDevice || !input) return;

    const maxR = 60;

    if (input.joystick.active) {
      // Active joystick – draw base + thumb
      const bx = input.joystick.startX;
      const by = input.joystick.startY;

      ctx.beginPath();
      ctx.arc(bx, by, maxR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const tx = bx + input.joystick.dx * maxR;
      const ty = by + input.joystick.dy * maxR;
      ctx.beginPath();
      ctx.arc(tx, ty, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180,140,255,0.5)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,160,255,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Idle hint – faded joystick in bottom-left
      const hx = 70;
      const hy = H - 80;

      ctx.beginPath();
      ctx.arc(hx, hy, maxR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hx, hy, 18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180,140,255,0.2)';
      ctx.fill();
    }

    // ── Cast button (right side)
    const castR = 34;
    const castX = W - 60;
    const castY = H - 200;

    ctx.save();
    ctx.shadowColor = 'rgba(180,140,255,0.5)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(castX, castY, castR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(60,20,100,0.7)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,140,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('⚡', castX, castY);

    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('CAST', castX, castY + castR + 12);
    ctx.textAlign = 'left';
    ctx.restore();
  }
}

function _drawBar(ctx, x, y, w, h, ratio, color, light, dark) {
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 3);
  ctx.fill();
  if (ratio > 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w * ratio, h, 3);
    ctx.fill();
    // Highlight
    ctx.fillStyle = light;
    ctx.fillRect(x + 2, y + 2, Math.max(0, w * ratio - 4), Math.floor(h * 0.3));
  }
}
