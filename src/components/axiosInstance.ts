import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/config';
import { Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { NavigationContainerRef } from '@react-navigation/native';

declare global {
  var navigationRef: NavigationContainerRef<any>;
}

// Khởi tạo axios
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Thêm interceptor để đính kèm token tự động
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor để xử lý khi token hết hạn
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn -> xóa token và logout
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      Alert.alert(
        'Phiên đăng nhập đã hết',
        'Vui lòng đăng nhập lại.',
        [
          {
            text: 'OK',
            onPress: () => {
              global.navigationRef.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'LoginScreen' }],
                })
              );
            },
          },
        ],
        { cancelable: false }
      );
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
