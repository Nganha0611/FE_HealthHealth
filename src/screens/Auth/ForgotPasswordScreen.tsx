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
import API_BASE_URL from "../../utils/config";
import Loading from "../../components/Loading";
import Notification from "../../components/Notification";

type Props = {

  navigation: NavigationProp<any>;
};
const ForgotScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rePassword, setRePassword] = useState("");
  const [isRePasswordVisible, setIsRePasswordVisible] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  /////////////////////////////////////////////////// Xử lý thông báo
  const [notification, setNotification] = useState({
    message: "",
    type: "success" as "success" | "error" | "warning",
    visible: false,
    buttonText: "",
    onPress: () => {},
});

// Hàm hiển thị thông báo với nút
const showNotification = (message: string, type: "success" | "error" | "warning", buttonText?: string, onPress?: () => void) => {
    setNotification({
        message,
        type,
        visible: true,
        buttonText: buttonText || "",
        onPress: onPress || (() => setNotification((prev) => ({ ...prev, visible: false }))),
    });
};

//////////////////////////////////////////////////////
  const handleForgotPassword = async () => {
    if (!email || !password || !rePassword) {
      showNotification("Vui lòng nhập đầy đủ thông tin!!", "error");
      return;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      showNotification("Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ in hoa, số và ký tự đặc biệt!", "error");
      return;
    }
    if (password !== rePassword) {
      Alert.alert("Lỗi", "Mật khẩu nhập lại không khớp!");
      showNotification("Mật khẩu nhập lại không khớp!", "error");

      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification("Email không đúng định dạng!", "error");
      return;
    }
   
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/otp/sendFP`, null, {
        params: { email }
      });

      if (response.data.result === "success") {        
        // navigation.navigate("VerifyOTP", { email, password, otpAction: "forgotPassword" });

        showNotification(
          response.data.message,
          "success",
          "OK",
          () => {
              setNotification((prev) => ({ ...prev, visible: false })); 
              navigation.navigate("VerifyOTP", { email, password, otpAction: "forgotPassword" });
          }
      );
      } else {
        showNotification(response.data.message || "Có lỗi xảy ra khi gửi OTP.", "error");

      }
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || "Không thể gửi mã OTP, vui lòng thử lại!";
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      {/* Tiêu đề */}
      <Text style={styles.welcomeText}>Đặt lại mật khẩu nào !!!</Text>
      <Text style={styles.loginText}>Quên mật khẩu</Text>

      {/* Hình minh họa */}
      <Image
        source={require("../../assets/login.png")}
        style={styles.illustration}
      />

      {/* Ô nhập Email */}
      <TextInput
        style={styles.input}
        placeholder="Email hoặc Số điện thoại"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input1}
          placeholder="Mật khẩu mới"
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
          placeholder="Nhập lại mật khẩu mới"
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

      {/* Nút Login */}
      <TouchableOpacity style={styles.loginButton} onPress={handleForgotPassword}>
        <Text style={styles.loginButtonText}>Đổi mật khẩu</Text>
      </TouchableOpacity>

      {/* Đăng ký */}
      <Text style={styles.signUpText}>
        Bạn chưa có tài khoản?{" "}
        <Text style={styles.signUpLink} onPress={() => navigation.navigate('SignUp')}>
          Đăng ký
        </Text>
      </Text>
      {loading && <Loading message="Đang xử lý..." />}
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

export default ForgotScreen;
