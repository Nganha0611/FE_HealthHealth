import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

const Welcome = ({  }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Chào mừng bạn đến với</Text>
      <Text style={styles.selfCareText}>Health Health</Text>
      <Image
        source={require("../assets/login.png")} 
        style={styles.illustration}
      />

      <TouchableOpacity style={styles.signUpButton}>
        <Text style={styles.signUpText}>Đăng nhập</Text>
      </TouchableOpacity>

      {/* Nút Login */}
      <TouchableOpacity style={styles.loginButton}>
        <Text style={styles.loginText}>Đăng ký</Text>
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

export default Welcome;
