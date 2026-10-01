import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUpScreen from '../screens/authscreens/SignUpScreen';
import WelcomeScreen from '../screens/authscreens/WelcomeScreen';
import SplashScreen from '../screens/Splashscreen';
import LoginScreen from '../screens/authscreens/LoginScreen';
import OtpScreen from '../screens/authscreens/OtpScreen';
import BottomTabNavigator from './BottomTabNavigator';
import StackNavigator from './StackNavigator';



const Stack = createNativeStackNavigator();

const Authnavigation = () => {
  return (
      <Stack.Navigator initialRouteName="SplashScreen">
        <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp"  options={{ headerShown: false }}  component={SignUpScreen} />     
        <Stack.Screen name="OtpScreen"  options={{ headerShown: false }}  component={OtpScreen} />     
        <Stack.Screen name="LoginScreen"  options={{ headerShown: false }}  component={LoginScreen} />     
        <Stack.Screen name="HomeStack"  options={{ headerShown: false }}  component={StackNavigator} />     
      </Stack.Navigator>
  );
};

export default Authnavigation;
