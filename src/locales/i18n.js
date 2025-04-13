import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import vi from './vi.json';
import en from './en.json';

const initializeI18n = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('language') || 'vi';
    
    await i18n
      .use(initReactI18next)
      .init({
        compatibilityJSON: 'v3',
        lng: savedLanguage,
        fallbackLng: 'en',
        resources: {
          vi: { translation: vi },
          en: { translation: en },
        },
        interpolation: {
          escapeValue: false,
        },
      });
      
  } catch (error) {
    console.error('Error initializing i18n:', error);
    
    i18n
      .use(initReactI18next)
      .init({
        compatibilityJSON: 'v3',
        lng: 'vi',
        fallbackLng: 'en',
        resources: {
          vi: { translation: vi },
          en: { translation: en },
        },
        interpolation: {
          escapeValue: false,
        },
      });
  }
};

// Initialze i18n
initializeI18n();

export const changeLanguage = async (language) => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem('language', language);
    return true;
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

export default i18n;