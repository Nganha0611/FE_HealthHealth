import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../utils/config';
import { BottomTabParamList } from '../../../navigation/BottomTabs';
import { useTranslation } from 'react-i18next';

type Props = {
  navigation: NavigationProp<any>;
};

type Medicine = {
  id?: string;
  name: string;
  startday: string;
  repeatDetails?: {
    type: string;
    interval: string | number;
    daysOfWeek?: string[];
    daysOfMonth?: string[];
    timePerDay?: string[];
  };
};

type MedicineHistory = {
  id: string;
  userId: string;
  prescriptionsId?: string;
  timestamp: string;
  status: string;
  note: string;
};

const MedicineHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [openStatus, setOpenStatus] = useState(false);
  const [openMedicine, setOpenMedicine] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicineHistory, setMedicineHistory] = useState<MedicineHistory[]>([]);

  const statusItems = [
    { label: t('status.taken'), value: 'Taken' },
    { label: t('status.missing'), value: 'Missing' },
    { label: t('status.paused'), value: 'Paused' },
  ];

  const medicineItems = medicines.map(med => ({ label: med.name, value: med.id || '' }));

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert(t('error'), t('noToken'));
        navigation.navigate('Login');
        return;
      }

      const [medicineResponse, historyResponse] = await Promise.all([
        axios.get<Medicine[]>(`${API_BASE_URL}/api/prescriptions`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get<MedicineHistory[]>(`${API_BASE_URL}/api/medicine-history`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const fetchedMedicines = medicineResponse.data;
      const fetchedHistory = historyResponse.data;

      setMedicines(fetchedMedicines);
      setMedicineHistory(fetchedHistory);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      Alert.alert(t('error'), t('fetchDataError'));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveHistory = async () => {
    if (!selectedMedicine || !status) {
      Alert.alert(t('notification'), t('incompleteInfo'));
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert(t('error'), t('noToken'));
        navigation.navigate('Login');
        return;
      }

      const timestamp = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes(),
        time.getSeconds()
      );
      const timestampStr = timestamp.toISOString();
      const data = { prescriptionsId: selectedMedicine, timestamp: timestampStr, status, note };

      if (selectedHistoryId) {
        await axios.put(
          `${API_BASE_URL}/api/medicine-history/${selectedHistoryId}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert(t('success'), t('historyUpdated'));
      } else {
        await axios.post(
          `${API_BASE_URL}/api/medicine-history`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert(t('success'), t('historyAdded'));
      }

      fetchData();
      setModalVisible(false);
      setSelectedHistoryId(null);
      setSelectedMedicine(null);
      setStatus(null);
      setNote('');
      setDate(new Date());
      setTime(new Date());
    } catch (error: any) {
      console.error('Error saving history:', error.response?.data || error.message);
      Alert.alert(t('error'), t('saveHistoryError'));
    }
  };

  const handleEditHistory = (history: MedicineHistory) => {
    const medicine = medicines.find(m => m.id === history.prescriptionsId);
    if (medicine) {
      setSelectedHistoryId(history.id);
      setSelectedMedicine(history.prescriptionsId || null);
      setStatus(history.status);
      setNote(history.note || '');
      const timestampDate = new Date(history.timestamp);
      setDate(timestampDate);
      setTime(timestampDate);
      setModalVisible(true);
    }
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
            <Text style={[styles.text, { fontSize: 30, marginTop: 5 }]}>{t('medicineHistory')}</Text>
          </View>
        </View>
        {medicineHistory.length === 0 ? (
          <Text style={styles.note}>{t('noHistory')}</Text>
        ) : (
          medicineHistory.map((history, index) => {
            const medicine = medicines.find(m => m.id === history.prescriptionsId);
            return (
              <TouchableOpacity key={index} style={styles.boxFeature} onPress={() => handleEditHistory(history)}>
                <Text style={[styles.text, styles.boxTitle]}>{medicine ? medicine.name : t('unknownMedicine')}</Text>
                <Text style={styles.note}>{t('statusLabel')}: {statusItems.find(item => item.value === history.status)?.label || history.status}</Text>
                <Text style={styles.note}>{t('time')}: {new Date(history.timestamp).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</Text>
                <Text style={styles.note}>{t('note')}: {history.note || t('noNote')}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <FontAwesome name="close" size={24} color="#444" />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
              <Text style={styles.modalTitle}>{selectedHistoryId ? t('editHistory') : t('addHistory')}</Text>
              <Text style={styles.inputLabel}>{t('medicine')}</Text>
              <DropDownPicker
                open={openMedicine}
                setOpen={setOpenMedicine}
                value={selectedMedicine}
                setValue={setSelectedMedicine}
                items={medicineItems}
                containerStyle={styles.dropdownContainer}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownList}
                placeholder={t('selectMedicine')}
                zIndex={2000}
                listMode="SCROLLVIEW"
                disabled={!!selectedHistoryId}
              />
              <Text style={styles.inputLabel}>{t('statusLabel')}</Text>
              <DropDownPicker
                open={openStatus}
                setOpen={setOpenStatus}
                value={status}
                setValue={setStatus}
                items={statusItems}
                containerStyle={styles.dropdownContainer}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownList}
                placeholder={t('selectStatus')}
                zIndex={1000}
                listMode="SCROLLVIEW"
              />
              <Text style={styles.inputLabel}>{t('date')}</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {date.toLocaleDateString('vi-VN')}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setDate(selectedDate);
                      if (Platform.OS === 'android') {
                        setShowDatePicker(false);
                      }
                    } else if (Platform.OS === 'ios') {
                      setShowDatePicker(false);
                    }
                  }}
                />
              )}
              <Text style={styles.inputLabel}>{t('time')}</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                  onChange={(event, selectedTime) => {
                    if (selectedTime) {
                      setTime(selectedTime);
                      if (Platform.OS === 'android') {
                        setShowTimePicker(false);
                      }
                    } else if (Platform.OS === 'ios') {
                      setShowTimePicker(false);
                    }
                  }}
                />
              )}
              <Text style={styles.inputLabel}>{t('note')}</Text>
              <TextInput
                placeholder={t('enterNote')}
                style={styles.input}
                value={note}
                onChangeText={setNote}
                multiline
              />
              <TouchableOpacity
                style={[styles.fab, { alignSelf: 'center', marginTop: 30 }]}
                onPress={handleSaveHistory}
              >
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => {
        setSelectedHistoryId(null);
        setSelectedMedicine(null);
        setStatus(null);
        setNote('');
        setDate(new Date());
        setTime(new Date());
        setModalVisible(true);
      }}>
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
  text: {
    fontSize: 25,
    fontFamily: 'Roboto',
    color: '#432c81',
    fontWeight: 'bold',
  },
  boxFeature: {
    flexDirection: 'column',
    width: 'auto',
    height: 'auto',
    backgroundColor: '#e0dee7',
    marginHorizontal: 10,
    borderRadius: 10,
    marginBottom: 20,
    padding: 7,
  },
  boxTitle: {
    fontSize: 23,
  },
  note: {
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
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#432c81',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginTop: 5,
    minHeight: 60,
  },
  dropdownContainer: {
    marginTop: 5,
  },
  dropdown: {
    backgroundColor: '#fafafa',
  },
  dropdownList: {
    backgroundColor: '#fafafa',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
});

export default MedicineHistoryScreen;