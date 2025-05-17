import React, { createContext, useContext, useState, ReactNode } from "react";
import Notification, { NotificationButton } from "../components/Notification";

export type NotificationType = "success" | "error" | "warning";

interface NotificationState {
  message: string;
  type: NotificationType;
  visible: boolean;
  buttons?: NotificationButton[];
}

interface NotificationContextProps {
  showNotification: (
    message: string,
    type: NotificationType,
    buttons?: NotificationButton[]
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
    buttons: [],
  });

  const showNotification = (
    message: string,
    type: NotificationType,
    buttons?: NotificationButton[]
  ) => {
    setNotification({
      message,
      type,
      visible: true,
      buttons,
    });
  };

  const handleClose = () => {
    setNotification((prev) => ({ ...prev, visible: false }));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Đảm bảo Notification component được render ở cuối, để nó nằm trên cùng */}
      <Notification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={handleClose}
        buttons={notification.buttons}
      />
    </NotificationContext.Provider>
  );
};