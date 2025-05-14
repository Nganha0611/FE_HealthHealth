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

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        setLoading(true);
        const userData = await AsyncStorage.getItem('user');
        console.log('User data from AsyncStorage:', userData);
        if (userData) {
          const user: User = JSON.parse(userData);
          if (!user.id) {
            throw new Error('User ID is missing');
          }
          console.log('User ID:', user.id);
          setAvatarUrl(user.url || null);
          await fetchHeartRateData(user.id);
        } else {
          console.error('No user data found in AsyncStorage');
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

  const fetchHeartRateData = async (userId: string) => {
    try {
        console.log(`Fetching heart rate data for userId: ${userId}`);
        const token = await AsyncStorage.getItem('token');
        console.log('Token:', token ? 'Found' : 'Not found');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        let response = await axios.get(`${API_BASE_URL}/api/heart-rates/user/${userId}`, config);
        console.log('API response status:', response.status);
        console.log('API response data:', response.data);

        let data = response.data;

        // Nếu endpoint chính không trả dữ liệu, thử endpoint thay thế
        if (!data || data.length === 0) {
            console.log('No data from /api/heart-rates, trying /api/heart-rate');
            response = await axios.get(`${API_BASE_URL}/api/heart-rate/user/${userId}`, config);
            console.log('Alternative API response status:', response.status);
            console.log('Alternative API response data:', response.data);
            data = response.data;
        }

        if (!data || data.length === 0) {
            console.log('No heart rate data returned from API');
            setChartData({
                labels: [],
                datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
                legend: [t('heartRate')],
            });
            setAverageHeartRate(null);
            setFilteredHistory([]);
            // showNotification(t('noHeartRateData'), 'error');
            return;
        }

        // Chuẩn hóa dữ liệu
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

        console.log('Normalized data:', normalizedData);

        const validData = normalizedData.filter(
            item =>
                typeof item.rate === 'number' &&
                !isNaN(item.rate) &&
                item.rate !== Infinity &&
                item.rate !== -Infinity &&
                typeof item.createdAt === 'string' &&
                item.createdAt
        );

        console.log('Valid data after filtering:', validData);
        if (validData.length === 0) {
            console.log('No valid heart rate data after filtering. Invalid items:', normalizedData);
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
        console.error('Error fetching heart rate data:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.status, error.response.data);
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
                // showNotification(t('noHeartRateData'), 'error');
                return;
            }
        }
        showNotification(t('fetchHeartRateError'), 'error');
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

  const processHeartRateData = (data: HeartRateData[]) => {
  console.log('Processing heart rate data:', data);
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

  const referenceDate = selectedDate || new Date(); // Sử dụng selectedDate nếu có, nếu không dùng ngày hiện tại
  if (viewMode === 'daily') {
    // Lọc dữ liệu cho ngày được chọn hoặc ngày hiện tại
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
        datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
        legend: [t('heartRate')],
      });
      setAverageHeartRate(null);
      showNotification(t('noDailyData'), 'error');
      return;
    }

    // Nhóm dữ liệu theo giờ (chỉ các giờ có dữ liệu)
    const hourlyData: { [hour: string]: number[] } = {};
    filteredData.forEach((item) => {
      const date = new Date(item.createdAt);
      const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`; // Định dạng giờ, ví dụ: "08:00"
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = [];
      }
      hourlyData[hourKey].push(item.rate);
    });

    console.log('Hourly data:', hourlyData);

    // Tạo labels và heartRateValues chỉ cho các giờ có dữ liệu
    labels = Object.keys(hourlyData).sort((a, b) => {
      const hourA = parseInt(a.split(':')[0]);
      const hourB = parseInt(b.split(':')[0]);
      return hourA - hourB;
    });

    heartRateValues = labels.map((hourLabel) => {
      const rates = hourlyData[hourLabel];
      return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
    });

    console.log('Labels:', labels);
    console.log('Heart rate values:', heartRateValues);
  } else if (viewMode === 'weekly') {
    // Giữ nguyên logic cho weekly
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
    // Giữ nguyên logic cho monthly
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

  // Tính trung bình nhịp tim
  const avgHeartRate = filteredData.length > 0
    ? Math.round(filteredData.reduce((sum, item) => sum + item.rate, 0) / filteredData.length)
    : null;

  // Cập nhật chartData
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
    console.log('Filtering history by date:', date);
    if (!date) {
      setFilteredHistory(allHeartRateData);
      return;
    }

    const filtered = allHeartRateData.filter(item => {
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

  const renderHistoryItem = ({ item }: { item: HeartRateData }) => {
    const date = new Date(item.createdAt);
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

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
          <TouchableOpacity>
            <Image
              style={styles.imgProfile}
              source={avatarUrl ? { uri: avatarUrl } : require('../../../assets/avatar.jpg')}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.title}>{t('heartRateChart')}</Text>
      <Text style={styles.subtitle}>{getChartTitle()}</Text>

      {loading ? (
        <Text style={styles.loadingText}>{t('loading_message')}</Text>
      ) : chartData.datasets[0].data.length > 0 ? (
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 20}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '6', strokeWidth: '2' },
            }}
            bezier
            style={styles.chart}
            yAxisSuffix=""
            withDots={true}
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
          <FlatList
            data={filteredHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item, index) => `${item.createdAt}-${index}`}
            style={styles.historyList}
            scrollEnabled={false}
            initialNumToRender={10}
            windowSize={5}
            showsVerticalScrollIndicator={false}
          />
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
  headerRight: { marginRight: 15, backgroundColor: '#e0dee7', borderRadius: 30, padding: 7 },
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
});

export default HeartRateScreen;