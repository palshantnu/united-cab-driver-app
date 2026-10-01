import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import Firebase
import GoogleMaps
import GooglePlaces
import AVFoundation
@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

     FirebaseApp.configure()
    GMSServices.provideAPIKey("AIzaSyAvSirrQQWowYpUpem3I7FaeFZTsfWbDLQ")
    GMSPlacesClient.provideAPIKey("AIzaSyAvSirrQQWowYpUpem3I7FaeFZTsfWbDLQ")
    do {
         try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
         try AVAudioSession.sharedInstance().setActive(true)
         print("✅ Audio session active")
       } catch {
         print("❌ Audio session error")
       }
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "united_cab_driver",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
