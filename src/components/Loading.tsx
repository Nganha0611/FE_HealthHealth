import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

interface LoadingProps {
    message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = "Đang tải..." }) => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.text}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)", // Làm mờ nền
        position: "absolute",
        width: "100%",
        height: "100%",
    },
    text: {
        marginTop: 10,
        fontSize: 16,
        color: "#fff",
    },
});

export default Loading;
