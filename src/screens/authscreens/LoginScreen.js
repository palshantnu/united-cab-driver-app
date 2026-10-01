import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    SafeAreaView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomDropdownComponent from '../../component/CustomDropdownComponent';
import { Color } from '../../theme';
import Topbar from '../../component/Topbar';
import { useTranslation } from 'react-i18next';
import { countriesData } from '../../constant/Countrydata';
import { CustomToast } from '../../component/ToastConfig';
import { getSyncData, storeDatasync } from '../../storage/AsyncStorage';
import messaging from '@react-native-firebase/messaging';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';

const LoginScreen = ({ navigation }) => {
    const [checked, setChecked] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState({});
    const { t } = useTranslation();
    const [items2, setItems2] = useState(countriesData);
    const [mobileNumber, setMobileNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const handleCountrySelect = (item) => {
        setSelectedCountry(item);
    };
    const validateForm = () => {
        const newErrors = {};
        console.log('selectedCountry', selectedCountry);

        if (Object.keys(selectedCountry).length == 0) {
            newErrors.country = t('PleaseSelectCountry');
        }

        if (!mobileNumber) {
            newErrors.mobile = t('PleaseEnterMobileNumber');
        }
        else if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
            newErrors.mobile = t('InvalidMobileNumber');
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };
    const handleLogin = async (fcmToken) => {
        console.log('====================================');
        console.log(fcmToken);
        console.log('====================================');
        if (validateForm()) {
            setLoading(true);
            const countryCode = selectedCountry?.country_code ? selectedCountry.country_code : '';
            try {
                const confirmation = await signInWithPhoneNumber(getAuth(), `${countryCode}${mobileNumber}`);

                console.log('confirmation',confirmation)
                setLoading(false);
                navigation.navigate('OtpScreen', {
                    flow: 'login',
                    confirmation,
                    fcmToken,
                    phone: mobileNumber,
                    country_code: countryCode,
                })
            } catch (error) {
                console.log('firebase-signInWithPhoneNumber-error==>', error);
                setLoading(false);
                CustomToast.show(error?.message || t('SomethingWentWrong'))
            }
        }
    };

    const getFcmToken = async () => {
        try {
            // 1️⃣ Ask permission
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (!enabled) {
                console.log('Notification permission not granted');
                handleLogin(null);
                return;
            }

            // 2️⃣ Register device (iOS REQUIRED)
            await messaging().registerDeviceForRemoteMessages();

            // 3️⃣ Check APNs token (IMPORTANT for iOS)
            if (Platform.OS === 'ios') {
                const apns = await messaging().getAPNSToken();
                if (!apns) {
                    handleLogin(null);
                    return;
                }
            }
            let fcmToken = await getSyncData('fcmToken');

            if (!fcmToken) {
                fcmToken = await messaging().getToken();
                console.log('New FCM Token:', fcmToken);
                await storeDatasync('fcmToken', fcmToken);
            } else {
                console.log('Existing FCM Token:', fcmToken);
            }

            handleLogin(fcmToken);

        } catch (error) {
            console.log('ERROR GETTING TOKEN:', error);
            handleLogin(null); // fail-safe
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Color.white }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={Color.apptheme} />
                        </View>
                    )}
                    <View style={styles.container}>
                        {/* Topbar */}
                        <Topbar title={t('')} navigation={navigation} />

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Content for login */}
                            <View style={{ flex: 1 }}>
                                <View style={styles.contentContainer}>
                                    <Text style={styles.welcomeText}>{t('WelcomeBack')}</Text>
                                    <Text style={styles.instructionText}>
                                        {t('EnterPhoneNumberForVerification')}
                                    </Text>
                                    <Text style={styles.instructionDetailText}>
                                        {t('YourNumberWillBeUsedForVerificationOnly')}
                                    </Text>
                                </View>

                                {/* Country & Phone Number Input */}
                                <View style={{ flexDirection: 'row', marginTop: 30 }}>
                                    <View style={{ width: width * 0.20 }}>
                                        <CustomDropdownComponent
                                            Title={t('SelectCountry')}
                                            editable={true}
                                            placeholder={t('Choose')}
                                            countryData={items2}
                                            selectedCountryData={selectedCountry}
                                            onSelect={handleCountrySelect}
                                            errorMessage={t('PleaseSelectCountry')}
                                        />
                                    </View>

                                    <View style={{ width: width * 0.01 }} />

                                    <View style={styles.phoneContainer}>
                                        <TextInput
                                            style={styles.phoneInput}
                                            placeholder={t('YourMobileNumber')}
                                            placeholderTextColor="#999"
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                            value={mobileNumber}
                                            onChangeText={text => {
                                                setMobileNumber(text);
                                                if (errors.mobile) setErrors(prev => ({ ...prev, mobile: '' }));
                                            }}
                                        />
                                    </View>

                                </View>
                                {errors.mobile && (
                                    <Text style={{ color: 'red', fontSize: 12, marginTop: 5, textAlign: 'center' }}>{errors.mobile}</Text>
                                )}
                                {errors.country && (
                                    <Text style={{ color: 'red', fontSize: 12, marginTop: 5, textAlign: 'center' }}>{errors.country}</Text>
                                )}
                            </View>
                            {/* Login Button at the bottom */}
                            <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 0 }}>
                                <TouchableOpacity style={styles.button} onPress={getFcmToken}>
                                    <Text style={styles.buttonText}>{t('Login')}</Text>
                                </TouchableOpacity>

                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    form: {
        flex: 1,
        marginTop: 10,
        // justifyContent: 'flex-start',  // Ensures the content stays at the top and the button is at the bottom
    },

    contentContainer: {
        alignItems: 'center',
        // marginBottom: 20, // Adjusted margin for spacing
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Color.apptheme,
        marginBottom: 10,
    },
    instructionText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 10,
    },
    instructionDetailText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 30, // Adjusted margin for spacing
    },

    phoneContainer: {
        width:  width * 0.65,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        height: 50,
        justifyContent: 'center',
    },
    phoneInput: {
        paddingHorizontal: 10,
        fontSize: 16,
    },

    button: {
        backgroundColor: Color.apptheme,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 50,
    },
    buttonText: { color: '#fff', fontWeight: '600' },
    loadingOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },

});

export default LoginScreen;
