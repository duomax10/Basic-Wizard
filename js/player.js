'use strict';

// ─── Player ───────────────────────────────────────────────────────────────────

class Player {
  constructor(gender, x, y) {
    this.gender   = gender;  // 'male' | 'female'
    this.x        = x;
    this.y        = y;
    this.size     = 16;
    this.alive    = true;
    this.frame    = 0;

    // Stats
    this.level    = 1;
    this.xp       = 0;
    this.maxHp    = PLAYER_CONFIG.maxHp;
    this.hp       = this.maxHp;
    this.maxMana  = PLAYER_CONFIG.maxMana;
    this.mana     = this.maxMana;
    this.speed    = PLAYER_CONFIG.baseSpeed;
    this.damageMultiplier = 1;

    // Spells
    this.knownSpells  = ['fireball'];
    this.activeSpell  = 'fireball';
    this.spellCooldowns = {};   // spellKey -> ms remaining
    this.pendingSpellChoice = false;   // true when spell select screen needed

    // Status effects (from enemies)
    this.effects  = {};         // burn | poison

    // Flash on hit
    this.flashTimer  = 0;
    this.screenShake = 0;
    this.invincTimer = 0;  // brief invincibility after hit (ms)

    // Direction (for rendering)
    this.facing = { x: 1, y: 0 };
    this.moving = false;
    this._footstepTimer = 0;
  }

  // ── XP & levelling ──────────────────────────────────────────────────────────
  gainXP(amount) {
    this.xp += amount;
    const threshold = XP_THRESHOLDS[this.level];
    if (threshold !== undefined && this.xp >= threshold) {
      return 'levelUp';
    }
    return null;
  }

  levelUp() {
    this.level++;
    this.maxHp   += PLAYER_CONFIG.hpPerLevel;
    this.hp       = Math.min(this.hp + PLAYER_CONFIG.hpPerLevel, this.maxHp);
    this.maxMana += PLAYER_CONFIG.manaPerLevel;
    this.mana     = Math.min(this.mana + PLAYER_CONFIG.manaPerLevel, this.maxMana);
    this.damageMultiplier += PLAYER_CONFIG.damageBonusPerLevel;

    // Unlock spell choice at level 3
    if (this.level === 3 && this.knownSpells.length < 2) {
      this.pendingSpellChoice = true;
    }
  }

  unlockSpell(spellKey) {
    if (!this.knownSpells.includes(spellKey)) {
      this.knownSpells.push(spellKey);
    }
    this.activeSpell = spellKey;
    this.pendingSpellChoice = false;
  }

  nextSpell() {
    const idx = this.knownSpells.indexOf(this.activeSpell);
    this.activeSpell = this.knownSpells[(idx + 1) % this.knownSpells.length];
  }

  // ── Combat ──────────────────────────────────────────────────────────────────
  canCast(spellKey) {
    const def = SPELL_TYPES[spellKey];
    const cd  = this.spellCooldowns[spellKey] || 0;
    return cd <= 0 && this.mana >= def.manaCost;
  }

  castSpell(spellKey) {
    const def = SPELL_TYPES[spellKey];
    this.mana -= def.manaCost;
    this.spellCooldowns[spellKey] = def.cooldown;
  }

  takeDamage(amount, source) {
    if (!this.alive || this.invincTimer > 0) return;
    this.hp -= amount;
    this.flashTimer  = 180;
    this.screenShake = 6;
    this.invincTimer = 400;
    if (typeof audio !== 'undefined') audio.playPlayerDamage();
    if (this.hp <= 0) {
      this.hp    = 0;
      this.alive = false;
    }
  }

  applyBurn(dmg, interval, duration) {
    this.effects.burn = { dmgPerTick: dmg, interval, duration, timer: 0 };
  }

  applyPoison(dmg, interval, duration) {
    this.effects.poison = { dmgPerTick: dmg, interval, duration, timer: 0 };
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  update(dt, input, dungeon, spellManager) {
    this.frame++;
    this.flashTimer  = Math.max(0, this.flashTimer  - dt * 1000);
    this.screenShake = Math.max(0, this.screenShake - dt * 200);
    this.invincTimer = Math.max(0, this.invincTimer - dt * 1000);

    // Mana regen
    this.mana = Math.min(this.maxMana, this.mana + PLAYER_CONFIG.manaRegenRate * dt);

    // Spell cooldowns
    for (const key of Object.keys(this.spellCooldowns)) {
      this.spellCooldowns[key] = Math.max(0, this.spellCooldowns[key] - dt * 1000);
    }

    // Status effects
    this._updateEffects(dt, spellManager);

    // Movement
    const mv = input.getMovement();
    this.moving = (mv.x !== 0 || mv.y !== 0);
    if (this.moving) {
      this.facing.x = mv.x;
      this.facing.y = mv.y;
      // Footstep sounds
      this._footstepTimer -= dt;
      if (this._footstepTimer <= 0) {
        this._footstepTimer = 0.3;
        if (typeof audio !== 'undefined') audio.playFootstep();
      }
    } else {
      this._footstepTimer = 0;
    }
    this._move(mv.x * this.speed, mv.y * this.speed, dt, dungeon);

    // Spell cycling: Tab or Q
    if (input.keys['Tab'] || input.keys['KeyQ']) {
      input.keys['Tab'] = false;
      input.keys['KeyQ'] = false;
      if (this.knownSpells.length > 1) this.nextSpell();
    }

    // Number keys to switch spells
    for (let i = 0; i < this.knownSpells.length; i++) {
      const code = `Digit${i + 1}`;
      if (input.keys[code]) {
        input.keys[code] = false;
        this.activeSpell = this.knownSpells[i];
      }
    }
  }

  _updateEffects(dt, spellManager) {
    for (const key of ['burn', 'poison']) {
      const e = this.effects[key];
      if (!e) continue;
      e.timer    -= dt * 1000;
      e.duration -= dt * 1000;
      if (e.timer <= 0 && this.alive) {
        this.takeDamage(e.dmgPerTick, key);
        e.timer = e.interval;
        if (spellManager && key === 'burn') {
          spellManager.spawnBurnParticle(this.x, this.y);
        }
      }
      if (e.duration <= 0) delete this.effects[key];
    }
  }

  _move(vx, vy, dt, dungeon) {
    const nx = this.x + vx * dt * 60;
    const ny = this.y + vy * dt * 60;
    const r  = this.size;

    const canX = dungeon.isWalkable(nx + Math.sign(vx) * r, this.y) &&
                 dungeon.isWalkable(nx + Math.sign(vx) * r, this.y + r * 0.6) &&
                 dungeon.isWalkable(nx + Math.sign(vx) * r, this.y - r * 0.6);
    const canY = dungeon.isWalkable(this.x, ny + Math.sign(vy) * r) &&
                 dungeon.isWalkable(this.x + r * 0.6, ny + Math.sign(vy) * r) &&
                 dungeon.isWalkable(this.x - r * 0.6, ny + Math.sign(vy) * r);

    if (canX) this.x = nx;
    if (canY) this.y = ny;
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  render(ctx, camX, camY) {
    const sx = this.x - camX;
    const sy = this.y - camY;

    if (this.flashTimer > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (this.flashTimer / 180) * 0.5;
    }

    if (this.gender === 'male') {
      drawMaleWizard(ctx, sx, sy, 0.9, this.frame);
    } else {
      drawFemaleWizard(ctx, sx, sy, 0.9, this.frame);
    }

    if (this.flashTimer > 0) ctx.restore();
  }

  getXPPercent() {
    const prev = XP_THRESHOLDS[this.level - 1] || 0;
    const next = XP_THRESHOLDS[this.level];
    if (!next) return 1;
    return clamp((this.xp - prev) / (next - prev), 0, 1);
  }
}
