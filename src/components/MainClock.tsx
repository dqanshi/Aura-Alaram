import React, { useState, useEffect } from 'react';
import { Alarm, UserPreferences } from '../types';
import { Clock, Bell, Volume2, Shield, Compass, Sun, Moon, Zap, Play } from 'lucide-react';
import { ttsService } from '../services/ttsService';
import { audioSynth } from '../services/audioSynth';
import { formatTimeDisplay } from '../utils/timeFormat';

interface MainClockProps {
  alarms: Alarm[];
  prefs: UserPreferences;
  onOpenCreateModal: () => void;
  onTriggerTestAlarm: (alarm: Alarm) => void;
}

export const MainClock: React.FC<MainClockProps> = ({
  alarms,
  prefs,
  onOpenCreateModal,
  onTriggerTestAlarm,
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const formattedHours = prefs.militaryTime
    ? String(hours).padStart(2, '0')
    : String(hours % 12 || 12).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');
  const ampm = !prefs.militaryTime ? (hours >= 12 ? 'PM' : 'AM') : '';

  // Calculate Next Alarm
  const activeAlarms = alarms.filter(a => a.enabled);
  let nextAlarm: { alarm: Alarm; diffMs: number; diffHours: number; diffMins: number } | null = null;

  if (activeAlarms.length > 0) {
    const nowMinutes = hours * 60 + minutes;
    const sorted = activeAlarms
      .map(a => {
        const [ah, am] = a.time.split(':').map(Number);
        let alarmMinutes = ah * 60 + am;
        if (alarmMinutes <= nowMinutes) {
          alarmMinutes += 24 * 60; // Tomorrow
        }
        const diffMinsTotal = alarmMinutes - nowMinutes;
        return {
          alarm: a,
          diffMs: diffMinsTotal * 60 * 1000 - seconds * 1000,
          diffHours: Math.floor(diffMinsTotal / 60),
          diffMins: diffMinsTotal % 60,
        };
      })
      .sort((a, b) => a.diffMs - b.diffMs);

    nextAlarm = sorted[0] || null;
  }

  // Voice Test
  const handleTestNameCall = () => {
    audioSynth.playUiClick();
    const template = "Commander [Name], Wake up protocol active. System operational.";
    ttsService.speakText(template.replace('[Name]', prefs.commanderName || 'Commander'), {
      pitch: 0.9,
      rate: 1.0,
      voiceURI: prefs.selectedVoiceURI,
    });
  };

  // Solar position calculation simulation
  const isDaytime = hours >= 6 && hours < 19;

  const isDarkMode = prefs.darkMode ?? true;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Central Clock Display Card */}
      <div className={`relative rounded-3xl border p-8 sm:p-12 overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center text-center transition-colors duration-300 ${
        isDarkMode
          ? 'border-cyan-500/30 bg-slate-950/80 text-white shadow-[0_0_50px_rgba(0,240,255,0.08)]'
          : 'border-slate-200 bg-white/90 text-slate-900 shadow-xl'
      }`}>
        {/* Animated Background Mesh Grid */}
        <div className={`absolute inset-0 bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none ${
          isDarkMode
            ? 'bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] opacity-30'
            : 'bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] opacity-40'
        }`} />

        {/* Outer Pulsing Glowing HUD Rings */}
        <div className="absolute w-[280px] h-[280px] sm:w-[420px] sm:h-[420px] rounded-full border border-cyan-500/20 animate-[spin_60s_linear_infinite] pointer-events-none flex items-center justify-center">
          <div className="w-[85%] h-[85%] rounded-full border border-dashed border-cyan-500/30" />
        </div>

        {/* Date / Solar Epoch Header */}
        <div className="z-10 flex items-center space-x-3 mb-4 text-xs font-mono tracking-widest uppercase">
          <span className={`px-3 py-1 rounded-full border flex items-center space-x-1.5 font-bold ${
            isDarkMode
              ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
              : 'bg-cyan-50 border-cyan-300 text-cyan-800'
          }`}>
            {isDaytime ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
            <span>{now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </span>
          <span className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}>•</span>
          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
            EPOCH: {Math.floor(now.getTime() / 1000)}
          </span>
        </div>

        {/* MAIN DIGITAL HUD CLOCK DISPLAY */}
        <div className="z-10 relative my-4 flex items-baseline justify-center font-mono select-none">
          <div className={`text-6xl sm:text-8xl md:text-9xl font-black tracking-tight ${
            isDarkMode 
              ? 'text-white drop-shadow-[0_0_40px_rgba(0,240,255,0.5)]' 
              : 'text-slate-900 drop-shadow-[0_4px_20px_rgba(0,180,216,0.25)]'
          }`}>
            {formattedHours}:{formattedMinutes}
          </div>
          <div className="ml-2 sm:ml-4 flex flex-col items-start space-y-1">
            <span className="text-2xl sm:text-4xl font-bold text-cyan-500 font-mono tracking-wider animate-pulse drop-shadow-[0_0_15px_rgba(0,240,255,0.7)]">
              :{formattedSeconds}
            </span>
            {ampm && (
              <span className={`px-2.5 py-0.5 rounded-lg border text-xs sm:text-sm font-extrabold font-mono shadow-sm ${
                isDarkMode
                  ? 'bg-cyan-950 border-cyan-500/50 text-cyan-300'
                  : 'bg-cyan-100 border-cyan-300 text-cyan-900'
              }`}>
                {ampm}
              </span>
            )}
          </div>
        </div>

        {/* Name Calling Welcome Banner */}
        <div className="z-10 mt-2 flex flex-wrap items-center justify-center gap-3">
          <div className={`px-4 py-1.5 rounded-full border text-xs font-mono flex items-center space-x-2 ${
            isDarkMode
              ? 'bg-slate-900/90 border-slate-800 text-slate-300'
              : 'bg-slate-100 border-slate-300 text-slate-700 shadow-sm'
          }`}>
            <Shield className="w-3.5 h-3.5 text-cyan-500" />
            <span>Target Name: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{prefs.commanderName || 'Alex'}</strong></span>
          </div>

          <button
            onClick={handleTestNameCall}
            className={`px-3.5 py-1.5 rounded-full border font-mono text-xs flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
              isDarkMode
                ? 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-cyan-100 hover:bg-cyan-200 border-cyan-300 text-cyan-900 font-bold'
            }`}
            title="Test Voice Calling Engine Offline"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Voice Greeting</span>
          </button>
        </div>

        {/* Upcoming Alarm Banner */}
        <div className="z-10 mt-8 w-full max-w-md">
          {nextAlarm ? (
            <div className={`p-4 rounded-2xl border flex items-center justify-between text-left transition-all ${
              isDarkMode
                ? 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.15)] text-white'
                : 'bg-cyan-50/80 border-cyan-300 shadow-sm text-slate-900'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl border ${
                  isDarkMode
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                    : 'bg-cyan-200 text-cyan-800 border-cyan-300'
                }`}>
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 tracking-wider">NEXT ALARM PROTOCOL</div>
                  <div className={`text-lg font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {formatTimeDisplay(nextAlarm.alarm.time, prefs.militaryTime)} <span className={`text-xs font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>({nextAlarm.alarm.title})</span>
                  </div>
                  <div className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Triggering in {nextAlarm.diffHours > 0 ? `${nextAlarm.diffHours}h ` : ''}{nextAlarm.diffMins}m
                  </div>
                </div>
              </div>

              <button
                onClick={() => onTriggerTestAlarm(nextAlarm!.alarm)}
                className={`px-3 py-1.5 rounded-xl border font-mono text-xs flex items-center space-x-1 transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50 text-cyan-300'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600 font-bold'
                }`}
                title="Simulate Immediate Alarm Trigger"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Test Trigger</span>
              </button>
            </div>
          ) : (
            <div className={`p-4 rounded-2xl border text-center ${
              isDarkMode
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <p className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>No active alarm protocols scheduled.</p>
              <button
                onClick={onOpenCreateModal}
                className="mt-2 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center justify-center mx-auto space-x-1 cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                <span>+ Program New Alarm Protocol</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stat Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Alarms Tile */}
        <div className={`p-5 rounded-2xl border flex items-center space-x-4 transition-all ${
          isDarkMode
            ? 'border-slate-800 bg-slate-950/70 text-white'
            : 'border-slate-200 bg-white/90 text-slate-900 shadow-sm'
        }`}>
          <div className={`p-3 rounded-xl border ${
            isDarkMode
              ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30'
              : 'bg-cyan-100 text-cyan-800 border-cyan-200'
          }`}>
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-2xl font-bold font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activeAlarms.length}</div>
            <div className={`text-xs font-mono uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Active Protocols</div>
          </div>
        </div>

        {/* Voice Synth Offline Tile */}
        <div className={`p-5 rounded-2xl border flex items-center space-x-4 transition-all ${
          isDarkMode
            ? 'border-slate-800 bg-slate-950/70 text-white'
            : 'border-slate-200 bg-white/90 text-slate-900 shadow-sm'
        }`}>
          <div className={`p-3 rounded-xl border ${
            isDarkMode
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}>
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-300">Web Speech Engine</div>
            <div className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Offline Voice Synthesis</div>
          </div>
        </div>

        {/* Orbit / Solar Status Tile */}
        <div className={`p-5 rounded-2xl border flex items-center space-x-4 transition-all ${
          isDarkMode
            ? 'border-slate-800 bg-slate-950/70 text-white'
            : 'border-slate-200 bg-white/90 text-slate-900 shadow-sm'
        }`}>
          <div className={`p-3 rounded-xl border ${
            isDarkMode
              ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
              : 'bg-amber-100 text-amber-800 border-amber-200'
          }`}>
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-sm font-bold font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {isDaytime ? 'Solar Vector Active' : 'Lunar Cycle Active'}
            </div>
            <div className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {isDaytime ? 'Daylight sync' : 'Nighttime sync'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
