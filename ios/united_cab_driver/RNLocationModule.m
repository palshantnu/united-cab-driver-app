#import "RNLocationModule.h"
#import <React/RCTLog.h>

@implementation RNLocationModule

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[@"LocationSendResponse"];
}

- (void)startSendTimer {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self.sendTimer) {
      [self.sendTimer invalidate];
      self.sendTimer = nil;
    }
    self.sendTimer = [NSTimer scheduledTimerWithTimeInterval:300.0 target:self selector:@selector(sendLastLocation) userInfo:nil repeats:YES];
  });
}

- (void)sendLastLocation {
  CLLocation *loc = self.locationManager.location;
  if (!loc) return;
  NSNumber *dId = self.driverId ?: @0;
  NSDictionary *payload = @{
    @"driver_id": dId,
    @"lat": [NSString stringWithFormat:@"%f", loc.coordinate.latitude],
    @"lng": [NSString stringWithFormat:@"%f", loc.coordinate.longitude]
  };
  NSError *err;
  NSData *jsonData = [NSJSONSerialization dataWithJSONObject:payload options:0 error:&err];
  if (err) return;
  NSURL *url = [NSURL URLWithString:@"https://unitedcabsmerthyr.uk/api/driver/send-location"];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
  request.HTTPMethod = @"POST";
  [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
  request.HTTPBody = jsonData;

  NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
    if (error) {
      [self sendEventWithName:@"LocationSendResponse" body:@{ @"status": @"error", @"message": error.localizedDescription ?: @"" }];
      return;
    }

    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
    NSString *body = data ? [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] : @"";
    NSString *status = (httpResponse.statusCode >= 200 && httpResponse.statusCode < 300) ? @"success" : @"error";
    [self sendEventWithName:@"LocationSendResponse" body:@{ @"status": status, @"message": body }];
  }];
  [task resume];
}

RCT_EXPORT_METHOD(start:(nonnull NSNumber *)driverId)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    self.driverId = driverId;
    if (!self.locationManager) {
      self.locationManager = [[CLLocationManager alloc] init];
      self.locationManager.delegate = self;
      self.locationManager.desiredAccuracy = kCLLocationAccuracyBest;
      self.locationManager.allowsBackgroundLocationUpdates = YES;
      self.locationManager.pausesLocationUpdatesAutomatically = NO;
    }
    [self.locationManager requestAlwaysAuthorization];
    [self.locationManager startUpdatingLocation];
    [self startSendTimer];
  });
}

RCT_EXPORT_METHOD(stop)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self.sendTimer invalidate];
    self.sendTimer = nil;
    [self.locationManager stopUpdatingLocation];
    self.locationManager.delegate = nil;
    self.locationManager = nil;
  });
}

#pragma mark - CLLocationManagerDelegate
- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations {
  // location updates arrive; we rely on timer to send
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error {
  RCTLogInfo(@"Location error: %@", error.localizedDescription);
}

@end
