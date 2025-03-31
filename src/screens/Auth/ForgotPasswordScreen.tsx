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

type Props = {
    
    navigation: NavigationProp<any>;
  };
const ForgotScreen : React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rePassword, setRePassword] = useState("");
  const [isRePasswordVisible, setIsRePasswordVisible] = useState(false);

  const handleForgotPassword = async () => {
    if (!email || !password || !rePassword) {
        Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    if (password !== rePassword) {
        Alert.alert("Lỗi", "Mật khẩu nhập lại không khớp!");
        return;
    }

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
