import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthContextType = {
  isLoggedIn: boolean;
  login: () => Promise<void>;  // Đổi thành async function
  logout: () => Promise<void>; // Đổi thành async function
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        console.log("Token từ AsyncStorage:", token);
        setIsLoggedIn(!!token); // Nếu có token, đặt isLoggedIn = true
      } catch (error) {
        console.error("Lỗi khi lấy token:", error);
      }
    };

    checkLoginStatus();
  }, []);

  const login = async () => {
    await AsyncStorage.setItem("authToken", "your_dummy_token"); // Thay bằng token thật
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("authToken");
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
