// Checks the admin-configured app version on launch / when the app returns to foreground
// and shows a normal (skippable) or force (blocking) update popup.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Platform, AppState } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { Color } from '../theme';
import { postData } from '../API';

const APP_TYPE = 'driver';
const SKIP_KEY = 'appUpdate:skipped';
const SKIP_FOR_MS = 24 * 60 * 60 * 1000; // "Later" hides a normal update for a day

const AppUpdateModal = () => {
    const [update, setUpdate] = useState(null);
    const checkingRef = useRef(false);

    const checkForUpdate = useCallback(async () => {
        if (checkingRef.current) return;
        checkingRef.current = true;
        try {
            const res = await postData('app-version/check', {
                app: APP_TYPE,
                platform: Platform.OS === 'ios' ? 'ios' : 'android',
                version: DeviceInfo.getVersion(),
            });
            if (!res?.success || !res.update_available) {
                setUpdate(null);
                return;
            }
            if (res.update_type === 'normal') {
                const skipped = JSON.parse((await AsyncStorage.getItem(SKIP_KEY)) || 'null');
                if (skipped?.version === res.latest_version && Date.now() - skipped.at < SKIP_FOR_MS) return;
            }
            setUpdate(res);
        } catch (e) {
            console.log('App update check failed:', e);
        } finally {
            checkingRef.current = false;
        }
    }, []);

    useEffect(() => {
        checkForUpdate();
        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active') checkForUpdate();
        });
        return () => subscription.remove();
    }, [checkForUpdate]);

    if (!update) return null;
    const isForce = update.update_type === 'force';

    const openStore = () => {
        if (update.store_url) Linking.openURL(update.store_url).catch(e => console.log('Open store failed:', e));
    };

    const later = async () => {
        await AsyncStorage.setItem(SKIP_KEY, JSON.stringify({ version: update.latest_version, at: Date.now() }));
        setUpdate(null);
    };

    return (
        <Modal
            visible
            transparent
            animationType="fade"
            statusBarTranslucent
            // Android back button can't dismiss a force update
            onRequestClose={isForce ? () => {} : later}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={[styles.iconCircle, isForce && styles.iconCircleForce]}>
                        <Ionicons
                            name={isForce ? 'alert-circle-outline' : 'cloud-download-outline'}
                            size={40}
                            color={isForce ? '#e53935' : Color.apptheme}
                        />
                    </View>
                    <Text style={styles.title}>{update.title}</Text>
                    <Text style={styles.version}>
                        Version {update.latest_version} • You have {update.current_version}
                    </Text>
                    <Text style={styles.message}>{update.message}</Text>

                    <TouchableOpacity style={styles.primaryButton} onPress={openStore} activeOpacity={0.85}>
                        <Text style={styles.primaryText}>Update Now</Text>
                    </TouchableOpacity>
                    {!isForce && (
                        <TouchableOpacity style={styles.secondaryButton} onPress={later}>
                            <Text style={styles.secondaryText}>Later</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        elevation: 12,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#eef4ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    iconCircleForce: {
        backgroundColor: '#fdecea',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
        textAlign: 'center',
    },
    version: {
        fontSize: 13,
        color: '#888',
        marginTop: 6,
    },
    message: {
        fontSize: 15,
        color: '#444',
        textAlign: 'center',
        lineHeight: 22,
        marginTop: 14,
        marginBottom: 22,
    },
    primaryButton: {
        width: '100%',
        backgroundColor: Color.apptheme,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    secondaryText: {
        color: '#666',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default AppUpdateModal;
