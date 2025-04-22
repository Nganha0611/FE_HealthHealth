import { PhoneAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import React, { useState } from 'react';
import auth from '@react-native-firebase/auth';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import { API_BASE_URL } from '../utils/config';


const PhoneAuth = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');

  // Hàm gửi mã OTP
  const handleSendCode = async () => {
    try {
      setLoading(true);
      setMessage('Đang gửi mã OTP...');
      
      // Đảm bảo số điện thoại có định dạng đúng (+84...)
      const formattedPhoneNumber = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+${phoneNumber}`;
      // Sử dụng tính năng signInWithPhoneNumber của Firebase
      const confirmationResult = await auth().signInWithPhoneNumber(formattedPhoneNumber);
      
      // Lưu ID xác thực để sử dụng khi nhập OTP
      if (confirmationResult.verificationId) {
        setVerificationId(confirmationResult.verificationId);
        setMessage('Mã OTP đã được gửi!');
      }
      
      console.log('Gửi OTP thành công, VerificationId:', confirmationResult.verificationId);
    } catch (error) {
      console.error('Lỗi khi gửi OTP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi';
      setMessage(`Lỗi: ${errorMessage}`);
      Alert.alert('Lỗi', `Không thể gửi mã OTP: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Hàm xác thực mã OTP
  const handleVerifyCode = async () => {
    if (!verificationId) {
      Alert.alert('Lỗi', 'Bạn cần gửi mã OTP trước khi xác thực');
      return;
    }
    
    try {
      setVerifying(true);
      setMessage('Đang xác thực mã OTP...');
      
      // Tạo credential từ verificationId và mã OTP
      const credential = PhoneAuthProvider.credential(verificationId, code);
      
      // Đăng nhập với credential
      const userCredential = await signInWithCredential(auth(), credential);
      
      // Lấy token ID
      const idToken = await userCredential.user.getIdToken();
      console.log('Xác thực thành công! ID Token:', idToken);
      
      // Gửi token đến server của bạn
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/firebase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });
        
        if (response.ok) {
          setMessage('Xác thực thành công và đã gửi token đến server!');
          Alert.alert('Thành công', 'Đăng nhập thành công!');
        } else {
          setMessage('Xác thực thành công nhưng không thể gửi token đến server');
          console.log('Server response:', await response.text());
        }
      } catch (serverError) {
        console.error('Lỗi khi gửi token đến server:', serverError);
        setMessage('Xác thực thành công nhưng gặp lỗi khi gửi token đến server');
      }
    } catch (error) {
      console.error('Lỗi khi xác thực OTP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi';
      setMessage(`Lỗi: ${errorMessage}`);
      Alert.alert('Lỗi', `Mã OTP không hợp lệ: ${errorMessage}`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xác thực số điện thoại</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nhập số điện thoại (+84...)"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      
      <Button
        title={loading ? "Đang gửi..." : "Gửi mã OTP"}
        onPress={handleSendCode}
        disabled={loading || !phoneNumber}
      />
      
      {verificationId ? (
        <View style={styles.otpContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập mã OTP"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
          
          <Button
            title={verifying ? "Đang xác thực..." : "Xác thực OTP"}
            onPress={handleVerifyCode}
            disabled={verifying || !code}
          />
        </View>
      ) : null}
      
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    fontSize: 16,
  },
  otpContainer: {
    marginTop: 20,
  },
  message: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    textAlign: 'center',
  }
});

export default PhoneAuth;