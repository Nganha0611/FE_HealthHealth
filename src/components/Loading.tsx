import React from "react";
import { View, ActivityIndicator, Text, StyleSheet, Dimensions } from "react-native";

interface LoadingProps {
    message?: string;
}

const { width, height } = Dimensions.get("window"); // Lấy kích thước màn hình

const Loading: React.FC<LoadingProps> = ({ message = "Đang tải..." }) => {
    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.text}>{message}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        width: width,
        height: height,
        backgroundColor: "rgba(0,0,0,0.6)", // Nền mờ tối hơn
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000, // Đảm bảo nó ở trên cùng
    },
    container: {
        backgroundColor: "rgba(0, 0, 0, 0.7)", // Màu nền của box loading
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    text: {
        marginTop: 10,
        fontSize: 16,
        color: "#fff",
    },
});

export default Loading;
