import React, { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./src/locales/i18n";
import { AuthProvider } from "./src/contexts/AuthContext";
import { NotificationProvider, useNotification } from "./src/contexts/NotificationContext";
import AppNavigator from "./src/navigation/AppNavigator";
import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "./src/utils/config";
import {
  initialize,
  getSdkStatus,
  requestPermission,
  readRecords,
  SdkAvailabilityStatus,
} from "react-native-health-connect";
import { useTranslation } from "react-i18next";
interface HeartRateData {
  rate: number;
  createdAt: string;
}

interface BloodPressureData {
  systolic: number;
  diastolic: number;
  createdAt: string;
}

interface StepsData {
  steps: number;
  createdAt: string;
}

const AppContent = () => {
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [allHeartRateData, setAllHeartRateData] = useState<HeartRateData[]>([]);
  const [allBloodPressureData, setAllBloodPressureData] = useState<BloodPressureData[]>([]);
  const [allStepsData, setAllStepsData] = useState<StepsData[]>([]);

  const normalizeTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toISOString().split(".")[0] + "Z";
  };

  const fetchUserId = async (): Promise<string | null> => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        if (user?.id) {
          setUserId(user.id);
          return user.id;
        }
      }
      // showNotification(t("noUserData"), "error");
      return null;
    } catch (error) {
      showNotification(t("errorFetchingUser"), "error");
      return null;
    }
  };

  const tryEndpoints = async (
    endpoints: string[],
    method: "get" | "post",
    data?: any,
    headers?: any
  ) => {
    for (const endpoint of endpoints) {
      try {
        const response =
          method === "get"
            ? await axios.get(endpoint, { headers, timeout: 20000 })
            : await axios.post(endpoint, data, { headers, timeout: 20000 });
        return response;
      } catch (error: any) {
        if (error.response?.status !== 404) {
          // Silent error handling
        }
      }
    }
    return { status: 0, data: null };
  };

  const fetchHeartRateData = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" } }
        : {};
      const endpoints = [`${API_BASE_URL}/api/heart-rates/user/${userId}`];
      const response = await tryEndpoints(endpoints, "get", null, config.headers);
      const data = response.data;
      if (!data || data.length === 0) {
        setAllHeartRateData([]);
        return;
      }
      const normalizedData: HeartRateData[] = data.map((item: any) => ({
        rate: item.rate ?? item.heartRate ?? item.value,
        createdAt: item.createdAt ?? item.date ?? item.timestamp,
      }));
      const validData = normalizedData.filter(
        (item) => typeof item.rate === "number" && !isNaN(item.rate) && item.createdAt
      );
      const sorted = validData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllHeartRateData(sorted);
    } catch (error) {
      showNotification(t("errorFetchingHeartRate"), "error");
      setAllHeartRateData([]);
    }
  };

  const fetchBloodPressureData = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" } }
        : {};
      const endpoints = [`${API_BASE_URL}/api/blood-pressures/user/${userId}`];
      const response = await tryEndpoints(endpoints, "get", null, config.headers);
      const data = response.data;
      if (!data || data.length === 0) {
        setAllBloodPressureData([]);
        return;
      }
      const normalizedData: BloodPressureData[] = data.map((item: any) => ({
        systolic: item.systolic ?? item.systolicPressure ?? item.sys ?? 0,
        diastolic: item.diastolic ?? item.diastolicPressure ?? item.dia ?? 0,
        createdAt: item.createdAt ?? item.date ?? item.timestamp ?? "",
      }));
      const validData = normalizedData.filter(
        (item) =>
          typeof item.systolic === "number" &&
          typeof item.diastolic === "number" &&
          item.createdAt
      );
      const sorted = validData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllBloodPressureData(sorted);
    } catch (error) {
      showNotification(t("errorFetchingBloodPressure"), "error");
      setAllBloodPressureData([]);
    }
  };

  const fetchStepsData = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" } }
        : {};
      const response = await axios.get(`${API_BASE_URL}/api/steps/user/${userId}`, {
        ...config,
        timeout: 20000,
      });
      const data = response.data;
      if (!data || data.length === 0) {
        setAllStepsData([]);
        return;
      }
      const normalizedData: StepsData[] = data.map((item: any) => ({
        steps: item.steps ?? item.count ?? 0,
        createdAt: item.createdAt ?? item.date ?? item.timestamp ?? "",
      }));
      const validData = normalizedData.filter(
        (item) => typeof item.steps === "number" && !isNaN(item.steps) && item.createdAt
      );
      const sorted = validData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllStepsData(sorted);
    } catch (error) {
      showNotification(t("errorFetchingSteps"), "error");
      setAllStepsData([]);
    }
  };

  const initializeHealthConnect = async (): Promise<boolean> => {
    try {
      await initialize();
      const status = await getSdkStatus();
      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
        return true;
      }
      showNotification(
        status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
          ? t("healthConnectUpdateRequired")
          : t("healthConnectNotAvailable"),
        "error"
      );
      return false;
    } catch (err) {
      showNotification(t("errorInitializingHealthConnect"), "error");
      return false;
    }
  };

  const requestHealthPermissions = async (
    recordType: "HeartRate" | "BloodPressure" | "Steps"
  ): Promise<boolean> => {
    try {
      const permissions = await requestPermission([
        { accessType: "read", recordType },
      ]);
      if (permissions.length === 0) {
        return false;
      }
      return true;
    } catch (err) {
      showNotification(t("errorRequestingHealthPermissions"), "error");
      return false;
    }
  };

  const readHeartRateData = async (): Promise<HeartRateData[]> => {
    try {
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - 1);
      const response = await readRecords("HeartRate", {
        timeRangeFilter: {
          operator: "between",
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });
      if (!response.records || response.records.length === 0) {
        return [];
      }
      const heartRateData: HeartRateData[] = response.records
        .filter(
          (record) =>
            record.samples && record.samples.length > 0 && record.startTime
        )
        .map((record) => ({
          rate: record.samples[0]?.beatsPerMinute ?? 0,
          createdAt: new Date(record.startTime).toISOString(),
        }))
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      return heartRateData;
    } catch (err) {
      showNotification(t("errorFetchingHeartRateHealthConnect"), "error");
      return [];
    }
  };

  const readBloodPressureData = async (): Promise<BloodPressureData[]> => {
    try {
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - 1);
      const response = await readRecords("BloodPressure", {
        timeRangeFilter: {
          operator: "between",
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });
      if (!response.records || response.records.length === 0) {
        return [];
      }
      const bloodPressureData: BloodPressureData[] = response.records
        .filter((record) => record.systolic && record.diastolic && record.time)
        .map((record) => ({
          systolic: record.systolic?.inMillimetersOfMercury ?? 0,
          diastolic: record.diastolic?.inMillimetersOfMercury ?? 0,
          createdAt: new Date(record.time).toISOString(),
        }))
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      return bloodPressureData;
    } catch (err) {
      showNotification(t("errorFetchingBloodPressureHealthConnect"), "error");
      return [];
    }
  };

  const readStepsData = async (): Promise<StepsData[]> => {
    try {
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - 30);
      const response = await readRecords("Steps", {
        timeRangeFilter: {
          operator: "between",
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });
      if (!response.records || response.records.length === 0) {
        return [];
      }
      const dailySteps: { [date: string]: { steps: number; record: any } } = {};
      response.records.forEach((record) => {
        const recordDate = new Date(record.startTime).toDateString();
        const steps = record.count || 0;
        if (!dailySteps[recordDate] || steps > dailySteps[recordDate].steps) {
          dailySteps[recordDate] = { steps, record };
        }
      });
      const stepsData: StepsData[] = Object.entries(dailySteps).map(
        ([date, { steps }]) => ({
          steps,
          createdAt: new Date(date).toISOString(),
        })
      );
      return stepsData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err) {
      showNotification(t("errorFetchingStepsHealthConnect"), "error");
      return [];
    }
  };

  const syncHeartRateFromHealthConnect = async () => {
    try {
      const isInitialized = await initializeHealthConnect();
      if (!isInitialized) return;

      const granted = await requestHealthPermissions("HeartRate");
      if (!granted) return;

      const healthConnectData = await readHeartRateData();
      if (healthConnectData.length === 0) return;

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        // showNotification(t("noAuthToken"), "error");
        return;
      }

      const normalizedHealthConnectData = healthConnectData.map((item) => ({
        ...item,
        createdAt: normalizeTimestamp(item.createdAt),
      }));

      const newData = normalizedHealthConnectData.filter((hcItem) => {
        return !allHeartRateData.some(
          (dbItem) =>
            dbItem.createdAt === hcItem.createdAt && dbItem.rate === hcItem.rate
        );
      });

      if (newData.length === 0) return;

      const endpoints = [`${API_BASE_URL}/api/heart-rates/measure`];
      for (const hcItem of newData) {
        await tryEndpoints(
          endpoints,
          "post",
          {
            heartRate: hcItem.rate,
            createdAt: hcItem.createdAt,
            userId,
          },
          {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          }
        );
      }

      if (userId) await fetchHeartRateData(userId);
    } catch (error) {
      showNotification(t("errorSyncingHeartRate"), "error");
    }
  };

  const syncBloodPressureFromHealthConnect = async () => {
    try {
      const isInitialized = await initializeHealthConnect();
      if (!isInitialized) return;

      const granted = await requestHealthPermissions("BloodPressure");
      if (!granted) return;

      const healthConnectData = await readBloodPressureData();
      if (healthConnectData.length === 0) return;

      const normalizedHealthConnectData = healthConnectData.map((item) => ({
        ...item,
        createdAt: normalizeTimestamp(item.createdAt),
      }));

      const newData = normalizedHealthConnectData.filter((hcItem) => {
        return !allBloodPressureData.some(
          (dbItem) =>
            dbItem.createdAt === hcItem.createdAt &&
            dbItem.systolic === hcItem.systolic &&
            dbItem.diastolic === hcItem.diastolic
        );
      });

      if (newData.length === 0) return;

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showNotification(t("noAuthToken"), "error");
        return;
      }

      const endpoints = [`${API_BASE_URL}/api/blood-pressures/measure`];
      for (const hcItem of newData) {
        await tryEndpoints(
          endpoints,
          "post",
          {
            systolic: hcItem.systolic,
            diastolic: hcItem.diastolic,
            createdAt: hcItem.createdAt,
            userId,
          },
          {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          }
        );
      }

      if (userId) await fetchBloodPressureData(userId);
    } catch (error) {
      showNotification(t("errorSyncingBloodPressure"), "error");
    }
  };

  const syncStepsFromHealthConnect = async () => {
    try {
      const isInitialized = await initializeHealthConnect();
      if (!isInitialized) return;

      const granted = await requestHealthPermissions("Steps");
      if (!granted) return;

      const healthConnectData = await readStepsData();
      if (healthConnectData.length === 0) return;

      const getDateKey = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      };

      const healthConnectDataByDate: { [date: string]: StepsData } = {};
      healthConnectData.forEach((item) => {
        const dateKey = getDateKey(item.createdAt);
        if (healthConnectDataByDate[dateKey]) {
          healthConnectDataByDate[dateKey].steps = Math.max(
            healthConnectDataByDate[dateKey].steps,
            item.steps
          );
        } else {
          healthConnectDataByDate[dateKey] = { ...item };
        }
      });

      let token = await AsyncStorage.getItem("token");
      if (!token) {
        showNotification(t("noAuthToken"), "error");
        return;
      }

      for (const [dateKey, hcItem] of Object.entries(healthConnectDataByDate)) {
        try {
          await axios.delete(
            `${API_BASE_URL}/api/steps/measure/delete-by-date?date=${encodeURIComponent(
              hcItem.createdAt
            )}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Cache-Control": "no-cache",
              },
            }
          );

          await axios.post(
            `${API_BASE_URL}/api/steps/measure`,
            {
              steps: hcItem.steps,
              createdAt: normalizeTimestamp(hcItem.createdAt),
              userId,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Cache-Control": "no-cache",
              },
              timeout: 20000,
            }
          );
        } catch (error: any) {
          if (error.response?.status === 403) {
            token = await refreshToken();
            if (!token) {
              showNotification(t("accessDenied"), "error");
              return;
            }
            await axios.delete(
              `${API_BASE_URL}/api/steps/measure/delete-by-date?date=${encodeURIComponent(
                hcItem.createdAt
              )}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Cache-Control": "no-cache",
                },
              }
            );
            await axios.post(
              `${API_BASE_URL}/api/steps/measure`,
              {
                steps: hcItem.steps,
                createdAt: normalizeTimestamp(hcItem.createdAt),
                userId,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Cache-Control": "no-cache",
                },
                timeout: 20000,
              }
            );
          } else {
            continue;
          }
        }
      }

      if (userId) await fetchStepsData(userId);
    } catch (error) {
      showNotification(t("errorSyncingSteps"), "error");
    }
  };

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

  const syncAllData = async () => {
    const userId = await fetchUserId();
    if (!userId) return;

    await Promise.all([
      syncHeartRateFromHealthConnect(),
      syncBloodPressureFromHealthConnect(),
      syncStepsFromHealthConnect(),
    ]);

    await Promise.all([
      fetchHeartRateData(userId),
      fetchBloodPressureData(userId),
      fetchStepsData(userId),
    ]);

    await AsyncStorage.setItem("lastSyncTime", new Date().getTime().toString());
  };

  useEffect(() => {
    const requestNotificationPermission = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!enabled) {
          showNotification(t("notificationPermissionDenied"), "error");
        }
      } catch (error) {
        showNotification(t("errorRequestingNotification"), "error");
      }
    };

    const handleTokenRefresh = () => {
      const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          try {
            await axios.post(
              `${API_BASE_URL}/api/auth/save-fcm-token`,
              { fcmToken: newToken },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Cache-Control": "no-cache",
                },
              }
            );
          } catch (error) {
            showNotification(t("failedUpdateFCM"), "error");
          }
        }
      });
      return unsubscribe;
    };

    requestNotificationPermission();
    handleTokenRefresh();

    const syncInterval = 5 * 60 * 1000;
    const intervalId = setInterval(() => {
      syncAllData();
    }, syncInterval);

    return () => clearInterval(intervalId);
  }, []);

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