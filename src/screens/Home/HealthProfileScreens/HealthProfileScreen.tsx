import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { BottomTabParamList } from '../../../navigation/BottomTabs';
import { Alert, TextInput, Modal, Pressable } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import {API_BASE_URL} from '../../../utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../../contexts/NotificationContext';
import Loading from "../../../components/Loading";

type Props = {
  navigation: NavigationProp<any>;
};

const HealthProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('77');
  const [modalVisible, setModalVisible] = useState(false);
  const [typeSelectModalVisible, setTypeSelectModalVisible] = useState(false);
  const [sysValue, setSysValue] = useState('120');
  const [diaValue, setDiaValue] = useState('60');
  const { t } = useTranslation();
  const steps = 1114;
  const heart_rate = 75;
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const { showNotification } = useNotification();
  const [heartRate, setHeartRate] = useState('77');
  const [loading, setLoading] = useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const handleMeasureBloodPressure = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/blood-pressures/measure`, {
        userId,
        systolic: parseInt(sysValue),
        diastolic: parseInt(diaValue),
      });
      showNotification('Đo huyết áp thành công', 'success');
 
    } catch (error) {
      showNotification('Có lỗi xảy ra vui lòng thử lại', 'error');
      console.error(error);
      setLoading(false);

    }
    setLoading(false);

  };

  const [userId, setUserId] = useState<string>('');
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setUserId(user.id); 
          setAvatarUrl(user.url || null);
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
      }
    };
  
    fetchUser();
  
    const fetchLatestHeartRate = async () => {
      try {
        const token = await AsyncStorage.getItem("token"); // hoặc localStorage nếu dùng React Web
  
        const res = await axios.get(`${API_BASE_URL}/api/heart-rates/measure/latest`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (res.data && res.data.heartRate !== undefined) {
          setHeartRate(res.data.heartRate);
        }
      } catch (err) {
        console.error("Lỗi khi lấy nhịp tim:", err);
      }
    };
  
    const fetchLatestBloodPressure = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
  
        const res = await axios.get(`${API_BASE_URL}/api/blood-pressures/measure/latest`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (res.data) {
          setSysValue(res.data.systolic.toString());  
          setDiaValue(res.data.diastolic.toString());  
        }
      } catch (err) {
        console.error("Lỗi khi lấy huyết áp:", err);
      }
    };
  
    fetchLatestHeartRate();
    fetchLatestBloodPressure();
  }, []);


  const handleMeasurePress = () => {
    setTypeSelectModalVisible(true);
  };

  const handleMeasureHeartRate = async () => {
    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/heart-rates/measure`, {
        userId,
        heartRate: parseInt(inputValue)
      });
      showNotification('Đo nhịp tim thành công', 'success');
      setHeartRate(inputValue);
    } catch (error) {
      setLoading(false);
      showNotification('errorUpdate', 'error');
    }
    setLoading(false);

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
              // source={require('../../assets/ avatar.jpg')}
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
    <View style={styles.textContainer}>
      <View style={styles.row}>
        <Image style={styles.icon} source={require('../../../assets/step.png')} />
        <Text style={[styles.number, { color: '#3CB371' }]}>
          {steps.toLocaleString()} {t('stepsUnit')}
        </Text>
      </View>
    </View>
    <View style={styles.textContainer}>
      <View style={styles.row}>
        <Image style={[styles.icon, { width: 23, height: 23, marginLeft: 3, marginRight: 8 }]} source={require('../../../assets/heart_rate.png')} />
        <Text style={[styles.number, { color: '#ed1b24' }]}>
        {heartRate !== null ? `${heartRate} bpm` : "Đang tải..."} {t('bpm')}
        </Text>
      </View>
    </View>
    <View style={styles.textContainer}>
      <View style={styles.row}>
        <Image style={[styles.icon, { width: 23, height: 23, marginLeft: 3, marginRight: 8 }]} source={require('../../../assets/blood_pressure.png')} />
        <Text style={[styles.number, { color: '#2577f7' }]}>
          {sysValue}/{diaValue} {t('mmHg')}
        </Text>
      </View>
    </View>
  </View>

  <View style={styles.circleContainer}>
    <Svg width={120} height={120} viewBox="0 0 120 120">
      <Circle cx="60" cy="60" r="55" stroke="#3CB371" strokeWidth="9" fill="none" strokeDasharray="345.6" strokeDashoffset="80" strokeLinecap="round" />
      <Circle cx="60" cy="60" r="45" stroke="#ed1b24" strokeWidth="9" fill="none" strokeDasharray="282.6" strokeDashoffset="90" strokeLinecap="round" />
      <Circle cx="60" cy="60" r="35" stroke="#2577f7" strokeWidth="9" fill="none" strokeDasharray="219.2" strokeDashoffset="78" strokeLinecap="round" />
    </Svg>
  </View>
</View>

<TouchableOpacity style={styles.stepContainer} onPress={() => navigation.navigate('Step')}>
  <View style={styles.stepContent}>
    <FontAwesome5 name="shoe-prints" size={26} color="#432c81" style={styles.stepIcon} />
    <View>
      <Text style={styles.stepTitle}>{steps}</Text>
      <Text style={styles.stepSubtitle}>/6000</Text>
    </View>
  </View>
  <View style={styles.progressWrapper}>
    <Text style={styles.progressText}>
      {Math.min(Math.round((steps / 6000) * 100), 100)}%
    </Text>
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${Math.min((steps / 6000) * 100, 100)}%` }]} />
    </View>
  </View>
</TouchableOpacity>

<TouchableOpacity style={styles.heartRateContainer} onPress={() => navigation.navigate('HeartRate')}>
  <View style={styles.stepContent}>
    <FontAwesome5 name="heartbeat" size={26} color="#ed1b24" style={styles.heartRateIcon} />
    <View>
      <Text style={styles.heartRateTitle}>{heartRate !== null ? `${heartRate} bpm` : "Đang tải..."}</Text>
      <Text style={styles.heartRateSubtitle}>/{t('bpm')}</Text>
    </View>
  </View>
  <View style={styles.heartRateProgressWrapper}>
    <Text style={styles.heartRateProgressText}>
      !
    </Text>
    <View style={styles.heartRateProgressBar}>
      <View style={[styles.heartRateProgressFill, { width: `${Math.min((parseInt(heartRate) / 100) * 100, 100)}%` }]} />
    </View>
  </View>
</TouchableOpacity>

<TouchableOpacity style={styles.bloodPressureContainer} onPress={() => navigation.navigate('BloodPressure')}>
  <View style={styles.stepContent}>
    <FontAwesome5 name="heartbeat" size={26} color="#ed1b24" style={styles.bloodPressureIcon} />
    <View>
      <Text style={styles.bloodPressureTitle}>{sysValue}</Text>
      <Text style={styles.bloodPressureSubtitle}>/{diaValue}</Text>
    </View>
  </View>
  <View style={{   }}>
  <View style={styles.bloodPressureProgressWrapper}>
    <Text style={styles.bloodPressureProgressText}>
      SYS
    </Text>
    <View style={styles.bloodPressureProgressBar}>
      <View style={[styles.bloodPressureProgressFill, { width: `${Math.min((parseInt(sysValue) / 140) * 100, 100)}%` }]} />
    </View>
  </View>
  <View style={styles.bloodPressureProgressWrapper}>
    <Text style={styles.bloodPressureProgressText}>
      DIA
    </Text>
    <View style={styles.bloodPressureProgressBar}>
      <View style={[styles.bloodPressureProgressFill, { width: `${Math.min((parseInt(diaValue) / 90) * 100, 100)}%` }]} />
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
          setSelectedMeasurement("blood_pressure");
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
          setSelectedMeasurement("heart_rate");
          setTypeSelectModalVisible(false);
          setModalVisible(true);
        }}
      >
        <FontAwesome name="heartbeat" size={28} color="white" style={{ marginRight: 10 }} />
        <Text style={styles.enhancedButtonText}>{t('measureHeartRate')}</Text>
      </Pressable>

      <Pressable
        style={styles.closeButton}
        onPress={() => setTypeSelectModalVisible(false)}
      >
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
        {selectedMeasurement === "blood_pressure"
          ? t('enterBloodPressure')
          : t('enterHeartRate')}
      </Text>

      {selectedMeasurement === "blood_pressure" ? (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('sysLabel')}:</Text>
            <TextInput
              style={styles.enhancedInput}
              keyboardType="numeric"
              placeholder={t('sysPlaceholder')}
              value={sysValue}
              onChangeText={setSysValue}
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
              value={diaValue}
              onChangeText={setDiaValue}
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
            setSysValue('');
            setDiaValue('');
          }}
        >
          <Text style={styles.actionButtonText}>{t('cancel')}</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, { backgroundColor: '#3CB371' }]}
          onPress={() => {
            if (selectedMeasurement === 'blood_pressure') {
              if (!sysValue || !diaValue) {
                showNotification(t('errorIncompleteInfo'), "error");
                return;
              } else {
                handleMeasureBloodPressure()
              }
            } else {
              if (inputValue === "") {
                showNotification(t('errorIncompleteInfo'), "error");
                return;
              } else {
                handleMeasureHeartRate()
              }
            }
            setModalVisible(false);
            setInputValue('');
          }}
        >
          <Text style={styles.actionButtonText}>{t('save')}</Text>
        </Pressable>
      </View>
    </View>
  </View>
</Modal>
{loading && <Loading message={t("processing")} />}

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
    // shadowColor: "#000",
    // shadowOpacity: 0.1,
    // shadowRadius: 5,
    // elevation: 10,
  },
  // New measurement container that matches the metrics container
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
    // shadowColor: "#000",
    // shadowOpacity: 0.1,
    // shadowRadius: 5,
    // elevation: 10,
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
    fontWeight: "bold",
    fontSize: 25,
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between'
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
    borderRadius: 30
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
    textAlign: 'center'
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
    // shadowColor: "#000",
    // shadowOpacity: 0.1,
    // shadowRadius: 5,
    // elevation: 10,
  },
  progressWrapper: {
    alignItems: 'flex-end', // Căn phải cho thanh tiến độ
  },

  progressText: {
    color: '#3CB371',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500'
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
  heartRateContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
    // shadowColor: "#000",
    // shadowOpacity: 0.1,
    // shadowRadius: 5,
    // elevation: 10,
  },
  heartRateProgressWrapper: {
    alignItems: 'flex-end', // Căn phải cho thanh tiến độ
  },

  heartRateProgressText: {
    color: '#ed1b24',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500'
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
  bloodPressureContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
    // shadowColor: "#000",
    // shadowOpacity: 0.1,
    // shadowRadius: 5,
    // elevation: 10,
  },
  bloodPressureProgressWrapper: {
    alignItems: 'center', 
  },

  bloodPressureProgressText: {
    color: '#2577f7',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500'
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
  }


});

export default HealthProfileScreen;