export type ChallengeType = 'none' | 'math' | 'biometric' | 'reflex' | 'phrase';

export type AlarmSoundTone = 
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
  | 'heavy_sub_bass';

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
  condition: string; // e.g. "Clear Orbital Sky", "Magnetic Rain", "Cyber Fog"
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
  voiceGreeting: string; // Speech string template e.g. "Commander [Name], time to wake up."
  voiceGender?: VoiceGender;
  voicePitch: number; // 0.5 - 1.5
  voiceRate: number; // 0.7 - 1.4
  customAudioDataUrl?: string; // Offline base64 voice recording audio
  soundTone: AlarmSoundTone;
  volume: number; // 0 - 1
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
