import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import {
  initialize,
  getSdkStatus,
  requestPermission,
  readRecords,
  SdkAvailabilityStatus,
  openHealthConnectSettings,
} from 'react-native-health-connect';

interface HeartRateData {
  startTime: string;
  endTime: string;
  bpm: number;
}

const HeartRateTest: React.FC = () => {
  const [heartRate, setHeartRate] = useState<HeartRateData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHealthConnectAvailable, setIsHealthConnectAvailable] = useState<boolean | null>(null);

  const getBeginningOfLast7Days = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const now = () => new Date();

  const initializeHealthConnect = async () => {
    try {
      const result = await initialize();
      console.log('Health Connect initialization result:', result);
      const status = await getSdkStatus();
      console.log('Health Connect status:', status);
      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
        setIsHealthConnectAvailable(true);
        return true;
      } else {
        setIsHealthConnectAvailable(false);
        setError(
          status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
            ? 'Health Connect cần được cập nhật.'
            : 'Health Connect không khả dụng trên thiết bị này.'
        );
        return false;
      }
    } catch (err) {
      console.error('Error initializing Health Connect:', err);
      setError('Không thể khởi tạo Health Connect: ' + (err as Error).message);
      return false;
    }
  };

  const requestHealthPermissions = async () => {
    try {
      const permissions = await requestPermission([{ accessType: 'read', recordType: 'HeartRate' }]);
      console.log('Granted permissions:', permissions);
      return permissions.length > 0;
    } catch (err) {
      console.error('Error requesting permissions:', err);
      setError('Không thể yêu cầu quyền truy cập: ' + (err as Error).message);
      return false;
    }
  };

  const readHeartRateData = async () => {
    try {
      const response = await readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: getBeginningOfLast7Days().toISOString(),
          endTime: now().toISOString(),
        },
      });
      console.log('Heart rate records:', response);
      const heartRateData: HeartRateData[] = response.records.map((record) => ({
        startTime: record.startTime,
        endTime: record.endTime,
        bpm: record.samples && record.samples[0] ? record.samples[0].beatsPerMinute || 0 : 0,
      }));
      return heartRateData;
    } catch (err) {
      console.error('Error reading heart rate data:', err);
      throw err;
    }
  };

  const fetchHealthData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const isInitialized = await initializeHealthConnect();
      if (!isInitialized) {
        setIsLoading(false);
        return;
      }
      const granted = await requestHealthPermissions();
      if (!granted) {
        setError('Không được cấp quyền truy cập dữ liệu sức khỏe');
        setIsLoading(false);
        return;
      }
      const heartRateData = await readHeartRateData();
      setHeartRate(heartRateData);
      if (heartRateData.length === 0) {
        setError('Không có dữ liệu nhịp tim trong khoảng thời gian này. Vui lòng kiểm tra Health Connect.');
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
      <Text style={styles.title}>Dữ liệu nhịp tim</Text>
      {isHealthConnectAvailable === false && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>{error}</Text>
          <Button
            title="Mở cài đặt Health Connect"
            onPress={openHealthConnectSettings}
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
          {heartRate.length > 0 ? (
            <>
              <Text style={styles.subtitle}>Dữ liệu chi tiết:</Text>
              {heartRate.map((item, index) => (
                <View key={`hr-${index}`} style={styles.dataItem}>
                  <Text style={styles.dataText}>Từ: {formatDate(item.startTime)}</Text>
                  <Text style={styles.dataText}>Đến: {formatDate(item.endTime)}</Text>
                  <Text style={styles.dataCount}>Nhịp tim: {item.bpm} bpm</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.status}>Không có dữ liệu nhịp tim để hiển thị</Text>
          )}
        </>
      )}
      <View style={styles.buttonContainer}>
        <Button
          title={isLoading ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
          onPress={fetchHealthData}
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
    marginVertical: 10,
  },
  dataItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dataText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  dataCount: {
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

export default HeartRateTest;