import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { NativeModules } from 'react-native';

const { AudioPlayer } = NativeModules;

messaging().setBackgroundMessageHandler(async remoteMessage => {

 console.log("Kill Mode Message",remoteMessage);

 const title = remoteMessage?.data?.title;

 if(title==="New Ride Request"){

  AudioPlayer.play();

  await notifee.displayNotification({

   title:remoteMessage.data.title,

   body:remoteMessage.data.body,

   android:{

    channelId:'ride_channel',

    sound:'notification',

    pressAction:{
     id:'default'
    }

   },

   ios:{
    sound:'notification.wav'
   }

  });

 }

});