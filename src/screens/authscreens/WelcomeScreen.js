import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    SafeAreaView,
} from 'react-native';
import { Color } from '../../theme';
import { useTranslation } from 'react-i18next';
import i18n from '../../locales/i18n';

const WelcomeScreen = ({ navigation }) => {
    const { t } = useTranslation();
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.middleContent}>
                <Image
                    source={{
                        uri: 'https://img.freepik.com/free-vector/taxi-app-concept-illustration_52683-36028.jpg?ga=GA1.1.817975233.1742811073&semt=ais_hybrid&w=740',
                    }}
                    style={styles.logo}
                />

                <Text style={styles.title}>{t('Welcome')}</Text>
                <Text style={styles.subtitle}>{t('HaveBetterExperience')}</Text>
            </View>

            <View style={styles.bottomButtons}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('LoginScreen')}
                >
                    <Text style={styles.buttonText}>{t('Login')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.outlinedButton}
                    onPress={() => navigation.navigate('SignUp')}
                >
                    <Text style={styles.outlinedButtonText}>{t('SignUp')}</Text>
                </TouchableOpacity>
            </View>

            {/* Optional language switcher */}
            {/* <TouchableOpacity onPress={() => i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en')}>
                <Text style={{ textAlign: 'center', marginTop: 20 }}>
                    {i18n.language === 'en' ? 'Switch to Hindi' : 'अंग्रेज़ी में बदलें'}
                </Text>
            </TouchableOpacity> */}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        paddingBottom: 40,
    },
    middleContent: {
        alignItems: 'center',
        marginTop: '30%',
    },
    logo: {
        width: '100%',
        height: 200,
        marginBottom: 30,
        borderRadius: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    bottomButtons: {
        width: '90%',
        alignSelf: 'center',
    },
    button: {
        backgroundColor: Color.apptheme,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    outlinedButton: {
        borderWidth: 2,
        borderColor: Color.apptheme,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom:10
    },
    outlinedButtonText: {
        color: Color.apptheme,
        fontWeight: '700',
        fontSize: 16,
    },
});

export default WelcomeScreen;
