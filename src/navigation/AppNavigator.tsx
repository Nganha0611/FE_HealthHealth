import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthStack from "./AuthStack";
import BottomTabs from "./BottomTabs";
import { useAuth } from "../contexts/AuthContext"; 
import LoginScreen from "../screens/Auth/LoginScreen";
import SignUpScreen from "../screens/Auth/SignUpScreen";
import VerifyOTPScreen from "../screens/Auth/VerifyOTPScreen";
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyOTP: {
    email: string;
    name: string;
    password: string;
    birth: string;
    gender: string;
    numberPhone: string;
    address: string;
    otpAction: string;
  };
  BottomTabs: undefined;
};
const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { isLoggedIn } = useAuth(); 

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
  {isLoggedIn ? (
    <Stack.Screen name="BottomTabs" component={BottomTabs} />
  ) : (
    <>
        <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={SignUpScreen} />
      {/* <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} /> */}
    </>
  )}
    <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />

</Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
