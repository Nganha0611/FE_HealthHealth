import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { BottomTabParamList } from '../../navigation/BottomTabs';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CLOUD_URL, CLOUD_PRESET, API_BASE_URL, CLOUD_NAME } from "../../utils/config";
import Notification from "../../components/Notification";
import { launchImageLibrary } from 'react-native-image-picker';
import Loading from '../../components/Loading';
import { useNotification } from '../../contexts/NotificationContext';

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
  });
  const { showNotification } = useNotification();
  
  const [loading, setLoading] = useState(false);
 

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setFormData({
          name: parsedUser.name || '',
          email: parsedUser.email || '',
          phone: parsedUser.numberPhone || '',
          address: parsedUser.address || '',
          url: parsedUser.url || '',
          birth: parsedUser.birth || '',
          sex: parsedUser.sex || '',
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
  
  const handleSave = async () => {
    const { name, email, phone, address } = formData;
  
    if (!name || !email || !phone || !address) {
      showNotification(t("errorEmptyFields") || "Vui lòng điền đầy đủ thông tin", 'error');
      return;
    }
  
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showNotification(t('authError') || 'Lỗi xác thực', 'error');
        return;
      }
      
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) {
        showNotification(t("userDataError") || "Không tìm thấy dữ liệu người dùng", 'error');
        return;
      }
      
      const parsedUser = JSON.parse(storedUser);
      const currentEmail = parsedUser.email;
  
      console.log("Sending data to update:", {
        currentEmail,
        name,
        email,
        numberPhone: phone,
        address,
      });
  
      // Use plain fetch instead of axios to rule out axios-related issues
      const response = await fetch(`${API_BASE_URL}/api/auth/update-info`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentEmail,
          name,
          email,
          numberPhone: phone,
          address,
        })
      });
  
      const responseData = await response.json();
      console.log("Update info response:", responseData);
      
      const { result, message } = responseData;
      if (result === "success") {
        const updatedUser = {
          ...parsedUser,
          name,
          email,
          numberPhone: phone,
          address,
        };
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        console.log("User data updated in storage");
        showNotification(t("successUpdate") || "Cập nhật thành công", 'success');
      } else {
        console.error("Error message from API:", message);
        showNotification(message || t("errorUpdate") || "Cập nhật thất bại", 'error');
      }
    } catch (error) {
      console.error("Error updating user info:", error);
      showNotification(t("errorUpdate") || "Lỗi khi cập nhật thông tin", 'error');
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
      </View>

      {/* Form Container */}
      <View style={styles.formContainer}>
        <View style={styles.inputRow}>
          <Text style={styles.label}>{t("name")}:</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => handleInputChange("name", value)}
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>{t("email")}:</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => handleInputChange("email", value)}
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>{t("phone")}:</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(value) => handleInputChange("phone", value)}
          />
        </View>
        <View style={styles.readOnlySection}>
  <View style={styles.readOnlyRow}>
    <Text style={styles.label}>{t("birth") || "Ngày sinh"}:</Text>
    <View style={styles.readOnlyField}>
      <Text style={styles.readOnlyText}>{formData.birth}</Text>
    </View>
  </View>

  <View style={styles.readOnlyRow}>
    <Text style={styles.label}>{t("gender") || "Giới tính"}:</Text>
    <View style={styles.readOnlyField}>
      <Text style={styles.readOnlyText}>{formData.sex}</Text>
    </View>
  </View>
</View>
        <View style={styles.inputRow}>
          <Text style={styles.label}>{t("address")}:</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(value) => handleInputChange("address", value)}
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? t('saving') : t('save')}</Text>
      </TouchableOpacity>
      {loading && <Loading message={t("loadingMessage")} />}
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
  headerRight: {
    backgroundColor: '#e0dee7',
    borderRadius: 25,
    padding: 5,
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
    // tintColor: '#eee',
  },
  imgProfile: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
});

export default AccountScreen;