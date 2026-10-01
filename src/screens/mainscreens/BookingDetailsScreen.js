import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Platform,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Color } from '../../theme';

const BookingDetailsScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { booking } = route.params; // Get passed booking details

    // Format the scheduled_at date and time from the ISO string
    const formattedDate = new Date(booking.scheduled_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
    const formattedTime = new Date(booking.scheduled_at).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Custom Header with Back Button */}
            <View style={styles.headerContainer}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={Color.apptheme} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
            </View>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.card}>
                    {/* Pickup Address */}
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={20} color={Color.apptheme} />
                        <Text style={styles.locationText}>{booking.pickup_address}</Text>
                    </View>
                    {/* Separator */}
                    <View style={styles.separator} />
                    {/* Dropoff Address */}
                    <View style={styles.locationRow}>
                        <Ionicons name="navigate-outline" size={20} color={Color.apptheme} />
                        <Text style={styles.locationText}>{booking.dropoff_address}</Text>
                    </View>

                    {/* Date & Time */}
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Date & Time:</Text>
                        <Text style={styles.value}>
                            {formattedDate} • {formattedTime}
                        </Text>
                    </View>

                    {/* Fare */}
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Fare:</Text>
                        <Text style={styles.value}>£ {booking.final_fare || '00'}</Text>
                    </View>

                    {/* Payment Mode */}
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Payment Mode:</Text>
                        <Text style={styles.value}>{booking.payment_mode || 'Cash'}</Text>
                    </View>

                    {/* Booking ID */}
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Booking ID:</Text>
                        <Text style={styles.value}>UN{booking.id}</Text>
                    </View>

                    {/* Status */}
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Status:</Text>
                        <Text
                            style={[
                                styles.status,
                                booking.status === 'completed'
                                    ? styles.completed
                                    : styles.cancelled,
                            ]}
                        >
                            {booking.status.toUpperCase()}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default BookingDetailsScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fbff',
        // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    backButton: {
        paddingRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#222',
        // Ensure the title is centered relative to the header
        flex: 1,
        textAlign: 'center',
        marginRight: 34, // This offsets the icon size so the title appears centered
    },
    container: {
        padding: 16,
        paddingBottom: 30,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 3,
        marginTop: 20,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
        flex: 1,
    },
    separator: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 8,
    },
    label: {
        fontSize: 15,
        color: '#666',
    },
    value: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    status: {
        fontWeight: 'bold',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        overflow: 'hidden',
        fontSize: 14,
    },
    completed: {
        backgroundColor: '#e0f7ec',
        color: '#2e7d32',
    },
    cancelled: {
        backgroundColor: '#fce4e4',
        color: '#c62828',
    },
});
