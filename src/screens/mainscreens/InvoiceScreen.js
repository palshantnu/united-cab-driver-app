import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getData, postData } from '../../API';
import { CustomToast } from '../../component/ToastConfig';
import { useSelector } from 'react-redux';
import { Modal } from 'react-native-paper';
import { Color } from '../../theme';

const InvoiceScreen = ({ route, navigation }) => {
    const { id } = route?.params || {};

    console.log('id==>', id);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const user = useSelector(state => state.user);
    const getInvoiceData = async () => {
        setLoading(true);
        try {
            const res = await getData(`getRideDetails/${id || 1}`);
            setData(res?.data);
        } catch (e) {
            Alert.alert('Error', 'Failed to load invoice');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getInvoiceData();
    }, []);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');



    const ChangeRideStatus = async () => {
        const body = {
            driverId: user.id,
            rideId: id,
            status: 'completed',
        };

        const res = await postData('ride/update-status', body);
        console.log('res ==>', res);

        if (res?.success) {
            setModalMessage('Status updated successfully!');
            setModalVisible(true);
            if (res.status == 'completed') {
                navigation.replace('BottomTabNavigator');
            }
            CustomToast.show(res.error);
        } else {
            CustomToast.show(res.error);
        }
    };

    const handleConfirmPayment = () => {
        Alert.alert(
            'Confirm Payment',
            'Are you sure you have received the payment from passenger?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => {
                        // Update status here or navigate
                        // Alert.alert('Payment Confirmed', 'You have received the payment.');
                        ChangeRideStatus();
                    },
                },
            ]
        );
    };

    if (loading || !data) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#000" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.header}>Ride Invoice</Text>

                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Ride Completed</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.row}>
                        <Icon name="person-outline" size={20} color="#444" />
                        <Text style={styles.label}>Passenger:</Text>
                        <Text style={styles.value}>{data?.user?.name}</Text>
                    </View>

                    <View style={styles.row}>
                        <Icon name="car-outline" size={20} color="#444" />
                        <Text style={styles.label}>Driver:</Text>
                        <Text style={styles.value}>{data?.driver?.name}</Text>
                    </View>

                    <View style={styles.row}>
                        <Icon name="car-sport-outline" size={20} color="#444" />
                        <Text style={styles.label}>Vehicle:</Text>
                        <Text style={styles.value}>{data?.vehicle?.type_name}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.rowVertical}>
                        <Icon name="location-outline" size={20} color="#4caf50" />
                        <Text style={styles.label}>Pickup</Text>
                        <Text style={styles.value}>{data?.pickup_address}</Text>
                    </View>

                    {(data?.stops || []).map((stop, index) => (
                      <View style={styles.rowVertical} key={`stop-${index}`}>
                        <Icon name="ellipse-outline" size={20} color="#f59e0b" />
                        <Text style={styles.label}>Stop {index + 1}</Text>
                        <Text style={styles.value}>{stop.address}</Text>
                      </View>
                    ))}

                    <View style={styles.rowVertical}>
                        <Icon name="flag-outline" size={20} color="#f44336" />
                        <Text style={styles.label}>Drop-off</Text>
                        <Text style={styles.value}>{data?.dropoff_address}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Distance:</Text>
                        <Text style={styles.value}>{data?.distance_km} Mile</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Fare:</Text>
                        <Text style={[styles.value, styles.fareValue]}>
                            £ {data?.final_fare?.toFixed(2)}
                        </Text>

                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Date:</Text>
                        <Text style={styles.value}>
                            {new Date(data?.scheduled_at).toLocaleString()}
                        </Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cashNote}>Payment Mode: Cash</Text>
                    <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={handleConfirmPayment}
                        activeOpacity={0.9}
                    >
                        <Icon name="checkmark-circle-outline" size={20} color="#fff" />
                        <Text style={styles.confirmText}>Confirm Payment Received</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        </SafeAreaView>
    );
};

export default InvoiceScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        padding: 16,
        paddingBottom: 40,
    },
    header: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 12,
        textAlign: 'center',
    },
    statusBadge: {
        alignSelf: 'center',
        backgroundColor: '#4caf50',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    statusText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    rowVertical: {
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
        color: '#555',
        width: 100,
    },
    value: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
        flexShrink: 1,
    },
    fareValue: {
        color: '#2c7be5',
        fontSize: 16,
        fontWeight: 'bold',
    },
    confirmBtn: {
        marginTop: 16,
        backgroundColor: '#4caf50',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    confirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    cashNote: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
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
});
