import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NotifyStackParamList } from '../../navigation/NotifyStack';

// Mảng màu tùy chọn
const dotColors = ['#7043cf', '#cb9e25', '#36ccfb'];

type Props = {
  navigation: StackNavigationProp<NotifyStackParamList, 'Notify'>;
};

const NotifyScreen: React.FC<Props> = ({ navigation }) => {
  // Hàm lấy màu ngẫu nhiên từ dotColors
  const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * dotColors.length);
    return dotColors[randomIndex];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Thông báo</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((item, idx) => {
          return (
            <TouchableOpacity
              key={idx}
              style={styles.notificationCard}
              onPress={() => navigation.navigate('DetailNotify')}
            >
              <View style={styles.titleRow}>
                <View style={[styles.dot, { backgroundColor: getRandomColor() }]} />
                <Text style={styles.notifTitle}>Cảnh báo đăng nhập {item}</Text>
              </View>
              <Text style={styles.notifDesc} numberOfLines={3} ellipsizeMode="tail">
                Ưu điểm: Rất dễ, chỉ cần cấu hình title cho screen...
              </Text>
            </TouchableOpacity>
          );
        })}
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
  notifDesc: {
    fontSize: 14,
    color: '#666',
    marginLeft: 18,
  },
});

export default NotifyScreen;