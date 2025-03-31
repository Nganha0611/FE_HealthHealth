import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import WelcomeScreen from "../screens/Auth/WelcomeScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import SignUpScreen from "../screens/Auth/SignUpScreen";
import ForgotPasswordScreen from "../screens/Auth/ForgotPasswordScreen";
import BottomTabs from "./BottomTabs";
import SettingsScreen from "../screens/Setting/SettingsScreen";
import VerifyOTPScreen from "../screens/Auth/VerifyOTPScreen";

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  BottomTabs: undefined;
  Settings: undefined;
  VerifyOTP: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="BottomTabs" component={BottomTabs} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />

    </Stack.Navigator>
  );
};

export default AuthStack;
