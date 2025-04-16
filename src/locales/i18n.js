import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import vi from './vi.json';
import en from './en.json';

// Khởi tạo i18n trước khi export
const i18nInstance = i18n.use(initReactI18next);

i18nInstance.init({
  compatibilityJSON: 'v3',
  fallbackLng: 'vi',
  resources: {
    vi: {
      translation: vi
    },
    en: {
      translation: en
    }
  },
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Hàm phát hiện ngôn ngữ
const detectLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('language');
    if (savedLanguage) {
      await i18nInstance.changeLanguage(savedLanguage);
    } else {
      await AsyncStorage.setItem('language', 'vi');
      await i18nInstance.changeLanguage('vi');
    }
  } catch (error) {
    console.error('Error detecting/setting language:', error);
  }
};

// Gọi hàm phát hiện ngôn ngữ
detectLanguage();

export const changeLanguage = async (language) => {
  try {
    if (language !== 'vi' && language !== 'en') {
      console.error('Unsupported language:', language);
      return false;
    }
    
    await i18nInstance.changeLanguage(language);
    await AsyncStorage.setItem('language', language);
    return true;
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

export default i18nInstance;