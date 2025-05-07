import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import FontAwesome from 'react-native-vector-icons/FontAwesome';

type NotificationButton = {
  text: string;
  onPress: () => void;
  color?: 'primary' | 'danger';
};

type NotificationProps = {
  message: string;
  type: "success" | "error" | "warning";
  visible: boolean;
  onClose: () => void;
  buttons?: NotificationButton[];
};

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  visible,
  onClose,
  buttons
}) => {
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);
  
  useEffect(() => {
    let autoHide: NodeJS.Timeout | null = null;
  
    if (visible && (!buttons || buttons.length === 0)) {
      autoHide = setTimeout(() => {
        onClose();
      }, 3000);
    }
  
    return () => {
      if (autoHide) {
        clearTimeout(autoHide);
      }
    };
  }, [visible, buttons, onClose]);
  
  if (!visible) return null;

  // Hàm xử lý khi nhấn nút - gọi cả onPress của nút và onClose
  const handleButtonPress = (buttonOnPress: () => void) => {
    // Thực hiện hành động của nút trước
    buttonOnPress();
    // Sau đó đóng thông báo
    onClose();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        styles[type],
        buttons && buttons.length > 0 ? styles.centered : styles.top,
        { opacity: fadeAnim }
      ]}
    >
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <FontAwesome name="times" size={18} color="#fff" />
      </TouchableOpacity>

      {/* Message */}
      <Text style={styles.text}>{message}</Text>

      {/* Buttons */}
      {buttons && buttons.length > 0 && (
        <View style={styles.buttonContainer}>
          {buttons.map((btn, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.button,
                btn.color === 'danger' ? styles.buttonDanger : styles.buttonPrimary,
              ]}
              onPress={() => handleButtonPress(btn.onPress)}
            >
              <Text style={styles.buttonText}>{btn.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10001,
  },
  container: {
    width: "90%",
    padding: 20,
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 1000,
    alignSelf: "center",
    alignItems: "center",
    position: "absolute",
    backgroundColor: "#fff",
  },
  top: {
    top: 50,
  },
  centered: {
    top: "50%",
    transform: [{ translateY: -50 }],
  },
  success: { backgroundColor: "#4CAF50" },
  error: { backgroundColor: "#F44336" },
  warning: { backgroundColor: "e3cf8f" },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  buttonPrimary: {
    backgroundColor: "#4CAF50",
  },
  buttonDanger: {
    backgroundColor: "#D32F2F",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Notification;
export type { NotificationButton };