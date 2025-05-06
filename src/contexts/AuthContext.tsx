import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Định nghĩa kiểu AuthContextType
type AuthContextType = {
  isLoggedIn: boolean;
  login: (token: string, user: any) => Promise<void>;  // Đổi thành async function và nhận token, user
  logout: () => Promise<void>; // Đổi thành async function
};

// Tạo context AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider chứa logic về xác thực
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem("authToken");
      setIsLoggedIn(!!token);
    };
    checkLoginStatus();
  }, []);

  const login = async (token: string, user: any) => {
    if (token && user) {
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setIsLoggedIn(true);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("user");
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Lỗi khi logout:", error);
    }
  };

  // Gán hàm logout ra global để gọi từ axios interceptor
  useEffect(() => {
    global.authLogout = logout;
  }, [logout]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để sử dụng context AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
