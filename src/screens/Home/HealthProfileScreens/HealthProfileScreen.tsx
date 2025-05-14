import { NavigationProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, Modal, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import { API_BASE_URL } from '../../../utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../../contexts/NotificationContext';
import Loading from '../../../components/Loading';
import { BottomTabParamList } from '../../../navigation/BottomTabs';

type Props = {
  navigation: NavigationProp<any>;
};

const HealthProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [typeSelectModalVisible, setTypeSelectModalVisible] = useState(false);
  const [sysValue, setSysValue] = useState<string | null>(null);
  const [diaValue, setDiaValue] = useState<string | null>(null);
  const [heartRate, setHeartRate] = useState<string | null>(null);
  const [heartRateDate, setHeartRateDate] = useState<string | null>(null);
  const [bloodPressureDate, setBloodPressureDate] = useState<string | null>(null);
  const { t } = useTranslation();
  // const steps = 1114; // Comment biến steps
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();

  const fetchUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      console.log('User data from AsyncStorage:', userData);
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
        setAvatarUrl(user.url || null);
      } else {
        console.log('No user data found in AsyncStorage');
        showNotification(t('noUserInfo'), 'error');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      showNotification(t('fetchUserError'), 'error');
    }
  };

  const fetchLatestHeartRate = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token for heart rate:', token ? 'Found' : 'Not found');
      if (!token) {
        showNotification(t('unauthorized'), 'error');
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/heart-rates/measure/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Heart rate response status:', response.status);
      console.log('Heart rate response data:', JSON.stringify(response.data, null, 2));
      if (response.status === 204) {
        console.log('No heart rate data (204 No Content)');
        setHeartRate(null);
        setHeartRateDate(null);
        return;
      }
      if (response.data && (response.data.rate !== undefined || response.data.heartRate !== undefined)) {
        const rate = response.data.rate ?? response.data.heartRate;
        console.log('Setting heart rate:', rate);
        setHeartRate(rate.toString());
        setHeartRateDate(response.data.createdAt);
      } else {
        console.log('No valid heart rate data found in response');
        setHeartRate(null);
        setHeartRateDate(null);
      }
    } catch (error: any) {
      console.error('Error fetching heart rate:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
        if (error.response.status === 401) {
          showNotification(t('unauthorized'), 'error');
        } else if (error.response.status === 403) {
          showNotification(t('forbidden'), 'error');
        } else if (error.response.status === 204) {
          console.log('No heart rate data (204 No Content)');
          setHeartRate(null);
          setHeartRateDate(null);
        } else {
          showNotification(t('fetchHeartRateError'), 'error');
        }
      } else {
        showNotification(t('fetchHeartRateError'), 'error');
      }
    }
  };

  const fetchLatestBloodPressure = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token for blood pressure:', token ? 'Found' : 'Not found');
      if (!token) {
        showNotification(t('unauthorized'), 'error');
        return;
      }
      console.log('Fetching blood pressure from:', `${API_BASE_URL}/api/blood-pressures/measure/latest`);
      const response = await axios.get(`${API_BASE_URL}/api/blood-pressures/measure/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Blood pressure response status:', response.status);
      console.log('Blood pressure response data:', JSON.stringify(response.data, null, 2));
      if (response.status === 204) {
        console.log('No blood pressure data (204 No Content)');
        setSysValue(null);
        setDiaValue(null);
        setBloodPressureDate(null);
        return;
      }
      if (response.data && response.data.systolic !== undefined && response.data.diastolic !== undefined) {
        console.log('Setting blood pressure: systolic=', response.data.systolic, 'diastolic=', response.data.diastolic);
        setSysValue(response.data.systolic.toString());
        setDiaValue(response.data.diastolic.toString());
        setBloodPressureDate(response.data.createdAt);
      } else {
        console.log('No valid blood pressure data found in response');
        setSysValue(null);
        setDiaValue(null);
        setBloodPressureDate(null);
      }
    } catch (error: any) {
      console.error('Error fetching blood pressure:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
        if (error.response.status === 401) {
          showNotification(t('unauthorized'), 'error');
        } else if (error.response.status === 403) {
          showNotification(t('forbidden'), 'error');
        } else if (error.response.status === 204) {
          console.log('No blood pressure data (204 No Content)');
          setSysValue(null);
          setDiaValue(null);
          setBloodPressureDate(null);
        } else {
          showNotification(t('fetchBloodPressureError'), 'error');
        }
      } else {
        showNotification(t('fetchBloodPressureError'), 'error');
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('useFocusEffect triggered for HealthProfileScreen');
      const fetchAll = async () => {
        setLoading(true);
        try {
          console.log('Fetching user, heart rate, and blood pressure');
          await Promise.all([fetchUser(), fetchLatestHeartRate(), fetchLatestBloodPressure()]);
        } catch (error) {
          console.error('Error in fetchAll:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchAll();
    }, [])
  );

  const handleMeasureBloodPressure = async () => {
    if (!sysValue || !diaValue || isNaN(parseInt(sysValue)) || isNaN(parseInt(diaValue))) {
      console.log('Invalid blood pressure input:', { sysValue, diaValue });
      showNotification(t('errorIncompleteInfo'), 'error');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token for blood pressure:', token ? 'Found' : 'Not found');
      if (!token) {
        showNotification(t('unauthorized'), 'error');
        return;
      }
      console.log('Sending blood pressure data:', {
        systolic: parseInt(sysValue),
        diastolic: parseInt(diaValue),
      });
      const response = await axios.post(
        `${API_BASE_URL}/api/blood-pressures/measure`,
        {
          systolic: parseInt(sysValue),
          diastolic: parseInt(diaValue),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Blood pressure created:', response.data);
      showNotification(t('bloodPressureCreated'), 'success');
      setSysValue(response.data.systolic.toString());
      setDiaValue(response.data.diastolic.toString());
      setBloodPressureDate(response.data.createdAt);
      setSysValue('');
      setDiaValue('');
      fetchLatestBloodPressure();
    } catch (error: any) {
      console.error('Error creating blood pressure:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
        if (error.response.status === 401) {
          showNotification(t('unauthorized'), 'error');
        } else if (error.response.status === 403) {
          showNotification(t('forbidden'), 'error');
        } else {
          showNotification(t('createBloodPressureError'), 'error');
        }
      } else {
        showNotification(t('createBloodPressureError'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

 const handleMeasureHeartRate = async () => {
  const rateValue = parseInt(inputValue);
  if (!inputValue.trim() || isNaN(rateValue) || rateValue <= 0 || rateValue > 300) {
    console.log('Invalid heart rate input:', inputValue, 'parsed value:', rateValue);
    showNotification(t('errorInvalidHeartRate'), 'error');
    return;
  }
  setLoading(true);
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('Token for heart rate:', token ? 'Found' : 'Not found');
    if (!token) {
      showNotification(t('unauthorized'), 'error');
      return;
    }
    const response = await axios.post(
      `${API_BASE_URL}/api/heart-rates/measure`,
      {
        heartRate: rateValue, 
      },
      {
        headers: { Authorization: `Bearer ${token}` }, 
      }
    );
    console.log('Heart rate created:', response.data);

    const newRate = response.data?.heartRate ?? rateValue;
    setHeartRate(newRate.toString());
    setHeartRateDate(response.data?.createdAt ?? new Date().toISOString());
    setInputValue('');
    showNotification(t('heartRateCreated'), 'success');
    await fetchLatestHeartRate(); 
  } catch (error: any) {
    console.error('Error creating heart rate:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
      if (error.response.status === 401) {
        showNotification(t('unauthorized'), 'error');
      } else if (error.response.status === 403) {
        showNotification(t('forbidden'), 'error');
      } else {
        showNotification(t('createHeartRateError'), 'error');
      }
    } else {
      showNotification(t('createHeartRateError'), 'error');
    }
  } finally {
    setLoading(false);
  }
};

  const handleMeasurePress = () => {
    setTypeSelectModalVisible(true);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-/-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.log('Invalid date string:', dateString);
        return '-/-';
      }
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error parsing date:', error);
      return '-/-';
    }
  };

  return (
    <ScrollView>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesome
            name="chevron-left"
            size={20}
            color="#432c81"
            style={{ marginRight: 15, marginTop: 17 }}
            onPress={() => navigation.goBack()}
          />
          <Text style={[styles.text1, { fontSize: 30, marginTop: 5 }]}>{t('healthProfile')}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigationMain.navigate('SettingStack', { screen: 'Account' })}>
            <Image
              style={styles.imgProfile}
              source={avatarUrl ? { uri: avatarUrl } : require('../../../assets/avatar.jpg')}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.measureContainer} onPress={handleMeasurePress}>
        <View style={styles.measureContent}>
          <FontAwesome5 name="stethoscope" size={26} color="#432c81" style={styles.measureIcon} />
          <View>
            <Text style={styles.measureTitle}>{t('measureTitle')}</Text>
            <Text style={styles.measureSubtitle}>{t('measureSubtitle')}</Text>
          </View>
        </View>
        <FontAwesome name="chevron-right" size={22} color="#432c81" />
      </TouchableOpacity>

      <View style={styles.mainIf}>
        <View style={styles.infoContainer}>
          {/* Comment phần hiển thị bước chân */}
          {/* <View style={styles.textContainer}>
            <View style={styles.row}>
              <Image style={styles.icon} source={require('../../../assets/step.png')} />
              <Text style={[styles.number, { color: '#3CB371' }]}>
                {steps.toLocaleString()} {t('stepsUnit')}
              </Text>
            </View>
          </View> */}
          <View style={styles.textContainer}>
            <View style={styles.row}>
              <Image
                style={[styles.icon, { width: 23, height: 23, marginLeft: 3, marginRight: 8 }]}
                source={require('../../../assets/heart_rate.png')}
              />
              <View>
                <Text style={[styles.number, { color: '#ed1b24' }]}>
                  {heartRate != null ? `${heartRate} ${t('bpm')}` : `-/- ${t('bpm')}`}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.textContainer}>
            <View style={styles.row}>
              <Image
                style={[styles.icon, { width: 23, height: 23, marginLeft: 3, marginRight: 8 }]}
                source={require('../../../assets/blood_pressure.png')}
              />
              <View>
                <Text style={[styles.number, { color: '#2577f7' }]}>
                  {sysValue && diaValue ? `${sysValue}/${diaValue} ${t('mmHg')}` : `-/- ${t('mmHg')}`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.circleContainer}>
          <Svg width={120} height={120} viewBox="0 0 120 120">
            {/* Comment vòng tròn liên quan đến bước chân */}
            {/* <Circle cx="60" cy="60" r="55" stroke="#3CB371" strokeWidth="9" fill="none" strokeDasharray="345.6" strokeDashoffset="80" strokeLinecap="round" /> */}
            <Circle
              cx="60"
              cy="60"
              r="45"
              stroke="#ed1b24"
              strokeWidth="9"
              fill="none"
              strokeDasharray="282.6"
              strokeDashoffset="90"
              strokeLinecap="round"
            />
            <Circle
              cx="60"
              cy="60"
              r="35"
              stroke="#2577f7"
              strokeWidth="9"
              fill="none"
              strokeDasharray="219.2"
              strokeDashoffset="78"
              strokeLinecap="round"
            />
          </Svg>
        </View>
      </View>

      {/* Comment toàn bộ stepContainer */}
      {/* <TouchableOpacity style={styles.stepContainer} onPress={() => navigation.navigate('Step')}>
        <View style={styles.stepContent}>
          <FontAwesome5 name="shoe-prints" size={26} color="#432c81" style={styles.stepIcon} />
          <View>
            <Text style={styles.stepTitle}>{steps}</Text>
            <Text style={styles.stepSubtitle}>/6000</Text>
          </View>
        </View>
        <View style={styles.progressWrapper}>
          <Text style={styles.progressText}>{Math.min(Math.round((steps / 6000) * 100), 100)}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min((steps / 6000) * 100, 100)}%` }]} />
          </View>
        </View>
      </TouchableOpacity> */}

      <TouchableOpacity style={styles.heartRateContainer} onPress={() => navigation.navigate('HeartRate')}>
        <View style={styles.stepContent}>
          <FontAwesome5 name="heartbeat" size={26} color="#ed1b24" style={styles.heartRateIcon} />
          <View>
            <Text style={styles.heartRateTitle}>{heartRate != null ? heartRate : '-/-'}</Text>
            <Text style={styles.heartRateSubtitle}>/{t('bpm')}</Text>
            <Text style={styles.dateText}>{formatDateTime(heartRateDate)}</Text>
          </View>
        </View>
        <View style={styles.heartRateProgressWrapper}>
          <Text style={styles.heartRateProgressText}>!</Text>
          <View style={styles.heartRateProgressBar}>
            <View
              style={[
                styles.heartRateProgressFill,
                { width: heartRate ? `${Math.min((parseInt(heartRate) / 100) * 100, 100)}%` : '0%' },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bloodPressureContainer} onPress={() => navigation.navigate('BloodPressure')}>
        <View style={styles.stepContent}>
          <FontAwesome5 name="heartbeat" size={26} color="#2577f7" style={styles.bloodPressureIcon} />
          <View>
            <Text style={styles.bloodPressureTitle}>{sysValue != null ? sysValue : '-/-'}</Text>
            <Text style={styles.bloodPressureSubtitle}>/{diaValue != null ? diaValue : '-/-'}</Text>
            <Text style={styles.dateText}>{formatDateTime(bloodPressureDate)}</Text>
          </View>
        </View>
        <View>
          <View style={styles.bloodPressureProgressWrapper}>
            <Text style={styles.bloodPressureProgressText}>SYS</Text>
            <View style={styles.bloodPressureProgressBar}>
              <View
                style={[
                  styles.bloodPressureProgressFill,
                  { width: sysValue ? `${Math.min((parseInt(sysValue) / 140) * 100, 100)}%` : '0%' },
                ]}
              />
            </View>
          </View>
          <View style={styles.bloodPressureProgressWrapper}>
            <Text style={styles.bloodPressureProgressText}>DIA</Text>
            <View style={styles.bloodPressureProgressBar}>
              <View
                style={[
                  styles.bloodPressureProgressFill,
                  { width: diaValue ? `${Math.min((parseInt(diaValue) / 90) * 100, 100)}%` : '0%' },
                ]}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={typeSelectModalVisible}
        onRequestClose={() => setTypeSelectModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.enhancedModalContainer}>
            <Text style={styles.enhancedModalTitle}>{t('measureSelection')}</Text>
            <Pressable
              style={[styles.enhancedButton, { backgroundColor: '#2577f7', marginBottom: 20 }]}
              onPress={() => {
                setSelectedMeasurement('blood_pressure');
                setTypeSelectModalVisible(false);
                setModalVisible(true);
              }}
            >
              <FontAwesome name="heart" size={28} color="white" style={{ marginRight: 10 }} />
              <Text style={styles.enhancedButtonText}>{t('measureBloodPressure')}</Text>
            </Pressable>
            <Pressable
              style={[styles.enhancedButton, { backgroundColor: '#ed1b24' }]}
              onPress={() => {
                setSelectedMeasurement('heart_rate');
                setTypeSelectModalVisible(false);
                setModalVisible(true);
              }}
            >
              <FontAwesome name="heartbeat" size={28} color="white" style={{ marginRight: 10 }} />
              <Text style={styles.enhancedButtonText}>{t('measureHeartRate')}</Text>
            </Pressable>
            <Pressable style={styles.closeButton} onPress={() => setTypeSelectModalVisible(false)}>
              <Text style={styles.closeButtonText}>{t('close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.enhancedModalContainer}>
            <Text style={styles.enhancedModalTitle}>
              {selectedMeasurement === 'blood_pressure' ? t('enterBloodPressure') : t('enterHeartRate')}
            </Text>
            {selectedMeasurement === 'blood_pressure' ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('sysLabel')}:</Text>
                  <TextInput
                    style={styles.enhancedInput}
                    keyboardType="numeric"
                    placeholder={t('sysPlaceholder')}
                    value={sysValue || ''}
                    onChangeText={(text) => setSysValue(text)}
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.inputUnit}>mmHg</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('diaLabel')}:</Text>
                  <TextInput
                    style={styles.enhancedInput}
                    keyboardType="numeric"
                    placeholder={t('diaPlaceholder')}
                    value={diaValue || ''}
                    onChangeText={(text) => setDiaValue(text)}
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.inputUnit}>mmHg</Text>
                </View>
              </>
            ) : (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('heartRateLabel')}:</Text>
                <TextInput
                  style={styles.enhancedInput}
                  keyboardType="numeric"
                  placeholder={t('heartRatePlaceholder')}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholderTextColor="#999"
                />
                <Text style={styles.inputUnit}>{t('bpm')}</Text>
              </View>
            )}
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: '#ccc' }]}
                onPress={() => {
                  setModalVisible(false);
                  setInputValue('');
                  setSysValue(null);
                  setDiaValue(null);
                }}
              >
                <Text style={styles.actionButtonText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, { backgroundColor: '#3CB371' }]}
                onPress={() => {
                  if (selectedMeasurement === 'blood_pressure') {
                    handleMeasureBloodPressure();
                  } else {
                    handleMeasureHeartRate();
                  }
                  setModalVisible(false);
                }}
              >
                <Text style={styles.actionButtonText}>{t('save')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {loading && <Loading message={t('processing')} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainIf: {
    flexDirection: 'row',
    width: 'auto',
    height: 140,
    backgroundColor: '#e0dee7',
    marginHorizontal: 10,
    borderRadius: 20,
    marginTop: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  measureContainer: {
    flexDirection: 'row',
    width: 'auto',
    height: 80,
    backgroundColor: '#e0dee7',
    marginHorizontal: 10,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
  },
  measureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  measureIcon: {
    marginRight: 15,
  },
  measureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#432c81',
  },
  measureSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 29,
    height: 29,
    marginRight: 5,
  },
  infoContainer: {
    flex: 1,
  },
  textContainer: {
    marginBottom: 5,
  },
  number: {
    fontWeight: 'bold',
    fontSize: 25,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  text1: {
    fontSize: 25,
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
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  enhancedModalContainer: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  enhancedModalTitle: {
    fontSize: 26,
    marginBottom: 25,
    color: '#432c81',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  enhancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
  },
  enhancedButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
  },
  closeButton: {
    backgroundColor: '#888',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  enhancedInput: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 10,
    width: '100%',
    padding: 15,
    fontSize: 22,
    backgroundColor: '#f9f9f9',
  },
  inputUnit: {
    position: 'absolute',
    right: 15,
    top: 60,
    fontSize: 18,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    marginRight: 15,
    color: '#3CB371',
  },
  stepTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#3CB371',
  },
  stepSubtitle: {
    fontSize: 17,
    color: '#3CB371',
    marginTop: 3,
    fontStyle: 'italic',
  },
  stepContainer: {
    flexDirection: 'row',
    width: 'auto',
    height: 100,
    backgroundColor: '#e0dee7',
    marginHorizontal: 10,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
  },
  progressWrapper: {
    alignItems: 'flex-end',
  },
  progressText: {
    color: '#3CB371',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  progressBar: {
    width: 100,
    height: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3CB371',
    borderRadius: 5,
  },
  heartRateIcon: {
    marginRight: 15,
    color: '#ed1b24',
  },
  heartRateTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ed1b24',
  },
  heartRateSubtitle: {
    fontSize: 17,
    color: '#ed1b24',
    marginTop: 3,
    fontStyle: 'italic',
  },
  heartRateContainer: {
    flexDirection: 'row',
    width: 'auto',
    height: 100,
    backgroundColor: '#e0dee7',
    marginHorizontal: 10,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
  },
  heartRateProgressWrapper: {
    alignItems: 'flex-end',
  },
  heartRateProgressText: {
    color: '#ed1b24',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  heartRateProgressBar: {
    width: 100,
    height: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  heartRateProgressFill: {
    height: '100%',
    backgroundColor: '#ed1b24',
    borderRadius: 5,
  },
  bloodPressureIcon: {
    marginRight: 15,
    color: '#2577f7',
  },
  bloodPressureTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2577f7',
  },
  bloodPressureSubtitle: {
    fontSize: 17,
    color: '#2577f7',
    marginTop: 3,
    fontStyle: 'italic',
  },
  bloodPressureContainer: {
    flexDirection: 'row',
    width: 'auto',
    height: 100,
    backgroundColor: '#e0dee7',
    marginHorizontal: 10,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
  },
  bloodPressureProgressWrapper: {
    alignItems: 'center',
  },
  bloodPressureProgressText: {
    color: '#2577f7',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  bloodPressureProgressBar: {
    width: 100,
    height: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  bloodPressureProgressFill: {
    height: '100%',
    backgroundColor: '#2577f7',
    borderRadius: 5,
  },
});

export default HealthProfileScreen;