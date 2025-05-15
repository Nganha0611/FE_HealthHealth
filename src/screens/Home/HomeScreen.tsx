import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../navigation/HomeStack';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { BottomTabParamList } from '../../navigation/BottomTabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

type Props = {
  navigation: StackNavigationProp<HomeStackParamList, 'Home'>;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const { t } = useTranslation(); 
  const [userName, setUserName] = useState<string>(''); 
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setUserName(user.name); 
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
      }
    };

    fetchUser();
  }, []);

  return (
    <ScrollView>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.text, { fontSize: 26, marginTop: 5 }]}>
            {t('greeting', { name: userName || 'bạn' })}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('HealthProfile')}>
        <Text style={[styles.text, styles.boxTitle]}>{t('healthProfile')}</Text>
        <Image style={styles.boxImg} source={require('../../assets/pf.png')} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('Medicine')}>
        <Text style={[styles.text, styles.boxTitle]}>{t('medicine')}</Text>
        <Image style={styles.boxImg} source={require('../../assets/medicine.png')} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('Schedule')}>
        <Text style={[styles.text, styles.boxTitle]}>{t('schedule')}</Text>
        <Image style={styles.boxImg} source={require('../../assets/lich.png')} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('MedicalHistory')}>
        <Text style={[styles.text, styles.boxTitle]}>{t('medicalHistory')}</Text>
        <Image style={styles.boxImg} source={require('../../assets/medical_history.png')} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('HealthMonitoring')}>
        <Text style={[styles.text, styles.boxTitle]}>{t('healthmonitor')}</Text>
        <Image style={styles.boxImg} source={require('../../assets/healthmonitor.png')} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.boxFeature, { marginBottom: 10 }]} onPress={() => navigation.navigate('EmergencyContact')}>
        <Text style={[styles.text, styles.boxTitle]}>{t('emergencyContact')}</Text>
        <Image style={styles.boxImg} source={require('../../assets/warning.png')} />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between'
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
  },
  headerRight: {
    marginRight: 15,
    backgroundColor: '#e0dee7',
    borderRadius: 30,
    padding: 7,
  },
  imgProfile: {
    width: 45,
    height: 45,
    borderRadius: 30
  },
  boxFeature: {
    flexDirection: 'row',
    width: 'auto',
    height: 140,
    backgroundColor: '#e0dee7',
    marginHorizontal: 10,
    borderRadius: 10,
    marginTop: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boxTitle: {
    marginHorizontal: 10,
  },
  boxImg: {
    width: 120,
    height: 120,
    marginRight: 20,
  }
});

export default HomeScreen;
