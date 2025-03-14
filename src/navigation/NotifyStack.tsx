import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import NotifyScreen from '../screens/Notify/NotifyScreen';
import DetailNotifyScreen from '../screens/Notify/DetailNotifyScreen';

// Định nghĩa kiểu cho Stack
export type NotifyStackParamList = {
  Notify: undefined; 
  DetailNotify: undefined;
};

// Sử dụng kiểu HomeStackParamList
const Stack = createStackNavigator<NotifyStackParamList>();

const NotifyStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Notify" component={NotifyScreen} />
      <Stack.Screen name="DetailNotify" component={DetailNotifyScreen} />
    </Stack.Navigator>
  );
};

export default NotifyStack;
