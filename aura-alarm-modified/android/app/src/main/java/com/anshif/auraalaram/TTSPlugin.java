package com.anshif.auraalaram;

import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Locale;

/**
 * Native Android Text-to-Speech plugin for Capacitor.
 * Uses Android's built-in TTS engine — no API key or network needed.
 * Called from ttsService.ts when running on the Android app.
 */
@CapacitorPlugin(name = "TTSPlugin")
public class TTSPlugin extends Plugin implements TextToSpeech.OnInitListener {

    private static final String TAG = "AuraTTSPlugin";
    private TextToSpeech tts;
    private boolean isReady = false;
    private PluginCall pendingSpeakCall = null;

    @Override
    public void load() {
        tts = new TextToSpeech(getContext(), this);
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            // Prefer the device locale; fall back to English
            int result = tts.setLanguage(Locale.getDefault());
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts.setLanguage(Locale.ENGLISH);
            }

            // Listen for utterance completion so JS can chain speech loops
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {}

                @Override
                public void onDone(String utteranceId) {
                    notifyListeners("ttsCompleted", new JSObject(), true);
                }

                @Override
                public void onError(String utteranceId) {
                    notifyListeners("ttsCompleted", new JSObject(), true);
                }
            });

            isReady = true;
            Log.d(TAG, "TTS initialized successfully");

            // Resolve any speak call that arrived before init finished
            if (pendingSpeakCall != null) {
                executeSpeakCall(pendingSpeakCall);
                pendingSpeakCall = null;
            }
        } else {
            Log.e(TAG, "TTS initialization failed with status: " + status);
        }
    }

    @PluginMethod
    public void speak(PluginCall call) {
        if (!isReady || tts == null) {
            // Queue the call until TTS is ready (usually < 500 ms)
            pendingSpeakCall = call;
            call.setKeepAlive(true);
            return;
        }
        executeSpeakCall(call);
    }

    private void executeSpeakCall(PluginCall call) {
        String text  = call.getString("text", "");
        float  pitch = call.getFloat("pitch", 1.0f);
        float  rate  = call.getFloat("rate",  1.0f);

        tts.setPitch(pitch);
        tts.setSpeechRate(rate);
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "aura_tts_" + System.currentTimeMillis());
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (tts != null) {
            tts.stop();
        }
        call.resolve();
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject result = new JSObject();
        result.put("supported", isReady && tts != null);
        call.resolve(result);
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
        super.handleOnDestroy();
    }
}
