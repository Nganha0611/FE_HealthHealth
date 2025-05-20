import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Dimensions, StyleSheet, Text, TouchableOpacity, ScrollView, Image, FlatList, Platform } from 'react-native';
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

interface HeartRateData {
  rate: number;
  createdAt: string;
}

interface User {
  id: string;
  url?: string;
}

type Props = {
  navigation: NavigationProp<any>;
};

const HeartRateScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
    legend: [t('heartRate')],
  });
  const [averageHeartRate, setAverageHeartRate] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allHeartRateData, setAllHeartRateData] = useState<HeartRateData[]>([]);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filteredHistory, setFilteredHistory] = useState<HeartRateData[]>([]);
  const [displayLimit, setDisplayLimit] = useState<number>(20);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        setLoading(true);
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user: User = JSON.parse(userData);
          if (!user.id) {
            throw new Error('User ID is missing');
          }
          setAvatarUrl(user.url || null);
          await fetchHeartRateData(user.id);
        } else {
          showNotification(t('noUserInfo'), 'error');
        }
      } catch (error) {
        showNotification(t('fetchUserError'), 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, []);

  const fetchHeartRateData = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      let response = await axios.get(`${API_BASE_URL}/api/heart-rates/user/${userId}`, {
        ...config,
        timeout: 5000,
      });
  

      let data = response.data;

      if (!data || data.length === 0) {
        response = await axios.get(`${API_BASE_URL}/api/heart-rate/user/${userId}`, {
          ...config,
          timeout: 5000,
        });
   
        data = response.data;
      }

      if (!data || data.length === 0) {
        setChartData({
          labels: [],
          datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
          legend: [t('heartRate')],
        });
        setAverageHeartRate(null);
        setFilteredHistory([]);
        return;
      }

      interface HeartRateApiResponse {
        rate?: number;
        heartRate?: number;
        value?: number;
        createdAt?: string;
        date?: string;
        timestamp?: string;
      }

      const normalizedData: HeartRateData[] = data.map((item: HeartRateApiResponse) => ({
        rate: item.rate ?? item.heartRate ?? item.value,
        createdAt: item.createdAt ?? item.date ?? item.timestamp,
      }));


      const validData = normalizedData.filter(
        (item) =>
          typeof item.rate === 'number' &&
          !isNaN(item.rate) &&
          item.rate !== Infinity &&
          item.rate !== -Infinity &&
          typeof item.createdAt === 'string' &&
          item.createdAt
      );

      if (validData.length === 0) {
        setChartData({
          labels: [],
          datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
          legend: [t('heartRate')],
        });
        setAverageHeartRate(null);
        setFilteredHistory([]);
        showNotification(t('invalidHeartRateData'), 'error');
        return;
      }

      const sorted = validData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllHeartRateData(sorted);
      setFilteredHistory(sorted);
      processHeartRateData(sorted);
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
      }
      if (error.response) {
        if (error.response.status === 401) {
          showNotification(t('unauthorized'), 'error');
        } else if (error.response.status === 403) {
          showNotification(t('forbidden'), 'error');
        } else if (error.response.status === 204) {
          setChartData({
            labels: [],
            datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
            legend: [t('heartRate')],
          });
          setAverageHeartRate(null);
          setFilteredHistory([]);
          return;
        }
      }
      setChartData({
        labels: [],
        datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
        legend: [t('heartRate')],
      });
      setAverageHeartRate(null);
      setFilteredHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeHealthConnect = async () => {
    try {
      const result = await initialize();
      const status = await getSdkStatus();
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
      showNotification(t('healthConnectInitError') + (err as Error).message, 'error');
      return false;
    }
  };

  const requestHealthPermissions = async () => {
    try {
      const permissions = await requestPermission([{ accessType: 'read', recordType: 'HeartRate' }]);
      if (permissions.length === 0) {
        throw new Error('No permissions granted for HeartRate');
      }
      return true;
    } catch (err) {
      showNotification(t('healthConnectPermissionError') + (err as Error).message, 'error');
      return false;
    }
  };

  const readHeartRateData = async () => {
    try {
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - 7);

      const response = await readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });
      if (!response.records || response.records.length === 0) {
        return [];
      }

      const heartRateData: HeartRateData[] = response.records
        .filter((record) => record.samples && record.samples.length > 0 && record.startTime) // Đảm bảo dữ liệu hợp lệ
        .map((record) => ({
          rate: record.samples[0]?.beatsPerMinute ?? 0, // Lấy beatsPerMinute từ samples
          createdAt: record.startTime ?? '', // Sử dụng startTime thay vì time
        }));

      return heartRateData;
    } catch (err) {
      showNotification(t('healthConnectFetchError') + (err as Error).message, 'error');
      return [];
    }
  };

  const normalizeTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toISOString().split('.')[0] + 'Z';
  };

  const syncHeartRateFromHealthConnect = async () => {
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

      const healthConnectData = await readHeartRateData();
      if (healthConnectData.length === 0) {
        setLoading(false);
        return;
      }

      const normalizedDbData = allHeartRateData.map((item) => ({
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
          console.log('Sending heart rate data:', {
            heartRate: item.rate,
            createdAt: item.createdAt,
          });
          const response = await axios.post(
            `${API_BASE_URL}/api/heart-rates/measure`,
            {
              heartRate: item.rate,
              createdAt: item.createdAt,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            }
          );
        } catch (error: any) {
          if (error.response) {
            showNotification(t('syncHeartRateError'), 'error');
          }
        }
      }

      showNotification(t('syncHeartRateSuccess'), 'success');

      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user: User = JSON.parse(userData);
        await fetchHeartRateData(user.id);
      }
    } catch (error) {
      showNotification(t('syncHeartRateError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const processHeartRateData = (data: HeartRateData[]) => {
    if (!data || data.length === 0) {
      setChartData({
        labels: [],
        datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
        legend: [t('heartRate')],
      });
      setAverageHeartRate(null);
      setFilteredHistory([]);
      return;
    }

    let filteredData: HeartRateData[] = [];
    let labels: string[] = [];
    let heartRateValues: number[] = [];

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

      if (filteredData.length === 0) {
        setChartData({
          labels: [],
          datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
          legend: [t('heartRate')],
        });
        setAverageHeartRate(null);
        return;
      }

      const hourlyData: { [hour: string]: number[] } = {};
      filteredData.forEach((item) => {
        const date = new Date(item.createdAt);
        const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`;
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = [];
        }
        hourlyData[hourKey].push(item.rate);
      });


      labels = Object.keys(hourlyData).sort((a, b) => {
        const hourA = parseInt(a.split(':')[0]);
        const hourB = parseInt(b.split(':')[0]);
        return hourA - hourB;
      });

      heartRateValues = labels.map((hourLabel) => {
        const rates = hourlyData[hourLabel];
        return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
      });

  
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
          datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
          legend: [t('heartRate')],
        });
        setAverageHeartRate(null);
        return;
      }

      const dailyData: { [day: string]: number[] } = {};
      filteredData.forEach((item) => {
        const date = new Date(item.createdAt);
        const dayKey = `${date.getDate()}/${date.getMonth() + 1}`;
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = [];
        }
        dailyData[dayKey].push(item.rate);
      });

      labels = Object.keys(dailyData).sort((a, b) => {
        const [dayA, monthA] = a.split('/').map(Number);
        const [dayB, monthB] = b.split('/').map(Number);
        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
      });

      heartRateValues = labels.map((day) => {
        const rates = dailyData[day];
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
          datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
          legend: [t('heartRate')],
        });
        setAverageHeartRate(null);
        return;
      }

      const daysInMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
      const weekSize = Math.ceil(daysInMonth / 4);

      const weeklyData: { [week: string]: number[] } = {};
      filteredData.forEach((item) => {
        const date = new Date(item.createdAt);
        const dayOfMonth = date.getDate();
        const weekNumber = Math.floor((dayOfMonth - 1) / weekSize) + 1;
        const weekKey = `${t('week')} ${weekNumber}`;
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = [];
        }
        weeklyData[weekKey].push(item.rate);
      });

      labels = Object.keys(weeklyData).sort((a, b) => {
        return parseInt(a.replace(`${t('week')} `, '')) - parseInt(b.replace(`${t('week')} `, ''));
      });
      heartRateValues = labels.map((week) => {
        const rates = weeklyData[week];
        return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
      });
    }

    const avgHeartRate =
      filteredData.length > 0
        ? Math.round(filteredData.reduce((sum, item) => sum + item.rate, 0) / filteredData.length)
        : null;

    if (heartRateValues.length > 0 && labels.length > 0) {
      setChartData({
        labels,
        datasets: [{ data: heartRateValues, color: () => '#FF6384', strokeWidth: 2 }],
        legend: [t('heartRate')],
      });
    } else {
      setChartData({
        labels: [],
        datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
        legend: [t('heartRate')],
      });
      showNotification(t('noDataForChart'), 'error');
    }
    setAverageHeartRate(avgHeartRate);
  };

  useEffect(() => {
    if (allHeartRateData.length > 0) {
      processHeartRateData(allHeartRateData);
      filterHistoryByDate(selectedDate);
    }
  }, [viewMode, t, selectedDate]);

  const filterHistoryByDate = (date: Date | null) => {
    if (!date) {
      setFilteredHistory(allHeartRateData);
      return;
    }

    const filtered = allHeartRateData.filter((item) => {
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

  const renderHistoryItem = ({ item }: { item: HeartRateData }) => {
    const date = new Date(item.createdAt);
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes()
      .toString()
      .padStart(2, '0')}`;

    return (
      <View style={styles.historyItem}>
        <Text style={styles.historyDate}>{formattedDate}</Text>
        <Text style={styles.historyTime}>{formattedTime}</Text>
        <Text style={styles.historyHeartRate}>{`${item.rate} ${t('bpm')}`}</Text>
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
          <Text style={[styles.text1, { fontSize: 30, marginTop: 5 }]}>{t('heartRate')}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={syncHeartRateFromHealthConnect}>
            <FontAwesome5Icon
              name="sync"
              size={24}
              color="#432c81"
              style={{ padding: 10 }}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.title}>{t('heartRateChart')}</Text>
      <Text style={styles.subtitle}>{getChartTitle()}</Text>

      {loading ? (
        <Text style={styles.loadingText}>{t('loading')}</Text>
      ) : chartData.datasets[0].data.length > 0 ? (
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 20}
            height={180}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '4', strokeWidth: '2' },
              propsForLabels: {
                fontSize: 10,
              },
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
          <Text style={styles.infoLabel}>{t('averageHeartRate')}</Text>
          <Text style={[styles.infoValue, { color: '#FF6384' }]}>
            {averageHeartRate !== null ? `${averageHeartRate} ${t('bpm')}` : `-- ${t('bpm')}`}
          </Text>
        </View>
      </View>

      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>{t('heartRateHistory')}</Text>
          <View style={styles.datePickerContainer}>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerButtonText}>
                {selectedDate
                  ? `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`
                  : t('selectDate')}
              </Text>
              <FontAwesome5Icon name="calendar-alt" size={20} color="#432c81" />
            </TouchableOpacity>
            {selectedDate && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={clearDateSelection}
              >
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
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={loadMoreHistory}
              >
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
  imgProfile: { width: 45, height: 45, borderRadius: 30 },
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
  historyHeartRate: {
    fontSize: 14,
    color: '#FF6384',
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

export default HeartRateScreen;