import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { Color } from '../../theme';
import { useSelector } from 'react-redux';
import Ionicons from "react-native-vector-icons/Ionicons";
import { postData } from '../../API';

const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};





const MySubscriptionPlans = ({ navigation }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useSelector(state => state.user);

    const getMyPlan = async () => {
        setLoading(true);
        const body = {
            driver_id: user.id
        }
        const res = await postData('driver/subscription-history', body);
        console.log('res==>', res);
        if (res.success) {
            setPlans(res.data);
        }
        setLoading(false);
    }
    useEffect(() => {
        getMyPlan();
    }, []);

  

    const renderStatus = (status) => (
        <View
            style={[
                styles.statusBadge,
                {
                    backgroundColor: status === 'active' ? '#d4f4dd' : '#ffe5e5',
                },
            ]}
        >
            <Text
                style={[
                    styles.statusText,
                    { color: status === 'active' ? '#34a853' : '#d93025' },
                ]}
            >
                {status.toUpperCase()}
            </Text>
        </View>
    );

    const renderPlan = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.planName}>{item.subscription.name}</Text>
                {renderStatus(item.status)}
            </View>

            <Text style={styles.detail}>
                📅 {formatDate(item.start_date)} - {formatDate(item.end_date)}
            </Text>
            <Text style={styles.detail}>
                🛣️ Mileage: {item.mile} / {item.subscription.mile} Mile
            </Text>
            <Text style={styles.detail}>💰 £{item.subscription.price}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={Color.white} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back-outline" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerText}>My Plans</Text>
                <View style={{ width: 24 }} />
            </View>
            <View style={styles.container}>
                {/* <Text style={styles.title}>My Subscription Plans</Text> */}

                {loading ? (
                    <ActivityIndicator size="large" color={Color.primary} />
                ) : (
                    <FlatList
                    data={plans}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderPlan}
                    contentContainerStyle={{
                      paddingBottom: 20,
                      flexGrow: 1,
                      justifyContent: plans.length === 0 ? 'center' : 'flex-start',
                    }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Ionicons name="card-outline" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>You don't have any plan</Text>
                      </View>
                    }
                  />
                  
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Color.white,
    },
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f2f7fb',
    },
    header: {
        backgroundColor: Color.white,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 15 : 16,
        paddingBottom: 14,
        borderBottomWidth: 0.5,
        borderColor: "#ddd",
        elevation: 3,
    },
    headerText: {
        color: "#000",
        fontSize: 20,
        fontWeight: "600",
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 20,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        margin:10
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    planName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    detail: {
        fontSize: 14,
        color: '#555',
        marginTop: 4,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
      },
      emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
      },
      
});

export default MySubscriptionPlans;
