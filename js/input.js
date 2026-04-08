'use strict';

// ─── Input manager (keyboard + touch) ────────────────────────────────────────

class Input {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false };
    // Touch joystick state
    this.joystick = { active: false, startX: 0, startY: 0, dx: 0, dy: 0 };
    this._touchIds = {};  // map touchId -> 'joystick' | 'action'
    this.actionTapped = false;
    this.spellSwitchTapped = false;
    this._bound = false;
  }

  bind(canvas) {
    if (this._bound) return;
    this._bound = true;

    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      e.preventDefault();
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });

    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', e => {
      this.mouse.down = true;
      this.actionTapped = true;
    });
    canvas.addEventListener('mouseup', () => { this.mouse.down = false; });

    // Touch
    canvas.addEventListener('touchstart', e => this._onTouchStart(e, canvas), { passive: false });
    canvas.addEventListener('touchmove',  e => this._onTouchMove(e, canvas),  { passive: false });
    canvas.addEventListener('touchend',   e => this._onTouchEnd(e),           { passive: false });
    canvas.addEventListener('touchcancel',e => this._onTouchEnd(e),           { passive: false });
  }

  _onTouchStart(e, canvas) {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / r.width;
    const scaleY = canvas.height / r.height;
    for (const t of e.changedTouches) {
      const cx = (t.clientX - r.left) * scaleX;
      const cy = (t.clientY - r.top)  * scaleY;
      if (cx < canvas.width * 0.45) {
        // Left side → joystick
        this._touchIds[t.identifier] = 'joystick';
        this.joystick.active = true;
        this.joystick.startX = cx;
        this.joystick.startY = cy;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
      } else {
        // Right side → action
        this._touchIds[t.identifier] = 'action';
        this.actionTapped = true;
        // Record target for direction
        this.mouse.x = cx;
        this.mouse.y = cy;
      }
    }
  }

  _onTouchMove(e, canvas) {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / r.width;
    const scaleY = canvas.height / r.height;
    for (const t of e.changedTouches) {
      if (this._touchIds[t.identifier] === 'joystick') {
        const cx = (t.clientX - r.left) * scaleX;
        const cy = (t.clientY - r.top)  * scaleY;
        const rawDx = cx - this.joystick.startX;
        const rawDy = cy - this.joystick.startY;
        const len = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
        const maxR = 60;
        if (len > 0) {
          const norm = Math.min(len, maxR) / maxR;
          this.joystick.dx = (rawDx / len) * norm;
          this.joystick.dy = (rawDy / len) * norm;
        }
      } else if (this._touchIds[t.identifier] === 'action') {
        this.mouse.x = (t.clientX - r.left) * scaleX;
        this.mouse.y = (t.clientY - r.top)  * scaleY;
      }
    }
  }

  _onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (this._touchIds[t.identifier] === 'joystick') {
        this.joystick.active = false;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
      }
      delete this._touchIds[t.identifier];
    }
  }

  /** Returns normalised {x,y} movement in [-1,1] */
  getMovement() {
    // Keyboard
    let x = 0, y = 0;
    if (this.keys['ArrowLeft']  || this.keys['KeyA']) x -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) x += 1;
    if (this.keys['ArrowUp']    || this.keys['KeyW']) y -= 1;
    if (this.keys['ArrowDown']  || this.keys['KeyS']) y += 1;

    // Touch joystick (only if keyboard is silent)
    if (x === 0 && y === 0 && this.joystick.active) {
      x = this.joystick.dx;
      y = this.joystick.dy;
    }

    // Normalise keyboard diagonals
    const len = Math.sqrt(x * x + y * y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }

  /** Consume and return the action-tap flag */
  consumeAction() {
    if (this.actionTapped || this.keys['Space'] || this.keys['KeyF']) {
      this.actionTapped = false;
      return true;
    }
    return false;
  }

  /** Call once per frame to clear one-shot flags */
  endFrame() {
    this.actionTapped = false;
    this.spellSwitchTapped = false;
  }
}
