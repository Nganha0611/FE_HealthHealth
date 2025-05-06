import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import DropDownPicker from 'react-native-dropdown-picker';
import DatePicker from 'react-native-date-picker';
import { BottomTabParamList } from '../../../navigation/BottomTabs';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../utils/config';

type Props = {
  navigation: NavigationProp<any>;
};

// Định nghĩa kiểu Medicine khớp với model Prescription ở backend
type Medicine = {
  id?: string;
  name: string;
  form: string;
  strength: string | number;
  unit: string;
  amount: string | number;
  instruction: string;
  startday: string;
  repeatDetails?: { // Đổi từ repeat_details thành repeatDetails
    type: string;
    interval: string | number;
    daysOfWeek: string[]; // Đổi từ days_of_week thành daysOfWeek
    daysOfMonth: string[]; // Đổi từ days_of_month thành daysOfMonth
    timePerDay: string[]; // Đổi từ time_per_day thành timePerDay
  };
};

const MedicineManagerScreen: React.FC<Props> = ({ navigation }) => {
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const [isModalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [instruction, setInstruction] = useState('');
  const [amount, setAmount] = useState('');
  const [startday, setStartday] = useState('');
  const [currentMedicineId, setCurrentMedicineId] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  
  // Trạng thái cho dropdown
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState('');
  const [openUnit, setOpenUnit] = useState(false);
  const [unit, setUnit] = useState('');
  const [openRepeatType, setOpenRepeatType] = useState(false);
  const [repeatType, setRepeatType] = useState('');
  const [openRepeatInterval, setOpenRepeatInterval] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState('');

  // Trạng thái cho các lựa chọn
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<string[]>([]);
  const [selectedDaysOfMonth, setSelectedDaysOfMonth] = useState<string[]>([]);
  const [selectedTimesPerDay, setSelectedTimesPerDay] = useState<string[]>([]);
  
  // Date picker
  const [openDate, setOpenDate] = useState(false);
  const [date, setDate] = useState(new Date());

  // Các mục cho dropdown
  const medicineFormItems = [
    { label: 'Viên nén', value: 'tablet' },
    { label: 'Viên nang', value: 'capsule' },
    { label: 'Dung dịch', value: 'solution' },
    { label: 'Thuốc tiêm', value: 'injection' },
    { label: 'Thuốc mỡ', value: 'ointment' },
    { label: 'Thuốc nhỏ mắt', value: 'eye_drops' },
    { label: 'Thuốc hít', value: 'inhaler' },
  ];

  const unitItems = [
    { label: 'mg', value: 'mg' },
    { label: 'g', value: 'g' },
    { label: 'ml', value: 'ml' },
    { label: 'viên', value: 'viên' },
    { label: 'ống', value: 'ống' },
    { label: 'giọt', value: 'giọt' },
    { label: 'mcg', value: 'mcg' },
  ];

  const repeatTypeItems = [
    { label: 'Hằng ngày', value: 'daily' },
    { label: 'Hằng tuần', value: 'weekly' },
    { label: 'Hằng tháng', value: 'monthly' },
  ];

  // Giới hạn khoảng cách chu kỳ từ 1-4
  const repeatIntervalItems = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
  ];

  const daysOfWeekItems = [
    { id: 'CN', label: 'CN' },
    { id: 'T2', label: 'T2' },
    { id: 'T3', label: 'T3' },
    { id: 'T4', label: 'T4' },
    { id: 'T5', label: 'T5' },
    { id: 'T6', label: 'T6' },
    { id: 'T7', label: 'T7' },
  ];

  const daysOfMonthItems = Array.from({ length: 31 }, (_, i) => ({
    id: `${i + 1}`,
    label: `${i + 1}`,
  }));

  const timePerDayItems = [
    { id: '06:00', label: '06:00' },
    { id: '08:00', label: '08:00' },
    { id: '10:00', label: '10:00' },
    { id: '12:00', label: '12:00' },
    { id: '14:00', label: '14:00' },
    { id: '17:00', label: '17:00' },
    { id: '19:00', label: '19:00' },
    { id: '20:00', label: '20:00' },
    { id: '22:00', label: '22:00' },
    { id: '23:00', label: '23:00' },
  ];

  const fetchPrescriptions = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token gửi đi:', token); // Logging để debug

      if (!token) {
        Alert.alert('Lỗi', 'Token không tồn tại. Vui lòng đăng nhập lại.');
        navigation.navigate('Login'); // Điều hướng về màn hình đăng nhập
        return;
      }

      const response = await axios.get<Medicine[]>(`${API_BASE_URL}/api/prescriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      console.log('Dữ liệu từ API /api/prescriptions:', JSON.stringify(data, null, 2));

      if (!data || data.length === 0) {
        setMedicines([]);
        Alert.alert('Thông báo', 'Không có dữ liệu đơn thuốc nào để hiển thị.');
        return;
      }

      setMedicines(data);
    } catch (error: any) {
      console.error('Lỗi khi lấy danh sách đơn thuốc:', error);
      if (error.response && error.response.status === 401) {
        Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        await AsyncStorage.removeItem('token'); // Xóa token nếu hết hạn
        navigation.navigate('Login'); // Điều hướng về màn hình đăng nhập
      } else {
        Alert.alert('Lỗi', 'Không thể lấy dữ liệu đơn thuốc. Vui lòng kiểm tra kết nối.');
      }
    }
  };

  // Gọi API khi component được mount
  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // Reset form
  const resetForm = () => {
    setCurrentMedicineId(null);
    setName('');
    setForm('');
    setStrength('');
    setUnit('');
    setAmount('');
    setInstruction('');
    setStartday('');
    setRepeatType('');
    setRepeatInterval('');
    setSelectedDaysOfWeek([]);
    setSelectedDaysOfMonth([]);
    setSelectedTimesPerDay([]);
    setDate(new Date());
  };

  // Mở modal để thêm thuốc mới
  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  // Mở modal để chỉnh sửa thuốc
  const openEditModal = (medicine: Medicine) => {
    console.log('Medicine được chỉnh sửa:', JSON.stringify(medicine, null, 2));

    setCurrentMedicineId(medicine.id || null);
    setName(medicine.name);
    setForm(medicine.form.toString());
    setStrength(medicine.strength.toString());
    setUnit(medicine.unit);
    setAmount(medicine.amount.toString());
    setInstruction(medicine.instruction);
    setStartday(medicine.startday);

    // Kiểm tra repeatDetails và cung cấp giá trị mặc định nếu không tồn tại
    if (medicine.repeatDetails) {
      setRepeatType(medicine.repeatDetails.type || '');
      setRepeatInterval(medicine.repeatDetails.interval ? medicine.repeatDetails.interval.toString() : '');
      setSelectedDaysOfWeek(medicine.repeatDetails.daysOfWeek || []);
      setSelectedDaysOfMonth(medicine.repeatDetails.daysOfMonth || []);
      setSelectedTimesPerDay(medicine.repeatDetails.timePerDay || []);
    } else {
      // Thiết lập giá trị mặc định khi không có repeatDetails
      setRepeatType('daily'); // hoặc giá trị mặc định khác
      setRepeatInterval('1');
      setSelectedDaysOfWeek([]);
      setSelectedDaysOfMonth([]);
      setSelectedTimesPerDay([]);
    }

    if (medicine.startday) {
      const [day, month, year] = medicine.startday.split('/').map(Number);
      setDate(new Date(year, month - 1, day));
    }

    setModalVisible(true);
  };

  const toggleDayOfWeek = (day: string) => {
    setSelectedDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(item => item !== day) : [...prev, day]
    );
  };

  // Chuyển đổi lựa chọn ngày trong tháng
  const toggleDayOfMonth = (day: string) => {
    setSelectedDaysOfMonth(prev =>
      prev.includes(day) ? prev.filter(item => item !== day) : [...prev, day]
    );
  };

  // Chuyển đổi lựa chọn giờ uống thuốc
  const toggleTimePerDay = (time: string) => {
    setSelectedTimesPerDay(prev =>
      prev.includes(time) ? prev.filter(item => item !== time) : [...prev, time]
    );
  };

  // Định dạng ngày
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Xử lý chọn ngày
  const handleDateConfirm = (selectedDate: Date) => {
    setDate(selectedDate);
    setStartday(formatDate(selectedDate));
    setOpenDate(false);
  };

  // Lưu hoặc cập nhật đơn thuốc
  const handleSavePrescription = async () => {
    if (!name || !form || !strength || !unit || !amount || !repeatType || !repeatInterval || !startday) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin thuốc');
      return;
    }

    if (selectedTimesPerDay.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một thời điểm uống thuốc');
      return;
    }

    const medicine: Medicine = {
      name,
      form,
      strength,
      unit,
      amount,
      instruction,
      startday,
      repeatDetails: { // Đổi từ repeat_details thành repeatDetails
        type: repeatType,
        interval: repeatInterval,
        daysOfWeek: selectedDaysOfWeek, // Đổi từ days_of_week thành daysOfWeek
        daysOfMonth: selectedDaysOfMonth, // Đổi từ days_of_month thành daysOfMonth
        timePerDay: selectedTimesPerDay, // Đổi từ time_per_day thành timePerDay
      },
    };

    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token gửi đi:', token); // Logging để debug

      if (!token) {
        Alert.alert('Lỗi', 'Token không tồn tại. Vui lòng đăng nhập lại.');
        navigation.navigate('Login');
        return;
      }

      if (currentMedicineId) {
        // Cập nhật đơn thuốc
        const response = await axios.put(
          `${API_BASE_URL}/api/prescriptions/${currentMedicineId}`,
          medicine,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMedicines(prev =>
          prev.map(med => (med.id === currentMedicineId ? response.data : med))
        );
        Alert.alert('Thành công', 'Cập nhật thuốc thành công');
      } else {
        // Tạo đơn thuốc mới
        const response = await axios.post(
          `${API_BASE_URL}/api/prescriptions`,
          medicine,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMedicines(prev => [...prev, response.data]);
        Alert.alert('Thành công', 'Thêm thuốc mới thành công');
      }

      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      console.error('Lỗi khi lưu:', error);
      if (error.response && error.response.status === 401) {
        Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        await AsyncStorage.removeItem('token'); // Xóa token nếu hết hạn
        navigation.navigate('Login'); // Điều hướng về màn hình đăng nhập
      } else {
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi lưu thông tin thuốc.');
      }
    }
  };

  // Xóa đơn thuốc
  const handleDeleteMedicine = async (id: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa thuốc này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              console.log('Token gửi đi:', token); // Logging để debug

              if (!token) {
                Alert.alert('Lỗi', 'Token không tồn tại. Vui lòng đăng nhập lại.');
                navigation.navigate('Login');
                return;
              }

              await axios.delete(`${API_BASE_URL}/api/prescriptions/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setMedicines(prev => prev.filter(med => med.id !== id));
              Alert.alert('Thành công', 'Đã xóa thuốc');
              setModalVisible(false);
            } catch (error: any) {
              console.error('Lỗi khi xóa:', error);
              if (error.response && error.response.status === 401) {
                Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                await AsyncStorage.removeItem('token'); 
                navigation.navigate('Login'); 
              } else {
                Alert.alert('Lỗi', 'Có lỗi xảy ra khi xóa thuốc.');
              }
            }
          },
        },
      ]
    );
  };

  const getMedicineFormLabel = (value: string): string => {
    const item = medicineFormItems.find(item => item.value === value);
    return item ? item.label : value;
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <FontAwesome
              name="chevron-left"
              size={20}
              color="#432c81"
              style={{ marginRight: 15, marginTop: 17 }}
              onPress={() => navigation.goBack()}
            />
            <Text style={styles.textHeader}>Quản lý thuốc</Text>
          </View>
        </View>

        {medicines.map((medicine, index) => (
          <TouchableOpacity
            key={medicine.id || index}
            style={styles.boxFeature}
            onPress={() => openEditModal(medicine)}
          >
            <Text style={styles.boxTitle}>
              {medicine.name} {medicine.strength}
              {medicine.unit}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
              <Text style={styles.titleNote}>Số lượng:</Text>
              <Text style={styles.note}>{medicine.amount}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
              <Text style={styles.titleNote}>Dạng thuốc:</Text>
              <Text style={styles.note}>{getMedicineFormLabel(medicine.form.toString())}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
              <Text style={styles.titleNote}>Ngày bắt đầu:</Text>
              <Text style={styles.note}>{medicine.startday}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { zIndex: 10000 }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <FontAwesome name="close" size={24} color="#444" />
            </TouchableOpacity>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>
                {currentMedicineId ? 'Chỉnh sửa thuốc' : 'Thêm thuốc mới'}
              </Text>

              <Text style={styles.inputLabel}>Tên thuốc</Text>
              <TextInput
                placeholder="Nhập tên thuốc"
                placeholderTextColor="#888"
                style={styles.input}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>Dạng thuốc</Text>
              <View style={{ zIndex: 6000 }}>
                <DropDownPicker
                  open={openForm}
                  setOpen={setOpenForm}
                  value={form}
                  setValue={setForm}
                  items={medicineFormItems}
                  containerStyle={styles.dropdownContainer}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownList}
                  placeholder="Chọn dạng thuốc"
                  placeholderStyle={styles.placeholder}
                  zIndex={6000}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{ nestedScrollEnabled: true }}
                />
              </View>

              <Text style={styles.inputLabel}>Liều lượng</Text>
              <TextInput
                placeholder="Nhập liều lượng"
                placeholderTextColor="#888"
                style={styles.input}
                keyboardType="numeric"
                value={strength}
                onChangeText={setStrength}
              />

              <Text style={styles.inputLabel}>Đơn vị</Text>
              <View style={{ zIndex: 5900 }}>
                <DropDownPicker
                  open={openUnit}
                  setOpen={setOpenUnit}
                  value={unit}
                  setValue={setUnit}
                  items={unitItems}
                  containerStyle={styles.dropdownContainer}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownList}
                  placeholder="Chọn đơn vị"
                  placeholderStyle={styles.placeholder}
                  zIndex={5900}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{ nestedScrollEnabled: true }}
                />
              </View>

              <Text style={styles.inputLabel}>Số lượng</Text>
              <TextInput
                placeholder="Nhập số lượng"
                placeholderTextColor="#888"
                style={styles.input}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.inputLabel}>Ngày bắt đầu</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setOpenDate(true)}
              >
                <Text style={styles.dateButtonText}>
                  {startday ? startday : 'Chọn ngày bắt đầu'}
                </Text>
                <FontAwesome name="calendar" size={18} color="#432c81" />
              </TouchableOpacity>

              <DatePicker
                modal
                open={openDate}
                date={date}
                onConfirm={handleDateConfirm}
                onCancel={() => setOpenDate(false)}
                mode="date"
                title="Chọn ngày bắt đầu"
                confirmText="Xác nhận"
                cancelText="Hủy"
              />

              <Text style={styles.modalSubtitle}>Chu kỳ uống</Text>

              <Text style={styles.inputLabel}>Loại chu kỳ</Text>
              <View style={{ zIndex: 5800 }}>
                <DropDownPicker
                  open={openRepeatType}
                  setOpen={setOpenRepeatType}
                  value={repeatType}
                  setValue={setRepeatType}
                  items={repeatTypeItems}
                  containerStyle={styles.dropdownContainer}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownList}
                  placeholder="Chọn kiểu lặp lại"
                  placeholderStyle={styles.placeholder}
                  zIndex={5800}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{ nestedScrollEnabled: true }}
                />
              </View>

              <Text style={styles.inputLabel}>Khoảng cách chu kỳ</Text>
              <View style={{ zIndex: 5700 }}>
                <DropDownPicker
                  open={openRepeatInterval}
                  setOpen={setOpenRepeatInterval}
                  value={repeatInterval}
                  setValue={setRepeatInterval}
                  items={repeatIntervalItems}
                  containerStyle={styles.dropdownContainer}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownList}
                  placeholder="Chọn khoảng cách lặp"
                  placeholderStyle={styles.placeholder}
                  zIndex={5700}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{ nestedScrollEnabled: true }}
                />
              </View>

              {repeatType === 'weekly' && (
                <>
                  <Text style={styles.inputLabel}>Chọn ngày trong tuần</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScrollContainer}
                  >
                    {daysOfWeekItems.map(day => (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          styles.dayItem,
                          selectedDaysOfWeek.includes(day.id) && styles.selectedItem,
                        ]}
                        onPress={() => toggleDayOfWeek(day.id)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            selectedDaysOfWeek.includes(day.id) && styles.selectedItemText,
                          ]}
                        >
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {repeatType === 'monthly' && (
                <>
                  <Text style={styles.inputLabel}>Chọn ngày trong tháng</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScrollContainer}
                  >
                    {daysOfMonthItems.map(day => (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          styles.dayItem,
                          selectedDaysOfMonth.includes(day.id) && styles.selectedItem,
                        ]}
                        onPress={() => toggleDayOfMonth(day.id)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            selectedDaysOfMonth.includes(day.id) && styles.selectedItemText,
                          ]}
                        >
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={styles.inputLabel}>Chọn giờ uống thuốc</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContainer}
              >
                {timePerDayItems.map(time => (
                  <TouchableOpacity
                    key={time.id}
                    style={[
                      styles.dayItem,
                      selectedTimesPerDay.includes(time.id) && styles.selectedItem,
                    ]}
                    onPress={() => toggleTimePerDay(time.id)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selectedTimesPerDay.includes(time.id) && styles.selectedItemText,
                      ]}
                    >
                      {time.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Hướng dẫn sử dụng</Text>
              <TextInput
                placeholder="Nhập hướng dẫn sử dụng thuốc"
                placeholderTextColor="#888"
                style={[styles.input, { height: 80 }]}
                multiline={true}
                value={instruction}
                onChangeText={setInstruction}
              />
            </ScrollView>

            <View style={styles.buttonRow}>
              {currentMedicineId && (
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={() => handleDeleteMedicine(currentMedicineId)}
                >
                  <Text style={styles.buttonText}>Xóa</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSavePrescription}
              >
                <Text style={styles.buttonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    marginLeft: 10,
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  textHeader: {
    fontSize: 30,
    fontFamily: 'Roboto',
    color: '#432c81',
    fontWeight: 'bold',
    marginTop: 5,
  },
  boxFeature: {
    flexDirection: 'column',
    width: 'auto',
    height: 115,
    backgroundColor: '#e0dee7',
    marginHorizontal: 10,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'flex-start',
    padding: 5,
  },
  boxTitle: {
    marginLeft: 10,
    fontSize: 23,
    fontFamily: 'Roboto',
    color: '#432c81',
    fontWeight: 'bold',
  },
  titleNote: {
    marginLeft: 10,
    fontSize: 17,
    color: '#432c81',
    fontWeight: 'bold',
  },
  note: {
    marginLeft: 10,
    fontSize: 17,
    color: '#432c81',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#432c81',
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 25,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#432c81',
    textAlign: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  inputLabel: {
    fontSize: 14,
    color: '#444',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#432c81',
  },
  dropdownContainer: {
    width: '100%',
    marginBottom: 15,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderRadius: 5,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    maxHeight: 'auto', // Tăng chiều cao để hiển thị nhiều mục hơn
  },
  placeholder: {
    color: '#888',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#aaa',
  },
  saveButton: {
    backgroundColor: '#432c81',
  },
  deleteButton: {
    backgroundColor: '#d9534f',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  horizontalScrollContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  dayItem: {
    padding: 10,
    paddingHorizontal: 15,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 45,
  },
  selectedItem: {
    backgroundColor: '#432c81',
    borderColor: '#432c81',
  },
  dayText: {
    color: '#333',
    fontSize: 16,
  },
  selectedItemText: {
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
});

export default MedicineManagerScreen;