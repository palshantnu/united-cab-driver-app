import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Dimensions,
    Platform,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Color } from '../../theme';
import { useTranslation } from 'react-i18next';
import { postData } from '../../API';
import { useDispatch, useSelector } from 'react-redux';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

const HistoryScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const user = useSelector(state => state.user);
    const bookings = useSelector(state => state.bookings);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('instant'); // 'instant' or 'scheduled'

    const tabBarHeight = useBottomTabBarHeight();

    const [bookingList, setBookingsList] = useState([]);
    const [instantBookings, setInstantBookings] = useState([]);
    const [scheduledBookings, setScheduledBookings] = useState([]);
    const dispatch = useDispatch();

    const getHistory = async () => {
        setLoading(true);
        try {
            const body = { driver_id: user.id };
            const res = await postData('rides/driver/history', body);
console.log('History Response:', res);
            if (res?.bookings?.length > 0) {
                // Latest booking on top (newest booking time first, id as tie-breaker)
                res.bookings.sort((a, b) =>
                    (new Date(b.created_at) - new Date(a.created_at)) || (b.id - a.id)
                );
                setBookingsList(res.bookings);
                
                // Separate instant and scheduled bookings
                const instant = res.bookings.filter(booking => 
                    booking.booking_type === 'instant' || booking.type === 'instant'
                );
                const scheduled = res.bookings.filter(booking => 
                    booking.booking_type === 'scheduled' || booking.type === 'scheduled'
                );
                
                setInstantBookings(instant);
                setScheduledBookings(scheduled);
                
                dispatch({
                    type: 'SET_VEHICALTYPE',
                    payload: res.bookings,
                });
            } else {
                setBookingsList([]);
                setInstantBookings([]);
                setScheduledBookings([]);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            setInstantBookings([]);
            setScheduledBookings([]);
        }
        setLoading(false);
    };

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            getHistory();
        });
        return unsubscribe;
    }, [navigation]);

    const getCurrentBookings = () => {
        return activeTab === 'instant' ? instantBookings : scheduledBookings;
    };

    const renderTabButton = (tabKey, title) => (
        <TouchableOpacity
            style={[
                styles.tabButton,
                activeTab === tabKey && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tabKey)}
        >
            <Text style={[
                styles.tabButtonText,
                activeTab === tabKey && styles.activeTabButtonText
            ]}>
                {title}
            </Text>
            {activeTab === tabKey && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
    );

    const renderBookingCard = ({ item }) => (
        <TouchableOpacity 
            onPress={() => navigation.navigate('BookingDetails', { booking: item })}
            style={styles.card}>
            <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={18} color={Color.apptheme} />
                <Text style={styles.locationText}>{item.pickup_address || item.pickup}</Text>
            </View>
            <View style={styles.separatorLine} />
            {(item.stops || []).map((stop, index) => (
                <React.Fragment key={`stop-${index}`}>
                    <View style={styles.locationRow}>
                        <Ionicons name="ellipse-outline" size={18} color="#f59e0b" />
                        <Text style={styles.locationText} numberOfLines={1}>Stop {index + 1}: {stop.address}</Text>
                    </View>
                    <View style={styles.separatorLine} />
                </React.Fragment>
            ))}
            <View style={styles.locationRow}>
                <Ionicons name="navigate-outline" size={18} color={Color.apptheme} />
                <Text style={styles.locationText}>{item.dropoff_address || item.drop}</Text>
            </View>
            
            {/* Booking Type Badge */}
            <View style={styles.bookingTypeContainer}>
                <View style={[
                    styles.bookingTypeBadge,
                    (item.booking_type === 'instant' || item.type === 'instant') 
                        ? styles.instantBadge 
                        : styles.scheduledBadge
                ]}>
                    <Text style={styles.bookingTypeText}>
                        {(item.booking_type === 'instant' || item.type === 'instant') ? 'INSTANT' : 'SCHEDULED'}
                    </Text>
                </View>
            </View>
            
            <View style={styles.detailRow}>
                <Text style={styles.dateText}>
                    {new Date(item.scheduled_at || item.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                    })} • {new Date(item.scheduled_at || item.date).toLocaleTimeString('en-IN', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                    })}
                </Text>
                <Text style={styles.fareText}>£ {item.final_fare ? item.final_fare : (item.fare?.replace('£', '') || '00')}</Text>
            </View>
            <Text
                style={[
                    styles.status,
                    item.status === 'completed' ? styles.completed : styles.cancelled,
                ]}
            >
                {item.status}
            </Text>
        </TouchableOpacity>
    );

    const currentBookings = getCurrentBookings();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Color.white }}>
            <View style={styles.container}>
                <Text style={styles.title}>{t('booking_history')}</Text>
                
                {/* Tab Buttons */}
                <View style={styles.tabContainer}>
                    {renderTabButton('instant', 'Instant Bookings')}
                    {renderTabButton('scheduled', 'Scheduled Bookings')}
                </View>

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : currentBookings?.length === 0 ? (
                    <View style={styles.loaderContainer}>
                        <Ionicons name="calendar-outline" size={60} color="#ccc" />
                        <Text style={styles.noDataText}>
                            {activeTab === 'instant' 
                                ? 'No instant bookings found' 
                                : 'No scheduled bookings found'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={currentBookings}
                        keyExtractor={item => item.id?.toString()}
                        contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 20 }}
                        showsVerticalScrollIndicator={false}
                        renderItem={renderBookingCard}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

export default HistoryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fbff',
        paddingTop: StatusBar.currentHeight,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#222',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 20 : 20,
        paddingBottom: 10,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 10,
        marginBottom: 5,
        backgroundColor: '#f8fbff',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        position: 'relative',
    },
    activeTabButton: {
        backgroundColor: 'transparent',
    },
    tabButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#666',
    },
    activeTabButtonText: {
        color: Color.apptheme,
        fontWeight: '600',
    },
    activeTabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: '30%',
        right: '30%',
        height: 3,
        backgroundColor: Color.apptheme,
        borderRadius: 1.5,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 3,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    locationText: {
        fontSize: 15,
        color: '#333',
        marginLeft: 10,
        flex: 1,
    },
    separatorLine: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 6,
    },
    bookingTypeContainer: {
        marginTop: 8,
        marginBottom: 4,
    },
    bookingTypeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    instantBadge: {
        backgroundColor: '#e3f2fd',
    },
    scheduledBadge: {
        backgroundColor: '#fff3e0',
    },
    bookingTypeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1976d2',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    dateText: {
        fontSize: 13,
        color: '#666',
    },
    fareText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    status: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: '600',
        paddingVertical: 4,
        paddingHorizontal: 10,
        alignSelf: 'flex-start',
        borderRadius: 10,
        overflow: 'hidden',
    },
    completed: {
        backgroundColor: '#e0f7ec',
        color: '#2e7d32',
        textTransform: 'uppercase'
    },
    cancelled: {
        backgroundColor: '#fce4e4',
        color: '#c62828',
        textTransform: 'uppercase'
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    loadingText: {
        fontSize: 16,
        color: '#999',
    },
    noDataText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 10,
    },
});