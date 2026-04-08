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
            this.sfxGain.gain.value = 0.125;
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

    // --- Crypt theme (D minor, slow ambient) ---
    _musicCrypt() {
        this._startDrone(73.42, 'sine', 0.06);        // very quiet D2 drone
        this._startAmbientNoise(200, 0.025);           // whisper of wind
        // Long melody with rests (0 = silence). Slow, sparse, eerie.
        // D4  .  F4  .  .  A3  .  G4  .  .  D4  .  E4  F4  .  .  D4  .  .  A3  .  .  .  .
        const melody = [
            293.66, 0, 349.23, 0, 0, 220.00, 0, 392.00, 0, 0,
            293.66, 0, 329.63, 349.23, 0, 0, 293.66, 0, 0, 220.00,
            0, 0, 0, 0
        ];
        const nd = 0.9; // slow notes
        this._playFilteredMelody(melody, nd, 'sine', 600, 0.08);
    }

    // --- Stronghold theme (A minor, brooding) ---
    _musicStronghold() {
        this._startDrone(55, 'sine', 0.05);            // quiet A1 bass
        this._startAmbientNoise(150, 0.02);            // low rumble
        // Slow war-drum pulse
        const drum = () => {
            if (!this._musicLoopRunning) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 50;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.1, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(g);
            g.connect(this.musicGain);
            osc.start(now);
            osc.stop(now + 0.2);
            this._musicOscillators.push(osc);
            this._musicTimers.push(setTimeout(drum, 1800 + Math.random() * 400));
        };
        drum();
        // Long melody with rests. Darker, more deliberate.
        // A3  .  .  C4  .  E4  .  .  .  A3  .  G3  .  .  A3  .  C4  .  .  .  E3  .  .  .
        const melody = [
            220.00, 0, 0, 261.63, 0, 329.63, 0, 0, 0, 220.00,
            0, 196.00, 0, 0, 220.00, 0, 261.63, 0, 0, 0,
            164.81, 0, 0, 0
        ];
        const nd = 0.8;
        this._playFilteredMelody(melody, nd, 'triangle', 800, 0.07);
    }

    // --- Infernal theme (E minor, ominous) ---
    _musicInfernal() {
        // Detuned low drones — quiet, ominous beating
        this._startDrone(82.41, 'sine', 0.05);
        this._startDrone(82.41 * 1.003, 'sine', 0.05);
        this._startAmbientNoise(100, 0.03);            // deep rumble
        // Slow crackling (less frequent)
        const crackle = () => {
            if (!this._musicLoopRunning) return;
            this._playMusicNoise(
                0.02 + Math.random() * 0.03,
                2000 + Math.random() * 2000, 'bandpass', 0.03
            );
            this._musicTimers.push(setTimeout(crackle, 600 + Math.random() * 1200));
        };
        crackle();
        // Long melody with rests. Descending, foreboding.
        // E4  .  .  G4  .  .  B3  .  .  .  E4  .  D4  .  .  C4  .  .  B3  .  .  A3  .  .  .  .  .  .  .  .
        const melody = [
            329.63, 0, 0, 392.00, 0, 0, 246.94, 0, 0, 0,
            329.63, 0, 293.66, 0, 0, 261.63, 0, 0, 246.94, 0,
            0, 220.00, 0, 0, 0, 0, 0, 0, 0, 0
        ];
        const nd = 0.7;
        this._playFilteredMelody(melody, nd, 'sine', 500, 0.06);
    }

    /**
     * Shared melody player: plays notes through a lowpass filter with
     * smooth attack/release envelopes. Skips 0-freq entries as rests.
     */
    _playFilteredMelody(melody, noteDur, oscType, filterFreq, vol) {
        const loop = () => {
            if (!this._musicLoopRunning) return;
            const now = this.ctx.currentTime;
            melody.forEach((f, i) => {
                if (f === 0) return; // rest
                const t = now + i * noteDur;
                const osc = this.ctx.createOscillator();
                osc.type = oscType;
                osc.frequency.value = f;
                const lp = this.ctx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.value = filterFreq;
                lp.Q.value = 0.7;
                const g = this.ctx.createGain();
                // Smooth attack + long release
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(vol, t + 0.08);
                g.gain.linearRampToValueAtTime(vol * 0.7, t + noteDur * 0.5);
                g.gain.linearRampToValueAtTime(0, t + noteDur * 0.95);
                osc.connect(lp);
                lp.connect(g);
                g.connect(this.musicGain);
                osc.start(t);
                osc.stop(t + noteDur + 0.01);
                this._musicOscillators.push(osc);
            });
            this._musicTimers.push(setTimeout(loop, melody.length * noteDur * 1000));
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
