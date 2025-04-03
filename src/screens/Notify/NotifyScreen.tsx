import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { NotifyStackParamList } from '../../navigation/NotifyStack';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// Mảng màu tùy chọn
const dotColors = ['#7043cf', '#cb9e25', '#36ccfb'];

type Props = {
  navigation: StackNavigationProp<NotifyStackParamList, 'Notify'>;
};

const NotifyScreen: React.FC<Props> = ({ navigation }) => {
  const [isModalVisible, setIsModalVisible] = useState(true); // Trạng thái hiển thị hộp thông báo

  // Hàm lấy màu ngẫu nhiên từ dotColors
  const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * dotColors.length);
    return dotColors[randomIndex];
  };

  // Hàm đóng hộp thông báo
  const closeModal = () => {
    setIsModalVisible(false);
    navigation.goBack(); // Quay lại màn hình trước khi đóng
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Thông báo</Text>
      </View>

      {/* Hộp thông báo dạng Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationBox}>
            {/* Nút đóng (X) */}
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <FontAwesome name="times" size={20} color="#432c81" />
            </TouchableOpacity>

            {/* Nội dung thông báo */}
            <ScrollView contentContainerStyle={styles.notificationContent}>
              {[1, 2, 3, 4, 5].map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.notificationItem}
                  onPress={() => navigation.navigate('DetailNotify')}
                >
                  <View style={styles.titleRow}>
                    <View style={[styles.dot, { backgroundColor: getRandomColor() }]} />
                    <Text style={styles.notifTitle}>Cảnh báo đăng nhập {item}</Text>
                  </View>
                  <Text style={styles.notifDesc} numberOfLines={2} ellipsizeMode="tail">
                    Ưu điểm: Rất dễ, chỉ cần cấu hình title cho screen. Vui lòng kiểm tra chi tiết để biết thêm thông tin.
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Nền mờ
  },
  notificationBox: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  notificationContent: {
    paddingTop: 10,
  },
  notificationItem: {
    flexDirection: 'column',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e2e2',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#432c81',
    flex: 1,
  },
  notifDesc: {
    fontSize: 14,
    color: '#666',
    marginLeft: 18,
  },
});

export default NotifyScreen;