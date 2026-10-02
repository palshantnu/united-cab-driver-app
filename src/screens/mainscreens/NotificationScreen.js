import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Color } from '../../theme';
import { postData } from '../../API';
import socket from '../../API/Socket';

const READER_TYPE = 'driver';
const PAGE_SIZE = 20;

const formatTime = (value) => {
    const date = new Date(value);
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffMin < 24 * 60) return `${Math.floor(diffMin / 60)} hr ago`;
    if (diffMin < 7 * 24 * 60) return `${Math.floor(diffMin / (24 * 60))} d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const NotificationScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const user = useSelector(state => state.user);
    const [notifications, setNotifications] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const loadingMoreRef = useRef(false);

    const reader = { type: READER_TYPE, id: user?.id };

    // No notification_id → server marks every pending notification as read
    const markAllRead = () => postData('notifications/read', reader);

    const fetchPage = async (pageNumber) => {
        const res = await postData('notifications', { ...reader, page: pageNumber, limit: PAGE_SIZE });
        if (!res?.success) throw new Error(res?.message || 'Unable to load notifications');
        return res;
    };

    // Load the inbox first (so unread items stay highlighted for this visit), then mark all as read
    const loadInbox = useCallback(async () => {
        if (!user?.id) return;
        setError('');
        try {
            const res = await fetchPage(1);
            setNotifications(res.data);
            setTotal(res.total);
            setPage(1);
            if (res.unread_count > 0) markAllRead();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            loadInbox();
        }, [loadInbox])
    );

    // Live notifications while the screen is open
    useEffect(() => {
        const handleNotification = (payload) => {
            setNotifications(prev =>
                prev.some(n => n.id === payload.id) ? prev : [{ ...payload, is_read: false }, ...prev]
            );
            setTotal(prev => prev + 1);
            postData('notifications/read', { ...reader, notification_id: payload.id });
        };
        socket.on('notification', handleNotification);
        return () => socket.off('notification', handleNotification);
    }, [user?.id]);

    const loadMore = async () => {
        if (loadingMoreRef.current || notifications.length >= total) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        try {
            const res = await fetchPage(page + 1);
            setNotifications(prev => [...prev, ...res.data.filter(n => !prev.some(p => p.id === n.id))]);
            setTotal(res.total);
            setPage(page + 1);
            if (res.data.some(n => !n.is_read)) markAllRead();
        } catch (e) {
            console.log('Notifications load more error:', e);
        } finally {
            loadingMoreRef.current = false;
            setLoadingMore(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadInbox();
    };

    const renderItem = ({ item }) => (
        <View style={[styles.card, !item.is_read && styles.cardUnread]}>
            <View style={[styles.iconWrap, !item.is_read && styles.iconWrapUnread]}>
                <Ionicons
                    name={item.type === 'payout' ? 'wallet-outline' : 'notifications-outline'}
                    size={20}
                    color={item.is_read ? '#888' : Color.apptheme}
                />
            </View>
            <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                    <Text style={[styles.title, !item.is_read && styles.titleUnread]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    {!item.is_read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{formatTime(item.created_at)}</Text>
            </View>
        </View>
    );

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name={error ? 'cloud-offline-outline' : 'notifications-off-outline'} size={56} color="#bbb" />
                <Text style={styles.emptyTitle}>{error ? 'Something went wrong' : 'No notifications yet'}</Text>
                <Text style={styles.emptyText}>
                    {error || "You're all caught up. New updates will appear here."}
                </Text>
                {!!error && (
                    <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); loadInbox(); }}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Color.apptheme} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('notifications')}</Text>
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={Color.apptheme} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.list, !notifications.length && { flexGrow: 1 }]}
                    ListEmptyComponent={renderEmpty}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={Color.apptheme} /> : null}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Color.apptheme]} tintColor={Color.apptheme} />
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fbff',
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
        flex: 1,
        textAlign: 'center',
        marginRight: 34,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
        paddingBottom: 30,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 2,
    },
    cardUnread: {
        borderLeftWidth: 4,
        borderLeftColor: Color.apptheme,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f1f1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconWrapUnread: {
        backgroundColor: '#eef4ff',
    },
    cardBody: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    titleUnread: {
        fontWeight: '700',
        color: '#111',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Color.apptheme,
        marginLeft: 8,
    },
    body: {
        fontSize: 14,
        color: '#555',
        marginTop: 4,
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
        color: '#999',
        marginTop: 6,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#333',
        marginTop: 12,
    },
    emptyText: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        marginTop: 6,
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: Color.apptheme,
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 20,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default NotificationScreen;
