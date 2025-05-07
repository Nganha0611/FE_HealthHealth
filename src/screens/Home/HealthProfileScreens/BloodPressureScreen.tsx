import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Dimensions, StyleSheet, Text, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import { API_BASE_URL } from '../../../utils/config';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../../contexts/NotificationContext';

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [
      { data: [], color: () => '#36A2EB', strokeWidth: 2 },
      { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
    ],
    legend: [t('systolic'), t('diastolic')],
  });
  const [averageBloodPressure, setAverageBloodPressure] = useState<{ systolic: number | null; diastolic: number | null }>({
    systolic: null,
    diastolic: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [allBloodPressureData, setAllBloodPressureData] = useState<BloodPressureData[]>([]);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        setLoading(true);
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user: User = JSON.parse(userData);
          setAvatarUrl(user.url || null);
          fetchBloodPressureData(user.id);
        } else {
          showNotification(t('noUserInfo'), 'error');

        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        showNotification(t('fetchUserError'), 'error');
      }
    };

    fetchUserAndData();
  }, []);

  const fetchBloodPressureData = async (userId: string) => {
    try {
      const response = await axios.get<BloodPressureData[]>(`${API_BASE_URL}/api/blood-pressures/user/${userId}`);
      const data = response.data;

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
        showNotification(t('noBloodPressureData'), 'error');

        return;
      }

      const validData = data.filter(
        (item) =>
          typeof item.systolic === 'number' &&
          typeof item.diastolic === 'number' &&
          !isNaN(item.systolic) &&
          !isNaN(item.diastolic) &&
          item.systolic !== Infinity &&
          item.diastolic !== Infinity &&
          item.systolic !== -Infinity &&
          item.diastolic !== -Infinity
      );

      if (validData.length === 0) {
        setChartData({
          labels: [],
          datasets: [
            { data: [], color: () => '#36A2EB', strokeWidth: 2 },
            { data: [], color: () => '#4BC0C0', strokeWidth: 2 },
          ],
          legend: [t('systolic'), t('diastolic')],
        });
        setAverageBloodPressure({ systolic: null, diastolic: null });
        showNotification(t('invalidBloodPressureData'), 'error');
        return;
      }

      const sorted = validData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setAllBloodPressureData(sorted);
      processBloodPressureData(sorted);
    } catch (error) {
      console.error('Error fetching blood pressure data:', error);
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
    } finally {
      setLoading(false);
    }
  };

  const processBloodPressureData = (data: BloodPressureData[]) => {
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
      showNotification(t('noBloodPressureData'), 'error');
      return;
    }

    let filteredData: BloodPressureData[] = [];
    let labels: string[] = [];
    let systolicValues: number[] = [];
    let diastolicValues: number[] = [];

    const today = new Date();

    if (viewMode === 'daily') {
      filteredData = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return (
          itemDate.getDate() === today.getDate() &&
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getFullYear() === today.getFullYear()
        );
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
        showNotification(t('noDailyBloodPressureData'), 'error');

        return;
      }

      const hourlyData: { [hour: string]: { systolic: number[]; diastolic: number[] } } = {};
      filteredData.forEach((item) => {
        const date = new Date(item.createdAt);
        const hourKey = `${date.getHours()}${t('hour')}`;
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = { systolic: [], diastolic: [] };
        }
        hourlyData[hourKey].systolic.push(item.systolic);
        hourlyData[hourKey].diastolic.push(item.diastolic);
      });

      labels = Object.keys(hourlyData).sort((a, b) => parseInt(a) - parseInt(b));
      systolicValues = labels.map((hour) => {
        const rates = hourlyData[hour].systolic;
        return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
      });
      diastolicValues = labels.map((hour) => {
        const rates = hourlyData[hour].diastolic;
        return rates.length > 0 ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length) : 0;
      });

    } else if (viewMode === 'weekly') {
      const sevenDaysAgo = new Date(today);
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
        showNotification(t('noWeeklyBloodPressureData'), 'error');

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
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

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
        showNotification(t('noMonthlyBloodPressureData'), 'error');

        return;
      }

      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
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

    setChartData({
      labels,
      datasets: [
        { data: systolicValues, color: () => '#36A2EB', strokeWidth: 2 },
        { data: diastolicValues, color: () => '#4BC0C0', strokeWidth: 2 },
      ],
      legend: [t('systolic'), t('diastolic')],
    });
    setAverageBloodPressure({ systolic: avgSystolic, diastolic: avgDiastolic });
  };

  useEffect(() => {
    if (allBloodPressureData.length > 0) {
      processBloodPressureData(allBloodPressureData);
    }
  }, [viewMode, t]);

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
    <SafeAreaView style={styles.container}>
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
          <TouchableOpacity>
            <Image
              style={styles.imgProfile}
              source={avatarUrl ? { uri: avatarUrl } : require('../../../assets/avatar.jpg')}
            />
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
          <Text style={styles.infoLabel}>{t('averageBloodPressure')}</Text>
          <Text style={[styles.infoValue, { color: '#36A2EB' }]}>
            {averageBloodPressure.systolic !== null && averageBloodPressure.diastolic !== null
              ? `${averageBloodPressure.systolic}/${averageBloodPressure.diastolic} ${t('mmHg')}`
              : `--/-- ${t('mmHg')}`}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
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
});

export default BloodPressureScreen;