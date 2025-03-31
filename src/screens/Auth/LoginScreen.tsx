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


type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;
type LoginScreenRouteProp = RouteProp<AuthStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
  route: LoginScreenRouteProp;
};
const LoginScreen : React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { login } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
const handleLogin = async () => {
  setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {  
        email,
            password,
        });

        if (response.data.result === "success") {
            Alert.alert("Thành công", "đăng nhap65thanh2 công!");
          
            await login(); 
        } else {
            Alert.alert("Lỗi", response.data.message);
        }
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        Alert.alert("Lỗi", "Có lỗi xảy ra, vui lòng thử lại!");
    }
    setLoading(false);

};




  return (
    <View style={styles.container}>
      {/* Tiêu đề */}
      <Text style={styles.welcomeText}>Chào mừng bạn trở lại</Text>
      <Text style={styles.loginText}>Đăng nhập</Text>

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

      {/* Ô nhập Password */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input1}
          placeholder="Mật khẩu"
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
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>

      {/* Nút Login */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Đăng nhập</Text>
      </TouchableOpacity>

      {/* Đăng ký */}
      <Text style={styles.signUpText} onPress={() => navigation.navigate('SignUp')}>
        Bạn chưa có tài khoản?{" "}
        <Text style={styles.signUpLink}>
          Đăng ký
        </Text>
      </Text>
      {loading && <Loading message="Đang đăng nhập..." />}
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
