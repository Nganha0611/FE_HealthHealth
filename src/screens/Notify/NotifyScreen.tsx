import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/config';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../contexts/NotificationContext';
import { NotifyStackParamList } from '../../navigation/NotifyStack';

// Mảng màu tùy chọn
const dotColors = ['#7043cf', '#cb9e25', '#36ccfb'];

type Props = {
  navigation: StackNavigationProp<NotifyStackParamList, 'Notify'>;
};

type Notification = {
  id: string;
  userId: string;
  type: string;
  message: string;
  timestamp: string;
  status: string;
};

const NotifyScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Lấy danh sách thông báo từ API
  const fetchNotifications = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        navigation.navigate('Login' as any);
        return;
      }

      const response = await axios.get<Notification[]>(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      showNotification(t('fetchNotificationsError'), 'error');
      if (error.response && error.response.status === 401) {
        showNotification(t('sessionExpired'), 'error');
        await AsyncStorage.removeItem('token');
        navigation.navigate('Login' as any);
      }
    } finally {
      setLoading(false);
    }
  }, [navigation, showNotification, t]);

  // Cập nhật trạng thái thông báo thành "read" khi nhấn
  const handleNotificationPress = async (notification: Notification) => {
    if (notification.status === 'unread') {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('No token');

        await axios.put(
          `${API_BASE_URL}/api/notifications/${notification.id}`,
          { status: 'read' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, status: 'read' } : item
          )
        );
      } catch (error) {
        showNotification(t('updateStatusError'), 'error');
      }
    }
    navigation.navigate('DetailNotify', { notification });
  };

  // Tự động cập nhật thông báo mỗi 30 giây
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Cập nhật mỗi 30 giây
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Lấy tiêu đề dựa trên type
  const getTitleFromType = (type: string) => {
    switch (type) {
      case 'heart_rate_alert':
        return t('heartRateAlert');
      case 'blood_pressure_alert':
        return t('bloodPressureAlert');
      case 'medication_reminder':
        return t('medicationReminder');
      case 'appointment':
        return t('appointment');
      case 'follow':
        return t('follow');
      default:
        return t('notification');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#432c81" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('notifications')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {notifications.length === 0 ? (
          <Text style={styles.noNotificationsText}>{t('noNotifications')}</Text>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={styles.notificationCard}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.titleRow}>
                <View style={[styles.dot, { backgroundColor: getRandomColor() }]} />
                <Text
                  style={[
                    styles.notifTitle,
                    notification.status === 'unread' && styles.unreadTitle,
                  ]}
                >
                  {getTitleFromType(notification.type)}
                </Text>
              </View>
              <Text style={styles.notifMessage} numberOfLines={2} ellipsizeMode="tail">
                {notification.message}
              </Text>
              <Text style={styles.notifDesc} numberOfLines={1} ellipsizeMode="tail">
                {new Date(notification.timestamp).toLocaleString('vi-VN')}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );

  // Hàm lấy màu ngẫu nhiên từ dotColors
  function getRandomColor() {
    const randomIndex = Math.floor(Math.random() * dotColors.length);
    return dotColors[randomIndex];
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingVertical: 20,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
    marginLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e2e2',
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#432c81',
  },
  listContainer: {
    padding: 20,
  },
  notificationCard: {
    flexDirection: 'column',
    backgroundColor: '#f6f5fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e2e2',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 20,
    marginRight: 12,
  },
  notifTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#432c81',
  },
  unreadTitle: {
    fontWeight: '700', // Đậm hơn cho thông báo chưa đọc
  },
  notifMessage: {
    fontSize: 18,
    color: '#555',
    marginLeft: 22,
    marginBottom: 6,
  },
  notifDesc: {
    fontSize: 16,
    color: '#888',
    marginLeft: 22,
  },
  noNotificationsText: {
    fontSize: 20,
    color: '#432c81',
    textAlign: 'center',
    marginTop: 30,
  },
});

export default NotifyScreen;
