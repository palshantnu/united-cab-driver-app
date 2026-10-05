import { useEffect } from 'react';
import { Alert, Linking, LogBox, StatusBar, StyleSheet, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Color } from './src/theme';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import Authnavigation from './src/navigation/Authnavigation';
import AppUpdateModal from './src/component/AppUpdateModal';

const MainContent = () => {
  const insets = useSafeAreaInsets();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Color.apptheme }}>
      <NavigationContainer>

        <SafeAreaView
          edges={['left', 'right', 'bottom', 'top']}
          style={{
            flex: 1,
            backgroundColor: Color.apptheme,
            //   paddingBottom: insets.bottom,
          }}
        >
          <StatusBar
            animated={true}
            backgroundColor={Color.apptheme}
            barStyle="dark-content"
          />
          <Authnavigation />
        </SafeAreaView>
      </NavigationContainer>
      <AppUpdateModal />
    </GestureHandlerRootView>
  );
};


export default MainContent

const styles = StyleSheet.create({})