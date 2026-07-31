import React, { useState } from 'react';
import { Alarm, AlarmSoundTone, ChallengeType, SnoozeMode, VoiceGender } from '../types';
import { X, Volume2, Mic, Play, Square, Sparkles, Check, FileText, Brain, Fingerprint, Zap, Calendar, Radio, Trash2 } from 'lucide-react';
import { ttsService } from '../services/ttsService';
import { audioSynth } from '../services/audioSynth';
import { voiceRecorder } from '../services/voiceRecorder';
import { formatTimeDisplay } from '../utils/timeFormat';

interface AlarmModalProps {
  alarm?: Alarm | null;
  commanderName: string;
  onSave: (alarm: Alarm) => void;
  onClose: () => void;
}

const GREETING_PRESETS = [
  'Good morning [Name]. Time to wake up and start your day!',
  'Wake up [Name]! Your alarm is ringing, rise and shine.',
  'Good morning [Name]! Hope you slept well. Time to get moving.',
  'Hello [Name], time to wake up and conquer your goals.',
  'Attention [Name]! Morning alarm active. Time to start the day.'
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

export const AlarmModal: React.FC<AlarmModalProps> = ({
  alarm,
  commanderName,
  onSave,
  onClose,
}) => {
  const [time, setTime] = useState(alarm?.time || '07:30');
  const [title, setTitle] = useState(alarm?.title || 'Morning Alarm');
  const [days, setDays] = useState<number[]>(alarm?.days || [1, 2, 3, 4, 5]);
  const [userName, setUserName] = useState(alarm?.userName || commanderName || 'Alex');
  const [voiceGreeting, setVoiceGreeting] = useState(
    alarm?.voiceGreeting || GREETING_PRESETS[0]
  );
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(alarm?.voiceGender || 'female');
  const [voicePitch, setVoicePitch] = useState(alarm?.voicePitch ?? 0.9);
  const [voiceRate, setVoiceRate] = useState(alarm?.voiceRate ?? 1.0);
  const [soundTone, setSoundTone] = useState<AlarmSoundTone>(alarm?.soundTone || 'cyber_pulse');
  const [volume, setVolume] = useState(alarm?.volume ?? 0.85);
  const [challenge, setChallenge] = useState<ChallengeType>(alarm?.challenge || 'biometric');
  const [challengeDifficulty, setChallengeDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    alarm?.challengeDifficulty || 'medium'
  );
  const [snoozeMode, setSnoozeMode] = useState<SnoozeMode>(alarm?.snoozeMode || 'smart_calendar');
  const [customAudioDataUrl, setCustomAudioDataUrl] = useState<string | undefined>(alarm?.customAudioDataUrl);
  const [memoNote, setMemoNote] = useState(alarm?.memoNote || '');

  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);
  const [stopAudioHandle, setStopAudioHandle] = useState<(() => void) | null>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

  // Toggle day selection
  const toggleDay = (dayNum: number) => {
    audioSynth.playUiClick(700);
    if (days.includes(dayNum)) {
      setDays(days.filter(d => d !== dayNum));
    } else {
      setDays([...days, dayNum].sort());
    }
  };

  // Record Custom Voice Phrase
  const handleStartRecording = async () => {
    try {
      audioSynth.playUiClick(900);
      await voiceRecorder.startRecording();
      setIsRecording(true);
      setRecordingSeconds(0);

      const timer = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
      setRecordingTimer(timer);
    } catch (err) {
      alert('Microphone access permission required to record custom wake-up phrase.');
    }
  };

  const handleStopRecording = async () => {
    audioSynth.playUiClick(500);
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
    setIsRecording(false);

    try {
      const dataUrl = await voiceRecorder.stopRecording();
      setCustomAudioDataUrl(dataUrl);
      audioSynth.playSuccessSound();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlayRecording = () => {
    if (!customAudioDataUrl) return;
    audioSynth.playUiClick(800);
    setIsPlayingRecording(true);
    voiceRecorder.playAudioDataUrl(customAudioDataUrl, () => {
      setIsPlayingRecording(false);
    });
  };

  const handleDeleteRecording = () => {
    audioSynth.playUiClick(400);
    voiceRecorder.stopPlayback();
    setCustomAudioDataUrl(undefined);
    setIsPlayingRecording(false);
  };

  // Test Speech TTS
  const handleTestTTS = () => {
    audioSynth.playUiClick(800);
    const spoken = voiceGreeting.replace(/\[Name\]/gi, userName || 'Friend');
    ttsService.speakText(spoken, {
      gender: voiceGender,
      pitch: voicePitch,
      rate: voiceRate,
    });
  };

  // Test Audio Synth Tone
  const handleToggleTestSound = (toneToTest: AlarmSoundTone) => {
    if (isPlayingTestSound) {
      if (stopAudioHandle) stopAudioHandle();
      setIsPlayingTestSound(false);
      setStopAudioHandle(null);
    } else {
      setSoundTone(toneToTest);
      const stopFn = audioSynth.startAlarmSynth(toneToTest, volume);
      setStopAudioHandle(() => stopFn);
      setIsPlayingTestSound(true);
      setTimeout(() => {
        stopFn();
        setIsPlayingTestSound(false);
        setStopAudioHandle(null);
      }, 2500);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    audioSynth.playSuccessSound();

    if (stopAudioHandle) stopAudioHandle();
    ttsService.stopTTS();

    const updatedAlarm: Alarm = {
      id: alarm?.id || `alarm_${Date.now()}`,
      time,
      title: title.trim() || 'Alarm Protocol',
      enabled: alarm ? alarm.enabled : true,
      days,
      userName: userName.trim() || 'Alex',
      voiceGreeting,
      voiceGender,
      voicePitch,
      voiceRate,
      customAudioDataUrl,
      soundTone,
      volume,
      challenge,
      challengeDifficulty,
      snoozeMode,
      memoNote: memoNote.trim(),
      createdAt: alarm?.createdAt || Date.now(),
    };

    onSave(updatedAlarm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono text-white">
                {alarm ? 'EDIT ALARM PROTOCOL' : 'PROGRAM NEW ALARM PROTOCOL'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">100% Offline Custom Voice & Smart Snooze Protocol</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (stopAudioHandle) stopAudioHandle();
              ttsService.stopTTS();
              voiceRecorder.stopPlayback();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {/* Time Picker & Protocol Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono text-slate-400">TRIGGER TIME</label>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                  {formatTimeDisplay(time, false)}
                </span>
              </div>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-3xl font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">PROTOCOL TITLE</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Orbital Sync"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Repeat Days Selector */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">REPEAT DAYS</label>
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              {DAYS_OF_WEEK.map(({ label, day, full }) => {
                const active = days.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    title={full}
                    className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 1: CUSTOM RECORDED WAKE-UP VOICE PHRASE */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-400 uppercase">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>OFFLINE RECORDED CUSTOM WAKE-UP PHRASE</span>
              </div>
              {customAudioDataUrl && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px]">
                  RECORDING STORED
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 font-mono">
              Record your own custom voice message or motivational phrase offline. When the alarm triggers, your own voice will play back.
            </p>

            {/* Recording Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-mono text-xs flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                  <span>Start Recording Mic</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="px-4 py-2 rounded-xl bg-red-500 text-slate-950 font-mono font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer animate-pulse"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop Recording ({recordingSeconds}s)</span>
                </button>
              )}

              {customAudioDataUrl && !isRecording && (
                <>
                  <button
                    type="button"
                    onClick={handlePlayRecording}
                    className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isPlayingRecording ? 'Playing Recording...' : 'Playback Voice'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteRecording}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete custom phrase"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* SECTION 2: PERSONALIZED SYNTHESIZED NAME CALLING */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-400 uppercase">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>OFFLINE SYNTHESIZED VOCAL NAME CALLING</span>
              </div>
              <button
                type="button"
                onClick={handleTestTTS}
                className="px-3 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center space-x-1 transition-all cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Voice Call</span>
              </button>
            </div>

            {/* Target Commander Name Input */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">COMMANDER / WAKE UP NAME</label>
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="e.g. Commander Sarah"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Voice Gender Selection */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1.5 font-bold">VOICE GENDER TYPE</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'female', label: '👩 Female Voice' },
                  { id: 'male', label: '👨 Male Voice' },
                  { id: 'system', label: '🎙️ Auto System' },
                ].map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => {
                      audioSynth.playUiClick();
                      setVoiceGender(g.id as VoiceGender);
                      if (g.id === 'female') setVoicePitch(1.2);
                      else if (g.id === 'male') setVoicePitch(0.8);
                      else setVoicePitch(1.0);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      voiceGender === g.id
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Voice Greeting Phrase */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono text-slate-400">SYNTHESIZED GREETING TEMPLATE</label>
                <span className="text-[10px] font-mono text-cyan-400">Use [Name] tag</span>
              </div>
              <textarea
                rows={2}
                value={voiceGreeting}
                onChange={e => setVoiceGreeting(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />

              {/* Preset Greeting Chips */}
              <div className="mt-2 flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-[10px] font-mono text-slate-500 shrink-0">Presets:</span>
                {GREETING_PRESETS.map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      audioSynth.playUiClick();
                      setVoiceGreeting(preset);
                    }}
                    className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 shrink-0 cursor-pointer"
                  >
                    Preset {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch & Speed Sliders */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">VOICE PITCH ({voicePitch.toFixed(1)})</label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={voicePitch}
                  onChange={e => setVoicePitch(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">SPEECH RATE ({voiceRate.toFixed(1)}x)</label>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.1"
                  value={voiceRate}
                  onChange={e => setVoiceRate(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: SMART SNOOZE OPTIONS */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-3">
            <label className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>SMART SNOOZE PROTOCOL</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'smart_calendar',
                  name: 'Calendar Event Adaptive',
                  desc: 'Adjusts snooze dynamically based on nearest schedule event',
                },
                {
                  id: 'math_challenge',
                  name: 'Sci-Fi Math Quiz',
                  desc: 'Requires solving a math equation to earn snooze time',
                },
                {
                  id: 'standard_5m',
                  name: 'Standard 5 Minutes',
                  desc: 'Classic fixed 5 minute snooze delay',
                },
              ].map(mode => {
                const isSelected = snoozeMode === mode.id;
                return (
                  <button
                    type="button"
                    key={mode.id}
                    onClick={() => {
                      audioSynth.playUiClick();
                      setSnoozeMode(mode.id as SnoozeMode);
                    }}
                    className={`p-3 rounded-xl text-left font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold mb-1">{mode.name}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{mode.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: PROCEDURAL AUDIO SYNTHESIZER TONE */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center space-x-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>PROCEDURAL SCI-FI ALARM TONE</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'cyber_pulse', name: 'Cyber Pulse' },
                { id: 'quantum_sweep', name: 'Quantum Sweep' },
                { id: 'hyperion_alert', name: 'Hyperion Alert' },
                { id: 'orbital_sunrise', name: 'Orbital Sunrise' },
                { id: 'chrono_matrix', name: 'Chrono Matrix' },
                { id: 'gentle_chime', name: 'Gentle Chime' },
                { id: 'female_vocal_tone', name: 'Female Vocal Hum' },
                { id: 'male_vocal_tone', name: 'Male Vocal Hum' },
                { id: 'energetic_synthwave', name: 'Synthwave Energy' },
                { id: 'laser_alert', name: 'Laser Sweep Alert' },
                { id: 'heavy_sub_bass', name: 'Heavy Sub Bass' },
              ].map(tone => {
                const isSelected = soundTone === tone.id;
                return (
                  <button
                    type="button"
                    key={tone.id}
                    onClick={() => handleToggleTestSound(tone.id as AlarmSoundTone)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>{tone.name}</span>
                    {isSelected && isPlayingTestSound ? (
                      <Square className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: WAKE CHALLENGE DISARM PROTOCOL */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center space-x-2">
              <Brain className="w-4 h-4 text-fuchsia-400" />
              <span>DISARM PROTOCOL WAKE CHALLENGE</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'biometric', name: 'Biometric Grid', icon: Fingerprint },
                { id: 'math', name: 'Sci-Fi Math', icon: Brain },
                { id: 'reflex', name: 'Reflex Speed', icon: Zap },
                { id: 'phrase', name: 'Voice Passphrase', icon: Mic },
              ].map(item => {
                const Icon = item.icon;
                const isSelected = challenge === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      audioSynth.playUiClick();
                      setChallenge(item.id as ChallengeType);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-mono flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/50 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px]">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CHRONO-MEMO NOTE */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>CHRONO-MEMO NOTE (Optional Voice Memo Text)</span>
            </label>
            <input
              type="text"
              value={memoNote}
              onChange={e => setMemoNote(e.target.value)}
              placeholder="e.g., Mission briefing at 09:00 with engineering team"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (stopAudioHandle) stopAudioHandle();
                ttsService.stopTTS();
                voiceRecorder.stopPlayback();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs flex items-center space-x-2 transition-all shadow-lg shadow-cyan-500/25 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>SAVE ALARM PROTOCOL</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

