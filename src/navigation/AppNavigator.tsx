import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthStack from "./AuthStack";
import BottomTabs from "./BottomTabs";
import { useAuth } from "../contexts/AuthContext";
import { NotifeeProvider } from "../contexts/NotifeeContext";
import NotificationHandler from "../components/NotificationHandler";
import { useNotification } from "../contexts/NotificationContext";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../utils/config";
import { AppState, AppStateStatus } from "react-native";

export type RootStackParamList = {
  AuthStack: undefined;
  BottomTabs: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const TokenChecker: React.FC = () => {
  const { logout } = useAuth();
  const { showNotification } = useNotification();
  const { t } = useTranslation();

  const refreshToken = async (): Promise<string | null> => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (!refreshToken) return null;
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/refresh`,
        { refreshToken },
        { timeout: 20000 }
      );
      const newToken = response.data.accessToken;
      await AsyncStorage.setItem("token", newToken);
      return newToken;
    } catch (error) {
      return null;
    }
  };

  const handleLogout = () => {
    // showNotification(t("noToken"), "warning")
     logout();
  };

  const checkTokenValidity = async () => {
    try {
      let token = await AsyncStorage.getItem("token");
      if (!token) {
        // showNotification(t("noTokenFound"), "error");
        handleLogout();
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/auth/check-token`, {
        headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" },
        timeout: 20000,
      });
      if (response.data.result !== "success") {
        token = await refreshToken();
        if (token) {
          const retryResponse = await axios.get(
            `${API_BASE_URL}/api/auth/check-token`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Cache-Control": "no-cache",
              },
              timeout: 20000,
            }
          );
          if (retryResponse.data.result === "success") {
            return;
          }
        }
        showNotification(t("sessionExpired"), "error");
        handleLogout();
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          const retryResponse = await axios.get(
            `${API_BASE_URL}/api/auth/check-token`,
            {
              headers: {
                Authorization: `Bearer ${newToken}`,
                "Cache-Control": "no-cache",
              },
              timeout: 20000,
            }
          );
          if (retryResponse.data.result === "success") {
            return;
          }
        }
        showNotification(t("sessionExpired"), "error");
        handleLogout();
      } else if (error.request) {
        showNotification(t("networkError"), "error");
        handleLogout();
      } else {
        showNotification(t("errorCheckingToken"), "error");
        handleLogout();
      }
    }
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        checkTokenValidity();
      }
    };

    checkTokenValidity();
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => subscription.remove();
  }, []);

  return null; // Component không render gì
};

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
        <TokenChecker />
        <NotificationHandler />
      </NotifeeProvider>
    </NavigationContainer>
  );
};

export default AppNavigator;