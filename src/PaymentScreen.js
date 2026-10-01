import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { usePaymentSheet } from '@stripe/stripe-react-native';

export default function CheckoutScreen() {
  const [loading, setLoading] = useState(false);
  const [paymentSheetEnabled, setPaymentSheetEnabled] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();

  const amount = 5000; // 5 rupees in paisa

  const fetchPaymentSheetParams = async () => {
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

  const initializePaymentSheet = async () => {
    setLoading(true);
    try {
      const clientSecret = await fetchPaymentSheetParams();
      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'My Company',
        allowsDelayedPaymentMethods: false,
      });

      if (!error) {
        setPaymentSheetEnabled(true);
      } else {
        Alert.alert('Init Error', error.message);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Payment failed`, error.message);
    } else {
      Alert.alert('Success', 'Your payment is confirmed!');
      setPaymentSheetEnabled(false); // reset after success
      
    }
  };

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Stripe Payment Sheet</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <TouchableOpacity
          style={[
            styles.button,
            !paymentSheetEnabled && { backgroundColor: '#ccc' },
          ]}
          onPress={openPaymentSheet}
          disabled={!paymentSheetEnabled}
        >
          <Text style={styles.buttonText}>Pay ₹5</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
