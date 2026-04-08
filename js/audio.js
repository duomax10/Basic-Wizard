'use strict';

/**
 * AudioManager — Procedural audio system for a browser dungeon crawler.
 * All sounds synthesized at runtime via Web Audio API. No external files.
 * Usage: audio.init(); audio.playSpellCast('fireball'); audio.startMusic('crypt');
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this._initialized = false;
        // Music state
        this._musicTimers = [];
        this._musicOscillators = [];
        this._musicSources = [];
        this._currentTheme = null;
        this._musicLoopRunning = false;
    }

    /** Create AudioContext and gain routing. Idempotent and safe to call early. */
    init() {
        if (this._initialized) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return; // no Web Audio — every public method will silently no-op
        try {
            this.ctx = new AC();
            // Master → destination
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 1.0;
            this.masterGain.connect(this.ctx.destination);
            // Music bus (default 0.25)
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.25;
            this.musicGain.connect(this.masterGain);
            // SFX bus (default 0.5)
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(this.masterGain);
            this._initialized = true;
        } catch (_) { /* silently ignore — methods will no-op */ }
    }

    /** Set music volume (0-1). */
    setMusicVolume(v) {
        if (this._initialized) this.musicGain.gain.value = Math.max(0, Math.min(1, v));
    }
    /** Set SFX volume (0-1). */
    setSFXVolume(v) {
        if (this._initialized) this.sfxGain.gain.value = Math.max(0, Math.min(1, v));
    }

    // ========================== PRIVATE HELPERS ==========================

    /** Play a simple oscillator tone through the SFX bus. */
    _playTone(freq, duration, type = 'sine', gain = 0.3, fadeOut = true) {
        if (!this._initialized) return null;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(gain, now);
        if (fadeOut) g.gain.linearRampToValueAtTime(0, now + duration);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + duration);
        return osc;
    }

    /** Play a burst of filtered noise through the SFX bus. */
    _playNoise(duration, filterFreq = 1000, filterType = 'lowpass', gain = 0.3) {
        if (!this._initialized) return null;
        const now = this.ctx.currentTime;
        const sr = this.ctx.sampleRate;
        const len = Math.max(1, Math.floor(sr * duration));
        const buf = this.ctx.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const flt = this.ctx.createBiquadFilter();
        flt.type = filterType;
        flt.frequency.value = filterFreq;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(gain, now);
        g.gain.linearRampToValueAtTime(0, now + duration);
        src.connect(flt);
        flt.connect(g);
        g.connect(this.sfxGain);
        src.start(now);
        src.stop(now + duration);
        return src;
    }

    /** Schedule a single note at a specific AudioContext time (for music loops). */
    _scheduleNote(freq, startTime, duration, type = 'triangle', gainNode = null) {
        if (!this._initialized) return null;
        const dest = gainNode || this.musicGain;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.18, startTime);
        g.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.connect(g);
        g.connect(dest);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);
        this._musicOscillators.push(osc);
        return osc;
    }

    // ========================== SOUND EFFECTS ==========================

    /** Play a spell-cast sound — varies per spell ('fireball'|'ice'|'lightning'). */
    playSpellCast(spellKey) {
        if (!this._initialized) return;
        switch (spellKey) {
            case 'fireball':  this._sfxFireball();  break;
            case 'ice':       this._sfxIce();       break;
            case 'lightning': this._sfxLightning(); break;
            default:          this._sfxFireball();  break;
        }
    }

    /** Fireball — rising whoosh with crackle (noise + bandpass sweep 200-2000Hz, 0.3s). */
    _sfxFireball() {
        const now = this.ctx.currentTime;
        const sr = this.ctx.sampleRate;
        const len = Math.floor(sr * 0.3);
        const buf = this.ctx.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 2;
        bp.frequency.setValueAtTime(200, now);
        bp.frequency.exponentialRampToValueAtTime(2000, now + 0.3);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.4, now);
        g.gain.linearRampToValueAtTime(0, now + 0.3);
        src.connect(bp);
        bp.connect(g);
        g.connect(this.sfxGain);
        src.start(now);
        src.stop(now + 0.3);
    }

    /** Ice — crystalline shimmer (high osc with fast vibrato + noise sparkle, 0.25s). */
    _sfxIce() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 2400;
        // Fast vibrato via LFO modulating frequency
        const vib = this.ctx.createOscillator();
        const vibG = this.ctx.createGain();
        vib.frequency.value = 30;
        vibG.gain.value = 80;
        vib.connect(vibG);
        vibG.connect(osc.frequency);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.25, now);
        g.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(now);
        vib.start(now);
        osc.stop(now + 0.25);
        vib.stop(now + 0.25);
        this._playNoise(0.12, 5000, 'highpass', 0.15); // short sparkle
    }

    /** Lightning — sharp electric zap (white noise burst at 3kHz + sine pop, 0.15s). */
    _sfxLightning() {
        const now = this.ctx.currentTime;
        this._playNoise(0.15, 3000, 'bandpass', 0.5);
        // Sine pop
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 120;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.35, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    /** Enemy takes damage — short thud (low sine 80Hz + noise pop, 0.1s). */
    playHit() {
        if (!this._initialized) return;
        this._playTone(80, 0.1, 'sine', 0.4, true);
        this._playNoise(0.06, 600, 'lowpass', 0.25);
    }

    /** Satisfying enemy death — descending sweep 400-60Hz with noise burst, 0.4s. */
    playEnemyDeath() {
        if (!this._initialized) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.3, now);
        g.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.4);
        this._playNoise(0.25, 800, 'lowpass', 0.3);
    }

    /** Player takes damage — harsh dissonant two-tone (200Hz + 233Hz) with noise, 0.2s. */
    playPlayerDamage() {
        if (!this._initialized) return;
        this._playTone(200, 0.2, 'square', 0.2, true);
        this._playTone(233, 0.2, 'square', 0.2, true);
        this._playNoise(0.12, 1200, 'bandpass', 0.2);
    }

    /** Celebratory rising arpeggio C5-E5-G5-C6 with triangle waves, 0.12s each. */
    playLevelUp() {
        if (!this._initialized) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const dur = 0.12;
        const now = this.ctx.currentTime;
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const g = this.ctx.createGain();
            const t = now + i * dur;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.3, t + 0.01);
            g.gain.linearRampToValueAtTime(0, t + dur);
            osc.connect(g);
            g.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + dur + 0.01);
        });
    }

    /** Magical shimmer — ascending sine sweep 200-800Hz with delay reverb, 0.6s. */
    playPortal() {
        if (!this._initialized) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.6);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.25, now);
        g.gain.linearRampToValueAtTime(0, now + 0.6);
        // Delay-based reverb effect
        const delay = this.ctx.createDelay(0.5);
        delay.delayTime.value = 0.15;
        const fb = this.ctx.createGain();
        fb.gain.value = 0.35;
        osc.connect(g);
        g.connect(this.sfxGain);       // dry signal
        g.connect(delay);              // into delay
        delay.connect(fb);
        fb.connect(delay);             // feedback loop
        delay.connect(this.sfxGain);   // wet signal
        osc.start(now);
        osc.stop(now + 0.6);
        this._playTone(600, 0.45, 'triangle', 0.08, true); // shimmer layer
    }

    /** UI button click — very short sine pop at 800Hz, 0.05s. */
    playUIClick() {
        if (!this._initialized) return;
        this._playTone(800, 0.05, 'sine', 0.2, true);
    }

    /** Subtle footstep — very quiet noise burst with lowpass 400Hz, 0.05s. */
    playFootstep() {
        if (!this._initialized) return;
        this._playNoise(0.05, 400, 'lowpass', 0.08);
    }

    // ========================== MUSIC SYSTEM ==========================

    /** Start a themed looping music track ('crypt'|'stronghold'|'infernal'). */
    startMusic(theme) {
        if (!this._initialized) return;
        if (this._currentTheme) this.stopMusic(0);
        this._currentTheme = theme;
        this._musicLoopRunning = true;
        switch (theme) {
            case 'crypt':      this._musicCrypt();      break;
            case 'stronghold': this._musicStronghold(); break;
            case 'infernal':   this._musicInfernal();   break;
            default:           this._musicCrypt();       break;
        }
    }

    /** Stop current music with optional fade-out (default 1s). */
    stopMusic(fade = 1) {
        if (!this._initialized) return;
        this._musicLoopRunning = false;
        this._currentTheme = null;
        this._musicTimers.forEach(id => clearTimeout(id));
        this._musicTimers = [];
        if (fade > 0 && this.musicGain) {
            const now = this.ctx.currentTime;
            const vol = this.musicGain.gain.value;
            this.musicGain.gain.setValueAtTime(vol, now);
            this.musicGain.gain.linearRampToValueAtTime(0, now + fade);
            setTimeout(() => {
                this._stopMusicOscillators();
                if (this.musicGain) this.musicGain.gain.value = vol;
            }, fade * 1000 + 50);
        } else {
            this._stopMusicOscillators();
        }
    }

    /** Stop all active music oscillators and buffer sources. */
    _stopMusicOscillators() {
        this._musicOscillators.forEach(o => { try { o.stop(); } catch (_) {} });
        this._musicOscillators = [];
        this._musicSources.forEach(s => { try { s.stop(); } catch (_) {} });
        this._musicSources = [];
    }

    // --- Crypt theme (D minor, ~60 BPM) ---
    _musicCrypt() {
        this._startDrone(73.42, 'sine', 0.15);       // D2 bass drone
        this._startAmbientNoise(300, 0.04);           // quiet filtered noise
        // Melody: D4 F4 A4 G4 F4 E4 D4 (triangle, 0.5s each)
        const melody = [293.66, 349.23, 440.00, 392.00, 349.23, 329.63, 293.66];
        const nd = 0.5;
        const loop = () => {
            if (!this._musicLoopRunning) return;
            const now = this.ctx.currentTime;
            melody.forEach((f, i) => {
                this._scheduleNote(f, now + i * nd, nd * 0.85, 'triangle', this.musicGain);
            });
            this._musicTimers.push(setTimeout(loop, melody.length * nd * 1000));
        };
        loop();
    }

    // --- Stronghold theme (A minor, ~80 BPM) ---
    _musicStronghold() {
        const beat = 0.75;
        this._startDrone(55, 'sawtooth', 0.1);        // A1 bass
        this._startDrone(82.41, 'sawtooth', 0.08);     // E2 power-chord fifth
        // War-drum pulse (~1.3Hz oscillator bursts)
        const drum = () => {
            if (!this._musicLoopRunning) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 55;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.2, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(g);
            g.connect(this.musicGain);
            osc.start(now);
            osc.stop(now + 0.15);
            this._musicOscillators.push(osc);
            this._musicTimers.push(setTimeout(drum, 770));
        };
        drum();
        // Melody: A3 C4 E4 A4 G4 E4 C4 A3 (square)
        const melody = [220.00, 261.63, 329.63, 440.00, 392.00, 329.63, 261.63, 220.00];
        const loop = () => {
            if (!this._musicLoopRunning) return;
            const now = this.ctx.currentTime;
            melody.forEach((f, i) => {
                this._scheduleNote(f, now + i * beat, beat * 0.8, 'square', this.musicGain);
            });
            this._musicTimers.push(setTimeout(loop, melody.length * beat * 1000));
        };
        loop();
    }

    // --- Infernal theme (E minor, ~100 BPM) ---
    _musicInfernal() {
        const beat = 0.6;
        // Detuned E2 drones for ominous beating effect
        this._startDrone(82.41, 'sawtooth', 0.12);
        this._startDrone(82.41 * 1.005, 'sawtooth', 0.12);
        this._startAmbientNoise(120, 0.05);            // low rumble
        // Random crackling noise bursts
        const crackle = () => {
            if (!this._musicLoopRunning) return;
            this._playMusicNoise(
                0.02 + Math.random() * 0.04,
                1500 + Math.random() * 3000, 'bandpass', 0.06
            );
            this._musicTimers.push(setTimeout(crackle, 200 + Math.random() * 400));
        };
        crackle();
        // Melody: E4 G4 B4 D5 C5 B4 A4 G4 (sawtooth through lowpass)
        const melody = [329.63, 392.00, 493.88, 587.33, 523.25, 493.88, 440.00, 392.00];
        const loop = () => {
            if (!this._musicLoopRunning) return;
            const now = this.ctx.currentTime;
            melody.forEach((f, i) => {
                const t = now + i * beat;
                const osc = this.ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = f;
                const lp = this.ctx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.value = 1200;
                const g = this.ctx.createGain();
                g.gain.setValueAtTime(0.14, t);
                g.gain.linearRampToValueAtTime(0, t + beat * 0.85);
                osc.connect(lp);
                lp.connect(g);
                g.connect(this.musicGain);
                osc.start(t);
                osc.stop(t + beat + 0.01);
                this._musicOscillators.push(osc);
            });
            this._musicTimers.push(setTimeout(loop, melody.length * beat * 1000));
        };
        loop();
    }

    // ========================== MUSIC HELPERS ==========================

    /** Start a continuous drone oscillator routed to the music bus. */
    _startDrone(freq, type = 'sine', gain = 0.12) {
        if (!this._initialized) return;
        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        const g = this.ctx.createGain();
        g.gain.value = gain;
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start();
        this._musicOscillators.push(osc);
    }

    /** Start looping filtered noise routed to the music bus (2s buffer). */
    _startAmbientNoise(filterFreq, gain) {
        if (!this._initialized) return;
        const sr = this.ctx.sampleRate;
        const len = sr * 2;
        const buf = this.ctx.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = filterFreq;
        const g = this.ctx.createGain();
        g.gain.value = gain;
        src.connect(lp);
        lp.connect(g);
        g.connect(this.musicGain);
        src.start();
        this._musicSources.push(src);
    }

    /** Play a short noise burst through the music bus (for crackle effects). */
    _playMusicNoise(duration, filterFreq, filterType, gain) {
        if (!this._initialized) return;
        const now = this.ctx.currentTime;
        const sr = this.ctx.sampleRate;
        const len = Math.max(1, Math.floor(sr * duration));
        const buf = this.ctx.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const flt = this.ctx.createBiquadFilter();
        flt.type = filterType;
        flt.frequency.value = filterFreq;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(gain, now);
        g.gain.linearRampToValueAtTime(0, now + duration);
        src.connect(flt);
        flt.connect(g);
        g.connect(this.musicGain);
        src.start(now);
        src.stop(now + duration);
        this._musicSources.push(src);
    }
}
// Global singleton
const audio = new AudioManager();
