import React, { useState, useEffect } from 'react';
import { AmbientNoiseType } from '../types';
import { Volume2, Play, Square, Timer, Sparkles, Disc } from 'lucide-react';
import { audioSynth } from '../services/audioSynth';

export const AmbientNoiseGenerator: React.FC = () => {
  const [activeType, setActiveType] = useState<AmbientNoiseType | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Play/Stop Sound
  const handleToggleNoise = (type: AmbientNoiseType) => {
    audioSynth.playUiClick();
    if (activeType === type) {
      audioSynth.stopAmbientNoise();
      setActiveType(null);
      setTimeRemaining(null);
    } else {
      setActiveType(type);
      audioSynth.startAmbientNoise(type, volume);
      if (timerMinutes) {
        setTimeRemaining(timerMinutes * 60);
      }
    }
  };

  // Handle Volume
  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (activeType) {
      audioSynth.startAmbientNoise(activeType, v);
    }
  };

  // Timer countdown effect
  useEffect(() => {
    if (!activeType || timeRemaining === null) return;

    if (timeRemaining <= 0) {
      audioSynth.stopAmbientNoise();
      setActiveType(null);
      setTimeRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeType, timeRemaining]);

  const soundPresets = [
    { id: 'warp_drive', name: 'Warp Drive Hum', desc: 'Deep sub-frequency spaceship engine pulse' },
    { id: 'deep_space', name: 'Deep Space Void', desc: 'Resonant cosmic vacuum bandpass noise' },
    { id: 'ship_rain', name: 'Hull Rain Storm', desc: 'Precipitation tapping on titanium shuttle hull' },
    { id: 'quantum_static', name: 'Quantum Cyber Static', desc: 'High-frequency soothing white noise' },
    { id: 'stellar_drone', name: 'Stellar Binaural Drone', desc: 'Harmonic 3Hz theta-wave binaural tone' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs uppercase">
          <Volume2 className="w-3.5 h-3.5" />
          <span>OFFLINE AMBIENT SOUND GENERATOR</span>
        </div>
        <h2 className="text-xl font-bold font-mono text-white">SPACE SLEEP SOUND MACHINE</h2>
        <p className="text-xs text-slate-400 font-mono">
          Procedurally generated background soundscapes for deep sleep & focus. 100% .
        </p>
      </div>

      {/* Global Volume & Timer Bar */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-950/70 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-2 flex items-center justify-between">
            <span>MASTER AMBIENT VOLUME ({Math.round(volume * 100)}%)</span>
            <Volume2 className="w-4 h-4 text-emerald-400" />
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={volume}
            onChange={e => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 mb-2 flex items-center space-x-1">
            <Timer className="w-4 h-4 text-cyan-400" />
            <span>SLEEP TIMER {timeRemaining !== null && `(${Math.floor(timeRemaining / 60)}m ${timeRemaining % 60}s)`}</span>
          </label>
          <div className="flex items-center space-x-2">
            {[null, 15, 30, 60, 120].map((mins, idx) => (
              <button
                key={idx}
                onClick={() => {
                  audioSynth.playUiClick();
                  setTimerMinutes(mins);
                  if (activeType) {
                    setTimeRemaining(mins ? mins * 60 : null);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                  timerMinutes === mins
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {mins ? `${mins}m` : 'Off'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sound Preset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {soundPresets.map(preset => {
          const isPlaying = activeType === preset.id;
          return (
            <div
              key={preset.id}
              className={`p-5 rounded-3xl border transition-all ${
                isPlaying
                  ? 'border-emerald-500/50 bg-emerald-950/30 shadow-lg shadow-emerald-950/40'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <div className="text-sm font-mono font-bold text-white flex items-center space-x-2">
                    <Disc className={`w-4 h-4 ${isPlaying ? 'text-emerald-400 animate-spin' : 'text-slate-500'}`} />
                    <span>{preset.name}</span>
                  </div>
                  <p className="text-xs font-mono text-slate-400">{preset.desc}</p>
                </div>

                <button
                  onClick={() => handleToggleNoise(preset.id as AmbientNoiseType)}
                  className={`p-3 rounded-2xl transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
