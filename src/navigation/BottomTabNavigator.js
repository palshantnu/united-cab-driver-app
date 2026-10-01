import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/mainscreens/HomeScreen';
import HistoryScreen from '../screens/mainscreens/HistoryScreen';
import SettingsScreen from '../screens/mainscreens/SettingsScreen';
import DriverReportScreen from '../screens/mainscreens/DriverReportScreen';
import { Color } from '../theme'; // Make sure the path is correct
import WalletScreen from '../screens/mainscreens/WalletScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case 'Home':
                            iconName = 'home-outline';
                            break;
                        case 'DriverReport':
                            iconName = 'car-outline';
                            break;
                        case 'History':
                            iconName = 'time-outline';
                            break;
                        case 'Wallet':
                            iconName = 'wallet-outline'; // <- Added Wallet icon
                            break;
                        case 'Settings':
                            iconName = 'settings-outline';
                            break;
                        default:
                            iconName = 'ellipse-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: Color.apptheme,
                tabBarInactiveTintColor: '#999',
                headerShown: false,
                tabBarStyle: {
                    paddingVertical: 10,
                    height: 80,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    position: 'absolute',
                    backgroundColor: '#fff',
                    elevation: 8,
                    paddingTop:8
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    flexWrap: 'wrap',
                    textAlign: 'center',
                    width: 100, // adjust as per your need
                  },
                  
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen options={{ title: 'Driver Report' }} name="DriverReport" component={DriverReportScreen} />
            <Tab.Screen name="History" component={HistoryScreen} />
            <Tab.Screen name="Wallet" component={WalletScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
};

export default BottomTabNavigator;
