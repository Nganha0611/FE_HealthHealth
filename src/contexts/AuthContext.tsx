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

  // Kiểm tra trạng thái đăng nhập khi component load
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

  const login = async (token: string, user: any) => {
    try {
      // Kiểm tra nếu token và user không phải là null hoặc undefined
      if (token && user) {
        await AsyncStorage.setItem("authToken", token);  // Lưu token
        await AsyncStorage.setItem("user", JSON.stringify(user)); // Lưu thông tin người dùng
        setIsLoggedIn(true); // Cập nhật trạng thái đăng nhập thành công
      } else {
        console.error("Token hoặc thông tin người dùng không hợp lệ");
      }
    } catch (error) {
      if (error instanceof Error) {
        // Kiểm tra xem error có phải là đối tượng lỗi không
        console.error("Lỗi khi lưu thông tin đăng nhập:", error.message);
      } else {
        // Nếu không phải đối tượng lỗi, in ra lỗi trực tiếp
        console.error("Lỗi khi lưu thông tin đăng nhập:", error);
      }
    }
  };
  
  

  // Hàm logout để xóa token và thông tin người dùng
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("user"); // Xóa thông tin người dùng
      setIsLoggedIn(false); // Cập nhật trạng thái đăng xuất
    } catch (error) {
      console.error("Lỗi khi xóa thông tin đăng nhập:", error);
    }
  };

  // Cung cấp các giá trị cho context
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
