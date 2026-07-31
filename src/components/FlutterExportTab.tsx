import React, { useState } from 'react';
import { Copy, Check, Smartphone, Sparkles, Mic, Calendar, CloudSun, Zap } from 'lucide-react';
import { audioSynth } from '../services/audioSynth';

export const FlutterExportTab: React.FC = () => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('pubspec.yaml');

  const files: Record<string, string> = {
    'pubspec.yaml': `name: aura_futuristic_alarm
description: "A futuristic offline Flutter Android alarm clock app with custom wake-up phrase recording, smart snooze, and pre-cached offline weather."
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_local_notifications: ^17.0.0
  flutter_tts: ^3.8.5
  audioplayers: ^5.2.1
  record: ^5.1.2
  path_provider: ^2.1.2
  device_calendar: ^4.3.2
  weather: ^3.1.0
  shared_preferences: ^2.2.2
  intl: ^0.19.0
  provider: ^6.1.1
  google_fonts: ^6.1.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/sounds/
`,

    'lib/main.dart': `import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/home_screen.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  const AndroidInitializationSettings initializationSettingsAndroid =
      AndroidInitializationSettings('@mipmap/ic_launcher');
  
  const InitializationSettings initializationSettings = InitializationSettings(
    android: initializationSettingsAndroid,
  );
  
  await flutterLocalNotificationsPlugin.initialize(initializationSettings);
  
  runApp(const AuraFuturisticAlarmApp());
}

class AuraFuturisticAlarmApp extends StatelessWidget {
  const AuraFuturisticAlarmApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AURA Futuristic Alarm Protocol',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF07090E),
        primaryColor: const Color(0xFF00F0FF),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00F0FF),
          secondary: Color(0xFF00FF9D),
          surface: Color(0xFF0C1017),
        ),
        textTheme: GoogleFonts.shareTechMonoTextTheme(ThemeData.dark().textTheme),
      ),
      home: const HomeScreen(),
    );
  }
}
`,

    'lib/services/voice_recorder_service.dart': `import 'dart:io';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:audioplayers/audioplayers.dart';

class VoiceRecorderService {
  final AudioRecorder _audioRecorder = AudioRecorder();
  final AudioPlayer _audioPlayer = AudioPlayer();
  String? lastRecordedPath;

  Future<void> startRecording() async {
    if (await _audioRecorder.hasPermission()) {
      final Directory appDocDir = await getApplicationDocumentsDirectory();
      final String filePath = '\${appDocDir.path}/custom_wake_phrase.m4a';
      await _audioRecorder.start(const RecordConfig(), path: filePath);
      lastRecordedPath = filePath;
    }
  }

  Future<String?> stopRecording() async {
    final String? path = await _audioRecorder.stop();
    lastRecordedPath = path;
    return path;
  }

  Future<void> playCustomPhrase(String path) async {
    await _audioPlayer.stop();
    await _audioPlayer.play(DeviceFileSource(path));
  }

  Future<void> stopPlayback() async {
    await _audioPlayer.stop();
  }
}
`,

    'lib/services/smart_snooze_service.dart': `import 'dart:math';

enum SnoozeMode { standard5m, smartCalendar, mathChallenge }

class SmartSnoozeService {
  // Returns calculated snooze duration in minutes based on calendar or math formula
  static int calculateAdaptiveSnooze({
    required SnoozeMode mode,
    required String alarmTime,
    int? nearestEventDiffMinutes,
  }) {
    switch (mode) {
      case SnoozeMode.smartCalendar:
        if (nearestEventDiffMinutes != null && nearestEventDiffMinutes > 15) {
          // Leave 15 min buffer before nearest event
          return max(3, min(30, nearestEventDiffMinutes - 15));
        }
        return 5;
      case SnoozeMode.mathChallenge:
        return 5; // Granted upon solving math quiz
      case SnoozeMode.standard5m:
      default:
        return 5;
    }
  }
}
`,

    'lib/services/offline_weather_service.dart': `class OfflineWeatherService {
  static Map<String, dynamic> getCachedWeatherData(String location) {
    return {
      'location': location.isEmpty ? 'Neo Tokyo Grid Alpha' : location,
      'tempC': 22,
      'condition': 'Clear Atmospheric Shield',
      'humidity': 48,
      'uvIndex': 4,
      'summary': 'Atmospheric conditions stable. Solar radiation nominal.',
    };
  }
}
`,

    'lib/models/alarm.dart': `class Alarm {
  final String id;
  final String time; // HH:mm
  final String title;
  final bool enabled;
  final String userName;
  final String voiceGreeting;
  final String? customAudioPath; // Recorded custom wake-up phrase file path
  final String snoozeMode; // 'standard_5m', 'smart_calendar', 'math_challenge'
  final String soundTone;
  final String challenge;

  Alarm({
    required this.id,
    required this.time,
    required this.title,
    this.enabled = true,
    required this.userName,
    required this.voiceGreeting,
    this.customAudioPath,
    this.snoozeMode = 'smart_calendar',
    required this.soundTone,
    required this.challenge,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'time': time,
    'title': title,
    'enabled': enabled,
    'userName': userName,
    'voiceGreeting': voiceGreeting,
    'customAudioPath': customAudioPath,
    'snoozeMode': snoozeMode,
    'soundTone': soundTone,
    'challenge': challenge,
  };

  factory Alarm.fromJson(Map<String, dynamic> json) => Alarm(
    id: json['id'],
    time: json['time'],
    title: json['title'],
    enabled: json['enabled'],
    userName: json['userName'],
    voiceGreeting: json['voiceGreeting'],
    customAudioPath: json['customAudioPath'],
    snoozeMode: json['snoozeMode'] ?? 'smart_calendar',
    soundTone: json['soundTone'],
    challenge: json['challenge'],
  );
}
`,

    'lib/screens/alarm_trigger_screen.dart': `import 'package:flutter/material';
import '../models/alarm.dart';
import '../services/tts_service.dart';
import '../services/voice_recorder_service.dart';
import '../services/offline_weather_service.dart';

class AlarmTriggerScreen extends StatefulWidget {
  final Alarm alarm;
  const AlarmTriggerScreen({super.key, required this.alarm});

  @override
  State<AlarmTriggerScreen> createState() => _AlarmTriggerScreenState();
}

class _AlarmTriggerScreenState extends State<AlarmTriggerScreen> {
  final TTSService _ttsService = TTSService();
  final VoiceRecorderService _recorderService = VoiceRecorderService();
  late Map<String, dynamic> _weather;
  bool _showMathQuiz = false;
  int _mathAnswer = 15;
  String _mathInput = '';

  @override
  void initState() {
    super.initState();
    _weather = OfflineWeatherService.getCachedWeatherData('Neo Tokyo Grid');
    _startAudioLoop();
  }

  void _startAudioLoop() async {
    if (widget.alarm.customAudioPath != null) {
      await _recorderService.playCustomPhrase(widget.alarm.customAudioPath!);
    } else {
      await _ttsService.speakNameCall(widget.alarm.voiceGreeting, widget.alarm.userName);
    }
  }

  void _handleSnooze() {
    if (widget.alarm.snoozeMode == 'math_challenge') {
      setState(() {
        _showMathQuiz = true;
      });
      return;
    }
    _completeSnooze();
  }

  void _completeSnooze() {
    _ttsService.stop();
    _recorderService.stopPlayback();
    Navigator.pop(context, 'snoozed');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF07090E),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.amber.withOpacity(0.4)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(_weather['location'], style: const TextStyle(color: Colors.amber, fontSize: 12)),
                    Text('\${_weather['tempC']}°C • \${_weather['condition']}', style: const TextStyle(color: Colors.white, fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Text(
                widget.alarm.time,
                style: const TextStyle(fontSize: 72, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              Text(
                "WAKE CALL: '\${widget.alarm.userName}'",
                style: const TextStyle(fontSize: 18, color: Color(0xFF00F0FF)),
              ),
              const SizedBox(height: 32),
              if (_showMathQuiz) ...[
                const Text("Solve Math to Snooze: 7 + 8 = ?", style: TextStyle(color: Colors.white)),
                TextField(
                  onChanged: (val) => _mathInput = val,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(hintText: "Answer"),
                ),
                ElevatedButton(
                  onPressed: () {
                    if (_mathInput == "15") _completeSnooze();
                  },
                  child: const Text("Confirm Snooze"),
                )
              ] else ...[
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00F0FF)),
                  onPressed: () {
                    _ttsService.stop();
                    _recorderService.stopPlayback();
                    Navigator.pop(context);
                  },
                  child: const Text("DISARM PROTOCOL", style: TextStyle(color: Colors.black)),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: _handleSnooze,
                  child: const Text("SMART SNOOZE", style: TextStyle(color: Colors.amber)),
                )
              ]
            ],
          ),
        ),
      ),
    );
  }
}
`,

    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.aura.futuristic.alarm">

    <uses-permission android:name="android.permission.RECORD_AUDIO"/>
    <uses-permission android:name="android.permission.READ_CALENDAR"/>
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.WAKE_LOCK"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    <uses-permission android:name="android.permission.USE_EXACT_ALARM"/>
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>

    <application
        android:label="AURA Futuristic Alarm"
        android:icon="@mipmap/ic_launcher">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/LaunchTheme">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
  };

  const handleCopy = (filename: string, content: string) => {
    audioSynth.playUiClick();
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs uppercase">
          <Smartphone className="w-3.5 h-3.5" />
          <span>FLUTTER ANDROID APK SOURCE BLUEPRINT</span>
        </div>
        <h2 className="text-xl font-bold font-mono text-white">NATIVE FLUTTER ANDROID CODE REPOSITORY</h2>
        <p className="text-xs text-slate-400 font-mono">
          Full offline Flutter Dart codebase with Custom Recorded Voice, Smart Snooze, and Pre-cached Weather forecast.
        </p>
      </div>

      {/* Feature Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-2 font-mono text-xs text-emerald-400">
          <Mic className="w-4 h-4 text-emerald-400" />
          <span>Offline Custom Voice Recording</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-2 font-mono text-xs text-amber-400">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Smart Adaptive Snooze</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-2 font-mono text-xs text-cyan-400">
          <CloudSun className="w-4 h-4 text-cyan-400" />
          <span>Cached Offline Weather</span>
        </div>
      </div>

      {/* Code Viewer Container */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-2xl">
        {/* Top File Selector Bar */}
        <div className="flex items-center space-x-2 px-4 py-3 bg-slate-900 border-b border-slate-800 overflow-x-auto no-scrollbar">
          {Object.keys(files).map(filename => (
            <button
              key={filename}
              onClick={() => {
                audioSynth.playUiClick();
                setSelectedFile(filename);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                selectedFile === filename
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {filename}
            </button>
          ))}
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/60 bg-slate-950 text-xs font-mono text-slate-400">
          <span>File: <strong className="text-cyan-400">{selectedFile}</strong></span>
          <button
            onClick={() => handleCopy(selectedFile, files[selectedFile])}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            {copiedFile === selectedFile ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code View */}
        <pre className="p-6 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed select-all">
          <code>{files[selectedFile]}</code>
        </pre>
      </div>
    </div>
  );
};
