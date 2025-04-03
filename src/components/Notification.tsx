import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";

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
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, styles[type], buttonText ? styles.centered : styles.top]}>
            <Text style={styles.text}>{message}</Text>

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
        padding: 15,
        borderRadius: 10,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex: 1000,
        alignSelf: "center",
        alignItems: "center",
        position: "absolute",
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
    text: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
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
