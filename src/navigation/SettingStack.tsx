import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SettingsScreen from '../screens/Setting/SettingsScreen';
import AccountScreen from '../screens/Setting/AccountScreen';
import ChangePasswordScreen from '../screens/Setting/ChangePasswordScreen';
import LanguageScreen from '../screens/Setting/LanguageScreen';

const Stack = createStackNavigator<SettingStackParamList>();
export type SettingStackParamList = {
  Settings: undefined;
  Account: undefined;
  ChangePassword: undefined;
  Language: undefined;
};
const SettingsStack = () => {
  return (
    <Stack.Navigator
    screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />

    </Stack.Navigator>
  );
};

export default SettingsStack;
