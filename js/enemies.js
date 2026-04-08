'use strict';

// ─── Enemy AI ─────────────────────────────────────────────────────────────────

let _enemyIdCounter = 0;

class Enemy {
  constructor(typeKey, x, y, difficulty) {
    this.id       = ++_enemyIdCounter;
    this.type     = typeKey;
    this.def      = ENEMY_TYPES[typeKey];
    this.x        = x;
    this.y        = y;
    this.alive    = true;
    this.frame    = 0;

    // Scale HP/damage with dungeon difficulty
    const scale = difficulty || 1;
    this.maxHp  = Math.round(this.def.maxHp  * scale);
    this.hp     = this.maxHp;
    this.damage = Math.round(this.def.damage * scale);
    this.speed  = this.def.speed;
    this.size   = this.def.size;

    // AI state
    this.state      = 'idle';   // idle | chase | attack
    this.idleTimer  = Math.random() * 2000;
    this.idleVx     = 0;
    this.idleVy     = 0;
    this.attackTimer = 0;

    // Status effects
    this.effects = {};  // burn | slow | poison

    // Ranged projectile tracking
    this.rangedProj  = [];  // {x, y, vx, vy, damage, speed, color, size}
    this._isRanged   = this.def.isRanged || false;

    // Death animation
    this.deadAlpha    = 1;
    this.deathTimer   = 0;
    this.flashTimer   = 0;
  }

  /** Apply burn: damage per interval for duration (ms) */
  applyBurn(dmgPerTick, interval, duration) {
    this.effects.burn = {
      dmgPerTick,
      interval,
      duration,
      timer: 0,
    };
  }

  /** Apply slow */
  applySlow(factor, duration) {
    this.effects.slow = { factor, duration };
  }

  /** Called by projectile / chain hit */
  takeDamage(amount, source) {
    if (!this.alive) return;
    this.hp -= amount;
    this.flashTimer = 120;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  getEffectiveSpeed() {
    if (this.effects.slow && this.effects.slow.duration > 0) {
      return this.speed * this.effects.slow.factor;
    }
    return this.speed;
  }

  update(dt, player, dungeon, spellManager) {
    this.frame++;
    this.flashTimer = Math.max(0, this.flashTimer - dt * 1000);

    if (!this.alive) return;

    // ── Status effects
    this._updateEffects(dt, spellManager);

    // ── Regen (trolls)
    if (this.def.special === 'regen') {
      this.hp = Math.min(this.maxHp, this.hp + this.def.regenRate * dt);
    }

    const px = player.x, py = player.y;
    const d  = dist(this.x, this.y, px, py);
    const spd = this.getEffectiveSpeed();

    // ── State machine
    if (d < this.def.detectRange) {
      this.state = 'chase';
    } else if (this.state === 'chase') {
      this.state = 'idle';
    }

    if (this.state === 'idle') {
      this._idleMove(dt, dungeon);
    } else if (this.state === 'chase') {
      if (d < this.def.attackRange) {
        this.state = 'attack';
      } else {
        this._moveToward(px, py, spd, dt, dungeon);
      }
    }

    if (this.state === 'attack') {
      if (d > this.def.attackRange * 1.2) {
        this.state = 'chase';
      } else {
        this.attackTimer -= dt * 1000;
        if (this.attackTimer <= 0) {
          this.attackTimer = this.def.attackCooldown;
          this._doAttack(player, dungeon, spellManager);
        }
        // Keep slight approach on melee
        if (!this._isRanged) {
          this._moveToward(px, py, spd * 0.3, dt, dungeon);
        }
      }
    }

    // Ranged projectile updates
    for (let i = this.rangedProj.length - 1; i >= 0; i--) {
      const p = this.rangedProj[i];
      p.x += p.vx * p.speed * dt * 60;
      p.y += p.vy * p.speed * dt * 60;
      p.life -= dt * 1000;
      if (p.life <= 0 || !dungeon.isWalkable(p.x, p.y)) {
        this.rangedProj.splice(i, 1);
        continue;
      }
      // Hit player
      if (dist(p.x, p.y, px, py) < player.size + p.size) {
        player.takeDamage(p.damage, this.type);
        if (p.special === 'burn')   player.applyBurn(p.burnDamage, 1000, p.burnDuration);
        if (p.special === 'poison') player.applyPoison(p.poisonDamage, 1000, p.poisonDuration);
        this.rangedProj.splice(i, 1);
      }
    }
  }

  _updateEffects(dt, spellManager) {
    if (this.effects.burn) {
      const b = this.effects.burn;
      b.timer    -= dt * 1000;
      b.duration -= dt * 1000;
      if (b.timer <= 0 && this.alive) {
        this.takeDamage(b.dmgPerTick, 'burn');
        b.timer = b.interval;
        if (spellManager) spellManager.spawnBurnParticle(this.x, this.y);
      }
      if (b.duration <= 0) delete this.effects.burn;
    }
    if (this.effects.slow) {
      this.effects.slow.duration -= dt * 1000;
      if (spellManager && Math.random() < 0.05) spellManager.spawnIceParticle(this.x, this.y);
      if (this.effects.slow.duration <= 0) delete this.effects.slow;
    }
    if (this.effects.poison) {
      const p = this.effects.poison;
      p.timer    -= dt * 1000;
      p.duration -= dt * 1000;
      if (p.timer <= 0 && this.alive) {
        this.takeDamage(p.dmgPerTick, 'poison');
        p.timer = p.interval;
      }
      if (p.duration <= 0) delete this.effects.poison;
    }
  }

  _idleMove(dt, dungeon) {
    this.idleTimer -= dt * 1000;
    if (this.idleTimer <= 0) {
      this.idleTimer = 1500 + Math.random() * 2000;
      if (Math.random() < 0.4) {
        this.idleVx = 0; this.idleVy = 0;
      } else {
        const angle = Math.random() * Math.PI * 2;
        this.idleVx = Math.cos(angle);
        this.idleVy = Math.sin(angle);
      }
    }
    if (this.idleVx !== 0 || this.idleVy !== 0) {
      this._move(this.idleVx * this.speed * 0.4, this.idleVy * this.speed * 0.4, dt, dungeon);
    }
  }

  _moveToward(tx, ty, spd, dt, dungeon) {
    const dx = tx - this.x, dy = ty - this.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    // Phasing (ghosts) walk through walls
    if (this.def.special === 'phasing') {
      this.x += (dx / len) * spd * dt * 60;
      this.y += (dy / len) * spd * dt * 60;
    } else {
      this._move((dx / len) * spd, (dy / len) * spd, dt, dungeon);
    }
  }

  _move(vx, vy, dt, dungeon) {
    const nx = this.x + vx * dt * 60;
    const ny = this.y + vy * dt * 60;
    const r  = this.size * 0.7;

    const canX = dungeon.isWalkable(nx + Math.sign(vx) * r, this.y) &&
                 dungeon.isWalkable(nx + Math.sign(vx) * r, this.y + r * 0.5) &&
                 dungeon.isWalkable(nx + Math.sign(vx) * r, this.y - r * 0.5);
    const canY = dungeon.isWalkable(this.x, ny + Math.sign(vy) * r) &&
                 dungeon.isWalkable(this.x + r * 0.5, ny + Math.sign(vy) * r) &&
                 dungeon.isWalkable(this.x - r * 0.5, ny + Math.sign(vy) * r);

    if (canX) this.x = nx;
    if (canY) this.y = ny;
  }

  _doAttack(player, dungeon, spellManager) {
    if (this._isRanged) {
      // Ranged attack – fire a projectile
      const dx = player.x - this.x, dy = player.y - this.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const proj = {
        x: this.x, y: this.y,
        vx: dx / len, vy: dy / len,
        speed: this.def.projectileSpeed || 3,
        damage: this.damage,
        color: this.def.projectileColor || '#ff0000',
        size: 6,
        life: 2500,
        special: this.def.special,
        burnDamage: this.def.burnDamage,
        burnDuration: this.def.burnDuration,
        poisonDamage: this.def.poisonDamage,
        poisonDuration: this.def.poisonDuration,
      };
      this.rangedProj.push(proj);
    } else {
      // Melee
      player.takeDamage(this.damage, this.type);
      // Lifesteal
      if (this.def.special === 'lifesteal') {
        this.hp = Math.min(this.maxHp, this.hp + this.damage * this.def.lifeStealPct);
      }
      // Apply zombie/spider poison
      if (this.def.special === 'poison') {
        player.applyPoison(this.def.poisonDamage, 1000, this.def.poisonDuration);
      }
    }
  }

  render(ctx, camX, camY) {
    const sx = this.x - camX;
    const sy = this.y - camY;

    // Flash white on hit
    if (this.flashTimer > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (this.flashTimer / 120) * 0.6;
    }

    drawEnemy(ctx, this.type, sx, sy, this.hp, this.maxHp, this.effects, this.frame);

    if (this.flashTimer > 0) ctx.restore();

    // Ranged projectiles
    for (const p of this.rangedProj) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y - camY, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }
}
