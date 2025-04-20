import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { BottomTabParamList } from '../../navigation/BottomTabs';
import { SettingStackParamList } from '../../navigation/SettingStack';
import Notification from "../../components/Notification";
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../contexts/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../utils/config';
import axios from 'axios';
import Loading from '../../components/Loading';
import { launchImageLibrary } from 'react-native-image-picker';

type Props = {
  navigation: StackNavigationProp<SettingStackParamList, 'Settings'>;
};

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { showNotification } = useNotification();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const handleLogout = () => {
    showNotification(
      t('areYouSureLogout'),
      'warning',
      [
        {
          text: t('cancel'),
          onPress: () => { },
          color: 'danger'
        },
        {
          text: t('logout'),
          onPress: () => {
            logout();
          },
          color: 'primary'
        }
      ]
    );
  };
  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setFormData({
          name: parsedUser.name || '',
          email: parsedUser.email || ''
        });
        setAvatarUrl(parsedUser.url || null);
      }
    };
    fetchUser();
  }, []);

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
        'https://api.cloudinary.com/v1_1/dl4o6bfw5/image/upload', // ✅ Đúng cloud_name
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
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        showNotification(t('authError') || 'Lỗi xác thực', 'error');
        return;
      }

      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) {
        console.error("User data not found");
        throw new Error('User data not found');
      }

      const parsedUser = JSON.parse(storedUser);
      const email = parsedUser.email;

      console.log("Updating profile image with:", { email, url });

      const response = await axios.put(
        `${API_BASE_URL}/api/auth/update-profile-image`,
        { email, url },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log("Update image response:", response.data);

      const { result, message } = response.data;
      if (result === "success") {
        // Update user in AsyncStorage with new avatar URL
        const updatedUser = {
          ...parsedUser,
          url
        };
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        console.log("User data updated in storage with new image URL");
      } else {
        console.error("Error message from API:", message);
        throw new Error(message);
      }
    } catch (error) {
      console.error("Error updating profile image:", error);
      throw error;
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('settings')}</Text>
      </View>
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

      <TouchableOpacity style={styles.listSetting} onPress={() => navigation.navigate('Account')}>
        <View style={styles.listSettingLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome
              name="user"
              size={20}
              color="#432c81"
            />
          </View>
          <Text style={styles.listSettingText}>{t('account')}</Text>
        </View>
        <View style={styles.listSettingRight}>
          <FontAwesome
            name="chevron-right"
            size={20}
            color="#432c81"
            style={{ marginRight: 15 }}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.listSetting} onPress={() => navigationMain.navigate('NotifyStack', { screen: 'NotifyScreen' } as any)}>
        <View style={styles.listSettingLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome
              name="bell"  
              size={20}
              color="#432c81"
            />
          </View>
          <Text style={styles.listSettingText}>{t('notifications')}</Text>
        </View>
        <View style={styles.listSettingRight}>
          <FontAwesome
            name="chevron-right"
            size={20}
            color="#432c81"
            style={{ marginRight: 15 }}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.listSetting} onPress={() => navigation.navigate('Language')}>
        <View style={styles.listSettingLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome
              name="globe"  // Ngôn ngữ (hoặc "language")
              size={20}
              color="#432c81"
            />
          </View>
          <Text style={styles.listSettingText}>{t('language')}</Text>
        </View>
        <View style={styles.listSettingRight}>
          <FontAwesome
            name="chevron-right"
            size={20}
            color="#432c81"
            style={{ marginRight: 15 }}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.listSetting} onPress={() => navigation.navigate('ChangePassword')}>
        <View style={styles.listSettingLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome
              name="lock"  // Đổi mật khẩu
              size={20}
              color="#432c81"
            />
          </View>
          <Text style={styles.listSettingText}>{t('changePassword')}</Text>
        </View>
        <View style={styles.listSettingRight}>
          <FontAwesome
            name="chevron-right"
            size={20}
            color="#432c81"
            style={{ marginRight: 15 }}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.listSetting} onPress={handleLogout}>
        <View style={styles.listSettingLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome
              name="sign-out"
              size={20}
              color="#432c81"
            />
          </View>
          <Text style={styles.listSettingText}>{t('logout')}</Text>
        </View>
        <View style={styles.listSettingRight}>
          <FontAwesome
            name="chevron-right"
            size={20}
            color="#432c81"
            style={{ marginRight: 15 }}
          />
        </View>
      </TouchableOpacity>
      {loading && <Loading message={t("processing")} />}

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
  listSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    marginLeft: 16,
  },
  listSettingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  listSettingText: {
    fontSize: 20,
    color: '#432c81',
  },
  listSettingRight: {},

  imgProfile: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  editIcon: {
    width: 30,
    height: 30,
    // tintColor: '#eee',
  },
})

export default SettingsScreen;
