import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Color } from '../../theme';
import { useTranslation } from 'react-i18next';
import { postData } from '../../API';
import { useSelector } from 'react-redux';
import { CustomToast } from '../../component/ToastConfig';
import { usePaymentSheet } from '@stripe/stripe-react-native';
import { ActivityIndicator } from 'react-native-paper';

const WalletScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);


  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const user = useSelector(state => state.user);
  const [activeTab, setActiveTab] = useState('transactions'); // or 'recharges'

  const [rechargeHistory, setRechargeHistory] = useState([]);

  const getWallet = async () => {
    const body = {
      driverId: user.id
    }
    const res = await postData('wallet/get', body);
    console.log('wallet===>', res);
    if (res.success) {
      setBalance(res.balance)
    }
  }
  const getTransHistory = async () => {
    const body = {
      driverId: user.id
    }
    const res = await postData('drivers/transactions', body);

    // setTransactions(res.requests)
    if (res.success) {
      setTransactions(res.data.transactions);
      setRechargeHistory(res.data.recharges);
      setSubscriptions(res.data.subscriptions);
    }


  }
  const handleRechargeRequest = async () => {
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid recharge amount.');
      return;
    }

    const body = {
      driver_id: user.id,
      amount: rechargeAmount
    }
    const res = await postData('driver_recharge_request', body);

    console.log(body,res);
    
    CustomToast.show(res.message);


    setRechargeAmount('');
    setRechargeModalVisible(false);
    getTransHistory();
    await getWallet();

  };


  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }
    if (amount > balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough balance.');
      return;
    }

    setBalance((prev) => prev - amount);
    setTransactions((prev) => [
      {
        id: Date.now().toString(),
        type: 'debit',
        amount,
        date: new Date().toISOString().slice(0, 10),
        note: 'Withdrawn to bank',
      },
      ...prev,
    ]);
    setWithdrawAmount('');
    setWithdrawModalVisible(false);
  };

  const fetchPaymentSheetParams = async () => {
    const amount = parseFloat(rechargeAmount) * 100;
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
    console.log('khj');
    try {
      const clientSecret = await fetchPaymentSheetParams();
      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'My Company',
        allowsDelayedPaymentMethods: false,
      });

      if (!error) {

        openPaymentSheet();
        console.log('khj');

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
    console.log(error);

    if (error) {
      Alert.alert(`Payment failed`, error.message);
    } else {
      Alert.alert('Success', 'Your payment is confirmed!');
      await handleRechargeRequest()


    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await getTransHistory();
      await getWallet();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // The screen is focused
      // Call any action
      getTransHistory();
      getWallet();
    });

    // Return the function to unsubscribe from the event so it gets removed on unmount
    return unsubscribe;
  }, [navigation]);

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionRow}>
      <Ionicons
        name={item.type === 'credit' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
        size={24}
        color={item.type === 'credit' ? 'green' : 'red'}
        style={{ marginRight: 10 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.note}>{item.description}</Text>
        <Text style={styles.date}>{item.created_at.slice(0, 10)}</Text>
      </View>
      <Text style={[styles.amount, { color: item.type === 'credit' ? 'green' : 'red' }]}>£{item.amount}</Text>
    </View>
  );

  const renderRecharge = ({ item }) => (
    <View style={styles.transactionRow}>
      <Ionicons
        name="cash-outline"
        size={24}
        color={item.status === 'approved' ? 'green' : '#FFA500'}
        style={{ marginRight: 10 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.note}>Recharge £{item.amount}</Text>
        <Text style={styles.date}>{item.requested_at.slice(0, 10)}</Text>
      </View>
      <Text style={[styles.amount, { color: item.status === 'approved' ? 'green' : '#FFA500' }]}>
        {item.status}
      </Text>
    </View>
  );

  const renderSubscription = ({ item }) => (
    <View style={styles.transactionRow}>
      <Ionicons
        name="card-outline"
        size={24}
        color={Color.apptheme}
        style={{ marginRight: 10 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.note}>{item.subscription_name}</Text>
        <Text style={styles.date}>Valid: {item.start_date} - {item.end_date}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Color.white }}>
    
      <View style={styles.container}>
        <Text style={styles.header}>{t('my_wallet')}</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('available_balance')}</Text>
          <Text style={styles.balance}>£{balance?.toFixed(2)}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => setRechargeModalVisible(true)} style={styles.actionButton}>
              <Text style={styles.buttonText}>+ {t('add_money')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: 'red' }]}
              onPress={() => setWithdrawModalVisible(true)}
            >
              <Text style={styles.buttonText}>{t('withdraw')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.tabRow}>
          <TouchableOpacity onPress={() => setActiveTab('transactions')} style={[styles.tabButton, activeTab === 'transactions' && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>{t('Transactions')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('recharges')} style={[styles.tabButton, activeTab === 'recharges' && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === 'recharges' && styles.activeTabText]}>{t('Recharge')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('subscriptions')} style={[styles.tabButton, activeTab === 'subscriptions' && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === 'subscriptions' && styles.activeTabText]}>{t('Subscriptions')}</Text>
          </TouchableOpacity>
        </View>


        {activeTab === 'transactions' ? (
          transactions.length > 0 ? (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTransaction}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          ) : (
            <Text style={styles.noDataText}>No transactions found</Text>
          )
        ) : null}


        {activeTab === 'recharges' ? (
          rechargeHistory.length > 0 ? (
            <FlatList
              data={rechargeHistory}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderRecharge}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          ) : (
            <Text style={styles.noDataText}>No recharges found</Text>
          )
        ) : null}


        {activeTab === 'subscriptions' ? (
          subscriptions.length > 0 ? (
            <FlatList
              data={subscriptions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderSubscription}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          ) : (
            <Text style={styles.noDataText}>No subscriptions found</Text>
          )
        ) : null}


        <Modal visible={withdrawModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setWithdrawModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('withdraw_amount')}</Text>
              <TextInput
                placeholder={t('enter_amount')}
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                style={styles.input}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#ccc' }]}
                  onPress={() => setWithdrawModalVisible(false)}
                >
                  <Text style={styles.modalBtnText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: Color.apptheme }]}
                  onPress={handleWithdraw}
                >
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>{t('confirm')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
      <Modal visible={rechargeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setRechargeModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('Recharge Request')}</Text>
            <TextInput
              placeholder={t('enter_amount')}
              keyboardType="numeric"
              value={rechargeAmount}
              onChangeText={setRechargeAmount}
              style={styles.input}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#ccc' }]}
                onPress={() => setRechargeModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Color.apptheme }]}
                onPress={() => initializePaymentSheet()}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>{t('Submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {loading && (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator size="large" color={Color.apptheme} />
  </View>
)}
      </Modal>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f7fb', paddingTop: StatusBar.currentHeight, paddingHorizontal: 10 },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 5,
  },
  balanceLabel: { fontSize: 16, color: '#666' },
  balance: { fontSize: 28, fontWeight: 'bold', color: Color.apptheme, marginVertical: 10 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionButton: {
    backgroundColor: Color.apptheme,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  historyHeader: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  note: { fontSize: 16, fontWeight: '500' },
  date: { fontSize: 12, color: '#888' },
  amount: { fontSize: 16, fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    width: '80%',
    padding: 20,
    borderRadius: 14,
    elevation: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Color.apptheme,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    fontSize: 12
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  modalClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },

  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  modalBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  

});

export default WalletScreen;
