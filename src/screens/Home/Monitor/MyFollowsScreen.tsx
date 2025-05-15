import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { NavigationProp } from '@react-navigation/native';
import { API_BASE_URL } from '../../../utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotification } from '../../../contexts/NotificationContext';
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

  useEffect(() => {
    fetchFollowers();
  }, []);

  const fetchFollowers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        navigation.navigate('Login');
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
          } catch (error) {
            console.error(`Error fetching follower user ${item.followerUserId}:`, error);
            showNotification(t('fetchUserError', { id: item.followerUserId }), 'error');
          }

          return {
            ...item,
            followerUser,
          };
        })
      );
      setFollowers(enrichedFollowers);
    } catch (error) {
      console.error('Error fetching followers:', error);
      showNotification(t('fetchFollowersError'), 'error');
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
      fetchFollowers();
      showNotification(t('deleteFollowSuccess'), 'success');
    } catch (error) {
      console.error('Error deleting follow:', error);
      showNotification(t('deleteFollowError'), 'error');
    }
  };

  const acceptRequest = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        navigation.navigate('Login');
        return;
      }
      const response = await axios.put(
        `${API_BASE_URL}/api/tracking/update-status/${id}`,
        { status: "approved" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200 && response.data.result === 'success') {
        fetchFollowers();
        showNotification(t('acceptRequestSuccess'), 'success');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      showNotification(t('acceptRequestError'), 'error');
    }
  };

  const rejectRequest = async (id: string) => {
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
      fetchFollowers();
      showNotification(t('rejectRequestSuccess'), 'success');
    } catch (error) {
      console.error('Error rejecting request:', error);
      showNotification(t('rejectRequestError'), 'error');
    }
  };

  const handleItemPress = (item: FollowItem) => {
    if (selectedTab === 'approved') {
      showNotification(
        t('confirmDeleteFollow'),
        'warning',
        [
          {
            text: t('cancel'),
            onPress: () => {},
            color: 'danger'
          },
          {
            text: t('delete'),
            onPress: () => deleteFollow(item.id),
            color: 'primary'
          }
        ]
      );
    } else if (selectedTab === 'pending') {
      showNotification(
        t('confirmFollowRequest'),
        'warning',
        [
          {
            text: t('cancel'),
            onPress: () => {},
            color: 'danger'
          },
          {
            text: t('accept'),
            onPress: () => acceptRequest(item.id),
            color: 'primary'
          },
          {
            text: t('reject'),
            onPress: () => rejectRequest(item.id),
            color: 'danger'
          }
        ]
      );
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
            onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
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