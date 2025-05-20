import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { View, Dimensions, StyleSheet, Text, TouchableOpacity, ScrollView, FlatList, Platform } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
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

type ViewMode = 'monthly' | 'daily' | 'yearly';

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

const StepScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const horizontalScrollRef = useRef<ScrollView>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [averageSteps, setAverageSteps] = useState<number | null>(null);
  const [maxSteps, setMaxSteps] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allStepsData, setAllStepsData] = useState<StepsData[]>([]);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filteredHistory, setFilteredHistory] = useState<StepsData[]>([]);
  const [displayLimit, setDisplayLimit] = useState<number>(20);

  const primaryColor = '#3CB371';
  const darkPrimaryColor = '#2E8B57';

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        setLoading(true);
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user: User = JSON.parse(userData);
          fetchStepsData(user.id);
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

  const fetchStepsData = async (userId: string) => {
    try {
      console.log(`Fetching steps data for userId: ${userId}`);
      const token = await AsyncStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const response = await axios.get(`${API_BASE_URL}/api/steps/user/${userId}`, config);
      console.log('API response status:', response.status);
      console.log('API response data:', response.data);

      const data = response.data;

      if (!data || data.length === 0) {
        console.log('No steps data returned from API');
        setChartData({
          labels: [],
          datasets: [{ data: [] }],
        });
        setAverageSteps(null);
        setMaxSteps(null);
        setFilteredHistory([]);
        return;
      }

      interface RawStepsData {
        steps?: number;
        count?: number;
        createdAt?: string;
        date?: string;
        timestamp?: string;
      }

      const normalizedData: StepsData[] = data.map((item: RawStepsData) => ({
        steps: item.steps ?? item.count ?? 0,
        createdAt: item.createdAt ?? item.date ?? item.timestamp ?? '',
      }));

      const validData = normalizedData.filter(
        (item) =>
          typeof item.steps === 'number' &&
          !isNaN(item.steps) &&
          item.steps !== Infinity &&
          item.steps !== -Infinity &&
          typeof item.createdAt === 'string' &&
          item.createdAt
      );

      if (validData.length === 0) {
        console.log('No valid steps data after filtering. Invalid items:', normalizedData);
        setChartData({
          labels: [],
          datasets: [{ data: [] }],
        });
        setAverageSteps(null);
        setMaxSteps(null);
        setFilteredHistory([]);
        showNotification(t('invalidStepsData'), 'error');
        return;
      }

      // Nhóm dữ liệu theo ngày (bỏ qua giờ)
      const groupedByDay: { [date: string]: number } = {};
      validData.forEach((item) => {
        const date = new Date(item.createdAt);
        const dateKey = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        groupedByDay[dateKey] = (groupedByDay[dateKey] || 0) + item.steps;
      });

      const groupedData: StepsData[] = Object.entries(groupedByDay).map(([date, steps]) => {
        const [day, month, year] = date.split('/').map(Number);
        return {
          steps,
          createdAt: new Date(year, month - 1, day).toISOString(),
        };
      });

      const sorted = groupedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllStepsData(sorted);
      setFilteredHistory(sorted);
      processStepsData(sorted);
    } catch (error: any) {
      console.error('Error fetching steps data:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
        if (error.response.status === 401) {
          showNotification(t('unauthorized'), 'error');
        } else if (error.response.status === 403) {
          showNotification(t('forbidden'), 'error');
        } else if (error.response.status === 204) {
          setChartData({
            labels: [],
            datasets: [{ data: [] }],
          });
          setAverageSteps(null);
          setMaxSteps(null);
          setFilteredHistory([]);
          return;
        }
      }
      showNotification(t('fetchStepsError'), 'error');
      setChartData({
        labels: [],
        datasets: [{ data: [] }],
      });
      setAverageSteps(null);
      setMaxSteps(null);
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
      const permissions = await requestPermission([{ accessType: 'read', recordType: 'Steps' }]);
      console.log('Granted permissions:', permissions);
      if (permissions.length === 0) {
        throw new Error('No permissions granted for Steps');
      }
      return true;
    } catch (err) {
      console.error('Error requesting permissions:', err);
      showNotification(t('healthConnectPermissionError') + (err as Error).message, 'error');
      return false;
    }
  };

  const readStepsData = async () => {
    try {
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - 30); // Lấy dữ liệu 30 ngày gần nhất

      const response = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });
      console.log('Health Connect steps records:', JSON.stringify(response, null, 2));
      if (!response.records || response.records.length === 0) {
        console.warn('No steps records found in Health Connect');
        return [];
      }

      // Tổng hợp dữ liệu theo ngày (bỏ qua giờ)
      const dailySteps: { [date: string]: number } = {};
      response.records.forEach((record) => {
        const recordDate = new Date(record.startTime);
        const dateKey = `${recordDate.getDate()}/${recordDate.getMonth() + 1}/${recordDate.getFullYear()}`;
        dailySteps[dateKey] = (dailySteps[dateKey] || 0) + (record.count || 0);
      });

      const stepsData: StepsData[] = Object.entries(dailySteps).map(([date, steps]) => {
        const [day, month, year] = date.split('/').map(Number);
        return {
          steps,
          createdAt: new Date(year, month - 1, day).toISOString(),
        };
      });

      return stepsData;
    } catch (err) {
      console.error('Error reading steps data from Health Connect:', err);
      showNotification(t('healthConnectFetchError') + (err as Error).message, 'error');
      return [];
    }
  };

  const normalizeTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toISOString().split('.')[0] + 'Z';
  };

  const syncStepsFromHealthConnect = async () => {
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

      const healthConnectData = await readStepsData();
      if (healthConnectData.length === 0) {
        setLoading(false);
        return;
      }

      const normalizedDbData = allStepsData.map((item) => ({
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

      console.log('New steps data to sync:', newData);
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
          console.log('Sending steps data:', { steps: item.steps, createdAt: item.createdAt });
          const response = await axios.post(
            `${API_BASE_URL}/api/steps/measure`,
            { steps: item.steps, createdAt: item.createdAt },
            { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
          );
          console.log(`Steps data synced:`, response.data);
        } catch (error: any) {
          console.error('Error syncing steps data:', error.message);
          if (error.response) {
            console.error('Error response:', error.response.status, error.response.data);
            showNotification(t('syncStepsError'), 'error');
          }
        }
      }

      showNotification(t('syncStepsSuccess'), 'success');

      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user: User = JSON.parse(userData);
        await fetchStepsData(user.id);
      }
    } catch (error) {
      console.error('Error during sync:', error);
      showNotification(t('syncStepsError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const processStepsData = (data: StepsData[]) => {
    console.log('Processing steps data:', data);
    if (!data || data.length === 0) {
      setChartData({
        labels: [],
        datasets: [{ data: [] }],
      });
      setAverageSteps(null);
      setMaxSteps(null);
      setFilteredHistory([]);
      return;
    }

    let filteredData: StepsData[] = [];
    let labels: string[] = [];
    let stepsValues: number[] = [];

    const referenceDate = selectedDate || new Date();
    if (viewMode === 'daily') {
      // Hiển thị 30 ngày gần nhất, cho phép kéo ngang
      const thirtyDaysAgo = new Date(referenceDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      filteredData = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= thirtyDaysAgo;
      });

      if (filteredData.length === 0) {
        setChartData({
          labels: [],
          datasets: [{ data: [] }],
        });
        setAverageSteps(null);
        setMaxSteps(null);
        return;
      }

      labels = filteredData.map((item) => {
        const date = new Date(item.createdAt);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });
      stepsValues = filteredData.map((item) => item.steps);
    } else if (viewMode === 'yearly') {
      // Hiển thị tổng số bước theo 12 tháng trong năm
      const currentYear = referenceDate.getFullYear();
      const monthlySteps: { [month: number]: number } = {};

      filteredData = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return itemDate.getFullYear() === currentYear;
      });

      if (filteredData.length === 0) {
        setChartData({
          labels: [],
          datasets: [{ data: [] }],
        });
        setAverageSteps(null);
        setMaxSteps(null);
        return;
      }

      for (let month = 0; month < 12; month++) {
        const monthKey = month + 1;
        monthlySteps[monthKey] = (monthlySteps[monthKey] || 0) + filteredData
          .filter((item) => new Date(item.createdAt).getMonth() + 1 === monthKey)
          .reduce((sum, item) => sum + item.steps, 0);
      }

      labels = Array.from({ length: 12 }, (_, i) => `${i + 1}/${currentYear.toString().slice(-2)}`);
      stepsValues = Array.from({ length: 12 }, (_, i) => monthlySteps[i + 1] || 0);
    } else if (viewMode === 'monthly') {
      const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);

      filteredData = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= startOfMonth;
      });

      if (filteredData.length === 0) {
        setChartData({
          labels: [],
          datasets: [{ data: [] }],
        });
        setAverageSteps(null);
        setMaxSteps(null);
        return;
      }

      const daysInMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
      const weekSize = Math.ceil(daysInMonth / 4);

      const weeklyData: { [week: string]: number } = {};
      filteredData.forEach((item) => {
        const date = new Date(item.createdAt);
        const dayOfMonth = date.getDate();
        const weekNumber = Math.floor((dayOfMonth - 1) / weekSize) + 1;
        const weekKey = `${t('week')} ${weekNumber}`;
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + item.steps;
      });

      labels = Object.keys(weeklyData).sort((a, b) => {
        return parseInt(a.replace(`${t('week')} `, '')) - parseInt(b.replace(`${t('week')} `, ''));
      });
      stepsValues = labels.map((week) => weeklyData[week]);
    }

    let avgSteps = null;
    let maxStepsValue = null;
    if (filteredData.length > 0) {
      const totalSteps = filteredData.reduce((sum, item) => sum + item.steps, 0);
      avgSteps = Math.round(totalSteps / filteredData.length);
      maxStepsValue = Math.max(...filteredData.map((item) => item.steps));
    }

    if (stepsValues.length > 0 && labels.length > 0) {
      setChartData({
        labels,
        datasets: [{ data: stepsValues }],
      });
    } else {
      setChartData({
        labels: [],
        datasets: [{ data: [] }],
      });
      showNotification(t('noDataForChart'), 'error');
    }
    setAverageSteps(avgSteps);
    setMaxSteps(maxStepsValue);
  };

  useEffect(() => {
    if (allStepsData.length > 0) {
      processStepsData(allStepsData);
      filterHistoryByDate(selectedDate);
    }
  }, [viewMode, t, selectedDate]);

  const filterHistoryByDate = (date: Date | null) => {
    console.log('Filtering history by date:', date);
    if (!date) {
      setFilteredHistory(allStepsData);
      return;
    }

    const filtered = allStepsData.filter((item) => {
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

  const renderHistoryItem = ({ item }: { item: StepsData }) => {
    const date = new Date(item.createdAt);
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

    return (
      <View style={styles.historyItem}>
        <Text style={styles.historyDate}>{formattedDate}</Text>
        <Text style={styles.historySteps}>{`${item.steps} ${t('steps')}`}</Text>
      </View>
    );
  };

  const calculateChartWidth = () => {
    const pointCount = chartData.labels.length;
    return Math.max(pointCount * 40, Dimensions.get('window').width - 40);
  };

  const getChartTitle = () => {
    switch (viewMode) {
      case 'monthly':
        return t('chartTitle.monthly');
      case 'daily':
        return t('chartTitle.daily');
      case 'yearly':
        return t('chartTitle.yearly');
      default:
        return t('chartTitle.default');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} nestedScrollEnabled={true}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesome5Icon
            name="chevron-left"
            size={20}
            color="#432c81"
            style={{ marginRight: 15, marginTop: 17 }}
            onPress={() => navigation.goBack()}
          />
          <Text style={[styles.text1, { fontSize: 30, marginTop: 5 }]}>{t('steps')}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={syncStepsFromHealthConnect}>
            <FontAwesome5Icon name="sync" size={24} color="#432c81" style={{ padding: 10 }} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.title, { color: primaryColor }]}>{t('stepsChart')}</Text>
      <Text style={styles.subtitle}>{getChartTitle()}</Text>

      {loading ? (
        <Text style={styles.loadingText}>{t('loading_message')}</Text>
      ) : chartData.datasets[0].data.length > 0 ? (
        <View style={styles.chartOuterContainer}>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            ref={horizontalScrollRef}
            contentContainerStyle={styles.horizontalScrollContainer}
          >
            <View style={[styles.chartContainer, { width: calculateChartWidth() + 20 }]}>
              <BarChart
                data={chartData}
                width={calculateChartWidth()}
                height={180}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 0.6) => `rgba(60, 179, 113, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16, paddingRight: 10 },
                  barPercentage: 0.5,
                  propsForLabels: { fontSize: 10 },
                }}
                style={styles.chart}
                fromZero
                showValuesOnTopOfBars={true}
                withInnerLines={true}
              />
            </View>
          </ScrollView>
        </View>
      ) : (
        <Text style={styles.noDataText}>{t('noData')}</Text>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, viewMode === 'daily' && styles.selectedButton]}
          onPress={() => setViewMode('daily')}
        >
          <Text style={[styles.buttonText, viewMode === 'daily' && styles.selectedButtonText]}>{t('day')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, viewMode === 'yearly' && styles.selectedButton]}
          onPress={() => setViewMode('yearly')}
        >
          <Text style={[styles.buttonText, viewMode === 'yearly' && styles.selectedButtonText]}>{t('month')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, viewMode === 'monthly' && styles.selectedButton]}
          onPress={() => setViewMode('monthly')}
        >
          <Text style={[styles.buttonText, viewMode === 'monthly' && styles.selectedButtonText]}>{t('year')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>{t('averageSteps')}</Text>
          <Text style={[styles.infoValue, { color: primaryColor }]}>
            {averageSteps !== null ? `${averageSteps} ${t('steps')}` : `-- ${t('steps')}`}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>{t('maxSteps')}</Text>
          <Text style={[styles.infoValue, { color: darkPrimaryColor }]}>
            {maxSteps !== null ? `${maxSteps} ${t('steps')}` : `-- ${t('steps')}`}
          </Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItemFull}>
          <Text style={styles.infoLabel}>{t('dailyGoal')}</Text>
          <Text style={[styles.infoValue, { color: primaryColor }]}>6000 {t('steps')}</Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${averageSteps !== null ? Math.min((averageSteps / 6000) * 100, 100) : 0}%`, backgroundColor: darkPrimaryColor },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {averageSteps !== null ? Math.round((averageSteps / 6000) * 100) : 0}% {t('goalAchieved')}
          </Text>
        </View>
      </View>

      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>{t('stepsHistory')}</Text>
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
  chartOuterContainer: { marginHorizontal: 0 },
  horizontalScrollContainer: {},
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: { marginVertical: 8, borderRadius: 16, paddingRight: 40 },
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
  infoItemFull: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    width: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  infoValue: { fontSize: 18, fontWeight: 'bold' },
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: { height: '100%' },
  progressText: { marginTop: 5, fontSize: 12, color: '#666' },
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
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  datePickerContainer: { flexDirection: 'row', alignItems: 'center' },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  datePickerButtonText: { marginRight: 8, color: '#333', fontSize: 14 },
  clearDateButton: { padding: 8, marginLeft: 8 },
  historyList: {},
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyDate: { fontSize: 14, color: '#333', flex: 1 },
  historySteps: { fontSize: 14, color: '#3CB371', fontWeight: 'bold', flex: 1, textAlign: 'right' },
  loadMoreButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  loadMoreText: { fontSize: 16, color: '#432c81', fontWeight: '500' },
});

export default StepScreen;