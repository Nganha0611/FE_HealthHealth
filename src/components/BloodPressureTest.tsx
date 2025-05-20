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

// Định nghĩa kiểu PressureResult
interface PressureResult {
  inMillimetersOfMercury: number;
}

interface BloodPressureData {
  time: string;
  systolic: number;
  diastolic: number;
}

const BloodPressureTest: React.FC = () => {
  const [bloodPressure, setBloodPressure] = useState<BloodPressureData[]>([]);
  const [aggregatedBloodPressure, setAggregatedBloodPressure] = useState<
    { startTime: string; systolic: number; diastolic: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHealthConnectAvailable, setIsHealthConnectAvailable] = useState<boolean | null>(null);

  const getEarliestTime = () => {
    return new Date(0); // Từ thời điểm Unix epoch (01/01/1970)
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
      const permissions = await requestPermission([{ accessType: 'read', recordType: 'BloodPressure' }]);
      console.log('Granted permissions:', permissions);
      if (permissions.length === 0) {
        throw new Error('No permissions granted for BloodPressure');
      }
      return true;
    } catch (err) {
      console.error('Error requesting permissions:', err);
      setError('Không thể yêu cầu quyền truy cập: ' + (err as Error).message);
      return false;
    }
  };

  const readBloodPressureData = async () => {
    try {
      const response = await readRecords('BloodPressure', {
        timeRangeFilter: {
          operator: 'between',
          startTime: getEarliestTime().toISOString(),
          endTime: now().toISOString(),
        },
      });
      console.log('Blood pressure records:', JSON.stringify(response, null, 2));
      if (!response.records || response.records.length === 0) {
        console.warn('No blood pressure records found');
        return [];
      }
      const bloodPressureData: BloodPressureData[] = response.records.map((record) => ({
        time: record.time ?? '',
        systolic: record.systolic?.inMillimetersOfMercury ?? 0,
        diastolic: record.diastolic?.inMillimetersOfMercury ?? 0,
      }));
      return bloodPressureData;
    } catch (err) {
      console.error('Error reading blood pressure data:', err);
      throw err;
    }
  };

  const manualAggregateBloodPressureData = (bpData: BloodPressureData[]) => {
    if (!bpData || bpData.length === 0) {
      console.warn('No data to aggregate manually');
      return [];
    }

    // Nhóm dữ liệu theo ngày
    const dailyBuckets: { [key: string]: { systolic: number; diastolic: number; count: number; startTime: string } } = {};
    bpData.forEach((record) => {
      const recordDate = new Date(record.time);
      if (isNaN(recordDate.getTime())) {
        console.warn('Invalid date encountered:', record.time);
        return; // Bỏ qua bản ghi có thời gian không hợp lệ
      }
      // Lấy ngày bắt đầu của ngày (00:00:00)
      recordDate.setHours(0, 0, 0, 0);
      const dateKey = recordDate.toISOString(); // Sử dụng ISO string làm key để nhóm

      if (!dailyBuckets[dateKey]) {
        dailyBuckets[dateKey] = { systolic: 0, diastolic: 0, count: 0, startTime: dateKey };
      }
      dailyBuckets[dateKey].systolic += record.systolic;
      dailyBuckets[dateKey].diastolic += record.diastolic;
      dailyBuckets[dateKey].count += 1;
    });

    // Chuyển đổi dữ liệu thành định dạng mong muốn
    const aggregatedData = Object.entries(dailyBuckets).map(([_, { systolic, diastolic, count, startTime }]) => ({
      startTime,
      systolic: systolic / count,
      diastolic: diastolic / count,
    }));

    console.log('Manually aggregated blood pressure data:', JSON.stringify(aggregatedData, null, 2));
    return aggregatedData;
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
        setError('Không được cấp quyền truy cập dữ liệu huyết áp');
        setIsLoading(false);
        return;
      }
      const bloodPressureData = await readBloodPressureData();
      setBloodPressure(bloodPressureData);

      // Tổng hợp thủ công
      const aggregatedData = manualAggregateBloodPressureData(bloodPressureData);
      setAggregatedBloodPressure(aggregatedData);

      if (bloodPressureData.length === 0 && aggregatedData.length === 0) {
        setError('Không có dữ liệu huyết áp từ trước đến giờ. Vui lòng kiểm tra Health Connect.');
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
      <Text style={styles.title}>Dữ liệu huyết áp</Text>
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
          {aggregatedBloodPressure.length > 0 ? (
            <>
              <Text style={styles.subtitle}>Tổng hợp theo ngày (từ trước đến giờ):</Text>
              {aggregatedBloodPressure.map((item, index) => (
                <View key={`agg-${index}`} style={styles.dataItem}>
                  <Text style={styles.dataDate}>
                    Ngày: {new Date(item.startTime).toLocaleDateString('vi-VN')}
                  </Text>
                  <Text style={styles.dataText}>
                    Huyết áp: {item.systolic.toFixed(1)}/{item.diastolic.toFixed(1)} mmHg
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.status}>Không có dữ liệu tổng hợp để hiển thị</Text>
          )}
          {bloodPressure.length > 0 && (
            <>
              <Text style={styles.subtitle}>Dữ liệu chi tiết:</Text>
              {bloodPressure.map((item, index) => (
                <View key={`detail-${index}`} style={styles.dataItem}>
                  <Text style={styles.dataText}>Thời gian: {formatDate(item.time)}</Text>
                  <Text style={styles.dataCount}>
                    Huyết áp: {item.systolic.toFixed(1)}/{item.diastolic.toFixed(1)} mmHg
                  </Text>
                </View>
              ))}
            </>
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
  dataDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
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

export default BloodPressureTest;