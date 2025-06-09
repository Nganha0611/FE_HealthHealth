import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { NavigationProp } from '@react-navigation/native';
import { API_BASE_URL } from '../../../utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext'; // Thêm useAuth
import FontAwesome from 'react-native-vector-icons/FontAwesome';

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
  status: 'approved' | 'pending';
  followerUser?: UserInfo;
}

type Props = {
  navigation: NavigationProp<any>;
};

const MyFollowsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [followers, setFollowers] = useState<FollowItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<'approved' | 'pending'>('approved');
  const { showNotification } = useNotification();
  const { logout } = useAuth(); // Thêm logout

  useEffect(() => {
    fetchFollowers();
  }, []);

  const refreshToken = async (): Promise<string | null> => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) return null;
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/refresh`,
        { refreshToken },
        { timeout: 20000 }
      );
      const newToken = response.data.accessToken;
      await AsyncStorage.setItem('token', newToken);
      return newToken;
    } catch (error) {
      console.warn('Error refreshing token:', error);
      return null;
    }
  };

  const fetchFollowers = async () => {
    try {
      let token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        logout();
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/tracking/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { isFollower: false },
      });

      if (!response.data || response.data.length === 0) {
        setFollowers([]);
        return;
      }

      const enrichedFollowers = await Promise.all(
        response.data.map(async (item: any) => {
          let followerUser: UserInfo | undefined;
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
          } catch (error: any) {
            console.warn(`Error fetching follower user ${item.followerUserId}:`, error);
            if (error.response?.status === 401) {
              token = await refreshToken();
              if (token) {
                try {
                  const retryResponse = await axios.get(`${API_BASE_URL}/api/auth/users/${item.followerUserId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  followerUser = {
                    id: retryResponse.data.id,
                    name: retryResponse.data.name,
                    email: retryResponse.data.email,
                    numberPhone: retryResponse.data.numberPhone,
                    url: retryResponse.data.url,
                  };
                } catch (retryError) {
                  console.warn(`Retry failed for follower user ${item.followerUserId}:`, retryError);
                }
              } else {
                showNotification(t('sessionExpired'), 'error');
                logout();
                return null; // Bỏ qua item này
              }
            } else if (error.response?.status === 404) {
              // Người dùng không tồn tại, để followerUser là undefined
              console.warn(`User ${item.followerUserId} not found`);
            }
            // Không hiển thị thông báo lỗi cho người dùng
          }

          return followerUser ? { ...item, followerUser } : { ...item, followerUser: undefined };
        })
      );

      // Lọc bỏ các item null (do logout)
      const validFollowers = enrichedFollowers.filter((item): item is FollowItem => item !== null);
      setFollowers(validFollowers);
    } catch (error) {
      console.error('Error fetching followers:', error);
      showNotification(t('fetchFollowersError'), 'error');
    }
  };

  const deleteFollow = async (id: string) => {
    try {
      let token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        logout();
        return;
      }
      await axios.delete(`${API_BASE_URL}/api/tracking/cancel/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFollowers();
      showNotification(t('deleteFollowSuccess'), 'success');
    } catch (error: any) {
      console.error('Error deleting follow:', error);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            await axios.delete(`${API_BASE_URL}/api/tracking/cancel/${id}`, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            fetchFollowers();
            showNotification(t('deleteFollowSuccess'), 'success');
            return;
          } catch (retryError) {
            console.warn('Retry delete follow failed:', retryError);
          }
        }
        showNotification(t('sessionExpired'), 'error');
        logout();
      }else if (axios.isAxiosError(error) && error.response?.status === 404) {
        showNotification(t('noUserInfo'), 'error');
      }  else {
        showNotification(t('deleteFollowError'), 'error');
      }
    }
  };

  const acceptRequest = async (id: string) => {
    try {
      let token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        logout();
        return;
      }
      const response = await axios.put(
        `${API_BASE_URL}/api/tracking/update-status/${id}`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200 && response.data.result === 'success') {
        fetchFollowers();
        showNotification(t('acceptRequestSuccess'), 'success');
      }
    } catch (error: any) {
      console.error('Error accepting request:', error);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const retryResponse = await axios.put(
              `${API_BASE_URL}/api/tracking/update-status/${id}`,
              { status: 'approved' },
              { headers: { Authorization: `Bearer ${newToken}` } }
            );
            if (retryResponse.status === 200 && retryResponse.data.result === 'success') {
              fetchFollowers();
              showNotification(t('acceptRequestSuccess'), 'success');
              return;
            }
          } catch (retryError) {
            console.warn('Retry accept request failed:', retryError);
          }
        }
        showNotification(t('sessionExpired'), 'error');
        logout();
      } else if( error.response?.status === 404) {
        showNotification(t('requestNotFound'), 'error');
      }
      else {
        showNotification(t('acceptRequestError'), 'error');
      }
    }
  };

  const rejectRequest = async (id: string) => {
    try {
      let token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        logout();
        return;
      }
      await axios.put(
        `${API_BASE_URL}/api/tracking/update-status/${id}`,
        { status: 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchFollowers();
      showNotification(t('rejectRequestSuccess'), 'success');
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            await axios.put(
              `${API_BASE_URL}/api/tracking/update-status/${id}`,
              { status: 'rejected' },
              { headers: { Authorization: `Bearer ${newToken}` } }
            );
            fetchFollowers();
            showNotification(t('rejectRequestSuccess'), 'success');
            return;
          } catch (retryError) {
            console.warn('Retry reject request failed:', retryError);
          }
        }
        showNotification(t('sessionExpired'), 'error');
        logout();
      }else if( error.response?.status === 404) {
        showNotification(t('requestNotFound'), 'error');
      } else {
        showNotification(t('rejectRequestError'), 'error');
      }
    }
  };

  const handleItemPress = (item: FollowItem) => {
    if (selectedTab === 'approved') {
      showNotification(t('confirmDeleteFollow'), 'warning', [
        {
          text: t('cancel'),
          onPress: () => {},
          color: 'danger',
        },
        {
          text: t('delete'),
          onPress: () => deleteFollow(item.id),
          color: 'primary',
        },
      ]);
    } else if (selectedTab === 'pending') {
      showNotification(t('confirmFollowRequest'), 'warning', [
        {
          text: t('reject'),
          onPress: () => rejectRequest(item.id),
          color: 'danger',
        },
        {
          text: t('accept'),
          onPress: () => acceptRequest(item.id),
          color: 'primary',
        },
      ]);
    }
  };

  const renderItem = ({ item }: { item: FollowItem }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleItemPress(item)}>
      <View style={styles.avatarContainer}>
        <View style={styles.boxImage}>
          <Image
            style={styles.avatar}
            source={
              item.followerUser?.url && item.followerUser.url.startsWith('https')
                ? { uri: item.followerUser.url }
                : require('../../../assets/avatar.jpg')
            }
            onError={(e) => console.warn(`Image load error for ${item.id}:`, e.nativeEvent.error)}
          />
        </View>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.itemText}>{item.followerUser?.name || t('noName')}</Text>
        <Text style={styles.itemSubText}>{item.followerUser?.email || t('noEmail')}</Text>
      </View>
    </TouchableOpacity>
  );

  const filteredFollowers = followers.filter(f => f.status === selectedTab);

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
          <Text style={styles.textHeader}>{t('myFollows')}</Text>
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
      </View>

      {filteredFollowers.length > 0 ? (
        <FlatList
          data={filteredFollowers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <Text style={styles.noData}>{t('noDataMyFollow')}</Text>
      )}
    </View>
  );
};

// Giữ nguyên styles như cũ
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
  noData: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontSize: 16,
  },
});

export default MyFollowsScreen;