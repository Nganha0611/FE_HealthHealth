import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Dimensions, StyleSheet, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';

type ViewMode = 'monthly' | 'daily' | 'weekly';
type Props = {
  navigation: NavigationProp<any>;
};
const HeartRateScreen: React.FC<Props> = ({ navigation }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setAvatarUrl(user.url || null);
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
      }
    };

    fetchUser();
  }, []);
  // Dữ liệu mẫu - theo giờ trong ngày
  const dailyData = {
    labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM', '3PM', '6PM'],
    datasets: [
      {
        data: [75, 82, 88, 74, 85, 72, 0 ,0 ,0],
        color: () => '#FF6384', 
        strokeWidth: 2,
      },
    //   {
    //     data: [120, 125, 130, 118, 135, 122], // huyết áp tâm thu
    //     color: () => '#36A2EB', // màu xanh
    //     strokeWidth: 2,
    //   },
    //   {
    //     data: [80, 85, 88, 75, 90, 78], // huyết áp tâm trương
    //     color: () => '#4BC0C0', // màu xanh lá
    //     strokeWidth: 2,
    //   },
    ],
    legend: ['Nhịp tim'],
  };

  // Dữ liệu mẫu - theo ngày
  const weeklyData = {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6'],
    datasets: [
      {
        data: [76, 80, 79, 78, 77],
        color: () => '#FF6384',
        strokeWidth: 2,
      },
    //   {
    //     data: [122, 125, 121, 124, 126],
    //     color: () => '#36A2EB',
    //     strokeWidth: 2,
    //   },
    //   {
    //     data: [82, 84, 79, 83, 85],
    //     color: () => '#4BC0C0',
    //     strokeWidth: 2,
    //   },
    ],
    legend: ['Nhịp tim'],
  };

  // Dữ liệu mẫu - theo tuần
  const monthlyData = {
    labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
    datasets: [
      {
        data: [75, 78, 76, 77],
        color: () => '#FF6384',
        strokeWidth: 2,
      },
    //   {
    //     data: [120, 122, 119, 121],
    //     color: () => '#36A2EB',
    //     strokeWidth: 2,
    //   },
    //   {
    //     data: [80, 83, 81, 82],
    //     color: () => '#4BC0C0',
    //     strokeWidth: 2,
    //   },
    ],
    legend: ['Nhịp tim'],
  };

  // Lựa chọn dữ liệu dựa vào chế độ xem
  const getChartData = () => {
    switch (viewMode) {
      case 'monthly':
        return monthlyData;
      case 'daily':
        return dailyData;
      case 'weekly':
        return weeklyData;
      default:
        return dailyData;
    }
  };

  // Lấy tiêu đề dựa trên chế độ xem
  const getChartTitle = () => {
    switch (viewMode) {
      case 'monthly':
        return 'Diễn biến theo tuần trong tháng';
      case 'daily':
        return 'Diễn biến theo giờ trong ngày';
      case 'weekly':
        return 'Diễn biến theo thứ trong tuần';
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
                      source={require('../../../assets/avatar.jpg')}
                    />    
                  </TouchableOpacity>
                </View>
              </View>
      <Text style={styles.title}>Biểu đồ nhịp tim và huyết áp</Text>
      <Text style={styles.subtitle}>{getChartTitle()}</Text>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={getChartData()}
          width={Dimensions.get('window').width - 20}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
            },
          }}
          bezier 
          style={styles.chart}
          yAxisSuffix="" 
          withDots={false}
        />
      </View>

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
          <Text style={[styles.infoValue, { color: '#FF6384' }]}>78 BPM</Text>
        </View>
        {/* <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Huyết áp trung bình</Text>
          <Text style={[styles.infoValue, { color: '#36A2EB' }]}>122/82 mmHg</Text>
        </View> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },header: {
    flexDirection: 'row',
    // marginTop: 10,
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
  },
  selectedButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedButtonText: {
    color: '#fff',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
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
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HeartRateScreen;