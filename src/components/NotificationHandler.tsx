import React, { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { useNotifee, NotificationType, NotificationAction } from '../contexts/NotifeeContext';
import { View } from 'react-native'; // Component rỗng để tránh lỗi render

const NotificationHandler = () => {
  const { showNotification } = useNotifee();

  useEffect(() => {
    // Xử lý thông báo khi ứng dụng ở foreground
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log("Foreground message received:", remoteMessage);

      await showNotification({
        type: NotificationType.WARNING,
        title: remoteMessage.notification?.title || "Thông báo mới",
        body: remoteMessage.notification?.body || "Bạn có thông báo mới",
        action: NotificationAction.OPEN_NOTIFI,
        screen: "NotifyScreen",
        params: { messageId: remoteMessage.messageId },
      });
    });

    return unsubscribe;
  }, [showNotification]);

  return <View />;
};

export default NotificationHandler;