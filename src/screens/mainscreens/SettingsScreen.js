import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Color } from '../../theme';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { CommonActions } from '@react-navigation/native';

const SettingsScreen = ({ navigation }) => {
    const user = useSelector(state => state.user);
    const { t } = useTranslation();
    const settingsOptions = [
        { id: 'profile', label: t('profile'), icon: 'person-outline' },
        { id: 'HistoryScreenWithBack', label: t('ride_history'), icon: 'time-outline' },
        { id: 'notifications', label: t('notifications'), icon: 'notifications-outline' },
        // { id: 'kyc', label: t('kyc'), icon: 'id-card-outline' },  // Added KYC option
        { id: 'SubscriptionPlans', label: t('Subscription Plans'), icon: 'card-outline' }, // ✅ New Item
        { id: 'MySubscriptionPlans', label: t('My Subscription Plans'), icon: 'card-outline' }, // ✅ New Item
        { id: 'support', label: t('help_support'), icon: 'help-circle-outline' },
        { id: 'terms', label: t('terms_conditions'), icon: 'document-text-outline' },
        { id: 'privacy', label: t('privacy_policy'), icon: 'shield-checkmark-outline' },
        { id: 'delete', label: t('delete_account'), icon: 'trash-outline' }, // ✅ REQUIRED
        { id: 'logout', label: t('logout'), icon: 'log-out-outline' },
    ];
    const dispatch = useDispatch();
    const logoutUser = () => {
        dispatch({ type: 'LOGOUT' });

        navigation.dispatch(
            CommonActions.reset({
                index: 1,
                routes: [{ name: 'Welcome' }],
            }),
        );
    };
    const handleOptionPress = (id) => {
        console.log('Pressed:', id);
        if (id == 'logout') {
            logoutUser();

        } else if (id === 'delete') {
            Alert.alert(
                t('Delete Account'),
                t('Delete Account Confirm'),
                [
                    { text: t('Cancel'), style: 'Cancel' },
                    {
                        text: t('Delete'),
                        style: 'destructive',
                        onPress: deleteAccount,
                    },
                ]
            );

        } else if (id == 'profile') {
            navigation.navigate('ProfileScreen')
        } else if (id == 'SubscriptionPlans') {
            navigation.navigate('SubscriptionPlans')
        } else if (id == 'MySubscriptionPlans') {
            navigation.navigate('MySubscriptionPlans')
        } else if (id == 'HistoryScreenWithBack') {
            navigation.navigate('HistoryScreenWithBack')
        } else if (id === 'terms') {
            navigation.navigate('CmsScreen', { type: 'terms' });

        } else if (id === 'privacy') {
            navigation.navigate('CmsScreen', { type: 'privacy' });

        } else if (id === 'support') {
            navigation.navigate('CmsScreen', { type: 'help' });
        }

    };
    const deleteAccount = async () => {
        try {
            const driver_id = user.id;

            const response = await fetch(
                'https://unitedcabsmerthyr.uk/api/driver/delete',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ driver_id }),
                }
            );


            const result = await response.json();
            console.log('result==?', result);

            if (result?.success || response.ok) {
                Alert.alert(
                    t('Account Deleted'),
                    t('Account Deleted Successfully'),
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                dispatch({ type: 'LOGOUT' });
                                navigation.dispatch(
                                    CommonActions.reset({
                                        index: 0,
                                        routes: [{ name: 'Welcome' }],
                                    })
                                );
                            },
                        },
                    ]
                );
            } else {
                Alert.alert(t('error'), result?.message || 'Something went wrong');
            }
        } catch (error) {
            console.log('Delete error:', error);
            Alert.alert(t('error'), 'Unable to delete account');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Color.white }}>
            <ScrollView style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>{t('settings')}</Text>

                {settingsOptions.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.option}
                        onPress={() => handleOptionPress(item.id)}
                    >
                        <Ionicons name={item.icon} size={22} color="#555" style={styles.icon} />
                        <Text style={styles.label}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#aaa" />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fbff',
        paddingTop: StatusBar.currentHeight,
    },
    content: {
        padding: 20,
        paddingBottom: 130, // 👈 enough space to scroll above bottom tab
        flexGrow: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#222',
        marginBottom: 20,
        textAlign: 'center',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    icon: {
        marginRight: 15,
    },
    label: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
});

export default SettingsScreen;
