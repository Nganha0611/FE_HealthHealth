import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { AuthStackParamList } from "../../navigation/AuthStack";
import { useTranslation } from "react-i18next";
type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Welcome'>;
};
const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>{t('welcomeMessage')}</Text>
      <Text style={styles.selfCareText}>{t('appName')}</Text>
      <Image
        source={require("../../assets/login.png")} 
        style={styles.illustration}
      />

      <TouchableOpacity
        style={styles.signUpButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.signUpText}>{t('login')}</Text>
      </TouchableOpacity>

      {/* Nút Đăng ký */}
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => navigation.navigate('SignUp')}
      >
        <Text style={styles.loginText}>{t('signUp')}</Text>
      </TouchableOpacity>
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
    width: "100%",
    height: "100%",
  },
  welcomeText: {
    fontSize: 20,
    color: "#4D2D7D",
    marginBottom: 5,
  },
  selfCareText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#4D2D7D",
    marginBottom: 20,
  },
  illustration: {
    width: 370,
    height: 370,
    resizeMode: "contain",
    marginBottom: 30,
  },
  signUpButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#4D2D7D",
    paddingVertical: 12,
    paddingHorizontal: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  signUpText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  loginButton: {
    width: "100%",
    height: 50,

    borderWidth: 1,
    borderColor: "#4D2D7D",
    paddingVertical: 12,
    paddingHorizontal: 100,
    borderRadius: 10,
  },
  loginText: {
    color: "#4D2D7D",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default WelcomeScreen;
