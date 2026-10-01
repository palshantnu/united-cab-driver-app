//
//  AudioPlayer.m
//  united_cab_driver
//
//  Created by apple on 23/12/25.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AudioPlayer, NSObject)

RCT_EXTERN_METHOD(play)
RCT_EXTERN_METHOD(pause)
RCT_EXTERN_METHOD(stop)

@end
