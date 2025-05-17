import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
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

// Định nghĩa RootStackParamList
type RootStackParamList = {
  Login: undefined;
  MonitorHealthProfile: { followedUserId: string };
};

// Định nghĩa NavigationProp
type NavigationProp = StackNavigationProp<RootStackParamList, 'MonitorHealthProfile'>;

// Định nghĩa Props
interface Props {
  navigation: NavigationProp;
}

// Định nghĩa các kiểu dữ liệu
type ViewMode = 'monthly' | 'daily' | 'weekly';

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

type RouteParams = {
  followedUserId: string;
};

type AverageValue = {
  rate?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
};

const MonitorHealthProfile: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { followedUserId } = route.params;

  const [selectedTab, setSelectedTab] = useState<'heartrate' | 'bloodpressure'>('heartrate');
  const [viewMode, setViewMode] = useState<ViewMode>('daily'); // Mặc định là 'daily' (Hour)
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
    legend: [t('heartRate')],
  });
  const [averageValue, setAverageValue] = useState<AverageValue>({ rate: null, systolic: null, diastolic: null });
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoadingTabChange, setIsLoadingTabChange] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filteredHistory, setFilteredHistory] = useState<(HeartRateData | BloodPressureData)[]>([]);
  const [allHealthData, setAllHealthData] = useState<HealthData>({ heart_rates: [], blood_pressures: [] });
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Hàm làm sạch chuỗi ngày
  const cleanDateString = (dateStr: string): string => {
    if (!dateStr || typeof dateStr !== 'string') return new Date().toISOString();
    return dateStr
      .replace(/ø/g, '0')
      .replace(/ß/g, '0')
      .replace(/•/g, '')
      .replace(/[^\dT:+\-.Z]/g, '')
      .replace(/\+(\d{2}):?$/, '+$1:00')
      .trim();
  };

  // Hàm kiểm tra ngày hợp lệ
  const isValidDate = (dateStr: string): boolean => {
    const cleaned = cleanDateString(dateStr);
    const date = new Date(cleaned);
    return !isNaN(date.getTime());
  };

  // Lấy ngày hiện tại
  const getCurrentDate = (): Date => {
    return new Date('2025-05-17T00:58:00+07:00'); // 12:58 AM +07, 17/05/2025
  };

  // Lấy dữ liệu từ API và lưu vào AsyncStorage
  const fetchAndStoreHealthData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        navigation.navigate('Login');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/tracking/permissions/${followedUserId}/health-data`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const healthData: HealthData = response.data || { heart_rates: [], blood_pressures: [] };

      if (!healthData.heart_rates.length && !healthData.blood_pressures.length) {
        setChartData({
          labels: [],
          datasets:
            selectedTab === 'heartrate'
              ? [{ data: [], color: () => '#FF6384', strokeWidth: 2 }]
              : [
                  { data: [], color: () => '#36A2EB', strokeWidth: 2 },
                  { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
                ],
          legend: selectedTab === 'heartrate' ? [t('heartRate')] : [t('systolic'), t('diastolic')],
        });
        setAverageValue({ rate: null, systolic: null, diastolic: null });
        setFilteredHistory([]);
        setAllHealthData({ heart_rates: [], blood_pressures: [] });
        return;
      }

      const normalizedHeartRates: HeartRateData[] = healthData.heart_rates
        .map((item: any) => {
          const heartRate = Number(item.heartRate ?? item.rate ?? item.value ?? 0);
          return {
            id: item.id || '',
            userId: item.userId || followedUserId,
            heartRate: isNaN(heartRate) || heartRate <= 0 ? 0 : heartRate,
            createdAt: cleanDateString(item.createdAt ?? item.date ?? item.timestamp ?? new Date().toISOString()),
          };
        })
        .filter(
          item =>
            item.heartRate !== null &&
            isValidDate(item.createdAt)
        );

      const normalizedBloodPressures: BloodPressureData[] = healthData.blood_pressures
        .map((item: any) => {
          const systolic = Number(item.systolic ?? item.systolicPressure ?? item.sys ?? 0);
          const diastolic = Number(item.diastolic ?? item.diastolicPressure ?? item.dia ?? 0);
          return {
            id: item.id || '',
            userId: item.userId || followedUserId,
            systolic: isNaN(systolic) || systolic <= 0 ? 0 : systolic,
            diastolic: isNaN(diastolic) || diastolic <= 0 ? 0 : diastolic,
            createdAt: cleanDateString(item.createdAt ?? item.date ?? item.timestamp ?? new Date().toISOString()),
          };
        })
        .filter(
          item =>
            item.systolic !== null &&
            item.diastolic !== null &&
            isValidDate(item.createdAt)
        );

      const validHealthData: HealthData = {
        heart_rates: normalizedHeartRates,
        blood_pressures: normalizedBloodPressures,
      };

      await AsyncStorage.setItem(`healthData_${followedUserId}`, JSON.stringify(validHealthData));
      setAllHealthData(validHealthData);

      const targetData = selectedTab === 'heartrate' ? validHealthData.heart_rates : validHealthData.blood_pressures;
      const sortedData = [...targetData].sort(
        (a, b) => new Date(cleanDateString(b.createdAt)).getTime() - new Date(cleanDateString(a.createdAt)).getTime()
      );
      setFilteredHistory(sortedData);
      processData(sortedData);
    } catch (error: any) {
      console.error('Lỗi khi lấy dữ liệu sức khỏe:', error.message);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          showNotification(t('noPermission'), 'error');
        } else if (error.response?.status === 401) {
          showNotification(t('unauthorized'), 'error');
          navigation.navigate('Login');
        } else {
          showNotification(t('fetchHealthDataError'), 'error');
        }
      } else {
        showNotification(t('fetchHealthDataError'), 'error');
      }
      setChartData({
        labels: [],
        datasets:
          selectedTab === 'heartrate'
            ? [{ data: [], color: () => '#FF6384', strokeWidth: 2 }]
            : [
                { data: [], color: () => '#36A2EB', strokeWidth: 2 },
                { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
              ],
        legend: selectedTab === 'heartrate' ? [t('heartRate')] : [t('systolic'), t('diastolic')],
      });
      setAverageValue({ rate: null, systolic: null, diastolic: null });
      setFilteredHistory([]);
    } finally {
      setLoading(false);
    }
  }, [followedUserId, selectedTab, navigation, showNotification, t]);

  // Tải dữ liệu từ AsyncStorage trước, nếu không có thì gọi API
  const loadHealthDataFromStorage = useCallback(async (tab: 'heartrate' | 'bloodpressure') => {
    try {
      setLoading(true);
      const storedData = await AsyncStorage.getItem(`healthData_${followedUserId}`);
      let healthData: HealthData;

      if (storedData) {
        try {
          healthData = JSON.parse(storedData);
        } catch (parseError) {
          console.error('Lỗi khi parse dữ liệu AsyncStorage:', parseError);
          showNotification(t('dataParseError'), 'error');
          await fetchAndStoreHealthData();
          return;
        }

        if (!healthData || (!healthData.heart_rates.length && !healthData.blood_pressures.length)) {
          setChartData({
            labels: [],
            datasets:
              tab === 'heartrate'
                ? [{ data: [], color: () => '#FF6384', strokeWidth: 2 }]
                : [
                    { data: [], color: () => '#36A2EB', strokeWidth: 2 },
                    { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
                  ],
            legend: tab === 'heartrate' ? [t('heartRate')] : [t('systolic'), t('diastolic')],
          });
          setAverageValue({ rate: null, systolic: null, diastolic: null });
          setFilteredHistory([]);
          setAllHealthData({ heart_rates: [], blood_pressures: [] });
          return;
        }

        setAllHealthData(healthData);
        const dataToProcess = tab === 'heartrate' ? healthData.heart_rates : healthData.blood_pressures;
        const sortedData = [...dataToProcess].sort(
          (a, b) => new Date(cleanDateString(b.createdAt)).getTime() - new Date(cleanDateString(a.createdAt)).getTime()
        );
        setFilteredHistory(sortedData);
        processData(sortedData);
      } else {
        await fetchAndStoreHealthData();
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu từ AsyncStorage:', error);
      showNotification(t('fetchHealthDataError'), 'error');
      await fetchAndStoreHealthData();
    } finally {
      setLoading(false);
    }
  }, [fetchAndStoreHealthData, followedUserId, showNotification, t]);

  // Lọc lịch sử theo ngày
  const filterHistoryByDate = useCallback((date: Date | null) => {
    const targetData = selectedTab === 'heartrate' ? allHealthData.heart_rates : allHealthData.blood_pressures;

    let filtered: (HeartRateData | BloodPressureData)[] = [...targetData];
    if (date) {
      filtered = targetData.filter((item) => {
        const itemDate = new Date(cleanDateString(item.createdAt));
        return isValidDate(item.createdAt) && itemDate.toDateString() === date.toDateString();
      }) as (HeartRateData | BloodPressureData)[];
    }

    const sortedFiltered = [...filtered].sort(
      (a, b) => new Date(cleanDateString(b.createdAt)).getTime() - new Date(cleanDateString(a.createdAt)).getTime()
    );
    setFilteredHistory(sortedFiltered);
    processData(sortedFiltered);
  }, [selectedTab, allHealthData]);

  // Xử lý dữ liệu cho biểu đồ và tính trung bình
  const processData = useCallback((data: (HeartRateData | BloodPressureData)[]) => {
    if (!data || data.length === 0) {
      setChartData({
        labels: [],
        datasets:
          selectedTab === 'heartrate'
            ? [{ data: [], color: () => '#FF6384', strokeWidth: 2 }]
            : [
                { data: [], color: () => '#36A2EB', strokeWidth: 2 },
                { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
              ],
        legend: selectedTab === 'heartrate' ? [t('heartRate')] : [t('systolic'), t('diastolic')],
      });
      setAverageValue({ rate: null, systolic: null, diastolic: null });
      return;
    }

    const referenceDate = selectedDate || getCurrentDate();
    let filteredData: (HeartRateData | BloodPressureData)[] = [...data];

    // Giới hạn dữ liệu theo chế độ xem
    if (viewMode === 'daily') {
      filteredData = data.filter((item) => {
        const itemDate = new Date(cleanDateString(item.createdAt));
        return isValidDate(item.createdAt) && itemDate.toDateString() === referenceDate.toDateString();
      }) as (HeartRateData | BloodPressureData)[];
    } else if (viewMode === 'weekly') {
      const startOfWeek = new Date(referenceDate);
      startOfWeek.setDate(referenceDate.getDate() - 6); // 7 ngày (11/05 - 17/05)
      filteredData = data
        .filter((item) => {
          const itemDate = new Date(cleanDateString(item.createdAt));
          return isValidDate(item.createdAt) && itemDate >= startOfWeek && itemDate <= referenceDate;
        })
        .reduce((acc: (HeartRateData | BloodPressureData)[], item) => {
          const itemDate = new Date(cleanDateString(item.createdAt));
          const dateStr = itemDate.toDateString();
          const existing = acc.find((i) => new Date(cleanDateString(i.createdAt)).toDateString() === dateStr);
          if (!existing) acc.push(item);
          return acc;
        }, [])
        .slice(0, 7); // Đảm bảo chỉ lấy 1 item mỗi ngày, tối đa 7 ngày
    } else if (viewMode === 'monthly') {
      const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      const endOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
      const daysInMonth = endOfMonth.getDate();
      const weekSize = Math.ceil(daysInMonth / 4);

      const weeksData: (HeartRateData | BloodPressureData)[][] = [[], [], [], []];
      data
        .filter((item) => {
          const itemDate = new Date(cleanDateString(item.createdAt));
          return isValidDate(item.createdAt) && itemDate >= startOfMonth && itemDate <= endOfMonth;
        })
        .forEach((item) => {
          const itemDate = new Date(cleanDateString(item.createdAt));
          const day = itemDate.getDate();
          const weekIndex = Math.min(Math.floor((day - 1) / weekSize), 3);
          weeksData[weekIndex].push(item);
        });

      filteredData = weeksData
        .map((week) => {
          if (week.length === 0) return null;
          return week.sort(
            (a, b) => new Date(cleanDateString(b.createdAt)).getTime() - new Date(cleanDateString(a.createdAt)).getTime()
          )[0]; // Lấy item mới nhất trong tuần
        })
        .filter((item): item is HeartRateData | BloodPressureData => item !== null);
    }

    if (filteredData.length === 0) {
      setChartData({
        labels: [],
        datasets:
          selectedTab === 'heartrate'
            ? [{ data: [], color: () => '#FF6384', strokeWidth: 2 }]
            : [
                { data: [], color: () => '#36A2EB', strokeWidth: 2 },
                { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
              ],
        legend: selectedTab === 'heartrate' ? [t('heartRate')] : [t('systolic'), t('diastolic')],
      });
      setAverageValue({ rate: null, systolic: null, diastolic: null });
      return;
    }

    let labels: string[] = [];
    let values: number[] = [];
    let systolicValues: number[] = [];
    let diastolicValues: number[] = [];

    // Xử lý dữ liệu cho biểu đồ, đảm bảo khớp với selectedTab
    const isHeartRateData = selectedTab === 'heartrate' && 'heartRate' in filteredData[0];
    const isBloodPressureData = selectedTab === 'bloodpressure' && 'systolic' in filteredData[0] && 'diastolic' in filteredData[0];

    if (isHeartRateData) {
      const heartRateData = filteredData as HeartRateData[];
      if (viewMode === 'daily') {
        const dataByHour = new Map<number, number[]>();
        heartRateData.forEach((item) => {
          const itemDate = new Date(cleanDateString(item.createdAt));
          const hour = itemDate.getHours();
          if (!dataByHour.has(hour)) dataByHour.set(hour, []);
          dataByHour.get(hour)!.push(item.heartRate);
        });

        labels = Array.from(dataByHour.keys())
          .sort((a, b) => a - b)
          .map((hour) => `${hour.toString().padStart(2, '0')}:00`);
        values = labels.map((label) => {
          const hour = parseInt(label.split(':')[0]);
          const rates = dataByHour.get(hour) || [];
          return rates.length > 0 ? rates.reduce((sum, v) => sum + v, 0) / rates.length : 0;
        });
      } else if (viewMode === 'weekly') {
        labels = Array(7)
          .fill(0)
          .map((_, i) => {
            const day = new Date(referenceDate);
            day.setDate(referenceDate.getDate() - (6 - i));
            return `${day.getDate()}/${day.getMonth() + 1}`;
          });
        values = labels.map((label) => {
          const [day, month] = label.split('/').map(Number);
          const rate = heartRateData.find((item) => {
            const itemDate = new Date(cleanDateString(item.createdAt));
            return itemDate.getDate() === day && itemDate.getMonth() + 1 === month;
          });
          return rate ? rate.heartRate || 0 : 0;
        });
      } else if (viewMode === 'monthly') {
        labels = Array.from({ length: 4 }, (_, i) => `${t('week')} ${i + 1}`);
        values = labels.map((_, index) => {
          const weekData = heartRateData[index];
          return weekData ? weekData.heartRate || 0 : 0;
        });
      }
    } else if (isBloodPressureData) {
      const bloodPressureData = filteredData as BloodPressureData[];
      if (viewMode === 'daily') {
        const dataByHour = new Map<number, { systolic: number[]; diastolic: number[] }>();
        bloodPressureData.forEach((item) => {
          const itemDate = new Date(cleanDateString(item.createdAt));
          const hour = itemDate.getHours();
          if (!dataByHour.has(hour)) dataByHour.set(hour, { systolic: [], diastolic: [] });
          dataByHour.get(hour)!.systolic.push(item.systolic);
          dataByHour.get(hour)!.diastolic.push(item.diastolic);
        });

        labels = Array.from(dataByHour.keys())
          .sort((a, b) => a - b)
          .map((hour) => `${hour.toString().padStart(2, '0')}:00`);
        systolicValues = labels.map((label) => {
          const hour = parseInt(label.split(':')[0]);
          const pressures = dataByHour.get(hour)?.systolic || [];
          return pressures.length > 0 ? pressures.reduce((sum, v) => sum + v, 0) / pressures.length : 0;
        });
        diastolicValues = labels.map((label) => {
          const hour = parseInt(label.split(':')[0]);
          const pressures = dataByHour.get(hour)?.diastolic || [];
          return pressures.length > 0 ? pressures.reduce((sum, v) => sum + v, 0) / pressures.length : 0;
        });
      } else if (viewMode === 'weekly') {
        labels = Array(7)
          .fill(0)
          .map((_, i) => {
            const day = new Date(referenceDate);
            day.setDate(referenceDate.getDate() - (6 - i));
            return `${day.getDate()}/${day.getMonth() + 1}`;
          });
        systolicValues = labels.map((label) => {
          const [day, month] = label.split('/').map(Number);
          const pressure = bloodPressureData.find((item) => {
            const itemDate = new Date(cleanDateString(item.createdAt));
            return itemDate.getDate() === day && itemDate.getMonth() + 1 === month;
          });
          return pressure ? pressure.systolic || 0 : 0;
        });
        diastolicValues = labels.map((label) => {
          const [day, month] = label.split('/').map(Number);
          const pressure = bloodPressureData.find((item) => {
            const itemDate = new Date(cleanDateString(item.createdAt));
            return itemDate.getDate() === day && itemDate.getMonth() + 1 === month;
          });
          return pressure ? pressure.diastolic || 0 : 0;
        });
      } else if (viewMode === 'monthly') {
        labels = Array.from({ length: 4 }, (_, i) => `${t('week')} ${i + 1}`);
        systolicValues = labels.map((_, index) => {
          const weekData = bloodPressureData[index];
          return weekData ? weekData.systolic || 0 : 0;
        });
        diastolicValues = labels.map((_, index) => {
          const weekData = bloodPressureData[index];
          return weekData ? weekData.diastolic || 0 : 0;
        });
      }
    } else {
      console.warn('Data type mismatch with selected tab:', selectedTab, filteredData[0]);
      return;
    }

    // Tính giá trị trung bình dựa trên filteredData
    let avgValue: AverageValue = { rate: null, systolic: null, diastolic: null };
    if (filteredData.length > 0) {
      if (isHeartRateData) {
        const heartRateData = filteredData as HeartRateData[];
        const validRates = heartRateData
          .map((item) => item.heartRate)
          .filter((rate): rate is number => rate !== null && typeof rate === 'number' && !isNaN(rate) && rate > 0);
        avgValue.rate = validRates.length > 0 ? Math.round(validRates.reduce((sum, val) => sum + val, 0) / validRates.length) : null;
      } else if (isBloodPressureData) {
        const bloodPressureData = filteredData as BloodPressureData[];
        const validSystolic = bloodPressureData
          .map((item) => item.systolic)
          .filter((s): s is number => s !== null && typeof s === 'number' && !isNaN(s) && s > 0);
        const validDiastolic = bloodPressureData
          .map((item) => item.diastolic)
          .filter((d): d is number => d !== null && typeof d === 'number' && !isNaN(d) && d > 0);
        avgValue.systolic = validSystolic.length > 0 ? Math.round(validSystolic.reduce((sum, val) => sum + val, 0) / validSystolic.length) : null;
        avgValue.diastolic = validDiastolic.length > 0 ? Math.round(validDiastolic.reduce((sum, val) => sum + val, 0) / validDiastolic.length) : null;
      }
    }

    setChartData({
      labels,
      datasets:
        selectedTab === 'heartrate'
          ? [{ data: values, color: () => '#FF6384', strokeWidth: 2 }]
          : [
              { data: systolicValues, color: () => '#36A2EB', strokeWidth: 2 },
              { data: diastolicValues, color: () => '#4BC0C0', strokeWidth: 2 },
            ],
      legend: selectedTab === 'heartrate' ? [t('heartRate')] : [t('systolic'), t('diastolic')],
    });
    setAverageValue(avgValue);
  }, [selectedTab, viewMode, selectedDate, t]);

  // Xử lý chuyển tab và đặt mặc định là Hour
  const handleTabChange = useCallback(async (tab: 'heartrate' | 'bloodpressure') => {
    if (isLoadingTabChange) return;
    setIsLoadingTabChange(true);
    setSelectedTab(tab);
    setViewMode('daily'); // Đặt mặc định là Hour
    setSelectedDate(null); // Reset ngày khi chuyển tab
    setAverageValue({ rate: null, systolic: null, diastolic: null });
    setChartData({
      labels: [],
      datasets:
        tab === 'heartrate'
          ? [{ data: [], color: () => '#FF6384', strokeWidth: 2 }]
          : [
              { data: [], color: () => '#36A2EB', strokeWidth: 2 },
              { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
            ],
      legend: tab === 'heartrate' ? [t('heartRate')] : [t('systolic'), t('diastolic')],
    });
    await loadHealthDataFromStorage(tab);
    setIsLoadingTabChange(false);
  }, [loadHealthDataFromStorage, t, isLoadingTabChange]);

  // Xử lý chọn ngày
  const onDateChange = (event: any, selected: Date | undefined) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) {
      setSelectedDate(selected);
      filterHistoryByDate(selected);
    }
  };

  // Xóa lựa chọn ngày
  const clearDateSelection = () => {
    setSelectedDate(null);
    setShowDatePicker(false);
    filterHistoryByDate(null);
  };

  // Xử lý thay đổi chế độ xem
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Theo dõi viewMode và gọi processData ngay lập tức
  useEffect(() => {
    const targetData = selectedTab === 'heartrate' ? allHealthData.heart_rates : allHealthData.blood_pressures;
    processData(targetData);
  }, [viewMode, selectedTab, allHealthData, processData]);

  // Tải dữ liệu ban đầu và đặt mặc định là Hour
  useEffect(() => {
    if (isInitialLoad) {
      setViewMode('daily'); // Đặt mặc định là Hour
      loadHealthDataFromStorage('heartrate');
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, loadHealthDataFromStorage]);

  // Render item lịch sử
  const renderHistoryItem = ({ item }: { item: HeartRateData | BloodPressureData }) => {
    const date = new Date(cleanDateString(item.createdAt));
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return (
      <View style={styles.historyItem}>
        <Text style={styles.historyDate}>{formattedDate}</Text>
        <Text style={styles.historyTime}>{formattedTime}</Text>
        <Text
          style={[styles.historyValue, { color: selectedTab === 'heartrate' ? '#FF6384' : '#36A2EB' }]}
        >
          {selectedTab === 'heartrate'
            ? `${('heartRate' in item ? item.heartRate : 0) || 0} ${t('bpm')}`
            : `${('systolic' in item ? item.systolic : 0) || 0}/${('diastolic' in item ? item.diastolic : 0) || 0} ${t('mmHg')}`}
        </Text>
      </View>
    );
  };

  // Lấy tiêu đề biểu đồ
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome5 name="chevron-left" size={20} color="#432c81" style={{ marginRight: 15 }} />
        </TouchableOpacity>
        <Text style={styles.textHeader}>{t('profileHealth')}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'heartrate' && styles.selectedTab]}
          onPress={() => handleTabChange('heartrate')}
        >
          <Text style={[styles.tabText, selectedTab === 'heartrate' && styles.selectedTabText]}>
            {t('heartRate')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'bloodpressure' && styles.selectedTab]}
          onPress={() => handleTabChange('bloodpressure')}
        >
          <Text style={[styles.tabText, selectedTab === 'bloodpressure' && styles.selectedTabText]}>
            {t('bloodPressure')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>
        {selectedTab === 'heartrate' ? t('heartRateChart') : t('bloodPressureChart')}
      </Text>
      <Text style={styles.subtitle}>{getChartTitle()}</Text>

      {loading ? (
        <Text style={styles.loadingText}>{t('loading')}</Text>
      ) : chartData.labels.length > 0 && chartData.datasets.some((dataset: any) => dataset.data.some((value: number) => value !== 0)) ? (
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
            withShadow={true}
            withInnerLines={true}
          />
        </View>
      ) : (
        <Text style={styles.noDataText}>
          {t('noData')} {selectedDate ? `cho ${selectedDate.toLocaleDateString('vi-VN')}` : ''}
        </Text>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, viewMode === 'daily' && styles.selectedButton]}
          onPress={() => handleViewModeChange('daily')}
        >
          <Text style={[styles.buttonText, viewMode === 'daily' && styles.selectedButtonText]}>
            {t('hour')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, viewMode === 'weekly' && styles.selectedButton]}
          onPress={() => handleViewModeChange('weekly')}
        >
          <Text style={[styles.buttonText, viewMode === 'weekly' && styles.selectedButtonText]}>
            {t('day')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, viewMode === 'monthly' && styles.selectedButton]}
          onPress={() => handleViewModeChange('monthly')}
        >
          <Text style={[styles.buttonText, viewMode === 'monthly' && styles.selectedButtonText]}>
            {t('week')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>
            {selectedTab === 'heartrate' ? t('averageHeartRate') : t('averageBloodPressure')}
          </Text>
          <Text
            style={[styles.infoValue, { color: selectedTab === 'heartrate' ? '#FF6384' : '#36A2EB' }]}
          >
            {selectedTab === 'heartrate'
              ? averageValue.rate !== null
                ? `${averageValue.rate} ${t('bpm')}`
                : `-- ${t('bpm')}`
              : averageValue.systolic !== null && averageValue.diastolic !== null
              ? `${averageValue.systolic}/${averageValue.diastolic} ${t('mmHg')}`
              : `--/-- ${t('mmHg')}`}
          </Text>
        </View>
      </View>

      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>
            {selectedTab === 'heartrate' ? t('heartRateHistory') : t('bloodPressureHistory')}
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
              <TouchableOpacity style={styles.clearDateButton} onPress={clearDateSelection}>
                <FontAwesome5 name="times" size={20} color="#432c81" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || getCurrentDate()}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={getCurrentDate()}
          />
        )}

        {filteredHistory.length > 0 ? (
          <ScrollView nestedScrollEnabled={true}>
            {filteredHistory.map((item, index) => (
              <React.Fragment key={`${item.id}-${index}`}>
                {renderHistoryItem({ item })}
              </React.Fragment>
            ))}
          </ScrollView>
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
  header: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
    marginLeft: 10,
  },
  textHeader: {
    fontSize: 30,
    fontFamily: 'Roboto',
    color: '#432c81',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 10,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 5,
  },
  selectedTab: { backgroundColor: '#432c81' },
  tabText: { fontSize: 16, fontWeight: '600', color: '#432c81' },
  selectedTabText: { color: '#fff' },
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
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
  },
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
  historyValue: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
});

export default MonitorHealthProfile;