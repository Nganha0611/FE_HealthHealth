import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Dimensions, StyleSheet, Text, TouchableOpacity, ScrollView, FlatList, Platform } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import { API_BASE_URL } from '../../../utils/config';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../../contexts/NotificationContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  initialize,
  getSdkStatus,
  requestPermission,
  readRecords,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

type ViewMode = 'monthly' | 'daily' | 'weekly';

interface BloodPressureData {
  systolic: number;
  diastolic: number;
  createdAt: string;
}

interface User {
  id: string;
  url?: string;
}

type Props = {
  navigation: NavigationProp<any>;
};

const BloodPressureScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [
      { data: [], color: () => '#36A2EB', strokeWidth: 2 },
      { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
    ],
    legend: [t('systolic'), t('diastolic')],
  });
  const [averageBloodPressure, setAverageBloodPressure] = useState<{
    systolic: number | null;
    diastolic: number | null;
  }>({ systolic: null, diastolic: null });
  const [loading, setLoading] = useState<boolean>(true);
  const [allBloodPressureData, setAllBloodPressureData] = useState<BloodPressureData[]>([]);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filteredHistory, setFilteredHistory] = useState<BloodPressureData[]>([]);
  const [displayLimit, setDisplayLimit] = useState<number>(20);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        setLoading(true);
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user: User = JSON.parse(userData);
          fetchBloodPressureData(user.id);
        } else {
          showNotification(t('noUserInfo'), 'error');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        showNotification(t('fetchUserError'), 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, []);

  const fetchBloodPressureData = async (userId: string) => {
    try {
      console.log(`Fetching blood pressure data for userId: ${userId}`);
      const token = await AsyncStorage.getItem('token');
      console.log('Token:', token ? 'Found' : 'Not found');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const response = await axios.get(`${API_BASE_URL}/api/blood-pressures/user/${userId}`, {
        ...config,
        timeout: 5000,
      });
      console.log('API response status:', response.status);
      console.log('API response data:', response.data);

      const data = response.data;

      if (!data || data.length === 0) {
        console.log('No blood pressure data returned from API');
        setChartData({
          labels: [],
          datasets: [
            { data: [], color: () => '#36A2EB', strokeWidth: 2 },
            { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
          ],
          legend: [t('systolic'), t('diastolic')],
        });
        setAverageBloodPressure({ systolic: null, diastolic: null });
        setFilteredHistory([]);
        return;
      }

      interface RawBloodPressureData {
        systolic?: number;
        systolicPressure?: number;
        sys?: number;
        diastolic?: number;
        diastolicPressure?: number;
        dia?: number;
        createdAt?: string;
        date?: string;
        timestamp?: string;
      }

      const normalizedData: BloodPressureData[] = data.map((item: RawBloodPressureData) => ({
        systolic: item.systolic ?? item.systolicPressure ?? item.sys ?? 0,
        diastolic: item.diastolic ?? item.diastolicPressure ?? item.dia ?? 0,
        createdAt: item.createdAt ?? item.date ?? item.timestamp ?? '',
      }));

      console.log('Normalized data:', normalizedData);

      const validData = normalizedData.filter(
        (item) =>
          typeof item.systolic === 'number' &&
          typeof item.diastolic === 'number' &&
          !isNaN(item.systolic) &&
          !isNaN(item.diastolic) &&
          item.systolic !== Infinity &&
          item.diastolic !== Infinity &&
          item.systolic !== -Infinity &&
          item.diastolic !== -Infinity &&
          typeof item.createdAt === 'string' &&
          item.createdAt
      );

      console.log('Valid data after filtering:', validData);
      if (validData.length === 0) {
        console.log('No valid blood pressure data after filtering. Invalid items:', normalizedData);
        setChartData({
          labels: [],
          datasets: [
            { data: [], color: () => '#36A2EB', strokeWidth: 2 },
            { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
          ],
          legend: [t('systolic'), t('diastolic')],
        });
        setAverageBloodPressure({ systolic: null, diastolic: null });
        setFilteredHistory([]);
        showNotification(t('invalidBloodPressureData'), 'error');
        return;
      }

      const sorted = validData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllBloodPressureData(sorted);
      setFilteredHistory(sorted);
      processBloodPressureData(sorted);
    } catch (error: any) {
      console.error('Error fetching blood pressure data:', error.message);
      if (error.code === 'ECONNABORTED') {
        console.log('Server timeout or unavailable');
      }
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
        if (error.response.status === 401) {
          showNotification(t('unauthorized'), 'error');
        } else if (error.response.status === 403) {
          showNotification(t('forbidden'), 'error');
        } else if (error.response.status === 204) {
          setChartData({
            labels: [],
            datasets: [
              { data: [], color: () => '#36A2EB', strokeWidth: 2 },
              { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
            ],
            legend: [t('systolic'), t('diastolic')],
          });
          setAverageBloodPressure({ systolic: null, diastolic: null });
          setFilteredHistory([]);
          return;
        }
      }
      showNotification(t('fetchBloodPressureError'), 'error');
      setChartData({
        labels: [],
        datasets: [
          { data: [], color: () => '#36A2EB', strokeWidth: 2 },
          { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
        ],
        legend: [t('systolic'), t('diastolic')],
      });
      setAverageBloodPressure({ systolic: null, diastolic: null });
      setFilteredHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeHealthConnect = async () => {
    try {
      const result = await initialize();
      console.log('Health Connect initialization result:', result);
      const status = await getSdkStatus();
      console.log('Health Connect status:', status);
      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
        return true;
      } else {
        showNotification(
          status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
            ? t('healthConnectUpdateRequired')
            : t('healthConnectNotAvailable'),
          'error'
        );
        return false;
      }
    } catch (err) {
      console.error('Error initializing Health Connect:', err);
      showNotification(t('healthConnectInitError') + (err as Error).message, 'error');
      return false;
    }
  };

  const requestHealthPermissions = async () => {
    try {
      const permissions = await requestPermission([{ accessType: 'read', recordType: 'BloodPressure' }]);
      console.log('Granted permissions:', permissions);
      if (permissions.length === 0) {
        throw new Error('No permissions granted for BloodPressure');
      }
      return true;
    } catch (err) {
      console.error('Error requesting permissions:', err);
      showNotification(t('healthConnectPermissionError') + (err as Error).message, 'error');
      return false;
    }
  };

  const readBloodPressureData = async () => {
    try {
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - 7);

      const response = await readRecords('BloodPressure', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });
      console.log('Health Connect blood pressure records:', JSON.stringify(response, null, 2));
      if (!response.records || response.records.length === 0) {
        console.warn('No blood pressure records found in Health Connect');
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
      console.error('Error reading blood pressure data from Health Connect:', err);
      showNotification(t('healthConnectFetchError') + (err as Error).message, 'error');
      return [];
    }
  };

  const normalizeTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toISOString().split('.')[0] + 'Z';
  };

  const syncBloodPressureFromHealthConnect = async () => {
    setLoading(true);
    try {
      const isInitialized = await initializeHealthConnect();
      if (!isInitialized) {
        setLoading(false);
        return;
      }
      const granted = await requestHealthPermissions();
      if (!granted) {
        showNotification(t('healthConnectPermissionError'), 'error');
        setLoading(false);
        return;
      }

      const healthConnectData = await readBloodPressureData();
      if (healthConnectData.length === 0) {
        setLoading(false);
        return;
      }

      const normalizedDbData = allBloodPressureData.map((item) => ({
        ...item,
        createdAt: normalizeTimestamp(item.createdAt),
      }));

      const normalizedHealthConnectData = healthConnectData.map((item) => ({
        ...item,
        createdAt: normalizeTimestamp(item.createdAt),
      }));

      const newData = normalizedHealthConnectData.filter((hcItem) => {
        return !normalizedDbData.some((dbItem) => dbItem.createdAt === hcItem.createdAt);
      });

      console.log('New blood pressure data to sync:', newData);
      if (newData.length === 0) {
        setLoading(false);
        return;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('unauthorized'), 'error');
        setLoading(false);
        return;
      }

      for (const item of newData) {
        try {
          console.log('Sending blood pressure data:', {
            systolic: item.systolic,
            diastolic: item.diastolic,
            createdAt: item.createdAt,
          });
          const response = await axios.post(
            `${API_BASE_URL}/api/blood-pressures/measure`,
            {
              systolic: item.systolic,
              diastolic: item.diastolic,
              createdAt: item.createdAt,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            }
          );
          console.log(`Blood pressure data synced:`, response.data);
        } catch (error: any) {
          console.error('Error syncing blood pressure data:', error.message);
          if (error.response) {
            console.error('Error response:', error.response.status, error.response.data);
            showNotification(t('syncBloodPressureError'), 'error');
          }
        }
      }

      showNotification(t('syncBloodPressureSuccess'), 'success');

      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user: User = JSON.parse(userData);
        await fetchBloodPressureData(user.id);
      }
    } catch (error) {
      console.error('Error during sync:', error);
      showNotification(t('syncBloodPressureError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const processBloodPressureData = (data: BloodPressureData[]) => {
    console.log('Processing blood pressure data:', data);
    if (!data || data.length === 0) {
      setChartData({
        labels: [],
        datasets: [
          { data: [], color: () => '#36A2EB', strokeWidth: 2 },
          { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
        ],
        legend: [t('systolic'), t('diastolic')],
      });
      setAverageBloodPressure({ systolic: null, diastolic: null });
      setFilteredHistory([]);
      return;
    }

    let filteredData: BloodPressureData[] = [];
    let labels: string[] = [];
    let systolicValues: number[] = [];
    let diastolicValues: number[] = [];

    const referenceDate = selectedDate || new Date();
    if (viewMode === 'daily') {
      filteredData = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return (
          itemDate.getDate() === referenceDate.getDate() &&
          itemDate.getMonth() === referenceDate.getMonth() &&
          itemDate.getFullYear() === referenceDate.getFullYear()
        );
      });

      console.log('Filtered daily data for chart:', filteredData);
      if (filteredData.length === 0) {
        setChartData({
          labels: [],
          datasets: [
            { data: [], color: () => '#36A2EB', strokeWidth: 2 },
            { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
          ],
          legend: [t('systolic'), t('diastolic')],
        });
        setAverageBloodPressure({ systolic: null, diastolic: null });
        showNotification(t('noDailyData'), 'error');
        return;
      }

      const hourlyData: { [hour: string]: { systolic: number[]; diastolic: number[] } } = {};
      filteredData.forEach((item) => {
        const date = new Date(item.createdAt);
        const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`;
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = { systolic: [], diastolic: [] };
        }
        hourlyData[hourKey].systolic.push(item.systolic);
        hourlyData[hourKey].diastolic.push(item.diastolic);
      });

      console.log('Hourly data:', hourlyData);

      labels = Object.keys(hourlyData).sort((a, b) => {
        const hourA = parseInt(a.split(':')[0]);
        const hourB = parseInt(b.split(':')[0]);
        return hourA - hourB;
      });

      systolicValues = labels.map((hourLabel) => {
        const rates = hourlyData[hourLabel].systolic;
        return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
      });

      diastolicValues = labels.map((hourLabel) => {
        const rates = hourlyData[hourLabel].diastolic;
        return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
      });

      console.log('Labels:', labels);
      console.log('Systolic values:', systolicValues);
      console.log('Diastolic values:', diastolicValues);
    } else if (viewMode === 'weekly') {
      const sevenDaysAgo = new Date(referenceDate);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      filteredData = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= sevenDaysAgo;
      });

      if (filteredData.length === 0) {
        setChartData({
          labels: [],
          datasets: [
            { data: [], color: () => '#36A2EB', strokeWidth: 2 },
            { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
          ],
          legend: [t('systolic'), t('diastolic')],
        });
        setAverageBloodPressure({ systolic: null, diastolic: null });
        return;
      }

      const dailyData: { [day: string]: { systolic: number[]; diastolic: number[] } } = {};
      filteredData.forEach((item) => {
        const date = new Date(item.createdAt);
        const dayKey = `${date.getDate()}/${date.getMonth() + 1}`;
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { systolic: [], diastolic: [] };
        }
        dailyData[dayKey].systolic.push(item.systolic);
        dailyData[dayKey].diastolic.push(item.diastolic);
      });

      labels = Object.keys(dailyData).sort((a, b) => {
        const [dayA, monthA] = a.split('/').map(Number);
        const [dayB, monthB] = b.split('/').map(Number);
        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
      });

      systolicValues = labels.map((day) => {
        const rates = dailyData[day].systolic;
        return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
      });
      diastolicValues = labels.map((day) => {
        const rates = dailyData[day].diastolic;
        return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
      });
    } else if (viewMode === 'monthly') {
      const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);

      filteredData = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= startOfMonth;
      });

      if (filteredData.length === 0) {
        setChartData({
          labels: [],
          datasets: [
            { data: [], color: () => '#36A2EB', strokeWidth: 2 },
            { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
          ],
          legend: [t('systolic'), t('diastolic')],
        });
        setAverageBloodPressure({ systolic: null, diastolic: null });
        return;
      }

      const daysInMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
      const weekSize = Math.ceil(daysInMonth / 4);

      const weeklyData: { [week: string]: { systolic: number[]; diastolic: number[] } } = {};
      filteredData.forEach((item) => {
        const date = new Date(item.createdAt);
        const dayOfMonth = date.getDate();
        const weekNumber = Math.floor((dayOfMonth - 1) / weekSize) + 1;
        const weekKey = `${t('week')} ${weekNumber}`;
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { systolic: [], diastolic: [] };
        }
        weeklyData[weekKey].systolic.push(item.systolic);
        weeklyData[weekKey].diastolic.push(item.diastolic);
      });

      labels = Object.keys(weeklyData).sort((a, b) => {
        return parseInt(a.replace(`${t('week')} `, '')) - parseInt(b.replace(`${t('week')} `, ''));
      });
      systolicValues = labels.map((week) => {
        const rates = weeklyData[week].systolic;
        return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
      });
      diastolicValues = labels.map((week) => {
        const rates = weeklyData[week].diastolic;
        return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
      });
    }

    let avgSystolic = null;
    let avgDiastolic = null;
    if (filteredData.length > 0) {
      avgSystolic = Math.round(filteredData.reduce((sum, item) => sum + item.systolic, 0) / filteredData.length);
      avgDiastolic = Math.round(filteredData.reduce((sum, item) => sum + item.diastolic, 0) / filteredData.length);
    }

    if (systolicValues.length > 0 && diastolicValues.length > 0 && labels.length > 0) {
      setChartData({
        labels,
        datasets: [
          { data: systolicValues, color: () => '#36A2EB', strokeWidth: 2 },
          { data: diastolicValues, color: () => '#4BC0C0', strokeWidth: 2 },
        ],
        legend: [t('systolic'), t('diastolic')],
      });
    } else {
      setChartData({
        labels: [],
        datasets: [
          { data: [], color: () => '#36A2EB', strokeWidth: 2 },
          { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
        ],
        legend: [t('systolic'), t('diastolic')],
      });
      showNotification(t('noDataForChart'), 'error');
    }
    setAverageBloodPressure({ systolic: avgSystolic, diastolic: avgDiastolic });
  };

  useEffect(() => {
    if (allBloodPressureData.length > 0) {
      processBloodPressureData(allBloodPressureData);
      filterHistoryByDate(selectedDate);
    }
  }, [viewMode, t, selectedDate]);

  const filterHistoryByDate = (date: Date | null) => {
    console.log('Filtering history by date:', date);
    if (!date) {
      setFilteredHistory(allBloodPressureData);
      return;
    }

    const filtered = allBloodPressureData.filter((item) => {
      const itemDate = new Date(item.createdAt);
      return (
        itemDate.getDate() === date.getDate() &&
        itemDate.getMonth() === date.getMonth() &&
        itemDate.getFullYear() === date.getFullYear()
      );
    });
    setFilteredHistory(filtered);
  };

  const onDateChange = (event: any, selected: Date | undefined) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) {
      setSelectedDate(selected);
    }
  };

  const clearDateSelection = () => {
    setSelectedDate(null);
    setShowDatePicker(false);
  };

  const loadMoreHistory = () => {
    setDisplayLimit((prevLimit) => prevLimit + 20);
  };

  const renderHistoryItem = ({ item }: { item: BloodPressureData }) => {
    const date = new Date(item.createdAt);
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes()
      .toString()
      .padStart(2, '0')}`;

    return (
      <View style={styles.historyItem}>
        <Text style={styles.historyDate}>{formattedDate}</Text>
        <Text style={styles.historyTime}>{formattedTime}</Text>
        <Text style={styles.historyBloodPressure}>{`${item.systolic}/${item.diastolic} ${t('mmHg')}`}</Text>
      </View>
    );
  };

  const getChartTitle = () => {
    switch (viewMode) {
      case 'monthly':
        return t('chartTitle.monthly');
      case 'daily':
        return t('chartTitle.daily');
      case 'weekly':
        return t('chartTitle.weekly');
      default:
        return t('chartTitle.default');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      nestedScrollEnabled={true}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesome5Icon
            name="chevron-left"
            size={20}
            color="#432c81"
            style={{ marginRight: 15, marginTop: 17 }}
            onPress={() => navigation.goBack()}
          />
          <Text style={[styles.text1, { fontSize: 30, marginTop: 5 }]}>{t('bloodPressure')}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={syncBloodPressureFromHealthConnect}>
            <FontAwesome5Icon name="sync" size={24} color="#432c81" style={{ padding: 10 }} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.title}>{t('bloodPressureChart')}</Text>
      <Text style={styles.subtitle}>{getChartTitle()}</Text>

      {loading ? (
        <Text style={styles.loadingText}>{t('loading_message')}</Text>
      ) : chartData.datasets[0].data.length > 0 ? (
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 20}
            height={180} // Thu nhỏ chiều cao biểu đồ
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '6', strokeWidth: '2' },
              propsForLabels: { fontSize: 10 },
            }}
            bezier
            style={styles.chart}
            yAxisSuffix=""
            withDots={true}
            fromZero={true}
            segments={5}
          />
        </View>
      ) : (
        <Text style={styles.noDataText}>{t('noData')}</Text>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, viewMode === 'daily' && styles.selectedButton]}
          onPress={() => setViewMode('daily')}
        >
          <Text style={[styles.buttonText, viewMode === 'daily' && styles.selectedButtonText]}>{t('hour')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, viewMode === 'weekly' && styles.selectedButton]}
          onPress={() => setViewMode('weekly')}
        >
          <Text style={[styles.buttonText, viewMode === 'weekly' && styles.selectedButtonText]}>{t('day')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, viewMode === 'monthly' && styles.selectedButton]}
          onPress={() => setViewMode('monthly')}
        >
          <Text style={[styles.buttonText, viewMode === 'monthly' && styles.selectedButtonText]}>{t('week')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>{t('averageBloodPressure')}</Text>
          <Text style={[styles.infoValue, { color: '#36A2EB' }]}>
            {averageBloodPressure.systolic !== null && averageBloodPressure.diastolic !== null
              ? `${averageBloodPressure.systolic}/${averageBloodPressure.diastolic} ${t('mmHg')}`
              : `--/-- ${t('mmHg')}`}
          </Text>
        </View>
      </View>

      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>{t('bloodPressureHistory')}</Text>
          <View style={styles.datePickerContainer}>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.datePickerButtonText}>
                {selectedDate
                  ? `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`
                  : t('selectDate')}
              </Text>
              <FontAwesome5Icon name="calendar-alt" size={20} color="#432c81" />
            </TouchableOpacity>
            {selectedDate && (
              <TouchableOpacity style={styles.clearDateButton} onPress={clearDateSelection}>
                <FontAwesome5Icon name="times" size={20} color="#432c81" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {filteredHistory.length > 0 ? (
          <>
            <FlatList
              data={filteredHistory.slice(0, displayLimit)}
              renderItem={renderHistoryItem}
              keyExtractor={(item, index) => `${item.createdAt}-${index}`}
              style={styles.historyList}
              scrollEnabled={false}
              initialNumToRender={10}
              windowSize={5}
              showsVerticalScrollIndicator={false}
            />
            {filteredHistory.length > displayLimit && (
              <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreHistory}>
                <Text style={styles.loadMoreText}>{t('loadMore')}</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Text style={styles.noDataText}>{t('noHistoryData')}</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { padding: 10, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  text1: { fontSize: 25, color: '#432c81', fontWeight: 'bold' },
  headerLeft: { marginLeft: 10, marginTop: 5, flexDirection: 'row', justifyContent: 'flex-start' },
  headerRight: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: { marginVertical: 8, borderRadius: 16 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 20 },
  button: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginHorizontal: 5, backgroundColor: '#f0f0f0' },
  selectedButton: { backgroundColor: '#007AFF' },
  buttonText: { color: '#333', fontWeight: '500' },
  selectedButtonText: { color: '#fff' },
  infoContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  infoItem: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  infoValue: { fontSize: 18, fontWeight: 'bold' },
  loadingText: { fontSize: 16, color: '#666', textAlign: 'center', marginVertical: 20 },
  noDataText: { fontSize: 16, color: '#666', textAlign: 'center', marginVertical: 20 },
  historyContainer: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  datePickerButtonText: {
    marginRight: 8,
    color: '#333',
    fontSize: 14,
  },
  clearDateButton: {
    padding: 8,
    marginLeft: 8,
  },
  historyList: {},
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyDate: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  historyTime: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  historyBloodPressure: {
    fontSize: 14,
    color: '#36A2EB',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  loadMoreButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  loadMoreText: {
    fontSize: 16,
    color: '#432c81',
    fontWeight: '500',
  },
});

export default BloodPressureScreen;