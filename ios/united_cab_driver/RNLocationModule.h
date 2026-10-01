#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <CoreLocation/CoreLocation.h>

@interface RNLocationModule : RCTEventEmitter <RCTBridgeModule, CLLocationManagerDelegate>

@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, strong) NSTimer *sendTimer;
@property (nonatomic, strong) NSNumber *driverId;

@end
