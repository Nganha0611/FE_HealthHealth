import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../../../utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotification } from '../../../contexts/NotificationContext';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import CustomModal from '../../../components/CustomModal';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  numberPhone: string;
  url?: string;
}

interface FollowItem {
  id: string;
  followerUserId: string;
  followedUserId: string;
  status: 'approved' | 'pending' | 'rejected';
  followerUser?: UserInfo;
  followedUser?: UserInfo;
}

type Props = {
  navigation: NavigationProp<any>;
};

const IFollowsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [follows, setFollows] = useState<FollowItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [isModalVisible, setModalVisible] = useState(false);
  const [followedEmail, setFollowedEmail] = useState('');
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    url: '',
    birth: '',
    sex: '',
    isVerifyPhone: false,
  });
  const [selectedItem, setSelectedItem] = useState<FollowItem | null>(null);
  const [optionModalVisible, setOptionModalVisible] = useState(false);

  useEffect(() => {
    fetchFollows();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          console.log('>> loaded user in Account:', u);
          setFormData({
            name: u.name || '',
            email: u.email || '',
            phone: u.numberPhone || '',
            address: u.address || '',
            url: u.url || '',
            birth: u.birth || '',
            sex: u.sex || '',
            isVerifyPhone: u.verify || false,
          });
        }
        console.log('>> loaded user in Account:', stored);
      })();
    }, [])
  );

  const fetchFollows = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        navigation.navigate('Login');
        return;
      }

      const permissionsResponse = await axios.get(`${API_BASE_URL}/api/tracking/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { isFollower: true },
      });

      if (!permissionsResponse.data || permissionsResponse.data.length === 0) {
        setFollows([]);
        return;
      }

      const enrichedFollows = await Promise.all(
        permissionsResponse.data.map(async (item: any) => {
          let followerUser: UserInfo | undefined;
          let followedUser: UserInfo | undefined;

          try {
            const followerResponse = await axios.get(`${API_BASE_URL}/api/auth/users/${item.followerUserId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            followerUser = {
              id: followerResponse.data.id,
              name: followerResponse.data.name,
              email: followerResponse.data.email,
              numberPhone: followerResponse.data.numberPhone,
              url: followerResponse.data.url,
            };
          } catch (error) {
            console.error(`Error fetching follower user ${item.followerUserId}:`, error);
            showNotification(t('fetchUserError', { id: item.followerUserId }), 'error');
          }

          try {
            const followedResponse = await axios.get(`${API_BASE_URL}/api/auth/users/${item.followedUserId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            followedUser = {
              id: followedResponse.data.id,
              name: followedResponse.data.name,
              email: followedResponse.data.email,
              numberPhone: followedResponse.data.numberPhone,
              url: followedResponse.data.url,
            };
          } catch (error) {
            console.error(`Error fetching followed user ${item.followedUserId}:`, error);
            showNotification(t('fetchUserError', { id: item.followedUserId }), 'error');
          }

          return {
            ...item,
            followerUser,
            followedUser,
          };
        })
      );
      setFollows(enrichedFollows);
    } catch (error) {
      console.error('Fetch follows error:', error);
      showNotification(t('fetchFollowsError'), 'error');
    }
  };

  const sendFollowRequest = async () => {
    if (followedEmail === formData.email) {
      showNotification(t('cannotFollowSelf'), 'error');
      return;
    }

    if (!followedEmail) {
      showNotification(t('errorEmptyFields'), 'error');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        navigation.navigate('Login');
        return;
      }
      const response = await axios.post(
        `${API_BASE_URL}/api/tracking/request`,
        { followedEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalVisible(false);
      setFollowedEmail('');
      fetchFollows();
      showNotification(t('requestSentSuccess'), 'success');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404 && error.response?.data?.result === 'userNotFound') {
          showNotification(t('error.emailNotFound'), 'error');
        } else if (error.response?.status === 409) {
          showNotification(t('requestAlreadyExists'), 'error');
        } else {
          showNotification(t('sendRequestError'), 'error');
        }
      } else {
        showNotification(t('sendRequestError'), 'error');
      }
    }
  };

  const deleteFollow = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        navigation.navigate('Login');
        return;
      }
      await axios.delete(`${API_BASE_URL}/api/tracking/cancel/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFollows();
      showNotification(t('deleteFollowSuccess'), 'success');
      setOptionModalVisible(false); // Đóng modal sau khi xóa
    } catch (error) {
      console.error('Error deleting follow:', error);
      showNotification(t('deleteFollowError'), 'error');
    }
  };

  // Hàm gọi API và lưu dữ liệu vào AsyncStorage
  const fetchHealthDataAndStore = async (followedUserId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        navigation.navigate('Login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/tracking/permissions/${followedUserId}/health-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const healthData = response.data;
      console.log('Health Data Response:', healthData); // Log dữ liệu để kiểm tra

      // Lưu dữ liệu vào AsyncStorage
      await AsyncStorage.setItem(`healthData_${followedUserId}`, JSON.stringify(healthData));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        showNotification(t('noPermission'), 'error');
      } else {
        showNotification(t('fetchHealthDataError'), 'error');
      }
    }
  };

  const handleItemPress = async (item: FollowItem) => {
    if (selectedTab === 'approved') {
      // Gọi API và lưu dữ liệu vào AsyncStorage trước khi mở modal
      await fetchHealthDataAndStore(item.followedUserId);
      setSelectedItem(item);
      setOptionModalVisible(true);
    } else if (selectedTab === 'pending') {
      showNotification(
        t('confirmCancelRequest'),
        'warning',
        [
          {
            text: t('cancel'),
            onPress: () => {},
            color: 'danger'
          },
          {
            text: t('confirm'),
            onPress: () => deleteFollow(item.id),
            color: 'primary'
          }
        ]
      );
    } else if (selectedTab === 'rejected') {
      showNotification(
        t('requestRejected'),
        'warning',
        [
          {
            text: t('sendAgain'),
            onPress: () => {
              setFollowedEmail(item.followedUser?.email || '');
              setModalVisible(true);
            },
            color: 'primary'
          }
        ]
      );
    }
  };

  const navigateToScreen = (screen: string) => {
    if (selectedItem) {
      navigation.navigate(screen, { followedUserId: selectedItem.followedUserId });
      setOptionModalVisible(false);
    }
  };

  const renderItem = ({ item }: { item: FollowItem }) => (
    <TouchableOpacity 
      style={styles.item}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.boxImage}>
          <Image
            style={styles.avatar}
            source={
              item.followedUser?.url && item.followedUser.url.startsWith('https')
                ? { uri: item.followedUser.url }
                : require('../../../assets/avatar.jpg')
            }
            onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
          />
        </View>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.itemText}>
          {item.followedUser?.name || t('noName')}
        </Text>
        <Text style={styles.itemSubText}>
          {item.followedUser?.email || t('noEmail')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderOptionModal = () => (
    <CustomModal visible={optionModalVisible} onClose={() => setOptionModalVisible(false)}>
      <TouchableOpacity style={styles.closeButton} onPress={() => setOptionModalVisible(false)}>
        <FontAwesome name="close" size={24} color="#444" />
      </TouchableOpacity>
      <Text style={styles.modalTitle}>{t('selectOption')}</Text>
      <TouchableOpacity style={styles.optionButton} onPress={() => navigateToScreen('MonitorHealthProfile')}>
        <Text style={styles.optionText}>{t('profileHealth')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionButton} onPress={() => navigateToScreen('MonitorMedicine')}>
        <Text style={styles.optionText}>{t('medicines')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionButton} onPress={() => navigateToScreen('MonitorMedical')}>
        <Text style={styles.optionText}>{t('medicalHistory')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionButton} onPress={() => navigateToScreen('MonitorSchedule')}>
        <Text style={styles.optionText}>{t('schedule')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.optionButton, styles.deleteButton]} onPress={() => deleteFollow(selectedItem?.id || '')}>
        <Text style={styles.optionText}>{t('unfollow')}</Text>
      </TouchableOpacity>
    </CustomModal>
  );

  const filteredFollows = follows.filter(f => f.status === selectedTab);

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
          <Text style={styles.textHeader}>{t('iFollows')}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'approved' && styles.selectedTab]}
          onPress={() => setSelectedTab('approved')}
        >
          <Text style={[styles.tabText, selectedTab === 'approved' && styles.selectedTabText]}>
            {t('following')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending' && styles.selectedTab]}
          onPress={() => setSelectedTab('pending')}
        >
          <Text style={[styles.tabText, selectedTab === 'pending' && styles.selectedTabText]}>
            {t('pending')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'rejected' && styles.selectedTab]}
          onPress={() => setSelectedTab('rejected')}
        >
          <Text style={[styles.tabText, selectedTab === 'rejected' && styles.selectedTabText]}>
            {t('rejected')}
          </Text>
        </TouchableOpacity>
      </View>

      {filteredFollows.length > 0 ? (
        <FlatList
          data={filteredFollows}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <Text style={styles.noData}>{t('noDataIFollow')}</Text>
      )}

      <CustomModal visible={isModalVisible} onClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
          <FontAwesome name="close" size={24} color="#444" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{t('createFollowRequest')}</Text>

        <Text style={styles.inputLabel}>{t('followedEmail')}</Text>
        <TextInput
          placeholder={t('enterFollowedEmail')}
          placeholderTextColor="#888"
          style={styles.input}
          autoCapitalize="none"
          onChangeText={setFollowedEmail}
          value={followedEmail}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.buttonText}>{t('cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={sendFollowRequest}
          >
            <Text style={styles.buttonText}>{t('send')}</Text>
          </TouchableOpacity>
        </View>
      </CustomModal>

      {renderOptionModal()}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  textHeader: {
    fontSize: 30,
    fontFamily: 'Roboto',
    color: '#432c81',
    fontWeight: 'bold',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 10,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedTab: {
    backgroundColor: '#432c81',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#432c81',
  },
  selectedTabText: {
    color: '#fff',
  },
  item: {
    flexDirection: 'row',
    padding: 10,
    marginHorizontal: 10,
    marginVertical: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 8,
  },
  boxImage: {
    padding: 5,
    backgroundColor: '#e0dee7',
    borderRadius: 40,
    width: 50,
    height: 50,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 35,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  itemText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#432c81',
    textAlign: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: '#444',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#aaa',
  },
  saveButton: {
    backgroundColor: '#432c81',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#432c81',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  noData: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontSize: 16,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    fontSize: 16,
    color: '#432c81',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  selectOption: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#432c81',
    textAlign: 'center',
  },
});

export default IFollowsScreen;