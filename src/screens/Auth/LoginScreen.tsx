import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../utils/config';
import Loading from '../../components/Loading';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../contexts/NotificationContext';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;
type LoginScreenRouteProp = RouteProp<AuthStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
  route: LoginScreenRouteProp;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const handleLogin = async () => {
    if (!email || !password) {
      showNotification(t('error.emailPasswordRequired'), 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { email, password }
      );

      const { result, message, token, user } = response.data;

      if (result === 'success' && token && user) {
        showNotification(t('loginSuccess'), 'success');
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        console.log('Login successful:', user.isVerify);
        await login(token, user);
        // Loại bỏ navigation.reset, để AppNavigator tự động chuyển sang BottomTabs
      } else {
        showNotification(t('error.loginFailed'), 'error');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;
        if (status === 401 && data.result === 'wrongPassword') {
          showNotification(t('error.incorrectPassword'), 'error');
        } else if (status === 404 && data.result === 'emailNotExist') {
          showNotification(t('error.emailNotFound'), 'error');
        } else {
          showNotification(t('error.authError'), 'error');
        }
      } else {
        console.error('Unknown error:', error);
        showNotification(t('error.generalError'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading && <Loading message={t('loading.login')} />}

      <Text style={styles.welcomeText}>{t('welcomeBackMessage')}</Text>
      <Text style={styles.loginText}>{t('login')}</Text>

      <Image
        source={require('../../assets/login.png')}
        style={styles.illustration}
      />

      <TextInput
        style={styles.input}
        placeholder={t('placeholder.emailOrPhone')}
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input1}
          placeholder={t('placeholder.password')}
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
        />
        <TouchableOpacity
          onPressIn={() => setIsPasswordVisible(true)}
          onPressOut={() => setIsPasswordVisible(false)}
          style={styles.eyeIcon}
        >
          <Text style={{ fontSize: 18 }}>
            {isPasswordVisible ? '👁️' : '🙈'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ width: '100%', alignItems: 'flex-end' }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPasswordText}>
            {t('forgotPassword.subtitle')}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>{t('loginButton')}</Text>
      </TouchableOpacity>

      <Text
        style={styles.signUpText}
        onPress={() => navigation.navigate('SignUp')}
      >
        {t('noAccount')} <Text style={styles.signUpLink}>{t('signUp')}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 20,
    color: '#4D2D7D',
    marginBottom: 5,
  },
  loginText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4D2D7D',
    marginBottom: 20,
  },
  illustration: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
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
  input1: {
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
  forgotPasswordText: {
    alignSelf: 'flex-end',
    color: '#4D2D7D',
    fontSize: 14,
    marginBottom: 20,
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#4D2D7D',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpText: {
    marginTop: 15,
    fontSize: 14,
    color: '#333',
  },
  signUpLink: {
    color: '#4D2D7D',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default LoginScreen;