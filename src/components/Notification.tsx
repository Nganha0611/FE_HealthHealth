import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import FontAwesome from 'react-native-vector-icons/FontAwesome';

type NotificationProps = {
    message: string;
    type: "success" | "error" | "warning";
    visible: boolean;
    onClose: () => void;
    buttonText?: string;
    onPress?: () => void;
  };
  

const Notification: React.FC<NotificationProps> = ({ 
    message, 
    type, 
    visible, 
    onClose, 
    buttonText, 
    onPress 
}) => {
    const fadeAnim = new Animated.Value(visible ? 1 : 0);

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
    
            // Auto hide sau 3-5s, không gọi onPress ở đây
            const autoHide = setTimeout(() => {
                onClose();
            }, buttonText ? 5000 : 3000); 
    
            return () => clearTimeout(autoHide);
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);
    

    return (
        <Animated.View 
            style={[
                styles.container, 
                styles[type], 
                buttonText ? styles.centered : styles.top,
                { opacity: fadeAnim }
            ]}
        >
            {/* Nút đóng (X) */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <FontAwesome name="times" size={18} color="#fff" />
            </TouchableOpacity>

            {/* Nội dung thông báo */}
            <Text style={styles.text}>{message}</Text>

            {/* Nút hành động (nếu có) */}
            {buttonText && onPress && (
                <TouchableOpacity style={styles.button} onPress={onPress}>
                    <Text style={styles.buttonText}>{buttonText}</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
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
    warning: { backgroundColor: "#FFC107" },
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
    button: {
        marginTop: 10,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
    },
    buttonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
    },
});

export default Notification;