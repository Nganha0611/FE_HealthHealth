import { CommonActions, NavigationProp, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
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
import { AuthStackParamList } from "../../navigation/AuthStack";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../../utils/config";
import Loading from "../../components/Loading";
import Notification from "../../components/Notification";
import { useTranslation } from "react-i18next";

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;
type LoginScreenRouteProp = RouteProp<AuthStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
  route: LoginScreenRouteProp;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { login } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const { t } = useTranslation();

  /////////////////////////////////////////////////// Xử lý thông báo
  const [notification, setNotification] = useState({
    message: "",
    type: "success" as "success" | "error" | "warning",
    visible: false,
    buttonText: "",
    onPress: () => {},
  });

  // Hàm hiển thị thông báo với nút
  const showNotification = (
    message: string,
    type: "success" | "error" | "warning",
    buttonText?: string,
    onPress?: () => void
  ) => {
    setNotification({
      message,
      type,
      visible: true,
      buttonText: buttonText || "",
      onPress: onPress || (() => setNotification((prev) => ({ ...prev, visible: false }))),
    });
  };

  const handleLogin = async () => {
    // Kiểm tra email và password trước khi gọi API
    if (!email || !password) {
      showNotification(t("error.emailPasswordRequired"), "error");
      return;
    }

    setLoading(true);

    try {
      // Gửi yêu cầu đăng nhập đến API
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      const { result, message, token, user } = response.data;

      // Kiểm tra kết quả trả về từ API
      if (result === "success" && token && user) {
        showNotification(t("success.loginSuccess"), "success");

        // Lưu token và thông tin người dùng vào AsyncStorage
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));

        // Gọi hàm login từ context để cập nhật trạng thái đăng nhập
        await login(token, user);
      } else {
        // Xử lý khi kết quả trả về không hợp lệ
        showNotification(message || t("error.loginFailed"), "error");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Xử lý các lỗi trả về từ API
        const { status, data } = error.response;

        if (status === 401 && data.result === "wrongPassword") {
          showNotification(data.message || t("error.incorrectPassword"), "error");
        } else if (status === 404 && data.result === "emailNotExist") {
          showNotification(data.message || t("error.emailNotFound"), "error");
        } else {
          showNotification(t("error.authError"), "error");
        }
      } else {
        // Xử lý lỗi không phải từ API (lỗi mạng, lỗi không xác định...)
        console.error("Lỗi không xác định:", error);
        showNotification(t("error.generalError"), "error");
      }
    } finally {
      setLoading(false); // Đảm bảo rằng loading được tắt sau khi xử lý xong
    }
  };

  return (
    <View style={styles.container}>
      {/* Tiêu đề */}
      <Text style={styles.welcomeText}>{t("welcomeBackMessage")}</Text>
      <Text style={styles.loginText}>{t("login")}</Text>

      {/* Hình minh họa */}
      <Image
        source={require("../../assets/login.png")}
        style={styles.illustration}
      />

      {/* Ô nhập Email */}
      <TextInput
        style={styles.input}
        placeholder={t("placeholder.emailOrPhone")}
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Ô nhập Password */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input1}
          placeholder={t("placeholder.password")}
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

      {/* Forgot Password */}
      <View style={{ width: "100%", alignItems: "flex-end" }}>
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.forgotPasswordText}>{t("forgotPassword.subtitle")}</Text>
        </TouchableOpacity>
      </View>

      {/* Nút Login */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>{t("loginButton")}</Text>
      </TouchableOpacity>

      {/* Đăng ký */}
      <Text style={styles.signUpText} onPress={() => navigation.navigate("SignUp")}>
        {t("noAccount")}{" "}
        <Text style={styles.signUpLink}>{t("signUp")}</Text>
      </Text>
      {loading && <Loading message={t("loading.login")} />}
      <Notification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />
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

export default LoginScreen;
