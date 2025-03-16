import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthStack from "./AuthStack";
import BottomTabs from "./BottomTabs";
import { useAuth } from "../contexts/AuthContext"; // Import context để kiểm tra trạng thái đăng nhập

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isLoggedIn } = useAuth(); // Lấy trạng thái đăng nhập từ context

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="BottomTabs" component={BottomTabs} />
        ) : (
          <Stack.Screen name="AuthStack" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
