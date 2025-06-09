import { NavigationProp } from "@react-navigation/native";
import axios from "axios";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import {API_BASE_URL} from "../../utils/config";
import Loading from "../../components/Loading";
import { useTranslation } from "react-i18next";
import { useNotification } from '../../contexts/NotificationContext';

type Props = {
  navigation: NavigationProp<any>;
};

const ForgotScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rePassword, setRePassword] = useState("");
  const [isRePasswordVisible, setIsRePasswordVisible] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const {showNotification} = useNotification();

 

  const handleForgotPassword = async () => {
    if (!email || !password || !rePassword) {
      showNotification(t("forgotPassword.notification.emptyFields"), "error");
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      showNotification(t("forgotPassword.notification.invalidPassword"), "error");
      return;
    }

    if (password !== rePassword) {
      showNotification(t("forgotPassword.notification.passwordMismatch"), "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification(t("forgotPassword.notification.invalidEmail"), "error");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/otp/sendFP`, null, {
        params: { email }
      });

      if (response.data.result === "success") {
        showNotification(
          t("forgotPassword.notification.otpSendSuccess"),
          "success",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate("VerifyOTP", {
                  email,
                  password,
                  otpAction: "forgotPassword"
                });
              },
              color: "primary"
            }
          ]
        );
        
      } else {
        showNotification(t("forgotPassword.notification.otpSendError"), "error");
      }
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || t("forgotPassword.notification.generalError");
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tiêu đề */}
      <Text style={styles.welcomeText}>{t("forgotPassword.title")}</Text>
      <Text style={styles.loginText}>{t("forgotPassword.subtitle")}</Text>

      <Image
        source={require("../../assets/login.png")}
        style={styles.illustration}
      />

      <TextInput
        style={styles.input}
        placeholder={t("forgotPassword.emailPlaceholder")}
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input1}
          placeholder={t("forgotPassword.newPasswordPlaceholder")}
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
        />

        <TouchableOpacity
          onPressIn={() => setIsPasswordVisible(true)}
          onPressOut={() => setIsPasswordVisible(false)}
          style={styles.eyeIcon}
        >
          <Text style={{ fontSize: 18 }}>{isPasswordVisible ? "👁️" : "🙈"}</Text>
        </TouchableOpacity>
      </View>

      {/* Nhập lại mật khẩu */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input1}
          placeholder={t("forgotPassword.rePasswordPlaceholder")}
          placeholderTextColor="#888"
          value={rePassword}
          onChangeText={setRePassword}
          secureTextEntry={!isRePasswordVisible}
        />

        <TouchableOpacity
          onPressIn={() => setIsRePasswordVisible(true)}
          onPressOut={() => setIsRePasswordVisible(false)}
          style={styles.eyeIcon}
        >
          <Text style={{ fontSize: 18 }}>{isRePasswordVisible ? "👁️" : "🙈"}</Text>
        </TouchableOpacity>
      </View>

      {/* Nút Đổi mật khẩu */}
      <TouchableOpacity style={styles.loginButton} onPress={handleForgotPassword}>
        <Text style={styles.loginButtonText}>{t("forgotPassword.resetPasswordButton")}</Text>
      </TouchableOpacity>

      {/* Đăng ký */}
      <Text style={styles.signUpText}>
        {t("forgotPassword.noAccount")}{" "}
        <Text style={styles.signUpLink} onPress={() => navigation.navigate('SignUp')}>
          {t("forgotPassword.signUp")}
        </Text>
      </Text>

      {loading && <Loading message={t("forgotPassword.loadingMessage")} />}
      
      
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
    position: "relative", // Giữ vị trí tương đối
  },

  input1: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingRight: 40, // Chừa chỗ cho icon
  },

  eyeIcon: {
    position: "absolute",
    right: 15,  // Đặt icon sát phải
    padding: 10,
  },
  welcomeText: {
    fontSize: 20,
    color: "#4D2D7D",
    marginBottom: 5,
  },
  loginText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4D2D7D",
    marginBottom: 20,
  },
  illustration: {
    width: 250,
    height: 250,
    resizeMode: "contain",
    marginBottom: 30,
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
    color: "#333",
  },
  forgotPasswordText: {
    alignSelf: "flex-end",
    color: "#4D2D7D",
    fontSize: 14,
    marginBottom: 20,

  },
  loginButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#4D2D7D",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  signUpText: {
    marginTop: 15,
    fontSize: 14,
    color: "#333",
  },
  signUpLink: {
    color: "#4D2D7D",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default ForgotScreen;