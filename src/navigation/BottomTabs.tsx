import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import SettingsStack from './SettingStack';
import NotifyStack from './NotifyStack';
import HomeStack from './HomeStack';

export type BottomTabParamList = {
  HomeStack: undefined;
  NotifyStack: undefined;
  SettingStack: { screen?: string };
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabs = () => {
  return (
    <Tab.Navigator

      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: {
          height: 70,        // Chiều cao của thanh
          backgroundColor: '#fff',
          // borderTopWidth: 1, // Nếu muốn có đường viền
          // borderTopColor: '#ccc',
        },
        tabBarLabelStyle: {
          fontSize: 15,
          // fontWeight: 'bold',
        },
        tabBarIcon: ({ color, size }) => {
          
          let iconName: string = 'question-circle'; // Icon mặc định nếu không tìm thấy

          if (route.name === 'HomeStack') iconName = 'home';
          else if (route.name === 'NotifyStack') iconName = 'bell'; 
          else if (route.name === 'SettingStack') iconName = 'cog';  
          return <FontAwesome name={iconName} size={25} color={color} />;
        },
        tabBarActiveTintColor: '#432c81',
        tabBarInactiveTintColor: '#a095c1',
      })}
    >
      <Tab.Screen name="HomeStack" component={HomeStack} options={{ headerShown: false, tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="NotifyStack" component={NotifyStack} options={{ headerShown: false, tabBarLabel: 'Thông báo' }}/>
      <Tab.Screen name="SettingStack" component={SettingsStack} options={{ headerShown: false, tabBarLabel: 'Cài đặt' }}/>
    </Tab.Navigator>
  );
};

export default BottomTabs;
