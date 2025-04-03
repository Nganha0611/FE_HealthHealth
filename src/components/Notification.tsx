import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import FontAwesome from 'react-native-vector-icons/FontAwesome';

type NotificationProps = {
    message: string;
    type: "success" | "error" | "warning";
    visible: boolean;
    onClose: () => void;
    buttonText?: string;
    onPressButton?: () => void;
};

const Notification: React.FC<NotificationProps> = ({ 
    message, 
    type, 
    visible, 
    onClose, 
    buttonText, 
    onPressButton 
}) => {
    const fadeAnim = new Animated.Value(visible ? 1 : 0);

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            const autoHide = setTimeout(() => {
                if (buttonText && onPressButton) {
                    onPressButton(); 
                }
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

    if (!visible) return null;

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
            {buttonText && onPressButton && (
                <TouchableOpacity style={styles.button} onPress={onPressButton}>
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
        backgroundColor: "#fff", // Nền trắng mặc định, sẽ bị ghi đè bởi type
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