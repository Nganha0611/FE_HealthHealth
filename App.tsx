import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./src/locales/i18n";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { NotificationProvider } from "./src/contexts/NotificationContext";
import AppNavigator from "./src/navigation/AppNavigator";
import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "./src/utils/config";

const AppContent = () => {
  const { setIsLoggedIn } = useAuth();
  useEffect(() => {
    const requestNotificationPermission = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) {
          console.log("Notification permission granted");
        } else {
          console.log("Notification permission denied");
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    };
    const checkTokenValidity = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.log("No token found, logging out...");
          await logout();
          return;
        }
        const response = await axios.get(`${API_BASE_URL}/api/auth/check-token`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data.result === "success") {
          console.log("Token is valid");
        } else {
          console.log("Token is invalid or expired, logging out...");
          await logout();
        }
      } catch (error) {
        console.error("Error checking token validity:", error);
        await logout();
      }
    };
    const logout = async () => {
      try {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        setIsLoggedIn(false);
        console.log("User logged out due to invalid token");
      } catch (error) {
        console.error("Error during logout:", error);
      }
    };
    const handleTokenRefresh = () => {
      const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
        console.log("FCM Token refreshed:", newToken);
        const token = await AsyncStorage.getItem("token");
        if (token) {
          try {
            await axios.post(
              `${API_BASE_URL}/api/auth/save-fcm-token`,
              { fcmToken: newToken },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Updated refreshed FCM token on server");
          } catch (error) {
            console.error("Failed to update FCM token:", error);
          }
        }
      });
      return unsubscribe;
    };

    // Thực thi các hàm
    requestNotificationPermission();
    checkTokenValidity();
    handleTokenRefresh();
  }, [setIsLoggedIn]);

  return <AppNavigator />;
};

const App = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </I18nextProvider>
  );
};

export default App;