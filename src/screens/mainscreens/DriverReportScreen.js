import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Color } from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getData } from '../../API/index';

const reports = {
  daily: {
    date: '22 Apr 2025',
    totalEarnings: 580,
    rides: 6,
    breakdown: [
      { label: 'Fares', value: 450 },
      { label: 'Incentives', value: 100 },
      { label: 'Tips', value: 30 },
    ],
  },
  weekly: {
    date: '15–21 Apr 2025',
    totalEarnings: 3420,
    rides: 38,
    breakdown: [
      { label: 'Fares', value: 2900 },
      { label: 'Incentives', value: 400 },
      { label: 'Tips', value: 120 },
    ],
  },
  monthly: {
    date: 'Apr 2025',
    totalEarnings: 12890,
    rides: 140,
    breakdown: [
      { label: 'Fares', value: 10800 },
      { label: 'Incentives', value: 1500 },
      { label: 'Tips', value: 590 },
    ],
  },
};

const timeFrames = ['daily', 'weekly', 'monthly', 'custom'];

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const buildReport = (payload, period, from, to) => {
  const filters = payload?.filters ?? {};
  const rawData = Array.isArray(payload?.data) ? payload.data[0] : payload?.data ?? {};
  const dateLabel = filters.period
    ? filters.period
    : (filters.from && filters.to)
      ? `${formatDate(filters.from)} - ${formatDate(filters.to)}`
      : (period === 'custom' ? `${from} - ${to}` : period);
  const totalEarnings = rawData.total_earnings ?? rawData.totalEarnings ?? rawData.total ?? 0;
  const rides = rawData.total_rides ?? rawData.rides ?? 0;
  const breakdown = [
    { label: 'completed', value: rawData.completed_rides ?? 0 },
    { label: 'cancelled', value: rawData.cancelled_rides ?? 0 },
    { label: 'distance', value: rawData.total_distance_miles ?? 0, suffix: 'mi' },
  ];

  return {
    date: dateLabel || (period === 'daily' ? formatDate(new Date()) : period === 'weekly' ? `${formatDate(new Date(new Date().setDate(new Date().getDate() - 6)))} - ${formatDate(new Date())}` : period === 'monthly' ? formatDate(new Date()) : `${from} - ${to}`),
    totalEarnings,
    rides,
    breakdown,
  };
};

const DriverReportScreen = () => {
  const { t } = useTranslation();
  const user = useSelector((state) => state.user);
  const driverId = user?.id ?? 10;
  const [activeTab, setActiveTab] = useState('daily');
  const [reportData, setReportData] = useState(reports.daily);
  const [customFrom, setCustomFrom] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [customTo, setCustomTo] = useState(new Date());
const [pickerType, setPickerType] = useState(null); // 'from' | 'to' | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async (period, from, to) => {
    if (!driverId) {
      setError('Driver ID missing');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let url = `driver/report?driver_id=${driverId}`;
      if (period && period !== 'custom') {
        url += `&period=${period}`;
      } else {
        url += `&from=${from}&to=${to}`;
      }

      const response = await getData(url);
      const mapped = buildReport(response, period === 'custom' ? 'custom' : period, from, to);
      setReportData(mapped);
    } catch (e) {
      console.log('DriverReport fetch error', e);
      setError('Unable to load report');
      setReportData(reports[activeTab] || reports.daily);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'custom') {
      if (customFrom && customTo) {
        fetchReport('custom', formatDate(customFrom), formatDate(customTo));
      }
    } else {
      fetchReport(activeTab);
    }
  }, [activeTab, customFrom, customTo, driverId]);

  const handleCustomApply = () => {
    if (!customFrom || !customTo) {
      setError('Enter both from and to dates');
      return;
    }
    fetchReport('custom', formatDate(customFrom), formatDate(customTo));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Color.white }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>{t('driver_reports')}</Text>

        <View style={styles.tabs}>
          {timeFrames.map((frame) => (
            <TouchableOpacity
              key={frame}
              style={[styles.tab, activeTab === frame && styles.activeTab]}
              onPress={() => setActiveTab(frame)}
            >
              <Text style={[styles.tabText, activeTab === frame && styles.activeTabText]}>{t(frame)}</Text>
              {activeTab === frame && <View style={styles.activeUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'custom' && (
          <View style={styles.customRangeContainer}>
            <View style={styles.customInputRow}>
              <TouchableOpacity style={styles.customDateButton} onPress={() => setPickerType('from')}>
                <Text style={styles.customDateText}>{formatDate(customFrom) || 'From'}</Text>
              </TouchableOpacity>
              <Text style={styles.toLabel}>to</Text>
              <TouchableOpacity style={styles.customDateButton}   onPress={() => setPickerType('to')}>
                <Text style={styles.customDateText}>{formatDate(customTo) || 'To'}</Text>
              </TouchableOpacity>
            </View>
         {pickerType && (
  <DateTimePicker
    value={pickerType === 'from' ? customFrom : customTo}
    mode="date"
    maximumDate={new Date()}
    onChange={(event, selectedDate) => {
      setPickerType(null);

      if (selectedDate) {
        if (pickerType === 'from') {
          setCustomFrom(selectedDate);
        } else {
          setCustomTo(selectedDate);
        }
      }
    }}
  />
)}
            <TouchableOpacity style={styles.applyButton} onPress={handleCustomApply}>
              <Text style={styles.applyText}>{t('apply') || 'Apply'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && <ActivityIndicator size="small" color={Color.apptheme} style={styles.loading} />}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.date}>{reportData.date}</Text>

          <View style={styles.earningsBlock}>
            <Text style={styles.earningTitle}>{t('total_earnings')}</Text>
            <Text style={styles.earningAmount}>£{reportData.totalEarnings}</Text>

            <View style={styles.rideBadge}>
              <Ionicons name="car-sport-outline" size={16} color="#fff" />
              <Text style={styles.rideText}> {reportData.rides} {t('rides')}</Text>
            </View>
          </View>

          <View style={styles.breakdown}>
            {reportData.breakdown.map((item, index) => {
              const valueText = item.suffix ? `${item.value} ${item.suffix}` : item.value;
              return (
                <View key={index} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{t(item.label.toLowerCase())}</Text>
                  <Text style={styles.breakdownValue}>{item.label === 'distance' ? valueText : `£${valueText}`}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
container: {
  backgroundColor: '#f1f4f8',
  paddingTop: StatusBar.currentHeight,
  paddingHorizontal: 20,
  paddingBottom: 140,
  flexGrow: 1,
},
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Color.black,
    textAlign: 'left',
    marginBottom: 25,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: '#e2e8f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    width: '48%',
    marginBottom: 12,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },
  activeTabText: {
    color: Color.apptheme,
  },
  activeUnderline: {
    height: 3,
    width: '100%',
    backgroundColor: Color.apptheme,
    marginTop: 4,
    borderRadius: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  date: {
    fontSize: 13,
    color: '#888',
    textAlign: 'right',
    marginBottom: 10,
  },
  earningsBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  earningTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#444',
  },
  earningAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Color.apptheme,
    marginVertical: 10,
  },
  rideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.apptheme,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    marginTop: 6,
  },
  rideText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  breakdownLabel: {
    fontSize: 15,
    color: '#555',
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  customRangeContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  customDateButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    marginRight: 10,
  },
  customDateText: {
    color: '#111827',
    fontSize: 15,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginRight: 10,
    color: '#111827',
  },
  toLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginRight: 10,
  },
  applyButton: {
    backgroundColor: Color.apptheme,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  applyText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  loading: {
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default DriverReportScreen;
