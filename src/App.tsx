import React, { useState, useEffect } from 'react';
import { Alarm, UserPreferences } from './types';
import {
  loadAlarmsFromStorage,
  saveAlarmsToStorage,
  loadPrefsFromStorage,
  savePrefsToStorage,
} from './services/storage';

import { CyberHeader } from './components/CyberHeader';
import { MainClock } from './components/MainClock';
import { AlarmList } from './components/AlarmList';
import { AlarmModal } from './components/AlarmModal';
import { AlarmTriggerOverlay } from './components/AlarmTriggerOverlay';
import { NameVoiceSettings } from './components/NameVoiceSettings';
import { CyberBackground } from './components/CyberBackground';

export default function App() {
  const [alarms, setAlarms] = useState<Alarm[]>(loadAlarmsFromStorage);
  const [prefs, setPrefs]   = useState<UserPreferences>(loadPrefsFromStorage);
  const [activeTab, setActiveTab] = useState<'clock' | 'voice'>('clock');

  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [editingAlarm,  setEditingAlarm]  = useState<Alarm | null>(null);
  const [activeTriggerAlarm, setActiveTriggerAlarm] = useState<Alarm | null>(null);
  const [lastTriggeredKey,   setLastTriggeredKey]   = useState<string>('');

  useEffect(() => { saveAlarmsToStorage(alarms); }, [alarms]);
  useEffect(() => { savePrefsToStorage(prefs);   }, [prefs]);

  // Real-time alarm trigger checker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const dayOfWeek = now.getDay();
      const todayStr  = now.toDateString();

      alarms.forEach(alarm => {
        if (alarm.enabled && alarm.time === timeStr && alarm.days.includes(dayOfWeek)) {
          const key = `${alarm.id}_${timeStr}_${todayStr}`;
          if (lastTriggeredKey !== key && !activeTriggerAlarm) {
            setLastTriggeredKey(key);
            setActiveTriggerAlarm(alarm);
          }
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [alarms, lastTriggeredKey, activeTriggerAlarm]);

  const handleToggleAlarm = (id: string) =>
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));

  const handleDeleteAlarm = (id: string) =>
    setAlarms(prev => prev.filter(a => a.id !== id));

  const handleSaveAlarm = (saved: Alarm) => {
    setAlarms(prev => {
      const exists = prev.some(a => a.id === saved.id);
      return exists ? prev.map(a => a.id === saved.id ? saved : a) : [...prev, saved];
    });
    setIsModalOpen(false);
    setEditingAlarm(null);
  };

  const handleQuickAddAlarm = (time: string, title: string) => {
    const newAlarm: Alarm = {
      id: `alarm_${Date.now()}`,
      time,
      title,
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6],
      userName: prefs.commanderName || 'Anshif',
      voiceGreeting: 'Good morning [Name]. Wake up, time to start your day!',
      voicePitch: 0.9,
      voiceRate: 1.0,
      soundTone: 'samsung_horizon',
      volume: 0.85,
      challenge: 'biometric',
      challengeDifficulty: 'medium',
      createdAt: Date.now(),
    };
    setAlarms(prev => [...prev, newAlarm]);
  };

  const handleSnooze = (customSnoozeMinutes = 5) => {
    if (!activeTriggerAlarm) return;
    const now = new Date();
    now.setMinutes(now.getMinutes() + customSnoozeMinutes);
    const snoozedTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    handleQuickAddAlarm(snoozedTime, `Snoozed (${customSnoozeMinutes}m): ${activeTriggerAlarm.title}`);
    setActiveTriggerAlarm(null);
  };

  const isDarkMode = prefs.darkMode ?? true;

  return (
    <div className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden transition-colors duration-300 ${
      isDarkMode
        ? 'bg-[#050811] text-slate-100 selection:bg-cyan-500 selection:text-slate-950'
        : 'bg-slate-50 text-slate-900 selection:bg-cyan-600 selection:text-white'
    }`}>
      <CyberBackground isDarkMode={isDarkMode} />

      {prefs.scanlineEffect && isDarkMode && (
        <div className="fixed inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] pointer-events-none z-40 opacity-20" />
      )}

      <CyberHeader
        prefs={prefs}
        onUpdatePrefs={setPrefs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlarmCount={alarms.filter(a => a.enabled).length}
      />

      <main className="flex-1 pb-16 z-10 relative">
        {activeTab === 'clock' && (
          <div className="space-y-6">
            <MainClock
              alarms={alarms}
              prefs={prefs}
              onOpenCreateModal={() => { setEditingAlarm(null); setIsModalOpen(true); }}
              onTriggerTestAlarm={alarm => setActiveTriggerAlarm(alarm)}
            />
            <AlarmList
              alarms={alarms}
              prefs={prefs}
              onToggleAlarm={handleToggleAlarm}
              onEditAlarm={alarm => { setEditingAlarm(alarm); setIsModalOpen(true); }}
              onDeleteAlarm={handleDeleteAlarm}
              onOpenCreateModal={() => { setEditingAlarm(null); setIsModalOpen(true); }}
              onTriggerTestAlarm={alarm => setActiveTriggerAlarm(alarm)}
            />
          </div>
        )}

        {activeTab === 'voice' && (
          <NameVoiceSettings prefs={prefs} onUpdatePrefs={setPrefs} />
        )}
      </main>

      {isModalOpen && (
        <AlarmModal
          alarm={editingAlarm}
          userName={prefs.commanderName}
          onSave={handleSaveAlarm}
          onClose={() => { setIsModalOpen(false); setEditingAlarm(null); }}
        />
      )}

      {activeTriggerAlarm && (
        <AlarmTriggerOverlay
          alarm={activeTriggerAlarm}
          onDismiss={() => setActiveTriggerAlarm(null)}
          onSnooze={handleSnooze}
        />
      )}
    </div>
  );
}
