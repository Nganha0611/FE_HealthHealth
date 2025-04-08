import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { BottomTabParamList } from '../../navigation/BottomTabs';
import { Alert, TextInput, Modal, Pressable } from 'react-native';

type Props = {
  navigation: NavigationProp<any>;
};

const HealthProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [typeSelectModalVisible, setTypeSelectModalVisible] = useState(false);
  const [sysValue, setSysValue] = useState('');
  const [diaValue, setDiaValue] = useState('');

  const handleMeasurePress = () => {
    setTypeSelectModalVisible(true);
  };

  const steps = 8114;
  const heart_rate = 75;
  const blood_pressure = "120/80"
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();
    
  return (
    <ScrollView>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesome
            name="chevron-left"
            size={20}
            color="#432c81"
            style={{ marginRight: 15, marginTop: 17 }}
            onPress={() => navigation.goBack()}
          />
          <Text style={[styles.text1, { fontSize: 30, marginTop: 5 }]}>Hồ sơ sức khỏe</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigationMain.navigate('SettingStack', { screen: 'Account' })}>
            <Image 
              style={styles.imgProfile}
              source={require('../../assets/avatar.jpg')}
            />    
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity style={styles.measureContainer} onPress={handleMeasurePress}>
        <View style={styles.measureContent}>
          <FontAwesome name="stethoscope" size={26} color="#432c81" style={styles.measureIcon} />
          <View>
            <Text style={styles.measureTitle}>ĐO CHỈ SỐ</Text>
            <Text style={styles.measureSubtitle}>Nhấn để đo chỉ số sức khỏe</Text>
          </View>
        </View>
        <FontAwesome name="chevron-right" size={22} color="#432c81" />
      </TouchableOpacity>
      
      <View style={styles.mainIf}>
        <View style={styles.infoContainer}>
          <View style={styles.textContainer}>
            <View style={styles.row}>
              <Image style={styles.icon} source={require('../../assets/step.png')} />
              <Text style={[styles.number, { color: '#3CB371' }]}>{steps.toLocaleString()} bước</Text>
            </View>
          </View>
          <View style={styles.textContainer}>
            <View style={styles.row}>
              <Image style={[styles.icon, { width: 23, height: 23, marginLeft: 3, marginRight: 8 }]} source={require('../../assets/heart_rate.png')} />
              <Text style={[styles.number, { color: '#ed1b24' }]}>{heart_rate} lần/phút</Text>
            </View>
          </View>
          <View style={styles.textContainer}>
            <View style={styles.row}>
              <Image style={[styles.icon, { width: 23, height: 23, marginLeft: 3, marginRight: 8 }]} source={require('../../assets/blood_pressure.png')} />
              <Text style={[styles.number, { color: '#2577f7' }]}>{blood_pressure} {"mmHg"}</Text> 
            </View>
          </View>
        </View>
        
        <View style={styles.circleContainer}>
          <Svg width={120} height={120} viewBox="0 0 120 120">
            <Circle
              cx="60" cy="60" r="55"
              stroke="#3CB371" strokeWidth="9"
              fill="none"
              strokeDasharray="345.6"
              strokeDashoffset="80"
              strokeLinecap="round"
            />
            <Circle
              cx="60" cy="60" r="45"
              stroke="#ed1b24" strokeWidth="9"
              fill="none"
              strokeDasharray="282.6"
              strokeDashoffset="90"
              strokeLinecap="round"
            />
            <Circle
              cx="60" cy="60" r="35"
              stroke="#2577f7" strokeWidth="9"
              fill="none"
              strokeDasharray="219.2"
              strokeDashoffset="78"
              strokeLinecap="round"
            />
          </Svg>
        </View>
      </View>
      <TouchableOpacity style={styles.measureContainer} onPress={handleMeasurePress}>
        <View style={styles.measureContent}>
          <FontAwesome name="stethoscope" size={26} color="#432c81" style={styles.measureIcon} />
          <View>
            <Text style={styles.measureTitle}>ĐO CHỈ SỐ</Text>
            <Text style={styles.measureSubtitle}>Nhấn để đo chỉ số sức khỏe</Text>
          </View>
        </View>
        <FontAwesome name="chevron-right" size={22} color="#432c81" />
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={typeSelectModalVisible}
        onRequestClose={() => setTypeSelectModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.enhancedModalContainer}>
            <Text style={styles.enhancedModalTitle}>Bạn muốn đo gì?</Text>
            
            <Pressable
              style={[styles.enhancedButton, { backgroundColor: '#2577f7', marginBottom: 20 }]}
              onPress={() => {
                setSelectedMeasurement("blood_pressure");
                setTypeSelectModalVisible(false);
                setModalVisible(true);
              }}
            >
              {/* Fixed blood pressure icon */}
              <FontAwesome name="heart" size={28} color="white" style={{marginRight: 10}} />
              <Text style={styles.enhancedButtonText}>Đo huyết áp</Text>
            </Pressable>
            
            <Pressable
              style={[styles.enhancedButton, { backgroundColor: '#ed1b24' }]}
              onPress={() => {
                setSelectedMeasurement("heart_rate");
                setTypeSelectModalVisible(false);
                setModalVisible(true);
              }}
            >
              <FontAwesome name="heartbeat" size={28} color="white" style={{marginRight: 10}} />
              <Text style={styles.enhancedButtonText}>Đo nhịp tim</Text>
            </Pressable>
            
            <Pressable
              style={styles.closeButton}
              onPress={() => setTypeSelectModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Input Modal - Enhanced for elderly users */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.enhancedModalContainer}>
            <Text style={styles.enhancedModalTitle}>
              {selectedMeasurement === "blood_pressure" 
                ? "Nhập chỉ số huyết áp của bạn" 
                : "Nhập nhịp tim của bạn"}
            </Text>
            
            {selectedMeasurement === "blood_pressure" ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tâm thu (SYS):</Text>
                  <TextInput
                    style={styles.enhancedInput}
                    keyboardType="numeric"
                    placeholder="Ví dụ: 120"
                    value={sysValue}
                    onChangeText={setSysValue}
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.inputUnit}>mmHg</Text>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tâm trương (DIA):</Text>
                  <TextInput
                    style={styles.enhancedInput}
                    keyboardType="numeric"
                    placeholder="Ví dụ: 80"
                    value={diaValue}
                    onChangeText={setDiaValue}
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.inputUnit}>mmHg</Text>
                </View>
              </>
            ) : (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nhịp tim:</Text>
                <TextInput
                  style={styles.enhancedInput}
                  keyboardType="numeric"
                  placeholder="Ví dụ: 75"
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholderTextColor="#999"
                />
                <Text style={styles.inputUnit}>lần/phút</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: '#ccc' }]}
                onPress={() => {
                  setModalVisible(false);
                  setInputValue('');
                  setSysValue('');
                  setDiaValue('');
                }}
              >
                <Text style={styles.actionButtonText}>Hủy</Text>
              </Pressable>
              
              <Pressable
                style={[styles.actionButton, { backgroundColor: '#3CB371' }]}
                onPress={() => {
                  if (selectedMeasurement === 'blood_pressure') {
                    console.log("✅ Huyết áp:", sysValue + "/" + diaValue + " mmHg");
                  } else {
                    console.log("✅ Nhịp tim:", inputValue + " lần/phút");
                  }

                  setModalVisible(false);
                  setInputValue('');
                  setSysValue('');
                  setDiaValue('');
                }}
              >
                <Text style={styles.actionButtonText}>Lưu</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainIf: {
    flexDirection: 'row',
    width: 'auto',
    height: 140,
    backgroundColor: '#e0dee7',
    marginHorizontal: 10,
    borderRadius: 20,
    marginTop: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    // shadowColor: "#000",
    // shadowOpacity: 0.1,
    // shadowRadius: 5,
    // elevation: 10,
  },
  // New measurement container that matches the metrics container
  measureContainer: {
    flexDirection: 'row',
    width: 'auto',
    height: 80,
    backgroundColor: '#e0dee7',
    marginHorizontal: 10,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
    // shadowColor: "#000",
    // shadowOpacity: 0.1,
    // shadowRadius: 5,
    // elevation: 10,
  },
  measureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  measureIcon: {
    marginRight: 15,
  },
  measureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#432c81',
  },
  measureSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 29,
    height: 29,
    marginRight: 5,
  },
  infoContainer: {
    flex: 1,
  },
  textContainer: {
    marginBottom: 5,
  },
  number: {
    fontWeight: "bold",
    fontSize: 25,
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between'
  },
  text1: {
    fontSize: 25,
    color: '#432c81',
    fontWeight: 'bold',
  },
  headerLeft: {
    marginLeft: 10,
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  headerRight: {
    marginRight: 15,
    backgroundColor: '#e0dee7',
    borderRadius: 30,
    padding: 7,
  },
  imgProfile: {
    width: 45,
    height: 45,
    borderRadius: 30
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  enhancedModalContainer: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  enhancedModalTitle: {
    fontSize: 26,
    marginBottom: 25,
    color: '#432c81',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  enhancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
  },
  enhancedButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
  },
  closeButton: {
    backgroundColor: '#888',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  enhancedInput: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 10,
    width: '100%',
    padding: 15,
    fontSize: 22,
    backgroundColor: '#f9f9f9',
  },
  inputUnit: {
    position: 'absolute',
    right: 15,
    top: 60,
    fontSize: 18,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
});

export default HealthProfileScreen;