/**
 * @format
 */

import {AppRegistry, NativeModules} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';

  const { AudioPlayer } = NativeModules;
  

messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
   
      // Load the sound file
      AudioPlayer.play();
    
    
  });
AppRegistry.registerComponent(appName, () => App);
