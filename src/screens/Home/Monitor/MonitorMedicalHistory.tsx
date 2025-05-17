import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../utils/config';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../../contexts/NotificationContext';
import CustomModal from '../../../components/CustomModal';

// Định nghĩa RootStackParamList
type RootStackParamList = {
  Login: undefined;
  MonitorMedicalHistory: { followedUserId: string };
  BottomTabs: undefined;
};

// Định nghĩa NavigationProp
type NavigationPropType = StackNavigationProp<RootStackParamList, 'MonitorMedicalHistory'>;

type RouteParams = {
  followedUserId: string;
};

// Định nghĩa Props
interface Props {
  navigation: NavigationProp<any>;
}

type MedicalHistory = {
  id?: string;
  userId: string;
  appointmentDate: string;
  location: string;
  note: string;
  status: string;
};

type HealthDataResponse = {
  medical_history: MedicalHistory[];
};

const MonitorMedicalHistory: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const navigationMain = useNavigation<NavigationPropType>();
  const { showNotification } = useNotification();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { followedUserId } = route.params;

  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<MedicalHistory | null>(null);
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);

  // List of status items for display
  const statusItems = [
    { label: t('medicalStatus.completed'), value: 'Completed' },
    { label: t('medicalStatus.cancelled'), value: 'Cancelled' },
    { label: t('medicalStatus.pending'), value: 'Pending' },
  ];

  // Hàm làm sạch chuỗi ngày
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

  // Hàm kiểm tra ngày hợp lệ
  const isValidDate = (dateStr: string): boolean => {
    const cleaned = cleanDateString(dateStr);
    const date = new Date(cleaned);
    return !isNaN(date.getTime());
  };

  // Fetch medical history data
  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        navigation.navigate('Login');
        return;
      }

      const response = await axios.get<HealthDataResponse>(
        `${API_BASE_URL}/api/tracking/permissions/${followedUserId}/health-data`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const healthData = response.data;
      const fetchedHistory = healthData.medical_history || [];

      // Log dữ liệu để kiểm tra
      console.log('Fetched Medical History:', fetchedHistory);

      // Kiểm tra và chuẩn hóa dữ liệu
      if (!Array.isArray(fetchedHistory)) {
        console.error('Medical history data is not an array or is invalid:', fetchedHistory);
        setMedicalHistory([]);
      } else {
        setMedicalHistory(fetchedHistory
          .filter(item => isValidDate(item.appointmentDate))
          .sort((a, b) => new Date(cleanDateString(b.appointmentDate)).getTime() - new Date(cleanDateString(a.appointmentDate)).getTime()));
      }
    } catch (error: any) {
      console.error('Error fetching data:', error.response?.data || error.message);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          showNotification(t('noPermission'), 'error');
        } else if (error.response?.status === 401) {
          showNotification(t('unauthorized'), 'error');
          await AsyncStorage.removeItem('token');
          navigation.navigate('Login');
        } else if (error.response?.status === 404) {
          showNotification(t('endpointNotFound'), 'error');
        } else {
          showNotification(t('fetchDataError'), 'error');
        }
      } else {
        showNotification(t('fetchDataError'), 'error');
      }
      setMedicalHistory([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleItemPress = (history: MedicalHistory) => {
    setSelectedHistory(history);
    setDetailModalVisible(true);
  };

  const renderDetailModal = () => (
    <CustomModal visible={isDetailModalVisible} onClose={() => setDetailModalVisible(false)}>
      <TouchableOpacity style={styles.closeButton} onPress={() => setDetailModalVisible(false)}>
        <FontAwesome name="close" size={24} color="#444" />
      </TouchableOpacity>
      <Text style={styles.modalTitle}>{t('medicalHistoryDetails')}</Text>
      <View style={styles.detailContainer}>
        <Text style={styles.detailLabel}>{t('location')}:</Text>
        <Text style={styles.detailText}>{selectedHistory?.location || t('unknownLocation')}</Text>

        <Text style={styles.detailLabel}>{t('statusLabel')}:</Text>
        <Text style={styles.detailText}>
          {statusItems.find(item => item.value === selectedHistory?.status)?.label || selectedHistory?.status || t('unknownStatus')}
        </Text>

        <Text style={styles.detailLabel}>{t('Time')}:</Text>
        <Text style={styles.detailText}>
          {selectedHistory && isValidDate(selectedHistory.appointmentDate)
            ? new Date(cleanDateString(selectedHistory.appointmentDate)).toLocaleString('vi-VN', {
                dateStyle: 'short',
                timeStyle: 'short',
              })
            : t('invalidDate')}
        </Text>

        <Text style={styles.detailLabel}>{t('note')}:</Text>
        <Text style={styles.detailText}>{selectedHistory?.note || t('noNote')}</Text>
      </View>
    </CustomModal>
  );

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
          <Text style={[styles.text, { fontSize: 30, marginTop: 5 }]}>{t('medicalHistory')}</Text>
        </View>
      </View>

      <ScrollView>
        {medicalHistory.length === 0 ? (
          <Text style={styles.note}>{t('noHistory')}</Text>
        ) : (
          medicalHistory.map((history, index) => {
            const appointmentDateStr = cleanDateString(history.appointmentDate);
            const appointmentDate = new Date(appointmentDateStr);
            const formattedDate = isValidDate(history.appointmentDate)
              ? appointmentDate.toLocaleString('vi-VN', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })
              : t('invalidDate');

            return (
              <TouchableOpacity
                key={history.id || `${index}`}
                style={styles.boxFeature}
                onPress={() => handleItemPress(history)}
              >
                <Text style={[styles.text, styles.boxTitle]}>{history.location || t('unknownLocation')}</Text>
                <Text style={styles.note}>
                  {t('statusLabel')}: {statusItems.find(item => item.value === history.status)?.label || history.status || t('unknownStatus')}
                </Text>
                <Text style={styles.note}>
                  {t('Time')}: {formattedDate}
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
    marginLeft: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#432c81',
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

export default MonitorMedicalHistory;