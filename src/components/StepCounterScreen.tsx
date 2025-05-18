import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, TextInput } from 'react-native';
import {
  initialize,
  getSdkStatus,
  requestPermission,
  readRecords,
  aggregateGroupByPeriod,
  SdkAvailabilityStatus,
  openHealthConnectSettings,
  StepsRecord,
} from 'react-native-health-connect';

// Định nghĩa kiểu dữ liệu cho bước đi
interface StepData {
  startTime: string;
  endTime: string;
  count: number;
}

const TestCounterScreen = () => {
  const [steps, setSteps] = useState<StepData[]>([]);
  const [aggregatedSteps, setAggregatedSteps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHealthConnectAvailable, setIsHealthConnectAvailable] = useState<boolean | null>(null);

  // Hàm lấy ngày bắt đầu của 7 ngày qua
  const getBeginningOfLast7Days = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Hàm lấy thời gian hiện tại
  const now = () => {
    return new Date();
  };

  // Khởi tạo Health Connect
  const initializeHealthConnect = async () => {
    try {
      const result = await initialize();
      console.log('Health Connect initialization result:', result);
      
      // Kiểm tra xem Health Connect có khả dụng không
      const status = await getSdkStatus();
      console.log('Health Connect status:', status);
      
      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
        console.log('Health Connect SDK is available');
        setIsHealthConnectAvailable(true);
        return true;
      } else {
        console.log('Health Connect SDK is not available');
        setIsHealthConnectAvailable(false);
        if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
          setError('Health Connect cần được cập nhật. Vui lòng cập nhật ứng dụng Health Connect.');
        } else {
          setError('Health Connect không khả dụng trên thiết bị này.');
        }
        return false;
      }
    } catch (err) {
      console.error('Error initializing Health Connect:', err);
      setError('Không thể khởi tạo Health Connect: ' + (err as Error).message);
      return false;
    }
  };

  // Yêu cầu quyền truy cập
  const requestHealthPermissions = async () => {
    try {
      const permissions = await requestPermission([
        {
          accessType: 'read',
          recordType: 'Steps',
        }
      ]);
      console.log('Granted permissions:', permissions);
      return permissions.length > 0;
    } catch (err) {
      console.error('Error requesting permissions:', err);
      setError('Không thể yêu cầu quyền truy cập: ' + (err as Error).message);
      return false;
    }
  };

 const readStepsData = async () => {
  try {
    const response = await readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: getBeginningOfLast7Days().toISOString(),
        endTime: now().toISOString(),
      },
    });
    
    console.log('Steps records:', response);
    
    // Xử lý đúng kiểu dữ liệu trả về từ readRecords
    const stepsData: StepData[] = [];
    for (const record of response.records) {
      stepsData.push({
        startTime: record.startTime,
        endTime: record.endTime,
        count: record.count || 0,
      });
    }
    
    return stepsData;
  } catch (err) {
    console.error('Error reading steps data:', err);
    throw err;
  }
};

  // Tổng hợp dữ liệu bước chân theo ngày
  const aggregateStepsData = async () => {
    try {
      const result = await aggregateGroupByPeriod({
        recordType: 'Steps',
        timeRangeFilter: {
          operator: 'between',
          startTime: getBeginningOfLast7Days().toISOString(),
          endTime: now().toISOString(),
        },
        timeRangeSlicer: {
          period: 'DAYS',
          length: 1,
        },
      });
      
      console.log('Aggregated steps data:', result);
      return result;
    } catch (err) {
      console.error('Error aggregating steps data:', err);
      throw err;
    }
  };

  // Lấy dữ liệu sức khỏe
  const fetchHealthData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Khởi tạo Health Connect
      const isInitialized = await initializeHealthConnect();
      if (!isInitialized) {
        setIsLoading(false);
        return;
      }

      // Yêu cầu quyền truy cập
      const granted = await requestHealthPermissions();
      if (!granted) {
        setError('Không được cấp quyền truy cập dữ liệu sức khỏe');
        setIsLoading(false);
        return;
      }

      // Lấy dữ liệu chi tiết
      const stepsData = await readStepsData();
      setSteps(stepsData);

      // Lấy dữ liệu tổng hợp theo ngày
      const aggregatedData = await aggregateStepsData();
      setAggregatedSteps(aggregatedData);

      if (stepsData.length === 0 && aggregatedData.length === 0) {
        setError('Không có dữ liệu số bước trong khoảng thời gian này');
      }
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu Health Connect:', err);
      setError('Đã xảy ra lỗi khi lấy dữ liệu: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const handleRefresh = () => {
    fetchHealthData();
  };

  const openSettings = () => {
    openHealthConnectSettings();
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Kiểm Tra Health Connect</Text>
      
      {isHealthConnectAvailable === false && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>Health Connect không khả dụng hoặc cần được cập nhật</Text>
          <Button
            title="Mở cài đặt Health Connect"
            onPress={openSettings}
            color="#4D2D7D"
          />
        </View>
      )}
      
      {isLoading ? (
        <Text style={styles.status}>Đang tải dữ liệu...</Text>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          {aggregatedSteps.length > 0 && (
            <>
              <Text style={styles.subtitle}>Tổng hợp theo ngày (7 ngày qua):</Text>
              {aggregatedSteps.map((item, index) => (
                <View key={`agg-${index}`} style={styles.stepItem}>
                  <Text style={styles.stepDate}>
                    Ngày: {new Date(item.startTime).toLocaleDateString('vi-VN')}
                  </Text>
                  <Text style={styles.stepText}>Số bước: {item.result.count}</Text>
                </View>
              ))}
            </>
          )}

          {steps.length > 0 && (
            <>
              <Text style={styles.subtitle}>Dữ liệu chi tiết:</Text>
              {steps.map((item, index) => (
                <View key={`detail-${index}`} style={styles.stepItem}>
                  <Text style={styles.stepText}>
                    Từ: {formatDate(item.startTime)}
                  </Text>
                  <Text style={styles.stepText}>
                    Đến: {formatDate(item.endTime)}
                  </Text>
                  <Text style={styles.stepCount}>Số bước: {item.count}</Text>
                </View>
              ))}
            </>
          )}

          {steps.length === 0 && aggregatedSteps.length === 0 && (
            <Text style={styles.status}>Không có dữ liệu số bước để hiển thị</Text>
          )}
        </>
      )}
      
      <View style={styles.buttonContainer}>
        <Button
          title={isLoading ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
          onPress={handleRefresh}
          disabled={isLoading}
          color="#4D2D7D"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F9FBFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4D2D7D',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 10,
  },
  stepItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  stepDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  stepCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4D2D7D',
    marginTop: 5,
  },
  status: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  error: {
    fontSize: 16,
    color: '#D32F2F',
    marginBottom: 20,
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 5,
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  warningText: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default TestCounterScreen;