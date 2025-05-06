import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import CalendarPicker from 'react-native-calendar-picker';
import { useTranslation } from 'react-i18next';

const ScheduleScreen: React.FC<any> = ({ navigation }) => {
  const { t, i18n } = useTranslation();

  const [language, setLanguage] = useState<'vi' | 'en'>(i18n.language as 'vi' | 'en');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const events: { [key: string]: { name: string; time: string }[] } = {
    '2025-04-23': [
      { name: 'Đi khám bác sĩ', time: '9:00 AM' },
      { name: 'Uống thuốc', time: '10:00 AM' },
      { name: 'Tập thể dục', time: '4:00 PM' },
      { name: 'Tập thể dục', time: '4:00 PM' },
      { name: 'Tập thể dục', time: '4:00 PM' },
      { name: 'Tập thể dục', time: '4:00 PM' },
      { name: 'Tập thể dục', time: '4:00 PM' },
      { name: 'Tập thể dục', time: '4:00 PM' },

    ],
    '2025-04-24': [
      { name: 'Tái khám', time: '8:00 AM' },
    ],
  };
  

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

  const renderEvents = () => {
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
      <View key={index} style={styles.eventItem}>
        <Text style={styles.eventTime}>{event.time}</Text>
        <Text style={styles.eventName}>{event.name}</Text>
      </View>
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
          <Text style={[styles.text, { fontSize: 30, marginTop: 5 }]}>Lịch</Text>
        </View>
        {/* <Button title={`Lang: ${language.toUpperCase()}`} onPress={toggleLanguage} /> */}
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
    </ScrollView>
  );
};

// Styles remain the same
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
});

export default ScheduleScreen;