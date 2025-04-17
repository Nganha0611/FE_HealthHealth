import { NavigationProp } from "@react-navigation/native";
import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
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
import Notification from "../../components/Notification";
import { useTranslation } from "react-i18next"; // Import i18n hook

type Props = {
    navigation: NavigationProp<any>;
    route: any;
};

const VerifyOTPScreen: React.FC<Props> = ({ navigation, route }) => {
    const { t } = useTranslation(); // Initialize translation hook
    const { email, name, password, birth, gender, numberPhone, address, otpAction } = route.params;
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    const [countdown, setCountdown] = useState(300);
    const [isResendDisabled, setIsResendDisabled] = useState(true);
    const countdownRef = useRef<NodeJS.Timeout | null>(null); // Lưu interval

  const [notification, setNotification] = useState({
    message: "",
    type: "success" as "success" | "error" | "warning",
    visible: false,
    buttonText: "",
    onPress: () => {},
  });

  const showNotification = (message: string, type: "success" | "error" | "warning", buttonText?: string, onPress?: () => void) => {
    setNotification({
      message,
      type,
      visible: true,
      buttonText: buttonText || "",
      onPress: onPress || (() => setNotification((prev) => ({ ...prev, visible: false }))),
    });
  };

    useEffect(() => {
        startCountdown();
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    const startCountdown = () => {
        setCountdown(300);
        setIsResendDisabled(true);

        if (countdownRef.current) clearInterval(countdownRef.current);

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
                showNotification(t('verifyOTP.notification.otpSentSuccess'), "success");
                startCountdown();
            } else {
                showNotification(response.data.message || t('verifyOTP.notification.otpSentError'), "error");
            }
        } catch (error) {
            const errorMessage = (error as any)?.response?.data?.message || t('verifyOTP.notification.otpSentError');
            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp.trim()) {
            showNotification(t('verifyOTP.notification.otpInvalid'), "error");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/otp/verify`, null, {
                params: { email, otp },
            });

            if (response.status === 200) {
                showNotification(response.data.message || t('verifyOTP.notification.otpSentSuccess'), "success");
                if (otpAction === "register") {
                    await handleSignUp();
                } else if (otpAction === "forgotPassword") {
                    await handleForgotPassword();
                }
            } else {
                showNotification(t('verifyOTP.notification.otpInvalid'), "error");
            }
        } catch (error) {
            showNotification(t('verifyOTP.notification.otpExpired'), "error");
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
                showNotification(t('verifyOTP.notification.otpSentSuccess'), "success", "OK", () => {
                    navigation.navigate("Login");
                });
            } else {
                showNotification(response.data.message, "error");
            }
        } catch (error) {
            showNotification(t('verifyOTP.notification.otpSentError'), "error");
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
                showNotification(t('verifyOTP.notification.otpSentSuccess'), "success", "OK", () => {
                    navigation.navigate("Login");
                });
            } else {
                showNotification(response.data.message, "error");
            }
        } catch (error) {
            showNotification(t('verifyOTP.notification.otpSentError'), "error");
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('verifyOTP.title')}</Text>
            <Text style={styles.subtitle}>{t('verifyOTP.subtitle')}</Text>
            <TextInput
                style={styles.input}
                placeholder={t('verifyOTP.otpPlaceholder')}
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
                    {isResendDisabled ? `${t('verifyOTP.resendAfter', { seconds: countdown })}` : t('verifyOTP.resendButton')}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOTP}>
                <Text style={styles.verifyButtonText}>{t('verifyOTP.verifyButton')}</Text>
            </TouchableOpacity>
            {loading && <Loading message={t('verifyOTP.loadingMessage')} />}
            <Notification
                message={notification.message}
                type={notification.type}
                visible={notification.visible}
                onClose={() => setNotification((prev) => ({ ...prev, visible: false }))}
                buttonText={notification.buttonText}
                onPressButton={notification.onPress}
            />
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
