import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { Cpu, Menu, X, Moon, Sun, Clock, Sparkles, Mic } from 'lucide-react';
import { audioSynth } from '../services/audioSynth';

interface CyberHeaderProps {
  prefs: UserPreferences;
  onUpdatePrefs: (newPrefs: UserPreferences) => void;
  activeTab: 'clock' | 'voice';
  setActiveTab: (tab: 'clock' | 'voice') => void;
  activeAlarmCount: number;
}

export const CyberHeader: React.FC<CyberHeaderProps> = ({
  prefs,
  onUpdatePrefs,
  activeTab,
  setActiveTab,
  activeAlarmCount,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isDarkMode = prefs.darkMode ?? true;

  const toggleDarkMode = () => {
    audioSynth.playUiClick(950);
    onUpdatePrefs({ ...prefs, darkMode: !isDarkMode });
  };

  const toggle12hMode = () => {
    audioSynth.playUiClick(850);
    onUpdatePrefs({ ...prefs, militaryTime: !prefs.militaryTime });
  };

  const handleTabChange = (tab: 'clock' | 'voice') => {
    audioSynth.playUiClick(900);
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <header className={`w-full border-b sticky top-0 z-30 transition-colors duration-300 ${
      isDarkMode 
        ? 'border-cyan-500/20 bg-slate-950/90 backdrop-blur-2xl shadow-[0_4px_25px_rgba(0,240,255,0.06)]' 
        : 'border-slate-200 bg-white/90 backdrop-blur-2xl shadow-sm text-slate-900'
    }`}>
      {/* High-Graphics Accent Line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Title Only */}
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
            isDarkMode 
              ? 'bg-cyan-950/90 border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]' 
              : 'bg-cyan-50 border-cyan-200 text-cyan-600'
          }`}>
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <h1 className={`text-lg font-black tracking-widest font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            AURA <span className="text-cyan-400 drop-shadow-[0_0_12px_rgba(0,240,255,0.8)]">ALARM</span>
          </h1>
        </div>

        {/* Header Right Actions: Dark Mode Toggle & Menu Icon */}
        <div className="flex items-center space-x-2">
          {/* Dark Mode Toggle (On/Off) */}
          <button
            onClick={toggleDarkMode}
            className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-slate-900 border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle Dark / Light Mode"
          >
            {isDarkMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">DARK MODE</span>
                <span className="px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 text-[10px] font-bold">ON</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">DARK MODE</span>
                <span className="px-1 py-0.2 rounded bg-slate-200 text-slate-600 text-[10px] font-bold">OFF</span>
              </>
            )}
          </button>

          {/* Menu Button */}
          <button
            onClick={() => {
              audioSynth.playUiClick(800);
              setIsMenuOpen(!isMenuOpen);
            }}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-slate-900 border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            aria-label="Toggle Menu"
            title="Open Menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu Dropdown Modal / Drawer */}
      {isMenuOpen && (
        <div className={`border-b transition-all ${
          isDarkMode
            ? 'bg-slate-950/95 border-cyan-500/30 text-white'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-lg'
        }`}>
          <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleTabChange('clock')}
              className={`p-3 rounded-2xl border flex items-center space-x-3 transition-all cursor-pointer ${
                activeTab === 'clock'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : isDarkMode
                  ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <div className="text-left">
                <div className="text-xs font-mono font-bold">CLOCK & ALARMS</div>
                <div className="text-[10px] opacity-70 font-mono">
                  {activeAlarmCount} Active Alarm{activeAlarmCount !== 1 ? 's' : ''}
                </div>
              </div>
            </button>

            <button
              onClick={() => handleTabChange('voice')}
              className={`p-3 rounded-2xl border flex items-center space-x-3 transition-all cursor-pointer ${
                activeTab === 'voice'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : isDarkMode
                  ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Mic className="w-5 h-5 text-cyan-400" />
              <div className="text-left">
                <div className="text-xs font-mono font-bold">VOICE SETUP</div>
                <div className="text-[10px] opacity-70 font-mono">Female & Male Voice Config</div>
              </div>
            </button>

            <button
              onClick={toggle12hMode}
              className={`p-3 rounded-2xl border flex items-center space-x-3 transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-5 h-5 text-cyan-400" />
              <div className="text-left">
                <div className="text-xs font-mono font-bold">TIME FORMAT</div>
                <div className="text-[10px] text-cyan-400 font-mono font-bold">
                  {prefs.militaryTime ? '24-Hour Military' : '12-Hour (AM/PM)'}
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};


