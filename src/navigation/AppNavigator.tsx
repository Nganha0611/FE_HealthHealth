import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthStack from "./AuthStack";
import BottomTabs from "./BottomTabs";
import { useAuth } from "../contexts/AuthContext"; 
import { NotifeeProvider } from "../contexts/NotifeeContext";
import NotificationHandler from "../components/NotificationHandler";

export type RootStackParamList = {
  AuthStack: undefined;
  BottomTabs: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { isLoggedIn } = useAuth();

  return (
    <NavigationContainer>
      <NotifeeProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="BottomTabs" component={BottomTabs} />
        ) : (
          <Stack.Screen name="AuthStack" component={AuthStack} />
        )}
      </Stack.Navigator>
      <NotificationHandler />
      </NotifeeProvider>
    </NavigationContainer>
  );
};

export default AppNavigator;