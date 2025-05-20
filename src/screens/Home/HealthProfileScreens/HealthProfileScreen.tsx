import { NavigationProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import { API_BASE_URL } from '../../../utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import Loading from '../../../components/Loading';
import CustomModal from '../../../components/CustomModal';
import { BottomTabParamList } from '../../../navigation/BottomTabs';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  initialize,
  getSdkStatus,
  requestPermission,
  readRecords,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

// Định nghĩa interface cho dữ liệu đo lường
interface BloodPressurePayload {
  systolic: number;
  diastolic: number;
  createdAt: string;
}

interface HeartRatePayload {
  heartRate: number;
  createdAt: string;
}

interface StepsPayload {
  steps: number;
  createdAt: string;
}

interface BloodPressureData {
  systolic: number;
  diastolic: number;
  createdAt: string;
}

interface HeartRateData {
  rate: number;
  createdAt: string;
}

interface StepsData {
  steps: number;
  createdAt: string;
}

interface User {
  id: string;
}

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
  const [steps, setSteps] = useState<string | null>(null);
  const [stepsDate, setStepsDate] = useState<string | null>(null);
  const [measurementDate, setMeasurementDate] = useState<Date>(new Date());
  const [measurementTime, setMeasurementTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [heartRate, setHeartRate] = useState<string | null>(null);
  const [heartRateDate, setHeartRateDate] = useState<string | null>(null);
  const [bloodPressureDate, setBloodPressureDate] = useState<string | null>(null);
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string>('');
  const [dataLoaded, setDataLoaded] = useState(false);

  const [allHeartRateData, setAllHeartRateData] = useState<HeartRateData[]>([]);
  const [allBloodPressureData, setAllBloodPressureData] = useState<BloodPressureData[]>([]);
  const [allStepsData, setAllStepsData] = useState<StepsData[]>([]);

  const fetchUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user: User = JSON.parse(userData);
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchLatestHeartRate = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/api/heart-rates/measure/latest`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      if (response.status === 204 || !response.data) {
        setHeartRate('--');
        setHeartRateDate(null);
        return;
      }
      const rate = response.data.rate ?? response.data.heartRate;
      setHeartRate(rate.toString());
      setHeartRateDate(response.data.createdAt);
    } catch (error) {
      setHeartRate('--');
      setHeartRateDate(null);
    }
  };

  const fetchLatestBloodPressure = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/api/blood-pressures/measure/latest`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      if (response.status === 204 || !response.data) {
        setSysValue('--');
        setDiaValue('--');
        setBloodPressureDate(null);
        return;
      }
      setSysValue(response.data.systolic.toString());
      setDiaValue(response.data.diastolic.toString());
      setBloodPressureDate(response.data.createdAt);
    } catch (error) {
      setSysValue('--');
      setDiaValue('--');
      setBloodPressureDate(null);
    }
  };

  const fetchLatestSteps = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/api/steps/measure/latest`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      if (response.status === 204 || !response.data) {
        setSteps('--');
        setStepsDate(null);
        return;
      }
      setSteps(response.data.steps.toString());
      setStepsDate(response.data.createdAt);
    } catch (error) {
      setSteps('--');
      setStepsDate(null);
    }
  };

  const fetchHeartRateData = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      let response = await axios.get(`${API_BASE_URL}/api/heart-rates/user/${userId}`, { ...config, timeout: 5000 });
      let data = response.data;
      if (!data || data.length === 0) {
        response = await axios.get(`${API_BASE_URL}/api/heart-rate/user/${userId}`, { ...config, timeout: 5000 });
        data = response.data;
      }
      if (!data || data.length === 0) {
        setHeartRate('--');
        setHeartRateDate(null);
        setAllHeartRateData([]);
        return;
      }
      const normalizedData: HeartRateData[] = data.map((item: any) => ({
        rate: item.rate ?? item.heartRate ?? item.value,
        createdAt: item.createdAt ?? item.date ?? item.timestamp,
      }));
      const validData = normalizedData.filter((item) => typeof item.rate === 'number' && !isNaN(item.rate) && item.createdAt);
      const sorted = validData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllHeartRateData(sorted);
      if (sorted.length > 0) {
        setHeartRate(sorted[0].rate.toString());
        setHeartRateDate(sorted[0].createdAt);
      } else {
        setHeartRate('--');
        setHeartRateDate(null);
      }
    } catch (error) {
      setHeartRate('--');
      setHeartRateDate(null);
      setAllHeartRateData([]);
    }
  };

  const fetchBloodPressureData = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API_BASE_URL}/api/blood-pressures/user/${userId}`, { ...config, timeout: 5000 });
      const data = response.data;
      if (!data || data.length === 0) {
        setSysValue('--');
        setDiaValue('--');
        setBloodPressureDate(null);
        setAllBloodPressureData([]);
        return;
      }
      const normalizedData: BloodPressureData[] = data.map((item: any) => ({
        systolic: item.systolic ?? item.systolicPressure ?? item.sys ?? 0,
        diastolic: item.diastolic ?? item.diastolicPressure ?? item.dia ?? 0,
        createdAt: item.createdAt ?? item.date ?? item.timestamp ?? '',
      }));
      const validData = normalizedData.filter((item) => typeof item.systolic === 'number' && typeof item.diastolic === 'number' && item.createdAt);
      const sorted = validData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllBloodPressureData(sorted);
      if (sorted.length > 0) {
        setSysValue(sorted[0].systolic.toString());
        setDiaValue(sorted[0].diastolic.toString());
        setBloodPressureDate(sorted[0].createdAt);
      } else {
        setSysValue('--');
        setDiaValue('--');
        setBloodPressureDate(null);
      }
    } catch (error) {
      setSysValue('--');
      setDiaValue('--');
      setBloodPressureDate(null);
      setAllBloodPressureData([]);
    }
  };

  const fetchStepsData = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API_BASE_URL}/api/steps/user/${userId}`, { ...config, timeout: 5000 });
      const data = response.data;
      if (!data || data.length === 0) {
        setSteps('--');
        setStepsDate(null);
        setAllStepsData([]);
        return;
      }
      const normalizedData: StepsData[] = data.map((item: any) => ({
        steps: item.steps ?? item.count ?? 0,
        createdAt: item.createdAt ?? item.date ?? item.timestamp ?? '',
      }));
      const validData = normalizedData.filter((item) => typeof item.steps === 'number' && !isNaN(item.steps) && item.createdAt);
      const sorted = validData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllStepsData(sorted);
      if (sorted.length > 0) {
        setSteps(sorted[0].steps.toString());
        setStepsDate(sorted[0].createdAt);
      } else {
        setSteps('--');
        setStepsDate(null);
      }
    } catch (error) {
      setSteps('--');
      setStepsDate(null);
      setAllStepsData([]);
    }
  };

  const initializeHealthConnect = async () => {
    try {
      const result = await initialize();
      const status = await getSdkStatus();
      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  };

  const requestHealthPermissions = async (recordType: 'HeartRate' | 'BloodPressure' | 'Steps') => {
    try {
      const permissions = await requestPermission([{ accessType: 'read', recordType }]);
      return permissions.length > 0;
    } catch (err) {
      return false;
    }
  };

  const readHeartRateData = async () => {
    try {
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - 7);
      const response = await readRecords('HeartRate', {
        timeRangeFilter: { operator: 'between', startTime: startTime.toISOString(), endTime: endTime.toISOString() },
      });
      if (!response.records || response.records.length === 0) {
        return [];
      }
      const heartRateData: HeartRateData[] = response.records
        .filter((record) => record.samples && record.samples.length > 0 && record.startTime)
        .map((record) => ({
          rate: record.samples[0]?.beatsPerMinute ?? 0,
          createdAt: record.startTime ?? '',
        }));
      return heartRateData;
    } catch (err) {
      return [];
    }
  };

  const readBloodPressureData = async () => {
    try {
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - 7);
      const response = await readRecords('BloodPressure', {
        timeRangeFilter: { operator: 'between', startTime: startTime.toISOString(), endTime: endTime.toISOString() },
      });
      if (!response.records || response.records.length === 0) {
        return [];
      }
      const bloodPressureData: BloodPressureData[] = response.records
        .filter((record) => record.systolic && record.diastolic && record.time)
        .map((record) => ({
          systolic: record.systolic?.inMillimetersOfMercury ?? 0,
          diastolic: record.diastolic?.inMillimetersOfMercury ?? 0,
          createdAt: record.time ?? '',
        }));
      return bloodPressureData;
    } catch (err) {
      return [];
    }
  };

  const readStepsData = async () => {
    try {
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - 30);
      const response = await readRecords('Steps', {
        timeRangeFilter: { operator: 'between', startTime: startTime.toISOString(), endTime: endTime.toISOString() },
      });
      if (!response.records || response.records.length === 0) {
        return [];
      }
      const dailySteps: { [date: string]: number } = {};
      response.records.forEach((record) => {
        const recordDate = new Date(record.startTime).toDateString();
        dailySteps[recordDate] = (dailySteps[recordDate] || 0) + (record.count || 0);
      });
      const stepsData: StepsData[] = Object.entries(dailySteps).map(([date, steps]) => ({
        steps,
        createdAt: new Date(date).toISOString(),
      }));
      return stepsData;
    } catch (err) {
      return [];
    }
  };

  const getDateKey = (timestamp: string) => {
    return new Date(timestamp).toDateString();
  };

  const syncHeartRateFromHealthConnect = async () => {
    const isInitialized = await initializeHealthConnect();
    if (!isInitialized) return;
    const granted = await requestHealthPermissions('HeartRate');
    if (!granted) return;
    const healthConnectData = await readHeartRateData();
    if (healthConnectData.length === 0) return;

    const dbDataByDate: { [date: string]: HeartRateData } = {};
    allHeartRateData.forEach((item) => {
      const dateKey = getDateKey(item.createdAt);
      dbDataByDate[dateKey] = item;
    });

    const healthConnectDataByDate: { [date: string]: HeartRateData } = {};
    healthConnectData.forEach((item) => {
      const dateKey = getDateKey(item.createdAt);
      healthConnectDataByDate[dateKey] = {
        rate: item.rate,
        createdAt: item.createdAt,
      };
    });

    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    for (const [dateKey, hcItem] of Object.entries(healthConnectDataByDate)) {
      const dbItem = dbDataByDate[dateKey];
      if (dbItem) {
        try {
          console.log(`Updating heart rate for ${dateKey}: ${hcItem.rate}`);
          await axios.put(
            `${API_BASE_URL}/api/heart-rates/measure/update-by-date`,
            { date: hcItem.createdAt, heartRate: hcItem.rate },
            { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
          );
        } catch (error) {
          console.error(`Error updating heart rate for ${dateKey}:`, error);
        }
      } else {
        try {
          console.log(`Adding new heart rate for ${dateKey}: ${hcItem.rate}`);
          await axios.post(
            `${API_BASE_URL}/api/heart-rates/measure`,
            { heartRate: hcItem.rate, createdAt: hcItem.createdAt },
            { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
          );
        } catch (error) {
          console.error(`Error adding heart rate for ${dateKey}:`, error);
        }
      }
    }

    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user: User = JSON.parse(userData);
      await fetchHeartRateData(user.id);
    }
  };

  const syncBloodPressureFromHealthConnect = async () => {
    const isInitialized = await initializeHealthConnect();
    if (!isInitialized) return;
    const granted = await requestHealthPermissions('BloodPressure');
    if (!granted) return;
    const healthConnectData = await readBloodPressureData();
    if (healthConnectData.length === 0) return;

    const dbDataByDate: { [date: string]: BloodPressureData } = {};
    allBloodPressureData.forEach((item) => {
      const dateKey = getDateKey(item.createdAt);
      dbDataByDate[dateKey] = item;
    });

    const healthConnectDataByDate: { [date: string]: BloodPressureData } = {};
    healthConnectData.forEach((item) => {
      const dateKey = getDateKey(item.createdAt);
      healthConnectDataByDate[dateKey] = {
        systolic: item.systolic,
        diastolic: item.diastolic,
        createdAt: item.createdAt,
      };
    });

    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    for (const [dateKey, hcItem] of Object.entries(healthConnectDataByDate)) {
      const dbItem = dbDataByDate[dateKey];
      if (dbItem) {
        try {
          console.log(`Updating blood pressure for ${dateKey}: ${hcItem.systolic}/${hcItem.diastolic}`);
          await axios.put(
            `${API_BASE_URL}/api/blood-pressures/measure/update-by-date`,
            { date: hcItem.createdAt, systolic: hcItem.systolic, diastolic: hcItem.diastolic },
            { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
          );
        } catch (error) {
          console.error(`Error updating blood pressure for ${dateKey}:`, error);
        }
      } else {
        try {
          console.log(`Adding new blood pressure for ${dateKey}: ${hcItem.systolic}/${hcItem.diastolic}`);
          await axios.post(
            `${API_BASE_URL}/api/blood-pressures/measure`,
            { systolic: hcItem.systolic, diastolic: hcItem.diastolic, createdAt: hcItem.createdAt },
            { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
          );
        } catch (error) {
          console.error(`Error adding blood pressure for ${dateKey}:`, error);
        }
      }
    }

    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user: User = JSON.parse(userData);
      await fetchBloodPressureData(user.id);
    }
  };

  const syncStepsFromHealthConnect = async () => {
    const isInitialized = await initializeHealthConnect();
    if (!isInitialized) return;
    const granted = await requestHealthPermissions('Steps');
    if (!granted) return;
    const healthConnectData = await readStepsData();
    if (healthConnectData.length === 0) return;

    const dbDataByDate: { [date: string]: StepsData } = {};
    allStepsData.forEach((item) => {
      const dateKey = getDateKey(item.createdAt);
      dbDataByDate[dateKey] = item;
    });

    const healthConnectDataByDate: { [date: string]: StepsData } = {};
    healthConnectData.forEach((item) => {
      const dateKey = getDateKey(item.createdAt);
      healthConnectDataByDate[dateKey] = {
        steps: item.steps,
        createdAt: item.createdAt,
      };
    });

    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    for (const [dateKey, hcItem] of Object.entries(healthConnectDataByDate)) {
      const dbItem = dbDataByDate[dateKey];
      if (dbItem) {
        try {
          console.log(`Updating steps for ${dateKey}: ${hcItem.steps}`);
          await axios.put(
            `${API_BASE_URL}/api/steps/measure/update-by-date`,
            { date: hcItem.createdAt, steps: hcItem.steps },
            { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
          );
        } catch (error) {
          console.error(`Error updating steps for ${dateKey}:`, error);
        }
      } else {
        try {
          console.log(`Adding new steps for ${dateKey}: ${hcItem.steps}`);
          await axios.post(
            `${API_BASE_URL}/api/steps/measure`,
            { steps: hcItem.steps, createdAt: hcItem.createdAt },
            { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
          );
        } catch (error) {
          console.error(`Error adding steps for ${dateKey}:`, error);
        }
      }
    }

    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user: User = JSON.parse(userData);
      await fetchStepsData(user.id);
    }
  };

  const handleReload = async () => {
    setLoading(true);
    try {
      const lastSyncTime = await AsyncStorage.getItem('lastSyncTime');
      const now = new Date().getTime();
      const oneHour = 60 * 60 * 1000; // 1 giờ

      if (!lastSyncTime || (now - parseInt(lastSyncTime) > oneHour)) {
        await Promise.all([
          fetchUser(),
          fetchLatestHeartRate(),
          fetchLatestBloodPressure(),
          fetchLatestSteps(),
          syncHeartRateFromHealthConnect(),
          syncBloodPressureFromHealthConnect(),
          syncStepsFromHealthConnect(),
        ]);
        await AsyncStorage.setItem('lastSyncTime', now.toString());
      } else {
        await Promise.all([
          fetchUser(),
          fetchLatestHeartRate(),
          fetchLatestBloodPressure(),
          fetchLatestSteps(),
        ]);
      }
    } catch (error) {
      setHeartRate('--');
      setHeartRateDate(null);
      setSysValue('--');
      setDiaValue('--');
      setBloodPressureDate(null);
      setSteps('--');
      setStepsDate(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      if (dataLoaded) return; // Skip if data is already loaded
      setLoading(true);
      try {
        await Promise.all([
          fetchUser(),
          fetchLatestHeartRate(),
          fetchLatestBloodPressure(),
          fetchLatestSteps(),
        ]);
        setDataLoaded(true); // Mark data as loaded
      } catch (error) {
        setHeartRate('--');
        setHeartRateDate(null);
        setSysValue('--');
        setDiaValue('--');
        setBloodPressureDate(null);
        setSteps('--');
        setStepsDate(null);
      } finally {
        setLoading(false); // Always reset loading state
      }
    };
    fetchAll();
  }, [dataLoaded]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchAll = async () => {
        if (!isActive || dataLoaded) return; // Skip if data is already loaded or screen is not active
        setLoading(true);
        try {
          await Promise.all([
            fetchUser(),
            fetchLatestHeartRate(),
            fetchLatestBloodPressure(),
            fetchLatestSteps(),
          ]);
          setDataLoaded(true); // Mark data as loaded
        } catch (error) {
          if (isActive) {
            setHeartRate('--');
            setHeartRateDate(null);
            setSysValue('--');
            setDiaValue('--');
            setBloodPressureDate(null);
            setSteps('--');
            setStepsDate(null);
          }
        } finally {
          if (isActive) setLoading(false); // Always reset loading state
        }
      };

      fetchAll();

      return () => {
        isActive = false; // Cleanup to prevent state updates after navigation
      };
    }, [dataLoaded])
  );

  const combineDateTime = (date: Date, time: Date): string => {
    const combined = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds()
    );
    return combined.toISOString();
  };

  const handleMeasureBloodPressure = async () => {
    if (!sysValue || !diaValue || isNaN(parseInt(sysValue)) || isNaN(parseInt(diaValue))) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const payload: BloodPressurePayload = {
        systolic: parseInt(sysValue),
        diastolic: parseInt(diaValue),
        createdAt: combineDateTime(measurementDate, measurementTime),
      };
      await axios.post(`${API_BASE_URL}/api/blood-pressures/measure`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      setSysValue('');
      setDiaValue('');
      fetchLatestBloodPressure();
    } catch (error) { } finally {
      setLoading(false);
    }
  };

  const handleMeasureHeartRate = async () => {
    const rateValue = parseInt(inputValue);
    if (!inputValue.trim() || isNaN(rateValue) || rateValue <= 0 || rateValue > 300) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const payload: HeartRatePayload = {
        heartRate: rateValue,
        createdAt: combineDateTime(measurementDate, measurementTime),
      };
      const response = await axios.post(`${API_BASE_URL}/api/heart-rates/measure`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      setHeartRate(response.data?.heartRate.toString() ?? rateValue.toString());
      setHeartRateDate(response.data?.createdAt ?? new Date().toISOString());
      setInputValue('');
      await fetchLatestHeartRate();
    } catch (error) { } finally {
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
      if (isNaN(date.getTime())) return '-/-';
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '-/-';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getModalContent = () => {
    if (selectedMeasurement === 'blood_pressure') {
      return (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('sysLabel')}:</Text>
            <TextInput
              style={styles.enhancedInput}
              keyboardType="numeric"
              placeholder={t('sysPlaceholder')}
              onChangeText={(text) => setSysValue(text)}
              value={sysValue || ''}
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
              onChangeText={(text) => setDiaValue(text)}
              value={diaValue || ''}
              placeholderTextColor="#999"
            />
            <Text style={styles.inputUnit}>mmHg</Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('measurementDate')} (Required):</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.datePickerText}>{formatDate(measurementDate)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={measurementDate}
                mode="date"
                display="default"
                onChange={(event, selected) => {
                  setShowDatePicker(false);
                  if (selected) setMeasurementDate(selected);
                }}
                maximumDate={new Date()}
              />
            )}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('measurementTime')} (Required):</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.datePickerText}>{formatTime(measurementTime)}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={measurementTime}
                mode="time"
                display="default"
                onChange={(event, selected) => {
                  setShowTimePicker(false);
                  if (selected) setMeasurementTime(selected);
                }}
              />
            )}
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#ccc' }]}
              onPress={() => {
                setModalVisible(false);
                setSysValue(null);
                setDiaValue(null);
                setMeasurementDate(new Date());
                setMeasurementTime(new Date());
              }}
            >
              <Text style={styles.actionButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#3CB371' }]}
              onPress={handleMeasureBloodPressure}
            >
              <Text style={styles.actionButtonText}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    } else if (selectedMeasurement === 'heart_rate') {
      return (
        <>
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
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('measurementDate')} (Required):</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.datePickerText}>{formatDate(measurementDate)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={measurementDate}
                mode="date"
                display="default"
                onChange={(event, selected) => {
                  setShowDatePicker(false);
                  if (selected) setMeasurementDate(selected);
                }}
                maximumDate={new Date()}
              />
            )}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('measurementTime')} (Required):</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.datePickerText}>{formatTime(measurementTime)}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={measurementTime}
                mode="time"
                display="default"
                onChange={(event, selected) => {
                  setShowTimePicker(false);
                  if (selected) setMeasurementTime(selected);
                }}
              />
            )}
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#ccc' }]}
              onPress={() => {
                setModalVisible(false);
                setInputValue('');
                setMeasurementDate(new Date());
                setMeasurementTime(new Date());
              }}
            >
              <Text style={styles.actionButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#3CB371' }]}
              onPress={handleMeasureHeartRate}
            >
              <Text style={styles.actionButtonText}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }
    return null;
  };

  const getTypeSelectModalContent = () => (
    <>
      <Text style={styles.enhancedModalTitle}>{t('measureSelection')}</Text>
      <TouchableOpacity
        style={[styles.enhancedButton, { backgroundColor: '#2577f7', marginBottom: 20 }]}
        onPress={() => {
          setSelectedMeasurement('blood_pressure');
          setTypeSelectModalVisible(false);
          setModalVisible(true);
        }}
      >
        <FontAwesome name="heart" size={28} color="white" style={{ marginRight: 10 }} />
        <Text style={styles.enhancedButtonText}>{t('measureBloodPressure')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.enhancedButton, { backgroundColor: '#ed1b24' }]}
        onPress={() => {
          setSelectedMeasurement('heart_rate');
          setTypeSelectModalVisible(false);
          setModalVisible(true);
        }}
      >
        <FontAwesome name="heartbeat" size={28} color="white" style={{ marginRight: 10 }} />
        <Text style={styles.enhancedButtonText}>{t('measureHeartRate')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.closeButton} onPress={() => setTypeSelectModalVisible(false)}>
        <Text style={styles.closeButtonText}>{t('close')}</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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
          <TouchableOpacity onPress={handleReload}>
            <FontAwesome5 name="sync" size={24} color="#432c81" style={{ padding: 10 }} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.circleContainer}>
        <Svg width={120} height={120} viewBox="0 0 120 120">
          <Circle
            cx="60"
            cy="60"
            r="55"
            stroke="#ed1b24"
            strokeWidth="9"
            fill="none"
            strokeDasharray="345.6"
            strokeDashoffset={heartRate ? `${345.6 - (parseInt(heartRate) / 100) * 345.6}` : '90'}
            strokeLinecap="round"
          />
          <Circle
            cx="60"
            cy="60"
            r="45"
            stroke="#2577f7"
            strokeWidth="9"
            fill="none"
            strokeDasharray="282.6"
            strokeDashoffset={sysValue ? `${282.6 - (parseInt(sysValue) / 140) * 282.6}` : '78'}
            strokeLinecap="round"
          />
          <Circle
            cx="60"
            cy="60"
            r="35"
            stroke="#3CB371"
            strokeWidth="9"
            fill="none"
            strokeDasharray="219.8"
            strokeDashoffset={steps ? `${219.8 - (parseInt(steps) / 10000) * 219.8}` : '50'}
            strokeLinecap="round"
          />
        </Svg>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('measurements')}</Text>
        <View style={styles.measurementContainer}>
          <TouchableOpacity
            style={styles.measurementItem}
            onPress={() => navigation.navigate('HeartRate')}
          >
            <FontAwesome5 name="heartbeat" size={24} color="#ed1b24" />
            <Text style={styles.measurementLabel}>{t('heartRate')}</Text>
            <Text style={styles.measurementValue}>{heartRate ?? '--'} {t('bpm')}</Text>
            <Text style={styles.measurementDate}>{formatDateTime(heartRateDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.measurementItem}
            onPress={() => navigation.navigate('BloodPressure')}
          >
            <FontAwesome5 name="tint" size={24} color="#2577f7" />
            <Text style={styles.measurementLabel}>{t('bloodPressure')}</Text>
            <Text style={styles.measurementValue}>
              {sysValue && diaValue ? `${sysValue}/${diaValue}` : '--'} {t('mmHg')}
            </Text>
            <Text style={styles.measurementDate}>{formatDateTime(bloodPressureDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.measurementItem}
            onPress={() => navigation.navigate('Step')}
          >
            <FontAwesome5 name="walking" size={24} color="#3CB371" />
            <Text style={styles.measurementLabel}>{t('steps')}</Text>
            <Text style={styles.measurementValue}>{steps ?? '--'} {t('stepsUnit')}</Text>
            <Text style={styles.measurementDate}>{formatDateTime(stepsDate)}</Text>
          </TouchableOpacity>
          <View style={[styles.measurementItem, styles.disabledItem]}>
            <FontAwesome5 name="vial" size={24} color="#ccc" />
            <Text style={styles.measurementLabel}>{t('bloodSugar')}</Text>
            <Text style={styles.measurementValue}>--</Text>
            <Text style={styles.measurementDate}>-/-</Text>
            <View style={styles.comingSoonOverlay}>
              <Text style={styles.comingSoonText}>{t('comingSoon')}</Text>
            </View>
          </View>
          <View style={[styles.measurementItem, styles.disabledItem]}>
            <FontAwesome5 name="weight" size={24} color="#ccc" />
            <Text style={styles.measurementLabel}>{t('bmi')}</Text>
            <Text style={styles.measurementValue}>--</Text>
            <Text style={styles.measurementDate}>-/-</Text>
            <View style={styles.comingSoonOverlay}>
              <Text style={styles.comingSoonText}>{t('comingSoon')}</Text>
            </View>
          </View>
          <View style={[styles.measurementItem, styles.disabledItem]}>
            <FontAwesome5 name="heart" size={24} color="#ccc" />
            <Text style={styles.measurementLabel}>{t('cholesterol')}</Text>
            <Text style={styles.measurementValue}>--</Text>
            <Text style={styles.measurementDate}>-/-</Text>
            <View style={styles.comingSoonOverlay}>
              <Text style={styles.comingSoonText}>{t('comingSoon')}</Text>
            </View>
          </View>
        </View>
      </View>

      <CustomModal
        visible={typeSelectModalVisible}
        onClose={() => setTypeSelectModalVisible(false)}
        children={getTypeSelectModalContent()}
      />

      <CustomModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          if (selectedMeasurement === 'blood_pressure') {
            setSysValue(null);
            setDiaValue(null);
          } else if (selectedMeasurement === 'heart_rate') {
            setInputValue('');
          }
          setMeasurementDate(new Date());
          setMeasurementTime(new Date());
        }}
        children={getModalContent()}
      />

      {loading && <Loading message={t('processing')} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { paddingBottom: 20 },
  header: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  text1: { fontSize: 25, color: '#432c81', fontWeight: 'bold' },
  circleContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 20 },
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
  measureContent: { flexDirection: 'row', alignItems: 'center' },
  measureIcon: { marginRight: 15 },
  measureTitle: { fontSize: 18, fontWeight: 'bold', color: '#432c81' },
  measureSubtitle: { fontSize: 14, color: '#666', marginTop: 3 },
  section: { marginTop: 20, marginHorizontal: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  measurementContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  measurementItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledItem: { position: 'relative', opacity: 0.6 },
  comingSoonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  comingSoonText: { color: '#fff', fontSize: 14, fontWeight: 'bold', transform: [{ rotate: '-45deg' }] },
  measurementLabel: { fontSize: 16, color: '#666', marginTop: 5 },
  measurementValue: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 5 },
  measurementDate: { fontSize: 12, color: '#999', marginTop: 5 },
  inputContainer: { width: '100%', marginBottom: 20 },
  inputLabel: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  enhancedInput: { borderWidth: 2, borderColor: '#ccc', borderRadius: 10, width: '100%', padding: 15, fontSize: 22, backgroundColor: '#f9f9f9', color: '#333' },
  inputUnit: { position: 'absolute', right: 15, top: 60, fontSize: 18, color: '#666' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  actionButton: { flex: 1, marginHorizontal: 10, paddingVertical: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  datePickerButton: { borderWidth: 2, borderColor: '#ccc', borderRadius: 10, padding: 15, backgroundColor: '#f9f9f9', justifyContent: 'center', alignItems: 'center' },
  datePickerText: { fontSize: 18, color: '#333' },
  enhancedModalTitle: { fontSize: 26, marginBottom: 25, color: '#432c81', fontWeight: 'bold', textAlign: 'center' },
  enhancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 10,
  },
  enhancedButtonText: { color: 'white', fontWeight: 'bold', fontSize: 22 },
  closeButton: { backgroundColor: '#888', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, marginTop: 20 },
  closeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18, textAlign: 'center' },
});

export default HealthProfileScreen;