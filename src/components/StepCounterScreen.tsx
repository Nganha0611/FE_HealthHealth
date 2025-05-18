import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import GoogleFit, { Scopes } from 'react-native-google-fit';

const StepCounterScreen: React.FC = () => {
  const [stepCount, setStepCount] = useState<number | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  // Các quyền cần thiết cho Google Fit
 const options = {
  scopes: [
    Scopes.FITNESS_ACTIVITY_READ, // Đủ để đọc dữ liệu bước chân
    Scopes.FITNESS_BODY_READ,
    Scopes.FITNESS_LOCATION_READ,
    Scopes.FITNESS_NUTRITION_READ,
    Scopes.FITNESS_SLEEP_READ,
  ],
};

  // Yêu cầu quyền truy cập Google Fit
  const authorizeFit = async () => {
  try {
    const authResult = await GoogleFit.authorize(options);
    console.log('Authorize result:', JSON.stringify(authResult, null, 2));
    if (authResult.success) {
      setIsAuthorized(true);
      Alert.alert('Thành công', 'Đã được cấp quyền truy cập Google Fit!');
    } else {
      Alert.alert('Lỗi', `Không thể cấp quyền: ${authResult.message || 'Không có thông tin lỗi'}`);
    }
  } catch (error) {
    console.error('Lỗi khi cấp quyền:', (error as Error).message, error);
    Alert.alert('Lỗi', 'Có lỗi xảy ra khi cấp quyền: ' + (error as Error).message);
  }
};

  // Lấy dữ liệu bước chân trong 24 giờ qua
  const getStepCount = async () => {
    if (!isAuthorized) {
      Alert.alert('Lỗi', 'Vui lòng cấp quyền trước khi lấy dữ liệu!');
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // 24 giờ trước
    const endDate = new Date();

    const stepOptions = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      bucketUnit: 'DAY' as any,
      bucketInterval: 1,
    };

    try {
     const res = await GoogleFit.getDailyStepCountSamples(stepOptions);
if (res.length > 0) {
  const totalSteps = res.reduce((sum, entry) => {
    const stepsInEntry = entry.steps.reduce((subSum, step) => subSum + (step.value || 0), 0);
    return sum + stepsInEntry;
  }, 0);
  setStepCount(totalSteps);
  Alert.alert('Kết quả', `Tổng số bước chân trong 24 giờ qua: ${totalSteps}`);
}
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu bước chân:', error);
      Alert.alert('Lỗi', 'Không thể lấy dữ liệu bước chân: ' + (error as Error).message);
    }
  };

  // Kiểm tra quyền khi component mount
  useEffect(() => {
    authorizeFit();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Lấy Dữ Liệu Bước Chân</Text>
      <Text style={styles.status}>
        Trạng thái: {isAuthorized ? 'Đã cấp quyền' : 'Chưa cấp quyền'}
      </Text>
      {stepCount !== null && (
        <Text style={styles.stepCount}>Số bước chân: {stepCount}</Text>
      )}
      <Button title="Yêu cầu quyền" onPress={authorizeFit} disabled={isAuthorized} />
      <Button title="Lấy dữ liệu bước chân" onPress={getStepCount} disabled={!isAuthorized} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  stepCount: {
    fontSize: 18,
    marginVertical: 20,
    color: '#000',
  },
});

export default StepCounterScreen;