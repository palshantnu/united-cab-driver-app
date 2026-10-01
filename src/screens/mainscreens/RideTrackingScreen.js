import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Modal,
    Pressable,
    Platform,
    PermissionsAndroid,
    TextInput,
    Image,
    Linking,
    Alert,
    ScrollView
} from 'react-native';
import { AppState } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Color } from '../../theme';
import socket from '../../API/Socket';
import { CustomToast } from '../../component/ToastConfig';
import { postData } from '../../API';
import { useSelector } from 'react-redux';
import Geolocation from '@react-native-community/geolocation';
import MapViewDirections from 'react-native-maps-directions';
import OTPTextInput from 'react-native-otp-textinput';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import KeepAwake from 'react-native-keep-awake';

const { width, height } = Dimensions.get('window');

const parseCoordinate = (value, fallback = 0) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
};

const RideTrackingScreen = ({ route, navigation }) => {
    const { rideData } = route.params;

    const [rideStatus, setRideStatus] = useState('');
    console.log('rideStatus==>', rideStatus);
    const user = useSelector(state => state.user);
    const mapRef = useRef();
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const pickupLat = parseCoordinate(rideData.pickup_lat);
    const pickupLng = parseCoordinate(rideData.pickup_lng);
    const dropoffLat = parseCoordinate(rideData.dropoff_lat);
    const dropoffLng = parseCoordinate(rideData.dropoff_lng);

    const [driverLocation, setDriverLocation] = useState(null);
    const watchId = useRef(null);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [rideOTP, setRideOTP] = useState('');

    const [eta, setEta] = useState(null);
    const [distanceKm, setDistanceKm] = useState(null);
    const [isOpeningMaps, setIsOpeningMaps] = useState(false);

    const otpInput = useRef(null);

    // Check if ride is started
    const isRideStarted = rideStatus?.status === 'started' || rideData.status === 'started';

    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const handleAppStateChange = (nextState) => {
            console.log('AppState:', nextState);

            if (appState.current.match(/inactive|background/) && nextState === 'active') {
                console.log('🔄 App came to foreground → reconnect socket');

                if (!socket.connected) {
                    socket.connect();

                    // rejoin ride room after reconnect
                    socket.emit('getRideStatusFromServer', { rideId: rideData.id });
                }
            }

            appState.current = nextState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => subscription.remove();
    }, []);


    // Enhanced handleOpenMaps function with proper fallback
    const handleOpenMaps = async () => {
        if (isOpeningMaps) return;

        setIsOpeningMaps(true);

        try {
            let targetLocation;
            let locationName;

            // Condition to determine destination
            if (rideStatus?.status === 'arrived' || rideData.status === 'arrived' ||
                rideStatus?.status === 'started' || rideData.status === 'started') {
                // After arrival or during ride, navigate to drop-off
                targetLocation = { latitude: dropoffLat, longitude: dropoffLng };
                locationName = rideData.dropoff_address || 'Destination';
            } else {
                // Before arrival, navigate to pickup
                targetLocation = { latitude: pickupLat, longitude: pickupLng };
                locationName = rideData.pickup_address || 'Pickup Location';
            }

            console.log('📍 Navigating to:', locationName, targetLocation);

            // For Android: Try Google Maps first, then fallback
            if (Platform.OS === 'android') {
                await openMapsAndroid(targetLocation, locationName);
            }
            // For iOS: Try Google Maps first, then Apple Maps
            else if (Platform.OS === 'ios') {
                await openMapsIOS(targetLocation, locationName);
            }

        } catch (error) {
            console.error('Failed to open maps:', error);
            Alert.alert(
                'Map App Not Available',
                'Unable to open a map application. Please install Google Maps or Apple Maps.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsOpeningMaps(false);
        }
    };

    // Android map opening logic
    const openMapsAndroid = async (targetLocation, locationName) => {
        // First try Google Maps app
        const googleMapsUrl = `google.navigation:q=${targetLocation.latitude},${targetLocation.longitude}`;

        try {
            const supported = await Linking.canOpenURL(googleMapsUrl);

            if (supported) {
                console.log('🗺️ Opening Google Maps app');
                await Linking.openURL(googleMapsUrl);
                return;
            }
        } catch (error) {
            console.log('Google Maps app not available:', error);
        }

        // Fallback to generic geo URL
        console.log('🗺️ Opening generic maps app');
        const fallbackUrl = `geo:${targetLocation.latitude},${targetLocation.longitude}?q=${encodeURIComponent(locationName)}`;

        try {
            await Linking.openURL(fallbackUrl);
        } catch (fallbackError) {
            // Last resort: Open Google Maps in browser
            console.log('🗺️ Opening Google Maps in browser');
            const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${targetLocation.latitude},${targetLocation.longitude}&travelmode=driving`;
            await Linking.openURL(webUrl);
        }
    };

    // iOS map opening logic
    const openMapsIOS = async (targetLocation, locationName) => {
        // First try Google Maps iOS app
        const googleMapsUrl = `comgooglemaps://?daddr=${targetLocation.latitude},${targetLocation.longitude}&directionsmode=driving`;

        try {
            const supported = await Linking.canOpenURL(googleMapsUrl);

            if (supported) {
                console.log('🗺️ Opening Google Maps iOS app');
                await Linking.openURL(googleMapsUrl);
                return;
            }
        } catch (error) {
            console.log('Google Maps iOS app not available:', error);
        }

        // Fallback to Apple Maps
        console.log('🗺️ Opening Apple Maps');
        const appleMapsUrl = `http://maps.apple.com/?daddr=${targetLocation.latitude},${targetLocation.longitude}&dirflg=d`;

        try {
            await Linking.openURL(appleMapsUrl);
        } catch (appleMapsError) {
            // Last resort: Open Google Maps in browser
            console.log('🗺️ Opening Google Maps in browser');
            const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${targetLocation.latitude},${targetLocation.longitude}&travelmode=driving`;
            await Linking.openURL(webUrl);
        }
    };

    // Get button info based on ride status
    const getMapButtonInfo = () => {
        if (rideStatus?.status === 'arrived' || rideData.status === 'arrived' ||
            rideStatus?.status === 'started' || rideData.status === 'started') {
            return {
                text: 'Navigate to Drop-off',
                icon: 'location-on',
                subText: 'Go to passenger destination',
                iconColor: '#34C759',
                bgColor: '#34C759'
            };
        } else {
            return {
                text: 'Navigate to Pickup',
                icon: 'directions-car',
                subText: 'Go to passenger pickup',
                iconColor: '#007AFF',
                bgColor: '#007AFF'
            };
        }
    };

    const buttonInfo = getMapButtonInfo();

    // Request Android location permission for Android 6.0+
    const requestLocationPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Permission',
                        message: 'App needs access to your location',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        } else {
            return true;
        }
    };

    useEffect(() => {
        // Function to send location to server
        const sendLocation = async (latitude, longitude) => {
            try {
                const res = await axios.post(`https://unitedcabsmerthyr.uk/api/driverlocation/update`, {
                    driver_id: user.id,
                    ride_id: rideData.id,
                    lat: latitude,
                    lng: longitude,
                });
                console.log('📤 Location sent:', res.data);
            } catch (error) {
                console.log('❌ Error sending location:', error);
            }
        };

        // 1. Immediately get current location
        Geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;
                console.log('📍 Initial Position:', latitude, longitude);
                setDriverLocation({ latitude, longitude });

                if (mapRef.current) {
                    mapRef.current.animateToRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.09,
                        longitudeDelta: 0.09,
                    }, 1000);
                }

                await sendLocation(latitude, longitude);
            },
            error => {
                console.log('❌ Error getting initial location:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 100,
            }
        );

        // 2. Start watching for changes
        const id = Geolocation.watchPosition(
            async position => {
                const { latitude, longitude } = position.coords;
                console.log('✅ New Position:', latitude, longitude);
                setDriverLocation({ latitude, longitude });

                if (mapRef.current) {
                    mapRef.current.animateToRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.09,
                        longitudeDelta: 0.09,
                    }, 1000);
                }

                await sendLocation(latitude, longitude);
            },
            error => {
                console.log('❌ Error watching location:', error);
            },
            {
                enableHighAccuracy: true,
                distanceFilter: 0,
                interval: 100,
                fastestInterval: 50,
                useSignificantChanges: false,
            }
        );

        // Cleanup
        return () => {
            Geolocation.clearWatch(id);
        };
    }, []);

    useEffect(() => {
        if (mapRef.current && !driverLocation) {
            // Focus on pickup location initially if driver location unavailable
            mapRef.current.animateToRegion(
                {
                    latitude: pickupLat,
                    longitude: pickupLng,
                    latitudeDelta: 0.09,
                    longitudeDelta: 0.09,
                },
                1000
            );
        }
    }, []);

    useEffect(() => {
        const rideId = rideData.id;
        socket.emit('getRideStatusFromServer', { rideId });

        const handleRideStatusUpdate = updateData => {
            console.log('🔄 Real-time ride status update ===>:', updateData.status.status);
            setRideStatus(updateData.status);
            if (updateData.status.status === 'completed' || updateData.status.status == 'cancelled') {
                navigation.replace('BottomTabNavigator');
            }
        };

        socket.on('rideStatusUpdate', handleRideStatusUpdate);

        return () => {
            socket.off('rideStatusUpdate', handleRideStatusUpdate);
        };
    }, [rideData]);

    const ChangeRideStatus = async status => {
        const body = {
            driverId: user.id,
            rideId: rideData.id,
            status,
        };
        console.log('body ==>', body);
        const res = await postData('ride/update-status', body);
        console.log('res ==>', res);

        if (res?.success) {
            setModalMessage('Status updated successfully!');
            setModalVisible(true);
            if (res.status == 'cancelled' || res.status == 'completed') {
                navigation.replace('BottomTabNavigator');
            } else if (res.status == 'rideend') {
                navigation.replace('InvoiceScreen', { id: rideData.id });
            }
            CustomToast.show(res.error);
        } else {
            setModalMessage(res.error || 'Failed to update status');
            setModalVisible(true);
        }
    };

    const verifyOTPAndStartRide = async () => {
        if (!rideOTP) {
            setModalMessage('Please enter OTP');
            setModalVisible(true);
            return false;
        }

        const body = {
            rideId: rideData.id,
            driverId: user.id,
            status: 'start',
            otp: rideOTP,
        };

        const res = await postData('ride/update-status', body);

        if (res?.success) {
            setModalMessage('Status updated successfully!');
            setModalVisible(true);
            return true;
        } else {
            setModalMessage(res.error || 'Invalid OTP');
            setModalVisible(true);
            return false;
        }
    };

    console.log('driverLocation', driverLocation);

    const GOOGLE_MAPS_API_KEY = 'AIzaSyAvSirrQQWowYpUpem3I7FaeFZTsfWbDLQ';

    const getBadgeColor = () => {
        switch (rideStatus?.status) {
            case 'arrived':
                return { backgroundColor: Color.apptheme };
            case 'start':
                return { backgroundColor: Color.apptheme };
            case 'completed':
                return { backgroundColor: Color.apptheme };
            default:
                return { backgroundColor: Color.apptheme };
        }
    };
    useEffect(() => {
        // Screen always ON when ride is active
        KeepAwake.activate();

        return () => {
            // Screen normal behaviour when leaving screen
            KeepAwake.deactivate();
        };
    }, []);
    return (
        <View style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                style={{ ...StyleSheet.absoluteFillObject, height: '80%' }}
                showsUserLocation={true}
                initialRegion={{
                    latitude: pickupLat,
                    longitude: pickupLng,
                    latitudeDelta: 0.09,
                    longitudeDelta: 0.09,
                }}
                zoomEnabled
                scrollEnabled
                zoomControlEnabled
            >
                {driverLocation && (
                    <Marker coordinate={driverLocation}>
                        <Text style={{ fontSize: 30 }}>🚘</Text>
                    </Marker>
                )}

                <Marker coordinate={{ latitude: pickupLat, longitude: pickupLng }} title="Pickup" />
                <Marker coordinate={{ latitude: dropoffLat, longitude: dropoffLng }} pinColor="green" title="Drop-off" />

                {driverLocation?.latitude && (
                    <>
                        {(rideStatus?.status === 'accepted' || rideStatus?.status === 'arrived' || rideData.status === 'accepted' || rideData.status === 'arrived') && (
                            <MapViewDirections
                                origin={driverLocation}
                                destination={{ latitude: pickupLat, longitude: pickupLng }}
                                apikey={GOOGLE_MAPS_API_KEY}
                                strokeWidth={4}
                                strokeColor="#1e88e5"
                                mode="driving"
                                departureTime="now"
                                optimizeWaypoints={true}
                                onReady={(result) => {
                                    console.log('result', result);
                                    const distanceInMiles = result.distance * 0.621371;
                                    console.log('distanceInMiles', distanceInMiles);

                                    setDistanceKm(distanceInMiles);
                                    setEta(Math.ceil(result.duration_in_traffic || result.duration));
                                }}
                                onError={(err) => console.log('Directions error (to pickup):', err)}
                            />
                        )}

                        {(rideStatus?.status === 'started' || rideData.status === 'started') && (
                            <MapViewDirections
                                origin={driverLocation}
                                destination={{ latitude: dropoffLat, longitude: dropoffLng }}
                                apikey={GOOGLE_MAPS_API_KEY}
                                strokeWidth={4}
                                strokeColor="#000"
                                mode="driving"
                                departureTime="now"
                                optimizeWaypoints
                                onReady={(result) => {
                                    console.log('result', result);
                                    const distanceInMiles = result.distance * 0.621371;
                                    setDistanceKm(distanceInMiles);
                                    setEta(Math.ceil(result.duration_in_traffic || result.duration));
                                }}
                                onError={(err) => console.log('Directions error (to pickup):', err)}
                            />
                        )}
                    </>
                )}
            </MapView>

            {/* Bottom Card - Different layout based on ride status */}
            <View style={styles.bottomCard}>
                {!isRideStarted ? (
                    // BEFORE RIDE STARTS: Show full details
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'flex-start' }}>
                            <View style={styles.rideHeader}>
                                <Text style={styles.heading}>🚗 Ride in Progress</Text>
                                <Text style={styles.subHeading}>
                                    {eta && distanceKm
                                        ? `⏱ ${eta} mins • 📍 ${distanceKm.toFixed(2)} miles`
                                        : 'Calculating route...'}
                                </Text>
                            </View>

                            {/* Vector Icon Map Button */}
                            <TouchableOpacity
                                onPress={handleOpenMaps}
                                style={[
                                    styles.openMapButton,
                                    { backgroundColor: buttonInfo.bgColor },
                                    isOpeningMaps && styles.buttonDisabled
                                ]}
                                disabled={isOpeningMaps || !driverLocation}
                                activeOpacity={0.8}
                            >
                                {isOpeningMaps ? (
                                    <Text style={styles.openMapButtonText}>Opening...</Text>
                                ) : (
                                    <>
                                        <Icon
                                            name={buttonInfo.icon}
                                            size={20}
                                            color="#FFFFFF"
                                            style={styles.buttonIcon}
                                        />
                                        <Text style={styles.openMapButtonText}>
                                            {buttonInfo.text}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                        {console.log('rideData', rideData, rideStatus, 'rideStatus')
                        }
                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>👤 Customer: </Text>
                            <Text style={styles.value}>{rideData?.user?.name ?? 'User'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>📍 Pickup: </Text>
                            <Text style={styles.value}>{rideData.pickup_address}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>🏁 Drop: </Text>
                            <Text style={styles.value}>{rideData.dropoff_address}</Text>
                        </View>

                        <View style={[styles.statusBadge, getBadgeColor()]}>
                            <Text style={styles.statusText}>
                                {rideStatus?.status ? rideStatus.status.toUpperCase() : rideData.status ? rideData.status.toUpperCase() : 'WAITING FOR PICKUP'}
                            </Text>
                        </View>

                        <View style={styles.divider} />
                        {console.log('rideData', rideData, 'rideStatus', rideStatus)
                        }
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: '#4caf50' }]}
                                onPress={() => {
                                    const phone = rideData?.user?.phone;
                                    const country_code = rideData?.user?.country_code;
                                    console.log('${country_code}+${phone}', rideData?.user);

                                    if (phone) {
                                        Linking.openURL(`tel:${country_code}${phone}`);
                                    }
                                }}
                            >
                                <Text style={styles.buttonText}>📞 Call</Text>
                            </TouchableOpacity>
                            {(!rideStatus || rideStatus.status === '') && <TouchableOpacity onPress={() => ChangeRideStatus('cancelled')} style={[styles.button, { backgroundColor: '#e53935' }]}>
                                <Text style={styles.buttonText}>❌ Cancel</Text>
                            </TouchableOpacity>}
                        </View>

                        {(rideData.status == 'accepted') && (
                            <TouchableOpacity onPress={() => ChangeRideStatus('arrived')} style={styles.arrivedButton}>
                                <Text style={styles.arrivedText}>✅ Mark as Arrived</Text>
                            </TouchableOpacity>
                        )}

                        {(rideStatus?.status === 'arrived' || rideData.status == 'arrived') && (
                            <TouchableOpacity onPress={() => setShowOTPModal(true)} style={styles.arrivedButton}>
                                <Text style={styles.arrivedText}>🚀 Start Ride</Text>
                            </TouchableOpacity>
                        )}

                        {/* Location status indicator */}
                        {!driverLocation && (
                            <View style={styles.locationWarning}>
                                <Icon name="gps-not-fixed" size={14} color="#FF9500" />
                                <Text style={styles.warningText}>
                                    Waiting for your location...
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                ) : (
                    // AFTER RIDE STARTS: Show simplified UI
                    <View style={styles.simpleRideContainer}>
                        {/* <Text style={styles.simpleHeading}>🚕 Ride Started</Text> */}

                        {eta && distanceKm && (
                            <View style={styles.etaContainer}>
                                <Text style={styles.etaText}>
                                    ⏱ {eta} mins • 📍 {distanceKm.toFixed(2)} miles
                                </Text>
                            </View>
                        )}

                        <View style={styles.simpleButtonContainer}>
                            <TouchableOpacity
                                onPress={handleOpenMaps}
                                style={[styles.simpleMapButton, isOpeningMaps && styles.buttonDisabled]}
                                disabled={isOpeningMaps}
                            >
                                <Icon name="navigation" size={20} color="#FFFFFF" />
                                <Text style={styles.simpleMapButtonText}>Navigate to Drop-off</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => ChangeRideStatus('rideend')}
                                style={styles.finishButton}
                            >
                                <Icon name="check-circle" size={20} color="#FFFFFF" />
                                <Text style={styles.finishButtonText}>Finish Ride</Text>
                            </TouchableOpacity>
                        </View>


                    </View>
                )}
            </View>

            {/* Modals remain unchanged */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Status Update</Text>
                        <Text style={styles.modalText}>{modalMessage}</Text>
                        <Pressable
                            style={({ pressed }) => [
                                styles.buttonClose,
                                pressed && { opacity: 0.7 },
                            ]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.textStyle}>OK</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
            <Modal
                animationType="slide"
                transparent={true}
                visible={showOTPModal}
                onRequestClose={() => setShowOTPModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Enter OTP to Start Ride</Text>

                        <OTPTextInput
                            ref={otpInput}
                            inputCount={4}
                            tintColor={Color.black}
                            offTintColor={Color.black}
                            handleTextChange={setRideOTP}
                            containerStyle={styles.otpContainer}
                            textInputStyle={[styles.otpInput, { borderColor: Color.black, borderRadius: 10 }]}
                        />

                        <TouchableOpacity
                            style={styles.buttonClose}
                            onPress={async () => {
                                const result = await verifyOTPAndStartRide();
                                if (result) setShowOTPModal(false);
                            }}
                        >
                            <Text style={styles.textStyle}>Submit OTP</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: -3 },
        shadowRadius: 5,
        maxHeight: height * 0.85,
    },
    rideHeader: {
        marginBottom: 10,
        flex: 1,
        marginRight: 10
    },
    heading: {
        fontSize: 20,
        fontWeight: '700',
        color: Color.apptheme
    },
    subHeading: {
        fontSize: 14,
        color: '#666',
        marginTop: 2
    },
    infoRow: {
        marginBottom: 8,
        flexDirection: 'row',
        width: '100%'
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: '#888'
    },
    value: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
        flex: 1,
        flexWrap: 'wrap'
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 10
    },
    statusBadge: {
        backgroundColor: '#e3f2fd',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    statusText: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '600'
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15
    },
    arrivedButton: {
        backgroundColor: Color.apptheme,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    arrivedText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700'
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingHorizontal: 20,
    },
    modalView: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: 'white',
        borderRadius: 16,
        paddingVertical: 30,
        paddingHorizontal: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Color.apptheme,
        marginBottom: 12,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    buttonClose: {
        backgroundColor: Color.apptheme,
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 40,
        elevation: 3,
    },
    textStyle: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
        textAlign: 'center',
    },
    otpContainer: {
        width: '100%',
        marginBottom: 20,
    },
    otpInput: {
        borderWidth: 1,
        fontSize: 20,
        fontFamily: 'Figtree-Medium',
        color: '#141B34',
    },
    openMapButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        minWidth: 120,
        maxWidth: 150,
    },
    openMapButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
        marginLeft: 6,
    },
    buttonIcon: {
        // Icon styling
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    locationWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF9F0',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#FFE4B5',
    },
    warningText: {
        color: '#FF9500',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 6,
    },

    // SIMPLIFIED UI STYLES (When ride is started)
    simpleRideContainer: {
        padding: 10,
    },
    simpleHeading: {
        fontSize: 22,
        fontWeight: '700',
        color: Color.apptheme,
        marginBottom: 15,
        textAlign: 'center',
    },
    simpleInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
    },
    simpleValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginLeft: 10,
        flex: 1,
    },
    etaContainer: {
        backgroundColor: '#E8F5E9',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    etaText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E7D32',
    },
    simpleButtonContainer: {
        marginBottom: 10,
    },
    simpleMapButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    simpleMapButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 8,
    },
    finishButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    finishButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 8,
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#4CAF50',
        borderRadius: 10,
        marginTop: 5,
    },
    callButtonText: {
        color: '#4CAF50',
        fontWeight: '600',
        fontSize: 15,
        marginLeft: 8,
    },
});

export default RideTrackingScreen;