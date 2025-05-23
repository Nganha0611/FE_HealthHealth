import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, ActivityIndicator, TouchableOpacity, TextInput, Platform } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import CalendarPicker from 'react-native-calendar-picker';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../utils/config';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNotification } from '../../contexts/NotificationContext';
import Modal from '../../components/CustomModal';
import { NavigationProp } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

interface Event {
  name: string;
  time: string;
  medicineId?: string;
  medicalHistoryId?: string;
  medicineHistoryId?: string;
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

interface MedicineHistory {
  id: string;
  userId: string;
  medicineName: string;
  timestamp: string;
  status: string;
  note: string;
}

type Props = {
  navigation: NavigationProp<any>;
};

const ScheduleScreen: React.FC<Props> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [language] = useState<'vi' | 'en'>(i18n.language as 'vi' | 'en');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<{ [key: string]: Event[] }>({});
  const [medicineHistory, setMedicineHistory] = useState<MedicineHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMedicineModalVisible, setMedicineModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [medicineStatus, setMedicineStatus] = useState<string | null>(null);
  const [medicineNote, setMedicineNote] = useState('');
  const [medicineDateTime, setMedicineDateTime] = useState(new Date());
  const [showMedicineDatePicker, setShowMedicineDatePicker] = useState(false);
  const [showMedicineTimePicker, setShowMedicineTimePicker] = useState(false);
  const [openMedicineStatus, setOpenMedicineStatus] = useState(false);
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
  const [isMedicineHistoryDetailModalVisible, setMedicineHistoryDetailModalVisible] = useState(false);
  const [selectedMedicineHistory, setSelectedMedicineHistory] = useState<MedicineHistory | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const { showNotification } = useNotification();
  const { logout } = useAuth();

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

  // Hàm làm sạch chuỗi ngày tháng và chuyển sang múi giờ Việt Nam
  const cleanDateString = (dateStr: string): string => {
    if (!dateStr || typeof dateStr !== 'string') {
      console.log('[cleanDateString] Invalid or empty date string, returning current date');
      return new Date().toISOString();
    }
    let cleaned = dateStr
      .replace(/ø/g, '0')
      .replace(/ß/g, '0')
      .replace(/•/g, '')
      .replace(/[^\dT:+\-.Z]/g, '')
      .replace(/\+(\d{2}):?$/, '+$1:00')
      .trim();

    // Nếu không có múi giờ, giả định là UTC và chuyển sang múi giờ Việt Nam (+07:00)
    if (!cleaned.includes('Z') && !cleaned.includes('+')) {
      const date = new Date(cleaned + 'Z');
      const vietnamDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
      console.log(`[cleanDateString] No timezone, converted ${cleaned} to Vietnam time: ${vietnamDate.toISOString()}`);
      return vietnamDate.toISOString();
    }

    console.log(`[cleanDateString] Processed date string: ${cleaned}`);
    return cleaned;
  };

  // Hàm kiểm tra ngày hợp lệ
  const isValidDate = (dateStr: string): boolean => {
    const cleaned = cleanDateString(dateStr);
    const date = new Date(cleaned);
    const isValid = !isNaN(date.getTime());
    console.log(`[isValidDate] Checking date ${dateStr} -> ${cleaned}: ${isValid ? 'Valid' : 'Invalid'}`);
    return isValid;
  };

  // Hàm lấy dateKey theo múi giờ Việt Nam
  const getDateKey = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
  };

  // Hàm xử lý khi chọn ngày
  const onDateChange = (date: any) => {
    if (date?.toDate) {
      setSelectedDate(date.toDate());
    } else {
      setSelectedDate(new Date(date));
    }
  };

  // Định nghĩa ngày trong tuần và tháng
  const weekdays = t('calendar.weekdays', { returnObjects: true });
  const safeWeekdays = Array.isArray(weekdays) ? weekdays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const months = t('calendar.months', { returnObjects: true });
  const safeMonths = Array.isArray(months) ? months : [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Hàm phân tích startday (DD/MM/YYYY)
  const parseStartDay = (startday: string): Date => {
    if (!startday) {
      console.log('[parseStartDay] No startday provided, returning current date');
      return new Date();
    }
    const [day, month, year] = startday.split('/').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    console.log(`[parseStartDay] Parsed ${startday} to ${date.toISOString()}`);
    return date;
  };

  // Hàm định dạng thời gian sang 24 giờ
  const formatTime = (date: Date): string => {
    const formatted = date.toLocaleString('vi-VN', { timeStyle: 'short' });
    console.log(`[formatTime] Formatted ${date.toISOString()} to ${formatted}`);
    return formatted;
  };

  // Hàm phân tích thời gian để sắp xếp
  const parseTimeToDate = (timeStr: string): Date => {
    const [time] = timeStr.split(' ');
    const date = new Date(`1970-01-01T${time}:00`);
    console.log(`[parseTimeToDate] Parsed ${timeStr} to ${date.toISOString()}`);
    return date;
  };

  // Xử lý sự kiện Medicine
  const processMedicineEvents = (medicines: Medicine[]): { [key: string]: Event[] } => {
    const eventsMap: { [key: string]: Event[] } = {};

    medicines.forEach((medicine) => {
      if (!medicine.repeatDetails || !medicine.startday) {
        console.log(`[processMedicineEvents] Skipping medicine ${medicine.name}: missing repeatDetails or startday`);
        return;
      }

      const { type, interval, daysOfWeek, daysOfMonth, timePerDay } = medicine.repeatDetails;
      const startDate = parseStartDay(medicine.startday);
      const intervalNum = parseInt(interval.toString(), 10);
      const endDate = new Date(Date.UTC(2025, 11, 31));

      const addEvent = (date: Date, time: string) => {
        if (date < startDate) return;
        const eventDate = new Date(`${date.toISOString().split('T')[0]}T${time}`);
        const dateKey = getDateKey(eventDate);
        if (!eventsMap[dateKey]) {
          eventsMap[dateKey] = [];
        }
        eventsMap[dateKey].push({
          name: `${t('event.medicine')}: ${medicine.name} ${medicine.strength}${medicine.unit}`,
          time: formatTime(eventDate),
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

        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    });

    console.log('[processMedicineEvents] Generated events:', eventsMap);
    return eventsMap;
  };

  // Xử lý sự kiện MedicalHistory
  const processMedicalHistoryEvents = (history: MedicalHistory[]): { [key: string]: Event[] } => {
    const eventsMap: { [key: string]: Event[] } = {};

    history.forEach((entry) => {
      if (!isValidDate(entry.appointmentDate)) {
        console.log(`[processMedicalHistoryEvents] Invalid appointmentDate for entry ${entry.id}: ${entry.appointmentDate}`);
        return;
      }
      const appointmentDate = new Date(cleanDateString(entry.appointmentDate));
      const dateKey = getDateKey(appointmentDate);
      const formattedTime = formatTime(appointmentDate);

      if (!eventsMap[dateKey]) {
        eventsMap[dateKey] = [];
      }
      eventsMap[dateKey].push({
        name: `${t('event.appointment')}: ${entry.location} (${t(`medicalStatus.${entry.status.toLowerCase()}`)})`,
        time: formattedTime,
        medicalHistoryId: entry.id,
      });
    });

    console.log('[processMedicalHistoryEvents] Generated events:', eventsMap);
    return eventsMap;
  };

  // Xử lý sự kiện MedicineHistory
  const processMedicineHistoryEvents = (history: MedicineHistory[]): { [key: string]: Event[] } => {
    const eventsMap: { [key: string]: Event[] } = {};

    history.forEach((entry) => {
      if (!isValidDate(entry.timestamp)) {
        console.log(`[processMedicineHistoryEvents] Invalid timestamp for entry ${entry.id}: ${entry.timestamp}`);
        return;
      }
      const eventDate = new Date(cleanDateString(entry.timestamp));
      console.log(`[processMedicineHistoryEvents] Processed timestamp ${entry.timestamp} -> ${eventDate.toISOString()}`);
      const dateKey = getDateKey(eventDate);
      const formattedTime = formatTime(eventDate);
      const displayName = entry.medicineName || t('unknownMedicine');

      if (!eventsMap[dateKey]) {
        eventsMap[dateKey] = [];
      }
      eventsMap[dateKey].push({
        name: `${t('event.medicineHistory')}: ${displayName} (${t(`status.${entry.status.toLowerCase()}`) || entry.status})`,
        time: formattedTime,
        medicineHistoryId: entry.id,
      });
    });

    console.log('[processMedicineHistoryEvents] Generated events:', eventsMap);
    return eventsMap;
  };

  // Tải dữ liệu từ API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      console.log('[fetchData] Token:', token);
      console.log('[fetchData] UserId:', userId);
      if (!token || !userId) {
        showNotification(t('noToken'), 'warning', [
          { text: t('cancel'), onPress: () => {}, color: 'danger' },
          { text: t('logout'), onPress: logout, color: 'primary' },
        ]);
        return;
      }

      const [medicineResponse, medicalHistoryResponse, medicineHistoryResponse] = await Promise.all([
        axios.get<Medicine[]>(`${API_BASE_URL}/api/prescriptions`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }),
        axios.get<MedicalHistory[]>(`${API_BASE_URL}/api/medical-history`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }),
        axios.get<MedicineHistory[]>(`${API_BASE_URL}/api/medicine-history`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          params: { userId },
        }),
      ]);

      const medicines = medicineResponse.data.map(med => ({
        ...med,
        name: med.name.trim().toLowerCase(),
      }));
      const medicalHistory = medicalHistoryResponse.data;
      const medicineHistory = medicineHistoryResponse.data.map(history => ({
        ...history,
        medicineName: history.medicineName?.trim().toLowerCase(),
      }));

      console.log('[fetchData] Medicines:', medicines);
      console.log('[fetchData] Medical History:', medicalHistory);
      console.log('[fetchData] Medicine History:', medicineHistory);

      setMedicines(medicines);
      setMedicalHistory(medicalHistory);
      setMedicineHistory(
        medicineHistory
          .filter(item => isValidDate(item.timestamp))
          .sort((a, b) => new Date(cleanDateString(b.timestamp)).getTime() - new Date(cleanDateString(a.timestamp)).getTime())
      );

      const medicineEvents = processMedicineEvents(medicines);
      const historyEvents = processMedicalHistoryEvents(medicalHistory);
      const medicineHistoryEvents = processMedicineHistoryEvents(medicineHistory);

      const combinedEvents: { [key: string]: Event[] } = {};
      Object.keys(medicineEvents).forEach((dateKey) => {
        combinedEvents[dateKey] = [...(combinedEvents[dateKey] || []), ...medicineEvents[dateKey]];
      });
      Object.keys(historyEvents).forEach((dateKey) => {
        combinedEvents[dateKey] = [...(combinedEvents[dateKey] || []), ...historyEvents[dateKey]];
      });
      Object.keys(medicineHistoryEvents).forEach((dateKey) => {
        combinedEvents[dateKey] = [...(combinedEvents[dateKey] || []), ...medicineHistoryEvents[dateKey]];
      });

      Object.keys(combinedEvents).forEach((dateKey) => {
        combinedEvents[dateKey].sort((a, b) => {
          const timeA = parseTimeToDate(a.time);
          const timeB = parseTimeToDate(b.time);
          return timeA.getTime() - timeB.getTime();
        });
      });

      setEvents(combinedEvents);
      console.log('[fetchData] Combined Events:', combinedEvents);
    } catch (err: any) {
      console.error('[fetchData] Error fetching data:', err.response?.data || err.message);
      setError(t('fetchDataError'));
      if (err.response?.status === 401) {
        showNotification(t('sessionExpired'), 'error');
        await AsyncStorage.removeItem('token');
        showNotification(t('noToken'), 'warning', [
          { text: t('cancel'), onPress: () => {}, color: 'danger' },
          { text: t('logout'), onPress: logout, color: 'primary' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset modal Medicine
  const resetMedicineModal = () => {
    setSelectedMedicine(null);
    setMedicineStatus(null);
    setMedicineNote('');
    setMedicineDateTime(new Date());
    setOpenMedicineStatus(false);
    setShowMedicineDatePicker(false);
    setShowMedicineTimePicker(false);
  };

  // Reset modal Medical
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

  // Xử lý khi click vào sự kiện
  const handleEventClick = (event: Event) => {
    if (event.name.startsWith(t('event.medicine')) && event.medicineId) {
      const selectedTime = parseTimeToDate(event.time);
      const medicine = medicines.find(m => m.id === event.medicineId);
      if (medicine) {
        setSelectedMedicine(medicine);
        setMedicineStatus(null);
        setMedicineNote('');
        const dateTime = new Date(selectedDate);
        dateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
        setMedicineDateTime(dateTime);
        setMedicineModalVisible(true);
      }
    } else if (event.name.startsWith(t('event.appointment')) && event.medicalHistoryId) {
      const history = medicalHistory.find(h => h.id === event.medicalHistoryId);
      if (history) {
        const appointmentDate = new Date(cleanDateString(history.appointmentDate));
        setSelectedMedicalHistoryId(history.id || null);
        setLocation(history.location);
        setMedicalStatus(history.status);
        setMedicalNote(history.note || '');
        setMedicalDate(appointmentDate);
        setMedicalTime(appointmentDate);
        setMedicalModalVisible(true);
      }
    } else if (event.name.startsWith(t('event.medicineHistory')) && event.medicineHistoryId) {
      const history = medicineHistory.find(h => h.id === event.medicineHistoryId);
      if (history) {
        setSelectedMedicineHistory(history);
        setMedicineHistoryDetailModalVisible(true);
      }
    }
  };

  // Lưu MedicineHistory
  const handleSaveMedicineHistory = async () => {
    if (!selectedMedicine || !medicineStatus) {
      showNotification(t('incompleteMedicineInfo'), 'error');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      console.log('[handleSaveMedicineHistory] Token:', token);
      console.log('[handleSaveMedicineHistory] UserId:', userId);
      if (!token || !userId) {
        showNotification(t('noToken'), 'warning', [
          { text: t('cancel'), onPress: () => {}, color: 'danger' },
          { text: t('logout'), onPress: logout, color: 'primary' },
        ]);
        return;
      }

      const timestampStr = medicineDateTime.toISOString();
      const data = {
        userId,
        medicineName: selectedMedicine.name.trim().toLowerCase(),
        timestamp: timestampStr,
        status: medicineStatus,
        note: medicineNote,
      };

      await axios.post(`${API_BASE_URL}/api/medicine-history`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      showNotification(t('medicineHistoryAdded'), 'success');
      setMedicineModalVisible(false);
      resetMedicineModal();
      fetchData();
    } catch (error: any) {
      console.error('[handleSaveMedicineHistory] Error saving medicine history:', error.response?.data || error.message);
      showNotification(t('saveMedicineHistoryError'), 'error');
    }
  };

  // Lưu MedicalHistory
  const handleSaveMedicalHistory = async () => {
    if (!location || !medicalStatus) {
      showNotification(t('incompleteMedicalInfo'), 'error');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      console.log('[handleSaveMedicalHistory] Token:', token);
      if (!token) {
        showNotification(t('noToken'), 'warning', [
            { text: t('cancel'), onPress: () => {}, color: 'danger' },
          { text: t('logout'), onPress: logout, color: 'primary' },
        ]);
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
        response = await axios.put(`${API_BASE_URL}/api/medical-history/${selectedMedicalHistoryId}`, data, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        showNotification(t('medicalHistoryUpdated'), 'success');
      } else {
        response = await axios.post(`${API_BASE_URL}/api/medical-history`, data, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        showNotification(t('medicalHistoryAdded'), 'success');
      }

      fetchData();
      setMedicalModalVisible(false);
      resetMedicalModal();
    } catch (error: any) {
      console.error('[handleSaveMedicalHistory] Error saving medical history:', error.response?.data || error.message);
      showNotification(t('saveMedicalHistoryError'), 'error');
    }
  };

  // Render danh sách sự kiện
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
        <Text style={styles.eventName} numberOfLines={1} ellipsizeMode="tail">
          {event.name}
        </Text>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
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
      </View>

      <ScrollView>
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
        <ScrollView style={styles.eventsContainer}>{renderEvents()}</ScrollView>
      </ScrollView>

      <Modal visible={isMedicineModalVisible} onClose={() => setMedicineModalVisible(false)}>
        <TouchableOpacity style={styles.closeButton} onPress={() => setMedicineModalVisible(false)}>
          <FontAwesome name="close" size={24} color="#444" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{t('addMedicineHistory')}</Text>
        <View style={styles.detailContainer}>
          <Text style={styles.detailLabel}>{t('medicineName')}:</Text>
          <Text style={styles.detailText}>
            {selectedMedicine ? `${selectedMedicine.name} ${selectedMedicine.strength}${selectedMedicine.unit}` : t('unknown')}
          </Text>

          <Text style={styles.detailLabel}>{t('statusLabel')}:</Text>
          <DropDownPicker
            open={openMedicineStatus}
            value={medicineStatus}
            setOpen={setOpenMedicineStatus}
            setValue={setMedicineStatus}
            items={medicineStatusItems}
            containerStyle={styles.dropdownContainer}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownList}
            placeholder={t('selectStatus')}
            zIndex={1000}
          />

          <Text style={styles.detailLabel}>{t('date')}:</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowMedicineDatePicker(true)}>
            <Text style={styles.dateButtonText}>
              {medicineDateTime.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
            </Text>
          </TouchableOpacity>
          {showMedicineDatePicker && (
            <DateTimePicker
              value={medicineDateTime}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={(event, date) => {
                setShowMedicineDatePicker(Platform.OS === 'ios');
                if (date) {
                  const newDateTime = new Date(medicineDateTime);
                  newDateTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                  setMedicineDateTime(newDateTime);
                }
              }}
            />
          )}

          <Text style={styles.detailLabel}>{t('Time')}:</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowMedicineTimePicker(true)}>
            <Text style={styles.dateButtonText}>{formatTime(medicineDateTime)}</Text>
          </TouchableOpacity>
          {showMedicineTimePicker && (
            <DateTimePicker
              value={medicineDateTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
              onChange={(event, time) => {
                setShowMedicineTimePicker(Platform.OS === 'ios');
                if (time) {
                  const newDateTime = new Date(medicineDateTime);
                  newDateTime.setHours(time.getHours(), time.getMinutes());
                  setMedicineDateTime(newDateTime);
                }
              }}
            />
          )}

          <Text style={styles.detailLabel}>{t('note')}:</Text>
          <TextInput
            style={styles.input}
            value={medicineNote}
            onChangeText={setMedicineNote}
            placeholder={t('enterNote')}
            multiline
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveMedicineHistory}>
            <Text style={styles.saveButtonText}>{t('save')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={isMedicalModalVisible} onClose={() => setMedicalModalVisible(false)}>
        <TouchableOpacity style={styles.closeButton} onPress={() => setMedicalModalVisible(false)}>
          <FontAwesome name="close" size={24} color="#444" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{selectedMedicalHistoryId ? t('editAppointment') : t('addAppointment')}</Text>
        <View style={styles.detailContainer}>
          <Text style={styles.detailLabel}>{t('location')}:</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder={t('enterLocation')}
          />

          <Text style={styles.detailLabel}>{t('statusLabel')}:</Text>
          <DropDownPicker
            open={openMedicalStatus}
            value={medicalStatus}
            setOpen={setOpenMedicalStatus}
            setValue={setMedicalStatus}
            items={medicalStatusItems}
            containerStyle={styles.dropdownContainer}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownList}
            placeholder={t('selectStatus')}
            zIndex={1000}
          />

          <Text style={styles.detailLabel}>{t('date')}:</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowMedicalDatePicker(true)}>
            <Text style={styles.dateButtonText}>
              {medicalDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
            </Text>
          </TouchableOpacity>
          {showMedicalDatePicker && (
            <DateTimePicker
              value={medicalDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={(event, date) => {
                setShowMedicalDatePicker(Platform.OS === 'ios');
                if (date) setMedicalDate(date);
              }}
            />
          )}

          <Text style={styles.detailLabel}>{t('Time')}:</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowMedicalTimePicker(true)}>
            <Text style={styles.dateButtonText}>{formatTime(medicalTime)}</Text>
          </TouchableOpacity>
          {showMedicalTimePicker && (
            <DateTimePicker
              value={medicalTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
              onChange={(event, time) => {
                setShowMedicalTimePicker(Platform.OS === 'ios');
                if (time) setMedicalTime(time);
              }}
            />
          )}

          <Text style={styles.detailLabel}>{t('note')}:</Text>
          <TextInput
            style={styles.input}
            value={medicalNote}
            onChangeText={setMedicalNote}
            placeholder={t('enterNote')}
            multiline
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveMedicalHistory}>
            <Text style={styles.saveButtonText}>{t('save')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={isMedicineHistoryDetailModalVisible} onClose={() => setMedicineHistoryDetailModalVisible(false)}>
        <TouchableOpacity style={styles.closeButton} onPress={() => setMedicineHistoryDetailModalVisible(false)}>
          <FontAwesome name="close" size={24} color="#444" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{t('medicineHistoryDetails')}</Text>
        <View style={styles.detailContainer}>
          <Text style={styles.detailLabel}>{t('medicineName')}:</Text>
          <Text style={styles.detailText}>
            {selectedMedicineHistory?.medicineName || t('unknownMedicine')}
          </Text>

          <Text style={styles.detailLabel}>{t('statusLabel')}:</Text>
          <Text style={styles.detailText}>
            {medicineStatusItems.find(item => item.value === selectedMedicineHistory?.status)?.label || selectedMedicineHistory?.status || t('unknown')}
          </Text>

          <Text style={styles.detailLabel}>{t('Time')}:</Text>
          <Text style={styles.detailText}>
            {selectedMedicineHistory && isValidDate(selectedMedicineHistory.timestamp)
              ? new Date(cleanDateString(selectedMedicineHistory.timestamp)).toLocaleString('vi-VN', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })
              : t('invalidDate')}
          </Text>

          <Text style={styles.detailLabel}>{t('note')}:</Text>
          <Text style={styles.detailText}>
            {selectedMedicineHistory?.note || t('noNote')}
          </Text>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 25,
    fontFamily: 'Roboto',
    color: '#432c81',
    fontWeight: 'bold',
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
    flex: 1,
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
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#432c81',
    marginBottom: 15,
    textAlign: 'center',
  },
  detailContainer: {
    width: '100%',
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#432c81',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  dropdownContainer: {
    marginBottom: 10,
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
    marginBottom: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#432c81',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ScheduleScreen;