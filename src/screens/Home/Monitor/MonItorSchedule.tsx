import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import CalendarPicker from 'react-native-calendar-picker';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotification } from '../../../contexts/NotificationContext';
import Modal from '../../../components/CustomModal';
import { NavigationProp, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Định nghĩa RootStackParamList cho navigation
type RootStackParamList = {
  MonitorSchedule: { followedUserId: string };
  [key: string]: any;
};

// Định nghĩa kiểu Navigation và Route
type MonitorScheduleNavigationProp = StackNavigationProp<RootStackParamList, 'MonitorSchedule'>;
type MonitorScheduleRouteProp = RouteProp<RootStackParamList, 'MonitorSchedule'>;

// Định nghĩa kiểu Props
interface Props {
  navigation: NavigationProp<any>;
}

// Định nghĩa các interface cho dữ liệu
interface Event {
  name: string;
  time: string;
  medicineId?: string;
  medicalHistoryId?: string;
  medicineHistoryId?: string;
  medicineDetails?: Medicine;
  medicalHistoryDetails?: MedicalHistory;
  medicineHistoryDetails?: MedicineHistory;
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

interface HealthDataResponse {
  prescriptions: Medicine[];
  medical_history: MedicalHistory[];
  medicine_history: MedicineHistory[];
}

const MonitorSchedule: React.FC<Props> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [language] = useState<'vi' | 'en'>(i18n.language as 'vi' | 'en');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<{ [key: string]: Event[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { showNotification } = useNotification();
  const route = useRoute<MonitorScheduleRouteProp>();
  const { followedUserId } = route.params;

  // Danh sách trạng thái cho MedicineHistory
  const medicineStatusItems = [
    { label: t('status.taken'), value: 'Taken' },
    { label: t('status.missing'), value: 'Missing' },
    { label: t('status.paused'), value: 'Paused' },
  ];

  // Hàm làm sạch chuỗi ngày tháng và chuyển sang múi giờ Việt Nam
  const cleanDateString = (dateStr: string): string => {
    if (!dateStr || typeof dateStr !== 'string') return new Date().toISOString();
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
      return vietnamDate.toISOString();
    }

    return cleaned;
  };

  // Hàm kiểm tra chuỗi ngày hợp lệ
  const isValidDate = (dateStr: string): boolean => {
    const cleaned = cleanDateString(dateStr);
    const date = new Date(cleaned);
    return !isNaN(date.getTime());
  };

  // Hàm xử lý khi chọn ngày trên lịch
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

  // Hàm phân tích startday (DD/MM/YYYY) thành Date
  const parseStartDay = (startday: string): Date => {
    if (!startday) return new Date();
    const [day, month, year] = startday.split('/').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  // Hàm định dạng thời gian sang 12-hour format
  const formatTime = (date: Date): string => {
    return date.toLocaleString('vi-VN', { timeStyle: 'short' });
  };

  // Hàm phân tích thời gian (dạng 12-hour) thành Date để sắp xếp
  const parseTimeToDate = (timeStr: string): Date => {
    const [time] = timeStr.split(' ');
    return new Date(`1970-01-01T${time}:00`);
  };

  // Xử lý sự kiện Medicine
  const processMedicineEvents = (medicines: Medicine[]): { [key: string]: Event[] } => {
    const eventsMap: { [key: string]: Event[] } = {};

    medicines.forEach((medicine) => {
      if (!medicine.repeatDetails || !medicine.startday) return;

      const { type, interval, daysOfWeek, daysOfMonth, timePerDay } = medicine.repeatDetails;
      const startDate = parseStartDay(medicine.startday);
      const intervalNum = parseInt(interval.toString(), 10);
      const endDate = new Date(Date.UTC(2025, 11, 31));

      const addEvent = (date: Date, time: string) => {
        if (date < startDate) return;
        const dateKey = date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
        if (!eventsMap[dateKey]) {
          eventsMap[dateKey] = [];
        }
        const eventDate = new Date(`${date.toISOString().split('T')[0]}T${time}`);
        eventsMap[dateKey].push({
          name: `${t('event.medicine')}: ${medicine.name} ${medicine.strength}${medicine.unit}`,
          time: formatTime(eventDate),
          medicineId: medicine.id,
          medicineDetails: medicine,
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

    return eventsMap;
  };

  // Xử lý sự kiện MedicalHistory
  const processMedicalHistoryEvents = (history: MedicalHistory[]): { [key: string]: Event[] } => {
    const eventsMap: { [key: string]: Event[] } = {};

    history.forEach((entry) => {
      if (!isValidDate(entry.appointmentDate)) return;
      const appointmentDate = new Date(cleanDateString(entry.appointmentDate));
      const dateKey = appointmentDate.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
      const formattedTime = formatTime(appointmentDate);

      if (!eventsMap[dateKey]) {
        eventsMap[dateKey] = [];
      }
      eventsMap[dateKey].push({
        name: `${t('event.appointment')}: ${entry.location} (${t(`medicalStatus.${entry.status.toLowerCase()}`)})`,
        time: formattedTime,
        medicalHistoryId: entry.id,
        medicalHistoryDetails: entry,
      });
    });

    return eventsMap;
  };

  // Xử lý sự kiện MedicineHistory
  const processMedicineHistoryEvents = (history: MedicineHistory[]): { [key: string]: Event[] } => {
    const eventsMap: { [key: string]: Event[] } = {};

    history.forEach((entry) => {
      if (!isValidDate(entry.timestamp)) {
        console.log(`[MedicineHistory] Invalid timestamp for entry ${entry.id}: ${entry.timestamp}`);
        return;
      }
      const eventDate = new Date(cleanDateString(entry.timestamp));
      console.log(`[MedicineHistory] Processed timestamp ${entry.timestamp} -> ${eventDate.toISOString()}`);
      const dateKey = eventDate.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
      const formattedTime = formatTime(eventDate);
      const displayName = entry.medicineName || t('unknownMedicine');

      if (!eventsMap[dateKey]) {
        eventsMap[dateKey] = [];
      }
      eventsMap[dateKey].push({
        name: `${t('event.medicineHistory')}: ${displayName} (${t(`status.${entry.status.toLowerCase()}`) || entry.status})`,
        time: formattedTime,
        medicineHistoryId: entry.id,
        medicineHistoryDetails: entry,
      });
    });

    return eventsMap;
  };

  // Tải dữ liệu từ AsyncStorage
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedData = await AsyncStorage.getItem(`healthData_${followedUserId}`);
      console.log(`[AsyncStorage] Raw data for followedUserId ${followedUserId}:`, storedData);

      if (!storedData) {
        setError(t('noStoredData'));
        showNotification(t('noStoredData'), 'error');
        return;
      }

      let healthData: HealthDataResponse;
      try {
        healthData = JSON.parse(storedData);
      } catch (parseError) {
        console.error('[AsyncStorage] Error parsing stored data:', parseError);
        setError(t('dataParseError'));
        showNotification(t('dataParseError'), 'error');
        return;
      }

      const medicines = Array.isArray(healthData.prescriptions) ? healthData.prescriptions : [];
      const medicalHistory = Array.isArray(healthData.medical_history) ? healthData.medical_history : [];
      const medicineHistory = Array.isArray(healthData.medicine_history) ? healthData.medicine_history : [];

      console.log('[Processed Data] Medicines:', medicines);
      console.log('[Processed Data] Medical History:', medicalHistory);
      console.log('[Processed Data] Medicine History:', medicineHistory);

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
      console.log('[Final] Combined Events:', combinedEvents);
    } catch (err) {
      console.error('[AsyncStorage] Error loading data:', err);
      setError(t('fetchDataError'));
      showNotification(t('fetchDataError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (followedUserId) {
      loadData();
    } else {
      setError(t('missingUserId'));
      setLoading(false);
      showNotification(t('missingUserId'), 'error');
    }
  }, [followedUserId]);

  // Xử lý khi click vào sự kiện
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setDetailModalVisible(true);
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
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const dateKey = selectedDate.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
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

  // Render modal chi tiết
  const renderDetailModal = () => {
    if (!selectedEvent) return null;

    const isMedicineEvent = selectedEvent.name.startsWith(t('event.medicine'));
    const isMedicineHistoryEvent = selectedEvent.name.startsWith(t('event.medicineHistory'));
    const medicineDetails = selectedEvent.medicineDetails;
    const medicalHistoryDetails = selectedEvent.medicalHistoryDetails;
    const medicineHistoryDetails = selectedEvent.medicineHistoryDetails;

    return (
      <Modal visible={isDetailModalVisible} onClose={() => setDetailModalVisible(false)}>
        <TouchableOpacity style={styles.closeButton} onPress={() => setDetailModalVisible(false)}>
          <FontAwesome name="close" size={24} color="#444" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>
          {t(isMedicineEvent ? 'medicineEventDetails' : isMedicineHistoryEvent ? 'medicineHistoryDetails' : 'appointmentDetails')}
        </Text>
        <View style={styles.detailContainer}>
          {isMedicineEvent && medicineDetails ? (
            <>
              <Text style={styles.detailLabel}>{t('medicineName')}:</Text>
              <Text style={styles.detailText}>{medicineDetails.name || t('unknown')}</Text>

              <Text style={styles.detailLabel}>{t('strength')}:</Text>
              <Text style={styles.detailText}>{`${medicineDetails.strength}${medicineDetails.unit}` || t('unknown')}</Text>

              <Text style={styles.detailLabel}>{t('form')}:</Text>
              <Text style={styles.detailText}>{medicineDetails.form || t('unknown')}</Text>

              <Text style={styles.detailLabel}>{t('amount')}:</Text>
              <Text style={styles.detailText}>{medicineDetails.amount || t('unknown')}</Text>

              <Text style={styles.detailLabel}>{t('instruction')}:</Text>
              <Text style={styles.detailText}>{medicineDetails.instruction || t('noInstruction')}</Text>

              <Text style={styles.detailLabel}>{t('startDay')}:</Text>
              <Text style={styles.detailText}>{medicineDetails.startday || t('unknown')}</Text>

              {medicineDetails.repeatDetails && (
                <>
                  <Text style={styles.detailLabel}>{t('repeatType')}:</Text>
                  <Text style={styles.detailText}>{medicineDetails.repeatDetails.type || t('unknown')}</Text>

                  <Text style={styles.detailLabel}>{t('interval')}:</Text>
                  <Text style={styles.detailText}>{medicineDetails.repeatDetails.interval || t('unknown')}</Text>

                  {medicineDetails.repeatDetails.daysOfWeek?.length > 0 && (
                    <>
                      <Text style={styles.detailLabel}>{t('daysOfWeek')}:</Text>
                      <Text style={styles.detailText}>{medicineDetails.repeatDetails.daysOfWeek.join(', ') || t('unknown')}</Text>
                    </>
                  )}

                  {medicineDetails.repeatDetails.daysOfMonth?.length > 0 && (
                    <>
                      <Text style={styles.detailLabel}>{t('daysOfMonth')}:</Text>
                      <Text style={styles.detailText}>{medicineDetails.repeatDetails.daysOfMonth.join(', ') || t('unknown')}</Text>
                    </>
                  )}

                  <Text style={styles.detailLabel}>{t('timePerDay')}:</Text>
                  <Text style={styles.detailText}>
                    {medicineDetails.repeatDetails.timePerDay.map(time => time).join(', ') || t('unknown')}
                  </Text>
                </>
              )}
            </>
          ) : isMedicineHistoryEvent && medicineHistoryDetails ? (
            <>
              <Text style={styles.detailLabel}>{t('medicineName')}:</Text>
              <Text style={styles.detailText}>{medicineHistoryDetails.medicineName || t('unknownMedicine')}</Text>

              <Text style={styles.detailLabel}>{t('statusLabel')}:</Text>
              <Text style={styles.detailText}>
                {medicineStatusItems.find(item => item.value === medicineHistoryDetails.status)?.label || medicineHistoryDetails.status}
              </Text>

              <Text style={styles.detailLabel}>{t('Time')}:</Text>
              <Text style={styles.detailText}>
                {isValidDate(medicineHistoryDetails.timestamp)
                  ? new Date(cleanDateString(medicineHistoryDetails.timestamp)).toLocaleString('vi-VN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : t('invalidDate')}
              </Text>

              <Text style={styles.detailLabel}>{t('note')}:</Text>
              <Text style={styles.detailText}>{medicineHistoryDetails.note || t('noNote')}</Text>
            </>
          ) : medicalHistoryDetails ? (
            <>
              <Text style={styles.detailLabel}>{t('location')}:</Text>
              <Text style={styles.detailText}>{medicalHistoryDetails.location || t('unknownLocation')}</Text>

              <Text style={styles.detailLabel}>{t('statusLabel')}:</Text>
              <Text style={styles.detailText}>
                {t(`medicalStatus.${medicalHistoryDetails.status.toLowerCase()}`) || t('unknownStatus')}
              </Text>

              <Text style={styles.detailLabel}>{t('Time')}:</Text>
              <Text style={styles.detailText}>
                {isValidDate(medicalHistoryDetails.appointmentDate)
                  ? new Date(cleanDateString(medicalHistoryDetails.appointmentDate)).toLocaleString('vi-VN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : t('invalidDate')}
              </Text>

              <Text style={styles.detailLabel}>{t('note')}:</Text>
              <Text style={styles.detailText}>{medicalHistoryDetails.note || t('noNote')}</Text>
            </>
          ) : (
            <Text style={styles.detailText}>{t('noDetailsAvailable')}</Text>
          )}
        </View>
      </Modal>
    );
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
          <Text style={[styles.text, { fontSize: 30, marginTop: 5 }]}>{t('monitorSchedule')}</Text>
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

      {renderDetailModal()}
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
  retryButton: {
    backgroundColor: '#432c81',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MonitorSchedule;