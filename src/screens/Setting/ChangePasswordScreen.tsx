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
import {API_BASE_URL} from '../../utils/config';
import Loading from '../../components/Loading';
import { useTranslation } from 'react-i18next';

type Props = {
  navigation: NavigationProp<any>;
};

const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [reNewPassword, setReNewPassword] = useState("");
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isReNewPasswordVisible, setIsReNewPasswordVisible] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !reNewPassword) {
      Alert.alert(t("errorEmptyFields"));
      return;
    }

    if (newPassword !== reNewPassword) {
      Alert.alert(t("errorPasswordMismatch"));
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      Alert.alert(t("errorPasswordInvalid"));
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/change-password`, {
        currentPassword,
        newPassword,
      });

      if (response.data.result === "success") {
        Alert.alert(t("successPasswordChanged"));
        navigation.goBack();
      } else {
        Alert.alert(t("errorGeneric"));
      }
    } catch (error) {
      const errorMessage =
        (error as any)?.response?.data?.message || t("errorCannotChange");
      Alert.alert(t("errorCannotChange"), errorMessage);
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
          <Text style={[styles.text, { fontSize: 30, marginTop: 5 }]}>{t("changePassword")}</Text>
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
            placeholder={t("currentPassword")}
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
            placeholder={t("newPassword")}
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
            placeholder={t("reNewPassword")}
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
          <Text style={styles.buttonText}>{t("changePasswordButton")}</Text>
        </TouchableOpacity>
      </View>

      {loading && <Loading message={t("processing")} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer:  {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Roboto',
    color: '#432c81',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  headerRight: {
    backgroundColor: '#e0dee7',
    borderRadius: 25,
    padding: 5,
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
    paddingRight: 40,
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
  text: {
    fontSize: 25,
    fontFamily: 'Roboto',
    color: '#432c81',
    fontWeight: 'bold',
  },
});

export default ChangePasswordScreen;
