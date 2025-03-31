import { NavigationProp } from "@react-navigation/native";
import axios from "axios";
import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from "react-native";
import API_BASE_URL from "../../utils/config";
import Loading from "../../components/Loading";

type Props = {
    navigation: NavigationProp<any>;
    route: any;
};

const VerifyOTPScreen: React.FC<Props> = ({ navigation, route }) => {
    const { email, name, password, birth, gender, numberPhone, address } = route.params;
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState<boolean>(false);

    const handleVerifyOTP = async () => {
        if (!otp.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập mã OTP!");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/otp/verify`, null, {
                params: { email, otp },
            });

            console.log("Response:", response.data);

            if (response.status === 200) {
                Alert.alert("Thành công", "OTP hợp lệ!");
                await handleSignUp();
            }
        } catch (error) {
            console.error("Lỗi xác thực OTP:", error);
            let errorMessage = "OTP không đúng hoặc đã hết hạn.";
           
            Alert.alert("Lỗi", errorMessage);
        }
        setLoading(false);
    };

    const handleSignUp = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
                name,
                email,
                password,
                birth,
                sex: gender,
                numberPhone,
                address,
            });

            if (response.data.result === "success") {
                Alert.alert("Thành công", "Đăng ký thành công!");
                navigation.navigate("Login");
            } else {
                Alert.alert("Lỗi", response.data.message);
            }
        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi đăng ký, vui lòng thử lại!");
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Xác thực OTP</Text>
            <Text style={styles.subtitle}>Nhập mã OTP đã được gửi đến email của bạn</Text>
            <TextInput
                style={styles.input}
                placeholder="Nhập mã OTP"
                value={otp}
                onChangeText={setOtp}
                placeholderTextColor="#888"
                keyboardType="number-pad"
                maxLength={6}
            />
            <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOTP}>
                <Text style={styles.verifyButtonText}>Xác thực</Text>
            </TouchableOpacity>
            {loading && <Loading message="Đang xử lý..." />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FBFF",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#4D2D7D",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: "#555",
        marginBottom: 20,
        textAlign: "center",
    },
    input: {
        width: "100%",
        height: 50,
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#ccc",
        textAlign: "center",
    },
    verifyButton: {
        width: "100%",
        height: 50,
        backgroundColor: "#4D2D7D",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    verifyButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default VerifyOTPScreen;
