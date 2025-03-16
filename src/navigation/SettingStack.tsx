import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SettingsScreen from '../screens/Setting/SettingsScreen';

const Stack = createStackNavigator<SettingStackParamList>();
export type SettingStackParamList = {
  Settings: undefined;
};
const SettingsStack = () => {
  return (
    <Stack.Navigator
    screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

export default SettingsStack;
