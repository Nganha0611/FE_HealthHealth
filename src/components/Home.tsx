import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import notifee from '@notifee/react-native';

const Home: React.FC = () => {
  async function onDisplayNotification() {
    // Yêu cầu quyền thông báo (cần cho iOS và Android API 33+)
    await notifee.requestPermission();

    // Tạo kênh thông báo (cần cho Android)
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });

    // Hiển thị thông báo hệ thống
    await notifee.displayNotification({
      title: 'Thông báo từ ứng dụng',
      body: 'Đây là một thông báo hệ thống mẫu!',
      android: {
        channelId,
        smallIcon: 'ic_launcher', // Biểu tượng thông báo (tùy chọn, mặc định là ic_launcher)
        pressAction: {
          id: 'default',
        },
      },
      ios: {
        // Cấu hình bổ sung cho iOS nếu cần
      },
    });
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onDisplayNotification}>
        <Text style={styles.buttonText}>Hiển thị thông báo hệ thống</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Home;