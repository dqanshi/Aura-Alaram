import React, { useRef, useState } from 'react';
import { Alarm, AlarmSoundTone, ChallengeType, SnoozeMode, VoiceGender } from '../types';
import {
  X, Volume2, Mic, Play, Square, Sparkles, Check, FileText, Brain,
  Fingerprint, Zap, Calendar, Radio, Trash2, FolderOpen, TrendingUp, Ban,
} from 'lucide-react';
import { ttsService } from '../services/ttsService';
import { audioSynth } from '../services/audioSynth';
import { voiceRecorder } from '../services/voiceRecorder';
import { formatTimeDisplay } from '../utils/timeFormat';

interface AlarmModalProps {
  alarm?: Alarm | null;
  userName: string; // global wake-up name from preferences
  onSave: (alarm: Alarm) => void;
  onClose: () => void;
}

const GREETING_PRESETS = [
  'Good morning [Name]. Time to wake up and start your day!',
  'Wake up [Name]! Your alarm is ringing, rise and shine.',
  'Good morning [Name]! Hope you slept well. Time to get moving.',
  'Hello [Name], time to wake up and conquer your goals.',
  'Hey [Name]! Morning alarm is active. Time to start the day.',
];

const DAYS_OF_WEEK = [
  { label: 'S', day: 0, full: 'Sun' },
  { label: 'M', day: 1, full: 'Mon' },
  { label: 'T', day: 2, full: 'Tue' },
  { label: 'W', day: 3, full: 'Wed' },
  { label: 'T', day: 4, full: 'Thu' },
  { label: 'F', day: 5, full: 'Fri' },
  { label: 'S', day: 6, full: 'Sat' },
];

// ── Tone catalogue ───────────────────────────────────────────────────────────
const TONE_GROUPS: { label: string; color: string; tones: { id: AlarmSoundTone; name: string }[] }[] = [
  {
    label: 'Samsung',
    color: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
    tones: [
      { id: 'samsung_horizon',    name: 'Over the Horizon' },
      { id: 'samsung_homecoming', name: 'Homecoming'       },
      { id: 'samsung_morning',    name: 'Morning Light'    },
    ],
  },
  {
    label: 'Xiaomi',
    color: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
    tones: [
      { id: 'xiaomi_miui',    name: 'MIUI Default' },
      { id: 'xiaomi_bubbly',  name: 'Bubbly'       },
      { id: 'xiaomi_digital', name: 'Digital Ring' },
    ],
  },
  {
    label: 'iPhone',
    color: 'text-slate-300 border-slate-500/40 bg-slate-500/10',
    tones: [
      { id: 'iphone_radar',      name: 'Radar'      },
      { id: 'iphone_apex',       name: 'Apex'       },
      { id: 'iphone_reflection', name: 'Reflection' },
      { id: 'iphone_marimba',    name: 'Marimba'    },
    ],
  },
  {
    label: 'Classic',
    color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    tones: [
      { id: 'classic_beep',   name: 'Classic Beep'   },
      { id: 'morning_bells',  name: 'Morning Bells'  },
      { id: 'gentle_chime',   name: 'Gentle Chime'   },
      { id: 'orbital_sunrise', name: 'Orbital Sunrise' },
    ],
  },
  {
    label: 'Synth',
    color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    tones: [
      { id: 'cyber_pulse',       name: 'Cyber Pulse'    },
      { id: 'quantum_sweep',     name: 'Quantum Sweep'  },
      { id: 'hyperion_alert',    name: 'Hyperion Alert' },
      { id: 'chrono_matrix',     name: 'Chrono Matrix'  },
      { id: 'energetic_synthwave', name: 'Synthwave'    },
      { id: 'laser_alert',       name: 'Laser Alert'    },
      { id: 'heavy_sub_bass',    name: 'Sub Bass'       },
      { id: 'female_vocal_tone', name: 'Female Hum'     },
      { id: 'male_vocal_tone',   name: 'Male Hum'       },
    ],
  },
];

export const AlarmModal: React.FC<AlarmModalProps> = ({
  alarm,
  userName,
  onSave,
  onClose,
}) => {
  const [time,   setTime]  = useState(alarm?.time  || '07:30');
  const [title,  setTitle] = useState(alarm?.title || 'Morning Alarm');
  const [days,   setDays]  = useState<number[]>(alarm?.days || [1, 2, 3, 4, 5]);

  const [wakeUpName, setWakeUpName] = useState(alarm?.userName || userName || 'Anshif');
  const [voiceGreeting, setVoiceGreeting] = useState(alarm?.voiceGreeting || GREETING_PRESETS[0]);
  const [voiceGender,   setVoiceGender]   = useState<VoiceGender>(alarm?.voiceGender || 'female');
  const [voicePitch,    setVoicePitch]    = useState(alarm?.voicePitch ?? 0.9);
  const [voiceRate,     setVoiceRate]     = useState(alarm?.voiceRate  ?? 1.0);

  const [soundTone, setSoundTone] = useState<AlarmSoundTone>(alarm?.soundTone || 'samsung_horizon');
  const [volume,    setVolume]    = useState(alarm?.volume    ?? 0.85);
  const [volumeFadeIn, setVolumeFadeIn] = useState(alarm?.volumeFadeIn ?? false);

  const [storageToneDataUrl,  setStorageToneDataUrl]  = useState<string | undefined>(alarm?.storageToneDataUrl);
  const [storageToneFileName, setStorageToneFileName] = useState<string | undefined>(alarm?.storageToneFileName);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const storageFileInputRef = useRef<HTMLInputElement>(null);

  const [challenge,           setChallenge]           = useState<ChallengeType>(alarm?.challenge || 'biometric');
  const [challengeDifficulty, setChallengeDifficulty] = useState<'easy'|'medium'|'hard'>(alarm?.challengeDifficulty || 'medium');
  const [snoozeMode, setSnoozeMode] = useState<SnoozeMode>(alarm?.snoozeMode || 'standard_5m');

  const [customAudioDataUrl, setCustomAudioDataUrl] = useState<string | undefined>(alarm?.customAudioDataUrl);
  const [memoNote,           setMemoNote]           = useState(alarm?.memoNote || '');

  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);
  const [stopAudioHandle,    setStopAudioHandle]    = useState<(() => void) | null>(null);

  const [isRecording,      setIsRecording]      = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingTimer,   setRecordingTimer]   = useState<ReturnType<typeof setInterval> | null>(null);
  const [isPlayingRec,     setIsPlayingRec]     = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const toggleDay = (dayNum: number) => {
    audioSynth.playUiClick(700);
    setDays(prev => prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum].sort());
  };

  // ── Storage file ───────────────────────────────────────────────────────────

  const handlePickFile = () => storageFileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoadingFile(true);
    audioSynth.playUiClick(900);
    const reader = new FileReader();
    reader.onload = () => {
      setStorageToneDataUrl(reader.result as string);
      setStorageToneFileName(file.name);
      setSoundTone('storage_file');
      setIsLoadingFile(false);
      audioSynth.playSuccessSound();
    };
    reader.onerror = () => { setIsLoadingFile(false); alert('Could not read the audio file.'); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    audioSynth.playUiClick(400);
    setStorageToneDataUrl(undefined);
    setStorageToneFileName(undefined);
    setSoundTone('samsung_horizon');
  };

  // ── Recording ──────────────────────────────────────────────────────────────

  const handleStartRecording = async () => {
    try {
      audioSynth.playUiClick(900);
      await voiceRecorder.startRecording();
      setIsRecording(true); setRecordingSeconds(0);
      setRecordingTimer(setInterval(() => setRecordingSeconds(s => s + 1), 1000));
    } catch { alert('Microphone permission required.'); }
  };

  const handleStopRecording = async () => {
    audioSynth.playUiClick(500);
    if (recordingTimer) { clearInterval(recordingTimer); setRecordingTimer(null); }
    setIsRecording(false);
    try {
      setCustomAudioDataUrl(await voiceRecorder.stopRecording());
      audioSynth.playSuccessSound();
    } catch (err) { console.error(err); }
  };

  // ── Tone test ──────────────────────────────────────────────────────────────

  const handleToggleTone = (toneToTest: AlarmSoundTone) => {
    if (isPlayingTestSound) {
      stopAudioHandle?.();
      setIsPlayingTestSound(false); setStopAudioHandle(null);
    } else {
      setSoundTone(toneToTest);
      const stopFn = audioSynth.startAlarmSynth(
        toneToTest, volume, false,
        toneToTest === 'storage_file' ? storageToneDataUrl : undefined
      );
      setStopAudioHandle(() => stopFn);
      setIsPlayingTestSound(true);
      setTimeout(() => { stopFn(); setIsPlayingTestSound(false); setStopAudioHandle(null); }, 2500);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    audioSynth.playSuccessSound();
    stopAudioHandle?.();
    ttsService.stopTTS();

    const saved: Alarm = {
      id: alarm?.id || `alarm_${Date.now()}`,
      time,
      title: title.trim() || 'Alarm',
      enabled: alarm ? alarm.enabled : true,
      days,
      userName: wakeUpName.trim() || 'Anshif',
      voiceGreeting,
      voiceGender,
      voicePitch,
      voiceRate,
      customAudioDataUrl,
      soundTone,
      storageToneDataUrl,
      storageToneFileName,
      volume,
      volumeFadeIn,
      challenge,
      challengeDifficulty,
      snoozeMode,
      memoNote: memoNote.trim(),
      createdAt: alarm?.createdAt || Date.now(),
    };
    onSave(saved);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">

        {/* hidden file input */}
        <input ref={storageFileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono text-white">
                {alarm ? 'EDIT ALARM' : 'NEW ALARM'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">Offline voice alarm with custom tone</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { stopAudioHandle?.(); ttsService.stopTTS(); voiceRecorder.stopPlayback(); onClose(); }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-6">

          {/* Time + Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono text-slate-400">TRIGGER TIME</label>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                  {formatTimeDisplay(time, false)}
                </span>
              </div>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-3xl font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">ALARM TITLE</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Morning Alarm"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Repeat Days */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">REPEAT DAYS</label>
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              {DAYS_OF_WEEK.map(({ label, day, full }) => (
                <button type="button" key={day} onClick={() => toggleDay(day)} title={full}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    days.includes(day)
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Recorded Voice */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-400 uppercase">
                <Mic className="w-4 h-4" /><span>CUSTOM RECORDED WAKE-UP VOICE</span>
              </div>
              {customAudioDataUrl && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px]">STORED</span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">Record your own voice to play when the alarm rings.</p>
            <div className="flex flex-wrap items-center gap-3">
              {!isRecording ? (
                <button type="button" onClick={handleStartRecording}
                  className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-mono text-xs flex items-center space-x-2 cursor-pointer">
                  <Radio className="w-4 h-4 text-red-400 animate-pulse" /><span>Start Recording</span>
                </button>
              ) : (
                <button type="button" onClick={handleStopRecording}
                  className="px-4 py-2 rounded-xl bg-red-500 text-slate-950 font-mono font-bold text-xs flex items-center space-x-2 cursor-pointer animate-pulse">
                  <Square className="w-4 h-4 fill-current" /><span>Stop ({recordingSeconds}s)</span>
                </button>
              )}
              {customAudioDataUrl && !isRecording && (
                <>
                  <button type="button" onClick={() => { setIsPlayingRec(true); voiceRecorder.playAudioDataUrl(customAudioDataUrl, () => setIsPlayingRec(false)); }}
                    className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center space-x-2 cursor-pointer">
                    <Play className="w-3.5 h-3.5 fill-current" /><span>{isPlayingRec ? 'Playing…' : 'Playback'}</span>
                  </button>
                  <button type="button" onClick={() => { voiceRecorder.stopPlayback(); setCustomAudioDataUrl(undefined); setIsPlayingRec(false); }}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Section: TTS Voice */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-400 uppercase">
                <Volume2 className="w-4 h-4" /><span>VOICE GREETING (TTS)</span>
              </div>
              <button type="button" onClick={() => {
                audioSynth.playUiClick(800);
                ttsService.speakText(voiceGreeting.replace(/\[Name\]/gi, wakeUpName || 'Anshif'), { gender: voiceGender, pitch: voicePitch, rate: voiceRate });
              }} className="px-3 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center space-x-1 cursor-pointer">
                <Volume2 className="w-3.5 h-3.5" /><span>Test Voice</span>
              </button>
            </div>

            {/* Wake-up name */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">WAKE-UP NAME</label>
              <input type="text" value={wakeUpName} onChange={e => setWakeUpName(e.target.value)} placeholder="e.g. Anshif"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1.5 font-bold">VOICE GENDER</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'female', label: '👩 Female' },
                  { id: 'male',   label: '👨 Male'   },
                  { id: 'system', label: '🎙️ Auto'   },
                ].map(g => (
                  <button type="button" key={g.id}
                    onClick={() => {
                      audioSynth.playUiClick();
                      setVoiceGender(g.id as VoiceGender);
                      if (g.id === 'female') setVoicePitch(1.2);
                      else if (g.id === 'male') setVoicePitch(0.8);
                      else setVoicePitch(1.0);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      voiceGender === g.id ? 'bg-cyan-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Greeting text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono text-slate-400">GREETING TEXT</label>
                <span className="text-[10px] font-mono text-cyan-400">Use [Name] tag</span>
              </div>
              <textarea rows={2} value={voiceGreeting} onChange={e => setVoiceGreeting(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <div className="mt-2 flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-[10px] font-mono text-slate-500 shrink-0">Presets:</span>
                {GREETING_PRESETS.map((p, i) => (
                  <button type="button" key={i} onClick={() => { audioSynth.playUiClick(); setVoiceGreeting(p); }}
                    className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 shrink-0 cursor-pointer">
                    P{i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch + Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">PITCH ({voicePitch.toFixed(1)})</label>
                <input type="range" min="0.5" max="1.5" step="0.1" value={voicePitch} onChange={e => setVoicePitch(parseFloat(e.target.value))} className="w-full accent-cyan-400 cursor-pointer" />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">SPEED ({voiceRate.toFixed(1)}x)</label>
                <input type="range" min="0.7" max="1.5" step="0.1" value={voiceRate} onChange={e => setVoiceRate(parseFloat(e.target.value))} className="w-full accent-cyan-400 cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Section: Snooze */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-3">
            <label className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center space-x-2">
              <Calendar className="w-4 h-4" /><span>SNOOZE MODE</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'smart_calendar', name: 'Calendar Adaptive', desc: 'Adjusts based on your next event' },
                { id: 'math_challenge', name: 'Math Quiz Snooze',  desc: 'Solve a problem to earn snooze' },
                { id: 'standard_5m',   name: 'Standard 5 min',    desc: 'Classic 5 minute snooze' },
              ].map(m => (
                <button type="button" key={m.id} onClick={() => { audioSynth.playUiClick(); setSnoozeMode(m.id as SnoozeMode); }}
                  className={`p-3 rounded-xl text-left font-mono transition-all cursor-pointer ${
                    snoozeMode === m.id ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold mb-1">{m.name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Alarm Tone + Volume */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-400" /><span>ALARM TONE</span>
            </label>

            {/* Grouped tones */}
            {TONE_GROUPS.map(group => (
              <div key={group.label}>
                <div className={`text-[10px] font-mono font-bold uppercase mb-1.5 px-1 ${group.color.split(' ')[0]}`}>
                  {group.label}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.tones.map(tone => {
                    const isSelected = soundTone === tone.id;
                    return (
                      <button type="button" key={tone.id} onClick={() => handleToggleTone(tone.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition-all cursor-pointer ${
                          isSelected ? `${group.color} border font-bold` : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <span>{tone.name}</span>
                        {isSelected && isPlayingTestSound
                          ? <Square className="w-3.5 h-3.5 fill-current" />
                          : <Play className="w-3.5 h-3.5 text-slate-500" />
                        }
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Storage File */}
            <div className={`p-3.5 rounded-2xl border transition-all ${soundTone === 'storage_file' ? 'bg-violet-500/10 border-violet-500/50' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <FolderOpen className={`w-4 h-4 ${soundTone === 'storage_file' ? 'text-violet-400' : 'text-slate-400'}`} />
                  <span className={`text-xs font-mono font-bold ${soundTone === 'storage_file' ? 'text-violet-300' : 'text-slate-400'}`}>
                    AUDIO FROM STORAGE
                  </span>
                  {soundTone === 'storage_file' && (
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 font-mono text-[10px]">ACTIVE</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handlePickFile} disabled={isLoadingFile}
                    className="px-3 py-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-300 font-mono text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50">
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{isLoadingFile ? 'Loading…' : storageToneDataUrl ? 'Change File' : 'Pick Audio File'}</span>
                  </button>
                  {storageToneDataUrl && (
                    <>
                      <button type="button" onClick={() => handleToggleTone('storage_file')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center space-x-1 cursor-pointer">
                        <Play className="w-3.5 h-3.5" /><span>Preview</span>
                      </button>
                      <button type="button" onClick={handleRemoveFile} className="p-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-red-400 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {storageToneFileName && <p className="mt-2 text-[11px] font-mono text-slate-400 truncate">📄 {storageToneFileName}</p>}
              {!storageToneDataUrl && <p className="mt-1.5 text-[10px] font-mono text-slate-500">Pick any MP3, WAV, OGG, or M4A from your phone storage.</p>}
            </div>

            {/* Volume + Fade-in */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">ALARM VOLUME ({Math.round(volume * 100)}%)</label>
                <input type="range" min="0.1" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
              <button type="button" onClick={() => { audioSynth.playUiClick(); setVolumeFadeIn(v => !v); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                  volumeFadeIn ? 'bg-amber-500/15 border-amber-500/50 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" /><span>GRADUAL VOLUME INCREASE (FADE-IN)</span>
                </div>
                <div className={`w-9 h-5 rounded-full relative flex items-center px-0.5 ${volumeFadeIn ? 'bg-amber-500' : 'bg-slate-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${volumeFadeIn ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
              {volumeFadeIn && <p className="text-[10px] font-mono text-amber-400/70 pl-1">Starts at 10% and rises to {Math.round(volume * 100)}% over 60 seconds.</p>}
            </div>
          </div>

          {/* Section: Wake Challenge */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center space-x-2">
              <Brain className="w-4 h-4 text-fuchsia-400" /><span>WAKE CHALLENGE (to dismiss alarm)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'none',      name: 'None (Tap to Stop)', icon: Ban       },
                { id: 'biometric', name: 'Biometric Grid',     icon: Fingerprint },
                { id: 'math',      name: 'Math Problem',       icon: Brain       },
                { id: 'reflex',    name: 'Reflex Speed',       icon: Zap         },
                { id: 'phrase',    name: 'Type Passphrase',    icon: Mic         },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button type="button" key={item.id} onClick={() => { audioSynth.playUiClick(); setChallenge(item.id as ChallengeType); }}
                    className={`p-2.5 rounded-xl text-xs font-mono flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                      challenge === item.id
                        ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/50 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] text-center leading-tight">{item.name}</span>
                  </button>
                );
              })}
            </div>
            {challenge === 'none' && (
              <p className="text-[10px] font-mono text-slate-500 pl-1">Alarm will stop as soon as you tap the dismiss button — no challenge required.</p>
            )}
          </div>

          {/* Memo Note */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5" /><span>MEMO NOTE (optional)</span>
            </label>
            <input type="text" value={memoNote} onChange={e => setMemoNote(e.target.value)}
              placeholder="e.g., Meeting at 09:00 with team"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button type="button" onClick={() => { stopAudioHandle?.(); ttsService.stopTTS(); voiceRecorder.stopPlayback(); onClose(); }}
              className="px-5 py-2.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit"
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs flex items-center space-x-2 transition-all shadow-lg shadow-cyan-500/25 cursor-pointer">
              <Check className="w-4 h-4" /><span>SAVE ALARM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
