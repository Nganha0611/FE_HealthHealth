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
import DatePicker from "react-native-date-picker";
import DropDownPicker from "react-native-dropdown-picker";
import { useAuth } from "../../contexts/AuthContext";
import API_BASE_URL from "../../utils/config";
import Loading from "../../components/Loading";
type Props = {
    navigation: NavigationProp<any>;
};

const SignUpScreen: React.FC<Props> = ({ navigation }) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [numberPhone, setNumberPhone] = useState("");
    const [password, setPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [rePassword, setRePassword] = useState("");
    const [isRePasswordVisible, setIsRePasswordVisible] = useState(false);
    const [birth, setBirth] = useState(""); // Ngày sinh
    const [open, setOpen] = useState(false);
    const [openGender, setOpenGender] = useState(false);
    const [gender, setGender] = useState("");
    const [address, setAddress] = useState(""); // Địa chỉ
    const { login } = useAuth(); 
    const [loading, setLoading] = useState<boolean>(false);
    const [showPicker, setShowPicker] = useState(false);
    
    // const handleSignUp = async () => {
    //     if (!name || !email || !password || !birth || !gender || !numberPhone || !address) {
    //         Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin!");
    //         return;
    //     }
    //     if (password !== rePassword) {
    //         Alert.alert("Lỗi", "Mật khẩu nhập lại không khớp!");
    //         return;
    //     }
    //     try {
    //         const response = await axios.post("http://172.20.10.2:8080/api/auth/register", {
    //             name,
    //             email,
    //             password,
    //             birth,
    //             sex: gender,
    //             numberPhone,
    //             address,
    //         });

    //         if (response.data.result === "success") {
    //             Alert.alert("Thành công", "Đăng ký thành công!");
    //             navigation.navigate("Login");
    //         } else {
    //             Alert.alert("Lỗi", response.data.message);
    //         }
    //     } catch (error) {
    //         console.error(error);
    //         Alert.alert("Lỗi", "Có lỗi xảy ra, vui lòng thử lại!");
    //     }
    // };
    const handleSendOTP = async () => {
        if (!email) {
            Alert.alert("Lỗi", "Vui lòng nhập email!");
            return;
        }
        if (!name || !email || !password || !birth || !gender || !numberPhone || !address) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin!");
            return;
        }
        if (password !== rePassword) {
            Alert.alert("Lỗi", "Mật khẩu nhập lại không khớp!");
            return;
        }
    
        setLoading(true);
    
        try {
            const response = await axios.post(`${API_BASE_URL}/api/otp/send`, null, {
                params: { email }
            });
    
            if (response.data.result === "success") {
                Alert.alert("Thành công", response.data.message);
                navigation.navigate("VerifyOTP", { email, name, password, birth, gender, numberPhone, address });
            } else {
                // Handle API errors (like "Email đã tồn tại!")
                Alert.alert("Lỗi", response.data.message || "Có lỗi xảy ra khi gửi OTP.");
            }
        } catch (error) {
            // Handle network or unexpected errors
            const errorMessage = (error as any)?.response?.data?.message || "Không thể gửi mã OTP, vui lòng thử lại!";
            Alert.alert("Lỗi", errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    
    return (
        <View style={styles.container}>
            <Text style={styles.welcomeText}>Chào mừng bạn đến với Health Health</Text>
            <Text style={styles.loginText}>Đăng ký</Text>

            <TextInput
                style={styles.input}
                placeholder="Họ & Tên"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#888"
            />

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#888"
                keyboardType="email-address"
            />

            <TextInput
                style={styles.input}
                placeholder="Số điện thoại"

                value={numberPhone}
                onChangeText={setNumberPhone}
                placeholderTextColor="#888"
                keyboardType="phone-pad"
            />

<DropDownPicker
    open={openGender}
    setOpen={setOpenGender}
    value={gender}
    setValue={setGender}
    items={[
        { label: "Nam", value: "male" },
        { label: "Nữ", value: "female" },
        { label: "Khác", value: "other" },
    ]}
    containerStyle={{ width: "100%", marginBottom: 15 }}
    style={[
        { backgroundColor: "#fff", borderColor: "#ccc" },
        loading && { opacity: 0.5 } // Làm mờ khi loading
    ]}
    dropDownContainerStyle={{ backgroundColor: "#fff" }}
    placeholder="Chọn giới tính"
    placeholderStyle={{ color: "#888", fontSize: 16 }}
    disabled={loading} // Chặn mở khi loading
/>


            <TouchableOpacity style={styles.input} onPress={() => setOpen(true)}>
                <Text style={{ color: birth ? "#333" : "#888", fontSize: 16 }}>
                    {birth || "Chọn ngày sinh"}
                </Text>
            </TouchableOpacity>

            <DatePicker
                modal
                open={open}
                date={new Date()}
                mode="date"
                locale="vi"
                onConfirm={(selectedDate) => {
                    setOpen(false);
                    setBirth(selectedDate.toISOString().split("T")[0]); // Định dạng YYYY-MM-DD
                }}
                onCancel={() => setOpen(false)}
            />

            <TextInput
                style={styles.input}
                placeholder="Địa chỉ"
                value={address}
                onChangeText={setAddress}
                placeholderTextColor="#888"
            />

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

            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.input1}
                    placeholder="Nhập lại mật khẩu"
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

            <TouchableOpacity style={styles.loginButton} onPress={handleSendOTP}>
                <Text style={styles.loginButtonText}>Đăng ký</Text>
            </TouchableOpacity>

            <Text style={styles.signUpText} onPress={() => navigation.navigate("Login")}>
                Bạn đã có tài khoản? <Text style={styles.signUpLink}>Đăng nhập</Text>
            </Text>
            {loading && <Loading message="Đang gửi OTP xác thực.." />}
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
        justifyContent: "center",
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
    },
    input1: {
        flex: 1,
        fontSize: 16,
        color: "#333",
        paddingRight: 40,
    },
    eyeIcon: {
        position: "absolute",
        right: 15,
        padding: 10,
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
    },
});

export default SignUpScreen;
