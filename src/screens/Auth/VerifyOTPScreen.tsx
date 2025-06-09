import { NavigationProp, CommonActions } from "@react-navigation/native";
import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { API_BASE_URL } from "../../utils/config";
import Loading from "../../components/Loading";
import { useNotification } from "../../contexts/NotificationContext";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { PhoneAuthProvider } from "@react-native-firebase/auth";
import auth from "@react-native-firebase/auth";

type Props = {
  navigation: NavigationProp<any>;
  route: any;
};

const VerifyOTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { numberPhone, otpAction, verificationId } = route.params;
  const email = route.params.email;
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState(300);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const { showNotification } = useNotification();
  const [verifying, setVerifying] = useState(false);
  const { setIsLoggedIn } = useAuth();

  useEffect(() => {
    console.log("Verification ID:", verificationId);
    console.log("Action:", otpAction);
    console.log("Number Phone:", numberPhone);
    console.log("Email:", email);
    startCountdown();
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, []);

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const startCountdown = () => {
    setCountdown(300);
    setIsResendDisabled(true);

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        console.log("Countdown:", prev); // Debug để kiểm tra
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setIsResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyCode = async () => {
    if (!verificationId) {
      showNotification(t("verifyOTP.notification.otpNotSent"), "error");
      return;
    }

    if (!numberPhone) {
      showNotification(t("verifyOTP.notification.invalidPhoneNumber"), "error");
      return;
    }

    try {
      setVerifying(true);

      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await auth().signInWithCredential(credential);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showNotification(t("verifyOTP.notification.noAuthToken"), "error");
        return;
      }

      let formattedPhoneNumber = numberPhone.trim();
      if (formattedPhoneNumber.startsWith("0")) {
        formattedPhoneNumber = "+84" + formattedPhoneNumber.slice(1);
      } else if (!formattedPhoneNumber.startsWith("+")) {
        formattedPhoneNumber = "+" + formattedPhoneNumber;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/verify-phone`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumber: formattedPhoneNumber }),
      });

      if (response.ok) {
        const stored = await AsyncStorage.getItem("user");
        if (stored) {
          const user = JSON.parse(stored);
          user.isVerifyPhone = true;
          await AsyncStorage.setItem("user", JSON.stringify(user));
        }

        setIsLoggedIn(true);
        showNotification(t("verifyOTP.notification.verificationSuccess"), "success");

        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: "BottomTabs",
                  params: {
                    screen: "SettingStack",
                    params: {
                      screen: "Account",
                    },
                  },
                },
              ],
            })
          );
        }, 100);
      } else {
        const serverError = await response.text();
        console.error("Lỗi từ server:", serverError);
        showNotification(t("verifyOTP.notification.updateStatusFailed"), "error");
      }

      await auth().signOut();
    } catch (error: any) {
      console.error("Lỗi khi xác thực OTP:", error);
      showNotification(t("verifyOTP.notification.otpVerifyError"), "error");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      let endpoint = "";
      if (otpAction === "forgotPassword") {
        endpoint = `${API_BASE_URL}/api/otp/sendFP`;
      } else {
        endpoint = `${API_BASE_URL}/api/otp/send`;
      }
      const response = await axios.post(
        endpoint,
        null,
        {
          params: { email },
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        }
      );

      if (response.data.result === "success") {
        showNotification(t("verifyOTP.notification.otpSentSuccess"), "success");
        startCountdown();
      } else {
        showNotification(response.data.message || t("verifyOTP.notification.otpSentError"), "error");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || t("verifyOTP.notification.otpSentError");
      showNotification(errorMessage, "error");
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
          params: { email, otp },
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        }
      );

      const { result, message } = response.data;

      if (response.status === 200 && result === "success") {
        showNotification(t("verifyOTP.notification.otpVerifySuccess"), "success");
        if (otpAction === "register") {
          await handleSignUp();
        } else if (otpAction === "forgotPassword") {
          await handleForgotPassword();
        }
      } else {
        if (result === "OTPnotExist") {
          showNotification(t("verifyOTP.notification.otpNotExist"), "error");
        } else if (result === "OTPExpired") {
          showNotification(t("verifyOTP.notification.otpExpired"), "error");
        } else if (result === "error") {
          showNotification(message || t("verifyOTP.notification.otpInvalid"), "error");
        } else {
          showNotification(t("verifyOTP.notification.serverError"), "error");
        }
      }
    } catch (error: any) {
      console.error("Lỗi xác minh OTP:", error);
      if (error.response) {
        const { result, message } = error.response.data;
        if (result === "OTPnotExist") {
          showNotification(t("verifyOTP.notification.otpNotExist"), "error");
        } else if (result === "OTPExpired") {
          showNotification(t("verifyOTP.notification.otpExpired"), "error");
        } else if (result === "error") {
          showNotification(message || t("verifyOTP.notification.otpInvalid"), "error");
        } else {
          showNotification(t("verifyOTP.notification.serverError"), "error");
        }
      } else if (error.request) {
        showNotification(t("verifyOTP.notification.networkError"), "error");
      } else {
        showNotification(t("verifyOTP.notification.unexpectedError"), "error");
      }
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
        showNotification(t("signupSuccess"), "success");
        navigation.navigate("Login");
      } else {
        showNotification(t("verifyOTP.notification.otpInvalid"), "error");
      }
    } catch (error) {
      showNotification(t("verifyOTP.notification.signupError"), "error");
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
        showNotification(t("verifyOTP.notification.successPasswordChanged"), "success");
        navigation.navigate("Login");
      } else if (response.data.result === "emailNotExist") {
        showNotification(t("verifyOTP.notification.emailNotFound"), "error");
      } else {
        showNotification(response.data.message || t("verifyOTP.notification.passwordChangeError"), "error");
      }
    } catch (error) {
      showNotification(t("verifyOTP.notification.passwordChangeError"), "error");
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
        placeholderTextColor="#333"
        keyboardType="number-pad"
        maxLength={6}
      />
      <Text style={styles.countdownText}>
        {countdown > 0
          ? `Gửi lại mã sau: ${formatCountdown(countdown)}`
          : "Có thể gửi lại mã ngay"}
      </Text>
      <TouchableOpacity
        style={[styles.resendButton, isResendDisabled && { opacity: 0.5 }]}
        onPress={handleResendOTP}
        disabled={isResendDisabled}
      >
        <Text style={styles.resendButtonText}>{t("verifyOTP.resendButton")}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOTP}>
        <Text style={styles.verifyButtonText}>{t("verifyOTP.verifyButton")}</Text>
      </TouchableOpacity>
      {loading && <Loading message={t("verifyOTP.loadingMessage")} />}
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
    color: "#333",
  },
  countdownText: {
    fontSize: 14,
    color: "#4D2D7D",
    marginBottom: 10,
  },
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