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
import Notification from "../../components/Notification";
import { useTranslation } from "react-i18next";

type Props = {
    navigation: NavigationProp<any>;
};

const SignUpScreen: React.FC<Props> = ({ navigation }) => {
    const [name, setName] = useState("");
    const { t } = useTranslation();

    const [email, setEmail] = useState("");
    const [numberPhone, setNumberPhone] = useState("");
    const [password, setPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [rePassword, setRePassword] = useState("");
    const [isRePasswordVisible, setIsRePasswordVisible] = useState(false);
    const [birth, setBirth] = useState("");
    const [open, setOpen] = useState(false);
    const [openGender, setOpenGender] = useState(false);
    const [gender, setGender] = useState("");
    const [address, setAddress] = useState(""); // Địa chỉ
    const { login } = useAuth();
    const [loading, setLoading] = useState<boolean>(false);
    const [showPicker, setShowPicker] = useState(false);
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


const handleSendOTP = async () => {
    if (!name || !email || !password || !birth || !gender || !numberPhone || !address) {
        showNotification(t("complete_form"), "error");
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification(t("invalid_email"), "error");
        return;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        showNotification(t("password_requirements"), "error");
        return;
    }

    if (password !== rePassword) {
        showNotification(t("password_mismatch"), "error");
        return;
    }

    setLoading(true);

    try {
        const response = await axios.post(`${API_BASE_URL}/api/otp/send`, null, {
            params: { email }
        });

        if (response.data.result === "success") {
            showNotification(t("otp_sent_success"), "success");
            navigation.navigate("VerifyOTP", { email, name, password, birth, gender, numberPhone, address, otpAction: "register" });
        } else {
            showNotification(response.data.message || t("otp_send_error"), "error");
        }
    } catch (error) {
        const errorMessage = (error as any)?.response?.data?.message || t("otp_send_error");
        showNotification(errorMessage, "error");
    } finally {
        setLoading(false);
    }
};

return (
    <View style={styles.container}>
        <Text style={styles.welcomeText}>{t("welcome_message")}</Text>
        <Text style={styles.loginText}>{t("sign_up")}</Text>

        <TextInput
            style={styles.input}
            placeholder={t("full_name_placeholder")}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#888"
        />

        <TextInput
            style={styles.input}
            placeholder={t("email_placeholder")}
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#888"
            keyboardType="email-address"
        />

        <TextInput
            style={styles.input}
            placeholder={t("phone_number_placeholder")}
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
                { label: t("male"), value: "male" },
                { label: t("female"), value: "female" },
                { label: t("other"), value: "other" },
            ]}
            containerStyle={{ width: "100%", marginBottom: 15 }}
            style={[
                { backgroundColor: "#fff", borderColor: "#ccc" },
                loading && { opacity: 0.5 }
            ]}
            dropDownContainerStyle={{ backgroundColor: "#fff" }}
            placeholder={t("gender_placeholder")}
            placeholderStyle={{ color: "#888", fontSize: 16 }}
            disabled={loading}
        />

        <TouchableOpacity style={styles.input} onPress={() => setOpen(true)}>
            <Text style={{ color: birth ? "#333" : "#888", fontSize: 16 }}>
                {birth || t("select_birth_date")}
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
                setBirth(selectedDate.toISOString().split("T")[0]);
            }}
            onCancel={() => setOpen(false)}
        />

        <TextInput
            style={styles.input}
            placeholder={t("address_placeholder")}
            value={address}
            onChangeText={setAddress}
            placeholderTextColor="#888"
        />

        <View style={styles.passwordContainer}>
            <TextInput
                style={styles.input1}
                placeholder={t("password_placeholder")}
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
                placeholder={t("repassword_placeholder")}
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
            <Text style={styles.loginButtonText}>{t("sign_up_button")}</Text>
        </TouchableOpacity>

        <Text style={styles.signUpText} onPress={() => navigation.navigate("Login")}>
            {t("already_have_account")} <Text style={styles.signUpLink}>{t("login")}</Text>
        </Text>

        {loading && <Loading message={t("loading_message")} />}
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
