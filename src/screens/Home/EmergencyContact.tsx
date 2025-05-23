import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { BottomTabParamList } from '../../navigation/BottomTabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/config';
import Modal from '../../components/CustomModal';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../contexts/NotificationContext';
// import { call } from 'react-native-phone-call';

type Props = {
  navigation: NavigationProp<any>;
};

type EmergencyContact = {
  id?: string;
  name: string;
  phoneNumber: string;
};

const EmergencyContactScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const { showNotification } = useNotification();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Lấy danh sách người liên hệ khẩn cấp
  const fetchContacts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        navigation.navigate('Login');
        return;
      }

      const response = await axios.get<EmergencyContact[]>(`${API_BASE_URL}/api/emergency-contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts(response.data);
    } catch (error: any) {
      showNotification(t('fetchContactsError'), 'error');
      if (error.response && error.response.status === 401) {
        showNotification(t('sessionExpired'), 'error');
        await AsyncStorage.removeItem('token');
        navigation.navigate('Login');
      }
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Thêm người liên hệ khẩn cấp
  const handleAddContact = async () => {
    if (!name || !phoneNumber) {
      showNotification(t('incompleteContactInfo'), 'error');
      return;
    }

    // Kiểm tra định dạng số điện thoại (ví dụ: 10 chữ số, bắt đầu bằng 0)
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      showNotification(t('invalidPhoneNumber'), 'error');
      return;
    }

    const newContact: EmergencyContact = { name, phoneNumber };

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showNotification(t('noToken'), 'error');
        navigation.navigate('Login');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/emergency-contacts`,
        newContact,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContacts([...contacts, response.data]);
      setModalVisible(false);
      setName('');
      setPhoneNumber('');
      showNotification(t('contactAdded'), 'success');
    } catch (error: any) {
      showNotification(t('addContactError'), 'error');
    }
  };

  // Gọi điện thoại
  const handleCall = (phoneNumber: string) => {
    const args = {
      number: phoneNumber,
      prompt: true,
    };

    if (Platform.OS === 'ios') {
      interface AlertButton {
        text: string;
        style?: 'cancel';
        onPress?: () => void;
      }

      Alert.alert(
        t('confirmCall'),
        `${t('callTo')} ${phoneNumber}?`,
        [
          { text: t('cancel'), style: 'cancel' } as AlertButton,
          {
        text: t('call'),
        // onPress: () => call(args).catch((err: Error) => console.error('Call failed:', err)),
          } as AlertButton,
        ]
      );
    } else {
      // call(args).catch((err: Error) => console.error('Call failed:', err));
    }
  };

  return (
    <View style={{ flex: 1 }}>
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
            <Text style={[styles.text, { fontSize: 30, marginTop: 5 }]}>{t('emergencyContact')}</Text>
          </View>
        </View>

        {contacts.length === 0 ? (
          <Text style={styles.noContactsText}>{t('noContacts')}</Text>
        ) : (
          contacts.map((contact, index) => (
            <View key={index} style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(contact.phoneNumber)}
              >
                <FontAwesome name="phone" size={20} color="#fff" />
                <Text style={styles.callButtonText}>{t('call')}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={isModalVisible} onClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
          <FontAwesome name="close" size={24} color="#444" />
        </TouchableOpacity>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <Text style={styles.modalTitle}>{t('addEmergencyContact')}</Text>

          <Text style={styles.inputLabel}>{t('name')}</Text>
          <TextInput
            placeholder={t('enterName')}
            placeholderTextColor="#888"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.inputLabel}>{t('phoneNumber')}</Text>
          <TextInput
            placeholder={t('enterPhoneNumber')}
            placeholderTextColor="#888"
            style={styles.input}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleAddContact}>
            <Text style={styles.saveButtonText}>{t('save')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  text: {
    fontSize: 25,
    fontFamily: 'Roboto',
    color: '#432c81',
    fontWeight: 'bold',
  },
  headerLeft: {
    marginLeft: 10,
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  noContactsText: {
    fontSize: 16,
    color: '#432c81',
    textAlign: 'center',
    marginTop: 20,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#e0dee7',
    marginHorizontal: 10,
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#432c81',
  },
  contactPhone: {
    fontSize: 16,
    color: '#432c81',
  },
  callButton: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  callButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#432c81',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
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
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#432c81',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EmergencyContactScreen;