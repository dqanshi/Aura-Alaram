import { AlarmSoundTone, AmbientNoiseType } from '../types';

class AudioSynthService {
  private ctx: AudioContext | null = null;
  private currentAlarmInterval: number | null = null;
  private currentAmbientNodes: { stop: () => void } | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Sci-Fi UI Feedback Sounds
  public playUiClick(freq = 800) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio context safeguard
    }
  }

  public playSuccessSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch {
      // Audio fallback
    }
  }

  public playErrorSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(140, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.3);
    } catch {
      // Fallback
    }
  }

  // Futuristic Alarm Synthesizer Loop
  public startAlarmSynth(tone: AlarmSoundTone, volume = 0.8): () => void {
    this.stopAlarmSynth();
    const ctx = this.getContext();

    const triggerPulse = () => {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.3, now);

      if (tone === 'cyber_pulse') {
        // High energy dual square pulses
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'square';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(880, now);
        osc2.frequency.setValueAtTime(1760, now);
        osc1.frequency.exponentialRampToValueAtTime(440, now + 0.15);
        
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(masterGain);
        osc2.connect(masterGain);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.25);
      } else if (tone === 'quantum_sweep') {
        // Resonant sci-fi frequency sweep
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.35);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        filter.Q.value = 8;

        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(filter);
        filter.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (tone === 'hyperion_alert') {
        // Rapid double siren pulse
        [0, 0.12].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1200, now + offset);
          osc.frequency.linearRampToValueAtTime(900, now + offset + 0.08);
          gain.gain.setValueAtTime(volume * 0.35, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.1);
        });
      } else if (tone === 'orbital_sunrise') {
        // Soothing warm binaural synth chord
        [220, 277.18, 329.63, 440].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.6);
        });
      } else if (tone === 'gentle_chime') {
        // Soft relaxing waking chime chord
        [329.63, 440, 523.25, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.1, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.4);
        });
      } else if (tone === 'female_vocal_tone') {
        // High harmonic female-like formants hum
        [440, 880, 1320].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
        });
      } else if (tone === 'male_vocal_tone') {
        // Deep resonant male-like bass formant hum
        [110, 220, 330].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
        });
      } else if (tone === 'energetic_synthwave') {
        // Upbeat high-energy synth wave pulse
        [440, 554.37, 659.25, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.1, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.15);
        });
      } else if (tone === 'laser_alert') {
        // Sci-fi laser sweep beam
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (tone === 'heavy_sub_bass') {
        // Deep sub-bass pulse
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(65, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.4);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.4);
      } else { // chrono_matrix
        // Arpeggiated galaxy chimes
        [587.33, 880, 1174.66, 1760].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.12, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.2);
        });
      }

      masterGain.connect(ctx.destination);
    };

    triggerPulse();
    const intervalTime = tone === 'hyperion_alert' ? 400 : tone === 'cyber_pulse' ? 500 : 700;
    this.currentAlarmInterval = window.setInterval(triggerPulse, intervalTime);

    return () => this.stopAlarmSynth();
  }

  public stopAlarmSynth() {
    if (this.currentAlarmInterval !== null) {
      clearInterval(this.currentAlarmInterval);
      this.currentAlarmInterval = null;
    }
  }

  // Ambient Sleep Generator (Offline White Noise / Warp Engine / Deep Space)
  public startAmbientNoise(type: AmbientNoiseType, volume = 0.5): () => void {
    this.stopAmbientNoise();
    const ctx = this.getContext();

    // Create noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume * 0.2;

    if (type === 'warp_drive') {
      filter.type = 'lowpass';
      filter.frequency.value = 180;
      
      // Sub oscillator for engine rumble
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.value = 42;
      const subGain = ctx.createGain();
      subGain.gain.value = volume * 0.25;
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start();

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);
      whiteNoise.start();

      this.currentAmbientNodes = {
        stop: () => {
          try {
            whiteNoise.stop();
            subOsc.stop();
          } catch {}
        }
      };
    } else if (type === 'deep_space') {
      filter.type = 'bandpass';
      filter.frequency.value = 320;
      filter.Q.value = 4;

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);
      whiteNoise.start();

      this.currentAmbientNodes = {
        stop: () => {
          try { whiteNoise.stop(); } catch {}
        }
      };
    } else if (type === 'ship_rain') {
      filter.type = 'lowpass';
      filter.frequency.value = 1200;

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);
      whiteNoise.start();

      this.currentAmbientNodes = {
        stop: () => {
          try { whiteNoise.stop(); } catch {}
        }
      };
    } else if (type === 'quantum_static') {
      filter.type = 'highpass';
      filter.frequency.value = 2400;

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);
      whiteNoise.start();

      this.currentAmbientNodes = {
        stop: () => {
          try { whiteNoise.stop(); } catch {}
        }
      };
    } else { // stellar_drone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.value = 108;
      osc2.frequency.value = 111; // 3Hz binaural beat

      const droneGain = ctx.createGain();
      droneGain.gain.value = volume * 0.15;

      osc1.connect(droneGain);
      osc2.connect(droneGain);
      droneGain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      this.currentAmbientNodes = {
        stop: () => {
          try {
            osc1.stop();
            osc2.stop();
          } catch {}
        }
      };
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
