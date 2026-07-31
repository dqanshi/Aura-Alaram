export type ChallengeType = 'none' | 'math' | 'biometric' | 'reflex' | 'phrase';

export type AlarmSoundTone =
  // ── Original synth tones ─────────────────────────────────────
  | 'cyber_pulse'
  | 'quantum_sweep'
  | 'hyperion_alert'
  | 'orbital_sunrise'
  | 'chrono_matrix'
  | 'gentle_chime'
  | 'female_vocal_tone'
  | 'male_vocal_tone'
  | 'energetic_synthwave'
  | 'laser_alert'
  | 'heavy_sub_bass'
  // ── Samsung-inspired ─────────────────────────────────────────
  | 'samsung_horizon'      // Over the Horizon style — soft ascending melody
  | 'samsung_homecoming'   // Homecoming style — warm piano arpeggios
  | 'samsung_morning'      // Morning light — slow gentle rise
  // ── Xiaomi-inspired ──────────────────────────────────────────
  | 'xiaomi_miui'          // MIUI default — bright crisp digital
  | 'xiaomi_bubbly'        // Bubbly — cheerful ascending pops
  | 'xiaomi_digital'       // Classic digital ring pattern
  // ── iPhone-inspired ──────────────────────────────────────────
  | 'iphone_radar'         // Radar — spaced soft pings
  | 'iphone_apex'          // Apex — climbing sine pulses
  | 'iphone_reflection'    // Reflection — rippling soft waves
  | 'iphone_marimba'       // Marimba — classic wooden bars
  // ── Classic ──────────────────────────────────────────────────
  | 'classic_beep'         // Old-school alarm clock beeping
  | 'morning_bells'        // Church bell style
  | 'storage_file';        // Audio file picked from device storage

export type VoiceGender = 'female' | 'male' | 'system';

export type AmbientNoiseType = 'warp_drive' | 'deep_space' | 'ship_rain' | 'quantum_static' | 'stellar_drone';

export type SnoozeMode = 'standard_5m' | 'smart_calendar' | 'math_challenge';

export interface CalendarEvent {
  id: string;
  title: string;
  time: string; // HH:MM
  location?: string;
}

export interface OfflineWeatherData {
  location: string;
  tempC: number;
  condition: string;
  humidity: number;
  uvIndex: number;
  windKm: number;
  forecastSummary: string;
  lastUpdated: string;
}

export interface Alarm {
  id: string;
  time: string; // HH:MM in 24h format
  title: string;
  enabled: boolean;
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  userName: string;
  voiceGreeting: string;
  voiceGender?: VoiceGender;
  voicePitch: number;  // 0.5 – 1.5
  voiceRate: number;   // 0.7 – 1.4
  customAudioDataUrl?: string;
  soundTone: AlarmSoundTone;
  storageToneDataUrl?: string;
  storageToneFileName?: string;
  volume: number; // 0 – 1
  volumeFadeIn?: boolean;
  challenge: ChallengeType;
  challengeDifficulty: 'easy' | 'medium' | 'hard';
  snoozeMode?: SnoozeMode;
  memoNote?: string;
  snoozeCount?: number;
  maxSnoozes?: number;
  snoozeDurationMinutes?: number;
  createdAt: number;
}

export interface UserPreferences {
  commanderName: string;
  selectedVoiceURI: string;
  voiceGender?: VoiceGender;
  militaryTime: boolean;
  ttsEnabled?: boolean;
  darkMode?: boolean;
  scanlineEffect: boolean;
  ambientVolume: number;
  defaultChallenge: ChallengeType;
  themeAccent: 'cyan' | 'emerald' | 'magenta' | 'amber';
  cachedWeatherLocation: string;
  customDefaultVoiceRecording?: string;
}

export interface SleepCycleCalculation {
  bedtime: string;
  wakeTimes: {
    cycles: number;
    hours: number;
    time: string;
    isRecommended: boolean;
  }[];
}
