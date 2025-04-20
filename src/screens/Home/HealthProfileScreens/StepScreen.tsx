import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { View, Dimensions, StyleSheet, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';

type Props = {
  navigation: NavigationProp<any>;
};

const StepScreen: React.FC<Props> = ({ navigation }) => {
  const horizontalScrollRef = useRef<ScrollView>(null);

  // Dữ liệu số bước chân theo ngày - 15 ngày gần nhất
  const stepData = {
    labels: ['3/4', '4/4', '5/4', '6/4', '7/4', '8/4', '9/4', '10/4', '11/4', '12/4', '13/4', '14/4', '15/4', '16/4', '17/4'],
    datasets: [
      {
        data: [7533, 8245, 6891, 10352, 8643, 9127, 7560, 11245, 8976, 7432, 9851, 8532, 10231, 9132, 8756],
      }
    ],
  };
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
  const primaryColor = '#3CB371';
  const darkPrimaryColor = '#2E8B57';

  const calculateChartWidth = () => {
    const pointCount = stepData.labels.length;

    const minWidth = Math.max(pointCount * 40, Dimensions.get('window').width - 40);
    return minWidth;
  };

  const calculateAverageSteps = () => {
    const steps = stepData.datasets[0].data;
    const sum = steps.reduce((a, b) => a + b, 0);
    return Math.round(sum / steps.length);
  };

  const getMaxSteps = () => {
    return Math.max(...stepData.datasets[0].data);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesome5Icon
            name="chevron-left"
            size={20}
            color="#432c81"
            style={{ marginRight: 15, marginTop: 17 }}
            onPress={() => navigation.goBack()}
          />
          <Text style={[styles.text1, { fontSize: 30, marginTop: 5, color: "#432c81" }]}>Số bước</Text>
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

      <Text style={[styles.title, { color: primaryColor }]}>Biểu đồ số bước chân</Text>
      <Text style={styles.subtitle}>Diễn biến theo ngày</Text>

      <View style={styles.chartOuterContainer}>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          ref={horizontalScrollRef}
          contentContainerStyle={styles.horizontalScrollContainer}
        >
          <View style={[styles.chartContainer, { width: calculateChartWidth() + 20 }]}>
            <BarChart
              data={stepData}
              width={calculateChartWidth()}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 0.6) => `rgba(60, 179, 113, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                  paddingRight: 10,
                },
                barPercentage: 0.5,
                propsForLabels: {
                  fontSize: 10,
                },
              }}
              style={styles.chart}
              fromZero
              showValuesOnTopOfBars={true}
              withInnerLines={true}
            //   formatYLabel={(value) => {
            //     // Rút gọn số bước lớn thành kB (nghìn bước)
            //     const numValue = parseInt(value);
            //     if (numValue >= 1000) {
            //       return `${(numValue / 1000).toFixed(1)}k`;
            //     }
            //     return value;
            //   }}
            />
          </View>
        </ScrollView>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Số bước trung bình</Text>
          <Text style={[styles.infoValue, { color: primaryColor }]}>{calculateAverageSteps()} bước</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Số bước cao nhất</Text>
          <Text style={[styles.infoValue, { color: darkPrimaryColor }]}>{getMaxSteps()} bước</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItemFull}>
          <Text style={styles.infoLabel}>Mục tiêu hàng ngày</Text>
          <Text style={[styles.infoValue, { color: primaryColor }]}>6000 bước</Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(calculateAverageSteps() / 6000 * 100, 100)}%`, backgroundColor: darkPrimaryColor }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(calculateAverageSteps() / 6000 * 100)}% mục tiêu đạt được
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text1: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#432c81',
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
  chartOuterContainer: {
    marginHorizontal: 0,
  },
  horizontalScrollContainer: {
  },
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 40,
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
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  progressText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  }
});

export default StepScreen;