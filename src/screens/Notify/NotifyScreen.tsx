import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

  // Hàm lấy màu ngẫu nhiên từ dotColors
  const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * dotColors.length);
    return dotColors[randomIndex];
  };

  // Hàm lấy tiêu đề dựa trên type
  const getTitleFromType = (type: string) => {
    switch (type) {
      case 'heart_rate_alert':
        return 'Cảnh báo nhịp tim';
      case 'blood_pressure_alert':
        return 'Cảnh báo huyết áp';
      case 'medication_reminder':
        return 'Nhắc nhở uống thuốc';
      case 'appointment':
        return 'Nhắc nhở khám bệnh';
      case 'follow':
        return 'Hoạt động theo dõi';
      default:
        return 'Thông báo';
    }
  };

  // Lấy danh sách thông báo từ API
  const fetchNotifications = async () => {
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
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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
              onPress={() =>
                navigation.navigate('DetailNotify', { notification })
              }
            >
              <View style={styles.titleRow}>
                <View style={[styles.dot, { backgroundColor: getRandomColor() }]} />
                <Text style={styles.notifTitle}>{getTitleFromType(notification.type)}</Text>
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingVertical: 16,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
    marginLeft: 16,
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#432c81',
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'column',
    backgroundColor: '#f6f5fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e2e2',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#432c81',
  },
  notifMessage: {
    fontSize: 14,
    color: '#555',
    marginLeft: 18,
    marginBottom: 4,
  },
  notifDesc: {
    fontSize: 12,
    color: '#888',
    marginLeft: 18,
  },
  noNotificationsText: {
    fontSize: 16,
    color: '#432c81',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default NotifyScreen;