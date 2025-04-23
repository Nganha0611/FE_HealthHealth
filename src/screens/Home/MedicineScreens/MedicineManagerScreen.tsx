import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import DropDownPicker from 'react-native-dropdown-picker';
import DatePicker from 'react-native-date-picker';
import { BottomTabParamList } from '../../../navigation/BottomTabs';
import axios from 'axios';

type Props = {
  navigation: NavigationProp<any>;
};

// Define the Medicine type
type Medicine = {
  id?: string;
  name: string;
  form: string;
  strength: string | number;
  unit: string;
  amount: string | number;
  instruction: string;
  startday: string;
  repeat_details: {
    type: string;
    interval: string | number;
    days_of_week: string[];
    days_of_month: string[];
    time_per_day: string[];
  };
};

// Mock data for demonstration
const mockMedicines: Medicine[] = [
  {
    id: '1',
    name: 'Paracetamol',
    form: 'tablet',
    strength: '500',
    unit: 'mg',
    amount: '30',
    instruction: 'Uống sau khi ăn',
    startday: '23/04/2025',
    repeat_details: {
      type: 'daily',
      interval: '1',
      days_of_week: [],
      days_of_month: [],
      time_per_day: ['08:00', '12:00', '20:00']
    }
  },
  {
    id: '2',
    name: 'Amoxicillin',
    form: 'capsule',
    strength: '500',
    unit: 'mg',
    amount: '20',
    instruction: 'Uống trước khi ăn 30 phút',
    startday: '20/04/2025',
    repeat_details: {
      type: 'daily',
      interval: '1',
      days_of_week: [],
      days_of_month: [],
      time_per_day: ['06:00', '14:00', '22:00']
    }
  }
];

const MedicineManagerScreen: React.FC<Props> = ({ navigation }) => {
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const [isModalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [instruction, setInstruction] = useState('');
  const [amount, setAmount] = useState('');
  const [startday, setStartday] = useState('');
  
  // State to track if we're editing an existing medicine or creating a new one
  const [currentMedicineId, setCurrentMedicineId] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>(mockMedicines);
  
  // Các state cho DropDownPicker
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState('');

  const [openUnit, setOpenUnit] = useState(false);
  const [unit, setUnit] = useState('');

  const [openRepeatType, setOpenRepeatType] = useState(false);
  const [repeatType, setRepeatType] = useState('');

  const [openRepeatInterval, setOpenRepeatInterval] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState('');

  // State cho lựa chọn dạng lướt ngang
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<string[]>([]);
  const [selectedDaysOfMonth, setSelectedDaysOfMonth] = useState<string[]>([]);
  const [selectedTimesPerDay, setSelectedTimesPerDay] = useState<string[]>([]);
  
  // Date picker
  const [openDate, setOpenDate] = useState(false);
  const [date, setDate] = useState(new Date());

  // Các tùy chọn cho dạng thuốc
  const medicineFormItems = [
    { label: 'Viên nén', value: 'tablet' },
    { label: 'Viên nang', value: 'capsule' },
    { label: 'Dung dịch', value: 'solution' },
    { label: 'Thuốc tiêm', value: 'injection' },
    { label: 'Thuốc mỡ', value: 'ointment' },
    { label: 'Thuốc nhỏ mắt', value: 'eye_drops' },
    { label: 'Thuốc hít', value: 'inhaler' },
  ];

  // Các tùy chọn cho đơn vị
  const unitItems = [
    { label: 'mg', value: 'mg' },
    { label: 'g', value: 'g' },
    { label: 'ml', value: 'ml' },
    { label: 'viên', value: 'viên' },
    { label: 'ống', value: 'ống' },
    { label: 'giọt', value: 'giọt' },
    { label: 'mcg', value: 'mcg' },
  ];

  // Các tùy chọn cho kiểu lặp lại
  const repeatTypeItems = [
    { label: 'Hằng ngày', value: 'daily' },
    { label: 'Hằng tuần', value: 'weekly' },
    { label: 'Hằng tháng', value: 'monthly' },
  ];

  // Các tùy chọn cho khoảng cách lặp lại
  const repeatIntervalItems = Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1}`,
    value: `${i + 1}`,
  }));

  // Các tùy chọn cho ngày trong tuần
  const daysOfWeekItems = [
    { id: 'CN', label: 'CN' },
    { id: 'T2', label: 'T2' },
    { id: 'T3', label: 'T3' },
    { id: 'T4', label: 'T4' },
    { id: 'T5', label: 'T5' },
    { id: 'T6', label: 'T6' },
    { id: 'T7', label: 'T7' },
  ];

  // Các tùy chọn cho ngày trong tháng
  const daysOfMonthItems = Array.from({ length: 31 }, (_, i) => ({
    id: `${i + 1}`,
    label: `${i + 1}`,
  }));

  // Các tùy chọn cho thời gian uống thuốc
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

  // Reset form function
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
  };

  // Open modal for adding new medicine
  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  // Open modal for editing existing medicine
  const openEditModal = (medicine: Medicine) => {
    setCurrentMedicineId(medicine.id || null);
    setName(medicine.name);
    setForm(medicine.form.toString());
    setStrength(medicine.strength.toString());
    setUnit(medicine.unit);
    setAmount(medicine.amount.toString());
    setInstruction(medicine.instruction);
    setStartday(medicine.startday);
    setRepeatType(medicine.repeat_details.type);
    setRepeatInterval(medicine.repeat_details.interval.toString());
    setSelectedDaysOfWeek(medicine.repeat_details.days_of_week);
    setSelectedDaysOfMonth(medicine.repeat_details.days_of_month);
    setSelectedTimesPerDay(medicine.repeat_details.time_per_day);
    
    // Set date from startday if it exists
    if (medicine.startday) {
      const [day, month, year] = medicine.startday.split('/').map(Number);
      setDate(new Date(year, month - 1, day));
    }
    
    setModalVisible(true);
  };

  // Toggle cho chọn ngày trong tuần
  const toggleDayOfWeek = (day: string) => {
    if (selectedDaysOfWeek.includes(day)) {
      setSelectedDaysOfWeek(selectedDaysOfWeek.filter(item => item !== day));
    } else {
      setSelectedDaysOfWeek([...selectedDaysOfWeek, day]);
    }
  };

  // Toggle cho chọn ngày trong tháng
  const toggleDayOfMonth = (day: string) => {
    if (selectedDaysOfMonth.includes(day)) {
      setSelectedDaysOfMonth(selectedDaysOfMonth.filter(item => item !== day));
    } else {
      setSelectedDaysOfMonth([...selectedDaysOfMonth, day]);
    }
  };

  // Toggle cho chọn giờ uống thuốc
  const toggleTimePerDay = (time: string) => {
    if (selectedTimesPerDay.includes(time)) {
      setSelectedTimesPerDay(selectedTimesPerDay.filter(item => item !== time));
    } else {
      setSelectedTimesPerDay([...selectedTimesPerDay, time]);
    }
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Handle date change
  const handleDateConfirm = (selectedDate: Date) => {
    setDate(selectedDate);
    setStartday(formatDate(selectedDate));
    setOpenDate(false);
  };

  const handleSavePrescription = async () => {
    // Validate inputs
    if (!name || !form || !strength || !unit || !amount || !repeatType || !repeatInterval || !startday) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin thuốc');
      return;
    }

    if (selectedTimesPerDay.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một thời điểm uống thuốc');
      return;
    }

    // Create medicine object
    const medicine: Medicine = {
      name,
      form,
      strength,
      unit,
      amount,
      instruction,
      startday,
      repeat_details: {
        type: repeatType,
        interval: repeatInterval,
        days_of_week: selectedDaysOfWeek,
        days_of_month: selectedDaysOfMonth,
        time_per_day: selectedTimesPerDay,
      },
    };

    try {
      // If editing an existing medicine
      if (currentMedicineId) {
        // In a real app, you would make an API call to update
        // await axios.put(`YOUR_API_URL/prescriptions/${currentMedicineId}`, medicine);
        
        // For this demo, update the local state
        const updatedMedicines = medicines.map(med => 
          med.id === currentMedicineId ? { ...medicine, id: currentMedicineId } : med
        );
        setMedicines(updatedMedicines);
        Alert.alert('Thành công', 'Cập nhật thuốc thành công');
      } 
      // If adding a new medicine
      else {
        // In a real app, you would make an API call to create
        // const response = await axios.post('YOUR_API_URL/prescriptions', medicine);
        
        // For this demo, add to the local state with a mock ID
        const newId = (Math.max(...medicines.map(m => parseInt(m.id || '0'))) + 1).toString();
        setMedicines([...medicines, { ...medicine, id: newId }]);
        Alert.alert('Thành công', 'Thêm thuốc mới thành công');
      }
      
      // Close modal and reset form
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Lỗi khi lưu:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi lưu thông tin thuốc');
    }
  };

  // Get medicine form label from value
  const getMedicineFormLabel = (value: string): string => {
    const item = medicineFormItems.find(item => item.value === value);
    return item ? item.label : value;
  };

  // Function to delete a medicine
  const handleDeleteMedicine = (id: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa thuốc này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: () => {
            // In a real app, you would make an API call to delete
            // await axios.delete(`YOUR_API_URL/prescriptions/${id}`);
            
            // For this demo, remove from the local state
            const updatedMedicines = medicines.filter(med => med.id !== id);
            setMedicines(updatedMedicines);
            Alert.alert('Thành công', 'Đã xóa thuốc');
          }
        }
      ]
    );
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
            <Text style={[styles.text, { fontSize: 30, marginTop: 5 }]}>Quản lý thuốc</Text>
          </View>
        </View>

        {medicines.map((medicine, index) => (
          <TouchableOpacity
            key={medicine.id || index}
            style={styles.boxFeature}
            onPress={() => openEditModal(medicine)}
          >
            <Text style={[styles.text, styles.boxTitle]}>{medicine.name} {medicine.strength}{medicine.unit}</Text>
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
                  <Text style={styles.dateButton}>
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
                            selectedDaysOfWeek.includes(day.id) && styles.selectedItem
                          ]}
                          onPress={() => toggleDayOfWeek(day.id)}
                        >
                          <Text style={[
                            styles.dayText,
                            selectedDaysOfWeek.includes(day.id) && styles.selectedItemText
                          ]}>
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
                            selectedDaysOfMonth.includes(day.id) && styles.selectedItem
                          ]}
                          onPress={() => toggleDayOfMonth(day.id)}
                        >
                          <Text style={[
                            styles.dayText,
                            selectedDaysOfMonth.includes(day.id) && styles.selectedItemText
                          ]}>
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
                        selectedTimesPerDay.includes(time.id) && styles.selectedItem
                      ]}
                      onPress={() => toggleTimePerDay(time.id)}
                    >
                      <Text style={[
                        styles.dayText,
                        selectedTimesPerDay.includes(time.id) && styles.selectedItemText
                      ]}>
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
      </ScrollView>

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
    text: {
      fontSize: 25,
      fontFamily: 'Roboto',
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
      borderRadius: 30,
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
      maxHeight: 150,
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
    // Styles cho lướt ngang
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
    // Styles cho date picker button
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
    // Styles cho custom time
    customTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    customTimeInput: {
      flex: 2,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
      padding: 10,
      fontSize: 16,
      marginRight: 10,
    },
    addTimeButton: {
      flex: 1,
      backgroundColor: '#432c81',
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
    },
    addTimeButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
  });

export default MedicineManagerScreen;