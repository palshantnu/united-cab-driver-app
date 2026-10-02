import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUpScreen from '../screens/authscreens/SignUpScreen';
import WelcomeScreen from '../screens/authscreens/WelcomeScreen';
import SplashScreen from '../screens/Splashscreen';
import LoginScreen from '../screens/authscreens/LoginScreen';
import OtpScreen from '../screens/authscreens/OtpScreen';
import BottomTabNavigator from './BottomTabNavigator';
import HomeScreen from '../screens/mainscreens/HomeScreen';
import RideTrackingScreen from '../screens/mainscreens/RideTrackingScreen';
import ProfileScreen from '../screens/mainscreens/ProfileScreen';
import BookingDetailsScreen from '../screens/mainscreens/BookingDetailsScreen';
import SubscriptionPlansScreen from '../screens/mainscreens/SubscriptionPlansScreen';
import MySubscriptionPlans from '../screens/mainscreens/MySubscriptionPlans';
import InvoiceScreen from '../screens/mainscreens/InvoiceScreen';
import HistoryScreen from '../screens/mainscreens/HistoryScreen';
import HistoryScreenWithBack from '../screens/mainscreens/HistoryScreenWithBack';
import CmsScreen from '../screens/mainscreens/CmsScreen';
import NotificationScreen from '../screens/mainscreens/NotificationScreen';



const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  return (
      <Stack.Navigator initialRouteName="BottomTabNavigator">
        <Stack.Screen name="BottomTabNavigator" component={BottomTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="RideTrackingScreen" component={RideTrackingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SubscriptionPlans" component={SubscriptionPlansScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MySubscriptionPlans" component={MySubscriptionPlans} options={{ headerShown: false }} />
        <Stack.Screen name="InvoiceScreen" component={InvoiceScreen} options={{ headerShown: false }} />
        <Stack.Screen name="HistoryScreenWithBack" component={HistoryScreenWithBack} options={{ headerShown: false }} />
        <Stack.Screen name="CmsScreen" component={CmsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NotificationScreen" component={NotificationScreen} options={{ headerShown: false }} />
      
      </Stack.Navigator>
  );
};

export default StackNavigator;
