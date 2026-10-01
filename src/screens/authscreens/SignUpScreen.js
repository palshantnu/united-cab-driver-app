import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Dimensions,
    SafeAreaView,
    ToastAndroid,
    ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DropDownPicker from 'react-native-dropdown-picker';
import CustomDropdownComponent from '../../component/CustomDropdownComponent';
import { Color } from '../../theme';
import Topbar from '../../component/Topbar';
import { useTranslation } from 'react-i18next';
import { getData } from '../../API';
import { countriesData } from '../../constant/Countrydata';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { CommonActions } from '@react-navigation/native';
// import Toast from 'react-native-toast-message';
import { CustomToast } from '../../component/ToastConfig';
import { getSyncData, storeDatasync } from '../../storage/AsyncStorage';
import messaging from '@react-native-firebase/messaging';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';

const SignUpScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);

    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const user = useSelector(state => state.user);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');

    const [gender, setGender] = useState(null);
    const [items, setItems] = useState([
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' },
    ]);
    const [vehicleType, setVehicleType] = useState(null);
    const [vehicleTypes, setVehicleTypes] = useState([]);

    const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
    const [checked, setChecked] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(null);

    const handleCountrySelect = (item) => {
        setSelectedCountry(item);
    };

    const getVehicalType = async () => {
        const res = await getData('vehicle-types');
        console.log('formattedData', res);

        const formattedData = res.vehicle_types.map(item => ({
            label: item.type_name,
            value: item.id.toString(), // Use string if DropDownPicker expects string
        }));
        dispatch({
            type: 'SET_VEHICALTYPE',
            payload: formattedData,
        });

        console.log('formattedData', formattedData);
        setVehicleTypes(formattedData)

    }

    useEffect(() => {
        getVehicalType();
    }, [])

    const VerificationSend = async (fcmToken) => {
        const countryCode = selectedCountry?.country_code ? selectedCountry.country_code : '';
        try {
            const confirmation = await signInWithPhoneNumber(getAuth(), `${countryCode}${mobileNumber}`);
            setLoading(false);
            navigation.navigate('OtpScreen', {
                flow: 'register',
                confirmation,
                fcmToken,
                registrationData: {
                    name,
                    email,
                    mobileNumber,
                    gender,
                    selectedCountry: countryCode,
                    vehicleNumber,
                    vehicleModel,
                    licenseNumber,
                    vehicleType,
                },
            })
        } catch (error) {
            console.log('firebase-signInWithPhoneNumber-error==>', error);
            setLoading(false);
            CustomToast.show(error?.message || t('SomethingWentWrong'))
        }
    }
    const getFcmToken = async () => {
        let fcmToken = await getSyncData('fcmToken');
        console.log('the old token', fcmToken);
        if (!fcmToken) {
            try {
                const fcmToken = await messaging().getToken();
                if (fcmToken) {
                    // user has a device token
                    console.log('the new token', fcmToken);
                    await storeDatasync('fcmToken', fcmToken);
                    RegisterDriver(fcmToken)
                }
            } catch (error) {
                console.log('error getting token', error);
            }
        } else {

            RegisterDriver(fcmToken)
        }
    };
    const RegisterDriver = async (fcmToken) => {


        if (!name.trim()) {
            alert(t('PleaseEnterName'));
            return;
        }
        if (!email.trim()) {
            alert(t('PleaseEnterEmail'));
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert(t('PleaseEnterValidEmail'));
            return;
        }
        if (!selectedCountry) {
            alert(t('PleaseSelectCountry'));
            return;
        }
        if (!mobileNumber.trim()) {
            alert(t('PleaseEnterMobileNumber'));
            return;
        }
        if (mobileNumber.length < 10) {
            alert(t('MobileNumberMustBe10Digits'));
            return;
        }
        // if (!gender) {
        //     alert(t('PleaseSelectGender'));
        //     return;
        // }

        if (!vehicleNumber.trim()) {
            alert(t('PleaseEnterVehicleNumber'));
            return;
        }
        if (!vehicleModel.trim()) {
            alert(t('PleaseEnterVehicleModel'));
            return;
        }
        if (!licenseNumber.trim()) {
            alert(t('PleaseEnterLicenseNumber'));
            return;
        }
        if (!vehicleType) {
            alert(t('PleaseSelectVehicleType'));
            return;
        }

        if (!checked) {
            alert(t('PleaseAcceptTerms'));
            return;
        }
        setLoading(true);
        VerificationSend(fcmToken);
    };


    const { width } = Dimensions.get('window');
    const [currentStep, setCurrentStep] = useState(1);
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Color.white }}>
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Color.apptheme} />
                </View>
            )}

            <View style={styles.container}>
                <Topbar title={t('SignUp')} navigation={navigation} />
                <View style={styles.form}>
                    {currentStep === 1 && (
                        <>
                            <TextInput value={name}
                                onChangeText={setName} style={styles.input} placeholder={t('Name')} placeholderTextColor="#999" />
                            <TextInput value={email}
                                onChangeText={setEmail} style={styles.input} placeholder={t('Email')} placeholderTextColor="#999" />
                            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                                <View style={{ width: width * 0.18 }}>
                                    <CustomDropdownComponent
                                        Title={t('SelectCountry')}
                                        editable={true}
                                        placeholder={t('ChooseCountry')}
                                        countryData={countriesData}
                                        selectedCountryData={selectedCountry}
                                        onSelect={handleCountrySelect}
                                        errorMessage="Please select a country"
                                    />
                                </View>
                                <View style={{ width: width * 0.01 }} />
                                <View style={styles.phoneContainer}>
                                    <TextInput
                                        style={styles.phoneInput}
                                        placeholder={t('MobileNumber')}
                                        placeholderTextColor="#999"
                                        keyboardType="phone-pad"
                                        value={mobileNumber}
                                        onChangeText={setMobileNumber}
                                        maxLength={10}
                                    />
                                </View>
                            </View>
                            <View style={styles.dropdown}>
                                <DropDownPicker
                                    open={open}
                                    value={gender}
                                    items={items}
                                    setOpen={setOpen}
                                    setValue={setGender}
                                    setItems={setItems}
                                    placeholder={t('SelectGender') + ' (optional)'}
                                    style={{ borderColor: '#ccc', marginBottom: 12 }}
                                    dropDownContainerStyle={{ borderColor: '#ccc' }}
                                />
                            </View>

                            <TouchableOpacity style={styles.button} onPress={() => setCurrentStep(2)}>
                                <Text style={styles.buttonText}>{t('Next')}</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {currentStep === 2 && (
                        <>


                            <TextInput
                                style={styles.input}
                                placeholder={t('VehicleNumber')}
                                placeholderTextColor="#999"
                                value={vehicleNumber}
                                onChangeText={setVehicleNumber}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder={t('VehicleModel')}
                                placeholderTextColor="#999"
                                value={vehicleModel}
                                onChangeText={setVehicleModel}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder={t('LicenseNumber')}
                                placeholderTextColor="#999"
                                value={licenseNumber}
                                onChangeText={setLicenseNumber}
                            />
                            <View style={{ zIndex: 20 }}>
                                <DropDownPicker
                                    open={vehicleDropdownOpen}
                                    value={vehicleType}
                                    items={vehicleTypes}
                                    setOpen={setVehicleDropdownOpen}
                                    setValue={setVehicleType}
                                    setItems={setVehicleTypes}
                                    placeholder={t('SelectVehicleType')}
                                    style={{ borderColor: '#ccc', marginBottom: 12 }}
                                    dropDownContainerStyle={{ borderColor: '#ccc' }}
                                    zIndex={3000}
                                    zIndexInverse={1000}
                                />
                            </View>

                            <View style={styles.termsContainer}>
                                <Ionicons
                                    onPress={() => setChecked(!checked)}
                                    name={checked ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={20}
                                    color={checked ? 'green' : 'gray'}
                                    style={styles.icon}
                                />

                                <Text style={styles.termsText}>
                                    {t('TermsText')}{' '}
                                    <Text style={styles.link}>{t('TermsOfService')}</Text>{' '}
                                    {t('and')}{' '}
                                    <Text style={styles.link}>{t('PrivacyPolicy')}</Text>.
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, { opacity: checked ? 1 : 0.5 }]}
                                onPress={() => getFcmToken()}
                                disabled={!checked}
                            >
                                <Text style={styles.buttonText}>{t('SignUp')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setCurrentStep(1)}
                                style={{ marginTop: 15 }}
                            >
                                <Text style={[styles.buttonText, { color: Color.apptheme, textAlign: 'center' }]}>
                                    {t('Back')}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}

                </View>

            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    form: { flex: 1, marginTop: 10 },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
        color: '#000',
        width: '100%',
    },
    phoneContainer: {
        width: '77%',
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
    dropdown: {
        width: '100%',
        marginBottom: 12,
        zIndex: 10,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    icon: { marginRight: 6 },
    termsText: { fontSize: 14, flexShrink: 1 },
    link: { color: 'blue', textDecorationLine: 'underline' },
    button: {
        backgroundColor: Color.apptheme,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: { color: '#fff', fontWeight: '600' },
    uploadButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    uploadText: { color: '#555' },
    loadingOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },

});

export default SignUpScreen;
