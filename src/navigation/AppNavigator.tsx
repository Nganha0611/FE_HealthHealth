import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthStack from "./AuthStack";
import BottomTabs from "./BottomTabs";
import { useAuth } from "../contexts/AuthContext"; 

const AppNavigator = () => {
  const { isLoggedIn } = useAuth(); // Kiểm tra trạng thái đăng nhập

  return (
    <NavigationContainer>
      {isLoggedIn ? <BottomTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
