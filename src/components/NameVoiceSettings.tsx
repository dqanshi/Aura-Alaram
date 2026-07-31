import React, { useState, useEffect } from 'react';
import { UserPreferences, VoiceGender } from '../types';
import { Volume2, Mic, Play, Check, User, Users } from 'lucide-react';
import { ttsService } from '../services/ttsService';
import { audioSynth } from '../services/audioSynth';

interface NameVoiceSettingsProps {
  prefs: UserPreferences;
  onUpdatePrefs: (newPrefs: UserPreferences) => void;
}

export const NameVoiceSettings: React.FC<NameVoiceSettingsProps> = ({ prefs, onUpdatePrefs }) => {
  const [userName,        setUserName]       = useState(prefs.commanderName || 'Anshif');
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(prefs.selectedVoiceURI || '');
  const [voiceGender,     setVoiceGender]    = useState<VoiceGender>(prefs.voiceGender || 'female');
  const [militaryTime,    setMilitaryTime]   = useState(prefs.militaryTime ?? false);
  const [ttsEnabled,      setTtsEnabled]     = useState(prefs.ttsEnabled ?? true);
  const [categorized, setCategorized] = useState<{
    female: SpeechSynthesisVoice[];
    male:   SpeechSynthesisVoice[];
    other:  SpeechSynthesisVoice[];
  }>({ female: [], male: [], other: [] });
  const [allVoices,    setAllVoices]    = useState<SpeechSynthesisVoice[]>([]);
  const [testText,     setTestText]     = useState('Good morning [Name]. Time to wake up and start your day.');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setAllVoices(ttsService.getVoices());
    setCategorized(ttsService.getCategorizedVoices());
  }, []);

  const handleTestSpeech = (genderOverride?: VoiceGender, uriOverride?: string) => {
    audioSynth.playUiClick(800);
    const gender = genderOverride ?? voiceGender;
    const uri    = uriOverride !== undefined ? uriOverride : selectedVoiceURI;
    const spoken = testText.replace(/\[Name\]/gi, userName || 'Anshif');
    ttsService.speakText(spoken, {
      voiceURI: uri,
      gender,
      pitch: gender === 'female' ? 1.2 : gender === 'male' ? 0.8 : 1.0,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    audioSynth.playSuccessSound();
    onUpdatePrefs({
      ...prefs,
      commanderName: userName.trim() || 'Anshif',
      selectedVoiceURI,
      voiceGender,
      militaryTime,
      ttsEnabled,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const isDarkMode = prefs.darkMode ?? true;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full font-mono text-xs uppercase border ${
          isDarkMode ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-cyan-100 border-cyan-300 text-cyan-800 font-bold'
        }`}>
          <Mic className="w-3.5 h-3.5" />
          <span>VOICE ENGINE CONFIGURATION</span>
        </div>
        <h2 className={`text-xl font-bold font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>FEMALE & MALE VOICE PROFILES</h2>
        <p className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Select Female or Male voice, test samples live, and set your wake-up name.
        </p>
      </div>

      <form onSubmit={handleSave} className={`p-6 rounded-3xl border space-y-6 shadow-xl transition-all ${
        isDarkMode ? 'border-slate-800 bg-slate-950/80 text-white' : 'border-slate-200 bg-white/90 text-slate-900'
      }`}>

        {/* Wake-up Name */}
        <div>
          <label className={`block text-xs font-mono mb-2 flex items-center space-x-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700 font-bold'}`}>
            <User className="w-4 h-4 text-cyan-500" />
            <span>YOUR NAME (Spoken during alarm)</span>
          </label>
          <input
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="e.g. Anshif, Sarah, John"
            required
            className={`w-full px-4 py-3 rounded-2xl border text-lg font-mono focus:outline-none focus:border-cyan-500 ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>

        {/* Voice Gender Cards */}
        <div>
          <label className={`block text-xs font-mono mb-2 font-bold uppercase ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            VOICE GENDER SELECTION
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Female */}
            <button
              type="button"
              onClick={() => {
                audioSynth.playUiClick(900);
                setVoiceGender('female');
                if (categorized.female.length > 0) setSelectedVoiceURI(categorized.female[0].voiceURI);
              }}
              className={`p-4 rounded-2xl border text-left font-mono transition-all cursor-pointer ${
                voiceGender === 'female'
                  ? 'bg-fuchsia-950/40 border-fuchsia-500/60 text-fuchsia-300 ring-2 ring-fuchsia-500/30'
                  : isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm flex items-center space-x-2">
                  <User className="w-4 h-4 text-fuchsia-500" />
                  <span>FEMALE VOICE</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-500 font-bold">{categorized.female.length} found</span>
              </div>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>High-frequency crisp female vocal tone</p>
              <div onClick={e => { e.stopPropagation(); handleTestSpeech('female'); }} className="mt-3 inline-flex items-center space-x-1 text-xs text-fuchsia-500 font-bold hover:underline">
                <Play className="w-3 h-3 fill-current" /><span>Test Female</span>
              </div>
            </button>

            {/* Male */}
            <button
              type="button"
              onClick={() => {
                audioSynth.playUiClick(700);
                setVoiceGender('male');
                if (categorized.male.length > 0) setSelectedVoiceURI(categorized.male[0].voiceURI);
              }}
              className={`p-4 rounded-2xl border text-left font-mono transition-all cursor-pointer ${
                voiceGender === 'male'
                  ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 ring-2 ring-cyan-500/30'
                  : isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm flex items-center space-x-2">
                  <User className="w-4 h-4 text-cyan-500" />
                  <span>MALE VOICE</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-500 font-bold">{categorized.male.length} found</span>
              </div>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Deep resonant low-frequency male voice</p>
              <div onClick={e => { e.stopPropagation(); handleTestSpeech('male'); }} className="mt-3 inline-flex items-center space-x-1 text-xs text-cyan-500 font-bold hover:underline">
                <Play className="w-3 h-3 fill-current" /><span>Test Male</span>
              </div>
            </button>

            {/* System Auto */}
            <button
              type="button"
              onClick={() => { audioSynth.playUiClick(800); setVoiceGender('system'); setSelectedVoiceURI(''); }}
              className={`p-4 rounded-2xl border text-left font-mono transition-all cursor-pointer ${
                voiceGender === 'system'
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 ring-2 ring-emerald-500/30'
                  : isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm flex items-center space-x-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>SYSTEM AUTO</span>
                </span>
              </div>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Auto-select system default speech engine</p>
              <div onClick={e => { e.stopPropagation(); handleTestSpeech('system', ''); }} className="mt-3 inline-flex items-center space-x-1 text-xs text-emerald-500 font-bold hover:underline">
                <Play className="w-3 h-3 fill-current" /><span>Test Auto</span>
              </div>
            </button>
          </div>
        </div>

        {/* Voice Engine Picker */}
        <div>
          <label className={`block text-xs font-mono mb-2 flex items-center justify-between ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            <span>SPECIFIC VOICE ENGINE</span>
            <span className="text-[10px] text-cyan-500 font-bold">{allVoices.length} voices available</span>
          </label>
          <select
            value={selectedVoiceURI}
            onChange={e => setSelectedVoiceURI(e.target.value)}
            className={`w-full px-4 py-3 rounded-2xl border text-xs font-mono focus:outline-none focus:border-cyan-500 ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <option value="">-- Default Device Voice --</option>
            {categorized.female.length > 0 && (
              <optgroup label="--- FEMALE VOICES ---">
                {categorized.female.map((v, i) => <option key={`f_${i}`} value={v.voiceURI}>👩 {v.name} ({v.lang})</option>)}
              </optgroup>
            )}
            {categorized.male.length > 0 && (
              <optgroup label="--- MALE VOICES ---">
                {categorized.male.map((v, i) => <option key={`m_${i}`} value={v.voiceURI}>👨 {v.name} ({v.lang})</option>)}
              </optgroup>
            )}
            {categorized.other.length > 0 && (
              <optgroup label="--- OTHER VOICES ---">
                {categorized.other.map((v, i) => <option key={`o_${i}`} value={v.voiceURI}>🎙️ {v.name} ({v.lang})</option>)}
              </optgroup>
            )}
          </select>
        </div>

        {/* 24h Toggle */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <div>
            <div className={`text-xs font-bold font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>24-HOUR TIME DISPLAY</div>
            <div className={`text-[11px] font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Show 07:00 vs 7:00 AM format</div>
          </div>
          <button
            type="button"
            onClick={() => { audioSynth.playUiClick(); setMilitaryTime(!militaryTime); }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              militaryTime ? 'bg-cyan-500' : isDarkMode ? 'bg-slate-800' : 'bg-slate-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${militaryTime ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Voice Announcement Toggle */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div>
            <div className={`text-xs font-bold font-mono ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              VOICE ANNOUNCEMENT
            </div>
            <div className={`text-[11px] font-mono ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Enable or disable spoken alarm messages.
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              audioSynth.playUiClick();
              setTtsEnabled(!ttsEnabled);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              ttsEnabled ? 'bg-cyan-500' : (isDarkMode ? 'bg-slate-800' : 'bg-slate-300')
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                ttsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Live tester */}
        <div className={`p-4 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <label className={`text-xs font-mono font-bold uppercase ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            LIVE VOICE TESTER
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={testText}
              onChange={e => setTestText(e.target.value)}
              className={`flex-1 px-3.5 py-2 rounded-xl border text-xs font-mono focus:outline-none ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800'
              }`}
            />
            <button
              type="button"
              onClick={() => handleTestSpeech()}
              className={`px-4 py-2 rounded-xl border font-mono text-xs flex items-center justify-center space-x-1 cursor-pointer ${
                isDarkMode
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-300'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600 font-bold'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Test Speech</span>
            </button>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          {savedSuccess && (
            <span className="text-xs font-mono text-emerald-500 font-bold flex items-center space-x-1">
              <Check className="w-4 h-4" /><span>SAVED</span>
            </span>
          )}
          <button
            type="submit"
            className={`px-6 py-2.5 rounded-2xl font-mono font-bold text-xs shadow-lg transition-all cursor-pointer ${
              isDarkMode ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25' : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-md'
            }`}
          >
            SAVE PREFERENCES
          </button>
        </div>
      </form>
    </div>
  );
};
