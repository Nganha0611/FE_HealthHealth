import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { BottomTabParamList } from '../../navigation/BottomTabs';
import axios from 'axios';
import API_BASE_URL from '../../utils/config';
import Loading from '../../components/Loading';

type Props = {
  navigation: NavigationProp<any>;
};

const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [reNewPassword, setReNewPassword] = useState("");
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isReNewPasswordVisible, setIsReNewPasswordVisible] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !reNewPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (newPassword !== reNewPassword) {
      Alert.alert("Lỗi", "Mật khẩu nhập lại không khớp!");
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      Alert.alert(
        "Lỗi",
        "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ in hoa, số và ký tự đặc biệt!"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/change-password`, {
        currentPassword,
        newPassword,
      });

      if (response.data.result === "success") {
        Alert.alert("Thành công", "Mật khẩu đã được thay đổi thành công!");
        navigation.goBack();
      } else {
        Alert.alert("Lỗi", response.data.message || "Có lỗi xảy ra khi đổi mật khẩu.");
      }
    } catch (error) {
      const errorMessage =
        (error as any)?.response?.data?.message || "Không thể đổi mật khẩu, vui lòng thử lại!";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
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
          <Text style={[styles.text, { fontSize: 30, marginTop: 5 }]}>Đổi mật khẩu</Text>
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

      {/* Nội dung đổi mật khẩu */}
      <View style={styles.formContainer}>
        {/* Ô nhập mật khẩu hiện tại */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu hiện tại"
            placeholderTextColor="#888"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!isCurrentPasswordVisible}
          />
          <TouchableOpacity
            onPressIn={() => setIsCurrentPasswordVisible(true)}
            onPressOut={() => setIsCurrentPasswordVisible(false)}
            style={styles.eyeIcon}
          >
            <Text style={{ fontSize: 18 }}>{isCurrentPasswordVisible ? "👁️" : "🙈"}</Text>
          </TouchableOpacity>
        </View>

        {/* Ô nhập mật khẩu mới */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu mới"
            placeholderTextColor="#888"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!isNewPasswordVisible}
          />
          <TouchableOpacity
            onPressIn={() => setIsNewPasswordVisible(true)}
            onPressOut={() => setIsNewPasswordVisible(false)}
            style={styles.eyeIcon}
          >
            <Text style={{ fontSize: 18 }}>{isNewPasswordVisible ? "👁️" : "🙈"}</Text>
          </TouchableOpacity>
        </View>

        {/* Nhập lại mật khẩu mới */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập lại mật khẩu mới"
            placeholderTextColor="#888"
            value={reNewPassword}
            onChangeText={setReNewPassword}
            secureTextEntry={!isReNewPasswordVisible}
          />
          <TouchableOpacity
            onPressIn={() => setIsReNewPasswordVisible(true)}
            onPressOut={() => setIsReNewPasswordVisible(false)}
            style={styles.eyeIcon}
          >
            <Text style={{ fontSize: 18 }}>{isReNewPasswordVisible ? "👁️" : "🙈"}</Text>
          </TouchableOpacity>
        </View>

        {/* Nút Đổi mật khẩu */}
        <TouchableOpacity style={styles.changeButton} onPress={handleChangePassword}>
          <Text style={styles.buttonText}>Đổi mật khẩu</Text>
        </TouchableOpacity>
      </View>

      {loading && <Loading message="Đang xử lý..." />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 15,
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
  formContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    position: 'relative',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingRight: 40, // Chừa chỗ cho icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 10,
  },
  changeButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#4D2D7D',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChangePasswordScreen;