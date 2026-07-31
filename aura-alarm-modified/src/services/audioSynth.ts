import { AlarmSoundTone, AmbientNoiseType } from '../types';

class AudioSynthService {
  private ctx: AudioContext | null = null;
  private currentAlarmInterval: number | null = null;
  private currentAmbientNodes: { stop: () => void } | null = null;

  // Storage-file playback
  private storageAudioEl: HTMLAudioElement | null = null;

  // Volume fade-in state
  private fadeStartTime: number | null = null;
  private fadeDurationMs = 60_000;
  private targetVolume = 0.8;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private getFadeMultiplier(): number {
    if (this.fadeStartTime === null) return 1;
    const elapsed = Date.now() - this.fadeStartTime;
    return 0.10 + 0.90 * Math.min(elapsed / this.fadeDurationMs, 1);
  }

  // ── UI sounds ─────────────────────────────────────────────────────────────

  public playUiClick(freq = 800) {
    try {
      const ctx = this.getContext();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  public playSuccessSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + idx * 0.08); osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch {}
  }

  public playErrorSound() {
    try {
      const ctx = this.getContext(); const now = ctx.currentTime;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now); osc.frequency.setValueAtTime(140, now + 0.1);
      gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(now + 0.3);
    } catch {}
  }

  // ── Main alarm synth ──────────────────────────────────────────────────────

  public startAlarmSynth(
    tone: AlarmSoundTone,
    volume = 0.8,
    fadeIn = false,
    storageToneDataUrl?: string
  ): () => void {
    this.stopAlarmSynth();
    this.targetVolume = volume;
    this.fadeStartTime = fadeIn ? Date.now() : null;

    if (tone === 'storage_file' && storageToneDataUrl) {
      return this.startStorageAudioLoop(storageToneDataUrl, volume, fadeIn);
    }

    const ctx = this.getContext();

    const triggerPulse = () => {
      const now = ctx.currentTime;
      const vol = this.targetVolume * this.getFadeMultiplier();

      // helper to make a simple gain node
      const makeGain = (v: number, duration: number, t = now) => {
        const g = ctx.createGain();
        g.gain.setValueAtTime(v, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + duration);
        g.connect(ctx.destination);
        return g;
      };

      // ── Original tones ─────────────────────────────────────────────────────
      if (tone === 'cyber_pulse') {
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol * 0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        g.connect(ctx.destination);
        ['square', 'sawtooth'].forEach((t, i) => {
          const o = ctx.createOscillator();
          o.type = t as OscillatorType;
          o.frequency.setValueAtTime(i === 0 ? 880 : 1760, now);
          if (i === 0) o.frequency.exponentialRampToValueAtTime(440, now + 0.15);
          o.connect(g); o.start(now); o.stop(now + 0.25);
        });

      } else if (tone === 'quantum_sweep') {
        const o = ctx.createOscillator(); const f = ctx.createBiquadFilter();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(220, now);
        o.frequency.exponentialRampToValueAtTime(1760, now + 0.35);
        f.type = 'bandpass'; f.frequency.setValueAtTime(600, now); f.Q.value = 8;
        g.gain.setValueAtTime(vol * 0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        o.connect(f); f.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.4);

      } else if (tone === 'hyperion_alert') {
        [0, 0.12].forEach(off => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(1200, now + off);
          o.frequency.linearRampToValueAtTime(900, now + off + 0.08);
          g.gain.setValueAtTime(vol * 0.35, now + off);
          g.gain.exponentialRampToValueAtTime(0.001, now + off + 0.1);
          o.connect(g); g.connect(ctx.destination); o.start(now + off); o.stop(now + off + 0.1);
        });

      } else if (tone === 'orbital_sunrise') {
        [220, 277.18, 329.63, 440].forEach(freq => {
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.08, 0.6);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, now);
          o.connect(g); o.start(now); o.stop(now + 0.6);
        });

      } else if (tone === 'gentle_chime') {
        [329.63, 440, 523.25, 659.25].forEach((freq, idx) => {
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.1, 0.4, now + idx * 0.08);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, now + idx * 0.08);
          o.connect(g); o.start(now + idx * 0.08); o.stop(now + idx * 0.08 + 0.4);
        });

      } else if (tone === 'female_vocal_tone') {
        [440, 880, 1320].forEach(freq => {
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.08, 0.5);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, now);
          o.connect(g); o.start(now); o.stop(now + 0.5);
        });

      } else if (tone === 'male_vocal_tone') {
        [110, 220, 330].forEach(freq => {
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.12, 0.5);
          o.type = 'triangle'; o.frequency.setValueAtTime(freq, now);
          o.connect(g); o.start(now); o.stop(now + 0.5);
        });

      } else if (tone === 'energetic_synthwave') {
        [440, 554.37, 659.25, 880].forEach((freq, idx) => {
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.1, 0.15, now + idx * 0.05);
          o.type = 'sawtooth'; o.frequency.setValueAtTime(freq, now + idx * 0.05);
          o.connect(g); o.start(now + idx * 0.05); o.stop(now + idx * 0.05 + 0.15);
        });

      } else if (tone === 'laser_alert') {
        const g = ctx.createGain(); const o = ctx.createOscillator();
        g.gain.setValueAtTime(vol * 0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        g.connect(ctx.destination);
        o.type = 'sawtooth'; o.frequency.setValueAtTime(1800, now);
        o.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        o.connect(g); o.start(now); o.stop(now + 0.2);

      } else if (tone === 'heavy_sub_bass') {
        const g = ctx.createGain(); const o = ctx.createOscillator();
        g.gain.setValueAtTime(vol * 0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(65, now);
        o.frequency.exponentialRampToValueAtTime(35, now + 0.4);
        o.connect(g); o.start(now); o.stop(now + 0.4);

      // ── Samsung-inspired ───────────────────────────────────────────────────
      } else if (tone === 'samsung_horizon') {
        // "Over the Horizon" — gentle ascending pentatonic melody
        const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
        notes.forEach((freq, idx) => {
          const t = now + idx * 0.18;
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.12, 0.3, t);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
          // slight vibrato via detune
          o.detune.setValueAtTime(0, t); o.detune.linearRampToValueAtTime(8, t + 0.15);
          o.connect(g); o.start(t); o.stop(t + 0.35);
        });

      } else if (tone === 'samsung_homecoming') {
        // "Homecoming" — warm piano-style arpeggios (C major chord)
        const chord = [261.63, 329.63, 392, 523.25];
        chord.forEach((freq, idx) => {
          const t = now + idx * 0.12;
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.10, 0.5, t);
          o.type = 'triangle'; o.frequency.setValueAtTime(freq, t);
          o.connect(g); o.start(t); o.stop(t + 0.55);
        });

      } else if (tone === 'samsung_morning') {
        // Samsung Morning — slow, warm sine wave rise like sunrise
        const melody = [392, 440, 493.88, 523.25, 587.33];
        melody.forEach((freq, idx) => {
          const t = now + idx * 0.22;
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.11, 0.4, t);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
          o.connect(g); o.start(t); o.stop(t + 0.45);
        });

      // ── Xiaomi-inspired ────────────────────────────────────────────────────
      } else if (tone === 'xiaomi_miui') {
        // MIUI Default — crisp bright ascending digital beeps
        [1046.5, 1318.51, 1567.98].forEach((freq, idx) => {
          const t = now + idx * 0.13;
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.14, 0.1, t);
          o.type = 'square'; o.frequency.setValueAtTime(freq, t);
          o.connect(g); o.start(t); o.stop(t + 0.12);
        });

      } else if (tone === 'xiaomi_bubbly') {
        // Bubbly — cheerful pops ascending
        [698.46, 880, 1046.5, 1318.51, 1567.98].forEach((freq, idx) => {
          const t = now + idx * 0.09;
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.10, 0.07, t);
          o.type = 'sine'; o.frequency.setValueAtTime(freq * 0.8, t);
          o.frequency.exponentialRampToValueAtTime(freq, t + 0.04);
          o.connect(g); o.start(t); o.stop(t + 0.09);
        });

      } else if (tone === 'xiaomi_digital') {
        // Classic digital ring: two-tone repeat
        [1400, 1800].forEach((freq, idx) => {
          const t = now + idx * 0.09;
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.15, 0.07, t);
          o.type = 'square'; o.frequency.setValueAtTime(freq, t);
          o.connect(g); o.start(t); o.stop(t + 0.08);
        });

      // ── iPhone-inspired ────────────────────────────────────────────────────
      } else if (tone === 'iphone_radar') {
        // Radar — single spaced soft ping with echo
        const o = ctx.createOscillator(); const g = makeGain(vol * 0.15, 0.5);
        o.type = 'sine'; o.frequency.setValueAtTime(1100, now);
        o.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        o.connect(g); o.start(now); o.stop(now + 0.55);
        // soft echo
        const o2 = ctx.createOscillator(); const g2 = makeGain(vol * 0.06, 0.4, now + 0.25);
        o2.type = 'sine'; o2.frequency.setValueAtTime(1100, now + 0.25);
        o2.frequency.exponentialRampToValueAtTime(800, now + 0.55);
        o2.connect(g2); o2.start(now + 0.25); o2.stop(now + 0.65);

      } else if (tone === 'iphone_apex') {
        // Apex — three climbing sine pulses
        [880, 1109.73, 1318.51].forEach((freq, idx) => {
          const t = now + idx * 0.14;
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.13, 0.12, t);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
          o.connect(g); o.start(t); o.stop(t + 0.14);
        });

      } else if (tone === 'iphone_reflection') {
        // Reflection — rippling sine waves (Am chord)
        [440, 523.25, 659.25, 880].forEach((freq, idx) => {
          const t = now + idx * 0.1;
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.09, 0.55, t);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
          o.connect(g); o.start(t); o.stop(t + 0.6);
        });

      } else if (tone === 'iphone_marimba') {
        // Marimba — classic wooden bar sound (triangle + harmonic)
        const mNotes = [783.99, 987.77, 1174.66, 1318.51];
        mNotes.forEach((freq, idx) => {
          const t = now + idx * 0.15;
          // fundamental
          const o1 = ctx.createOscillator(); const g1 = makeGain(vol * 0.11, 0.18, t);
          o1.type = 'triangle'; o1.frequency.setValueAtTime(freq, t);
          o1.connect(g1); o1.start(t); o1.stop(t + 0.2);
          // 4th harmonic attack click
          const o2 = ctx.createOscillator(); const g2 = makeGain(vol * 0.04, 0.04, t);
          o2.type = 'sine'; o2.frequency.setValueAtTime(freq * 4, t);
          o2.connect(g2); o2.start(t); o2.stop(t + 0.04);
        });

      // ── Classic ───────────────────────────────────────────────────────────
      } else if (tone === 'classic_beep') {
        // Old-school alarm clock: two rapid beep pairs
        [0, 0.12, 0.32, 0.44].forEach(off => {
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.18, 0.09, now + off);
          o.type = 'square'; o.frequency.setValueAtTime(1000, now + off);
          o.connect(g); o.start(now + off); o.stop(now + off + 0.1);
        });

      } else if (tone === 'morning_bells') {
        // Church bell-style: strike + ring tail
        const bellFreqs = [523.25, 659.25, 783.99];
        bellFreqs.forEach((freq, idx) => {
          const t = now + idx * 0.25;
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.12, 0.7, t);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
          o.connect(g); o.start(t); o.stop(t + 0.75);
          // overtone
          const o2 = ctx.createOscillator(); const g2 = makeGain(vol * 0.05, 0.5, t);
          o2.type = 'sine'; o2.frequency.setValueAtTime(freq * 2.76, t);
          o2.connect(g2); o2.start(t); o2.stop(t + 0.55);
        });

      } else {
        // chrono_matrix (default fallback)
        [587.33, 880, 1174.66, 1760].forEach((freq, idx) => {
          const o = ctx.createOscillator(); const g = makeGain(vol * 0.12, 0.2, now + idx * 0.06);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, now + idx * 0.06);
          o.connect(g); o.start(now + idx * 0.06); o.stop(now + idx * 0.06 + 0.22);
        });
      }
    };

    triggerPulse();
    const intervalTime =
      tone === 'hyperion_alert' || tone === 'xiaomi_digital' ? 400 :
      tone === 'cyber_pulse'    || tone === 'classic_beep'    ? 500 :
      tone === 'iphone_radar'   || tone === 'samsung_horizon' ? 1200 :
      tone === 'samsung_homecoming' || tone === 'samsung_morning' ? 1100 :
      tone === 'iphone_reflection' || tone === 'morning_bells'    ? 1300 : 700;

    this.currentAlarmInterval = window.setInterval(triggerPulse, intervalTime);
    return () => this.stopAlarmSynth();
  }

  // ── Storage-file looping player ───────────────────────────────────────────

  private startStorageAudioLoop(dataUrl: string, volume: number, fadeIn: boolean): () => void {
    this.stopStorageAudio();
    const audio = new Audio(dataUrl);
    audio.loop = true;
    audio.volume = fadeIn ? volume * 0.1 : volume;
    this.storageAudioEl = audio;
    audio.play().catch(() => {});

    if (fadeIn) {
      const start = Date.now();
      const dur = this.fadeDurationMs;
      const iv = window.setInterval(() => {
        if (!this.storageAudioEl) { clearInterval(iv); return; }
        const p = Math.min((Date.now() - start) / dur, 1);
        this.storageAudioEl.volume = Math.min(volume * (0.10 + 0.90 * p), volume);
        if (p >= 1) clearInterval(iv);
      }, 2000);
    }

    return () => this.stopStorageAudio();
  }

  private stopStorageAudio() {
    if (this.storageAudioEl) {
      this.storageAudioEl.pause();
      this.storageAudioEl.src = '';
      this.storageAudioEl = null;
    }
  }

  public stopAlarmSynth() {
    if (this.currentAlarmInterval !== null) {
      clearInterval(this.currentAlarmInterval);
      this.currentAlarmInterval = null;
    }
    this.stopStorageAudio();
    this.fadeStartTime = null;
  }

  // ── Ambient noise ─────────────────────────────────────────────────────────

  public startAmbientNoise(type: AmbientNoiseType, volume = 0.5): () => void {
    this.stopAmbientNoise();
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const out = buf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) out[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
    const filter = ctx.createBiquadFilter();
    const master = ctx.createGain(); master.gain.value = volume * 0.2;

    if (type === 'warp_drive') {
      filter.type = 'lowpass'; filter.frequency.value = 180;
      const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = 42;
      const sg = ctx.createGain(); sg.gain.value = volume * 0.25;
      sub.connect(sg); sg.connect(ctx.destination); sub.start();
      noise.connect(filter); filter.connect(master); master.connect(ctx.destination); noise.start();
      this.currentAmbientNodes = { stop: () => { try { noise.stop(); sub.stop(); } catch {} } };
    } else if (type === 'deep_space') {
      filter.type = 'bandpass'; filter.frequency.value = 320; filter.Q.value = 4;
      noise.connect(filter); filter.connect(master); master.connect(ctx.destination); noise.start();
      this.currentAmbientNodes = { stop: () => { try { noise.stop(); } catch {} } };
    } else if (type === 'ship_rain') {
      filter.type = 'lowpass'; filter.frequency.value = 1200;
      noise.connect(filter); filter.connect(master); master.connect(ctx.destination); noise.start();
      this.currentAmbientNodes = { stop: () => { try { noise.stop(); } catch {} } };
    } else if (type === 'quantum_static') {
      filter.type = 'highpass'; filter.frequency.value = 2400;
      noise.connect(filter); filter.connect(master); master.connect(ctx.destination); noise.start();
      this.currentAmbientNodes = { stop: () => { try { noise.stop(); } catch {} } };
    } else {
      const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator();
      o1.type = 'sine'; o2.type = 'sine';
      o1.frequency.value = 108; o2.frequency.value = 111;
      const dg = ctx.createGain(); dg.gain.value = volume * 0.15;
      o1.connect(dg); o2.connect(dg); dg.connect(ctx.destination);
      o1.start(); o2.start();
      this.currentAmbientNodes = { stop: () => { try { o1.stop(); o2.stop(); } catch {} } };
    }
    return () => this.stopAmbientNoise();
  }

  public stopAmbientNoise() {
    if (this.currentAmbientNodes) {
      this.currentAmbientNodes.stop();
      this.currentAmbientNodes = null;
    }
  }
}

export const audioSynth = new AudioSynthService();
