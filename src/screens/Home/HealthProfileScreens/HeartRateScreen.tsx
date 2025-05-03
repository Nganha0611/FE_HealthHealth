import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Dimensions, StyleSheet, Text, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import { API_BASE_URL } from '../../../utils/config';

type ViewMode = 'monthly' | 'daily' | 'weekly';

interface HeartRateData {
  heartRate: number;
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
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
    legend: ['Nhịp tim'],
  });
  const [averageHeartRate, setAverageHeartRate] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allHeartRateData, setAllHeartRateData] = useState<HeartRateData[]>([]);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        setLoading(true);
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user: User = JSON.parse(userData);
          setAvatarUrl(user.url || null);
          fetchHeartRateData(user.id);
        } else {
          Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng. Vui lòng thử lại.');
      }
    };

    fetchUserAndData();
  }, []);

  const fetchHeartRateData = async (userId: string) => {
    try {
      const response = await axios.get<HeartRateData[]>(`${API_BASE_URL}/api/heart-rates/user/${userId}`);
      const data = response.data;

      if (!data || data.length === 0) {
        setChartData({
          labels: [],
          datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
          legend: ['Nhịp tim'],
        });
        setAverageHeartRate(null);
        Alert.alert('Thông báo', 'Không có dữ liệu nhịp tim nào để hiển thị.');
        return;
      }

      // Lọc dữ liệu có heartRate hợp lệ
      const validData = data.filter(item => 
        typeof item.heartRate === 'number' && 
        !isNaN(item.heartRate) && 
        item.heartRate !== Infinity && 
        item.heartRate !== -Infinity
      );

      if (validData.length === 0) {
        setChartData({
          labels: [],
          datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
          legend: ['Nhịp tim'],
        });
        setAverageHeartRate(null);
        Alert.alert('Thông báo', 'Dữ liệu nhịp tim không hợp lệ.');
        return;
      }

      // Sắp xếp theo thời gian
      const sorted = validData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setAllHeartRateData(sorted);
      
      // Process data based on current view mode
      processHeartRateData(sorted);
      
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu nhịp tim:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu nhịp tim. Vui lòng kiểm tra kết nối và thử lại.');
      setChartData({
        labels: [],
        datasets: [{ data: [], color: () => '#FF6384', strokeWidth: 2 }],
        legend: ['Nhịp tim'],
      });
      setAverageHeartRate(null);
    } finally {
      setLoading(false);
    }
  };

  const processHeartRateData = (data: HeartRateData[]) => {
    if (!data || data.length === 0) return;
    
    let filteredData: HeartRateData[] = [];
    let labels: string[] = [];
    let values: number[] = [];

    const today = new Date();
    // Don't set hours to 0 to ensure we see today's data
    
    console.log(`Processing data for ${viewMode} view`);
    console.log(`Today: ${today.toISOString()}`);
    console.log(`Total data points: ${data.length}`);

    if (viewMode === 'daily') {
      // For daily view, get all data from the current day
      // We're not resetting hours to 0 to ensure we include today's data
      filteredData = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        const isSameDay = 
          itemDate.getDate() === today.getDate() &&
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getFullYear() === today.getFullYear();
        
        return isSameDay;
      });

      // For testing/debugging
      console.log(`Daily filtered data points: ${filteredData.length}`);
      filteredData.forEach(item => {
        console.log(`Item date: ${new Date(item.createdAt).toISOString()}, Heart rate: ${item.heartRate}`);
      });

      if (filteredData.length === 0) {
        // If today has no data, show the most recent data available
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        filteredData = data;
        // Log that we're using all data because today has none
        console.log("No data for today, using all available data");
      }

      // Group data by hour
      const hourlyData: {[hour: string]: number[]} = {};
      filteredData.forEach(item => {
        const date = new Date(item.createdAt);
        const hourKey = `${date.getHours()}h`;
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = [];
        }
        hourlyData[hourKey].push(item.heartRate);
      });

      // Create labels and values from hourly data
      labels = Object.keys(hourlyData).sort((a, b) => {
        return parseInt(a) - parseInt(b); // Sort hours numerically
      });
      values = labels.map(hour => {
        const rates = hourlyData[hour];
        return Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length);
      });

    } else if (viewMode === 'weekly') {
      // For weekly view, we'll get data from the last 7 days
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      filteredData = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= sevenDaysAgo;
      });

      console.log(`Weekly filtered data points: ${filteredData.length}`);
      
      if (filteredData.length === 0) {
        // If no data in the last 7 days, use all available data
        filteredData = data;
        console.log("No data for past week, using all available data");
      }

      // Group data by day
      const dailyData: {[day: string]: number[]} = {};
      filteredData.forEach(item => {
        const date = new Date(item.createdAt);
        const dayKey = `${date.getDate()}/${date.getMonth() + 1}`;
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = [];
        }
        dailyData[dayKey].push(item.heartRate);
      });

      // Create labels and values from daily data
      const sortedDays = Object.keys(dailyData).sort((a, b) => {
        const [dayA, monthA] = a.split('/').map(Number);
        const [dayB, monthB] = b.split('/').map(Number);
        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
      });

      labels = sortedDays;
      values = labels.map(day => {
        const rates = dailyData[day];
        return Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length);
      });

    } else if (viewMode === 'monthly') {
      // For monthly view, get data from start of current month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      filteredData = data.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= startOfMonth;
      });

      console.log(`Monthly filtered data points: ${filteredData.length}`);
      
      if (filteredData.length === 0) {
        // If no data this month, use all available data
        filteredData = data;
        console.log("No data for current month, using all available data");
      }

      // Divide the month into weeks
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const weekSize = Math.ceil(daysInMonth / 4);
      
      const weeklyData: {[week: string]: number[]} = {};
      filteredData.forEach(item => {
        const date = new Date(item.createdAt);
        const dayOfMonth = date.getDate();
        const weekNumber = Math.floor((dayOfMonth - 1) / weekSize) + 1;
        const weekKey = `Tuần ${weekNumber}`;
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = [];
        }
        weeklyData[weekKey].push(item.heartRate);
      });

      // Create labels and values
      labels = Object.keys(weeklyData).sort((a, b) => {
        return parseInt(a.replace('Tuần ', '')) - parseInt(b.replace('Tuần ', ''));
      });
      values = labels.map(week => {
        const rates = weeklyData[week];
        return Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length);
      });
    }

    // Calculate average heart rate
    const avgHeartRate = values.length > 0 
      ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length) 
      : null;

    setChartData({
      labels,
      datasets: [{ data: values, color: () => '#FF6384', strokeWidth: 2 }],
      legend: ['Nhịp tim'],
    });
    
    setAverageHeartRate(avgHeartRate);
  };

  useEffect(() => {
    if (allHeartRateData.length > 0) {
      processHeartRateData(allHeartRateData);
    }
  }, [viewMode]);

  const getChartTitle = () => {
    switch (viewMode) {
      case 'monthly':
        return 'Diễn biến theo tuần trong tháng';
      case 'daily':
        return 'Diễn biến theo giờ trong ngày';
      case 'weekly':
        return 'Diễn biến theo ngày trong tuần';
      default:
        return 'Biểu đồ nhịp tim';
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
          <Text style={[styles.text1, { fontSize: 30, marginTop: 5 }]}>Nhịp tim</Text>
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
      <Text style={styles.title}>Biểu đồ nhịp tim</Text>
      <Text style={styles.subtitle}>{getChartTitle()}</Text>

      {loading ? (
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
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
              propsForDots: { r: '4', strokeWidth: '2' },
            }}
            bezier 
            style={styles.chart}
            yAxisSuffix="" 
            withDots={true}
          />
        </View>
      ) : (
        <Text style={styles.noDataText}>Không có dữ liệu để hiển thị biểu đồ.</Text>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, viewMode === 'daily' && styles.selectedButton]}
          onPress={() => setViewMode('daily')}
        >
          <Text style={[styles.buttonText, viewMode === 'daily' && styles.selectedButtonText]}>Giờ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, viewMode === 'weekly' && styles.selectedButton]}
          onPress={() => setViewMode('weekly')}
        >
          <Text style={[styles.buttonText, viewMode === 'weekly' && styles.selectedButtonText]}>Ngày</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, viewMode === 'monthly' && styles.selectedButton]}
          onPress={() => setViewMode('monthly')}
        >
          <Text style={[styles.buttonText, viewMode === 'monthly' && styles.selectedButtonText]}>Tuần</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Nhịp tim trung bình</Text>
          <Text style={[styles.infoValue, { color: '#FF6384' }]}>
            {averageHeartRate !== null ? `${averageHeartRate} BPM` : '-- BPM'}
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

export default HeartRateScreen;