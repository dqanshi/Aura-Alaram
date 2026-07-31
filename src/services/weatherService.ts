import { OfflineWeatherData } from '../types';

const STORAGE_KEY_WEATHER = 'aura__weather_v1';

const DEFAULT_WEATHER: OfflineWeatherData = {
  location: 'Neo Tokyo Grid Alpha',
  tempC: 22,
  condition: 'Clear Atmospheric Shield',
  humidity: 48,
  uvIndex: 4,
  windKm: 12,
  forecastSummary: 'Atmospheric conditions stable. Solar radiation nominal. Optimal waking parameters.',
  lastUpdated: new Date().toLocaleDateString(),
};

export const loadOfflineWeather = (): OfflineWeatherData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WEATHER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  saveOfflineWeather(DEFAULT_WEATHER);
  return DEFAULT_WEATHER;
};

export const saveOfflineWeather = (data: OfflineWeatherData) => {
  try {
    localStorage.setItem(STORAGE_KEY_WEATHER, JSON.stringify(data));
  } catch {}
};

// Generate procedural realistic/cybernetic  forecast based on location string
export const generateProceduralWeather = (locationName: string): OfflineWeatherData => {
  const seed = locationName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const tempC = 12 + (seed % 20);
  const conditions = [
    'Clear Atmospheric Shield',
    'Quantum Ion Fog',
    'Sub-orbital Cloud Matrix',
    'Solar Flare Horizon',
    'Crisp Cyber Sunrise',
    'Brisk Starlight Aurora'
  ];
  const condition = conditions[seed % conditions.length];
  const humidity = 35 + (seed % 45);
  const uvIndex = 1 + (seed % 8);
  const windKm = 8 + (seed % 25);

  const forecast = `${condition} detected over ${locationName}. Temp ${tempC}°C, Humidity ${humidity}%. Systems report optimal morning mobility index.`;

  const data: OfflineWeatherData = {
    location: locationName,
    tempC,
    condition,
    humidity,
    uvIndex,
    windKm,
    forecastSummary: forecast,
    lastUpdated: new Date().toLocaleDateString(),
  };

  saveOfflineWeather(data);
  return data;
};
