import React from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    Image,
} from 'react-native';
import { Assets } from '../assets';
import { useSelector } from 'react-redux';
// import FastImage from 'react-native-fast-image'
// Local import


const SplashScreen = ({ navigation }) => {
    const isLoggedIn = useSelector(state => state.isLoggedIn);
    console.log('isLoggedIn', isLoggedIn);

    setTimeout(() => {
        navigation.replace(isLoggedIn ? 'HomeStack' : 'Welcome')
    }, 2000);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#fff' }]}>
            <View style={styles.logoContainer}>
                <Image
                    source={{
                        uri: 'https://aalf.rootstechnology.in/assets/img/logo.jpeg',
                        // headers: { Authorization: '762628hbs' },
                        // priority: FastImage.priority.normal,
                    }}
                    style={styles.imageStyle}
                    resizeMode={'contain'}
                />
             
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        height: '90%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageStyle: {
        width: 200,
        height: 200,
    },
});

export default SplashScreen;
