import { NavigationProp, CommonActions } from "@react-navigation/native";
import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";
import { API_BASE_URL } from "../../utils/config";
import Loading from "../../components/Loading";
import { useNotification } from "../../contexts/NotificationContext";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { PhoneAuthProvider } from "@react-native-firebase/auth";
import auth from '@react-native-firebase/auth';

type Props = {
    navigation: NavigationProp<any>;
    route: any;
};

const VerifyOTPScreen: React.FC<Props> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { numberPhone, otpAction, verificationId } = route.params;
    const email = route.params.email; // Giả sử email được truyền từ màn hình trước
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    const [countdown, setCountdown] = useState(300);
    const [isResendDisabled, setIsResendDisabled] = useState(true);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const { showNotification } = useNotification();
    const [verifying, setVerifying] = useState(false);
    const [message, setMessage] = useState("");
    const { setIsLoggedIn } = useAuth();

    useEffect(() => {
        console.log("Verification ID:", verificationId);
        console.log("Action:", otpAction);
        console.log("Number Phone:", numberPhone);
        console.log("Email:", email); // Debug email
        startCountdown();
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    const handleVerifyCode = async () => {
    if (!verificationId) {
        Alert.alert('Lỗi', 'Bạn cần gửi mã OTP trước khi xác thực');
        return;
    }

    if (!numberPhone) {
        Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
        return;
    }

    try {
        setVerifying(true);
        setMessage('Đang xác thực mã OTP...');

        // Sử dụng auth() thay vì getAuth()
        const credential = PhoneAuthProvider.credential(verificationId, otp);
        const userCredential = await auth().signInWithCredential(credential);
        console.log('Xác thực OTP thành công, user:', userCredential.user.phoneNumber);

        const token = await AsyncStorage.getItem('token');
        if (!token) {
            Alert.alert('Lỗi', 'Không tìm thấy token xác thực');
            setMessage('Lỗi: token xác thực không tồn tại');
            return;
        }

        let formattedPhoneNumber = numberPhone.trim();
        if (formattedPhoneNumber.startsWith('0')) {
            formattedPhoneNumber = '+84' + formattedPhoneNumber.slice(1);
        } else if (!formattedPhoneNumber.startsWith('+')) {
            formattedPhoneNumber = '+' + formattedPhoneNumber;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/verify-phone`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ phoneNumber: formattedPhoneNumber }),
        });

        if (response.ok) {
            Alert.alert('Thành công', 'Số điện thoại đã được xác thực!');
            const stored = await AsyncStorage.getItem('user');
            if (stored) {
                const user = JSON.parse(stored);
                user.isVerifyPhone = true;
                await AsyncStorage.setItem('user', JSON.stringify(user));
            }

            setIsLoggedIn(true);

            setTimeout(() => {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [
                            {
                                name: 'BottomTabs',
                                params: {
                                    screen: 'SettingStack',
                                    params: {
                                        screen: 'Account',
                                    },
                                },
                            },
                        ],
                    })
                );
            }, 100);
        } else {
            const serverError = await response.text();
            console.error('Lỗi từ server:', serverError);
            Alert.alert('Lỗi', 'Cập nhật trạng thái thất bại');
        }

        await auth().signOut();
    } catch (error: any) {
        console.error('Lỗi khi xác thực OTP:', error);
        const errorMessage = error.message || 'Đã xảy ra lỗi';
        setMessage(`Lỗi: ${errorMessage}`);
        Alert.alert('Lỗi', `Mã OTP không hợp lệ: ${errorMessage}`);
    } finally {
        setVerifying(false);
    }
};

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
            const response = await axios.post(
                `${API_BASE_URL}/api/otp/send`,
                null,
                {
                    params: { email }, // Sử dụng email thay vì phone
                }
            );

            if (response.data.result === "success") {
                showNotification(t("verifyOTP.notification.otpSentSuccess"), "success");
                startCountdown();
            } else {
                showNotification(response.data.message || t("verifyOTP.notification.otpSentError"), "error");
            }
        } catch (error) {
            const errorMessage = (error as any)?.response?.data?.message || t("verifyOTP.notification.otpSentError");
            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp.trim()) {
            showNotification(t("verifyOTP.notification.otpInvalid"), "error");
            return;
        }

        setLoading(true);
        if (otpAction === "verify") {
            await handleVerifyCode();
            return;
        }
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/otp/verify`,
                null,
                {
                    params: { email, otp }, // Sử dụng email thay vì phone
                }
            );

            if (response.status === 200) {
                const { result, message } = response.data;
                if (result === "success") {
                    showNotification(message || t("verifyOTP.notification.otpSentSuccess"), "success");
                    if (otpAction === "register") {
                        await handleSignUp();
                    } else if (otpAction === "forgotPassword") {
                        await handleForgotPassword();
                    }
                } else {
                    showNotification(message || t("verifyOTP.notification.otpInvalid"), "error");
                }
            } else {
                showNotification(t("verifyOTP.notification.otpInvalid"), "error");
            }
        } catch (error) {
            const errorResponse = (error as any)?.response?.data;
            const errorMessage = errorResponse?.message || t("verifyOTP.notification.otpExpired");
            console.error("Lỗi xác minh OTP:", error);
            showNotification(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
                name: route.params.name || "",
                email: route.params.email || "",
                password: route.params.password || "",
                birth: route.params.birth || "",
                sex: route.params.gender || "",
                numberPhone: numberPhone || "",
                address: route.params.address || "",
            });

            if (response.data.result === "success") {
                showNotification(t("verifyOTP.notification.otpSentSuccess"), "success");
                navigation.navigate("Login");

            } else {
                showNotification(response.data.message, "error");
            }
        } catch (error) {
            showNotification(t("verifyOTP.notification.otpSentError"), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
                email: route.params.email || "",
                newPassword: route.params.password || "",
            });

            if (response.data.result === "success") {
                showNotification(
                    t("verifyOTP.notification.otpSentSuccess"),
                    "success",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                navigation.navigate("Login");
                            },
                            color: "primary",
                        },
                    ]
                );
            } else {
                showNotification(response.data.message, "error");
            }
        } catch (error) {
            showNotification(t("verifyOTP.notification.otpSentError"), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t("verifyOTP.title")}</Text>
            <Text style={styles.subtitle}>{t("verifyOTP.subtitle")}</Text>
            <TextInput
                style={styles.input}
                placeholder={t("verifyOTP.otpPlaceholder")}
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
                    {isResendDisabled
                        ? `${t("verifyOTP.resendAfter", { seconds: countdown })}`
                        : t("verifyOTP.resendButton")}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOTP}>
                <Text style={styles.verifyButtonText}>{t("verifyOTP.verifyButton")}</Text>
            </TouchableOpacity>
            {loading && <Loading message={t("verifyOTP.loadingMessage")} />}
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
        marginBottom: 10,
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
