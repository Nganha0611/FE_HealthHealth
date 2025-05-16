import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../../contexts/NotificationContext';
import CustomModal from '../../../components/CustomModal';

type RootStackParamList = {
  Login: undefined;
  MonitorMedicine: { followedUserId: string };
  BottomTabs: undefined;
};

type NavigationPropType = StackNavigationProp<RootStackParamList, 'MonitorMedicine'>;

type RouteParams = {
  followedUserId: string;
};

interface Props {
  navigation: NavigationProp<any>;
}

type Medicine = {
  id?: string;
  name: string;
  form: string;
  strength: string | number;
  unit: string;
  amount: string | number;
  instruction: string;
  startday: string;
  note?: string;
  repeatDetails?: {
    type: string;
    interval: string | number;
    daysOfWeek: string[];
    daysOfMonth: string[];
    timePerDay: string[];
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

type HealthDataResponse = {
  prescriptions: Medicine[];
  medicine_history: MedicineHistory[];
};

const MonitorMedicine: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const navigationMain = useNavigation<NavigationPropType>();
  const { showNotification } = useNotification();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { followedUserId } = route.params;

  const [selectedTab, setSelectedTab] = useState<'medicines' | 'history'>('medicines');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicineHistory, setMedicineHistory] = useState<MedicineHistory[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<MedicineHistory | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);

  const statusItems = [
    { label: t('status.taken'), value: 'Taken' },
    { label: t('status.missing'), value: 'Missing' },
    { label: t('status.paused'), value: 'Paused' },
  ];

  const cleanDateString = (dateStr: string): string => {
    if (!dateStr || typeof dateStr !== 'string') return new Date().toISOString();
    return dateStr
      .replace(/ø/g, '0')
      .replace(/ß/g, '0')
      .replace(/•/g, '')
      .replace(/[^\dT:+\-.Z]/g, '')
      .replace(/\+(\d{2}):?$/, '+$1:00')
      .trim();
  };

  const isValidDate = (dateStr: string): boolean => {
    const cleaned = cleanDateString(dateStr);
    const date = new Date(cleaned);
    return !isNaN(date.getTime());
  };

  const loadData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(`healthData_${followedUserId}`);
      if (!storedData) {
        showNotification(t('noStoredData'), 'error');
        setMedicines([]);
        setMedicineHistory([]);
        return;
      }

      let healthData: HealthDataResponse;
      try {
        healthData = JSON.parse(storedData);
      } catch (error) {
        console.error('Error parsing stored data:', error);
        showNotification(t('dataParseError'), 'error');
        setMedicines([]);
        setMedicineHistory([]);
        return;
      }

      const fetchedMedicines = healthData.prescriptions || [];
      const fetchedHistory = healthData.medicine_history || [];

      console.log('Loaded Medicines:', fetchedMedicines);
      console.log('Loaded History:', fetchedHistory);

      if (!Array.isArray(fetchedMedicines)) {
        console.error('Medicines data is not an array or is invalid:', fetchedMedicines);
        setMedicines([]);
      } else {
        setMedicines(fetchedMedicines.map(med => ({
          ...med,
          strength: med.strength || '',
          amount: med.amount || '',
          startday: med.startday || new Date().toLocaleDateString('en-GB'),
          form: med.form || 'tablet',
          note: med.note || '',
        })));
      }

      if (!Array.isArray(fetchedHistory)) {
        console.error('History data is not an array or is invalid:', fetchedHistory);
        setMedicineHistory([]);
      } else {
        setMedicineHistory(fetchedHistory
          .filter(item => isValidDate(item.timestamp))
          .sort((a, b) => new Date(cleanDateString(b.timestamp)).getTime() - new Date(cleanDateString(a.timestamp)).getTime()));
      }
    } catch (error) {
      console.error('Error loading data from AsyncStorage:', error);
      showNotification(t('fetchDataError'), 'error');
      setMedicines([]);
      setMedicineHistory([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getMedicineFormLabel = (value: string): string => {
    const medicineFormItems = [
      { label: t('medicineForms.tablet'), value: 'tablet' },
      { label: t('medicineForms.capsule'), value: 'capsule' },
      { label: t('medicineForms.solution'), value: 'solution' },
      { label: t('medicineForms.injection'), value: 'injection' },
      { label: t('medicineForms.ointment'), value: 'ointment' },
      { label: t('medicineForms.eyeDrops'), value: 'eye_drops' },
      { label: t('medicineForms.inhaler'), value: 'inhaler' },
    ];
    const item = medicineFormItems.find(item => item.value === value);
    return item ? item.label : value;
  };

  const handleMedicineItemPress = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setSelectedHistory(null);
    setDetailModalVisible(true);
  };

  const handleHistoryItemPress = (history: MedicineHistory) => {
    setSelectedHistory(history);
    setSelectedMedicine(null);
    setDetailModalVisible(true);
  };

  const renderDetailModal = () => {
    if (selectedMedicine) {
      return (
        <CustomModal visible={isDetailModalVisible} onClose={() => setDetailModalVisible(false)}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setDetailModalVisible(false)}>
            <FontAwesome name="close" size={24} color="#444" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{t('medicineDetails')}</Text>
          <View style={styles.detailContainer}>
            <Text style={styles.detailLabel}>{t('medicineName')}:</Text>
            <Text style={styles.detailText}>
              {selectedMedicine.name} {selectedMedicine.strength}{selectedMedicine.unit}
            </Text>

            <Text style={styles.detailLabel}>{t('form')}:</Text>
            <Text style={styles.detailText}>
              {getMedicineFormLabel(selectedMedicine.form.toString())}
            </Text>

            <Text style={styles.detailLabel}>{t('amount')}:</Text>
            <Text style={styles.detailText}>
              {selectedMedicine.amount}
            </Text>

            <Text style={styles.detailLabel}>{t('instruction')}:</Text>
            <Text style={styles.detailText}>
              {selectedMedicine.instruction || t('noInstruction')}
            </Text>

            <Text style={styles.detailLabel}>{t('startDate')}:</Text>
            <Text style={styles.detailText}>
              {selectedMedicine.startday}
            </Text>

            <Text style={styles.detailLabel}>{t('note')}:</Text>
            <Text style={styles.detailText}>
              {selectedMedicine.note || t('noNote')}
            </Text>

            {selectedMedicine.repeatDetails && (
              <>
                <Text style={styles.detailLabel}>{t('repeatType')}:</Text>
                <Text style={styles.detailText}>{selectedMedicine.repeatDetails.type || t('unknown')}</Text>

                <Text style={styles.detailLabel}>{t('interval')}:</Text>
                <Text style={styles.detailText}>{selectedMedicine.repeatDetails.interval || t('unknown')}</Text>

                {selectedMedicine.repeatDetails.daysOfWeek?.length > 0 && (
                  <>
                    <Text style={styles.detailLabel}>{t('daysOfWeek')}:</Text>
                    <Text style={styles.detailText}>{selectedMedicine.repeatDetails.daysOfWeek.join(', ') || t('unknown')}</Text>
                  </>
                )}

                {selectedMedicine.repeatDetails.daysOfMonth?.length > 0 && (
                  <>
                    <Text style={styles.detailLabel}>{t('daysOfMonth')}:</Text>
                    <Text style={styles.detailText}>{selectedMedicine.repeatDetails.daysOfMonth.join(', ') || t('unknown')}</Text>
                  </>
                )}

                {selectedMedicine.repeatDetails.timePerDay?.length > 0 && (
                  <>
                    <Text style={styles.detailLabel}>{t('timePerDay')}:</Text>
                    <Text style={styles.detailText}>{selectedMedicine.repeatDetails.timePerDay.join(', ') || t('unknown')}</Text>
                  </>
                )}
              </>
            )}
          </View>
        </CustomModal>
      );
    } else if (selectedHistory) {
      const medicine = medicines.find(m => m.id === selectedHistory.prescriptionsId);
      return (
        <CustomModal visible={isDetailModalVisible} onClose={() => setDetailModalVisible(false)}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setDetailModalVisible(false)}>
            <FontAwesome name="close" size={24} color="#444" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{t('medicineHistoryDetails')}</Text>
          <View style={styles.detailContainer}>
            <Text style={styles.detailLabel}>{t('medicineName')}:</Text>
            <Text style={styles.detailText}>
              {medicine ? `${medicine.name} ${medicine.strength}${medicine.unit}` : t('unknownMedicine')}
            </Text>

            <Text style={styles.detailLabel}>{t('statusLabel')}:</Text>
            <Text style={styles.detailText}>
              {statusItems.find(item => item.value === selectedHistory.status)?.label || selectedHistory.status}
            </Text>

            <Text style={styles.detailLabel}>{t('Time')}:</Text>
            <Text style={styles.detailText}>
              {isValidDate(selectedHistory.timestamp)
                ? new Date(cleanDateString(selectedHistory.timestamp)).toLocaleString('vi-VN', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })
                : t('invalidDate')}
            </Text>

            <Text style={styles.detailLabel}>{t('note')}:</Text>
            <Text style={styles.detailText}>
              {selectedHistory.note || t('noNote')}
            </Text>
          </View>
        </CustomModal>
      );
    }
    return null;
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesome
            name="chevron-left"
            size={20}
            color="#432c81"
            style={{ marginRight: 15, marginTop: 17 }}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.textHeader}>{t('monitorMedicine')}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'medicines' && styles.activeTab]}
          onPress={() => setSelectedTab('medicines')}
        >
          <Text style={[styles.tabText, selectedTab === 'medicines' && styles.activeTabText]}>
            {t('medicineManager')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'history' && styles.activeTab]}
          onPress={() => setSelectedTab('history')}
        >
          <Text style={[styles.tabText, selectedTab === 'history' && styles.activeTabText]}>
            {t('medicineHistory')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {selectedTab === 'medicines' ? (
          medicines.length === 0 ? (
            <Text style={styles.note}>{t('noPrescriptionData')}</Text>
          ) : (
            medicines.map((medicine, index) => (
              <TouchableOpacity
                key={medicine.id || index}
                style={styles.boxFeature}
                onPress={() => handleMedicineItemPress(medicine)}
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
                <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
                  <Text style={styles.titleNote}>{t('note')}:</Text>
                  <Text style={styles.note}>{medicine.note || t('noNote')}</Text>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : medicineHistory.length === 0 ? (
          <Text style={styles.note}>{t('noHistory')}</Text>
        ) : (
          medicineHistory.map((history, index) => {
            const medicine = medicines.find(m => m.id === history.prescriptionsId);
            return (
              <TouchableOpacity
                key={index}
                style={styles.boxFeature}
                onPress={() => handleHistoryItemPress(history)}
              >
                <Text style={styles.boxTitle}>
                  {medicine ? medicine.name : t('unknownMedicine')}
                </Text>
                <Text style={styles.note}>
                  {t('statusLabel')}: {statusItems.find(item => item.value === history.status)?.label || history.status}
                </Text>
                <Text style={styles.note}>
                  {t('Time')}: {new Date(cleanDateString(history.timestamp)).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                </Text>
                <Text style={styles.note}>
                  {t('note')}: {history.note || t('noNote')}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {renderDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
    marginBottom: 10,
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
  },
  activeTab: {
    borderBottomColor: '#432c81',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
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
    justifyContent: 'flex-start',
    padding: 7,
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
});

export default MonitorMedicine;