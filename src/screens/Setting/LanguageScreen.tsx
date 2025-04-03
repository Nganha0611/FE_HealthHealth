import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { BottomTabParamList } from '../../navigation/BottomTabs';

type Props = {
  navigation: NavigationProp<any>;
};

const LanguageScreen: React.FC<Props> = ({ navigation }) => {
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('vi'); // Mặc định là Tiếng Việt

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    // Bạn có thể thêm logic để lưu ngôn ngữ đã chọn (ví dụ: vào AsyncStorage hoặc Redux)
    console.log(`Ngôn ngữ đã chọn: ${language}`);
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
          <Text style={[styles.text, { fontSize: 30, marginTop: 5 }]}>Ngôn ngữ</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigationMain.navigate('SettingStack', { screen: 'SettingScreen' })}>
            <Image
              style={styles.imgProfile}
              source={require('../../assets/avatar.jpg')}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Danh sách ngôn ngữ */}
      <View style={styles.languageContainer}>
        {/* Tiếng Việt */}
        <TouchableOpacity
          style={[
            styles.languageOption,
            selectedLanguage === 'vi' && styles.selectedOption,
          ]}
          onPress={() => handleLanguageSelect('vi')}
        >
          <Image
            source={require('../../assets/vietnam-flag.png')} // Đường dẫn tới lá cờ Việt Nam
            style={styles.flag}
          />
          <Text style={styles.languageText}>Tiếng Việt</Text>
          {selectedLanguage === 'vi' && (
            <FontAwesome name="check" size={20} color="#4D2D7D" style={styles.checkIcon} />
          )}
        </TouchableOpacity>

        {/* Tiếng Anh */}
        <TouchableOpacity
          style={[
            styles.languageOption,
            selectedLanguage === 'en' && styles.selectedOption,
          ]}
          onPress={() => handleLanguageSelect('en')}
        >
          <Image
            source={require('../../assets/uk-flag.png')} // Đường dẫn tới lá cờ Anh
            style={styles.flag}
          />
          <Text style={styles.languageText}>Tiếng Anh</Text>
          {selectedLanguage === 'en' && (
            <FontAwesome name="check" size={20} color="#4D2D7D" style={styles.checkIcon} />
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: '#F9FBFF', // Giữ màu nền
  },
  header: {
    flexDirection: 'row',
    marginTop: 0, // Đặt marginTop về 0 để sát trên cùng
    justifyContent: 'space-between',
    paddingTop: 10, // Chỉ thêm padding nhẹ để không sát quá mép trên
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
  languageContainer: {
    marginTop: 30,
    paddingHorizontal: 15, // Thêm padding ngang cho nội dung bên dưới
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedOption: {
    borderColor: '#4D2D7D',
    borderWidth: 2,
  },
  flag: {
    width: 30,
    height: 20,
    marginRight: 15,
    resizeMode: 'contain',
  },
  languageText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  checkIcon: {
    marginLeft: 10,
  },
});

export default LanguageScreen;