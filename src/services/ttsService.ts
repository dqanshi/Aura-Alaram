class TTSService {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private voices: SpeechSynthesisVoice[] = [];
  private isLooping = false;
  private loopTimeout: number | null = null;

  constructor() {
    this.loadVoices();
    if (this.synth && 'onvoiceschanged' in this.synth) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  public loadVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    this.voices = this.synth.getVoices();
    return this.voices;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    return this.voices;
  }

  public getCategorizedVoices(): { female: SpeechSynthesisVoice[]; male: SpeechSynthesisVoice[]; other: SpeechSynthesisVoice[] } {
    const all = this.getVoices();
    const femaleKeywords = ['female', 'samantha', 'victoria', 'karen', 'zira', 'hazel', 'susan', 'catherine', 'fiona', 'moira', 'veena', 'google us english female', 'siri', 'ava', 'sora'];
    const maleKeywords = ['male', 'alex', 'david', 'george', 'daniel', 'mark', 'james', 'fred', 'rishi', 'oliver', 'google us english male', 'tom'];

    const female: SpeechSynthesisVoice[] = [];
    const male: SpeechSynthesisVoice[] = [];
    const other: SpeechSynthesisVoice[] = [];

    all.forEach(v => {
      const lower = v.name.toLowerCase();
      if (femaleKeywords.some(k => lower.includes(k))) {
        female.push(v);
      } else if (maleKeywords.some(k => lower.includes(k))) {
        male.push(v);
      } else {
        other.push(v);
      }
    });

    return { female, male, other };
  }

  public speakText(text: string, options?: { pitch?: number; rate?: number; voiceURI?: string; gender?: 'female' | 'male' | 'system'; onEnd?: () => void }) {
    if (!this.synth) {
      if (options?.onEnd) options.onEnd();
      return;
    }

    try {
      this.synth.cancel(); // Stop any pending speech

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
        if (options.gender === 'female') {
          if (female.length > 0) utterance.voice = female[0];
          calculatedPitch = Math.max(1.15, calculatedPitch);
        } else if (options.gender === 'male') {
          if (male.length > 0) utterance.voice = male[0];
          calculatedPitch = Math.min(0.8, calculatedPitch);
        }
      }

      if (!utterance.voice && availableVoices.length > 0) {
        // Fallback english voice search
        const preferred = availableVoices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
        if (preferred) utterance.voice = preferred;
      }

      utterance.pitch = calculatedPitch;
      utterance.rate = calculatedRate;

      if (options?.onEnd) {
        utterance.onend = () => options.onEnd!();
      }

      this.synth.speak(utterance);
    } catch {
      if (options?.onEnd) options.onEnd();
    }
  }

  public startAlarmTTSLoop(templateText: string, name: string, options?: { pitch?: number; rate?: number; voiceURI?: string; gender?: 'female' | 'male' | 'system' }) {
    this.stopTTS();
    this.isLooping = true;

    const formattedText = templateText.replace(/\[Name\]/gi, name || 'Commander');

    const speakNext = () => {
      if (!this.isLooping) return;
      this.speakText(formattedText, {
        ...options,
        onEnd: () => {
          if (this.isLooping) {
            this.loopTimeout = window.setTimeout(speakNext, 1800);
          }
        }
      });
    };

    speakNext();
  }

  public stopTTS() {
    this.isLooping = false;
    if (this.loopTimeout !== null) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
  }

  public isSupported(): boolean {
    return !!this.synth;
  }
}

export const ttsService = new TTSService();
