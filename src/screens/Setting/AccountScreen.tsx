import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { BottomTabParamList } from '../../navigation/BottomTabs';

const user = {
  name: "Nguyễn Văn A",
  email: "nguyenvana@example.com",
  phone: "0123456789",
  gender: "Nam",
  birth: "1995-06-15",
  address: "123 Đường ABC, Quận 1, TP.HCM",
};

type Props = {
  navigation: NavigationProp<any>;
};

const AccountScreen: React.FC<Props> = ({ navigation }) => {
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
  const [formData, setFormData] = useState(user);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const handleSave = () => {
    console.log('Thông tin đã được lưu:', formData);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesome
            name="chevron-left"
            size={20}
            color="#432c81"
            onPress={() => navigationMain.navigate('SettingStack', { screen: 'Settings' })}
          />
          <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
        </View>
      
      </View>

<View style={styles.avatar}>
       <View style={styles.boxImage}> 
        <Image
                style={styles.imgProfile}
                source={require('../../assets/avatar.jpg')}
              />  
              <Image
                style={styles.editImage}
                source={require('../../assets/edit.png')}
              /> 
       </View>


       </View>


      {/* Form Container */}
      <View style={styles.formContainer}>
        {Object.keys(user).map((key) => (
          <View key={key} style={styles.inputRow}>
            <Text style={styles.label}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
            <TextInput
              style={styles.input}
              value={formData[key as keyof typeof formData]}
              onChangeText={(value) => handleInputChange(key, value)}
            />
          </View>
        ))}
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.buttonText}>Lưu</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Roboto',
    color: '#432c81',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  headerRight: {
    backgroundColor: '#e0dee7',
    borderRadius: 25,
    padding: 5,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  inputRow: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    fontSize: 16,
    color: '#555',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#4D2D7D',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },boxImage: {
    
    position: 'relative',
    padding: 10,
    marginRight: 15,
    backgroundColor: '#e0dee7',
    borderRadius: 75,
    width: 140,
    height: 140,

  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImage: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: '#432c81',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgProfile: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
});

export default AccountScreen;