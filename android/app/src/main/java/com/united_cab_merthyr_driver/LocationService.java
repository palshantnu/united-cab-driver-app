package com.united_cab_merthyr_driver;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.location.Location;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

public class LocationService extends Service {
    private static final String CHANNEL_ID = "location_service_channel";
    private FusedLocationProviderClient fusedLocationClient;
    private Handler handler;
    private Runnable sendTask;
    private OkHttpClient httpClient;
    private int driverId = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        handler = new Handler(Looper.getMainLooper());
        httpClient = new OkHttpClient.Builder()
                .callTimeout(30, TimeUnit.SECONDS)
                .build();

        sendTask = new Runnable() {
            @Override
            public void run() {
                requestAndSendLocation();
                handler.postDelayed(this, 5 * 60 * 1000); // 5 minutes
            }
        };

        createNotificationChannel();
        startForeground(1337, buildNotification());
        handler.post(sendTask);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        try {
            if (intent != null && intent.hasExtra("driver_id")) {
                driverId = intent.getIntExtra("driver_id", 0);
            }
        } catch (Exception ignored) {}
        return START_STICKY;
    }

    private void requestAndSendLocation() {
        try {
            fusedLocationClient.getLastLocation().addOnSuccessListener(location -> {
                if (location != null) {
                    sendLocationToServer(location);
                }
            });
        } catch (SecurityException ignored) {
        }
    }

    private void sendLocationToServer(android.location.Location location) {
        new Thread(() -> {
            try {
                MediaType JSON = MediaType.parse("application/json; charset=utf-8");
                String body = String.format("{\"driver_id\": %d, \"lat\": \"%f\", \"lng\": \"%f\"}", driverId, location.getLatitude(), location.getLongitude());
                Request request = new Request.Builder()
                        .url("https://unitedcabsmerthyr.uk/api/driver/send-location")
                        .post(RequestBody.create(body, JSON))
                        .build();
                try (Response response = httpClient.newCall(request).execute()) {
                    ResponseBody responseBody = response.body();
                    String bodyText = responseBody != null ? responseBody.string() : "";
                    LocationModule.emitToJs("LocationSendResponse", response.isSuccessful() ? "success" : "error", bodyText);
                }
            } catch (IOException e) {
                LocationModule.emitToJs("LocationSendResponse", "error", e.getMessage() != null ? e.getMessage() : "IOException");
            }
        }).start();
    }

    private Notification buildNotification() {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("United Cabs")
                .setContentText("Sending location in background")
                .setSmallIcon(getApplicationInfo().icon)
                .setPriority(NotificationCompat.PRIORITY_LOW);
        return builder.build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Location Service", NotificationManager.IMPORTANCE_LOW);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    

    @Override
    public void onDestroy() {
        super.onDestroy();
        handler.removeCallbacks(sendTask);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
