import React, { createContext, useContext, useState, ReactNode } from "react";
import Notification from "../components/Notification";

type NotificationType = "success" | "error" | "warning";

interface NotificationState {
  message: string;
  type: NotificationType;
  visible: boolean;
  buttonText?: string;
  onPress?: () => void;
}

interface NotificationContextProps {
  showNotification: (
    message: string,
    type: NotificationType,
    buttonText?: string,
    onPress?: () => void
  ) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<NotificationState>({
    message: "",
    type: "success",
    visible: false,
    buttonText: "",
    onPress: () => setNotification((prev) => ({ ...prev, visible: false })),
  });

  const showNotification = (
    message: string,
    type: NotificationType,
    buttonText?: string,
    onPress?: () => void
  ) => {
    setNotification({
      message,
      type,
      visible: true,
      buttonText: buttonText || "",
      onPress: onPress || (() => setNotification((prev) => ({ ...prev, visible: false }))),
    });
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Notification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={() => setNotification((prev) => ({ ...prev, visible: false }))}
        buttonText={notification.buttonText}
        onPress={notification.onPress}
      />
    </NotificationContext.Provider>
  );
};
