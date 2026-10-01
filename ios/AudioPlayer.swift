//
//  AudioPlayer.swift
//  united_cab_driver
//
//  Created by apple on 23/12/25.
//

import Foundation
import AVFoundation

@objc(AudioPlayer)
class AudioPlayer: NSObject {

  var player: AVAudioPlayer?

  @objc func play() {
    guard let url = Bundle.main.url(forResource: "notification", withExtension: "mp3") else {
      print("❌ Audio file not found")
      return
    }

    do {
      player = try AVAudioPlayer(contentsOf: url)
      player?.prepareToPlay()
      player?.play()
      print("▶️ Audio playing")
    } catch {
      print("❌ Error playing audio:", error.localizedDescription)
    }
  }

  @objc func pause() {
    if player?.isPlaying == true {
      player?.pause()
      print("⏸ Audio paused")
    }
  }

  @objc func stop() {
    player?.stop()
    player = nil
    print("⏹ Audio stopped")
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
