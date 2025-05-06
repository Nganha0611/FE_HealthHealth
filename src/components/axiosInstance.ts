import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/config';
import { Alert } from 'react-native';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Gọi hàm logout từ AuthContext
      if (global.authLogout) {
        await global.authLogout(); // đăng xuất
      }

      Alert.alert(
        'Hết phiên đăng nhập',
        'Phiên làm việc của bạn đã hết, vui lòng đăng nhập lại.'
      );
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
