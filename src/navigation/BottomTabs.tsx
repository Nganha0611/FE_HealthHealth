import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import SettingsStack from './SettingStack';
import NotifyStack from './NotifyStack';
import HomeStack from './HomeStack';
import { useTranslation } from 'react-i18next'; // Import hook

export type BottomTabParamList = {
  HomeStack: undefined;
  NotifyStack: undefined;
  SettingStack: { screen?: string };
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabs = () => {
  const { t } = useTranslation(); // Dùng để lấy nội dung dịch

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 70,
          backgroundColor: '#fff',
        },
        tabBarLabelStyle: {
          fontSize: 15,
        },
        tabBarIcon: ({ color }) => {
          let iconName: string = 'question-circle';
          if (route.name === 'HomeStack') iconName = 'home';
          else if (route.name === 'NotifyStack') iconName = 'bell';
          else if (route.name === 'SettingStack') iconName = 'cog';
          return <FontAwesome name={iconName} size={25} color={color} />;
        },
        tabBarActiveTintColor: '#432c81',
        tabBarInactiveTintColor: '#a095c1',
      })}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStack}
        options={{ headerShown: false, tabBarLabel: t('tab.home') }}
      />
      <Tab.Screen
        name="NotifyStack"
        component={NotifyStack}
        options={{ headerShown: false, tabBarLabel: t('tab.notify') }}
      />
      <Tab.Screen
        name="SettingStack"
        component={SettingsStack}
        options={{ headerShown: false, tabBarLabel: t('tab.setting') }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;
