import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import moment from 'moment';

const MyCalendarApp = () => {
  const [selectedDate, setSelectedDate] = useState(new Date('2025-04-23'));
  
  type Event = { name: string; time: string };
  
  const events: { [key: string]: Event[] } = {
    '2025-04-23': [{ name: 'Đi khám bác sĩ', time: '9:00 AM' }],
    '2025-04-24': [{ name: 'Uống thuốc tim', time: '8:00 AM' }],
  };
  
  const getDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  const onDateChange = (date: any) => {
    if (date && typeof date.toDate === 'function') {
      setSelectedDate(date.toDate());
    } else if (date) {
      setSelectedDate(new Date(date));
    }
  };
  
  const renderEvents = () => {
    const dateKey = getDateKey(selectedDate);
    const dayEvents = events[dateKey] || [];
    
    if (dayEvents.length === 0) {
      return (
        <View style={styles.noEventContainer}>
          <Text style={styles.noEventText}>Không có sự kiện</Text>
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
  
  return (
    <View style={styles.container}>
      <CalendarPicker
        onDateChange={onDateChange}
        selectedStartDate={selectedDate}
        selectedDayColor="#5ce0d8"
        selectedDayTextColor="#FFFFFF"
        initialDate={selectedDate}
      />
      
      <View style={styles.title}>
        <Text style={styles.headerText}>
          Sự kiện ngày {selectedDate.toLocaleDateString('vi-VN')}
        </Text>
      </View>
      
      <ScrollView style={styles.eventsContainer}>
        {renderEvents()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  title: {
    backgroundColor: '#5ce0d8',
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
    borderLeftColor: '#5ce0d8',
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

export default MyCalendarApp;