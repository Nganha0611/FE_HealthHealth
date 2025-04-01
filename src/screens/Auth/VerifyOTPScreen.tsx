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
import { useEffect, useRef } from "react"; // Thêm useEffect và useRef

type Props = {
    navigation: NavigationProp<any>;
    route: any;
};

const VerifyOTPScreen: React.FC<Props> = ({ navigation, route }) => {
    const { email, name, password, birth, gender, numberPhone, address, otpAction } = route.params;
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    const [countdown, setCountdown] = useState(300);
    const [isResendDisabled, setIsResendDisabled] = useState(true);
    const countdownRef = useRef<NodeJS.Timeout | null>(null); // Lưu interval
    useEffect(() => {
        startCountdown();
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);
    const startCountdown = () => {
        setCountdown(300);
        setIsResendDisabled(true);

        if (countdownRef.current) clearInterval(countdownRef.current); // Xóa interval cũ trước khi tạo mới

        countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current!);
                    setIsResendDisabled(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResendOTP = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/otp/send`, null, {
                params: { email }
            });

            if (response.data.result === "success") {
                Alert.alert("Thành công", response.data.message);
                startCountdown();
            } else {
                Alert.alert("Lỗi", response.data.message || "Có lỗi xảy ra khi gửi OTP.");
            }
        } catch (error) {
            const errorMessage = (error as any)?.response?.data?.message || "Không thể gửi mã OTP, vui lòng thử lại!";
            Alert.alert("Lỗi", errorMessage);
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };
    
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
                if (otpAction === "register") {
                    await handleSignUp();
                } else if (otpAction === "forgotPassword") {
                    await handleForgotPassword();
                }
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
    const handleForgotPassword = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
                email,
                newPassword: password,
            });

            if (response.data.result === "success") {
                Alert.alert("Thành công", "Mật khẩu đã được cập nhật!", [
                    { text: "OK", onPress: () => navigation.navigate("Login") },
                ]);
            } else {
                Alert.alert("Lỗi", response.data.message);
            }
        } catch (error) {
            console.error("Lỗi đổi mật khẩu:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra, vui lòng thử lại!");
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
          <TouchableOpacity
                style={[styles.resendButton, isResendDisabled && { opacity: 0.5 }]}
                onPress={handleResendOTP}
                disabled={isResendDisabled}
            >
                <Text style={styles.resendButtonText}>
                    {isResendDisabled ? `Gửi lại sau ${countdown}s` : "Gửi lại mã OTP"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOTP}>
                <Text style={styles.verifyButtonText}>Xác thực</Text>
            </TouchableOpacity>
            {loading && <Loading message="Đang xử lý..." />}
        </View>
    );
};

const styles = StyleSheet.create({
    resendButton: {
        marginTop: 10,
        padding: 10,
        borderRadius: 5,
        backgroundColor: "#4D2D7D",
        alignItems: "center",
        marginBottom: 10
    },
    resendButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "bold",
    },    
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
