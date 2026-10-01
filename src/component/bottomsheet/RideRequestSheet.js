import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import RBSheet from 'react-native-raw-bottom-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Color } from '../../theme';

const RideRequestSheet = ({ sheetRef, onAcceptRide }) => {
    const { t } = useTranslation();

    const rideDetails = {
        passengerName: 'John Doe',
        pickupLocation: '123 Main St',
        dropLocation: '456 Elm St',
        rideType: 'Economy',
        distance: '3.5 Mile',
        estimatedTime: '10 min'
    };

    const handleAccept = () => {
        onAcceptRide(rideDetails);
    };

    const handleReject = () => {
        console.log('Ride Rejected');
        sheetRef.current.close();
    };

    return (
        <RBSheet
            ref={sheetRef}
            closeOnPressMask={true}
            height={360}
            customStyles={{ container: styles.sheetContainer }}
        >
            <View style={styles.container}>
                <Text style={styles.header}>{t('ride_request')}</Text>

                <View style={styles.card}>
                    <Text style={styles.passengerName}>
                        <Ionicons name="person-circle" size={20} color={Color.apptheme} /> {rideDetails.passengerName}
                    </Text>

                    <View style={styles.locationRow}>
                        <MaterialIcons name="circle" size={16} color={Color.green} />
                        <Text style={styles.locationText}>{rideDetails.pickupLocation}</Text>
                    </View>

                    <View style={styles.locationRow}>
                        <MaterialIcons name="location-on" size={16} color={Color.red} />
                        <Text style={styles.locationText}>{rideDetails.dropLocation}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoText}>{t('ride_type')}: <Text style={styles.bold}>{rideDetails.rideType}</Text></Text>
                        <Text style={styles.infoText}>{t('distance')}: <Text style={styles.bold}>{rideDetails.distance}</Text></Text>
                        <Text style={styles.infoText}>{t('estimated_time')}: <Text style={styles.bold}>{rideDetails.estimatedTime}</Text></Text>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={handleReject} style={[styles.button, styles.rejectButton]}>
                        <Ionicons name="close-circle" size={22} color="#fff" />
                        <Text style={styles.buttonText}>{t('reject')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleAccept} style={[styles.button, styles.acceptButton]}>
                        <Ionicons name="checkmark-circle" size={22} color="#fff" />
                        <Text style={styles.buttonText}>{t('accept')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </RBSheet>
    );
};

const styles = StyleSheet.create({
    sheetContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
    },
    header: {
        fontSize: 20,
        fontWeight: '700',
        color: Color.apptheme,
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#f7f7f7',
        borderRadius: 12,
        padding: 16,
        elevation: 3,
    },
    passengerName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationText: {
        marginLeft: 8,
        fontSize: 15,
        color: '#555',
    },
    infoRow: {
        marginTop: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
    bold: {
        fontWeight: '600',
        color: '#111',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 30,
        width: '48%',
    },
    acceptButton: {
        backgroundColor: Color.green,
    },
    rejectButton: {
        backgroundColor: Color.red,
    },
    buttonText: {
        fontSize: 16,
        color: '#fff',
        marginLeft: 8,
        fontWeight: '600',
    },
});

export default RideRequestSheet;
