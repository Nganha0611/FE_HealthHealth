import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';

type MedicineLog = {
  id: string;
  name: string;
  status: 'Taken' | 'Missing' | 'Late';
  time: string;
  note?: string;
};

const mockData: MedicineLog[] = [
  { id: '1', name: 'Paracetamol 500mg', status: 'Taken', time: '08:00', note: 'Uống đúng giờ' },
  { id: '2', name: 'Vitamin C', status: 'Missing', time: '12:00', note: 'Quên uống' },
  { id: '3', name: 'Aspirin', status: 'Late', time: '18:30', note: 'Uống trễ 30 phút' },
];

const MedicineHistoryDetailScreen = () => {
  const navigation = useNavigation();

  const renderItem = ({ item }: { item: MedicineLog }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={[styles.status, getStatusStyle(item.status)]}>{item.status}</Text>
      </View>
      <Text style={styles.time}>Thời gian: {item.time}</Text>
      {item.note && <Text style={styles.note}>Ghi chú: {item.note}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesome name="chevron-left" size={24} color="#432c81" onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Lịch sử uống thuốc - 23/04/2025</Text>
      </View>
      <FlatList
        data={mockData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Taken':
      return { color: 'green' };
    case 'Missing':
      return { color: 'red' };
    case 'Late':
      return { color: 'orange' };
    default:
      return {};
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  title: {
    fontSize: 22,
    color: '#432c81',
    fontWeight: 'bold',
    marginLeft: 15,
  },
  list: {
    paddingBottom: 20,
  },
  item: {
    backgroundColor: '#e0dee7',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#432c81',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 16,
    color: '#555',
  },
  note: {
    fontSize: 15,
    color: '#432c81',
    marginTop: 5,
  },
});

export default MedicineHistoryDetailScreen;
