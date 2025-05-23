import { NavigationProp } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { NotifyStackParamList } from '../../navigation/NotifyStack';

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
  const notification = route.params?.notification || {
    message: 'Không có thông báo',
    timestamp: new Date().toISOString(),
    type: 'unknown',
  };

  // Lời khuyên dựa trên type
  const getAdvice = () => {
    switch (notification.type) {
      case 'heart_rate_alert':
        return (
          'Lời khuyên:\n- Hãy nghỉ ngơi và thư giãn ngay lập tức.\n- Đo lại nhịp tim sau 10-15 phút.\n- Nếu nhịp tim vẫn cao, hãy liên hệ bác sĩ để được hỗ trợ.'
        );
      case 'blood_pressure_alert':
        return 'Lời khuyên:\n- Kiểm tra lại huyết áp trong trạng thái thư giãn.\n- Tránh căng thẳng và uống đủ nước.\n- Liên hệ bác sĩ nếu cần thiết.';
      case 'medication_reminder':
        return 'Lời khuyên:\n- Uống thuốc đúng giờ và theo liều lượng được chỉ định.\n- Ghi chú lại thời gian uống để theo dõi.';
      case 'appointment':
        return 'Lời khuyên:\n- Đến đúng giờ và mang theo hồ sơ y tế.\n- Chuẩn bị câu hỏi để hỏi bác sĩ.';
      case 'follow':
        return 'Lời khuyên:\n- Kiểm tra thông tin người theo dõi nếu cần.';
      default:
        return 'Không có lời khuyên cụ thể.';
    }
  };
  // Dịch type sang tiêu đề tiếng Việt
  const getTitle = () => {
    switch (notification.type) {
      case 'heart_rate_alert':
        return 'Cảnh báo nhịp tim';
      case 'blood_pressure_alert':
        return 'Cảnh báo huyết áp';
      case 'medication_reminder':
        return 'Nhắc nhở uống thuốc';
      case 'appointment':
        return 'Lịch hẹn';
      case 'follow':
        return 'Theo dõi';
      default:
        return 'Thông báo';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesome
            name="chevron-left"
            size={20}
            color="#432c81"
            style={{ marginRight: 15, marginTop: 17 }}
            onPress={() => navigation.goBack()}
          />
          <Text style={[styles.text, { fontSize: 30, marginTop: 5 }]}>Chi tiết</Text>
        </View>
      </View>

      {/* Nội dung thông báo */}
      <View style={styles.contentContainer}>
        {/* Tiêu đề là type */}
        <Text style={styles.title}>{getTitle()}</Text>

        {/* Nội dung message */}
        <Text style={styles.content}>{notification.message}</Text>

        {/* Thời gian in nghiêng */}
        <Text style={styles.dateItalic}>
          {new Date(notification.timestamp).toLocaleString('vi-VN')}
        </Text>

        {/* Lời khuyên */}
        <Text style={styles.advice}>{getAdvice()}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: '#F9FBFF',
  },
  header: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  text: {
    fontSize: 25,
    fontFamily: 'Roboto',
    color: '#432c81',
    fontWeight: 'bold',
  },
  headerLeft: {
    marginLeft: 10,
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  contentContainer: {
    marginTop: 30,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#432c81',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  content: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 5,
  },
  dateItalic: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  advice: {
    fontSize: 16, // to hơn
    color: '#444',
    lineHeight: 22,
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f0f0f5',
    borderRadius: 5,
    fontWeight: '600',
  },
});

export default DetailNotifyScreen;
