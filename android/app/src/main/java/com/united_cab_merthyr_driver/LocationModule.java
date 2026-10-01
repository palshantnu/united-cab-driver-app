package com.united_cab_merthyr_driver;

import android.content.Intent;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class LocationModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    public static ReactApplicationContext staticContext;

    public LocationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        staticContext = reactContext;
    }

    public static void emitToJs(String eventName, String status, String message) {
        if (staticContext == null) return;
        WritableMap map = Arguments.createMap();
        map.putString("status", status);
        map.putString("message", message);
        staticContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, map);
    }

    @Override
    public String getName() {
        return "LocationModule";
    }

    @ReactMethod
    public void startService(int driverId) {
        Intent intent = new Intent(reactContext, LocationService.class);
        intent.putExtra("driver_id", driverId);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            reactContext.startForegroundService(intent);
        } else {
            reactContext.startService(intent);
        }
    }

    @ReactMethod
    public void stopService() {
        Intent intent = new Intent(reactContext, LocationService.class);
        reactContext.stopService(intent);
    }
}
