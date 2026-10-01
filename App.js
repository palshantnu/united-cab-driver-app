import React, { useEffect } from 'react';
import { Alert, Linking, LogBox, StatusBar, StyleSheet, Text, Platform, PermissionsAndroid, NativeModules } from 'react-native';
//import {Fonts} from './src/theme';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import configureStore from './src/Redux/Store';
import { SafeAreaProvider, useSafeAreaInsets, } from 'react-native-safe-area-context';
import MainContent from './MainContent';
import StartLocationService from './src/component/StartLocationService';
import { StripeProvider } from '@stripe/stripe-react-native';
import messaging from '@react-native-firebase/messaging';

let { store, persistor } = configureStore();
const App = () => {
  const { AudioPlayer } = NativeModules;

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        ]);
        const fine = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
        const bg = granted[PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION];
        if (fine !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission denied');
        }
        if (bg !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Background location permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };
  const requestNotificationPermission = async () => {


    // ✅ Android 13+
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('❌ Notification permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  React.useEffect(() => {
    // Assume a message-notification contains a "type" property in the data payload of the screen to open

    messaging().onMessage(async remoteMessage => {
      console.log('📩 Foreground message:', JSON.stringify(remoteMessage));

      const title =
        remoteMessage?.notification?.title ||
        remoteMessage?.data?.title;

      if (title === 'New Ride Request') {
        playSound();
      }
    });


    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('onNotificationOpenedApp: ', JSON.stringify(remoteMessage));
      // playSound();
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            JSON.stringify(remoteMessage),
          );
        }
        if (remoteMessage.notification.title == 'New Ride Request') {
          playSound()
        }
      });
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('📩 Background message:', JSON.stringify(remoteMessage));

      const title =
        remoteMessage?.notification?.title ||
        remoteMessage?.data?.title;

      if (title === 'New Ride Request') {
        playSound();
      }
    });

  }, []);




  const playSound = () => {
    AudioPlayer.play();

  };



  useEffect(() => {
    // setTimeout(() => {
    //   pauseSound()
    // }, 5000);
    // playSound();
    (async () => {
      await requestLocationPermission();
      await requestNotificationPermission();
    })();

  }, []);
  return (
    <StripeProvider
      publishableKey="pk_test_51RnxvnQvoIqyn6dGF3i8lAlN6OcDrGJxVlGGMKHUpxsBVdIXkobbt8fEsj9x2WPCmFL6rMvZe29t1vpIgnMuVOdp00BAMi16aJ" // Replace with your test key
    >
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <MainContent />
            <StartLocationService />
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </StripeProvider>
  );
};

export default App;
