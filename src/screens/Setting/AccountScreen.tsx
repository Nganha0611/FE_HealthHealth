import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { BottomTabParamList } from '../../navigation/BottomTabs';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CLOUD_URL, CLOUD_PRESET, API_BASE_URL, CLOUD_NAME } from '../../utils/config';
import Notification from '../../components/Notification';
import { launchImageLibrary } from 'react-native-image-picker';
import Loading from '../../components/Loading';
import { useNotification } from '../../contexts/NotificationContext';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
import { CommonActions } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

type Props = {
  navigation: NavigationProp<any>;
};

const AccountScreen: React.FC<Props> = ({ navigation }) => {
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const { t } = useTranslation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    url: '',
    birth: '',
    sex: '',
    isVerifyPhone: false,
  });
  const { showNotification } = useNotification();
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const { setIsLoggedIn } = useAuth();

  useFocusEffect(
  React.useCallback(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        console.log('>> Loaded user full data:', u);
        setFormData({
          name: u.name || '',
          email: u.email || '',
          phone: u.numberPhone || '',
          address: u.address || '',
          url: u.url || '',
          birth: u.birth || '',
          sex: u.sex || '',
          isVerifyPhone: u.isVerifyPhone || u.verify || false, // Sử dụng cả isVerifyPhone và verify
        });
        setAvatarUrl(u.url || null);
      }
    })();
  }, [])
);

  const handlePickAndUploadImage = async () => {
    setLoading(true);
    try {
      const options = {
        mediaType: 'photo' as const,
        quality: 0.7 as const,
        includeBase64: false,
      };

      const result = await launchImageLibrary(options);
      console.log('Image picker result:', result);

      if (result.didCancel || !result.assets || !result.assets[0].uri) {
        console.log('User cancelled image picker or no image selected');
        setLoading(false);
        return;
      }

      const image = result.assets[0];
      const imageUri = image.uri;
      const imageType = image.type || 'image/jpeg';
      const imageName = image.fileName || 'photo.jpg';

      console.log('Selected image URI:', imageUri);

      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: imageType,
        name: imageName,
      } as any);

      formData.append('upload_preset', 'healthhealth');

      console.log('Uploading to Cloudinary...');

      const res = await axios.post(
        'https://api.cloudinary.com/v1_1/dl4o6bfw5/image/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Cloudinary response:', res.data);

      if (res.data.secure_url) {
        console.log('Image uploaded successfully:', res.data.secure_url);
        setAvatarUrl(res.data.secure_url);
        setFormData(prev => ({ ...prev, url: res.data.secure_url }));

        await updateProfileImage(res.data.secure_url);
        showNotification(t('uploadSuccess') || 'Upload ảnh thành công!', 'success');
      } else {
        console.error('No secure URL in response:', res.data);
        showNotification(t('uploadFailed') || 'Upload thất bại', 'error');
      }
    } catch (error: any) {
      console.error('Error in image upload process:', error.response?.data || error.message);
      showNotification(t('uploadError') || 'Lỗi khi upload ảnh', 'error');
    }
    setLoading(false);
  };

  const updateProfileImage = async (url: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        showNotification(t('authError') || 'Lỗi xác thực', 'error');
        return;
      }

      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) {
        console.error('User data not found');
        throw new Error('User data not found');
      }

      const parsedUser = JSON.parse(storedUser);
      const email = parsedUser.email;

      console.log('Updating profile image with:', { email, url });

      const response = await axios.put(
        `${API_BASE_URL}/api/auth/update-profile-image`,
        { email, url },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Update image response:', response.data);

      const { result, message } = response.data;
      if (result === 'success') {
        const updatedUser = {
          ...parsedUser,
          url,
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('User data updated in storage with new image URL');
      } else {
        console.error('Error message from API:', message);
        throw new Error(message);
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    const { name, email, phone, address } = formData;

    if (!name || !email || !phone || !address) {
      showNotification(t('errorEmptyFields') || 'Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('authError') || 'Lỗi xác thực', 'error');
        return;
      }

      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) {
        showNotification(t('userDataError') || 'Không tìm thấy dữ liệu người dùng', 'error');
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      const currentEmail = parsedUser.email;

      console.log('Sending data to update:', {
        currentEmail,
        name,
        email,
        numberPhone: phone,
        address,
      });

      const response = await fetch(`${API_BASE_URL}/api/auth/update-info`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentEmail,
          name,
          email,
          numberPhone: phone,
          address,
        }),
      });

      const responseData = await response.json();
      console.log('Update info response:', responseData);

      const { result, message } = responseData;
      if (result === 'success') {
        const updatedUser = {
          ...parsedUser,
          name,
          email,
          numberPhone: phone,
          address,
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('User data updated in storage');
        showNotification(t('successUpdate') || 'Cập nhật thành công', 'success');
      } else {
        console.error('Error message from API:', message);
        showNotification(message || t('errorUpdate') || 'Cập nhật thất bại', 'error');
      }
    } catch (error) {
      console.error('Error updating user info:', error);
      showNotification(t('errorUpdate') || 'Lỗi khi cập nhật thông tin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const handleSendCode = async () => {
    try {
      setLoading(true);

      const phoneNumber = formData.phone.trim();
      if (!phoneNumber) {
        Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
        setLoading(false);
        return;
      }

      let formattedPhoneNumber = phoneNumber;
      if (formattedPhoneNumber.startsWith('0')) {
        formattedPhoneNumber = '+84' + formattedPhoneNumber.slice(1);
      } else if (!formattedPhoneNumber.startsWith('+')) {
        formattedPhoneNumber = '+' + formattedPhoneNumber;
      }

      const authInstance = getAuth();
      const confirmationResult = await signInWithPhoneNumber(authInstance, formattedPhoneNumber);

      if (confirmationResult.verificationId) {
        setVerificationId(confirmationResult.verificationId);
        console.log('Verification ID set:', confirmationResult.verificationId);

        // Đặt isLoggedIn về false để chuyển sang AuthStack
        setIsLoggedIn(false);

        // Reset navigator với delay để đảm bảo isLoggedIn được cập nhật
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'AuthStack',
                  params: {
                    screen: 'VerifyOTP',
                    params: {
                      numberPhone: phoneNumber, // Sử dụng numberPhone để khớp với VerifyOTPScreen
                      otpAction: 'verify',
                      verificationId: confirmationResult.verificationId,
                    },
                  },
                },
              ],
            })
          );
        }, 100); // Delay 100ms để đảm bảo re-render
      }
    } catch (error) {
      console.error('Lỗi khi gửi OTP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi';
      Alert.alert('Lỗi', `Không thể gửi mã OTP: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesome
            name="chevron-left"
            size={20}
            color="#432c81"
            onPress={() => navigationMain.navigate('SettingStack', { screen: 'Settings' })}
          />
          <Text style={styles.headerTitle}>{t('personalInformation')}</Text>
        </View>
      </View>

      {/* Avatar */}
      <View style={styles.avatar}>
        <View style={styles.boxImage}>
          <Image
            style={styles.imgProfile}
            source={avatarUrl ? { uri: avatarUrl } : require('../../assets/avatar.jpg')}
          />
          <TouchableOpacity style={styles.editImage} onPress={handlePickAndUploadImage} disabled={loading}>
            <Image
              style={styles.editIcon}
              source={require('../../assets/edit.png')}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{formData.name}</Text>
        <Text style={styles.email}>{formData.email}</Text>
      </View>

      {/* Form Container */}
      <View style={styles.formContainer}>
        <View style={styles.inputRow}>
          <Text style={styles.label}>{t('name')}:</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>{t('email')}:</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>{t('phone')}:</Text>
          <View style={styles.phoneInputContainer}>
            <TextInput
              style={styles.phoneInput}
              value={formData.phone}
              editable={!formData.isVerifyPhone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType='phone-pad'
              placeholder='Nhập số điện thoại'
            />
            {formData.isVerifyPhone ? (
              <Text style={styles.verifiedIcon}>{t('verified')}</Text>
            ) : (
              <TouchableOpacity onPress={handleSendCode}>
                <Text style={styles.verifyButtonText}>{t('verifyNow')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.readOnlySection}>
          <View style={styles.readOnlyRow}>
            <Text style={styles.label}>{t('birth') || 'Ngày sinh'}:</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{formData.birth}</Text>
            </View>
          </View>

          <View style={styles.readOnlyRow}>
            <Text style={styles.label}>{t('gender') || 'Giới tính'}:</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{formData.sex}</Text>
            </View>
          </View>
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>{t('address')}:</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? t('saving') : t('save')}</Text>
      </TouchableOpacity>
      {loading && <Loading message={t('processing')} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  inputRow: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    fontSize: 16,
    color: '#555',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#4D2D7D',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  boxImage: {
    position: 'relative',
    padding: 10,
    marginRight: 15,
    backgroundColor: '#e0dee7',
    borderRadius: 75,
    width: 140,
    height: 140,
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  editImage: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: '#432c81',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    width: 30,
    height: 30,
  },
  imgProfile: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  name: {
    color: '#6241c0',
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 15,
  },
  email: {
    color: '#9f8dd3',
    marginTop: 10,
    marginBottom: 20,
  },
  readOnlySection: {
    marginBottom: 15,
  },
  readOnlyRow: {
    marginBottom: 12,
  },
  readOnlyField: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#666',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    flex: 1,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  verifyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    padding: 5,
    backgroundColor: 'red',
    borderBlockColor: 'red',
    borderRadius: 10,
  },
  verifiedIcon: {
    fontSize: 18,
    marginLeft: 10,
    color: 'green',
  },
});

export default AccountScreen;