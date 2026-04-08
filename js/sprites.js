'use strict';

// ─── Pure canvas drawing utilities ───────────────────────────────────────────
// All draw* functions take a CanvasRenderingContext2D and draw centred at (cx,cy).

// ── Wizard character (shared base) ──────────────────────────────────────────

function drawWizardBase(ctx, cx, cy, scale, robeColor, robeLight, hairColor, eyeColor, hatColor, frame) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const bob = Math.sin(frame * 0.15) * 1.5;

  // ── Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Robe
  ctx.fillStyle = robeColor;
  ctx.beginPath();
  ctx.moveTo(-11, -4 + bob);
  ctx.lineTo(-13, 14);
  ctx.lineTo(13, 14);
  ctx.lineTo(11, -4 + bob);
  ctx.closePath();
  ctx.fill();

  // Robe highlight
  ctx.fillStyle = robeLight;
  ctx.beginPath();
  ctx.moveTo(-3, -4 + bob);
  ctx.lineTo(-4, 14);
  ctx.lineTo(1, 14);
  ctx.lineTo(3, -4 + bob);
  ctx.closePath();
  ctx.fill();

  // Robe hem detail
  ctx.strokeStyle = robeLight;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-13, 10);
  ctx.lineTo(13, 10);
  ctx.stroke();

  // ── Belt
  ctx.fillStyle = '#3a2a10';
  ctx.fillRect(-11, -1 + bob, 22, 3);

  // ── Neck
  ctx.fillStyle = '#f5c8a0';
  ctx.fillRect(-4, -10 + bob, 8, 6);

  // ── Head
  const hy = -21 + bob;
  ctx.fillStyle = '#f5c8a0';
  ctx.beginPath();
  ctx.ellipse(0, hy, 10, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Hair base (back)
  ctx.fillStyle = hairColor;
  ctx.beginPath();
  ctx.ellipse(0, hy - 4, 10, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Face skin overlay
  ctx.fillStyle = '#f5c8a0';
  ctx.beginPath();
  ctx.ellipse(1, hy + 1, 7.5, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Eyes
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(-3, hy + 1, 1.5, 0, Math.PI * 2);
  ctx.arc(4, hy + 1, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Pupil
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(-3, hy + 1.3, 0.8, 0, Math.PI * 2);
  ctx.arc(4, hy + 1.3, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // ── Nose
  ctx.fillStyle = '#e8a888';
  ctx.beginPath();
  ctx.arc(1, hy + 3, 1, 0, Math.PI * 2);
  ctx.fill();

  // ── Mouth (slight smile)
  ctx.strokeStyle = '#c0887070';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(1, hy + 6, 3, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // ── Hat
  ctx.fillStyle = hatColor;
  ctx.beginPath();
  ctx.moveTo(-10, hy - 9);
  ctx.lineTo(10, hy - 9);
  ctx.lineTo(5, hy - 26);
  ctx.lineTo(-5, hy - 26);
  ctx.closePath();
  ctx.fill();
  // Brim
  ctx.beginPath();
  ctx.ellipse(0, hy - 9, 11, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawMaleWizard(ctx, cx, cy, scale, frame) {
  // Brown hair, blue robe, blue eyes
  drawWizardBase(ctx, cx, cy, scale, '#1a3a8a', '#3a6adc', '#5c2e10', '#4488cc', '#1a2860', frame);
  // Draw hair detail (slightly spiky/messy)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  const bob = Math.sin(frame * 0.15) * 1.5;
  const hy = -21 + bob;
  ctx.fillStyle = '#5c2e10';
  ctx.beginPath();
  ctx.arc(-8, hy - 8, 4, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6, hy - 9, 3.5, Math.PI, 0);
  ctx.fill();
  ctx.restore();

  // Staff
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  const b2 = Math.sin(frame * 0.15) * 1.5;
  // Shaft
  ctx.strokeStyle = '#5a3a18';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(14, 14);
  ctx.lineTo(20, -28 + b2);
  ctx.stroke();
  // Gem glow
  ctx.shadowColor = '#66aaff';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#4488ff';
  ctx.beginPath();
  ctx.arc(21, -30 + b2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawFemaleWizard(ctx, cx, cy, scale, frame) {
  // Blonde hair, purple robe, green eyes
  drawWizardBase(ctx, cx, cy, scale, '#6a1e8a', '#b060e0', '#d4aa20', '#44aa66', '#50107a', frame);
  // Long flowing hair
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  const bob = Math.sin(frame * 0.15) * 1.5;
  const hy = -21 + bob;
  ctx.fillStyle = '#d4aa20';
  // Side locks flowing down
  ctx.beginPath();
  ctx.ellipse(-9, hy + 4, 4, 10, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(10, hy + 4, 4, 10, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Staff
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  const b2 = Math.sin(frame * 0.15) * 1.5;
  ctx.strokeStyle = '#8a7a50';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(14, 14);
  ctx.lineTo(20, -28 + b2);
  ctx.stroke();
  ctx.shadowColor = '#cc66ff';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#cc44ff';
  ctx.beginPath();
  ctx.arc(21, -30 + b2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Wizard portrait (larger, for character select) ───────────────────────────

function drawWizardPortrait(ctx, cx, cy, gender) {
  const scale = 2.2;
  if (gender === 'male') {
    drawMaleWizard(ctx, cx, cy, scale, 0);
  } else {
    drawFemaleWizard(ctx, cx, cy, scale, 0);
  }
}

// ── Enemy sprites ─────────────────────────────────────────────────────────────

function drawEnemy(ctx, type, cx, cy, hp, maxHp, statusEffects, frame) {
  ctx.save();
  const bob = Math.sin(frame * 0.12) * 1.5;

  // Slow effect: blue tint
  if (statusEffects && statusEffects.slow) {
    ctx.shadowColor = '#88ddff';
    ctx.shadowBlur = 8;
  }
  // Burn effect: orange tint
  if (statusEffects && statusEffects.burn) {
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 8;
  }

  switch (type) {
    case 'goblin':    _drawGoblin(ctx, cx, cy + bob, frame);    break;
    case 'skeleton':  _drawSkeleton(ctx, cx, cy + bob, frame);  break;
    case 'orc':       _drawOrc(ctx, cx, cy + bob, frame);       break;
    case 'zombie':    _drawZombie(ctx, cx, cy + bob, frame);    break;
    case 'darkelf':   _drawDarkElf(ctx, cx, cy + bob, frame);   break;
    case 'troll':     _drawTroll(ctx, cx, cy + bob, frame);     break;
    case 'vampire':   _drawVampire(ctx, cx, cy + bob, frame);   break;
    case 'demon':     _drawDemon(ctx, cx, cy + bob, frame);     break;
    case 'spider':    _drawSpider(ctx, cx, cy + bob, frame);    break;
    case 'dragon':    _drawDragon(ctx, cx, cy + bob, frame);    break;
    case 'ghost':     _drawGhost(ctx, cx, cy + bob, frame);     break;
    case 'werewolf':  _drawWerewolf(ctx, cx, cy + bob, frame);  break;
    default:          _drawGoblin(ctx, cx, cy + bob, frame);
  }

  ctx.shadowBlur = 0;

  // Health bar
  const barW = 30;
  const barH = 4;
  const bx = cx - barW / 2;
  const by = cy - ENEMY_TYPES[type].size - 14;
  const ratio = clamp(hp / maxHp, 0, 1);
  ctx.fillStyle = '#333';
  ctx.fillRect(bx, by, barW, barH);
  ctx.fillStyle = ratio > 0.5 ? '#44cc44' : ratio > 0.25 ? '#ffaa00' : '#ee2222';
  ctx.fillRect(bx, by, barW * ratio, barH);

  ctx.restore();
}

function _drawGoblin(ctx, cx, cy) {
  // Body
  ctx.fillStyle = '#3a9a3a';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.fillStyle = '#44bb44';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 10, 9, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Big ears
  ctx.fillStyle = '#3a9a3a';
  ctx.beginPath();
  ctx.ellipse(cx - 11, cy - 10, 5, 4, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 11, cy - 10, 5, 4, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#ff2200';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 11, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 3, cy - 11, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 11, 1, 0, Math.PI * 2);
  ctx.arc(cx + 3, cy - 11, 1, 0, Math.PI * 2);
  ctx.fill();
  // Mouth (fangs)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 7);
  ctx.lineTo(cx - 5, cy - 4);
  ctx.lineTo(cx - 1, cy - 5);
  ctx.moveTo(cx + 3, cy - 7);
  ctx.lineTo(cx + 5, cy - 4);
  ctx.lineTo(cx + 1, cy - 5);
  ctx.fill();
}

function _drawSkeleton(ctx, cx, cy) {
  const bc = '#ddddcc';
  // Body
  ctx.strokeStyle = bc;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx, cy + 8);
  ctx.moveTo(cx - 9, cy);
  ctx.lineTo(cx + 9, cy);
  ctx.moveTo(cx, cy + 8);
  ctx.lineTo(cx - 7, cy + 16);
  ctx.moveTo(cx, cy + 8);
  ctx.lineTo(cx + 7, cy + 16);
  ctx.stroke();
  // Skull
  ctx.fillStyle = bc;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 12, 9, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye sockets
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.ellipse(cx - 3, cy - 13, 3, 3.5, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 3, cy - 13, 3, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Jaw teeth
  ctx.fillStyle = bc;
  ctx.fillRect(cx - 6, cy - 5, 12, 3);
  ctx.fillStyle = '#222';
  for (let i = -2; i <= 2; i++) {
    ctx.fillRect(cx + i * 4 - 1, cy - 5, 2, 2);
  }
}

function _drawOrc(ctx, cx, cy) {
  // Body
  ctx.fillStyle = '#2a7a2a';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 14, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.fillStyle = '#338833';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 10, 12, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#ff8800';
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 12, 3, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy - 12, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 12, 1.5, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy - 12, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Tusks
  ctx.fillStyle = '#eeeecc';
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 5);
  ctx.lineTo(cx - 7, cy);
  ctx.lineTo(cx - 2, cy - 1);
  ctx.moveTo(cx + 4, cy - 5);
  ctx.lineTo(cx + 7, cy);
  ctx.lineTo(cx + 2, cy - 1);
  ctx.fill();
  // Arms
  ctx.fillStyle = '#2a7a2a';
  ctx.fillRect(cx - 18, cy - 6, 8, 14);
  ctx.fillRect(cx + 10, cy - 6, 8, 14);
}

function _drawZombie(ctx, cx, cy) {
  // Body (slightly decayed)
  ctx.fillStyle = '#557755';
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy + 4, 11, 13, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // Head (tilted)
  ctx.save();
  ctx.translate(cx, cy - 10);
  ctx.rotate(0.15);
  ctx.fillStyle = '#668866';
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Sunken eyes
  ctx.fillStyle = '#887700';
  ctx.beginPath();
  ctx.arc(-3, -1, 3, 0, Math.PI * 2);
  ctx.arc(4, -1, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ccaa00';
  ctx.beginPath();
  ctx.arc(-3, -1, 1.5, 0, Math.PI * 2);
  ctx.arc(4, -1, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Outstretched arms
  ctx.strokeStyle = '#557755';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 2);
  ctx.lineTo(cx - 22, cy - 8);
  ctx.moveTo(cx + 10, cy - 2);
  ctx.lineTo(cx + 22, cy - 8);
  ctx.stroke();
}

function _drawDarkElf(ctx, cx, cy) {
  // Slender body
  ctx.fillStyle = '#3d1a5c';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cloak
  ctx.fillStyle = '#220d3a';
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 2);
  ctx.lineTo(cx - 8, cy + 16);
  ctx.lineTo(cx + 8, cy + 16);
  ctx.lineTo(cx + 12, cy - 2);
  ctx.closePath();
  ctx.fill();
  // Head
  ctx.fillStyle = '#d4a8c0';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 12, 8, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pointed ears
  ctx.fillStyle = '#d4a8c0';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 14);
  ctx.lineTo(cx - 14, cy - 20);
  ctx.lineTo(cx - 6, cy - 12);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy - 14);
  ctx.lineTo(cx + 14, cy - 20);
  ctx.lineTo(cx + 6, cy - 12);
  ctx.fill();
  // Glowing eyes
  ctx.fillStyle = '#cc44ff';
  ctx.shadowColor = '#cc44ff';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(cx - 2.5, cy - 13, 2, 0, Math.PI * 2);
  ctx.arc(cx + 2.5, cy - 13, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function _drawTroll(ctx, cx, cy) {
  // Massive body
  ctx.fillStyle = '#7a4a22';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, 16, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.fillStyle = '#885530';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 12, 14, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lumpy bumps
  ctx.fillStyle = '#996640';
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 20, 5, 0, Math.PI * 2);
  ctx.arc(cx + 5, cy - 22, 4, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#00ff00';
  ctx.shadowColor = '#00ff00';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 13, 3, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy - 13, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#003300';
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 13, 1.5, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy - 13, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Club arm
  ctx.fillStyle = '#6a3a18';
  ctx.beginPath();
  ctx.roundRect(cx + 12, cy - 10, 8, 20, 3);
  ctx.fill();
  ctx.fillStyle = '#4a2a10';
  ctx.beginPath();
  ctx.ellipse(cx + 16, cy - 12, 7, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function _drawVampire(ctx, cx, cy) {
  // Cape body
  ctx.fillStyle = '#220011';
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy - 4);
  ctx.lineTo(cx - 10, cy + 16);
  ctx.lineTo(cx + 10, cy + 16);
  ctx.lineTo(cx + 14, cy - 4);
  ctx.closePath();
  ctx.fill();
  // Inner cape
  ctx.fillStyle = '#880000';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 2);
  ctx.lineTo(cx - 6, cy + 16);
  ctx.lineTo(cx + 6, cy + 16);
  ctx.lineTo(cx + 8, cy - 2);
  ctx.closePath();
  ctx.fill();
  // Head
  ctx.fillStyle = '#d8b8c0';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 12, 9, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Dark hair
  ctx.fillStyle = '#111122';
  ctx.beginPath();
  ctx.arc(cx, cy - 19, 9, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy - 19);
  ctx.lineTo(cx - 12, cy - 14);
  ctx.lineTo(cx - 6, cy - 16);
  ctx.closePath();
  ctx.moveTo(cx + 9, cy - 19);
  ctx.lineTo(cx + 12, cy - 14);
  ctx.lineTo(cx + 6, cy - 16);
  ctx.closePath();
  ctx.fill();
  // Red eyes
  ctx.fillStyle = '#ff0000';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 13, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 3, cy - 13, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Fangs
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 7);
  ctx.lineTo(cx - 4, cy - 3);
  ctx.lineTo(cx, cy - 4);
  ctx.moveTo(cx + 2, cy - 7);
  ctx.lineTo(cx + 4, cy - 3);
  ctx.lineTo(cx, cy - 4);
  ctx.fill();
}

function _drawDemon(ctx, cx, cy) {
  // Stocky body
  ctx.fillStyle = '#aa1100';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, 14, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wings hint
  ctx.fillStyle = '#880000';
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy - 4);
  ctx.lineTo(cx - 28, cy - 18);
  ctx.lineTo(cx - 10, cy - 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 14, cy - 4);
  ctx.lineTo(cx + 28, cy - 18);
  ctx.lineTo(cx + 10, cy - 2);
  ctx.fill();
  // Head
  ctx.fillStyle = '#cc2200';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 12, 12, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // Horns
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 21);
  ctx.lineTo(cx - 10, cy - 32);
  ctx.lineTo(cx - 2, cy - 22);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy - 21);
  ctx.lineTo(cx + 10, cy - 32);
  ctx.lineTo(cx + 2, cy - 22);
  ctx.fill();
  // Yellow glowing eyes
  ctx.fillStyle = '#ffff00';
  ctx.shadowColor = '#ffff00';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 13, 3, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy - 13, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#aa4400';
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 13, 1.5, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy - 13, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function _drawSpider(ctx, cx, cy) {
  // Abdomen
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hourglass
  ctx.fillStyle = '#cc0000';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Thorax
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 6, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes (cluster of 8)
  ctx.fillStyle = '#ff0000';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 4;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * 4, cy - 8, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  // Legs (4 per side)
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const yOff = cy - 4 + i * 4;
    ctx.beginPath();
    ctx.moveTo(cx - 8, yOff);
    ctx.lineTo(cx - 18 - i, yOff - 4);
    ctx.lineTo(cx - 24 - i * 2, yOff + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 8, yOff);
    ctx.lineTo(cx + 18 + i, yOff - 4);
    ctx.lineTo(cx + 24 + i * 2, yOff + 4);
    ctx.stroke();
  }
}

function _drawDragon(ctx, cx, cy) {
  // Tail
  ctx.fillStyle = '#cc3300';
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 10);
  ctx.quadraticCurveTo(cx - 22, cy + 20, cx - 8, cy + 18);
  ctx.quadraticCurveTo(cx - 16, cy + 14, cx - 10, cy + 6);
  ctx.fill();
  // Body
  ctx.fillStyle = '#dd4400';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 13, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wings
  ctx.fillStyle = '#993300';
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 2);
  ctx.lineTo(cx - 26, cy - 20);
  ctx.lineTo(cx - 18, cy - 4);
  ctx.lineTo(cx - 10, cy + 4);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy - 2);
  ctx.lineTo(cx + 26, cy - 20);
  ctx.lineTo(cx + 18, cy - 4);
  ctx.lineTo(cx + 10, cy + 4);
  ctx.fill();
  // Neck + Head
  ctx.fillStyle = '#ee5500';
  ctx.beginPath();
  ctx.ellipse(cx + 10, cy - 10, 8, 6, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 18, cy - 14, 9, 7, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eye
  ctx.fillStyle = '#ffaa00';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(cx + 22, cy - 16, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Snout
  ctx.fillStyle = '#cc4400';
  ctx.beginPath();
  ctx.moveTo(cx + 24, cy - 12);
  ctx.lineTo(cx + 30, cy - 11);
  ctx.lineTo(cx + 24, cy - 9);
  ctx.fill();
}

function _drawGhost(ctx, cx, cy, frame) {
  ctx.save();
  const pulse = 0.7 + Math.sin(Date.now() * 0.003) * 0.15;
  ctx.globalAlpha = pulse;
  // Wispy body
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
  grad.addColorStop(0, '#bbddff');
  grad.addColorStop(0.6, '#8899dd');
  grad.addColorStop(1, 'rgba(100,120,200,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 16, Math.PI, 0);
  ctx.quadraticCurveTo(cx + 16, cy + 14, cx + 10, cy + 20);
  ctx.quadraticCurveTo(cx + 4, cy + 14, cx, cy + 20);
  ctx.quadraticCurveTo(cx - 4, cy + 14, cx - 10, cy + 20);
  ctx.quadraticCurveTo(cx - 16, cy + 14, cx - 16, cy - 2);
  ctx.closePath();
  ctx.fill();
  // Eyes
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#aaccff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy - 4, 3.5, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 4, cy - 4, 3.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000033';
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy - 3, 2, 2.5, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 4, cy - 3, 2, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function _drawWerewolf(ctx, cx, cy) {
  // Body (hunched)
  ctx.fillStyle = '#5a3a1a';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, 13, 14, -0.15, 0, Math.PI * 2);
  ctx.fill();
  // Head (wolflike)
  ctx.fillStyle = '#6a4a2a';
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy - 10, 11, 10, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Snout
  ctx.fillStyle = '#7a5a3a';
  ctx.beginPath();
  ctx.ellipse(cx + 14, cy - 9, 7, 5, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Nose
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.ellipse(cx + 19, cy - 10, 3, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#ffaa00';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(cx + 7, cy - 13, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 3, cy - 13, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Ears
  ctx.fillStyle = '#5a3a1a';
  ctx.beginPath();
  ctx.moveTo(cx + 4, cy - 19);
  ctx.lineTo(cx + 2, cy - 28);
  ctx.lineTo(cx + 12, cy - 22);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 18);
  ctx.lineTo(cx - 8, cy - 26);
  ctx.lineTo(cx + 2, cy - 21);
  ctx.fill();
  // Claws
  ctx.strokeStyle = '#3a2a10';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy + 2);
  ctx.lineTo(cx - 22, cy - 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 12, cy + 2);
  ctx.lineTo(cx + 20, cy - 2);
  ctx.stroke();
}

// ── Dungeon tile rendering ────────────────────────────────────────────────────

function drawFloorTile(ctx, px, py, dungeonConfig) {
  ctx.fillStyle = dungeonConfig.floorColor;
  ctx.fillRect(px, py, TILE, TILE);
  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
}

function drawWallTile(ctx, px, py, dungeonConfig, isTopEdge) {
  ctx.fillStyle = dungeonConfig.wallColor;
  ctx.fillRect(px, py, TILE, TILE);
  // Top-cap (brighter face)
  if (isTopEdge) {
    ctx.fillStyle = dungeonConfig.wallTopColor;
    ctx.fillRect(px, py, TILE, 10);
  }
  // Stone lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
}

function drawStairTile(ctx, px, py) {
  ctx.fillStyle = '#2a1a4a';
  ctx.fillRect(px, py, TILE, TILE);
  // Swirling portal
  const cx2 = px + TILE / 2;
  const cy2 = py + TILE / 2;
  const grad = ctx.createRadialGradient(cx2, cy2, 2, cx2, cy2, 12);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.4, '#aa88ff');
  grad.addColorStop(1, '#330066');
  ctx.fillStyle = grad;
  ctx.shadowColor = '#aa88ff';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(cx2, cy2, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Down arrow
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.moveTo(cx2, cy2 + 6);
  ctx.lineTo(cx2 - 4, cy2);
  ctx.lineTo(cx2 + 4, cy2);
  ctx.closePath();
  ctx.fill();
}

// ── Projectile visuals ────────────────────────────────────────────────────────

function drawFireball(ctx, x, y, r, frame) {
  const flicker = 0.85 + Math.sin(frame * 0.4) * 0.15;
  ctx.save();
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 2 * flicker);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, '#ffee00');
  grad.addColorStop(0.6, '#ff4400');
  grad.addColorStop(1, 'rgba(255,60,0,0)');
  ctx.fillStyle = grad;
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.6 * flicker, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawIceShard(ctx, x, y, r, angle, frame) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + frame * 0.15);
  ctx.shadowColor = '#88ddff';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#aaeeff';
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.8);
  ctx.lineTo(r * 0.7, 0);
  ctx.lineTo(0, r * 1.8);
  ctx.lineTo(-r * 0.7, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.8);
  ctx.lineTo(r * 0.25, 0);
  ctx.lineTo(0, r * 1.8);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawLightning(ctx, x, y, r, frame) {
  ctx.save();
  ctx.shadowColor = '#aaaaff';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const segments = 6;
  let lx = x - r, ly = y;
  for (let i = 0; i <= segments; i++) {
    const nx = x + r;
    const progress = i / segments;
    const jitter = (Math.random() - 0.5) * r * 0.8;
    ctx.lineTo(x - r + progress * r * 2, y + jitter);
  }
  ctx.stroke();
  // Core
  ctx.strokeStyle = '#ccccff';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Ball
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.5);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.4, '#aaaaff');
  grad.addColorStop(1, 'rgba(100,100,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Particle ──────────────────────────────────────────────────────────────────

function drawParticle(ctx, p) {
  ctx.save();
  ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
  ctx.fillStyle = p.color;
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}
