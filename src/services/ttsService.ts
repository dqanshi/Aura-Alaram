/**
 * ttsService.ts
 *
 * On Android (Capacitor native app) we call the custom TTSPlugin we registered
 * in MainActivity.java — it uses Android's built-in TextToSpeech engine, which
 * works 100 %  and never silently fails in a WebView the way the
 * Web Speech API often does.
 *
 * On the web / browser preview we fall back to window.speechSynthesis as before.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

// ── Native plugin interface ──────────────────────────────────────────────────

interface NativeTTSPlugin {
  speak(options: { text: string; pitch?: number; rate?: number }): Promise<void>;
  stop(): Promise<void>;
  isSupported(): Promise<{ supported: boolean }>;
  addListener(
    event: 'ttsCompleted',
    listener: () => void
  ): Promise<{ remove: () => void }>;
}

// registerPlugin returns a no-op object on web, so it is safe to call always.
const NativeTTS = registerPlugin<NativeTTSPlugin>('TTSPlugin');

const IS_NATIVE = Capacitor.isNativePlatform();

// ── TTS Service ──────────────────────────────────────────────────────────────

class TTSService {
  // Web Speech API fields (used only on browser)
  private synth: SpeechSynthesis | null =
    !IS_NATIVE && typeof window !== 'undefined' ? window.speechSynthesis : null;
  private voices: SpeechSynthesisVoice[] = [];

  // Shared looping state
  private isLooping = false;
  private loopTimeout: number | null = null;
  private nativeLoopListener: { remove: () => void } | null = null;

  constructor() {
    if (!IS_NATIVE) {
      this.loadVoices();
      if (this.synth && 'onvoiceschanged' in this.synth) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  // ── Voice helpers (web only) ──────────────────────────────────────────────

  public loadVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    this.voices = this.synth.getVoices();
    return this.voices;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) this.loadVoices();
    return this.voices;
  }

  public getCategorizedVoices(): {
    female: SpeechSynthesisVoice[];
    male: SpeechSynthesisVoice[];
    other: SpeechSynthesisVoice[];
  } {
    const all = this.getVoices();
    const femaleKeywords = [
      'female', 'samantha', 'victoria', 'karen', 'zira', 'hazel', 'susan',
      'catherine', 'fiona', 'moira', 'veena', 'siri', 'ava', 'sora',
    ];
    const maleKeywords = [
      'male', 'alex', 'david', 'george', 'daniel', 'mark', 'james', 'fred',
      'rishi', 'oliver', 'tom',
    ];

    const female: SpeechSynthesisVoice[] = [];
    const male: SpeechSynthesisVoice[] = [];
    const other: SpeechSynthesisVoice[] = [];

    all.forEach(v => {
      const lower = v.name.toLowerCase();
      if (femaleKeywords.some(k => lower.includes(k))) female.push(v);
      else if (maleKeywords.some(k => lower.includes(k))) male.push(v);
      else other.push(v);
    });

    return { female, male, other };
  }

  // ── Core speak ────────────────────────────────────────────────────────────

  public speakText(
    text: string,
    options?: {
      pitch?: number;
      rate?: number;
      voiceURI?: string;
      gender?: 'female' | 'male' | 'system';
      onEnd?: () => void;
    }
  ) {
    if (IS_NATIVE) {
      // Use Android's native TTS engine via our custom Capacitor plugin
      NativeTTS.speak({
        text,
        pitch: options?.pitch ?? 1.0,
        rate: options?.rate ?? 1.0,
      })
        .then(() => {
          // Native speak resolves immediately after enqueueing the utterance.
          // The 'ttsCompleted' event fires when Android finishes speaking.
          // onEnd is handled by the loop listener set up in startAlarmTTSLoop.
          if (options?.onEnd && !this.isLooping) {
            // Single non-looping call: listen once for completion
            NativeTTS.addListener('ttsCompleted', () => {
              options.onEnd?.();
            });
          }
        })
        .catch(() => {
          options?.onEnd?.();
        });
      return;
    }

    // ── Web Speech API fallback ──────────────────────────────────────────────
    if (!this.synth) {
      options?.onEnd?.();
      return;
    }

    try {
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      let calculatedPitch = options?.pitch ?? 1.0;
      let calculatedRate = options?.rate ?? 1.0;

      const availableVoices = this.getVoices();
      const { female, male } = this.getCategorizedVoices();

      if (options?.voiceURI) {
        const found = availableVoices.find(v => v.voiceURI === options.voiceURI);
        if (found) utterance.voice = found;
      }

      if (!utterance.voice && options?.gender) {
        if (options.gender === 'female' && female.length > 0) {
          utterance.voice = female[0];
          calculatedPitch = Math.max(1.15, calculatedPitch);
        } else if (options.gender === 'male' && male.length > 0) {
          utterance.voice = male[0];
          calculatedPitch = Math.min(0.8, calculatedPitch);
        }
      }

      if (!utterance.voice && availableVoices.length > 0) {
        const preferred = availableVoices.find(
          v => v.lang.startsWith('en') &&
               (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
        );
        if (preferred) utterance.voice = preferred;
      }

      utterance.pitch = calculatedPitch;
      utterance.rate = calculatedRate;

      if (options?.onEnd) {
        utterance.onend = () => options.onEnd!();
      }

      this.synth.speak(utterance);
    } catch {
      options?.onEnd?.();
    }
  }

  // ── Looping alarm TTS ─────────────────────────────────────────────────────

  public startAlarmTTSLoop(
    templateText: string,
    name: string,
    options?: {
      pitch?: number;
      rate?: number;
      voiceURI?: string;
      gender?: 'female' | 'male' | 'system';
    }
  ) {
    this.stopTTS();
    this.isLooping = true;

    const formattedText = templateText.replace(/\[Name\]/gi, name || 'Commander');

    if (IS_NATIVE) {
      // On Android: speak once, then re-speak every time the engine fires 'ttsCompleted'
      const loopOnNative = () => {
        if (!this.isLooping) return;
        NativeTTS.speak({
          text: formattedText,
          pitch: options?.pitch ?? 1.0,
          rate: options?.rate ?? 1.0,
        }).catch(() => {});
      };

      // Set up the repeating listener
      NativeTTS.addListener('ttsCompleted', () => {
        if (!this.isLooping) return;
        // Small gap between repetitions
        this.loopTimeout = window.setTimeout(loopOnNative, 1800);
      }).then(handle => {
        this.nativeLoopListener = handle;
      });

      loopOnNative();
      return;
    }

    // Web path
    const speakNext = () => {
      if (!this.isLooping) return;
      this.speakText(formattedText, {
        ...options,
        onEnd: () => {
          if (this.isLooping) {
            this.loopTimeout = window.setTimeout(speakNext, 1800);
          }
        },
      });
    };

    speakNext();
  }

  // ── Stop ──────────────────────────────────────────────────────────────────

  public stopTTS() {
    this.isLooping = false;

    if (this.loopTimeout !== null) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }

    if (this.nativeLoopListener) {
      this.nativeLoopListener.remove();
      this.nativeLoopListener = null;
    }

    if (IS_NATIVE) {
      NativeTTS.stop().catch(() => {});
    } else if (this.synth) {
      try { this.synth.cancel(); } catch {}
    }
  }

  public isSupported(): boolean {
    return IS_NATIVE || !!this.synth;
  }
}

export const ttsService = new TTSService();
