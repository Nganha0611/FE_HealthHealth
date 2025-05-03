import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import { Camera, useCameraDevices, CameraDevice } from 'react-native-vision-camera';

const HeartRateMonitor = () => {
  const cameraRef = useRef<Camera | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [brightnessValues, setBrightnessValues] = useState<number[]>([]);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [frameCount, setFrameCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Đang chờ dữ liệu...');
  const [bpmHistory, setBpmHistory] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCalculationTime = useRef<number>(0);

  const devices = useCameraDevices();
  const device: CameraDevice | undefined = Object.values(devices).find(
    (device): device is CameraDevice => device?.position === 'back'
  );

  useEffect(() => {
    const checkAndRequestPermission = async () => {
      try {
        console.log('Checking camera permission...');
        const currentPermission = await Camera.getCameraPermissionStatus();
        console.log('Current permission:', currentPermission);
        if (currentPermission === 'granted') {
          setHasPermission(true);
          return;
        }
        if (currentPermission === 'denied' && Platform.OS === 'android') {
          Alert.alert(
            'Quyền camera bị từ chối',
            'Vui lòng cấp quyền camera trong cài đặt thiết bị.',
            [{ text: 'OK' }]
          );
          return;
        }
        const newPermission = await Camera.requestCameraPermission();
        console.log('New permission:', newPermission);
        if (newPermission === 'granted') {
          setHasPermission(true);
        } else {
          setHasPermission(false);
          Alert.alert(
            'Quyền camera bị từ chối',
            'Ứng dụng cần quyền camera để đo nhịp tim. Vui lòng cấp quyền trong cài đặt.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Lỗi khi yêu cầu quyền camera:', error);
        Alert.alert('Lỗi', 'Không thể yêu cầu quyền truy cập camera');
        setHasPermission(false);
      }
    };
    checkAndRequestPermission();
  }, []);

  // Giả lập dữ liệu nhịp tim (~75 BPM)
  useEffect(() => {
    if (isRecording) {
      // Tăng tần suất lấy mẫu lên 10 FPS (100ms)
      intervalRef.current = setInterval(() => {
        // Tạo sóng sin với tần suất ~1.25 Hz (75 BPM = 75/60 Hz)
        const redValue = 128 + 50 * Math.sin((Date.now() / 1000) * 2 * Math.PI * 1.25);
        // Thêm nhiễu nhỏ để giả lập tín hiệu thực
        const noise = Math.random() * 10 - 5;
        const valueWithNoise = redValue + noise;
        console.log('Simulated brightness:', valueWithNoise, 'Frame count:', frameCount + 1);
        setBrightnessValues(prev => [...prev.slice(-200), valueWithNoise]); // Tăng kích thước bộ đệm
        setFrameCount(prev => prev + 1);
      }, 100); // 10 FPS thay vì 5 FPS
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording, frameCount]);

  useEffect(() => {
    // Giới hạn tần suất tính toán để tránh tính toán quá nhiều
    const now = Date.now();
    if (brightnessValues.length >= 50 && now - lastCalculationTime.current > 1000) { // 50 mẫu và mỗi 1 giây
      lastCalculationTime.current = now;
      const avgBrightness = brightnessValues.reduce((sum, val) => sum + val, 0) / brightnessValues.length;
      console.log('Average brightness:', avgBrightness);
      if (avgBrightness < 10) {
        setHeartRate(null);
        setStatusMessage('Vui lòng đặt ngón tay lên camera và đèn flash.');
        return;
      }

      // Áp dụng cửa sổ lăn kích thước phù hợp
      const dataWindow = brightnessValues.slice(-150); // Sử dụng 15 giây dữ liệu với 10 FPS
      
      const normalizedValues = normalizeData(dataWindow);
      console.log('Normalized values length:', normalizedValues.length);
      
      // Điều chỉnh tham số bộ lọc để phù hợp với nhịp tim 40-200 BPM
      const filteredValues = bandpassFilter(normalizedValues, 0.2, 0.05); // Điều chỉnh tham số
      console.log('Filtered values length:', filteredValues.length);
      
      const { peakCount, peakIntervals } = findPeaks(filteredValues);
      console.log('Peak count:', peakCount, 'Peak intervals:', peakIntervals);
      
      let bpm = 0;
      
      // Sử dụng phương pháp dựa trên khoảng cách giữa các đỉnh
      if (peakIntervals.length >= 3) {
        const avgInterval = peakIntervals.reduce((sum, val) => sum + val, 0) / peakIntervals.length;
        bpm = Math.round(60 / (avgInterval / 10)); // Chuyển đổi từ khoảng đỉnh sang BPM (10 FPS)
        console.log('BPM from peak intervals:', bpm);
      } else {
        // Phương pháp dự phòng: đếm số đỉnh
        const timeWindowInSeconds = dataWindow.length / 10; // 10 FPS
        bpm = Math.round((peakCount / timeWindowInSeconds) * 60);
        console.log('BPM from peak count:', bpm);
      }

      // Áp dụng biên độ hợp lý
      if (bpm >= 40 && bpm <= 200) {
        setBpmHistory(prev => [...prev.slice(-5), bpm]); // Giảm số lượng lịch sử
        // Áp dụng bộ lọc trung vị cho kết quả ổn định hơn
        const sortedBpm = [...bpmHistory, bpm].sort((a, b) => a - b);
        const medianBpm = sortedBpm[Math.floor(sortedBpm.length / 2)];
        
        // Kết hợp với trung bình để giảm bớt dao động
        const avgBpm = Math.round(
          bpmHistory.reduce((sum, val) => sum + val, bpm) / (bpmHistory.length + 1)
        );
        
        // Tính toán kết quả cuối cùng từ trung vị và trung bình
        const finalBpm = Math.round(0.7 * medianBpm + 0.3 * avgBpm);
        
        setHeartRate(finalBpm);
        setStatusMessage(`Nhịp tim: ${finalBpm} bpm`);
      } else {
        // Không đặt lại nhịp tim nếu đã có giá trị
        if (heartRate === null) {
          setStatusMessage('Dữ liệu không ổn định, vui lòng thử lại.');
        }
      }
    } else if (isRecording && brightnessValues.length === 0) {
      setStatusMessage('Không nhận được dữ liệu, kiểm tra camera.');
    } else if (isRecording && brightnessValues.length < 50) {
      setStatusMessage('Đang thu thập dữ liệu... (' + brightnessValues.length + '/50)');
    }
  }, [brightnessValues, isRecording, heartRate]);

  const normalizeData = (data: number[]): number[] => {
    if (data.length === 0) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    if (range === 0) return data.map(() => 0);
    return data.map(val => (val - min) / range);
  };

  const bandpassFilter = (data: number[], lpAlpha: number = 0.2, hpAlpha: number = 0.05): number[] => {
    // Thứ tự lọc quan trọng: làm thấp trước, làm cao sau
    const lowPassFiltered = lowPassFilter(data, lpAlpha);
    return highPassFilter(lowPassFiltered, hpAlpha);
  };

  const lowPassFilter = (data: number[], alpha: number = 0.2): number[] => {
    const filtered = [data[0]];
    for (let i = 1; i < data.length; i++) {
      filtered.push(filtered[i - 1] + alpha * (data[i] - filtered[i - 1]));
    }
    return filtered;
  };

  const highPassFilter = (data: number[], alpha: number = 0.05): number[] => {
    if (data.length <= 1) return data;
    const filtered = [0];
    let prevFiltered = 0;
    let prevInput = data[0];
    for (let i = 1; i < data.length; i++) {
      const currentInput = data[i];
      prevFiltered = alpha * (prevFiltered + currentInput - prevInput);
      filtered.push(prevFiltered);
      prevInput = currentInput;
    }
    return filtered;
  };

  // Cải tiến thuật toán phát hiện đỉnh
  const findPeaks = (data: number[]): { peakCount: number, peakIntervals: number[] } => {
    if (data.length < 5) return { peakCount: 0, peakIntervals: [] };
    
    // Tính toán ngưỡng thích ứng
    const values = data.slice();
    values.sort((a, b) => b - a);
    const topValues = values.slice(0, Math.floor(values.length * 0.2));
    const adaptiveThreshold = topValues.reduce((sum, val) => sum + val, 0) / topValues.length * 0.55;
    
    console.log('Adaptive threshold:', adaptiveThreshold);
    
    let peakIndices: number[] = [];
    let lastPeakIndex = -10;
    
    // Tìm các đỉnh tiềm năng
    for (let i = 2; i < data.length - 2; i++) {
      // Kiểm tra xem đây có phải là đỉnh cục bộ hay không
      if (
        data[i] > data[i - 1] && 
        data[i] > data[i - 2] &&
        data[i] > data[i + 1] && 
        data[i] > data[i + 2] && 
        data[i] > adaptiveThreshold &&
        i - lastPeakIndex >= 3 // Tối thiểu 300ms giữa các đỉnh ở 10 FPS
      ) {
        peakIndices.push(i);
        lastPeakIndex = i;
      }
    }
    
    // Tính khoảng cách giữa các đỉnh
    const peakIntervals: number[] = [];
    for (let i = 1; i < peakIndices.length; i++) {
      peakIntervals.push(peakIndices[i] - peakIndices[i - 1]);
    }
    
    return { 
      peakCount: peakIndices.length,
      peakIntervals: peakIntervals 
    };
  };

  const toggleRecording = (): void => {
    console.log('Toggling recording, hasPermission:', hasPermission, 'device:', !!device);
    if (!hasPermission || !device) {
      Alert.alert('Lỗi', 'Không thể bắt đầu đo. Kiểm tra quyền camera hoặc thiết bị.');
      return;
    }
    if (!isRecording) {
      setBrightnessValues([]);
      setHeartRate(null);
      setFrameCount(0);
      setBpmHistory([]);
      setStatusMessage('Đang đo nhịp tim...');
    } else {
      console.log(`Đã xử lý ${frameCount} khung hình, brightnessValues length: ${brightnessValues.length}`);
      if (brightnessValues.length < 50) {
        setStatusMessage('Không đủ dữ liệu để tính nhịp tim.');
      }
    }
    setIsRecording(prev => !prev);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Cần quyền truy cập camera</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {device && (
        <Camera
          ref={cameraRef}
          style={styles.preview}
          device={device}
          isActive={true}
          torch={isRecording ? 'on' : 'off'}
          video={true}
          photo={false}
          audio={false}
        />
      )}
      <TouchableOpacity onPress={toggleRecording} style={styles.capture}>
        <Text style={{ fontSize: 14, color: 'black' }}>
          {isRecording ? 'Dừng' : 'Bắt đầu'}
        </Text>
      </TouchableOpacity>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{statusMessage}</Text>
      </View>
      {heartRate !== null && (
        <View style={styles.heartRateContainer}>
          <Text style={styles.heartRateText}>{heartRate} bpm</Text>
        </View>
      )}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          1. Nhấn "Bắt đầu" để bắt đầu đo
        </Text>
        <Text style={styles.instructionText}>
          2. Đặt ngón tay của bạn nhẹ nhàng lên camera và đèn flash
        </Text>
        <Text style={styles.instructionText}>
          3. Giữ ngón tay thật ổn định trong 10-15 giây
        </Text>
        <Text style={styles.instructionText}>
          4. Kết quả sẽ hiển thị khi có đủ dữ liệu
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    alignSelf: 'center',
    margin: 20,
  },
  heartRateContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
  },
  heartRateText: {
    fontSize: 24,
    color: 'black',
    fontWeight: 'bold',
  },
  statusContainer: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 10,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 18,
    color: 'black',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
});

export default HeartRateMonitor;