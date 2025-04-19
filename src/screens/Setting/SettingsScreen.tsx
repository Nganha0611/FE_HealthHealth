import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { BottomTabParamList } from '../../navigation/BottomTabs';
import { SettingStackParamList } from '../../navigation/SettingStack';
import Notification from "../../components/Notification";
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../contexts/NotificationContext';

// Khai báo kiểu navigation
type Props = {
  navigation: StackNavigationProp<SettingStackParamList, 'Settings'>;
};

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { showNotification } = useNotification();
  


  const handleLogout = () => {
    Alert.alert(
      t('confirmation'),
      t('areYouSureLogout'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('logout'),
          onPress: () => {
            logout(); 
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('settings')}</Text>
      </View>
      <View style={styles.avatar}>
        <View style={styles.boxImage}> 
          <Image
            style={styles.imgProfile}
            source={require('../../assets/avatar.jpg')}
          />  
          <Image
            style={styles.editImage}
            source={require('../../assets/edit.png')}
          /> 
        </View>
        <Text style={styles.name}>Võ Nam Ngân Hà</Text>
        <Text style={styles.email}>vonamganha@gmail.com</Text>
      </View>

      <TouchableOpacity style={styles.listSetting} onPress={() => navigation.navigate('Account')}>
        <View style={styles.listSettingLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome
              name="user"          
              size={20}
              color="#432c81"
            />
          </View>
          <Text style={styles.listSettingText}>{t('account')}</Text>
        </View>
        <View style={styles.listSettingRight}>
          <FontAwesome 
            name="chevron-right"
            size={20}
            color="#432c81"
            style={{ marginRight: 15 }} 
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.listSetting} onPress={() => navigationMain.navigate('NotifyStack', { screen: 'NotifyScreen' } as any)}>
        <View style={styles.listSettingLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome
              name="bell"  // Thông báo
              size={20}
              color="#432c81"
            />
          </View>
          <Text style={styles.listSettingText}>{t('notifications')}</Text>
        </View>
        <View style={styles.listSettingRight}>
          <FontAwesome 
            name="chevron-right"
            size={20}
            color="#432c81"
            style={{ marginRight: 15 }} 
          />
        </View>
      </TouchableOpacity>    

      <TouchableOpacity style={styles.listSetting} onPress={() => navigation.navigate('Language')}>
        <View style={styles.listSettingLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome
              name="globe"  // Ngôn ngữ (hoặc "language")
              size={20}
              color="#432c81"
            />
          </View>
          <Text style={styles.listSettingText}>{t('language')}</Text>
        </View>
        <View style={styles.listSettingRight}>
          <FontAwesome 
            name="chevron-right"
            size={20}
            color="#432c81"
            style={{ marginRight: 15 }} 
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.listSetting} onPress={() => navigation.navigate('ChangePassword')}>
        <View style={styles.listSettingLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome
              name="lock"  // Đổi mật khẩu
              size={20}
              color="#432c81"
            />
          </View>
          <Text style={styles.listSettingText}>{t('changePassword')}</Text>
        </View>
        <View style={styles.listSettingRight}>
          <FontAwesome 
            name="chevron-right"
            size={20}
            color="#432c81"
            style={{ marginRight: 15 }} 
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.listSetting} onPress={handleLogout}>
        <View style={styles.listSettingLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome
              name="sign-out"   
              size={20}
              color="#432c81"
            />
          </View>
          <Text style={styles.listSettingText}>{t('logout')}</Text>
        </View>
        <View style={styles.listSettingRight}>
          <FontAwesome 
            name="chevron-right"
            size={20}
            color="#432c81"
            style={{ marginRight: 15 }} 
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingVertical: 16,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
    marginLeft: 16,
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#432c81',
  },
  listSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    marginLeft: 16,
  },
  listSettingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  listSettingText: {
    fontSize: 20,
    color: '#432c81',
  },
  listSettingRight: {},
  
  imgProfile: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  boxImage: {
    position: 'relative',
    padding: 10,
    marginRight: 15,
    backgroundColor: '#e0dee7',
    borderRadius: 75,
    width: 140,
    height: 140,
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImage: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: '#432c81',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    color: '#6241c0',
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 15,
  },
  email: {
    color: '#9f8dd3',
    marginTop: 10,
    marginBottom: 20,
  }
})

export default SettingsScreen;
