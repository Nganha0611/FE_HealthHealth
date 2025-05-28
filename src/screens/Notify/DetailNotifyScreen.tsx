import { NavigationProp } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { NotifyStackParamList } from '../../navigation/NotifyStack';
import { useTranslation } from 'react-i18next';

type Props = {
  navigation: NavigationProp<NotifyStackParamList, 'DetailNotify'>;
  route: { params: { notification: Notification } };
};

type Notification = {
  id: string;
  userId: string;
  type: string;
  message: string;
  timestamp: string;
  status: string;
};

const DetailNotifyScreen: React.FC<Props> = ({ navigation, route }) => {
      const { t } = useTranslation();

  const notification = route.params?.notification || {
    message: t('noNotification'),
    timestamp: new Date().toISOString(),
    type: 'unknown',
  };
  
  // Lời khuyên dựa trên type
  const getAdvice = () => {
    switch (notification.type) {
      case 'heart_rate_alert':
        return t('heartRateAdvice');
      case 'blood_pressure_alert':
        return t('bloodPressureAdvice');
      default:
        return '';
    }
  };

  // Tiêu đề dựa trên type
  const getTitle = () => {
    switch (notification.type) {
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

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesome
              name="chevron-left"
              size={24}
              color="#432c81"
              style={{ marginRight: 20, marginTop: 20 }}
            />
          </TouchableOpacity>
          <Text style={styles.titleText}>{t('detail')}</Text>
        </View>
      </View>

      {/* Nội dung thông báo */}
      <View style={styles.contentContainer}>
        <Text style={styles.notificationTitle}>{getTitle()}</Text>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.timestamp}>
          {new Date(notification.timestamp).toLocaleString('vi-VN')}
        </Text>

        
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F9FBFF',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#432c81',
  },
  contentContainer: {
    marginTop: 40,
    paddingHorizontal: 25,
  },
  notificationTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#432c81',
    marginBottom: 15,
    textTransform: 'capitalize',
  },
  message: {
    fontSize: 22,
    color: '#555',
    lineHeight: 30,
    marginBottom: 15,
  },
  timestamp: {
    fontSize: 20,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  adviceContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f5',
    borderRadius: 10,
  },
  adviceLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: '#444',
    marginBottom: 10,
  },
  adviceText: {
    fontSize: 20,
    color: '#444',
    lineHeight: 28,
  },
});

export default DetailNotifyScreen;
