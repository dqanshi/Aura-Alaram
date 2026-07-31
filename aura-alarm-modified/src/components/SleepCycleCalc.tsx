import React, { useState } from 'react';
import { Moon, Sparkles, Plus, Check } from 'lucide-react';
import { audioSynth } from '../services/audioSynth';

interface SleepCycleCalcProps {
  onQuickAddAlarm: (time: string, title: string) => void;
}

export const SleepCycleCalc: React.FC<SleepCycleCalcProps> = ({ onQuickAddAlarm }) => {
  const [bedtime, setBedtime] = useState('23:00');
  const [addedTimes, setAddedTimes] = useState<string[]>([]);

  // Average time to fall asleep = 14 minutes
  const [hours, mins] = bedtime.split(':').map(Number);
  const baseMinutes = hours * 60 + mins + 14;

  const cycles = [
    { num: 6, hours: 9, label: 'Optimal Recovery (9h)', isBest: true },
    { num: 5, hours: 7.5, label: 'Recommended (7.5h)', isBest: true },
    { num: 4, hours: 6, label: 'Minimum REM (6h)', isBest: false },
    { num: 3, hours: 4.5, label: 'Short Rest (4.5h)', isBest: false },
  ].map(c => {
    const totalMins = (baseMinutes + c.num * 90) % (24 * 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return {
      ...c,
      wakeTime: timeStr,
    };
  });

  const handleAddCycleAlarm = (timeStr: string, label: string) => {
    audioSynth.playSuccessSound();
    setAddedTimes([...addedTimes, timeStr]);
    onQuickAddAlarm(timeStr, `REM Sleep (${label})`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono text-xs uppercase">
          <Moon className="w-3.5 h-3.5" />
          <span>NEURAL REM SLEEP CALCULATOR</span>
        </div>
        <h2 className="text-xl font-bold font-mono text-white">OPTIMAL WAKE TIME CALCULATOR</h2>
        <p className="text-xs text-slate-400 font-mono">
          Humans sleep in 90-minute REM cycles. Waking between cycles prevents grogginess.
        </p>
      </div>

      {/* Bedtime Input */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-950/70 space-y-4">
        <label className="block text-xs font-mono text-slate-300">
          IF YOU GO TO SLEEP AT THIS TIME:
        </label>
        <input
          type="time"
          value={bedtime}
          onChange={e => setBedtime(e.target.value)}
          className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-3xl font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
        />
        <p className="text-[11px] font-mono text-slate-500">
          * Includes 14 minutes average sleep onset time.
        </p>
      </div>

      {/* Recommended Wake Cycles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cycles.map((c, idx) => {
          const isAdded = addedTimes.includes(c.wakeTime);
          return (
            <div
              key={idx}
              className={`p-5 rounded-3xl border transition-all ${
                c.isBest
                  ? 'border-cyan-500/40 bg-slate-950/90 shadow-lg shadow-cyan-950/30'
                  : 'border-slate-800 bg-slate-950/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-mono font-bold text-white">{c.wakeTime}</span>
                  <div className="text-xs font-mono text-cyan-400 font-bold pt-1">{c.label}</div>
                  <div className="text-[11px] font-mono text-slate-400">{c.num} Complete REM Cycles</div>
                </div>

                <button
                  onClick={() => handleAddCycleAlarm(c.wakeTime, c.label)}
                  disabled={isAdded}
                  className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>PROGRAMMED</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>SET ALARM</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
