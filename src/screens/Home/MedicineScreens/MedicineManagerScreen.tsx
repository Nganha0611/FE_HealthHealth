import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import DropDownPicker from 'react-native-dropdown-picker';
import DatePicker from 'react-native-date-picker';
import { BottomTabParamList } from '../../../navigation/BottomTabs';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../utils/config';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../../contexts/NotificationContext';

type Props = {
  navigation: NavigationProp<any>;
};

type Medicine = {
  id?: string;
  name: string;
  form: string;
  strength: string | number;
  unit: string;
  amount: string | number;
  instruction: string;
  startday: string;
  repeatDetails?: {
    type: string;
    interval: string | number;
    daysOfWeek: string[];
    daysOfMonth: string[];
    timePerDay: string[];
  };
};

const MedicineManagerScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const [isModalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [instruction, setInstruction] = useState('');
  const [amount, setAmount] = useState('');
  const [startday, setStartday] = useState('');
  const [currentMedicineId, setCurrentMedicineId] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const { showNotification } = useNotification();

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState('');
  const [openUnit, setOpenUnit] = useState(false);
  const [unit, setUnit] = useState('');
  const [openRepeatType, setOpenRepeatType] = useState(false);
  const [repeatType, setRepeatType] = useState('');
  const [openRepeatInterval, setOpenRepeatInterval] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState('');

  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<string[]>([]);
  const [selectedDaysOfMonth, setSelectedDaysOfMonth] = useState<string[]>([]);
  const [selectedTimesPerDay, setSelectedTimesPerDay] = useState<string[]>([]);

  const [openDate, setOpenDate] = useState(false);
  const [date, setDate] = useState(new Date());

  const medicineFormItems = [
    { label: t('medicineForms.tablet'), value: 'tablet' },
    { label: t('medicineForms.capsule'), value: 'capsule' },
    { label: t('medicineForms.solution'), value: 'solution' },
    { label: t('medicineForms.injection'), value: 'injection' },
    { label: t('medicineForms.ointment'), value: 'ointment' },
    { label: t('medicineForms.eyeDrops'), value: 'eye_drops' },
    { label: t('medicineForms.inhaler'), value: 'inhaler' },
  ];

  const unitItems = [
    { label: 'mg', value: 'mg' },
    { label: 'g', value: 'g' },
    { label: 'ml', value: 'ml' },
    { label: t('units.tablet'), value: 'viên' },
    { label: t('units.tube'), value: 'ống' },
    { label: t('units.drop'), value: 'giọt' },
    { label: 'mcg', value: 'mcg' },
  ];

  const repeatTypeItems = [
    { label: t('repeatTypes.daily'), value: 'daily' },
    { label: t('repeatTypes.weekly'), value: 'weekly' },
    { label: t('repeatTypes.monthly'), value: 'monthly' },
  ];

  const repeatIntervalItems = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
  ];

  const daysOfWeekItems = [
    { id: 'CN', label: t('daysOfWeek.sunday') },
    { id: 'T2', label: t('daysOfWeek.monday') },
    { id: 'T3', label: t('daysOfWeek.tuesday') },
    { id: 'T4', label: t('daysOfWeek.wednesday') },
    { id: 'T5', label: t('daysOfWeek.thursday') },
    { id: 'T6', label: t('daysOfWeek.friday') },
    { id: 'T7', label: t('daysOfWeek.saturday') },
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
      if (!token) {
        showNotification(t('noToken'), 'error');

        navigation.navigate('Login');
        return;
      }

      const response = await axios.get<Medicine[]>(`${API_BASE_URL}/api/prescriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;

      if (!data || data.length === 0) {
        setMedicines([]);
        showNotification(t('noPrescriptionData'), 'error');
        return;
      }

      setMedicines(data);
    } catch (error: any) {
      console.error('Error fetching prescriptions:', error);
      if (error.response && error.response.status === 401) {
        showNotification(t('sessionExpired'), 'error');

        await AsyncStorage.removeItem('token');
        navigation.navigate('Login');
      } else {
        showNotification(t('fetchPrescriptionError'), 'error');

      }
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

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

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (medicine: Medicine) => {
    setCurrentMedicineId(medicine.id || null);
    setName(medicine.name);
    setForm(medicine.form.toString());
    setStrength(medicine.strength.toString());
    setUnit(medicine.unit);
    setAmount(medicine.amount.toString());
    setInstruction(medicine.instruction);
    setStartday(medicine.startday);

    if (medicine.repeatDetails) {
      setRepeatType(medicine.repeatDetails.type || '');
      setRepeatInterval(medicine.repeatDetails.interval ? medicine.repeatDetails.interval.toString() : '');
      setSelectedDaysOfWeek(medicine.repeatDetails.daysOfWeek || []);
      setSelectedDaysOfMonth(medicine.repeatDetails.daysOfMonth || []);
      setSelectedTimesPerDay(medicine.repeatDetails.timePerDay || []);
    } else {
      setRepeatType('daily');
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

  const toggleDayOfMonth = (day: string) => {
    setSelectedDaysOfMonth(prev =>
      prev.includes(day) ? prev.filter(item => item !== day) : [...prev, day]
    );
  };

  const toggleTimePerDay = (time: string) => {
    setSelectedTimesPerDay(prev =>
      prev.includes(time) ? prev.filter(item => item !== time) : [...prev, time]
    );
  };

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateConfirm = (selectedDate: Date) => {
    setDate(selectedDate);
    setStartday(formatDate(selectedDate));
    setOpenDate(false);
  };

  const handleSavePrescription = async () => {
    if (!name || !form || !strength || !unit || !amount || !repeatType || !repeatInterval || !startday) {
      showNotification(t('incompleteMedicineInfo'), 'error');

      return;
    }

    if (selectedTimesPerDay.length === 0) {
      showNotification(t('noTimeSelected'), 'error');

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
      repeatDetails: {
        type: repeatType,
        interval: repeatInterval,
        daysOfWeek: selectedDaysOfWeek,
        daysOfMonth: selectedDaysOfMonth,
        timePerDay: selectedTimesPerDay,
      },
    };

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        navigation.navigate('Login');
        return;
      }

      if (currentMedicineId) {
        const response = await axios.put(
          `${API_BASE_URL}/api/prescriptions/${currentMedicineId}`,
          medicine,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMedicines(prev =>
          prev.map(med => (med.id === currentMedicineId ? response.data : med))
        );
        showNotification(t('medicineUpdated'), 'success');

      } else {
        const response = await axios.post(
          `${API_BASE_URL}/api/prescriptions`,
          medicine,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMedicines(prev => [...prev, response.data]);
        showNotification(t('medicineAdded'), 'success');

      }

      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving prescription:', error);
      if (error.response && error.response.status === 401) {
        showNotification(t('sessionExpired'), 'error');

        await AsyncStorage.removeItem('token');
        navigation.navigate('Login');
      } else {
        showNotification(t('saveMedicineError'), 'error');

      }
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    showNotification(
      t('confirmDelete'),
      'warning',
      [
        {
          text: t('cancel'),
          onPress: () => {},
          color: 'danger',
        },
        {
          text: t('delete'),
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                showNotification(t('noToken'), 'error');
                navigation.navigate('Login');
                return;
              }
  
              await axios.delete(`${API_BASE_URL}/api/prescriptions/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
  
              setMedicines(prev => prev.filter(med => med.id !== id));
              showNotification(t('medicineDeleted'), 'success');
              setModalVisible(false);
            } catch (error: any) {
              console.error('Error deleting medicine:', error);
              if (error.response && error.response.status === 401) {
                showNotification(t('sessionExpired'), 'error');
                await AsyncStorage.removeItem('token');
                navigation.navigate('Login');
              } else {
                showNotification(t('deleteMedicineError'), 'error');
              }
            }
          },
          color: 'primary',
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
            <Text style={styles.textHeader}>{t('medicineManager')}</Text>
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
              <Text style={styles.titleNote}>{t('quantity')}:</Text>
              <Text style={styles.note}>{medicine.amount}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
              <Text style={styles.titleNote}>{t('form')}:</Text>
              <Text style={styles.note}>{getMedicineFormLabel(medicine.form.toString())}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
              <Text style={styles.titleNote}>{t('startDate')}:</Text>
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
                {currentMedicineId ? t('editMedicine') : t('addMedicine')}
              </Text>

              <Text style={styles.inputLabel}>{t('medicineName')}</Text>
              <TextInput
                placeholder={t('enterMedicineName')}
                placeholderTextColor="#888"
                style={styles.input}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>{t('form')}</Text>
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
                  placeholder={t('selectForm')}
                  placeholderStyle={styles.placeholder}
                  zIndex={6000}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{ nestedScrollEnabled: true }}
                />
              </View>

              <Text style={styles.inputLabel}>{t('strength')}</Text>
              <TextInput
                placeholder={t('enterStrength')}
                placeholderTextColor="#888"
                style={styles.input}
                keyboardType="numeric"
                value={strength}
                onChangeText={setStrength}
              />

              <Text style={styles.inputLabel}>{t('unit')}</Text>
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
                  placeholder={t('selectUnit')}
                  placeholderStyle={styles.placeholder}
                  zIndex={5900}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{ nestedScrollEnabled: true }}
                />
              </View>

              <Text style={styles.inputLabel}>{t('quantity')}</Text>
              <TextInput
                placeholder={t('enterQuantity')}
                placeholderTextColor="#888"
                style={styles.input}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.inputLabel}>{t('startDate')}</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setOpenDate(true)}
              >
                <Text style={styles.dateButtonText}>
                  {startday ? startday : t('selectStartDate')}
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
                title={t('selectStartDate')}
                confirmText={t('confirm')}
                cancelText={t('cancel')}
              />

              <Text style={styles.modalSubtitle}>{t('medicationSchedule')}</Text>

              <Text style={styles.inputLabel}>{t('repeatType')}</Text>
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
                  placeholder={t('selectRepeatType')}
                  placeholderStyle={styles.placeholder}
                  zIndex={5800}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{ nestedScrollEnabled: true }}
                />
              </View>

              <Text style={styles.inputLabel}>{t('repeatInterval')}</Text>
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
                  placeholder={t('selectRepeatInterval')}
                  placeholderStyle={styles.placeholder}
                  zIndex={5700}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{ nestedScrollEnabled: true }}
                />
              </View>

              {repeatType === 'weekly' && (
                <>
                  <Text style={styles.inputLabel}>{t('selectDaysOfWeek')}</Text>
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
                  <Text style={styles.inputLabel}>{t('selectDaysOfMonth')}</Text>
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

              <Text style={styles.inputLabel}>{t('selectTimesPerDay')}</Text>
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

              <Text style={styles.inputLabel}>{t('instructions')}</Text>
              <TextInput
                placeholder={t('enterInstructions')}
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
                  <Text style={styles.buttonText}>{t('delete')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSavePrescription}
              >
                <Text style={styles.buttonText}>{t('save')}</Text>
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
    maxHeight: 'auto',
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