'use strict';

// ─── Spell / projectile system ────────────────────────────────────────────────

class Projectile {
  constructor(x, y, vx, vy, spellKey, damageMultiplier) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.spellKey = spellKey;
    this.def = SPELL_TYPES[spellKey];
    this.damageMultiplier = damageMultiplier || 1;
    this.alive = true;
    this.angle = Math.atan2(vy, vx);
    this.frame = 0;
    this.chainLeft = (this.def.special === 'chain') ? this.def.maxChains : 0;
    this.chainHit = new Set();  // enemy ids already chained
  }

  update(dt, dungeon, enemies, onChain) {
    const speed = this.def.speed;
    this.x += this.vx * speed * dt * 60;
    this.y += this.vy * speed * dt * 60;
    this.frame++;

    // Wall collision
    if (!dungeon.isWalkable(this.x, this.y)) {
      this.alive = false;
      return null;
    }

    // Enemy collision
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = dist(this.x, this.y, enemy.x, enemy.y);
      if (d < enemy.size + this.def.radius) {
        this._applyHit(enemy, enemies, onChain);
        this.alive = false;
        return enemy;
      }
    }
    return null;
  }

  _applyHit(enemy, allEnemies, onChain) {
    const dmg = Math.round(this.def.damage * this.damageMultiplier);
    enemy.takeDamage(dmg, this.spellKey);

    if (this.def.special === 'burn') {
      enemy.applyBurn(this.def.burnDamage * this.damageMultiplier,
                      this.def.burnInterval, this.def.burnDuration);
    } else if (this.def.special === 'slow') {
      enemy.applySlow(this.def.slowFactor, this.def.slowDuration);
    } else if (this.def.special === 'chain') {
      this._chain(enemy, allEnemies, onChain);
    }
  }

  _chain(hitEnemy, allEnemies, onChain) {
    if (this.chainLeft <= 0) return;
    this.chainHit.add(hitEnemy.id);

    // Find nearest unchained enemy in range
    let nearest = null;
    let nearDist = Infinity;
    for (const e of allEnemies) {
      if (!e.alive || this.chainHit.has(e.id)) continue;
      const d = dist(hitEnemy.x, hitEnemy.y, e.x, e.y);
      if (d < this.def.chainRange && d < nearDist) {
        nearest = e; nearDist = d;
      }
    }
    if (nearest) {
      const chainDmg = Math.round(this.def.chainDamage * this.damageMultiplier);
      nearest.takeDamage(chainDmg, 'chain');
      this.chainHit.add(nearest.id);
      this.chainLeft--;
      if (onChain) onChain(hitEnemy.x, hitEnemy.y, nearest.x, nearest.y);
      this._chain(nearest, allEnemies, onChain);
    }
  }

  render(ctx, camX, camY) {
    const sx = this.x - camX;
    const sy = this.y - camY;
    const r  = this.def.radius;
    if (this.spellKey === 'fireball') {
      drawFireball(ctx, sx, sy, r, this.frame);
    } else if (this.spellKey === 'ice') {
      drawIceShard(ctx, sx, sy, r, this.angle, this.frame);
    } else if (this.spellKey === 'lightning') {
      drawLightning(ctx, sx, sy, r, this.frame);
    }
  }
}

// ─── Lightning chain arc visual ───────────────────────────────────────────────

class ChainArc {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1; this.y1 = y1;
    this.x2 = x2; this.y2 = y2;
    this.life = 200; // ms
    this.maxLife = 200;
  }
  update(dt) { this.life -= dt * 1000; }
  get alive() { return this.life > 0; }
  render(ctx, camX, camY) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#aaaaff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(this.x1 - camX, this.y1 - camY);
    // Jagged lightning line
    const steps = 8;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const mx = this.x1 + (this.x2 - this.x1) * t - camX;
      const my = this.y1 + (this.y2 - this.y1) * t - camY;
      const jitter = (Math.random() - 0.5) * 20;
      ctx.lineTo(mx + jitter, my + jitter);
    }
    ctx.lineTo(this.x2 - camX, this.y2 - camY);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ─── Particle system ──────────────────────────────────────────────────────────

class Particle {
  constructor(x, y, vx, vy, color, life, size) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
  }
  get alive() { return this.life > 0; }
  update(dt) {
    this.x  += this.vx * dt * 60;
    this.y  += this.vy * dt * 60;
    this.vx *= 0.97;
    this.vy *= 0.97;
    this.vy += 0.03; // slight gravity
    this.life -= dt * 1000;
  }
  render(ctx, camX, camY) {
    ctx.save();
    ctx.globalAlpha = clamp(this.life / this.maxLife, 0, 1);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.arc(this.x - camX, this.y - camY,
            this.size * (this.life / this.maxLife), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ─── Spell manager ────────────────────────────────────────────────────────────

class SpellManager {
  constructor() {
    this.projectiles = [];
    this.arcs        = [];
    this.particles   = [];
  }

  cast(x, y, tx, ty, spellKey, damageMultiplier) {
    const def = SPELL_TYPES[spellKey];
    const dx = tx - x, dy = ty - y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const proj = new Projectile(x, y, dx / len, dy / len, spellKey, damageMultiplier);
    this.projectiles.push(proj);
    // Spawn trail particles
    this._spawnCastParticles(x, y, spellKey);
    return proj;
  }

  _spawnCastParticles(x, y, spellKey) {
    const def = SPELL_TYPES[spellKey];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = Math.random() * 1.5 + 0.5;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * spd, Math.sin(angle) * spd,
        def.trailColor,
        300 + Math.random() * 200,
        3 + Math.random() * 2,
      ));
    }
  }

  spawnHitParticles(x, y, spellKey) {
    const def = SPELL_TYPES[spellKey] || SPELL_TYPES.fireball;
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = Math.random() * 2.5 + 0.5;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * spd, Math.sin(angle) * spd,
        def.glowColor,
        400 + Math.random() * 300,
        4 + Math.random() * 3,
      ));
    }
  }

  spawnDeathParticles(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = Math.random() * 2 + 1;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * spd, Math.sin(angle) * spd,
        color,
        500 + Math.random() * 300,
        4 + Math.random() * 4,
      ));
    }
  }

  spawnBurnParticle(x, y) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    this.particles.push(new Particle(
      x + (Math.random() - 0.5) * 14,
      y - 8,
      Math.cos(angle) * 0.5, Math.sin(angle) * 0.8,
      Math.random() < 0.5 ? '#ff4400' : '#ffaa00',
      400 + Math.random() * 200,
      2 + Math.random() * 2,
    ));
  }

  spawnIceParticle(x, y) {
    const angle = Math.random() * Math.PI * 2;
    this.particles.push(new Particle(
      x + (Math.random() - 0.5) * 12,
      y - 5,
      Math.cos(angle) * 0.3, Math.sin(angle) * 0.3,
      '#88ddff',
      600 + Math.random() * 200,
      2 + Math.random() * 2,
    ));
  }

  update(dt, dungeon, enemies) {
    const chainCb = (x1, y1, x2, y2) => {
      this.arcs.push(new ChainArc(x1, y1, x2, y2));
    };

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const hit = p.update(dt, dungeon, enemies, chainCb);
      if (!p.alive) {
        if (hit) this.spawnHitParticles(hit.x, hit.y, p.spellKey);
        this.projectiles.splice(i, 1);
      }
    }
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      this.arcs[i].update(dt);
      if (!this.arcs[i].alive) this.arcs.splice(i, 1);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (!this.particles[i].alive) this.particles.splice(i, 1);
    }
  }

  render(ctx, camX, camY) {
    for (const arc  of this.arcs)        arc.render(ctx, camX, camY);
    for (const proj of this.projectiles) proj.render(ctx, camX, camY);
    for (const p    of this.particles)   p.render(ctx, camX, camY);
  }
}
