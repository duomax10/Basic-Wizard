'use strict';

// ─── Pure canvas drawing utilities ───────────────────────────────────────────
// All draw* functions take a CanvasRenderingContext2D and draw centred at (cx,cy).

// ── Tile hash for consistent per-tile variation ─────────────────────────────
function _tileHash(px, py) {
  const x = Math.floor(px / TILE), y = Math.floor(py / TILE);
  return ((x * 73856093) ^ (y * 19349663)) >>> 0;
}

// ── Wizard character (shared base) ──────────────────────────────────────────

function drawWizardBase(ctx, cx, cy, scale, robeColor, robeLight, hairColor, eyeColor, hatColor, frame) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const bob = Math.sin(frame * 0.08) * 2;
  const walk = Math.sin(frame * 0.25);
  const sway = walk * 2;

  // ── Magical aura (subtle pulse)
  const auraPulse = 0.06 + Math.sin(frame * 0.04) * 0.03;
  const auraGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 35);
  auraGrad.addColorStop(0, `rgba(180,140,255,${auraPulse})`);
  auraGrad.addColorStop(1, 'rgba(180,140,255,0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, bob, 35, 0, Math.PI * 2);
  ctx.fill();

  // ── Shadow (scales with bob)
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 17, 13 - bob * 0.3, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Boots (peek out below robe)
  ctx.fillStyle = '#3a2210';
  ctx.beginPath();
  ctx.ellipse(-5 + walk * 2, 15, 4, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(5 - walk * 2, 15, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Boot highlight
  ctx.fillStyle = '#5a3a20';
  ctx.beginPath();
  ctx.ellipse(-5 + walk * 2, 14.5, 2.5, 1.5, 0, 0, Math.PI * 2);
  ctx.ellipse(5 - walk * 2, 14.5, 2.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Cape (flows behind with gradient)
  const capeGrad = ctx.createLinearGradient(0, -6, 0, 18);
  capeGrad.addColorStop(0, hatColor);
  capeGrad.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = capeGrad;
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.moveTo(-9, -7 + bob);
  ctx.quadraticCurveTo(-14 - sway * 1.2, 4 + bob, -11 - sway * 0.8, 18);
  ctx.quadraticCurveTo(-6 - sway * 0.5, 16, 0, 18);
  ctx.quadraticCurveTo(6 - sway * 0.5, 16, 11 - sway * 0.8, 18);
  ctx.quadraticCurveTo(14 - sway * 1.2, 4 + bob, 9, -7 + bob);
  ctx.closePath();
  ctx.fill();
  // Cape inner lining
  ctx.fillStyle = robeLight;
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.moveTo(-6, -4 + bob);
  ctx.quadraticCurveTo(-9 - sway, 6 + bob, -7 - sway * 0.5, 16);
  ctx.lineTo(7 - sway * 0.5, 16);
  ctx.quadraticCurveTo(9 - sway, 6 + bob, 6, -4 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // ── Robe body with gradient
  const robeGrad = ctx.createLinearGradient(-14, -6, 8, 16);
  robeGrad.addColorStop(0, robeLight);
  robeGrad.addColorStop(0.35, robeColor);
  robeGrad.addColorStop(1, robeColor);
  ctx.fillStyle = robeGrad;
  ctx.beginPath();
  ctx.moveTo(-11, -5 + bob);
  ctx.lineTo(-13 + sway * 0.5, 14);
  ctx.lineTo(13 + sway * 0.5, 14);
  ctx.lineTo(11, -5 + bob);
  ctx.closePath();
  ctx.fill();

  // Robe side shadow (depth)
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.moveTo(-11, -5 + bob);
  ctx.lineTo(-13 + sway * 0.5, 14);
  ctx.lineTo(-8 + sway * 0.3, 14);
  ctx.lineTo(-8, -3 + bob);
  ctx.closePath();
  ctx.fill();

  // Robe highlight strip (center seam)
  ctx.fillStyle = robeLight;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(-1.5, -5 + bob);
  ctx.lineTo(-2.5, 14);
  ctx.lineTo(2.5, 14);
  ctx.lineTo(1.5, -5 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Robe fold lines
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-7, 0 + bob); ctx.lineTo(-8 + sway * 0.3, 14);
  ctx.moveTo(7, 0 + bob);  ctx.lineTo(8 + sway * 0.3, 14);
  ctx.moveTo(-4, 3 + bob); ctx.lineTo(-5 + sway * 0.2, 14);
  ctx.moveTo(4, 3 + bob);  ctx.lineTo(5 + sway * 0.2, 14);
  ctx.stroke();

  // Scalloped robe hem
  ctx.strokeStyle = robeLight;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const hemY = 13;
  ctx.moveTo(-13 + sway * 0.5, hemY);
  for (let i = 0; i < 6; i++) {
    const hx = -13 + sway * 0.5 + (i + 0.5) * (26 / 6);
    ctx.quadraticCurveTo(hx, hemY + 2.5, -13 + sway * 0.5 + (i + 1) * (26 / 6), hemY);
  }
  ctx.stroke();

  // ── Shoulder collar / trim
  ctx.fillStyle = robeLight;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(0, -6 + bob, 12, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Collar edge
  ctx.strokeStyle = robeLight;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, -6 + bob, 12, 3, 0, Math.PI * 0.85, Math.PI * 0.15, true);
  ctx.stroke();

  // ── Belt with ornate buckle
  ctx.fillStyle = '#3a2a10';
  ctx.fillRect(-11, -1.5 + bob, 22, 4);
  // Buckle
  ctx.fillStyle = '#c8a830';
  ctx.beginPath();
  ctx.roundRect(-3, -2 + bob, 6, 5, 1);
  ctx.fill();
  ctx.strokeStyle = '#a08020';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.roundRect(-3, -2 + bob, 6, 5, 1);
  ctx.stroke();
  // Buckle gem
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(0, 0.5 + bob, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Free hand (left side)
  ctx.fillStyle = '#f5c8a0';
  ctx.beginPath();
  ctx.ellipse(-12, 4 + bob + walk * 2, 3, 2.5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // ── Neck
  ctx.fillStyle = '#f5c8a0';
  ctx.fillRect(-4, -11 + bob, 8, 6);

  // ── Head
  const hy = -22 + bob;
  // Head shadow
  ctx.fillStyle = '#e0b090';
  ctx.beginPath();
  ctx.ellipse(0, hy + 1, 10.5, 11.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.fillStyle = '#f5c8a0';
  ctx.beginPath();
  ctx.ellipse(0, hy, 10, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cheek blush
  ctx.fillStyle = 'rgba(220,150,130,0.2)';
  ctx.beginPath();
  ctx.ellipse(-5, hy + 3, 3, 2, 0, 0, Math.PI * 2);
  ctx.ellipse(6, hy + 3, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Hair base (back)
  ctx.fillStyle = hairColor;
  ctx.beginPath();
  ctx.ellipse(0, hy - 4, 10.5, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Face skin overlay
  ctx.fillStyle = '#f5c8a0';
  ctx.beginPath();
  ctx.ellipse(1, hy + 1, 7.5, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Eyebrows (expressive)
  ctx.strokeStyle = hairColor;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5.5, hy - 2.5); ctx.quadraticCurveTo(-3, hy - 3.5, -0.5, hy - 2.8);
  ctx.moveTo(1.5, hy - 2.8); ctx.quadraticCurveTo(4, hy - 3.5, 6.5, hy - 2.5);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // ── Eyes (white + iris + pupil + highlight)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-3, hy + 1, 2.5, 2.2, 0, 0, Math.PI * 2);
  ctx.ellipse(4, hy + 1, 2.5, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye outline
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.ellipse(-3, hy + 1, 2.5, 2.2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(4, hy + 1, 2.5, 2.2, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Iris
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(-3, hy + 1.2, 1.6, 0, Math.PI * 2);
  ctx.arc(4, hy + 1.2, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Pupil
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(-3, hy + 1.4, 0.9, 0, Math.PI * 2);
  ctx.arc(4, hy + 1.4, 0.9, 0, Math.PI * 2);
  ctx.fill();
  // Highlight
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-3.8, hy + 0.2, 0.6, 0, Math.PI * 2);
  ctx.arc(3.2, hy + 0.2, 0.6, 0, Math.PI * 2);
  ctx.fill();

  // ── Nose
  ctx.fillStyle = '#e0a888';
  ctx.beginPath();
  ctx.ellipse(1, hy + 4, 1.5, 1, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d89878';
  ctx.beginPath();
  ctx.arc(0.2, hy + 4.3, 0.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Mouth
  ctx.strokeStyle = '#b0706060';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(1, hy + 6.5, 2.5, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // ── Hat with gradient, curve, and pattern
  const hatGrad = ctx.createLinearGradient(-10, hy - 9, 4, hy - 34);
  hatGrad.addColorStop(0, hatColor);
  hatGrad.addColorStop(0.7, robeLight);
  hatGrad.addColorStop(1, hatColor);
  ctx.fillStyle = hatGrad;
  ctx.beginPath();
  ctx.moveTo(-11, hy - 9);
  ctx.lineTo(11, hy - 9);
  ctx.lineTo(7, hy - 22);
  ctx.quadraticCurveTo(4, hy - 36, -3 + sway * 0.8, hy - 34);
  ctx.quadraticCurveTo(-6 + sway * 0.4, hy - 28, -6, hy - 22);
  ctx.closePath();
  ctx.fill();
  // Hat shadow fold
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.moveTo(-11, hy - 9);
  ctx.lineTo(-6, hy - 22);
  ctx.lineTo(-3, hy - 9);
  ctx.closePath();
  ctx.fill();
  // Hat band with pattern
  ctx.fillStyle = '#c8a830';
  ctx.fillRect(-11, hy - 12, 22, 3);
  // Band stitching
  ctx.strokeStyle = '#a08020';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 8; i++) {
    const bx = -10 + i * 3;
    ctx.beginPath();
    ctx.moveTo(bx, hy - 12); ctx.lineTo(bx + 1.5, hy - 9);
    ctx.stroke();
  }
  // Moon and stars on hat
  ctx.fillStyle = '#ffe880';
  ctx.globalAlpha = 0.6;
  // Crescent moon
  ctx.beginPath();
  ctx.arc(-1, hy - 19, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hatColor;
  ctx.beginPath();
  ctx.arc(0, hy - 20, 2, 0, Math.PI * 2);
  ctx.fill();
  // Stars
  ctx.fillStyle = '#ffe880';
  ctx.beginPath();
  ctx.arc(3, hy - 24, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-3, hy - 27, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1 + sway * 0.3, hy - 31, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Brim
  ctx.fillStyle = hatColor;
  ctx.beginPath();
  ctx.ellipse(0, hy - 9, 13, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Brim highlight
  ctx.fillStyle = robeLight;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.ellipse(0, hy - 10, 11, 2, 0, Math.PI, 0);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawMaleWizard(ctx, cx, cy, scale, frame) {
  drawWizardBase(ctx, cx, cy, scale, '#1a3a8a', '#3a6adc', '#5c2e10', '#4488cc', '#1a2860', frame);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  const bob = Math.sin(frame * 0.08) * 2;
  const sway = Math.sin(frame * 0.25) * 2;
  const hy = -22 + bob;

  // Spiky hair tufts
  ctx.fillStyle = '#5c2e10';
  ctx.beginPath();
  ctx.arc(-8, hy - 8, 4.5, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6, hy - 9, 4, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-2, hy - 10, 3, Math.PI, 0);
  ctx.fill();
  // Hair shine
  ctx.fillStyle = '#7a4a20';
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(-5, hy - 10, 3, Math.PI, 0);
  ctx.fill();
  ctx.globalAlpha = 1;

  // ── Short beard (classic wizard)
  ctx.fillStyle = '#5c2e10';
  ctx.beginPath();
  ctx.moveTo(-5, hy + 6);
  ctx.quadraticCurveTo(-6, hy + 12, -3, hy + 14);
  ctx.quadraticCurveTo(1, hy + 16, 4, hy + 14);
  ctx.quadraticCurveTo(7, hy + 12, 6, hy + 6);
  ctx.closePath();
  ctx.fill();
  // Beard texture lines
  ctx.strokeStyle = '#4a2010';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-3, hy + 8); ctx.lineTo(-2, hy + 13);
  ctx.moveTo(0, hy + 8);  ctx.lineTo(1, hy + 14);
  ctx.moveTo(3, hy + 8);  ctx.lineTo(3, hy + 13);
  ctx.stroke();

  // ── Amulet/pendant
  ctx.fillStyle = '#c8a830';
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = '#c8a830';
  ctx.beginPath();
  ctx.moveTo(-2, -11 + bob);
  ctx.quadraticCurveTo(0, -8 + bob, 2, -11 + bob);
  ctx.stroke();
  ctx.fillStyle = '#4488ff';
  ctx.shadowColor = '#4488ff';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(0, -8.5 + bob, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // ── Staff (ornate, right side)
  const staffTilt = Math.sin(frame * 0.1) * 0.04;
  ctx.save();
  ctx.rotate(staffTilt);

  // Staff hand
  ctx.fillStyle = '#f5c8a0';
  ctx.beginPath();
  ctx.ellipse(14, 2 + bob, 3, 2.5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Shaft with gradient
  const shaftGrad = ctx.createLinearGradient(14, 16, 21, -32);
  shaftGrad.addColorStop(0, '#3a2210');
  shaftGrad.addColorStop(0.5, '#6a4a28');
  shaftGrad.addColorStop(1, '#4a3018');
  ctx.strokeStyle = shaftGrad;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(14, 16);
  ctx.lineTo(21, -30 + bob);
  ctx.stroke();
  // Rune markings on shaft
  ctx.strokeStyle = '#4488ff';
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const ry = -8 - i * 8 + bob;
    ctx.beginPath();
    ctx.moveTo(16, ry); ctx.lineTo(18, ry - 3); ctx.lineTo(16, ry - 6);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Wrapped grip
  ctx.strokeStyle = '#8a6a38';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    const gy = 8 - i * 3.5;
    ctx.beginPath();
    ctx.moveTo(13, gy); ctx.lineTo(16.5, gy - 2);
    ctx.stroke();
  }

  // Staff head - ornate prongs
  const gemX = 21, gemY = -32 + bob;
  ctx.fillStyle = '#4a3018';
  ctx.beginPath();
  ctx.moveTo(gemX - 4, gemY + 4);
  ctx.quadraticCurveTo(gemX - 6, gemY - 2, gemX - 3, gemY - 5);
  ctx.lineTo(gemX, gemY - 2);
  ctx.lineTo(gemX + 3, gemY - 5);
  ctx.quadraticCurveTo(gemX + 6, gemY - 2, gemX + 4, gemY + 4);
  ctx.closePath();
  ctx.fill();

  // Gem with glow
  ctx.shadowColor = '#66aaff';
  ctx.shadowBlur = 18;
  const gemGrad = ctx.createRadialGradient(gemX, gemY, 0, gemX, gemY, 5);
  gemGrad.addColorStop(0, '#aaddff');
  gemGrad.addColorStop(0.4, '#4488ff');
  gemGrad.addColorStop(1, '#2244aa');
  ctx.fillStyle = gemGrad;
  ctx.beginPath();
  ctx.arc(gemX, gemY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Gem inner highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(gemX - 1.5, gemY - 1.5, 2, 1.2, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting sparkles
  for (let i = 0; i < 4; i++) {
    const a = frame * 0.06 + i * (Math.PI * 2 / 4);
    const orbitR = 9 + Math.sin(frame * 0.03 + i) * 2;
    const ox = gemX + Math.cos(a) * orbitR;
    const oy = gemY + Math.sin(a) * orbitR;
    const sparkAlpha = 0.3 + Math.sin(frame * 0.12 + i * 1.5) * 0.3;
    ctx.fillStyle = `rgba(100,180,255,${sparkAlpha})`;
    ctx.beginPath();
    ctx.arc(ox, oy, 1.2 + Math.sin(frame * 0.1 + i) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore(); // staffTilt
  ctx.restore(); // main transform
}

function drawFemaleWizard(ctx, cx, cy, scale, frame) {
  drawWizardBase(ctx, cx, cy, scale, '#6a1e8a', '#b060e0', '#d4aa20', '#44aa66', '#50107a', frame);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  const bob = Math.sin(frame * 0.08) * 2;
  const sway = Math.sin(frame * 0.25) * 2;
  const hy = -22 + bob;

  // ── Long flowing hair with multiple layers and sway
  // Back hair layer (behind body, rendered after base draws over it)
  ctx.fillStyle = '#d4aa20';
  // Left lock
  ctx.beginPath();
  ctx.moveTo(-9, hy + 2);
  ctx.quadraticCurveTo(-12 + sway * 0.5, hy + 12, -10 + sway * 0.8, hy + 22);
  ctx.quadraticCurveTo(-8 + sway * 0.6, hy + 20, -7, hy + 10);
  ctx.closePath();
  ctx.fill();
  // Right lock
  ctx.beginPath();
  ctx.moveTo(10, hy + 2);
  ctx.quadraticCurveTo(13 - sway * 0.5, hy + 12, 11 - sway * 0.8, hy + 22);
  ctx.quadraticCurveTo(9 - sway * 0.6, hy + 20, 8, hy + 10);
  ctx.closePath();
  ctx.fill();
  // Hair highlights (golden sheen)
  ctx.fillStyle = '#e8c840';
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.ellipse(-10, hy + 6, 2, 8, -0.15 + sway * 0.01, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(11, hy + 6, 2, 8, 0.15 + sway * 0.01, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Hair tips (wispy ends)
  ctx.fillStyle = '#c89a18';
  ctx.beginPath();
  ctx.ellipse(-10 + sway * 0.8, hy + 22, 2, 1.5, sway * 0.1, 0, Math.PI * 2);
  ctx.ellipse(11 - sway * 0.8, hy + 22, 2, 1.5, -sway * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // ── Tiara / circlet
  ctx.strokeStyle = '#c8a830';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, hy - 3, 9, Math.PI + 0.3, -0.3);
  ctx.stroke();
  // Tiara gems
  ctx.fillStyle = '#44aa66';
  ctx.shadowColor = '#44aa66';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(0, hy - 12, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#cc44ff';
  ctx.beginPath();
  ctx.arc(-5, hy - 10, 1.3, 0, Math.PI * 2);
  ctx.arc(5, hy - 10, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // ── Necklace
  ctx.strokeStyle = '#c8a830';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-3, -11 + bob);
  ctx.quadraticCurveTo(0, -7 + bob, 3, -11 + bob);
  ctx.stroke();
  // Pendant gem
  ctx.fillStyle = '#44aa66';
  ctx.shadowColor = '#44aa66';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  // Diamond shape
  ctx.moveTo(0, -9.5 + bob);
  ctx.lineTo(-1.5, -7.5 + bob);
  ctx.lineTo(0, -5.5 + bob);
  ctx.lineTo(1.5, -7.5 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // ── Staff (elegant, curved)
  const staffTilt = Math.sin(frame * 0.1) * 0.04;
  ctx.save();
  ctx.rotate(staffTilt);

  // Staff hand
  ctx.fillStyle = '#f5c8a0';
  ctx.beginPath();
  ctx.ellipse(14, 2 + bob, 2.8, 2.2, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Elegant shaft (lighter wood)
  const shaftGrad = ctx.createLinearGradient(14, 16, 21, -32);
  shaftGrad.addColorStop(0, '#6a5a30');
  shaftGrad.addColorStop(0.5, '#a08a50');
  shaftGrad.addColorStop(1, '#7a6a38');
  ctx.strokeStyle = shaftGrad;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(14, 16);
  ctx.quadraticCurveTo(18, -10 + bob, 21, -30 + bob);
  ctx.stroke();
  // Vine/ivy wrap
  ctx.strokeStyle = '#44aa66';
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const vy = 10 - i * 6 + bob * (i > 3 ? 1 : 0);
    const vx = 15 + (i % 2 === 0 ? 2 : -1);
    ctx.beginPath();
    ctx.arc(vx, vy, 2, 0, Math.PI);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Staff head - crescent moon shape
  const gemX = 21, gemY = -32 + bob;
  ctx.fillStyle = '#7a6a38';
  ctx.beginPath();
  ctx.arc(gemX, gemY, 7, -Math.PI * 0.3, Math.PI * 1.3);
  ctx.lineTo(gemX, gemY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a08a50';
  ctx.beginPath();
  ctx.arc(gemX + 2, gemY - 1, 5, 0, Math.PI * 2);
  ctx.fill();

  // Gem with glow (violet crystal)
  ctx.shadowColor = '#cc66ff';
  ctx.shadowBlur = 18;
  const gemGrad = ctx.createRadialGradient(gemX, gemY, 0, gemX, gemY, 5);
  gemGrad.addColorStop(0, '#ee99ff');
  gemGrad.addColorStop(0.4, '#cc44ff');
  gemGrad.addColorStop(1, '#6a1e8a');
  ctx.fillStyle = gemGrad;
  ctx.beginPath();
  ctx.arc(gemX, gemY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Gem inner highlight
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(gemX - 1.5, gemY - 1.5, 2, 1.2, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Golden orbiting sparkles (more ethereal)
  for (let i = 0; i < 5; i++) {
    const a = frame * 0.05 + i * (Math.PI * 2 / 5);
    const orbitR = 9 + Math.sin(frame * 0.03 + i * 1.2) * 3;
    const ox = gemX + Math.cos(a) * orbitR;
    const oy = gemY + Math.sin(a) * orbitR;
    const sparkAlpha = 0.25 + Math.sin(frame * 0.1 + i * 1.5) * 0.25;
    ctx.fillStyle = `rgba(255,200,80,${sparkAlpha})`;
    ctx.beginPath();
    ctx.arc(ox, oy, 1 + Math.sin(frame * 0.08 + i) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore(); // staffTilt
  ctx.restore(); // main transform
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
  const bob = Math.sin(frame * 0.1) * 1.5;
  const walk = Math.sin(frame * 0.2);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  const sz = ENEMY_TYPES[type]?.size || 16;
  ctx.ellipse(cx, cy + sz * 0.7, sz * 0.6, sz * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Status effect aura
  if (statusEffects && statusEffects.slow) {
    ctx.shadowColor = '#88ddff';
    ctx.shadowBlur = 12;
  }
  if (statusEffects && statusEffects.burn) {
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 12;
  }

  switch (type) {
    case 'goblin':    _drawGoblin(ctx, cx, cy + bob, frame, walk);    break;
    case 'skeleton':  _drawSkeleton(ctx, cx, cy + bob, frame, walk);  break;
    case 'orc':       _drawOrc(ctx, cx, cy + bob, frame, walk);       break;
    case 'zombie':    _drawZombie(ctx, cx, cy + bob, frame, walk);    break;
    case 'darkelf':   _drawDarkElf(ctx, cx, cy + bob, frame, walk);   break;
    case 'troll':     _drawTroll(ctx, cx, cy + bob, frame, walk);     break;
    case 'vampire':   _drawVampire(ctx, cx, cy + bob, frame, walk);   break;
    case 'demon':     _drawDemon(ctx, cx, cy + bob, frame, walk);     break;
    case 'spider':    _drawSpider(ctx, cx, cy + bob, frame, walk);    break;
    case 'dragon':    _drawDragon(ctx, cx, cy + bob, frame, walk);    break;
    case 'ghost':     _drawGhost(ctx, cx, cy + bob, frame, walk);     break;
    case 'werewolf':  _drawWerewolf(ctx, cx, cy + bob, frame, walk);  break;
    default:          _drawGoblin(ctx, cx, cy + bob, frame, walk);
  }

  ctx.shadowBlur = 0;

  // Health bar with border
  const barW = 32;
  const barH = 5;
  const bx = cx - barW / 2;
  const by = cy - sz - 14;
  const ratio = clamp(hp / maxHp, 0, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
  ctx.fillStyle = '#222';
  ctx.fillRect(bx, by, barW, barH);
  const barColor = ratio > 0.5 ? '#44cc44' : ratio > 0.25 ? '#ffaa00' : '#ee2222';
  ctx.fillStyle = barColor;
  ctx.fillRect(bx, by, barW * ratio, barH);
  // Bar highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(bx, by, barW * ratio, 2);

  ctx.restore();
}

function _drawGoblin(ctx, cx, cy, frame, walk) {
  // Legs with walk
  ctx.fillStyle = '#2a7a2a';
  ctx.fillRect(cx - 5 + walk * 3, cy + 10, 4, 6);
  ctx.fillRect(cx + 1 - walk * 3, cy + 10, 4, 6);
  // Body
  const bodyGrad = ctx.createRadialGradient(cx, cy + 2, 2, cx, cy + 4, 14);
  bodyGrad.addColorStop(0, '#50cc50');
  bodyGrad.addColorStop(1, '#2a7a2a');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Leather vest
  ctx.fillStyle = '#5a3a1a';
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy - 2); ctx.lineTo(cx - 6, cy + 8);
  ctx.lineTo(cx + 6, cy + 8); ctx.lineTo(cx + 7, cy - 2);
  ctx.closePath();
  ctx.fill();
  // Head
  ctx.fillStyle = '#44bb44';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 10, 9, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Big ears
  ctx.fillStyle = '#3a9a3a';
  ctx.beginPath();
  ctx.ellipse(cx - 12, cy - 10, 5, 4, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 12, cy - 10, 5, 4, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Inner ear
  ctx.fillStyle = '#66cc66';
  ctx.beginPath();
  ctx.ellipse(cx - 11, cy - 10, 2.5, 2, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 11, cy - 10, 2.5, 2, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Big hooked nose
  ctx.fillStyle = '#3a9a3a';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 7, 3, 2.5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Glowing eyes
  ctx.fillStyle = '#ffcc00';
  ctx.shadowColor = '#ffcc00';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 11, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 3, cy - 11, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 11, 1, 0, Math.PI * 2);
  ctx.arc(cx + 3, cy - 11, 1, 0, Math.PI * 2);
  ctx.fill();
  // Fangs
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 5); ctx.lineTo(cx - 5, cy - 2); ctx.lineTo(cx - 1, cy - 3);
  ctx.moveTo(cx + 3, cy - 5); ctx.lineTo(cx + 5, cy - 2); ctx.lineTo(cx + 1, cy - 3);
  ctx.fill();
  // Dagger arm (swings with walk)
  ctx.save();
  ctx.translate(cx + 10, cy);
  ctx.rotate(walk * 0.4);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(6, -8);
  ctx.stroke();
  ctx.fillStyle = '#ccc';
  ctx.beginPath();
  ctx.moveTo(6, -8); ctx.lineTo(8, -14); ctx.lineTo(4, -8);
  ctx.fill();
  ctx.restore();
}

function _drawSkeleton(ctx, cx, cy, frame, walk) {
  const bc = '#ddddcc';
  const jerk = Math.sin(frame * 0.3) * 1; // jerky motion
  // Legs with jerky walk
  ctx.strokeStyle = bc;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 8);
  ctx.lineTo(cx - 6 + walk * 4, cy + 16 + jerk);
  ctx.moveTo(cx, cy + 8);
  ctx.lineTo(cx + 6 - walk * 4, cy + 16 - jerk);
  ctx.stroke();
  // Spine
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx, cy + 8);
  ctx.stroke();
  // Ribcage
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 2 + i * 3);
    ctx.quadraticCurveTo(cx, cy - 4 + i * 3, cx + 7, cy - 2 + i * 3);
    ctx.stroke();
  }
  // Arms (sword + shield)
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy); ctx.lineTo(cx - 14 - walk * 3, cy - 4);
  ctx.moveTo(cx + 9, cy); ctx.lineTo(cx + 14 + walk * 3, cy - 4);
  ctx.stroke();
  // Shield (left hand)
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.ellipse(cx - 16 - walk * 3, cy - 5, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Sword (right hand)
  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 14 + walk * 3, cy - 4);
  ctx.lineTo(cx + 18 + walk * 3, cy - 16);
  ctx.stroke();
  // Skull
  ctx.fillStyle = bc;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 12, 9, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye sockets with glow
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.ellipse(cx - 3, cy - 13, 3, 3.5, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 3, cy - 13, 3, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6688ff';
  ctx.shadowColor = '#6688ff';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 13, 1.5, 0, Math.PI * 2);
  ctx.arc(cx + 3, cy - 13, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Jaw (slightly open)
  ctx.fillStyle = bc;
  ctx.fillRect(cx - 6, cy - 5, 12, 4);
  ctx.fillStyle = '#222';
  for (let i = -2; i <= 2; i++) {
    ctx.fillRect(cx + i * 4 - 1, cy - 5, 2, 2);
  }
}

function _drawOrc(ctx, cx, cy, frame, walk) {
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
  // Arms with swing
  ctx.fillStyle = '#2a7a2a';
  ctx.fillRect(cx - 18, cy - 6 + walk * 3, 8, 14);
  ctx.fillRect(cx + 10, cy - 6 - walk * 3, 8, 14);
  // War paint
  ctx.strokeStyle = '#cc2200';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 15); ctx.lineTo(cx - 2, cy - 8);
  ctx.moveTo(cx + 2, cy - 8); ctx.lineTo(cx + 6, cy - 15);
  ctx.stroke();
  // Club
  ctx.fillStyle = '#4a2a10';
  ctx.save();
  ctx.translate(cx + 14, cy - 6 - walk * 3);
  ctx.rotate(-0.3 + walk * 0.2);
  ctx.fillRect(-3, -16, 6, 16);
  ctx.fillStyle = '#3a1a08';
  ctx.beginPath();
  ctx.ellipse(0, -18, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function _drawZombie(ctx, cx, cy, frame, walk) {
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
  // Shambling outstretched arms
  ctx.strokeStyle = '#557755';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 2);
  ctx.lineTo(cx - 22 + walk * 2, cy - 8 + walk * 2);
  ctx.moveTo(cx + 10, cy - 2);
  ctx.lineTo(cx + 22 - walk * 2, cy - 8 - walk * 2);
  ctx.stroke();
  // Tattered cloth
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 6); ctx.lineTo(cx - 10, cy + 12);
  ctx.moveTo(cx + 4, cy + 8); ctx.lineTo(cx + 6, cy + 14);
  ctx.stroke();
}

function _drawDarkElf(ctx, cx, cy, frame, walk) {
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
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx - 2.5, cy - 13, 2, 0, Math.PI * 2);
  ctx.arc(cx + 2.5, cy - 13, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // White hair
  ctx.fillStyle = '#ddd';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 18, 7, 4, 0, Math.PI, 0);
  ctx.fill();
  // Staff with energy
  ctx.strokeStyle = '#3a1a5c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy + 6); ctx.lineTo(cx + 14, cy - 14);
  ctx.stroke();
  ctx.fillStyle = '#cc44ff';
  ctx.shadowColor = '#cc44ff';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cx + 14, cy - 16, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function _drawTroll(ctx, cx, cy, frame, walk) {
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

function _drawVampire(ctx, cx, cy, frame, walk) {
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

function _drawDemon(ctx, cx, cy, frame, walk) {
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

function _drawSpider(ctx, cx, cy, frame, walk) {
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
  // Animated legs (alternating pairs)
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const yOff = cy - 4 + i * 4;
    const legAnim = Math.sin(frame * 0.3 + i * 1.2) * 4;
    ctx.beginPath();
    ctx.moveTo(cx - 8, yOff);
    ctx.lineTo(cx - 18 - i, yOff - 4 + legAnim);
    ctx.lineTo(cx - 24 - i * 2, yOff + 4 + legAnim);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 8, yOff);
    ctx.lineTo(cx + 18 + i, yOff - 4 - legAnim);
    ctx.lineTo(cx + 24 + i * 2, yOff + 4 - legAnim);
    ctx.stroke();
  }
  // Mandibles
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 3); ctx.lineTo(cx - 7, cy + 2);
  ctx.moveTo(cx + 4, cy - 3); ctx.lineTo(cx + 7, cy + 2);
  ctx.stroke();
}

function _drawDragon(ctx, cx, cy, frame, walk) {
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

function _drawGhost(ctx, cx, cy, frame, walk) {
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

function _drawWerewolf(ctx, cx, cy, frame, walk) {
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
  const h = _tileHash(px, py);
  const theme = dungeonConfig.theme;

  ctx.fillStyle = dungeonConfig.floorColor;
  ctx.fillRect(px, py, TILE, TILE);

  if (theme === 'crypt') {
    // Stone brick pattern (2x2 bricks)
    const hx = TILE / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    // Horizontal mortar
    ctx.beginPath();
    ctx.moveTo(px, py + hx); ctx.lineTo(px + TILE, py + hx);
    ctx.stroke();
    // Vertical mortar (offset per row)
    const off = (h & 1) ? hx / 2 : 0;
    ctx.beginPath();
    ctx.moveTo(px + hx + off, py); ctx.lineTo(px + hx + off, py + hx);
    ctx.moveTo(px + off, py + hx); ctx.lineTo(px + off, py + TILE);
    ctx.stroke();
    // Random cracks on ~15% of tiles
    if ((h & 0xF) < 2) {
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(px + 8 + (h >> 4 & 7), py + 4 + (h >> 7 & 7));
      ctx.lineTo(px + 18 + (h >> 10 & 7), py + 20 + (h >> 13 & 5));
      ctx.stroke();
    }
    // Moss patches on ~10% of tiles
    if ((h & 0x1F) < 3) {
      ctx.fillStyle = 'rgba(40,80,30,0.15)';
      ctx.beginPath();
      ctx.arc(px + 10 + (h >> 5 & 15), py + 10 + (h >> 9 & 15), 4 + (h >> 13 & 3), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme === 'stronghold') {
    // Wooden planks or packed dirt
    if ((h & 3) < 3) {
      // Wood planks
      ctx.strokeStyle = 'rgba(100,70,30,0.15)';
      ctx.lineWidth = 0.7;
      for (let i = 0; i < 4; i++) {
        const y = py + 2 + i * 8 + (h >> (i * 2) & 1);
        ctx.beginPath();
        ctx.moveTo(px, y); ctx.lineTo(px + TILE, y);
        ctx.stroke();
      }
      // Wood grain
      ctx.strokeStyle = 'rgba(80,50,20,0.08)';
      const gy = py + (h >> 4 & 15);
      ctx.beginPath();
      ctx.moveTo(px, gy); ctx.lineTo(px + TILE, gy + 2);
      ctx.stroke();
    } else {
      // Dirt (speckled)
      ctx.fillStyle = 'rgba(60,40,20,0.1)';
      for (let i = 0; i < 5; i++) {
        const dx = px + ((h >> (i * 3)) & 31);
        const dy = py + ((h >> (i * 3 + 1)) & 31);
        ctx.fillRect(dx, dy, 1.5, 1.5);
      }
    }
  } else if (theme === 'infernal') {
    // Obsidian with lava cracks
    ctx.fillStyle = 'rgba(20,5,5,0.3)';
    ctx.fillRect(px, py, TILE, TILE);
    // Lava cracks on ~30% of tiles
    if ((h & 7) < 3) {
      ctx.strokeStyle = `rgba(255,${80 + (h >> 3 & 60)},0,0.4)`;
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 4;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px + (h >> 3 & 15), py + (h >> 7 & 15));
      ctx.lineTo(px + 16 + (h >> 11 & 15), py + 16 + (h >> 15 & 15));
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // Ember dots
    if ((h & 0xF) < 2) {
      ctx.fillStyle = 'rgba(255,100,0,0.3)';
      ctx.beginPath();
      ctx.arc(px + 10 + (h >> 4 & 12), py + 10 + (h >> 8 & 12), 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Default grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
  }
}

function drawWallTile(ctx, px, py, dungeonConfig, isTopEdge) {
  const h = _tileHash(px, py);
  const theme = dungeonConfig.theme;

  ctx.fillStyle = dungeonConfig.wallColor;
  ctx.fillRect(px, py, TILE, TILE);

  if (theme === 'crypt') {
    // Rough stone blocks with mortar
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + 10); ctx.lineTo(px + TILE, py + 10);
    ctx.moveTo(px, py + 22); ctx.lineTo(px + TILE, py + 22);
    ctx.moveTo(px + 16, py); ctx.lineTo(px + 16, py + 10);
    ctx.moveTo(px + 8, py + 10); ctx.lineTo(px + 8, py + 22);
    ctx.moveTo(px + 24, py + 22); ctx.lineTo(px + 24, py + TILE);
    ctx.stroke();
    if (isTopEdge) {
      ctx.fillStyle = dungeonConfig.wallTopColor;
      ctx.fillRect(px, py, TILE, 10);
      // Carved stone cap
      ctx.fillStyle = dungeonConfig.accentColor;
      ctx.fillRect(px, py + 8, TILE, 2);
    }
    // Rare skull detail
    if ((h & 0x3F) < 2) {
      ctx.fillStyle = 'rgba(200,200,180,0.1)';
      ctx.beginPath();
      ctx.arc(px + 16, py + 16, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(px + 14, py + 15, 1, 0, Math.PI * 2);
      ctx.arc(px + 18, py + 15, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme === 'stronghold') {
    // Stone with iron bands
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
    // Iron horizontal bands
    ctx.fillStyle = 'rgba(80,80,90,0.3)';
    ctx.fillRect(px, py + 8, TILE, 2);
    ctx.fillRect(px, py + 22, TILE, 2);
    if (isTopEdge) {
      ctx.fillStyle = dungeonConfig.wallTopColor;
      ctx.fillRect(px, py, TILE, 10);
      // Battlements
      ctx.fillStyle = dungeonConfig.accentColor;
      ctx.fillRect(px, py + 8, TILE, 3);
    }
    // Iron rivets
    if ((h & 7) < 2) {
      ctx.fillStyle = 'rgba(120,120,130,0.3)';
      ctx.beginPath();
      ctx.arc(px + 8 + (h >> 3 & 15), py + 16, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme === 'infernal') {
    // Blackened obsidian with glowing veins
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
    // Red/orange veins
    if ((h & 3) < 2) {
      ctx.strokeStyle = 'rgba(200,50,0,0.25)';
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + (h >> 2 & 15), py + (h >> 6 & 15));
      ctx.lineTo(px + 20 + (h >> 10 & 10), py + 20 + (h >> 14 & 10));
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    if (isTopEdge) {
      ctx.fillStyle = dungeonConfig.wallTopColor;
      ctx.fillRect(px, py, TILE, 10);
      // Jagged fire glow
      ctx.fillStyle = 'rgba(255,60,0,0.15)';
      ctx.fillRect(px, py + 7, TILE, 4);
    }
  } else {
    if (isTopEdge) {
      ctx.fillStyle = dungeonConfig.wallTopColor;
      ctx.fillRect(px, py, TILE, 10);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
  }
}

function drawStairTile(ctx, px, py) {
  ctx.fillStyle = '#2a1a4a';
  ctx.fillRect(px, py, TILE, TILE);
  // Animated swirling portal
  const cx2 = px + TILE / 2;
  const cy2 = py + TILE / 2;
  const t = Date.now() * 0.002;

  // Outer glow rings (rotating)
  ctx.save();
  ctx.shadowColor = '#aa88ff';
  ctx.shadowBlur = 18;
  for (let i = 0; i < 3; i++) {
    const r = 13 - i * 3;
    const a = t + i * 2;
    ctx.strokeStyle = `rgba(170,136,255,${0.2 + i * 0.1})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx2, cy2, r, a, a + Math.PI * 1.4);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Core gradient
  const grad = ctx.createRadialGradient(cx2, cy2, 1, cx2, cy2, 12);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, '#cc99ff');
  grad.addColorStop(0.6, '#7744cc');
  grad.addColorStop(1, '#220044');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx2, cy2, 11, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting dots
  for (let i = 0; i < 4; i++) {
    const a = t * 1.5 + i * (Math.PI / 2);
    const ox = cx2 + Math.cos(a) * 8;
    const oy = cy2 + Math.sin(a) * 8;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(ox, oy, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Down arrow
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.moveTo(cx2, cy2 + 5);
  ctx.lineTo(cx2 - 4, cy2 - 1);
  ctx.lineTo(cx2 + 4, cy2 - 1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ── Projectile visuals ────────────────────────────────────────────────────────

function drawFireball(ctx, x, y, r, frame) {
  const flicker = 0.85 + Math.sin(frame * 0.4) * 0.15;
  ctx.save();
  // Outer glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3 * flicker);
  glow.addColorStop(0, 'rgba(255,200,50,0.4)');
  glow.addColorStop(1, 'rgba(255,60,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 3 * flicker, 0, Math.PI * 2);
  ctx.fill();
  // Core
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8 * flicker);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.25, '#ffee44');
  grad.addColorStop(0.5, '#ff6600');
  grad.addColorStop(0.8, '#cc2200');
  grad.addColorStop(1, 'rgba(200,30,0,0)');
  ctx.fillStyle = grad;
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.8 * flicker, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Trailing embers
  for (let i = 0; i < 3; i++) {
    const a = frame * 0.15 + i * 2;
    const ex = x - Math.cos(a) * (r + i * 4);
    const ey = y - Math.sin(a) * (r + i * 3);
    ctx.fillStyle = `rgba(255,${150 - i * 40},0,${0.5 - i * 0.15})`;
    ctx.beginPath();
    ctx.arc(ex, ey, 1.5 - i * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawIceShard(ctx, x, y, r, angle, frame) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + frame * 0.12);
  ctx.shadowColor = '#88ddff';
  ctx.shadowBlur = 18;
  // Outer glow
  ctx.fillStyle = 'rgba(136,221,255,0.15)';
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
  ctx.fill();
  // 6-point star crystal
  ctx.fillStyle = '#aaeeff';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pr = (i % 2 === 0) ? r * 2 : r * 0.8;
    const method = i === 0 ? 'moveTo' : 'lineTo';
    ctx[method](Math.cos(a) * pr, Math.sin(a) * pr);
  }
  ctx.closePath();
  ctx.fill();
  // Inner refraction
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.5);
  ctx.lineTo(r * 0.3, 0);
  ctx.lineTo(0, r * 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawLightning(ctx, x, y, r, frame) {
  ctx.save();
  ctx.shadowColor = '#aaaaff';
  ctx.shadowBlur = 22;
  // Multiple branching bolts
  for (let b = 0; b < 3; b++) {
    ctx.strokeStyle = b === 0 ? '#ffffff' : 'rgba(170,170,255,0.5)';
    ctx.lineWidth = b === 0 ? 2.5 : 1;
    ctx.beginPath();
    const segments = 6;
    for (let i = 0; i <= segments; i++) {
      const progress = i / segments;
      const jitter = (Math.random() - 0.5) * r * (b === 0 ? 1 : 1.5);
      const jy = (Math.random() - 0.5) * r * (b === 0 ? 1 : 1.5);
      const px = x - r + progress * r * 2 + jitter;
      const py = y + jy;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // Pulsing ball
  const pulse = 1 + Math.sin(frame * 0.5) * 0.3;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8 * pulse);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, '#ccccff');
  grad.addColorStop(0.6, '#6666ff');
  grad.addColorStop(1, 'rgba(80,80,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.8 * pulse, 0, Math.PI * 2);
  ctx.fill();
  // Spark particles
  for (let i = 0; i < 3; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = r + Math.random() * r;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
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
