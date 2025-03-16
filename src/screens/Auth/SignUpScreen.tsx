import { Picker } from "@react-native-picker/picker";
import { NavigationProp } from "@react-navigation/native";
import React, { useState } from "react";

import {
    View,
    Text,
    TextInput,
    Image,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import DatePicker from "react-native-date-picker";
import DropDownPicker from "react-native-dropdown-picker";
type Props = {
    
    navigation: NavigationProp<any>;
  };
const SignUpScreen : React.FC<Props> = ({ navigation }) => {

        const [email, setEmail] = useState("");
        const [phone, setPhone] = useState("");
        const [name, setName] = useState("");

        const [password, setPassword] = useState("");
        const [isPasswordVisible, setIsPasswordVisible] = useState(false);
        const [rePassword, setRePassword] = useState("");
        const [isRePasswordVisible, setIsRePasswordVisible] = useState(false);
        const [date, setDate] = useState(new Date());
        const [open, setOpen] = useState(false);
        const [openGender, setOpenGender] = useState(false);
        const [dob, setDob] = useState("");
        const [gender, setGender] = useState("");
        return (
            <View style={styles.container}>
                {/* Tiêu đề */}
                <Text style={styles.welcomeText}>Chào mừng bạn đến với Health Health</Text>
                <Text style={styles.loginText}>Đăng ký
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Họ & Tên"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor="#888"
                    keyboardType="default"
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Số điện thoại"
                    value={phone}
                    onChangeText={setPhone}
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                />
                <DropDownPicker
                    open={openGender}
                    setOpen={setOpenGender}
                    value={gender}
                    setValue={setGender}
                    items={[
                        { label: "Nam", value: "male" },
                        { label: "Nữ", value: "female" },
                        { label: "Khác", value: "other" }
                    ]}
                    containerStyle={{ width: "100%", marginBottom: 15 }}
                    style={{ backgroundColor: "#fff", borderColor: "#ccc" }}
                    dropDownContainerStyle={{ backgroundColor: "#fff" }}
                    placeholder="Chọn giới tính"
                    placeholderStyle={{ color: "#888", fontSize: 16 }}
                    zIndex={3000}
                    zIndexInverse={1000}
                />
                {/* Chọn ngày sinh */}
                <TouchableOpacity style={styles.input} onPress={() => setOpen(true)}>
                    <Text style={{ color: dob ? "#333" : "#888", fontSize: 16 }}>
                        {dob || "Chọn ngày sinh"}
                    </Text>
                </TouchableOpacity>

                {/* Hiển thị Date Picker */}
                <DatePicker
                    modal
                    open={open}
                    date={date}
                    mode="date"
                    locale="vi"
                    onConfirm={(selectedDate) => {
                        setOpen(false);
                        setDate(selectedDate);
                        setDob(selectedDate.toLocaleDateString("vi-VN")); // Định dạng ngày
                    }}
                    onCancel={() => setOpen(false)}
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

                {/* Nhập lại mật khẩu */}
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
                <View style={{ width: "100%", alignItems: "flex-end" }}>
                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                        <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.loginButton}>
                    <Text style={styles.loginButtonText}>Đăng ký</Text>
                </TouchableOpacity>

                <Text style={styles.signUpText} onPress={() => navigation.navigate('Login')}>
                    Bạn đã có tài khoản?{" "}
                    <Text style={styles.signUpLink}>
                        Đăng nhập
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
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: "#333",
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        backgroundColor: "#FFFFFF",
        height: 50,
        justifyContent: "center",
    },
    picker: {
        width: "100%",
        height: 50,
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

    input: {
        width: "100%",
        height: 50, // Đảm bảo cùng chiều cao
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#ccc",
        justifyContent: "center", // Căn giữa nội dung
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

export default SignUpScreen;
