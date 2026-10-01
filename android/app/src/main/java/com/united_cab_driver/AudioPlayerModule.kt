package com.united_cab_merthyr_driver

import android.media.MediaPlayer
import com.facebook.react.bridge.*

class AudioPlayerModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var mediaPlayer: MediaPlayer? = null

  override fun getName(): String {
    return "AudioPlayer"
  }

  @ReactMethod
  fun play() {
    if (mediaPlayer == null) {
      mediaPlayer = MediaPlayer.create(
        reactApplicationContext,
        R.raw.notification   // sample.mp3
      )
    }
    mediaPlayer?.start()
  }

  @ReactMethod
  fun pause() {
    mediaPlayer?.pause()
  }

  @ReactMethod
  fun stop() {
    mediaPlayer?.stop()
    mediaPlayer?.release()
    mediaPlayer = null
  }
}
