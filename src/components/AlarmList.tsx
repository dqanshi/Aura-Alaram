import React from 'react';
import { Alarm, UserPreferences } from '../types';
import { Plus, Bell, Volume2, Trash2, Edit2, Play, Mic, Brain, Fingerprint, Zap, Ban } from 'lucide-react';
import { ttsService } from '../services/ttsService';
import { audioSynth } from '../services/audioSynth';
import { formatTimeDisplay } from '../utils/timeFormat';

interface AlarmListProps {
  alarms: Alarm[];
  prefs?: UserPreferences;
  onToggleAlarm: (id: string) => void;
  onEditAlarm: (alarm: Alarm) => void;
  onDeleteAlarm: (id: string) => void;
  onOpenCreateModal: () => void;
  onTriggerTestAlarm: (alarm: Alarm) => void;
}

const DAY_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TONE_LABELS: Record<string, string> = {
  cyber_pulse: 'Cyber Pulse',
  quantum_sweep: 'Quantum Sweep',
  hyperion_alert: 'Hyperion Alert',
  orbital_sunrise: 'Orbital Sunrise',
  chrono_matrix: 'Chrono Matrix',
  gentle_chime: 'Gentle Chime',
  female_vocal_tone: 'Female Hum',
  male_vocal_tone: 'Male Hum',
  energetic_synthwave: 'Synthwave',
  laser_alert: 'Laser Alert',
  heavy_sub_bass: 'Sub Bass',
  samsung_horizon: 'Samsung Horizon',
  samsung_homecoming: 'Samsung Homecoming',
  samsung_morning: 'Samsung Morning',
  xiaomi_miui: 'Xiaomi MIUI',
  xiaomi_bubbly: 'Xiaomi Bubbly',
  xiaomi_digital: 'Xiaomi Digital',
  iphone_radar: 'iPhone Radar',
  iphone_apex: 'iPhone Apex',
  iphone_reflection: 'iPhone Reflection',
  iphone_marimba: 'iPhone Marimba',
  classic_beep: 'Classic Beep',
  morning_bells: 'Morning Bells',
  storage_file: '📂 Custom File',
};

export const AlarmList: React.FC<AlarmListProps> = ({
  alarms,
  prefs,
  onToggleAlarm,
  onEditAlarm,
  onDeleteAlarm,
  onOpenCreateModal,
  onTriggerTestAlarm,
}) => {
  const handleTestTTS = (alarm: Alarm) => {
    audioSynth.playUiClick();
    const spoken = alarm.voiceGreeting.replace(/\[Name\]/gi, alarm.userName || 'Anshif');
    ttsService.speakText(spoken, { pitch: alarm.voicePitch, rate: alarm.voiceRate });
  };

  const isDarkMode = prefs?.darkMode ?? true;

  const challengeIcon = (c: string) => {
    if (c === 'biometric') return <Fingerprint className="w-3 h-3" />;
    if (c === 'math')      return <Brain className="w-3 h-3" />;
    if (c === 'reflex')    return <Zap className="w-3 h-3" />;
    if (c === 'phrase')    return <Mic className="w-3 h-3" />;
    return <Ban className="w-3 h-3" />;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold font-mono tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>ALARM LIST</h2>
          <p className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Offline Personalized Voice Alarms</p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className={`px-5 py-2.5 rounded-2xl font-mono font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md ${
            isDarkMode ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20' : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>ADD NEW ALARM</span>
        </button>
      </div>

      {alarms.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 space-y-4">
          <Bell className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-slate-300 font-mono text-sm">No alarms yet.</div>
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-mono text-xs hover:bg-cyan-500/30 transition-all cursor-pointer"
          >
            + Create First Alarm
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {alarms.map(alarm => (
            <div
              key={alarm.id}
              className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                alarm.enabled
                  ? isDarkMode ? 'border-cyan-500/30 bg-slate-950/80 shadow-lg shadow-cyan-950/30 text-white' : 'border-cyan-300 bg-white shadow-md text-slate-900'
                  : isDarkMode ? 'border-slate-800/80 bg-slate-950/30 opacity-60 text-slate-300' : 'border-slate-200 bg-slate-50/80 opacity-60 text-slate-600'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Left */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
                      isDarkMode ? 'text-white drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'text-slate-900'
                    }`}>
                      {formatTimeDisplay(alarm.time, prefs?.militaryTime)}
                    </span>
                    <button
                      onClick={() => { audioSynth.playUiClick(); onToggleAlarm(alarm.id); }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        alarm.enabled ? 'bg-cyan-500' : isDarkMode ? 'bg-slate-800' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alarm.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{alarm.title}</span>
                    <span className={isDarkMode ? 'text-slate-600' : 'text-slate-400'}>•</span>
                    <span className="text-cyan-500 font-bold">Wake: "{alarm.userName}"</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {[0,1,2,3,4,5,6].map(day => {
                      const active = alarm.days.includes(day);
                      return (
                        <span key={day} className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          active
                            ? isDarkMode ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40' : 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                            : isDarkMode ? 'bg-slate-900/40 text-slate-600' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {DAY_MAP[day]}
                        </span>
                      );
                    })}
                  </div>

                  {alarm.memoNote && (
                    <div className={`mt-2 text-xs font-mono px-3 py-1.5 rounded-xl border inline-block ${
                      isDarkMode ? 'text-slate-300 bg-slate-900/80 border-slate-800/80' : 'text-slate-700 bg-slate-100 border-slate-200'
                    }`}>
                      Memo: "{alarm.memoNote}"
                    </div>
                  )}
                </div>

                {/* Right */}
                <div className={`flex flex-col sm:items-end space-y-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-mono flex items-center space-x-1 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                    }`}>
                      <Volume2 className="w-3 h-3" />
                      <span>{TONE_LABELS[alarm.soundTone] ?? alarm.soundTone}</span>
                    </span>
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-mono flex items-center space-x-1 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-fuchsia-400' : 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800 font-bold'
                    }`}>
                      {challengeIcon(alarm.challenge)}
                      <span className="capitalize">{alarm.challenge === 'none' ? 'No challenge' : alarm.challenge}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTestTTS(alarm)}
                      className={`px-3 py-1.5 rounded-xl border font-mono text-xs flex items-center space-x-1 transition-all cursor-pointer ${
                        isDarkMode ? 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-cyan-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-cyan-800 font-bold'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" /><span>Voice Test</span>
                    </button>
                    <button
                      onClick={() => onTriggerTestAlarm(alarm)}
                      className={`px-3 py-1.5 rounded-xl border font-mono text-xs flex items-center space-x-1 transition-all cursor-pointer ${
                        isDarkMode ? 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600 font-bold'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /><span>Test Alarm</span>
                    </button>
                    <button
                      onClick={() => onEditAlarm(alarm)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteAlarm(alarm.id)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        isDarkMode ? 'text-slate-500 hover:text-red-400 hover:bg-red-950/30 border-transparent' : 'text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
