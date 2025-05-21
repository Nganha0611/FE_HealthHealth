import React, { createContext, useContext, useEffect } from 'react';
import notifee, { EventType, AndroidImportance } from '@notifee/react-native';
import { useNavigation } from '@react-navigation/native';

// Định nghĩa các loại thông báo
export enum NotificationType {
  WARNING = 'warning',
  REMINDER = 'reminder',
  INFO = 'info',
}

// Định nghĩa các hành động khi nhấn thông báo
export enum NotificationAction {
  OPEN_HOME = 'open_home',
  OPEN_SETTINGS = 'open_settings',
  OPEN_NOTIFI = 'open_notifi',
  UPDATE_DB = 'update_db',
}

// Định nghĩa interface cho thông báo
interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  action?: NotificationAction;
  screen?: string; // Tên màn hình để điều hướng
  params?: any; // Tham số bổ sung cho điều hướng
}

// Interface cho context
interface NotifeeContextType {
  showNotification: (data: NotificationData) => Promise<void>;
}

const NotifeeContext = createContext<NotifeeContextType | undefined>(undefined);

// Component provider cho NotifeeContext
export const NotifeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigation = useNavigation<any>();

  // Xử lý sự kiện nhấn thông báo
  useEffect(() => {
    // Sự kiện khi ứng dụng ở foreground
    const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data) {
        const { action, screen, params } = detail.notification.data as any;
        handleNotificationAction(action, screen, params);
      }
    });

    // Sự kiện khi ứng dụng ở background
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data) {
        const { action, screen, params } = detail.notification.data as any;
        handleNotificationAction(action, screen, params);
      }
    });

    // Kiểm tra thông báo mở ứng dụng từ trạng thái terminated
    notifee.getInitialNotification().then((initialNotification) => {
      if (initialNotification?.notification?.data) {
        const { action, screen, params } = initialNotification.notification.data as any;
        handleNotificationAction(action, screen, params);
      }
    });

    return () => {
      unsubscribeForeground();
    };
  }, [navigation]);

  const handleNotificationAction = (action: NotificationAction, screen?: string, params?: any) => {
    switch (action) {
      case NotificationAction.OPEN_HOME:
        navigation.navigate('HomeStack', { screen: screen || 'HomeScreen', params });
        break;
      case NotificationAction.OPEN_SETTINGS:
        navigation.navigate('SettingStack', { screen: screen || 'SettingsScreen', params });
        break;
      case NotificationAction.OPEN_NOTIFI:
        navigation.navigate('NotifyStack', { screen: screen || 'NotifiScreen', params });
        break;
      case NotificationAction.UPDATE_DB:
        console.log('Cập nhật database với params:', params);
        // Có thể  API hoặc hàm cập nhật database tại đây
        break;
      default:
        console.log('Hành động không xác định:', action);
    }
  };

  // Hàm hiển thị thông báo
  const showNotification = async ({ type, title, body, action, screen, params }: NotificationData) => {
    // Yêu cầu quyền thông báo
    await notifee.requestPermission();

    // Tạo kênh thông báo (cần cho Android)
    const channelId = await notifee.createChannel({
      id: type,
      name: `${type} Channel`,
      importance: AndroidImportance.HIGH, // Đặt mức độ ưu tiên cao
    });

    // Cấu hình kiểu thông báo dựa trên type
    const androidStyle = {
      [NotificationType.WARNING]: { color: '#FF0000' }, // Màu đỏ cho warning
      [NotificationType.REMINDER]: { color: '#FFA500' }, // Màu cam cho reminder
      [NotificationType.INFO]: { color: '#007AFF' }, // Màu xanh cho info
    };

    // Hiển thị thông báo
    await notifee.displayNotification({
      title,
      body,
      data: { action: action || NotificationAction.OPEN_HOME, ...(screen && { screen }), ...(params && { params }) }, 
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        color: androidStyle[type]?.color,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
    });
  };

  return (
    <NotifeeContext.Provider value={{ showNotification }}>
      {children}
    </NotifeeContext.Provider>
  );
};

// Hook để sử dụng NotifeeContext
export const useNotifee = () => {
  const context = useContext(NotifeeContext);
  if (!context) {
    throw new Error('useNotifee must be used within a NotifeeProvider');
  }
  return context;
};