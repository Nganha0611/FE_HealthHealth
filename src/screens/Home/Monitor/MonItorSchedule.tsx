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

// Định nghĩa RootStackParamList
type RootStackParamList = {
  Login: undefined;
  MonitorSchedule: { followedUserId: string };
  BottomTabs: undefined;
};

// Định nghĩa NavigationProp
type NavigationPropType = StackNavigationProp<RootStackParamList, 'MonitorSchedule'>;

type RouteParams = {
  followedUserId: string;
};

// Định nghĩa Props
interface Props {
  navigation: NavigationProp<any>;
}

interface Event {
  name: string;
  time: string;
  medicineId?: string;
  medicalHistoryId?: string;
  medicineDetails?: Medicine;
  medicalHistoryDetails?: MedicalHistory;
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

type HealthDataResponse = {
  prescriptions: Medicine[];
  medical_history: MedicalHistory[];
};

const MonitorSchedule: React.FC<Props> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState<'vi' | 'en'>(i18n.language as 'vi' | 'en');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<{ [key: string]: Event[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);
  const { showNotification } = useNotification();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { followedUserId } = route.params;

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
        if (date < startDate) return;
        const dateKey = getDateKey(date);
        if (!eventsMap[dateKey]) {
          eventsMap[dateKey] = [];
        }
        eventsMap[dateKey].push({
          name: `${t('event.medicine')}: ${medicine.name} ${medicine.strength}${medicine.unit}`,
          time: formatTime(time),
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
        medicalHistoryDetails: entry,
      });
    });

    return eventsMap;
  };

  // Load data from AsyncStorage
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedData = await AsyncStorage.getItem(`healthData_${followedUserId}`);
      if (!storedData) {
        setError(t('noStoredData'));
        setEvents({});
        showNotification(t('noStoredData'), 'error');
        return;
      }

      let healthData: HealthDataResponse;
      try {
        healthData = JSON.parse(storedData);
      } catch (err) {
        console.error('Error parsing stored data:', err);
        setError(t('dataParseError'));
        setEvents({});
        showNotification(t('dataParseError'), 'error');
        return;
      }

      const medicines = healthData.prescriptions || [];
      const medicalHistory = healthData.medical_history || [];

      const medicineEvents = processMedicineEvents(medicines);
      const historyEvents = processMedicalHistoryEvents(medicalHistory);

      const combinedEvents: { [key: string]: Event[] } = {};
      Object.keys(medicineEvents).forEach((dateKey) => {
        combinedEvents[dateKey] = [...(combinedEvents[dateKey] || []), ...medicineEvents[dateKey]];
      });
      Object.keys(historyEvents).forEach((dateKey) => {
        combinedEvents[dateKey] = [...(combinedEvents[dateKey] || []), ...historyEvents[dateKey]];
      });

      Object.keys(combinedEvents).forEach((dateKey) => {
        combinedEvents[dateKey].sort((a, b) => {
          const timeA = parseTimeToDate(a.time);
          const timeB = parseTimeToDate(b.time);
          return timeA.getTime() - timeB.getTime();
        });
      });

      setEvents(combinedEvents);
    } catch (err) {
      console.error('Error loading data from AsyncStorage:', err);
      setError(t('fetchDataError'));
      showNotification(t('fetchDataError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setDetailModalVisible(true);
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
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
          </TouchableOpacity>
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

  const renderDetailModal = () => {
    if (!selectedEvent) return null;

    const isMedicineEvent = selectedEvent.name.startsWith(t('event.medicine'));
    const medicineDetails = selectedEvent.medicineDetails;
    const medicalHistoryDetails = selectedEvent.medicalHistoryDetails;

    return (
      <Modal visible={isDetailModalVisible} onClose={() => setDetailModalVisible(false)}>
        <TouchableOpacity style={styles.closeButton} onPress={() => setDetailModalVisible(false)}>
          <FontAwesome name="close" size={24} color="#444" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{t(isMedicineEvent ? 'medicineEventDetails' : 'appointmentDetails')}</Text>
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
                    {medicineDetails.repeatDetails.timePerDay.map(time => formatTime(time)).join(', ') || t('unknown')}
                  </Text>
                </>
              )}
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
                {new Date(medicalHistoryDetails.appointmentDate).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
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
        </View>

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
      </ScrollView>

      {renderDetailModal()}
    </View>
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