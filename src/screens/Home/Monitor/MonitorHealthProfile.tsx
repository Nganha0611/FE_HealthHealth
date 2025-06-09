import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  FlatList,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { RouteProp, useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../../../utils/config';
import { useNotification } from '../../../contexts/NotificationContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Login: undefined;
  MonitorHealthProfile: { followedUserId: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'MonitorHealthProfile'>;
type RoutePropType = RouteProp<RootStackParamList, 'MonitorHealthProfile'>;

interface Props {
  navigation: NavigationProp;
}

type ViewMode = 'monthly' | 'daily' | 'weekly';
type TabType = 'heartrate' | 'bloodpressure';

interface HeartRateData {
  id: string;
  userId: string;
  heartRate: number;
  createdAt: string;
}

interface BloodPressureData {
  id: string;
  userId: string;
  systolic: number;
  diastolic: number;
  createdAt: string;
}

interface HealthData {
  heart_rates: HeartRateData[];
  blood_pressures: BloodPressureData[];
}

// Type guard để kiểm tra kiểu HeartRateData
const isHeartRateData = (item: HeartRateData | BloodPressureData): item is HeartRateData => {
  return 'heartRate' in item;
};

const MonitorHealthProfile: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const route = useRoute<RoutePropType>();
  const { followedUserId } = route.params;

  const [activeTab, setActiveTab] = useState<TabType>('heartrate');
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
    legend: [t('heartRate')],
  });
  const [averageData, setAverageData] = useState<{
    heartRate: number | null;
    systolic: number | null;
    diastolic: number | null;
  }>({ heartRate: null, systolic: null, diastolic: null });
  const [loading, setLoading] = useState<boolean>(true);
  const [allHealthData, setAllHealthData] = useState<HealthData>({
    heart_rates: [],
    blood_pressures: [],
  });
  const [filteredHistory, setFilteredHistory] = useState<(HeartRateData | BloodPressureData)[]>([]);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [displayLimit, setDisplayLimit] = useState<number>(20);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      console.log(`Fetching health data for userId: ${followedUserId}`);
      const response = await axios.get(
        `${API_BASE_URL}/api/tracking/permissions/${followedUserId}/health-data`,
        { ...config, timeout: 10000 }
      );
      console.log('API Response:', response.data);

      const data: HealthData = response.data;

      if (!data.heart_rates.length && !data.blood_pressures.length) {
        console.log('No health data available');
        setChartData({
          labels: [],
          datasets: activeTab === 'heartrate'
            ? [{ data: [], color: () => '#FF6384', strokeWidth: 2 }]
            : [
                { data: [], color: () => '#36A2EB', strokeWidth: 2 },
                { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
              ],
          legend: activeTab === 'heartrate' ? [t('heartRate')] : [t('systolic'), t('diastolic')],
        });
        setAverageData({ heartRate: null, systolic: null, diastolic: null });
        setFilteredHistory([]);
        showNotification(t('noDataAvailable'), 'warning');
        return;
      }

      const validHeartRates = data.heart_rates.filter(
        (item) =>
          typeof item.heartRate === 'number' &&
          !isNaN(item.heartRate) &&
          item.heartRate !== Infinity &&
          item.heartRate !== -Infinity &&
          typeof item.createdAt === 'string' &&
          item.createdAt
      );

      const validBloodPressures = data.blood_pressures.filter(
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

      console.log('Valid Heart Rates:', validHeartRates);
      console.log('Valid Blood Pressures:', validBloodPressures);

      if (!validHeartRates.length && !validBloodPressures.length) {
        setChartData({
          labels: [],
          datasets: activeTab === 'heartrate'
            ? [{ data: [], color: () => '#FF6384', strokeWidth: 2 }]
            : [
                { data: [], color: () => '#36A2EB', strokeWidth: 2 },
                { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
              ],
          legend: activeTab === 'heartrate' ? [t('heartRate')] : [t('systolic'), t('diastolic')],
        });
        setAverageData({ heartRate: null, systolic: null, diastolic: null });
        setFilteredHistory([]);
        showNotification(t('invalidHealthData'), 'error');
        return;
      }

      const sortedData: HealthData = {
        heart_rates: validHeartRates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        blood_pressures: validBloodPressures.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      };

      setAllHealthData(sortedData);
      processHealthData(sortedData);
    } catch (error: any) {
      console.error('Error fetching health data:', error.message, error.response?.data);
      if (error.code === 'ECONNABORTED') {
        showNotification(t('requestTimeout'), 'error');
      } else if (error.response) {
        if (error.response.status === 401) {
          showNotification(t('unauthorized'), 'error');
          navigation.navigate('Login');
        } else if (error.response.status === 403) {
          showNotification(t('forbidden'), 'error');
        } else if (error.response.status === 204) {
          setChartData({
            labels: [],
            datasets: activeTab === 'heartrate'
              ? [{ data: [], color: () => '#FF6384', strokeWidth: 2 }]
              : [
                  { data: [], color: () => '#36A2EB', strokeWidth: 2 },
                  { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
                ],
            legend: activeTab === 'heartrate' ? [t('heartRate')] : [t('systolic'), t('diastolic')],
          });
          setAverageData({ heartRate: null, systolic: null, diastolic: null });
          setFilteredHistory([]);
          return;
        } else {
          showNotification(t('fetchHealthDataError'), 'error');
        }
      } else {
        showNotification(t('networkError'), 'error');
      }
      setChartData({
        labels: [],
        datasets: activeTab === 'heartrate'
          ? [{ data: [], color: () => '#FF6384', strokeWidth: 2 }]
          : [
              { data: [], color: () => '#36A2EB', strokeWidth: 2 },
              { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
            ],
        legend: activeTab === 'heartrate' ? [t('heartRate')] : [t('systolic'), t('diastolic')],
      });
      setAverageData({ heartRate: null, systolic: null, diastolic: null });
      setFilteredHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const processHealthData = (data: HealthData) => {
    console.log('Processing health data:', data);
    let labels: string[] = [];
    let datasets: any[] = [];
    let filteredData: HeartRateData[] | BloodPressureData[] = [];

    if (activeTab === 'heartrate') {
      filteredData = selectedDate
        ? data.heart_rates.filter((item) => {
            const itemDate = new Date(item.createdAt);
            return (
              itemDate.getDate() === selectedDate.getDate() &&
              itemDate.getMonth() === selectedDate.getMonth() &&
              itemDate.getFullYear() === selectedDate.getFullYear()
            );
          })
        : data.heart_rates;

      if (viewMode === 'daily') {
        const hourlyData: { [hour: string]: number[] } = {};
        filteredData.forEach((item) => {
          const date = new Date(item.createdAt);
          const hourKey = `${date.getHours().toString().padStart(2, '0')}`;
          if (!hourlyData[hourKey]) hourlyData[hourKey] = [];
          hourlyData[hourKey].push(item.heartRate);
        });

        labels = Object.keys(hourlyData).sort((a, b) => parseInt(a) - parseInt(b));
        const heartRateValues = labels.map((hour) => {
          const rates = hourlyData[hour];
          return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
        });

        datasets = [{ data: heartRateValues, color: () => '#FF6384', strokeWidth: 2 }];
      } else if (viewMode === 'weekly') {
        const dailyData: { [day: string]: number[] } = {};
        filteredData.forEach((item) => {
          const date = new Date(item.createdAt);
          const dayKey = `${date.getDate()}/${date.getMonth() + 1}`;
          if (!dailyData[dayKey]) dailyData[dayKey] = [];
          dailyData[dayKey].push(item.heartRate);
        });

        labels = Object.keys(dailyData).sort((a, b) => {
          const [dayA, monthA] = a.split('/').map(Number);
          const [dayB, monthB] = b.split('/').map(Number);
          if (monthA !== monthB) return monthA - monthB;
          return dayA - dayB;
        });

        const heartRateValues = labels.map((day) => {
          const rates = dailyData[day];
          return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
        });

        datasets = [{ data: heartRateValues, color: () => '#FF6384', strokeWidth: 2 }];
      } else if (viewMode === 'monthly') {
        const monthlyData: { [month: string]: number[] } = {};
        filteredData.forEach((item) => {
          const date = new Date(item.createdAt);
          const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
          if (!monthlyData[monthKey]) monthlyData[monthKey] = [];
          monthlyData[monthKey].push(item.heartRate);
        });

        labels = Object.keys(monthlyData).sort((a, b) => {
          const [monthA, yearA] = a.split('/').map(Number);
          const [monthB, yearB] = b.split('/').map(Number);
          if (yearA !== yearB) return yearA - yearB;
          return monthA - monthB;
        });

        const heartRateValues = labels.map((month) => {
          const rates = monthlyData[month];
          return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
        });

        datasets = [{ data: heartRateValues, color: () => '#FF6384', strokeWidth: 2 }];
      }

      const avgHeartRate =
        filteredData.length > 0
          ? Math.round(filteredData.reduce((sum, item) => sum + item.heartRate, 0) / filteredData.length)
          : null;

      setAverageData({ heartRate: avgHeartRate, systolic: null, diastolic: null });
    } else {
      filteredData = selectedDate
        ? data.blood_pressures.filter((item) => {
            const itemDate = new Date(item.createdAt);
            return (
              itemDate.getDate() === selectedDate.getDate() &&
              itemDate.getMonth() === selectedDate.getMonth() &&
              itemDate.getFullYear() === selectedDate.getFullYear()
            );
          })
        : data.blood_pressures;

      if (viewMode === 'daily') {
        const hourlyData: { [hour: string]: { systolic: number[]; diastolic: number[] } } = {};
        filteredData.forEach((item) => {
          const date = new Date(item.createdAt);
          const hourKey = `${date.getHours().toString().padStart(2, '0')}`;
          if (!hourlyData[hourKey]) hourlyData[hourKey] = { systolic: [], diastolic: [] };
          hourlyData[hourKey].systolic.push(item.systolic);
          hourlyData[hourKey].diastolic.push(item.diastolic);
        });

        labels = Object.keys(hourlyData).sort((a, b) => parseInt(a) - parseInt(b));
        const systolicValues = labels.map((hour) => {
          const rates = hourlyData[hour].systolic;
          return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
        });
        const diastolicValues = labels.map((hour) => {
          const rates = hourlyData[hour].diastolic;
          return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
        });

        datasets = [
          { data: systolicValues, color: () => '#36A2EB', strokeWidth: 2 },
          { data: diastolicValues, color: () => '#4BC0C0', strokeWidth: 2 },
        ];
      } else if (viewMode === 'weekly') {
        const dailyData: { [day: string]: { systolic: number[]; diastolic: number[] } } = {};
        filteredData.forEach((item) => {
          const date = new Date(item.createdAt);
          const dayKey = `${date.getDate()}/${date.getMonth() + 1}`;
          if (!dailyData[dayKey]) dailyData[dayKey] = { systolic: [], diastolic: [] };
          dailyData[dayKey].systolic.push(item.systolic);
          dailyData[dayKey].diastolic.push(item.diastolic);
        });

        labels = Object.keys(dailyData).sort((a, b) => {
          const [dayA, monthA] = a.split('/').map(Number);
          const [dayB, monthB] = b.split('/').map(Number);
          if (monthA !== monthB) return monthA - monthB;
          return dayA - dayB;
        });

        const systolicValues = labels.map((day) => {
          const rates = dailyData[day].systolic;
          return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
        });
        const diastolicValues = labels.map((day) => {
          const rates = dailyData[day].diastolic;
          return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
        });

        datasets = [
          { data: systolicValues, color: () => '#36A2EB', strokeWidth: 2 },
          { data: diastolicValues, color: () => '#4BC0C0', strokeWidth: 2 },
        ];
      } else if (viewMode === 'monthly') {
        const monthlyData: { [month: string]: { systolic: number[]; diastolic: number[] } } = {};
        filteredData.forEach((item) => {
          const date = new Date(item.createdAt);
          const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
          if (!monthlyData[monthKey]) monthlyData[monthKey] = { systolic: [], diastolic: [] };
          monthlyData[monthKey].systolic.push(item.systolic);
          monthlyData[monthKey].diastolic.push(item.diastolic);
        });

        labels = Object.keys(monthlyData).sort((a, b) => {
          const [monthA, yearA] = a.split('/').map(Number);
          const [monthB, yearB] = b.split('/').map(Number);
          if (yearA !== yearB) return yearA - yearB;
          return monthA - monthB;
        });

        const systolicValues = labels.map((month) => {
          const rates = monthlyData[month].systolic;
          return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
        });
        const diastolicValues = labels.map((month) => {
          const rates = monthlyData[month].diastolic;
          return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
        });

        datasets = [
          { data: systolicValues, color: () => '#36A2EB', strokeWidth: 2 },
          { data: diastolicValues, color: () => '#4BC0C0', strokeWidth: 2 },
        ];
      }

      const avgSystolic =
        filteredData.length > 0
          ? Math.round(filteredData.reduce((sum, item) => sum + item.systolic, 0) / filteredData.length)
          : null;
      const avgDiastolic =
        filteredData.length > 0
          ? Math.round(filteredData.reduce((sum, item) => sum + item.diastolic, 0) / filteredData.length)
          : null;

      setAverageData({ heartRate: null, systolic: avgSystolic, diastolic: avgDiastolic });
    }

    if (labels.length > 0 && datasets.some((dataset) => dataset.data.length > 0)) {
      setChartData({
        labels,
        datasets,
        legend: activeTab === 'heartrate' ? [t('heartRate')] : [t('systolic'), t('diastolic')],
      });
    } else {
      setChartData({
        labels: [],
        datasets: activeTab === 'heartrate'
          ? [{ data: [], color: () => '#FF6384', strokeWidth: 2 }]
          : [
              { data: [], color: () => '#36A2EB', strokeWidth: 2 },
              { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
            ],
        legend: activeTab === 'heartrate' ? [t('heartRate')] : [t('systolic'), t('diastolic')],
      });
      showNotification(t('noDataForChart'), 'warning');
    }

    filterHistoryByDate(selectedDate);
  };

  useEffect(() => {
    fetchHealthData();
  }, [followedUserId]);

  useEffect(() => {
    if (allHealthData.heart_rates.length > 0 || allHealthData.blood_pressures.length > 0) {
      processHealthData(allHealthData);
    }
  }, [viewMode, activeTab, selectedDate, allHealthData, t]);

  const filterHistoryByDate = (date: Date | null) => {
    const data = activeTab === 'heartrate' ? allHealthData.heart_rates : allHealthData.blood_pressures;
    if (!date) {
      setFilteredHistory(data);
      return;
    }

    const filtered = data.filter((item) => {
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
    filterHistoryByDate(null);
    processHealthData(allHealthData);
  };

  const loadMoreHistory = () => {
    setDisplayLimit((prevLimit) => prevLimit + 20);
  };

  const renderHistoryItem = ({ item }: { item: HeartRateData | BloodPressureData }) => {
    const date = new Date(item.createdAt);
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes()
      .toString()
      .padStart(2, '0')}`;

    return (
      <View style={styles.historyItem}>
        <Text style={styles.historyDate}>{formattedDate}</Text>
        <Text style={styles.historyTime}>{formattedTime}</Text>
        <Text style={styles.historyValue}>
          {isHeartRateData(item)
            ? `${item.heartRate} ${t('bpm')}`
            : `${item.systolic}/${item.diastolic} ${t('mmHg')}`}
        </Text>
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

  const calculateChartWidth = () => {
    const pointCount = chartData.labels.length;
    return Math.max(pointCount * 40, Dimensions.get('window').width - 20);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      nestedScrollEnabled={true}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesome5
            name="chevron-left"
            size={20}
            color="#432c81"
            style={{ marginRight: 15, marginTop: 17 }}
            onPress={() => navigation.goBack()}
          />
          <Text style={[styles.text1, { fontSize: 30, marginTop: 5 }]}>{t('healthProfile')}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'heartrate' && styles.activeTab]}
          onPress={() => setActiveTab('heartrate')}
        >
          <Text style={[styles.tabText, activeTab === 'heartrate' && styles.activeTabText]}>{t('heartRate')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'bloodpressure' && styles.activeTab]}
          onPress={() => setActiveTab('bloodpressure')}
        >
          <Text style={[styles.tabText, activeTab === 'bloodpressure' && styles.activeTabText]}>{t('bloodPressure')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{activeTab === 'heartrate' ? t('heartRateChart') : t('bloodPressureChart')}</Text>
      <Text style={styles.subtitle}>{getChartTitle()}</Text>

      {loading ? (
        <Text style={styles.loadingText}>{t('loading')}</Text>
      ) : chartData.labels.length > 0 ? (
        <View style={styles.chartOuterContainer}>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.horizontalScrollContainer}
          >
            <View style={[styles.chartContainer, { width: calculateChartWidth() + 20 }]}>
              <LineChart
                data={chartData}
                width={calculateChartWidth()}
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
          <Text style={styles.infoLabel}>
            {activeTab === 'heartrate' ? t('averageHeartRate') : t('averageBloodPressure')}
          </Text>
          <Text style={[styles.infoValue, { color: activeTab === 'heartrate' ? '#FF6384' : '#36A2EB' }]}>
            {activeTab === 'heartrate'
              ? averageData.heartRate !== null
                ? `${averageData.heartRate} ${t('bpm')}`
                : `-- ${t('bpm')}`
              : averageData.systolic !== null && averageData.diastolic !== null
              ? `${averageData.systolic}/${averageData.diastolic} ${t('mmHg')}`
              : `--/-- ${t('mmHg')}`}
          </Text>
        </View>
      </View>

      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>
            {activeTab === 'heartrate' ? t('heartRateHistory') : t('bloodPressureHistory')}
          </Text>
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
              <FontAwesome5 name="calendar-alt" size={20} color="#432c81" />
            </TouchableOpacity>
            {selectedDate && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={clearDateSelection}
              >
                <FontAwesome5 name="times" size={20} color="#432c81" />
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
              keyExtractor={(item, index) => `${item.id}-${index}`}
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
  tabContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 16 },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#ddd',
  },
  activeTab: { backgroundColor: '#432c81' },
  tabText: { fontSize: 16, color: '#333', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
    color: '#432c81',
  },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  chartContainer: {
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartOuterContainer: { marginHorizontal: 0 },
  horizontalScrollContainer: { paddingHorizontal: 0 },
  chart: { borderRadius: 6 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 20 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
  },
  selectedButton: { backgroundColor: '#007AFF' },
  buttonText: { color: '#333', fontWeight: 'bold', fontSize: 14 },
  selectedButtonText: { color: '#fff' },
  infoContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  infoItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  infoLabel: { fontSize: 16, color: '#666', marginBottom: 5, fontWeight: '600' },
  infoValue: { fontSize: 20, fontWeight: 'bold' },
  loadingText: { fontSize: 16, color: '#666', textAlign: 'center', marginVertical: 20 },
  noDataText: { fontSize: 16, color: '#666', textAlign: 'center', marginVertical: 20 },
  historyContainer: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  datePickerContainer: { flexDirection: 'row', alignItems: 'center' },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  datePickerButtonText: { marginRight: 10, color: '#333', fontSize: 14, fontWeight: '500' },
  clearDateButton: { padding: 8, marginLeft: 5 },
  historyList: {},
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateTimeContainer: { flex: 1 },
  historyDate: { fontSize: 15, color: '#333', fontWeight: '500', flex: 1 },
  historyTime: { fontSize: 15, color: '#333', fontWeight: '500', flex: 1 },
  historyValue: {
    fontSize: 15,
    color: '#432c81',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  loadMoreButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  loadMoreText: { fontSize: 16, color: '#432c81', fontWeight: '600' },
});

export default MonitorHealthProfile;