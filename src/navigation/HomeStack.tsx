import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/Home/HomeScreen';
import HealthProfileScreen from '../screens/Home/HealthProfileScreens/HealthProfileScreen';
import MedicineScreen from '../screens/Home/MedicineScreens/MedicineScreen';
import ScheduleScreen from '../screens/Home/ScheduleScreen';
import EatingDiaryScreen from '../screens/Home/EatingDiaryScreen';
import NutritionScreen from '../screens/Home/NutritionScreen';
import MedicalHistoryScreen from '../screens/Home/MedicalScreens/MedicalHistoryScreen';
import EmergencyContactScreen from '../screens/Home/EmergencyContact';
import HeartRateScreen from '../screens/Home/HealthProfileScreens/HeartRateScreen';
import BloodPressureScreen from '../screens/Home/HealthProfileScreens/BloodPressureScreen';
import StepScreen from '../screens/Home/HealthProfileScreens/StepScreen';
import PrescriptionScreen from '../screens/Home/MedicineScreens/PresciptionScreen';
import MedicineHistoryScreen from '../screens/Home/MedicineScreens/MedicineHistoryScreen';
import MedicineManagerScreen from '../screens/Home/MedicineScreens/MedicineManagerScreen';
import MedicineHistoryDetailScreen from '../screens/Home/MedicineScreens/MedicineHistoryDetailScreen';
import MonitoringScreen from '../screens/Home/Monitor/MonitoringScreen';
import MyFollowsScreen from '../screens/Home/Monitor/MyFollowsScreen';
import IFollowsScreen from '../screens/Home/Monitor/IFollowsScreen';
import MonitorHealthProfile from '../screens/Home/Monitor/MonitorHealthProfile';
import MonitorMedicine from '../screens/Home/Monitor/MonitorMedicine';
import MonitorMedicalHistory from '../screens/Home/Monitor/MonitorMedicalHistory';
import MonitorSchedule from '../screens/Home/Monitor/MonItorSchedule';

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
  Prescription: undefined;
  MedicineHistory: undefined;
  MedicineManager: undefined;
  MedicineHistoryDetail: undefined;
  HealthMonitoring: undefined;
  MyFollows: undefined;
  IFollows: undefined;
  MonitorHealthProfile: undefined;
  MonitorMedicine: undefined;
  MonitorMedical: undefined;
  MonitorSchedule: undefined;
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
      <Stack.Screen name="Prescription" component={PrescriptionScreen} /> 
      <Stack.Screen name="MedicineHistory" component={MedicineHistoryScreen} /> 
      <Stack.Screen name="MedicineManager" component={MedicineManagerScreen} /> 
      <Stack.Screen name="MedicineHistoryDetail" component={MedicineHistoryDetailScreen} />
      <Stack.Screen name="HealthMonitoring" component={MonitoringScreen} />
      <Stack.Screen name="MyFollows" component={MyFollowsScreen} />
      <Stack.Screen name="IFollows" component={IFollowsScreen} />
      <Stack.Screen name="MonitorHealthProfile" component={MonitorHealthProfile} />
      <Stack.Screen name="MonitorMedicine" component={MonitorMedicine} />
      <Stack.Screen name="MonitorMedical" component={MonitorMedicalHistory} />
      <Stack.Screen name="MonitorSchedule" component={MonitorSchedule} />
   
    </Stack.Navigator>
  );
};

export default HomeStack;
