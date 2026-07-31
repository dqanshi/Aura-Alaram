import { Alarm, UserPreferences } from '../types';

const STORAGE_KEY_ALARMS = 'aura_futuristic_alarms_v1';
const STORAGE_KEY_PREFS  = 'aura_futuristic_prefs_v1';

const DEFAULT_PREFS: UserPreferences = {
  commanderName: 'Anshif',
  selectedVoiceURI: '',
  militaryTime: false,
  darkMode: true,
  scanlineEffect: true,
  ambientVolume: 0.6,
  defaultChallenge: 'math',
  themeAccent: 'cyan',
  cachedWeatherLocation: 'Home Base',
};

const DEFAULT_ALARMS: Alarm[] = [
  {
    id: 'alarm_1',
    time: '07:00',
    title: 'Morning Alarm',
    enabled: true,
    days: [1, 2, 3, 4, 5],
    userName: 'Anshif',
    voiceGreeting: 'Good morning [Name]. Time to wake up and start your day!',
    voicePitch: 0.9,
    voiceRate: 1.0,
    soundTone: 'samsung_horizon',
    volume: 0.85,
    challenge: 'biometric',
    challengeDifficulty: 'medium',
    memoNote: 'Wake up and conquer your goals!',
    maxSnoozes: 3,
    snoozeDurationMinutes: 5,
    createdAt: Date.now() - 86400000,
  }
];

export const loadAlarmsFromStorage = (): Alarm[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALARMS);
    if (raw) return JSON.parse(raw);
  } catch {}
  saveAlarmsToStorage(DEFAULT_ALARMS);
  return DEFAULT_ALARMS;
};

export const saveAlarmsToStorage = (alarms: Alarm[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_ALARMS, JSON.stringify(alarms));
  } catch {}
};

export const loadPrefsFromStorage = (): UserPreferences => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  savePrefsToStorage(DEFAULT_PREFS);
  return DEFAULT_PREFS;
};

export const savePrefsToStorage = (prefs: UserPreferences) => {
  try {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
  } catch {}
};
