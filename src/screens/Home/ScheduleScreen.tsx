import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert, ActivityIndicator, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import CalendarPicker from 'react-native-calendar-picker';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../utils/config';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Event {
  name: string;
  time: string;
  medicineId?: string;
  medicalHistoryId?: string;
}

interface Medicine {
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
}

interface MedicalHistory {
  id?: string;
  userId: string;
  appointmentDate: string;
  location: string;
  note: string;
  status: string;
}

const ScheduleScreen: React.FC<any> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState<'vi' | 'en'>(i18n.language as 'vi' | 'en');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<{ [key: string]: Event[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Medicine History Modal states
  const [isMedicineModalVisible, setMedicineModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<string | null>(null);
  const [medicineStatus, setMedicineStatus] = useState<string | null>(null);
  const [medicineNote, setMedicineNote] = useState('');
  const [medicineDate, setMedicineDate] = useState(new Date());
  const [medicineTime, setMedicineTime] = useState(new Date());
  const [openMedicineStatus, setOpenMedicineStatus] = useState(false);
  const [openMedicine, setOpenMedicine] = useState(false);
  const [showMedicineDatePicker, setShowMedicineDatePicker] = useState(false);
  const [showMedicineTimePicker, setShowMedicineTimePicker] = useState(false);
  // Medical History Modal states
  const [isMedicalModalVisible, setMedicalModalVisible] = useState(false);
  const [selectedMedicalHistoryId, setSelectedMedicalHistoryId] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [medicalStatus, setMedicalStatus] = useState<string | null>(null);
  const [medicalNote, setMedicalNote] = useState('');
  const [medicalDate, setMedicalDate] = useState(new Date());
  const [medicalTime, setMedicalTime] = useState(new Date());
  const [openMedicalStatus, setOpenMedicalStatus] = useState(false);
  const [showMedicalDatePicker, setShowMedicalDatePicker] = useState(false);
  const [showMedicalTimePicker, setShowMedicalTimePicker] = useState(false);
  // Shared data
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);

  const medicineStatusItems = [
    { label: t('status.taken'), value: 'Taken' },
    { label: t('status.missing'), value: 'Missing' },
    { label: t('status.paused'), value: 'Paused' },
  ];

  const medicalStatusItems = [
    { label: t('medicalStatus.completed'), value: 'Completed' },
    { label: t('medicalStatus.cancelled'), value: 'Cancelled' },
    { label: t('medicalStatus.pending'), value: 'Pending' },
  ];

  const medicineItems = medicines.map(med => ({ label: med.name, value: med.id || '' }));

  const getDateKey = (date: Date): string => date.toISOString().split('T')[0];

  const onDateChange = (date: any) => {
    if (date?.toDate) {
      setSelectedDate(date.toDate());
    } else {
      setSelectedDate(new Date(date));
    }
  };

  const weekdays = t('calendar.weekdays', { returnObjects: true });
  const safeWeekdays = Array.isArray(weekdays) ? weekdays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const months = t('calendar.months', { returnObjects: true });
  const safeMonths = Array.isArray(months) ? months : [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper function to parse startday (DD/MM/YYYY) to Date with UTC alignment
  const parseStartDay = (startday: string): Date => {
    const [day, month, year] = startday.split('/').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date;
  };

  // Helper function to format time (HH:mm) to 12-hour format
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? t('time.pm') : t('time.am');
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Helper function to parse 12-hour time to Date for sorting
  const parseTimeToDate = (timeStr: string): Date => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === t('time.pm') && hours !== 12) hours += 12;
    if (period === t('time.am') && hours === 12) hours = 0;
    const date = new Date(1970, 0, 1);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Process medicine events based on repeatDetails with fixed date handling
  const processMedicineEvents = (medicines: Medicine[]): { [key: string]: Event[] } => {
    const eventsMap: { [key: string]: Event[] } = {};

    medicines.forEach((medicine) => {
      if (!medicine.repeatDetails || !medicine.startday) return;

      const { type, interval, daysOfWeek, daysOfMonth, timePerDay } = medicine.repeatDetails;
      const startDate = parseStartDay(medicine.startday);
      const intervalNum = parseInt(interval.toString(), 10);
      const endDate = new Date(Date.UTC(2025, 11, 31));

      const addEvent = (date: Date, time: string) => {
        // Ensure date is on or after startDate
        if (date < startDate) return;
        const dateKey = getDateKey(date);
        if (!eventsMap[dateKey]) {
          eventsMap[dateKey] = [];
        }
        eventsMap[dateKey].push({
          name: `${t('event.medicine')}: ${medicine.name} ${medicine.strength}${medicine.unit}`,
          time: formatTime(time),
          medicineId: medicine.id,
        });
      };

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const matchesRepeat = () => {
          if (type === 'daily') {
            const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysSinceStart >= 0 && daysSinceStart % intervalNum === 0;
          }
          if (type === 'weekly') {
            const dayMap: { [key: string]: number } = { CN: 0, T2: 1, T3: 2, T4: 3, T5: 4, T6: 5, T7: 6 };
            const currentDay = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][currentDate.getUTCDay()];
            const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const weeksSinceStart = Math.floor(daysSinceStart / 7);
            return daysOfWeek.includes(currentDay) && (weeksSinceStart >= 0 && weeksSinceStart % intervalNum === 0);
          }
          if (type === 'monthly') {
            const currentDayOfMonth = currentDate.getUTCDate().toString();
            if (!daysOfMonth.includes(currentDayOfMonth)) return false;
            const startYear = startDate.getUTCFullYear();
            const startMonth = startDate.getUTCMonth();
            const currentYear = currentDate.getUTCFullYear();
            const currentMonth = currentDate.getUTCMonth();
            const monthsDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth);
            return monthsDiff >= 0 && monthsDiff % intervalNum === 0;
          }
          return false;
        };

        if (matchesRepeat()) {
          timePerDay.forEach((time) => {
            addEvent(new Date(currentDate), time);
          });
        }

        // Advance by one day in UTC
        currentDate = new Date(currentDate);
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    });

    return eventsMap;
  };

  // Process medical history events based on appointmentDate
  const processMedicalHistoryEvents = (history: MedicalHistory[]): { [key: string]: Event[] } => {
    const eventsMap: { [key: string]: Event[] } = {};

    history.forEach((entry) => {
      const appointmentDate = new Date(entry.appointmentDate);
      const dateKey = getDateKey(appointmentDate);
      const time = appointmentDate.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

      if (!eventsMap[dateKey]) {
        eventsMap[dateKey] = [];
      }
      eventsMap[dateKey].push({
        name: `${t('event.appointment')}: ${entry.location} (${t(`medicalStatus.${entry.status.toLowerCase()}`)})`,
        time,
        medicalHistoryId: entry.id,
      });
    });

    return eventsMap;
  };

  // Fetch data from APIs
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert(t('error'), t('noToken'));
        navigation.navigate('Login');
        return;
      }

      // Fetch medicines and medical history
      const [medicineResponse, historyResponse] = await Promise.all([
        axios.get<Medicine[]>(`${API_BASE_URL}/api/prescriptions`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }),
        axios.get<MedicalHistory[]>(`${API_BASE_URL}/api/medical-history`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }),
      ]);

      const medicines = medicineResponse.data;
      const medicalHistory = historyResponse.data;

      setMedicines(medicines);
      setMedicalHistory(medicalHistory);

      // Process events
      const medicineEvents = processMedicineEvents(medicines);
      const historyEvents = processMedicalHistoryEvents(medicalHistory);

      // Merge events
      const combinedEvents: { [key: string]: Event[] } = {};
      Object.keys(medicineEvents).forEach((dateKey) => {
        combinedEvents[dateKey] = [...(combinedEvents[dateKey] || []), ...medicineEvents[dateKey]];
      });
      Object.keys(historyEvents).forEach((dateKey) => {
        combinedEvents[dateKey] = [...(combinedEvents[dateKey] || []), ...historyEvents[dateKey]];
      });

      // Sort events by time (morning to evening) within each date
      Object.keys(combinedEvents).forEach((dateKey) => {
        combinedEvents[dateKey].sort((a, b) => {
          const timeA = parseTimeToDate(a.time);
          const timeB = parseTimeToDate(b.time);
          return timeA.getTime() - timeB.getTime();
        });
      });

      setEvents(combinedEvents);
    } catch (err: any) {
      console.error('Error fetching data:', err.response?.data || err.message);
      setError(t('fetchDataError'));
      if (err.response?.status === 401) {
        Alert.alert(t('error'), t('sessionExpired'));
        await AsyncStorage.removeItem('token');
        navigation.navigate('Login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset medicine modal fields
  const resetMedicineModal = () => {
    setSelectedMedicine(null);
    setMedicineStatus(null);
    setMedicineNote('');
    setMedicineDate(new Date());
    setMedicineTime(new Date());
    setOpenMedicineStatus(false);
    setOpenMedicine(false);
    setShowMedicineDatePicker(false);
    setShowMedicineTimePicker(false);
  };

  // Reset medical history modal fields
  const resetMedicalModal = () => {
    setSelectedMedicalHistoryId(null);
    setLocation('');
    setMedicalStatus(null);
    setMedicalNote('');
    setMedicalDate(new Date());
    setMedicalTime(new Date());
    setOpenMedicalStatus(false);
    setShowMedicalDatePicker(false);
    setShowMedicalTimePicker(false);
  };

  // Handle event click
  const handleEventClick = (event: Event) => {
    if (event.name.startsWith(t('event.medicine')) && event.medicineId) {
      const selectedTime = parseTimeToDate(event.time);
      setSelectedMedicine(event.medicineId);
      setMedicineStatus(null);
      setMedicineNote('');
      setMedicineDate(new Date(selectedDate));
      setMedicineTime(selectedTime);
      setMedicineModalVisible(true);
    } else if (event.name.startsWith(t('event.appointment')) && event.medicalHistoryId) {
      const history = medicalHistory.find(h => h.id === event.medicalHistoryId);
      if (history) {
        const appointmentDate = new Date(history.appointmentDate);
        setSelectedMedicalHistoryId(history.id || null);
        setLocation(history.location);
        setMedicalStatus(history.status);
        setMedicalNote(history.note || '');
        setMedicalDate(appointmentDate);
        setMedicalTime(appointmentDate);
        setMedicalModalVisible(true);
      }
    }
  };

  // Save medicine history
  const handleSaveMedicineHistory = async () => {
    if (!selectedMedicine || !medicineStatus) {
      Alert.alert(t('notification'), t('incompleteMedicineInfo'));
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
        medicineDate.getFullYear(),
        medicineDate.getMonth(),
        medicineDate.getDate(),
        medicineTime.getHours(),
        medicineTime.getMinutes(),
        medicineTime.getSeconds()
      );
      const timestampStr = timestamp.toISOString();
      const data = { prescriptionsId: selectedMedicine, timestamp: timestampStr, status: medicineStatus, note: medicineNote };

      await axios.post(
        `${API_BASE_URL}/api/medicine-history`,
        data,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      Alert.alert(t('success'), t('medicineHistoryAdded'));
      setMedicineModalVisible(false);
      resetMedicineModal();
    } catch (error: any) {
      console.error('Error saving medicine history:', error.response?.data || error.message);
      Alert.alert(t('error'), t('saveMedicineHistoryError'));
    }
  };

  // Save medical history
  const handleSaveMedicalHistory = async () => {
    if (!location || !medicalStatus) {
      Alert.alert(t('notification'), t('incompleteMedicalInfo'));
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert(t('error'), t('noToken'));
        navigation.navigate('Login');
        return;
      }

      const appointmentDate = new Date(
        medicalDate.getFullYear(),
        medicalDate.getMonth(),
        medicalDate.getDate(),
        medicalTime.getHours(),
        medicalTime.getMinutes(),
        medicalTime.getSeconds()
      );
      const appointmentDateStr = appointmentDate.toISOString();
      const data = {
        appointmentDate: appointmentDateStr,
        location,
        status: medicalStatus,
        note: medicalNote,
        userId: await AsyncStorage.getItem('userId'),
      };

      let response;
      if (selectedMedicalHistoryId) {
        response = await axios.put(
          `${API_BASE_URL}/api/medical-history/${selectedMedicalHistoryId}`,
          data,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
        Alert.alert(t('success'), t('medicalHistoryUpdated'));
      } else {
        response = await axios.post(
          `${API_BASE_URL}/api/medical-history`,
          data,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
        Alert.alert(t('success'), t('medicalHistoryAdded'));
      }

      fetchData(); // Refresh events after saving
      setMedicalModalVisible(false);
      resetMedicalModal();
    } catch (error: any) {
      console.error('Error saving medical history:', error.response?.data || error.message);
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
      Alert.alert(t('error'), errorMessage);
    }
  };

  const renderEvents = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#432c81" />
          <Text style={styles.noEventText}>{t('loading')}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.noEventContainer}>
          <Text style={styles.noEventText}>{error}</Text>
          <Button title={t('retry')} onPress={fetchData} />
        </View>
      );
    }

    const dateKey = getDateKey(selectedDate);
    const dayEvents = events[dateKey] || [];
    if (dayEvents.length === 0) {
      return (
        <View style={styles.noEventContainer}>
          <Text style={styles.noEventText}>{t('calendar.noEvent')}</Text>
        </View>
      );
    }

    return dayEvents.map((event, index) => (
      <TouchableOpacity key={index} style={styles.eventItem} onPress={() => handleEventClick(event)}>
        <Text style={styles.eventTime}>{event.time}</Text>
        <Text style={styles.eventName}>{event.name}</Text>
      </TouchableOpacity>
    ));
  };

  const toggleLanguage = () => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
    setLanguage(newLang);
  };

  return (
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
          <Text style={[styles.text, { fontSize: 30, marginTop: 5 }]}>{t('schedule')}</Text>
        </View>
        {/* <Button title={`${t('language')}: ${language.toUpperCase()}`} onPress={toggleLanguage} /> */}
      </View>

      <View style={styles.container}>
        <CalendarPicker
          onDateChange={onDateChange}
          selectedStartDate={selectedDate}
          selectedDayColor="#432c81"
          selectedDayTextColor="#FFFFFF"
          initialDate={selectedDate}
          weekdays={safeWeekdays}
          months={safeMonths}
          previousTitle={t('calendar.previous')}
          nextTitle={t('calendar.next')}
        />
        <View style={styles.title}>
          <Text style={styles.headerText}>
            {t('calendar.title')} {selectedDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
          </Text>
        </View>

        <ScrollView style={styles.eventsContainer}>
          {renderEvents()}
        </ScrollView>
      </View>

      {/* Medicine History Modal */}
      <Modal visible={isMedicineModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setMedicineModalVisible(false)}>
              <FontAwesome name="close" size={24} color="#444" />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.modalTitle}>{t('addMedicineHistory')}</Text>
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
                disabled={true}
              />
              <Text style={styles.inputLabel}>{t('statusLabel')}</Text>
              <DropDownPicker
                open={openMedicineStatus}
                setOpen={setOpenMedicineStatus}
                value={medicineStatus}
                setValue={setMedicineStatus}
                items={medicineStatusItems}
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
                onPress={() => setShowMedicineDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {medicineDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                </Text>
              </TouchableOpacity>
              {showMedicineDatePicker && (
                <DateTimePicker
                  value={medicineDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setMedicineDate(selectedDate);
                      if (Platform.OS === 'android') {
                        setShowMedicineDatePicker(false);
                      }
                    } else if (Platform.OS === 'ios') {
                      setShowMedicineDatePicker(false);
                    }
                  }}
                />
              )}
              <Text style={styles.inputLabel}>{t('time')}</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowMedicineTimePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {medicineTime.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              {showMedicineTimePicker && (
                <DateTimePicker
                  value={medicineTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                  onChange={(event, selectedTime) => {
                    if (selectedTime) {
                      setMedicineTime(selectedTime);
                      if (Platform.OS === 'android') {
                        setShowMedicineTimePicker(false);
                      }
                    } else if (Platform.OS === 'ios') {
                      setShowMedicineTimePicker(false);
                    }
                  }}
                />
              )}
              <Text style={styles.inputLabel}>{t('note')}</Text>
              <TextInput
                placeholder={t('enterNote')}
                style={styles.input}
                value={medicineNote}
                onChangeText={setMedicineNote}
                multiline
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveMedicineHistory}
              >
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Medical History Modal */}
      <Modal visible={isMedicalModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setMedicalModalVisible(false)}>
              <FontAwesome name="close" size={24} color="#444" />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.modalTitle}>{selectedMedicalHistoryId ? t('editMedicalHistory') : t('addMedicalHistory')}</Text>
              <Text style={styles.inputLabel}>{t('location')}</Text>
              <TextInput
                placeholder={t('enterLocation')}
                style={styles.input}
                value={location}
                onChangeText={setLocation}
              />
              <Text style={styles.inputLabel}>{t('statusLabel')}</Text>
              <DropDownPicker
                open={openMedicalStatus}
                setOpen={setOpenMedicalStatus}
                value={medicalStatus}
                setValue={setMedicalStatus}
                items={medicalStatusItems}
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
                onPress={() => setShowMedicalDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {medicalDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                </Text>
              </TouchableOpacity>
              {showMedicalDatePicker && (
                <DateTimePicker
                  value={medicalDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setMedicalDate(selectedDate);
                      if (Platform.OS === 'android') {
                        setShowMedicalDatePicker(false);
                      }
                    } else if (Platform.OS === 'ios') {
                      setShowMedicalDatePicker(false);
                    }
                  }}
                />
              )}
              <Text style={styles.inputLabel}>{t('time')}</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowMedicalTimePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {medicalTime.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              {showMedicalTimePicker && (
                <DateTimePicker
                  value={medicalTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                  onChange={(event, selectedTime) => {
                    if (selectedTime) {
                      setMedicalTime(selectedTime);
                      if (Platform.OS === 'android') {
                        setShowMedicalTimePicker(false);
                      }
                    } else if (Platform.OS === 'ios') {
                      setShowMedicalTimePicker(false);
                    }
                  }}
                />
              )}
              <Text style={styles.inputLabel}>{t('note')}</Text>
              <TextInput
                placeholder={t('enterNote')}
                style={styles.input}
                value={medicalNote}
                onChangeText={setMedicalNote}
                multiline
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveMedicalHistory}
              >
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 25,
    fontFamily: 'Roboto',
    color: '#432c81',
    fontWeight: 'bold',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  title: {
    backgroundColor: '#432c81',
    padding: 10,
    marginTop: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  eventsContainer: {
    flex: 1,
    padding: 10,
  },
  eventItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginVertical: 5,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#432c81',
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    color: '#666',
    marginRight: 10,
    fontSize: 14,
  },
  eventName: {
    fontSize: 16,
  },
  noEventContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noEventText: {
    color: '#888',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
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
  saveButton: {
    backgroundColor: '#432c81',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ScheduleScreen;