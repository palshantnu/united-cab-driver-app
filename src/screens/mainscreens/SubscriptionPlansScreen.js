import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
    Platform,
    StatusBar,
    ActivityIndicator,
    Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { Color } from "../../theme";
import { getData, postData } from "../../API";
import { useSelector } from "react-redux";
import { CustomToast } from "../../component/ToastConfig";
import { initPaymentSheet, presentPaymentSheet } from "@stripe/stripe-react-native";

const { width } = Dimensions.get("window");

const SubscriptionPlansScreen = ({ navigation }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useSelector(state => state.user);
    const fetchPlans = async () => {
        try {
            const response = await getData('subscriptionplan') // Replace with your real API URL
            if (response.success) {
                setPlans(response.data); // assuming API shape: { success, data: [...] }
            } else {
                console.warn("Failed to load plans");
            }
        } catch (error) {
            console.error("Error fetching plans:", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);



    const BuyPlan = async (id) => {
        const body = {
            driver_id: user.id,
            subscription_id: id
        }
        const res = await postData('purchase_subscription', body);
        console.log('res==>', res);
        if (res.success) {
            CustomToast.show(res.message);
        } else {
            CustomToast.show(res.message);
        }
    }
  const fetchPaymentSheetParams = async (item) => {
    const amount = parseFloat(item.price) * 100;
    const response = await fetch('https://unitedcabsmerthyr.uk/api/stripe_paymentgateway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    const resJson = await response.json();
    console.log(resJson);

    if (resJson.success) {
      return resJson.clientSecret;
    } else {
      throw new Error(resJson.message || 'Failed to fetch client secret');
    }
  };
  const initializePaymentSheet = async (item) => {
    // setLoading(true);
    console.log('khj');
    try {
      const clientSecret = await fetchPaymentSheetParams(item);
      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'My Company',
        allowsDelayedPaymentMethods: false,
      });

      if (!error) {

        openPaymentSheet(item);
        console.log('khj');

      } else {
        Alert.alert('Init Error', error.message);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      // setLoading(false);
    }
  };

  const openPaymentSheet = async (item) => {
    const { error } = await presentPaymentSheet();
console.log(error);

    if (error) {
      Alert.alert(`Payment failed`, error.message);
    } else {
      Alert.alert('Success', 'Your payment is confirmed!');
      BuyPlan(item.id)

    }
  };
    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.planName}>{item.name}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.duration_days} Days</Text>
                </View>
            </View>
            <Text style={styles.price}>£{item.price}</Text>
            <Text style={styles.detail}>Includes: {item.mile} Mile</Text>
            <Text style={styles.description}>{item.description}</Text>
            <TouchableOpacity onPress={() => initializePaymentSheet(item)} style={styles.button}>
                <Text style={styles.buttonText}>Subscribe Now</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Color.white} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back-outline" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Subscription Plans</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#007aff" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={plans}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50 }}>No Plans Available</Text>}
                />
            )}
        </SafeAreaView>
    );
};

export default SubscriptionPlansScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f3f6fb",
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
    backButton: {
        padding: 4,
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        width: width - 32,
        alignSelf: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    planName: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2e3a59",
    },
    badge: {
        backgroundColor: "#e6f2ff",
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#007aff",
    },
    price: {
        fontSize: 22,
        fontWeight: "700",
        color: "#2e3a59",
        marginTop: 4,
    },
    detail: {
        fontSize: 14,
        color: "#555",
        marginTop: 6,
    },
    description: {
        fontSize: 13,
        color: "#888",
        marginTop: 4,
        lineHeight: 18,
    },
    button: {
        backgroundColor: Color.apptheme,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 18,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});
