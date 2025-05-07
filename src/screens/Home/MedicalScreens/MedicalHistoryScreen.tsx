import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, TextInput, Platform, ActivityIndicator } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../utils/config';
import { BottomTabParamList } from '../../../navigation/BottomTabs';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../../contexts/NotificationContext';
import Loading from "../../../components/Loading";

// Define type for navigation prop
type Props = {
  navigation: NavigationProp<any>;
};

// Define type for medical history
type MedicalHistory = {
  id?: string;
  userId: string;
  appointmentDate: string;
  location: string;
  note: string;
  status: string;
};

const MedicalHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [openStatus, setOpenStatus] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { showNotification } = useNotification();

  // List of status items for dropdown
  const statusItems = [
    { label: t('medicalStatus.completed'), value: 'Completed' },
    { label: t('medicalStatus.cancelled'), value: 'Cancelled' },
    { label: t('medicalStatus.pending'), value: 'Pending' },
  ];

  // Function to fetch medical history data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        navigation.navigate('Login');
        return;
      }

      const historyResponse = await axios.get<MedicalHistory[]>(
        `${API_BASE_URL}/api/medical-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const fetchedHistory = historyResponse.data;
      setMedicalHistory(fetchedHistory);
    } catch (error: any) {
      console.error('Error fetching data:', error.response?.data || error.message);
      showNotification(t('fetchDataError'), 'error');

    } finally {
      setLoading(false);
    }
  };

  // Call fetchData when component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Function to save or update medical history
  const handleSaveHistory = async () => {
    if (!location || !status) {
      showNotification(t('incompleteMedicalInfo'), 'error');

      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');

        navigation.navigate('Login');
        return;
      }

      const appointmentDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes(),
        time.getSeconds()
      );
      const appointmentDateStr = appointmentDate.toISOString();
      const data = {
        appointmentDate: appointmentDateStr,
        location,
        status,
        note,
        userId: await AsyncStorage.getItem('userId')
      };

      let response;
      if (selectedHistoryId) {
        response = await axios.put(
          `${API_BASE_URL}/api/medical-history/${selectedHistoryId}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        showNotification(t('medicalHistoryUpdated'), 'success');

      } else {
        response = await axios.post(
          `${API_BASE_URL}/api/medical-history`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        showNotification(t('medicalHistoryAdded'), 'success');
      }

      fetchData();
      setModalVisible(false);
      setSelectedHistoryId(null);
      setLocation('');
      setStatus(null);
      setNote('');
      setDate(new Date());
      setTime(new Date());
    } catch (error: any) {
      console.error('Error saving history:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });

      let errorMessage = t('saveMedicalHistoryError');
      if (error.response) {
        errorMessage += `: ${error.response.data.message || error.response.statusText}`;
        if (error.response.status === 401) {
          errorMessage = t('sessionExpired');
          navigation.navigate('Login');
        }
      } else if (error.request) {
        errorMessage += `: ${t('noServerResponse')}`;
      } else {
        errorMessage += `: ${error.message}`;
      }
      showNotification(t(t('error')), 'error');

    }
  };

  // Function to handle editing medical history
  const handleEditHistory = (history: MedicalHistory) => {
    setSelectedHistoryId(history.id || null);
    setLocation(history.location || '');
    setStatus(history.status);
    setNote(history.note || '');
    const appointmentDate = new Date(history.appointmentDate);
    setDate(appointmentDate);
    setTime(appointmentDate);
    setModalVisible(true);
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
            <Text style={[styles.text, { fontSize: 30, marginTop: 5 }]}>{t('medicalHistory')}</Text>
          </View>
        </View>

        {medicalHistory.map((history, index) => (
  <TouchableOpacity key={index} style={styles.boxFeature} onPress={() => handleEditHistory(history)}>
    <Text style={[styles.text, styles.boxTitle]}>{history.location}</Text>
    <Text style={styles.note}>
      {t('statusLabel')}: {statusItems.find(item => item.value === history.status)?.label || history.status}
    </Text>
    <Text style={styles.note}>
      {t('time')}: {new Date(history.appointmentDate).toLocaleString('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      })}
    </Text>
    <Text style={styles.note}>
      {t('note')}: {history.note || t('noNote')}
    </Text>
  </TouchableOpacity>
))}

        
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <FontAwesome name="close" size={24} color="#444" />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
              <Text style={styles.modalTitle}>{selectedHistoryId ? t('editMedicalHistory') : t('addMedicalHistory')}</Text>

              <Text style={styles.inputLabel}>{t('location')}</Text>
              <TextInput
                placeholder={t('enterLocation')}
                style={styles.input}
                value={location}
                onChangeText={setLocation}
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
        setLocation('');
        setStatus(null);
        setNote('');
        setDate(new Date());
        setTime(new Date());
        setModalVisible(true);
      }}>
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
      {loading && <Loading message={t("processing")} />}

    </View>
  );
};

// Define styles
const styles = StyleSheet.create({
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#432c81',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MedicalHistoryScreen;