'use strict';

// ─── UI overlay screens ───────────────────────────────────────────────────────
// Uses a dedicated off-screen canvas for full-screen panels.

class UI {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx    = ctx;
    this._animFrame = 0;
    this._callbacks = {};
    this._charPortraits = this._prebakePortraits();
  }

  get W() { return this.canvas.width; }
  get H() { return this.canvas.height; }

  // Bake portrait canvases once so we don't redraw every frame
  _prebakePortraits() {
    const portraits = {};
    for (const gender of ['male', 'female']) {
      const oc = document.createElement('canvas');
      oc.width = 160; oc.height = 200;
      const oc2 = oc.getContext('2d');
      drawWizardPortrait(oc2, 80, 130, gender);
      portraits[gender] = oc;
    }
    return portraits;
  }

  // ── Title screen ─────────────────────────────────────────────────────────────
  renderTitle(onStart, onHelp) {
    this._callbacks.onStart = onStart;
    this._callbacks.onHelp  = onHelp;
    this._renderTitleFrame();
  }

  _renderTitleFrame() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    this._animFrame++;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a0015');
    bg.addColorStop(1, '#1a0030');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 80; i++) {
      const sx = ((i * 137 + 17) % W);
      const sy = ((i * 97  + 31) % H);
      const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(this._animFrame * 0.02 + i));
      ctx.globalAlpha = twinkle;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;

    // Title text with glow
    const fs = clamp(Math.floor(W / 10), 32, 72);
    ctx.save();
    ctx.shadowColor = '#aa44ff';
    ctx.shadowBlur  = 30;
    ctx.fillStyle   = '#ffffff';
    ctx.font        = `bold ${fs}px 'Georgia', serif`;
    ctx.textAlign   = 'center';
    ctx.fillText("Wizard's Dungeon", W / 2, H * 0.3);
    ctx.shadowBlur  = 0;

    // Subtitle
    ctx.fillStyle = '#aa88ff';
    ctx.font      = `${Math.floor(fs * 0.36)}px 'Georgia', serif`;
    ctx.fillText('A Tale of Arcane Darkness', W / 2, H * 0.3 + fs * 0.7);

    ctx.restore();

    // Start button
    const btnY = H * 0.55;
    const btnW = Math.min(260, W * 0.5);
    const btnH = 54;
    const pulse = 0.8 + Math.sin(this._animFrame * 0.05) * 0.2;
    _drawBtn(ctx, W / 2 - btnW / 2, btnY, btnW, btnH, '▶  Play', '#4a1a8a', '#8844ff', pulse);

    // Controls hint
    ctx.fillStyle = 'rgba(200,180,255,0.7)';
    ctx.font = `${clamp(Math.floor(W / 50), 11, 15)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('WASD / Arrow keys to move  •  Click / Space to cast', W / 2, H * 0.78);
    ctx.fillText('Tab / Q to switch spells  •  Touch joystick on mobile', W / 2, H * 0.82);
    ctx.fillText('Reach level 3 to choose your element', W / 2, H * 0.86);

    ctx.textAlign = 'left';

    // Store button bounds for click detection
    this._titleBtn = { x: W / 2 - btnW / 2, y: btnY, w: btnW, h: btnH };
  }

  handleTitleClick(mx, my) {
    const b = this._titleBtn;
    if (b && mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
      return true;
    }
    return false;
  }

  // ── Character select ─────────────────────────────────────────────────────────
  renderCharSelect(onSelect) {
    this._callbacks.onSelect = onSelect;
    this._renderCharSelectFrame();
  }

  _renderCharSelectFrame() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    // Background
    ctx.fillStyle = '#100020';
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const fs = clamp(Math.floor(W / 18), 22, 40);
    ctx.font = `bold ${fs}px 'Georgia', serif`;
    ctx.shadowColor = '#8844ff';
    ctx.shadowBlur = 14;
    ctx.fillText('Choose Your Wizard', W / 2, H * 0.1 + fs);
    ctx.shadowBlur = 0;

    const cardW   = Math.min(240, W * 0.38);
    const cardH   = Math.min(380, H * 0.65);
    const cardGap = Math.min(60, W * 0.06);
    const totalW  = cardW * 2 + cardGap;
    const startX  = W / 2 - totalW / 2;
    const cardY   = H * 0.15;

    const cards = [
      {
        gender  : 'male',
        name    : 'Aldric',
        desc    : 'The Arcane Scholar',
        detail  : 'Brown hair, piercing blue eyes,\nclassically trained in the\nancient arts of magic.',
        color   : '#1a3a8a',
        glow    : '#4466ff',
      },
      {
        gender  : 'female',
        name    : 'Seraphina',
        desc    : 'The Mystic',
        detail  : 'Flowing blonde hair, emerald\neyes, wielder of ancient\nand powerful enchantments.',
        color   : '#6a1e8a',
        glow    : '#cc66ff',
      },
    ];

    this._charBtns = [];

    for (let i = 0; i < 2; i++) {
      const card = cards[i];
      const cx   = startX + i * (cardW + cardGap);

      // Card background
      ctx.fillStyle = `rgba(${i === 0 ? '20,30,80' : '60,10,80'},0.8)`;
      ctx.beginPath();
      ctx.roundRect(cx, cardY, cardW, cardH, 14);
      ctx.fill();
      ctx.strokeStyle = card.glow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx, cardY, cardW, cardH, 14);
      ctx.stroke();

      // Portrait
      const portH = cardH * 0.55;
      const portW = portH * (160 / 200);
      const portX = cx + (cardW - portW) / 2;
      const portY = cardY + 10;
      ctx.drawImage(this._charPortraits[card.gender], portX, portY, portW, portH);

      // Name
      const nfs = clamp(Math.floor(W / 30), 14, 24);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = `bold ${nfs}px 'Georgia', serif`;
      ctx.fillText(card.name, cx + cardW / 2, portY + portH + nfs + 4);

      // Desc
      ctx.fillStyle = card.glow;
      ctx.font = `italic ${Math.floor(nfs * 0.75)}px 'Georgia', serif`;
      ctx.fillText(card.desc, cx + cardW / 2, portY + portH + nfs * 2.2);

      // Detail lines
      ctx.fillStyle = 'rgba(200,180,255,0.75)';
      ctx.font = `${Math.floor(nfs * 0.65)}px monospace`;
      const lines = card.detail.split('\n');
      for (let li = 0; li < lines.length; li++) {
        ctx.fillText(lines[li], cx + cardW / 2, portY + portH + nfs * 2.2 + 18 + li * 16);
      }

      // Select button
      const btnY2 = cardY + cardH - 48;
      const btnW2 = cardW - 24;
      _drawBtn(ctx, cx + 12, btnY2, btnW2, 36, 'Select', card.color, card.glow, 1);
      this._charBtns.push({ x: cx + 12, y: btnY2, w: btnW2, h: 36, gender: card.gender });
    }

    ctx.textAlign = 'left';
  }

  handleCharSelectClick(mx, my) {
    if (!this._charBtns) return false;
    for (const btn of this._charBtns) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        if (this._callbacks.onSelect) this._callbacks.onSelect(btn.gender);
        return true;
      }
    }
    return false;
  }

  // ── Spell select ─────────────────────────────────────────────────────────────
  renderSpellSelect(player, onSelect) {
    this._callbacks.onSpellSelect = onSelect;
    this._renderSpellSelectFrame(player);
  }

  _renderSpellSelectFrame(player) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(5,0,20,0.88)';
    ctx.fillRect(0, 0, W, H);

    const fs = clamp(Math.floor(W / 20), 20, 38);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffdd44';
    ctx.font = `bold ${fs}px 'Georgia', serif`;
    ctx.shadowColor = '#ffdd44';
    ctx.shadowBlur  = 18;
    ctx.fillText('Level 3 – Choose Your Element!', W / 2, H * 0.12 + fs);
    ctx.shadowBlur  = 0;

    ctx.fillStyle = 'rgba(200,180,255,0.8)';
    ctx.font      = `${Math.floor(fs * 0.5)}px monospace`;
    ctx.fillText('Fireball remains in your arsenal. Pick a second power.', W / 2, H * 0.12 + fs + 28);

    const choices = ['ice', 'lightning'];
    const cardW   = Math.min(220, W * 0.35);
    const cardH   = Math.min(280, H * 0.52);
    const gap     = Math.min(50, W * 0.05);
    const totalW  = cardW * 2 + gap;
    const sx      = W / 2 - totalW / 2;
    const sy      = H * 0.25;

    this._spellBtns = [];

    for (let i = 0; i < 2; i++) {
      const key = choices[i];
      const def = SPELL_TYPES[key];
      const cx  = sx + i * (cardW + gap);

      // Card
      ctx.fillStyle = 'rgba(20,15,40,0.9)';
      ctx.beginPath();
      ctx.roundRect(cx, sy, cardW, cardH, 12);
      ctx.fill();
      ctx.strokeStyle = def.glowColor;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.roundRect(cx, sy, cardW, cardH, 12);
      ctx.stroke();

      // Big icon
      ctx.font      = `${Math.floor(cardW * 0.3)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(def.icon, cx + cardW / 2, sy + cardH * 0.32);

      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.floor(fs * 0.8)}px 'Georgia', serif`;
      ctx.fillText(def.name, cx + cardW / 2, sy + cardH * 0.46);

      // Description
      ctx.fillStyle = 'rgba(200,220,255,0.8)';
      ctx.font = `${Math.floor(fs * 0.45)}px monospace`;
      const words = def.description.split(' ');
      let line2 = '', ly2 = sy + cardH * 0.56;
      for (const w of words) {
        const test = line2 + w + ' ';
        if (ctx.measureText(test).width > cardW - 20 && line2) {
          ctx.fillText(line2.trim(), cx + cardW / 2, ly2);
          ly2 += 18; line2 = w + ' ';
        } else {
          line2 = test;
        }
      }
      if (line2) ctx.fillText(line2.trim(), cx + cardW / 2, ly2);

      // Stats
      ctx.fillStyle = def.glowColor;
      ctx.font = `${Math.floor(fs * 0.42)}px monospace`;
      ctx.fillText(`Damage: ${def.damage}  Cost: ${def.manaCost} mana`, cx + cardW / 2, sy + cardH * 0.82);

      // Button
      const btnY3 = sy + cardH - 44;
      _drawBtn(ctx, cx + 14, btnY3, cardW - 28, 34, 'Choose', '#2a1050', def.glowColor, 1);
      this._spellBtns.push({ x: cx + 14, y: btnY3, w: cardW - 28, h: 34, spellKey: key });
    }

    ctx.textAlign = 'left';
  }

  handleSpellSelectClick(mx, my) {
    if (!this._spellBtns) return false;
    for (const btn of this._spellBtns) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        if (this._callbacks.onSpellSelect) this._callbacks.onSpellSelect(btn.spellKey);
        return true;
      }
    }
    return false;
  }

  // ── Level-up banner (brief overlay during play) ───────────────────────────
  renderLevelUpBanner(player, timer) {
    // timer: 0-1, 1 = just levelled up
    const ctx = this.ctx;
    const W = this.W;
    const alpha = timer > 0.7 ? (timer - 0.7) / 0.3 : timer < 0.3 ? timer / 0.3 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = 'rgba(0,0,0,0.5)';
    ctx.fillRect(W / 2 - 160, this.H * 0.38, 320, 60);
    ctx.textAlign   = 'center';
    ctx.fillStyle   = '#ffdd44';
    ctx.shadowColor = '#ffdd44';
    ctx.shadowBlur  = 20;
    ctx.font        = 'bold 28px Georgia';
    ctx.fillText(`LEVEL UP!  ›  Level ${player.level}`, W / 2, this.H * 0.38 + 40);
    ctx.shadowBlur  = 0;
    ctx.textAlign   = 'left';
    ctx.restore();
  }

  // ── Game Over ─────────────────────────────────────────────────────────────────
  renderGameOver(player, onRestart) {
    this._callbacks.onRestart = onRestart;
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign   = 'center';
    ctx.fillStyle   = '#cc2200';
    ctx.shadowColor = '#ff2200';
    ctx.shadowBlur  = 30;
    ctx.font        = `bold ${clamp(Math.floor(W / 12), 30, 60)}px Georgia`;
    ctx.fillText('YOU HAVE FALLEN', W / 2, H * 0.35);
    ctx.shadowBlur  = 0;

    ctx.fillStyle = 'rgba(200,180,255,0.8)';
    ctx.font      = `${clamp(Math.floor(W / 35), 14, 22)}px monospace`;
    ctx.fillText(`Reached Level ${player.level}  •  XP: ${player.xp}`, W / 2, H * 0.35 + 50);

    const btnW = Math.min(240, W * 0.45);
    const btnY = H * 0.52;
    _drawBtn(ctx, W / 2 - btnW / 2, btnY, btnW, 50, '↺  Play Again', '#4a0000', '#ff4444', 1);
    this._gameOverBtn = { x: W / 2 - btnW / 2, y: btnY, w: btnW, h: 50 };
    ctx.textAlign = 'left';
  }

  handleGameOverClick(mx, my) {
    const b = this._gameOverBtn;
    if (b && mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
      if (this._callbacks.onRestart) this._callbacks.onRestart();
      return true;
    }
    return false;
  }

  // ── Dungeon clear / next level ────────────────────────────────────────────
  renderNextLevel(dungeonConfig, dungeonIdx, levelIdx, onNext) {
    this._callbacks.onNext = onNext;
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, W, H);

    const isDungeonClear = (levelIdx >= DUNGEONS[dungeonIdx].levels - 1);
    const isGameClear    = (dungeonIdx >= DUNGEONS.length - 1) && isDungeonClear;

    ctx.textAlign   = 'center';
    ctx.fillStyle   = '#88ffaa';
    ctx.shadowColor = '#44ff88';
    ctx.shadowBlur  = 24;
    ctx.font        = `bold ${clamp(Math.floor(W / 14), 26, 52)}px Georgia`;
    if (isGameClear) {
      ctx.fillText('VICTORY!', W / 2, H * 0.32);
      ctx.shadowBlur = 0;
      ctx.fillStyle  = '#ffffff';
      ctx.font       = `${clamp(Math.floor(W / 32), 14, 22)}px monospace`;
      ctx.fillText('You have cleared all dungeons!', W / 2, H * 0.32 + 52);
    } else if (isDungeonClear) {
      ctx.fillText(`${dungeonConfig.name}  – Cleared!`, W / 2, H * 0.32);
    } else {
      ctx.fillText('Level Cleared!', W / 2, H * 0.32);
    }
    ctx.shadowBlur = 0;

    if (!isGameClear) {
      ctx.fillStyle = 'rgba(200,255,220,0.75)';
      ctx.font      = `${clamp(Math.floor(W / 38), 12, 18)}px monospace`;
      const nextName = isDungeonClear
        ? DUNGEONS[dungeonIdx + 1]?.name ?? 'Final Dungeon'
        : `${dungeonConfig.name} – Level ${levelIdx + 2}`;
      ctx.fillText(`Next: ${nextName}`, W / 2, H * 0.32 + 56);
    }

    const label = isGameClear ? '⟳  Play Again' : '→  Continue';
    const btnW2 = Math.min(240, W * 0.45);
    const btnY2 = H * 0.52;
    _drawBtn(ctx, W / 2 - btnW2 / 2, btnY2, btnW2, 50, label, '#004422', '#44ff88', 1);
    this._nextBtn = { x: W / 2 - btnW2 / 2, y: btnY2, w: btnW2, h: 50 };
    ctx.textAlign = 'left';
  }

  handleNextLevelClick(mx, my) {
    const b = this._nextBtn;
    if (b && mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
      if (this._callbacks.onNext) this._callbacks.onNext();
      return true;
    }
    return false;
  }

  // ── Mobile spell switcher (rendered into game canvas) ─────────────────────
  renderMobileSpellBar(player) {
    const isTouchDevice = 'ontouchstart' in window;
    if (!isTouchDevice) return;
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    const btnSz  = 50;
    const pad2   = 12;
    const startX = W - (player.knownSpells.length * (btnSz + pad2)) - pad2;
    const by     = H - btnSz - 80;
    this._mobileSpellBtns = [];
    for (let i = 0; i < player.knownSpells.length; i++) {
      const sk = player.knownSpells[i];
      const bx = startX + i * (btnSz + pad2);
      ctx.fillStyle = sk === player.activeSpell
        ? 'rgba(180,140,255,0.5)' : 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(bx, by, btnSz, btnSz, 10);
      ctx.fill();
      ctx.strokeStyle = sk === player.activeSpell ? '#cc88ff' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, btnSz, btnSz, 10);
      ctx.stroke();
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText(SPELL_TYPES[sk].icon, bx + btnSz / 2, by + btnSz * 0.7);
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(i + 1, bx + 6, by + 12);
      this._mobileSpellBtns.push({ x: bx, y: by, w: btnSz, h: btnSz, spellKey: sk });
    }
    ctx.textAlign = 'left';
  }

  handleMobileSpellBtnClick(mx, my, player) {
    if (!this._mobileSpellBtns) return false;
    for (const btn of this._mobileSpellBtns) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        player.activeSpell = btn.spellKey;
        return true;
      }
    }
    return false;
  }
}

// ── Shared button draw helper ─────────────────────────────────────────────────
function _drawBtn(ctx, x, y, w, h, label, bg, glow, pulse) {
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur  = 14 * pulse;
  ctx.fillStyle   = bg;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = glow;
  ctx.lineWidth   = 2 * pulse;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.stroke();
  ctx.shadowBlur  = 0;
  ctx.fillStyle   = '#ffffff';
  ctx.font        = `bold ${Math.floor(h * 0.45)}px 'Georgia', serif`;
  ctx.textAlign   = 'center';
  ctx.fillText(label, x + w / 2, y + h * 0.65);
  ctx.restore();
}
