package com.anshif.auraalaram;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register custom native plugins BEFORE calling super.onCreate
        registerPlugin(TTSPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
