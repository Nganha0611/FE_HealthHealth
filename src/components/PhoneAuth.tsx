import { PhoneAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import React, { useState } from 'react';
import auth from '@react-native-firebase/auth';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import { API_BASE_URL } from '../utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';


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
  
      // Chuẩn hóa số điện thoại
      let formattedPhoneNumber = phoneNumber.trim();
  
      // Nếu bắt đầu bằng "0" thì chuyển sang "+84"
      if (formattedPhoneNumber.startsWith('0')) {
        formattedPhoneNumber = '+84' + formattedPhoneNumber.slice(1);
      } else if (!formattedPhoneNumber.startsWith('+')) {
        formattedPhoneNumber = '+' + formattedPhoneNumber;
      }
  
      const confirmationResult = await auth().signInWithPhoneNumber(formattedPhoneNumber);
  
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
  

  const handleVerifyCode = async () => {
    if (!verificationId) {
      Alert.alert('Lỗi', 'Bạn cần gửi mã OTP trước khi xác thực');
      return;
    }
  
    try {
      setVerifying(true);
      setMessage('Đang xác thực mã OTP...');
  
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const userCredential = await signInWithCredential(auth(), credential);
      console.log('Xác thực OTP thành công, user:', userCredential.user.phoneNumber);
  
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token xác thực');
        setMessage('Lỗi: token xác thực không tồn tại');
        return;
      }
  
      let formattedPhoneNumber = phoneNumber.trim();
      if (formattedPhoneNumber.startsWith('0')) {
        formattedPhoneNumber = '+84' + formattedPhoneNumber.slice(1);
      } else if (!formattedPhoneNumber.startsWith('+')) {
        formattedPhoneNumber = '+' + formattedPhoneNumber;
      }
  
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-phone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumber: formattedPhoneNumber }),
      });
  
      if (response.ok) {
        setMessage('Xác thực thành công và đã cập nhật trạng thái!');
        Alert.alert('Thành công', 'Số điện thoại đã được xác thực!');
      } else {
        const serverError = await response.text();
        console.error('Lỗi từ server:', serverError);
        setMessage('Xác thực OTP thành công nhưng cập nhật trạng thái thất bại');
        Alert.alert('Lỗi', 'Cập nhật trạng thái thất bại');
      }
  
      await auth().signOut();
    } catch (error: any) {
      console.error('Lỗi khi xác thực OTP:', error);
      const errorMessage = error.message || 'Đã xảy ra lỗi';
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