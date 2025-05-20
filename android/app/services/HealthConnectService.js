import HealthConnect from 'react-native-health-connect';

export const initializeHealthConnect = async () => {
  try {
    const isAvailable = await HealthConnect.isAvailable();
    if (!isAvailable) {
      console.log('Health Connect is not available on this device');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error initializing Health Connect:', error);
    return false;
  }
};

export const requestPermissions = async () => {
  const permissions = [
    'StepCount',
  ]; // Chỉ yêu cầu quyền StepCount để đơn giản hóa
  try {
    const granted = await HealthConnect.requestPermissions(permissions);
    return granted;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};

export const getStepsData = async (startDate, endDate) => {
  try {
    const steps = await HealthConnect.getSteps({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    // Trả về mảng với các đối tượng { startTime, endTime, count }
    return steps.map(item => ({
      startTime: item.startTime,
      endTime: item.endTime,
      count: item.count || 0, // Sử dụng 'count' thay vì 'value'
    }));
  } catch (error) {
    console.error('Error fetching steps:', error);
    return [];
  }
};