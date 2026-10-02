import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    Image,
    Animated,
    Easing,
    StatusBar,
    Modal,
    Pressable,
    NativeModules,
    AppState
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Color } from '../../theme';
import RideRequestSheet from '../../component/bottomsheet/RideRequestSheet';
import { updateLocation } from '../../API/api';
import Geolocation from '@react-native-community/geolocation';
import socket from '../../API/Socket';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { postData } from '../../API';
import { CustomToast } from '../../component/ToastConfig';
import { ActivityIndicator } from 'react-native-paper';
import { getSyncData, storeDatasync } from '../../storage/AsyncStorage';
const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const mapRef = useRef(null);
    const user = useSelector(state => state.user);
    console.log(user);
    const { AudioPlayer } = NativeModules;

    const serviceSheetRef = useRef(null);
    const [loading, setLoading] = useState(false);

    const [driverStatus, setDriverStatus] = useState(0); // 'on_duty' or 'off_duty'
    const [RideRequest, setRideRequest] = useState(''); // 'on_duty' or 'off_duty'
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [loadingstatus, setLoadingstatus] = useState(false);
    const dutyStatusStorageKey = user?.id ? `driverDutyStatus_${user.id}` : null;

    const getActiveStatus = async () => {
        if (!user?.id) return;
        setLoadingstatus(true);
        const body = { driver_id: user.id };

        try {
            const res = await postData('driver_status_get', body);
            console.log('res===>', res);
            const serverStatus = Number(res?.online_status);
            const savedStatus = dutyStatusStorageKey ? Number(await getSyncData(dutyStatusStorageKey)) : null;

            if (savedStatus === 1 && serverStatus !== 1) {
                const restoreBody = {
                    driver_id: user.id,
                    online_status: 1
                };
                const restoreRes = await postData('driver_status_update', restoreBody);
                console.log('restore status res===>', restoreRes);
                setDriverStatus(1);
            } else {
                setDriverStatus(Number.isNaN(serverStatus) ? 0 : serverStatus);
            }
        } catch (error) {
            console.log('get active status error===>', error);
        } finally {
            setLoadingstatus(false);
        }
    };

    const ChangeActiveStatus = async (status) => {
        if (!user?.id) return;
        setLoadingstatus(true)
        const body = {
            driver_id: user.id,
            online_status: status
        }
        console.log('body2', body);

        const res = await postData('driver_status_update', body);
        console.log('res===>', res);
        const updatedStatus = Number(res?.updated_online_status ?? status);
        if (dutyStatusStorageKey) {
            await storeDatasync(dutyStatusStorageKey, updatedStatus);
        }
        setDriverStatus(updatedStatus);
        setLoadingstatus(false);

        if (updatedStatus === 0) {
            socket.disconnect();
        }

        if (updatedStatus === 1) {
            setModalMessage('You Are Now Online');
        } else {
            setModalMessage('You Are Now Offline');
        }

        setModalVisible(true);

    }
    useEffect(() => {
        getActiveStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])



    const [userLocation, setUserLocation] = useState({
        latitude: 51.7504345,
        longitude: -3.3659078,
    });
    const driverId = user.id

    useEffect(() => {
        if (!user?.id) return;
        if (driverStatus !== 1) return;

        socket.connect();
        // Listen to live updates of nearby drivers
        const handleLiveDriverUpdates = (data) => {
            console.log('Live update:', data);
        };
        const handleRideStatus = ({ status }) => {
            setRideStatus(status);
            console.log('Live status:', status);

        };
        const handleNewRideRequest = (data) => {
            console.log('New ride request:', data);
            AudioPlayer.play();
            setRideRequest(data);
            setLoading(true);
        };

        socket.on('liveDriverUpdates', handleLiveDriverUpdates);
        socket.on('rideStatusUpdate', handleRideStatus);
        socket.on('newRideRequest', handleNewRideRequest);

        // Register user to receive live updates
        if (driverStatus === 1) {
            socket.emit('registerDriver', {
                driverId,
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                vehicleTypeId: user.vehicle_id,
            });
        }


        // Fetch initially nearby drivers
        // handleUpdateLocation();

        // Watch the user's location
        const watchId = Geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log('Updated Position:', latitude, longitude);

                // Only update if the location has changed

                setUserLocation({ latitude, longitude });
                if (driverStatus === 1) {
                    socket.emit('updateDriverLocation', { driverId, lat: latitude, lng: longitude });
                }

            },
            (error) => console.error('Error watching position:', error),
            {
                enableHighAccuracy: true, // Ensure high accuracy
                distanceFilter: 1, // Update location only after the device has moved by 10 meters
                interval: 1000, // Update location every second
                fastestInterval: 500, // Update as fast as every 500ms if possible
            }
        );


        return () => {
            // Keep the socket alive; explicit disconnect can mark the driver offline on the server.
            socket.off('liveDriverUpdates', handleLiveDriverUpdates);
            socket.off('rideStatusUpdate', handleRideStatus);
            socket.off('newRideRequest', handleNewRideRequest);
            Geolocation.clearWatch(watchId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [driverStatus, user?.id]);
    const checkPreviusRide = async () => {
        const body = {
            driver_id: user.id
        }
        const res = await postData('driver/pending/ride', body);
        console.log('previus ride==>', res);
        if (res.success) {
            if (res.ride.status == "rideend") {
                navigation.navigate('InvoiceScreen', { id: res?.ride.id });
            } else {
                navigation.navigate('RideTrackingScreen', { rideData: res?.ride });
            }

        }

    }
    // const checkPendingRide = async () => {
    //     const body = {
    //         driver_id: user.id
    //     }
    //     const res = await postData('driverride/pending', body);
    //     console.log('previus ride==>', res);
    //     if (res.success) {
    //         if (res.ride.status == "pending") {
    //             if (!loading) {
    //                 // setRideRequest(res.ride                        [0]);
    //                 // setLoading(true)
    //             }

    //         }

    //     }

    // }


    const handleUpdateLocation = async () => {
        try {
            const driver_id = user.id; // Your driver id
            await updateLocation(driver_id, userLocation.latitude, userLocation.longitude, true);
            console.log('Location updated');
        } catch (error) {
            console.error('Error updating location', error);
        }
    };

    console.log('RideRequest', RideRequest);
    const pauseSound = () => {
        AudioPlayer.pause();
    };
    const userType = 2

    const userId = user.id
    const getNewRide = async () => {
        const body = {
            driverId: userId
        }
        const res = await postData('getPendingRequests', body);
        console.log('res=dede===>', res);
        if (!loading && res?.rideId) {
            setRideRequest(res);
            setLoading(true)
        }

    }
    const [rideStatus, setRideStatus] = useState('');
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            // The screen is focused
            // Call any action
            checkPreviusRide();
            getNewRide();
        });

        // Return the function to unsubscribe from the event so it gets removed on unmount
        return unsubscribe;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigation]);
    useFocusEffect(
        React.useCallback(() => {
            console.log('Screen focused → force refresh');

            setLoading(false);
            setRideRequest(null);
            setInterval(() => {
                getNewRide();
            }, 2000);
           
            checkPreviusRide();

            return () => { };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])
    );
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextState => {
            if (nextState === 'active') {
                console.log('App returned to foreground');

                // refresh everything
                getActiveStatus();
                getNewRide();
                checkPreviusRide();
            }
        });

        return () => subscription.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    useEffect(() => {
        getNewRide();
        if (!RideRequest?.rideId) return;

        const rideId = RideRequest.rideId;

        // ✅ Join ride room
        socket.emit('joinRideRoom', { rideId, userType, userId });

        // ✅ Request initial ride data from DB
        socket.emit('getRideStatusFromServer', { rideId });


        // ✅ Handler: real-time status updates (after accept/cancel etc.)
        const handleRideStatusUpdate = (updateData) => {
            console.log('🔄 Real-time ride status update:', updateData.status);
            if (updateData.status.status != 'cancelled') {
                console.log('updateData.status.driver_id', updateData.status.driver_id);
                console.log('user.id', user.id);

                if (updateData.status.driver_id == user.id) {
                    setRideStatus(updateData.status);
                    navigation.navigate('RideTrackingScreen', { rideData: updateData.status });
                } else {
                    console.log('Status update is for current driver, not navigating');

                    setLoading(false);
                    pauseSound();
                    CustomToast.show("Ride Assigned To Another Driver")
                }

            }

        };


        socket.on('rideStatusUpdate', handleRideStatusUpdate);

        // Cleanup
        return () => {
            socket.off('rideStatusUpdate', handleRideStatusUpdate);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RideRequest?.rideId]);


    const ChangeRideStatus = async (status) => {

        const body = {
            driverId: user.id,
            rideId: RideRequest?.rideId,
            status: status

        }
        const res = await postData('ride/update-status', body);
        console.log('res==>', res);
        pauseSound();
        if (res?.success) {
            if (res.status == 'cancelled') {
                CustomToast.show("Ride Cancelled")
            }
        } else {
            CustomToast.show(res.error)
        }


    }

    const getCurrentLocation = () => {
        Geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude }); // ✅ Save location in state
                if (mapRef.current) {
                    mapRef.current.animateToRegion({  // ✅ Move map camera to new location
                        latitude,
                        longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    });
                }
            },
            error => {
                console.log('Location Error:', error);  // ✅ Log any errors
            },
            {
                enableHighAccuracy: true,     // ✅ Use GPS when available
                timeout: 15000,               // ✅ Wait up to 15 seconds
                maximumAge: 10000             // ✅ Allow cached location up to 10s old
            }
        );
    };

    useEffect(() => {
        getCurrentLocation()
    }, [])
    return (

        <View style={styles.container}>

            <StatusBar
                animated={true}
                translucent={false}
                backgroundColor="transparent"
                barStyle="light-content"
            />

            {
                userLocation.latitude !== null &&
                <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFillObject}
                    provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                    initialRegion={{
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        latitudeDelta: 0.015,
                        longitudeDelta: 0.0121,
                    }}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                    paddingAdjustmentBehavior="automatic" // helps shift UI
                >
                    <Marker
                        coordinate={{
                            latitude: userLocation.latitude,
                            longitude: userLocation.longitude,
                        }}
                        image={require('../../assets/8221274.png')} // ✅ your image path
                    />
                </MapView>
            }
            {/* <Image
                source={{ uri: 'https://user-images.githubusercontent.com/33053001/49243318-573a7080-f40d-11e8-9627-3c763d029d21.jpg' }} // Static city map image
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            /> */}

            <View style={styles.topOverlay}>
                {/* Driver's Status Button */}
                {/* <TouchableOpacity
                   
                    style={[styles.statusButton, { backgroundColor: driverStatus === 'on_duty' ? Color.green : Color.red }]}
                >
                    <Text style={styles.statusButtonText}>{t(driverStatus === 'on_duty' ? 'on_duty' : 'off_duty')}</Text>
                </TouchableOpacity> */}
            </View>
            <TouchableOpacity
                onPress={getCurrentLocation}
                style={{
                    position: 'absolute',
                    top: 20,
                    right: 20, // use right only (no left/right together)
                    padding: 10,
                    backgroundColor: Color.apptheme,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'flex-end', // ensures width fits content
                }}
            >
                <Ionicons name="locate-outline" size={24} color="#fff" />
            </TouchableOpacity>
            {/* Ride Request Button */}
            <View style={styles.statusSwitchContainer}>
                <TouchableOpacity
                    onPress={() => ChangeActiveStatus(driverStatus == 1 ? 0 : 1)}
                    activeOpacity={0.8}
                    style={[
                        styles.switchButton,
                        driverStatus === 1 ? styles.switchOn : styles.switchOff
                    ]}
                >
                    {/* <View
                        style={[
                            styles.switchCircle,
                            driverStatus === 'on_duty' ? styles.circleOn : styles.circleOff
                        ]}
                    /> */}
                    {loadingstatus ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.switchText}>
                        {t(driverStatus === 1 ? 'you_are_on_duty' : 'you_are_off_duty')}
                    </Text>}
                </TouchableOpacity>
            </View>



            {/* Loader (active during ride acceptance) */}
            {
                loading && (
                    <View style={styles.loaderOverlay}>
                        {console.log('RideRequest===>', RideRequest)
                        }
                        <View style={styles.alertCard}>
                            <Text style={styles.alertTitle}>🚖 New Ride Request</Text>
                            <Text style={styles.alertDetail}>👤 User: {RideRequest?.name}</Text>
                            <Text style={styles.alertDetail}>📍 Pickup: {RideRequest?.pickupLocation?.address}</Text>
                            {(RideRequest?.stops || []).map((stop, index) => (
                                <Text key={`stop-${index}`} style={styles.alertDetail} numberOfLines={2}>
                                    🔸 Stop {index + 1}: {stop.address}
                                </Text>
                            ))}
                            <Text style={styles.alertDetail}>🏁 Drop: {RideRequest?.dropoffLocation?.address}</Text>
                            {RideRequest?.stops?.length > 0 && (
                                <Text style={[styles.alertDetail, { fontWeight: 'bold' }]}>
                                    🛑 {RideRequest.stops.length} {RideRequest.stops.length === 1 ? 'stop' : 'stops'} on this ride
                                </Text>
                            )}
                            <Text style={styles.alertDetail}>
                            📏 Distance: {RideRequest?.distance_miles ?? 0} Miles
                            </Text>

                            <Text style={styles.alertDetail}>
                            💰 Estimated Fare: £{RideRequest?.fare_estimate ?? 0}
                            </Text>
                            {RideRequest?.booking_type === 'scheduled' && RideRequest?.scheduled_at && (
                                <Text style={[styles.alertDetail, { color: '#e65100', fontWeight: 'bold' }]}>
                                    📅 Scheduled For: {new Date(RideRequest?.scheduled_at).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })} • {new Date(RideRequest?.scheduled_at).toLocaleTimeString('en-IN', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                    })}
                                </Text>
                            )}
                            {/* <Text style={styles.countdownText}></Text> */}
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    onPress={() => {
                                        // Accept handler
                                        console.log("Accepted");
                                        setLoading(false);
                                        ChangeRideStatus('accepted')

                                    }}
                                    style={[styles.alertButton, { backgroundColor: '#2e7d32' }]}
                                >
                                    <Text style={styles.alertButtonText}>Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        // Reject handler
                                        console.log("Rejected");
                                        ChangeRideStatus('cancelled')
                                        setLoading(false);
                                    }}
                                    style={[styles.alertButton, { backgroundColor: '#c62828' }]}
                                >
                                    <Text style={styles.alertButtonText}>Reject</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )
            }
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

            {/* Ride Request Bottom Sheet */}
            {/* <RideRequestSheet
                sheetRef={serviceSheetRef}
                onAcceptRide={handleRideRequest}
            /> */}
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // paddingTop: StatusBar.currentHeight
    },
    topOverlay: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 40 : 40, // Adjusted position
        width: '100%',
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 999, // Make sure it stays above the map
    },
    statusSwitchContainer: {
        position: 'absolute',
        bottom: 90,
        left: 20,
        right: 20,
        alignItems: 'center',
    },

    switchButton: {
        width: '90%',
        height: 50,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },

    switchOn: {
        backgroundColor: '#2e7d32', // Green
    },

    switchOff: {
        backgroundColor: '#c62828', // Red
    },

    switchCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        marginRight: 10,
    },

    circleOn: {
        backgroundColor: '#fff',
    },

    circleOff: {
        backgroundColor: '#fff',
    },

    switchText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    rideRequestButton: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        backgroundColor: Color.apptheme,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
    },
    rideRequestButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    loaderOverlay: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    alertCard: {
        backgroundColor: '#fff',
        padding: 25,
        borderRadius: 16,
        width: '85%',
        alignItems: 'flex-start',
        elevation: 10,
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Color.apptheme,
        marginBottom: 12,
    },
    alertDetail: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    alertButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    alertButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // slightly lighter overlay
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
        fontSize: 20,
        color: '#333',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
        fontWeight: '600',
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

});

export default HomeScreen;

// import React from 'react';
// import {
//     View,
//     Text,
//     StyleSheet,
//     TextInput,
//     FlatList,
//     TouchableOpacity,
//     Dimensions,
//     KeyboardAvoidingView,
//     Platform,
// } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import { Color } from '../../theme';

// const { width } = Dimensions.get('window');

// const HomeScreen = () => {
//     const data = ['Your current location', 'Office', 'Home', 'Mall Road', 'Train Station'];

//     return (
//         <View style={styles.container}>
//             <KeyboardAvoidingView
//                 behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//                 style={{ flex: 1 }}
//             >
//                 {/* Header */}
//                 <View style={styles.headerContainer}>
//                     <Text style={styles.header}>Welcome to United Cabs</Text>
//                     <Text style={styles.subHeader}>Safe, smart, and affordable rides</Text>
//                 </View>

//                 {/* Input Card */}
//                 <View style={styles.inputCard}>
//                     {/* Pickup Input */}
//                     <View style={styles.inputRow}>
//                         <Ionicons name="navigate-outline" size={20} color={Color.apptheme} />
//                         <TextInput
//                             placeholder="Pickup Location"
//                             placeholderTextColor="#aaa"
//                             style={styles.textInput}
//                         />
//                     </View>
//                     <View style={styles.divider} />

//                     {/* Drop Input */}
//                     <View style={styles.inputRow}>
//                         <Ionicons name="location-outline" size={20} color={Color.apptheme} />
//                         <TextInput
//                             placeholder="Drop Location"
//                             placeholderTextColor="#aaa"
//                             style={styles.textInput}
//                         />
//                     </View>
//                 </View>

//                 {/* Find Deals Button */}
//                 <TouchableOpacity style={styles.dealButton}>
//                     <Text style={styles.dealButtonText}>🚖 Find Best Ride Deals</Text>
//                 </TouchableOpacity>

//                 {/* Recent Locations */}
//                 <Text style={styles.recentTitle}>Recent Locations</Text>
//                 <FlatList
//                     data={data}
//                     keyExtractor={(item, index) => index.toString()}
//                     renderItem={({ item }) => (
//                         <TouchableOpacity style={styles.recentCard}>
//                             <Ionicons name="time-outline" size={20} color="#555" />
//                             <Text style={styles.recentText}>{item}</Text>
//                         </TouchableOpacity>
//                     )}
//                 />
//             </KeyboardAvoidingView>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#fefefe',
//     },
//     headerContainer: {
//         backgroundColor: Color.apptheme,
//         paddingHorizontal: 20,
//         paddingTop: Platform.OS === 'ios' ? 60 : 40,
//         paddingBottom: 40,
//         borderBottomLeftRadius: 20,
//         borderBottomRightRadius: 20,
//     },
//     header: {
//         fontSize: 26,
//         fontWeight: '700',
//         color: '#fff',
//     },
//     subHeader: {
//         fontSize: 14,
//         color: '#eee',
//         marginTop: 6,
//     },
//     inputCard: {
//         marginHorizontal: 20,
//         marginTop: -30,
//         backgroundColor: '#fff',
//         borderRadius: 16,
//         padding: 18,
//         shadowColor: '#000',
//         shadowOpacity: 0.05,
//         shadowOffset: { width: 0, height: 4 },
//         shadowRadius: 8,
//         elevation: 4,
//     },
//     inputRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingVertical: 10,
//     },
//     textInput: {
//         flex: 1,
//         marginLeft: 12,
//         fontSize: 16,
//         color: '#333',
//     },
//     divider: {
//         height: 1,
//         backgroundColor: '#eee',
//         marginVertical: 6,
//     },
//     dealButton: {
//         marginTop: 20,
//         marginHorizontal: 20,
//         backgroundColor: Color.apptheme,
//         paddingVertical: 14,
//         borderRadius: 14,
//         alignItems: 'center',
//         elevation: 4,
//         shadowColor: '#000',
//         shadowOpacity: 0.1,
//         shadowOffset: { width: 0, height: 3 },
//         shadowRadius: 6,
//     },
//     dealButtonText: {
//         color: '#fff',
//         fontSize: 16,
//         fontWeight: '600',
//     },
//     recentTitle: {
//         fontSize: 18,
//         fontWeight: '500',
//         color: '#333',
//         marginHorizontal: 20,
//         marginTop: 28,
//         marginBottom: 10,
//     },
//     recentCard: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#fff',
//         marginHorizontal: 20,
//         paddingVertical: 12,
//         paddingHorizontal: 16,
//         borderRadius: 12,
//         marginBottom: 10,
//         shadowColor: '#000',
//         shadowOpacity: 0.03,
//         shadowOffset: { width: 0, height: 2 },
//         shadowRadius: 5,
//         elevation: 2,
//     },
//     recentText: {
//         fontSize: 16,
//         color: '#333',
//         marginLeft: 10,
//     },
// });

// export default HomeScreen;
