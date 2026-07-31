import React, { useState, useEffect } from 'react';
import { Alarm } from '../types';
import { Volume2, ShieldAlert, Sparkles, CheckCircle2, RotateCcw, Zap, Brain, Fingerprint, Mic, CloudSun, Calendar } from 'lucide-react';
import { ttsService } from '../services/ttsService';
import { audioSynth } from '../services/audioSynth';
import { voiceRecorder } from '../services/voiceRecorder';
import { loadOfflineWeather } from '../services/weatherService';
import { loadCalendarEvents, calculateSmartSnooze } from '../services/calendarService';
import { formatTimeDisplay } from '../utils/timeFormat';
import confetti from 'canvas-confetti';

interface AlarmTriggerOverlayProps {
  alarm: Alarm;
  onDismiss: () => void;
  onSnooze: (customSnoozeMinutes?: number) => void;
}

export const AlarmTriggerOverlay: React.FC<AlarmTriggerOverlayProps> = ({
  alarm,
  onDismiss,
  onSnooze,
}) => {
  const [isDisarmed, setIsDisarmed] = useState(false);
  const [weatherData] = useState(() => loadOfflineWeather());

  // Snooze Math Quiz State
  const [showSnoozeMathQuiz, setShowSnoozeMathQuiz] = useState(false);
  const [snoozeMathQuestion, setSnoozeMathQuestion] = useState({ num1: 7, num2: 8, answer: 15 });
  const [snoozeMathInput, setSnoozeMathInput] = useState('');
  const [snoozeMathError, setSnoozeMathError] = useState(false);

  // Smart Snooze Calendar Status
  const [smartSnoozeInfo, setSmartSnoozeInfo] = useState<{ minutes: number; eventTitle: string; eventTime: string } | null>(null);

  // Disarm Math Challenge State
  const [mathQuestion, setMathQuestion] = useState<{ num1: number; num2: number; answer: number }>({ num1: 12, num2: 15, answer: 27 });
  const [mathInput, setMathInput] = useState('');
  const [mathError, setMathError] = useState(false);

  // Biometric Challenge State (3x3 grid)
  const [biometricTarget] = useState([1, 4, 7, 8]); // L pattern
  const [biometricSelected, setBiometricSelected] = useState<number[]>([]);

  // Reflex Nodes Challenge State
  const [reflexActiveIndex, setReflexActiveIndex] = useState<number>(0);
  const [reflexSequence, setReflexSequence] = useState<number[]>([]);
  const [reflexTarget] = useState([0, 2, 1, 3]);

  // Voice Passphrase State
  const [phraseInput, setPhraseInput] = useState('');
  const targetPhrase = "PROTOCOL OVERRIDE DELTA";

  // Start Speech / Custom Voice Audio & Audio Synth on mount
  useEffect(() => {
    // Start Audio Tone Synth
    const stopSynth = audioSynth.startAlarmSynth(alarm.soundTone, alarm.volume);

    // If custom recorded voice audio URL exists, play it in loop, else use TTS vocal calling
    let stopCustomAudio: (() => void) | null = null;
    if (alarm.customAudioDataUrl) {
      const playLoop = () => {
        stopCustomAudio = voiceRecorder.playAudioDataUrl(alarm.customAudioDataUrl!, () => {
          playLoop();
        });
      };
      playLoop();
    } else {
      ttsService.startAlarmTTSLoop(
        alarm.voiceGreeting,
        alarm.userName || 'Friend',
        {
          gender: alarm.voiceGender,
          pitch: alarm.voicePitch,
          rate: alarm.voiceRate,
        }
      );
    }

    // Setup Math equation
    if (alarm.challenge === 'math') {
      const a = Math.floor(Math.random() * 20) + 10;
      const b = Math.floor(Math.random() * 20) + 5;
      setMathQuestion({ num1: a, num2: b, answer: a + b });
    }

    // Prepare Smart Snooze Calendar Info
    if (alarm.snoozeMode === 'smart_calendar') {
      const events = loadCalendarEvents();
      const calc = calculateSmartSnooze(events, alarm.time);
      setSmartSnoozeInfo({
        minutes: calc.snoozeMinutes,
        eventTitle: calc.eventTitle,
        eventTime: calc.eventTime,
      });
    }

    return () => {
      stopSynth();
      ttsService.stopTTS();
      if (stopCustomAudio) stopCustomAudio();
      voiceRecorder.stopPlayback();
    };
  }, [alarm]);

  // Handle Smart Snooze Request
  const handleInitiateSnooze = () => {
    audioSynth.playUiClick();

    if (alarm.snoozeMode === 'math_challenge') {
      const a = Math.floor(Math.random() * 15) + 5;
      const b = Math.floor(Math.random() * 15) + 3;
      setSnoozeMathQuestion({ num1: a, num2: b, answer: a + b });
      setShowSnoozeMathQuiz(true);
      return;
    }

    let customMinutes = 5;
    if (alarm.snoozeMode === 'smart_calendar' && smartSnoozeInfo) {
      customMinutes = smartSnoozeInfo.minutes;
    }

    executeSnooze(customMinutes);
  };

  const handleSnoozeMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(snoozeMathInput.trim(), 10) === snoozeMathQuestion.answer) {
      executeSnooze(5);
    } else {
      audioSynth.playErrorSound();
      setSnoozeMathError(true);
      setSnoozeMathInput('');
      setTimeout(() => setSnoozeMathError(false), 1000);
    }
  };

  const executeSnooze = (minutes: number) => {
    audioSynth.stopAlarmSynth();
    ttsService.stopTTS();
    voiceRecorder.stopPlayback();
    onSnooze(minutes);
  };

  // Handle Math Submit
  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(mathInput.trim(), 10) === mathQuestion.answer) {
      handleSuccessUnlock();
    } else {
      audioSynth.playErrorSound();
      setMathError(true);
      setMathInput('');
      setTimeout(() => setMathError(false), 1000);
    }
  };

  // Handle Biometric Grid Tap
  const handleBiometricTap = (index: number) => {
    audioSynth.playUiClick(1000);
    const newSeq = [...biometricSelected, index];
    setBiometricSelected(newSeq);

    if (newSeq.length === biometricTarget.length) {
      if (newSeq.every((val, idx) => val === biometricTarget[idx])) {
        handleSuccessUnlock();
      } else {
        audioSynth.playErrorSound();
        setBiometricSelected([]);
      }
    }
  };

  // Handle Reflex Tap
  const handleReflexTap = (index: number) => {
    audioSynth.playUiClick(1200);
    const newSeq = [...reflexSequence, index];
    setReflexSequence(newSeq);

    if (newSeq.length === reflexTarget.length) {
      if (newSeq.every((val, idx) => val === reflexTarget[idx])) {
        handleSuccessUnlock();
      } else {
        audioSynth.playErrorSound();
        setReflexSequence([]);
      }
    } else {
      setReflexActiveIndex(reflexTarget[newSeq.length]);
    }
  };

  // Handle Voice Passphrase Submit
  const handlePhraseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phraseInput.trim().toUpperCase() === targetPhrase) {
      handleSuccessUnlock();
    } else {
      audioSynth.playErrorSound();
    }
  };

  // Unlock / Disarm Protocol
  const handleSuccessUnlock = () => {
    audioSynth.stopAlarmSynth();
    ttsService.stopTTS();
    voiceRecorder.stopPlayback();
    audioSynth.playSuccessSound();
    setIsDisarmed(true);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    setTimeout(() => {
      onDismiss();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Flashing Emergency Background Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/60 via-slate-950 to-slate-950 animate-pulse pointer-events-none" />

      {/* Grid Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 pointer-events-none" />

      <div className="z-10 w-full max-w-xl text-center space-y-5 my-auto">
        {/* Top Emergency Indicator */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-400 font-mono text-xs uppercase animate-bounce">
          <ShieldAlert className="w-4 h-4" />
          <span>WAKE UP PROTOCOL ACTIVE • OFFLINE VOICE CALLING</span>
        </div>

        {/* Digital Clock Display (12-hour format) */}
        <div className="font-mono text-6xl sm:text-8xl font-black text-white tracking-tight drop-shadow-[0_0_40px_rgba(0,240,255,0.7)]">
          {formatTimeDisplay(alarm.time, false)}
        </div>

        {/* OFFLINE WEATHER FORECAST TELEMETRY BANNER */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 font-mono text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2 text-amber-400">
            <CloudSun className="w-5 h-5 text-amber-400" />
            <span className="font-bold">{weatherData.location}</span>
          </div>
          <div className="text-right">
            <span className="text-white font-bold">{weatherData.tempC}°C</span> • <span className="text-cyan-400">{weatherData.condition}</span>
          </div>
        </div>

        {/* Commander Name Callout */}
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-mono space-y-1">
          <div className="text-xs uppercase text-cyan-400/80 flex items-center justify-center space-x-1">
            <span>SUBJECT WAKE CALL</span>
            {alarm.customAudioDataUrl && (
              <span className="ml-2 text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/40">
                [CUSTOM RECORDED VOICE]
              </span>
            )}
          </div>
          <div className="text-xl font-bold text-white flex items-center justify-center space-x-2">
            <Volume2 className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span>"{alarm.userName}"</span>
          </div>
          <p className="text-xs text-slate-300 italic pt-1">
            "{alarm.voiceGreeting.replace(/\[Name\]/gi, alarm.userName)}"
          </p>
        </div>

        {/* Disarm Challenge Panel */}
        {!isDisarmed ? (
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="text-xs font-mono text-slate-300 font-bold uppercase flex items-center justify-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>DISARM PROTOCOL REQUIREMENT</span>
            </div>

            {/* MATH CHALLENGE */}
            {alarm.challenge === 'math' && (
              <form onSubmit={handleMathSubmit} className="space-y-4">
                <div className="text-sm font-mono text-slate-400">
                  Solve De-encryption Math Formula:
                </div>
                <div className="text-3xl font-mono font-bold text-cyan-400 bg-slate-950 py-3 rounded-2xl border border-slate-800">
                  {mathQuestion.num1} + {mathQuestion.num2} = ?
                </div>
                <input
                  type="number"
                  value={mathInput}
                  onChange={e => setMathInput(e.target.value)}
                  placeholder="Enter Answer"
                  autoFocus
                  className={`w-full px-4 py-3 rounded-2xl bg-slate-950 border text-center font-mono text-2xl text-white focus:outline-none ${
                    mathError ? 'border-red-500 text-red-400 animate-shake' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  DE-ENCRYPT & DISARM ALARM
                </button>
              </form>
            )}

            {/* BIOMETRIC GRID CHALLENGE */}
            {alarm.challenge === 'biometric' && (
              <div className="space-y-4">
                <div className="text-xs font-mono text-slate-400">
                  Trace L-Pattern Key Sequence:
                </div>
                <div className="grid grid-cols-3 gap-3 max-w-[220px] mx-auto">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => {
                    const isSelected = biometricSelected.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleBiometricTap(idx)}
                        className={`h-14 rounded-2xl border font-mono font-bold text-sm flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/40'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <Fingerprint className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setBiometricSelected([])}
                  className="text-xs font-mono text-slate-500 hover:text-slate-300"
                >
                  Reset Pattern
                </button>
              </div>
            )}

            {/* REFLEX SPEED CHALLENGE */}
            {alarm.challenge === 'reflex' && (
              <div className="space-y-4">
                <div className="text-xs font-mono text-slate-400">
                  Tap lit neon nodes in sequence: ({reflexSequence.length}/{reflexTarget.length})
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-[240px] mx-auto">
                  {[0, 1, 2, 3].map(idx => {
                    const isCurrentActive = reflexActiveIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleReflexTap(idx)}
                        className={`h-16 rounded-2xl border font-mono font-bold text-sm flex items-center justify-center transition-all cursor-pointer ${
                          isCurrentActive
                            ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/50 animate-pulse'
                            : 'bg-slate-950 border-slate-800 text-slate-600'
                        }`}
                      >
                        <Zap className="w-6 h-6" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VOICE PASSPHRASE CHALLENGE */}
            {alarm.challenge === 'phrase' && (
              <form onSubmit={handlePhraseSubmit} className="space-y-4">
                <div className="text-xs font-mono text-slate-400">
                  Type or speak required disarm phrase:
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-cyan-400 font-bold text-sm tracking-wider">
                  "{targetPhrase}"
                </div>
                <input
                  type="text"
                  value={phraseInput}
                  onChange={e => setPhraseInput(e.target.value)}
                  placeholder="Type Passphrase Here"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-center font-mono text-sm text-white focus:outline-none focus:border-cyan-500 uppercase"
                />
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  DISARM WITH PASSPHRASE
                </button>
              </form>
            )}

            {/* SMART SNOOZE SECTION */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              {showSnoozeMathQuiz ? (
                <form onSubmit={handleSnoozeMathSubmit} className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-2xl space-y-2">
                  <div className="text-xs font-mono text-amber-300 font-bold">
                    Solve Math Problem to Earn Snooze:
                  </div>
                  <div className="text-lg font-mono text-white font-bold">
                    {snoozeMathQuestion.num1} + {snoozeMathQuestion.num2} = ?
                  </div>
                  <input
                    type="number"
                    value={snoozeMathInput}
                    onChange={e => setSnoozeMathInput(e.target.value)}
                    placeholder="Answer"
                    className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-center font-mono text-sm text-white focus:outline-none ${
                      snoozeMathError ? 'border-red-500 text-red-400 animate-shake' : 'border-slate-800 focus:border-amber-500'
                    }`}
                  />
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowSnoozeMathQuiz(false)}
                      className="flex-1 py-1.5 rounded-xl border border-slate-800 text-slate-400 font-mono text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-mono font-bold text-xs"
                    >
                      Confirm Snooze
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={handleInitiateSnooze}
                  className="w-full py-2.5 rounded-2xl border border-slate-800 text-amber-400 hover:text-amber-300 font-mono text-xs flex flex-col items-center justify-center hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-2 font-bold">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {alarm.snoozeMode === 'smart_calendar'
                        ? `SMART SNOOZE (${smartSnoozeInfo ? smartSnoozeInfo.minutes : 5} MIN)`
                        : alarm.snoozeMode === 'math_challenge'
                        ? 'SNOOZE (SOLVE MATH QUIZ)'
                        : 'SNOOZE (+5 MINUTES)'}
                    </span>
                  </div>
                  {alarm.snoozeMode === 'smart_calendar' && smartSnoozeInfo && (
                    <span className="text-[10px] text-slate-400 pt-0.5">
                      Nearest Event: {smartSnoozeInfo.eventTitle} ({smartSnoozeInfo.eventTime})
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 space-y-3 shadow-2xl animate-pulse">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <div className="text-2xl font-bold font-mono text-white">PROTOCOL DISARMED</div>
            <p className="text-xs font-mono text-emerald-300">
              Good morning, {alarm.userName}. Systems fully disarmed. Have a stellar day.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

