import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/Home/HomeScreen';
import HealthProfileScreen from '../screens/Home/HealthProfileScreens/HealthProfileScreen';
import MedicineScreen from '../screens/Home/MedicineScreen';
import ScheduleScreen from '../screens/Home/ScheduleScreen';
import EatingDiaryScreen from '../screens/Home/EatingDiaryScreen';
import NutritionScreen from '../screens/Home/NutritionScreen';
import MedicalHistoryScreen from '../screens/Home/MedicalHistoryScreen';
import EmergencyContactScreen from '../screens/Home/EmergencyContact';
import HeartRateScreen from '../screens/Home/HealthProfileScreens/HeartRateScreen';
import BloodPressureScreen from '../screens/Home/HealthProfileScreens/BloodPressureScreen';
import StepScreen from '../screens/Home/HealthProfileScreens/StepScreen';

export type HomeStackParamList = {
  Home: undefined;
  HealthProfile: undefined;
  Medicine: undefined;
  Schedule: undefined;
  EatingDiary: undefined;
  Nutrition: undefined;
  MedicalHistory: undefined;
  EmergencyContact : undefined;
  HeartRate : undefined;
  BloodPressure : undefined;
  Step : undefined;
};

const Stack = createStackNavigator<HomeStackParamList>();

const HomeStack = () => {
  return (
    <Stack.Navigator
    screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="HealthProfile" component={HealthProfileScreen} /> 
      <Stack.Screen name="Medicine" component={MedicineScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="EatingDiary" component={EatingDiaryScreen} />
      <Stack.Screen name="Nutrition" component={NutritionScreen} />
      <Stack.Screen name="MedicalHistory" component={MedicalHistoryScreen} />
      <Stack.Screen name="EmergencyContact" component={EmergencyContactScreen} /> 
      <Stack.Screen name="HeartRate" component={HeartRateScreen} />
      <Stack.Screen name="BloodPressure" component={BloodPressureScreen} />
      <Stack.Screen name="Step" component={StepScreen} />
    </Stack.Navigator>
  );
};

export default HomeStack;
