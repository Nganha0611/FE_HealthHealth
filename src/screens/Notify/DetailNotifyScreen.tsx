import { NavigationProp } from '@react-navigation/native';
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

type Props = {
  navigation: NavigationProp<any>;
};

const DetailNotifyScreen: React.FC<Props> = ({ navigation }) => {
  // Dữ liệu mẫu với nội dung dài hơn và xuống dòng
  const notification = {
    title: "Cập nhật ứng dụng mới và các tính năng quan trọng",
    content:
      "Chúng tôi vừa phát hành phiên bản mới của ứng dụng với nhiều cải tiến đáng kể và các tính năng hấp dẫn dành cho người dùng. \n\n" +
      "Phiên bản này bao gồm giao diện được tối ưu hóa, tốc độ tải nhanh hơn, và hỗ trợ đa ngôn ngữ để bạn có trải nghiệm tốt nhất. Ngoài ra, chúng tôi đã sửa một số lỗi nhỏ từ phiên bản trước dựa trên phản hồi của các bạn. \n\n" +
      "Vui lòng cập nhật lên phiên bản mới nhất qua cửa hàng ứng dụng để không bỏ lỡ những cải tiến này. Nếu bạn gặp bất kỳ vấn đề nào trong quá trình sử dụng, đừng ngần ngại liên hệ với đội ngũ hỗ trợ của chúng tôi qua email: support@example.com hoặc số hotline: 0123-456-789. \n\n" +
      "Cảm ơn bạn đã luôn đồng hành và ủng hộ ứng dụng của chúng tôi trong suốt thời gian qua. Chúc bạn có những trải nghiệm tuyệt vời với phiên bản mới!",
    date: "03/04/2025 10:30",
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
        <View style={styles.headerRight}>
          <Image
            style={styles.imgProfile}
            source={require('../../assets/avatar.jpg')}
          />
        </View>
      </View>

      {/* Nội dung thông báo */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.date}>{notification.date}</Text>
        <Text style={styles.content}>{notification.content}</Text>
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
  headerRight: {
    marginRight: 15,
    backgroundColor: '#e0dee7',
    borderRadius: 30,
    padding: 7,
  },
  imgProfile: {
    width: 45,
    height: 45,
    borderRadius: 30,
  },
  contentContainer: {
    marginTop: 30,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#432c81',
    marginBottom: 10,
  },
  date: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
  },
  content: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24, // Tăng khoảng cách dòng cho dễ đọc
  },
});

export default DetailNotifyScreen;