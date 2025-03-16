import React from 'react';
import { View, Text, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../navigation/HomeStack';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { BottomTabParamList } from '../../navigation/BottomTabs';

type Props = {
  navigation: StackNavigationProp<HomeStackParamList, 'Home'>;
  
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const navigationMain = useNavigation<StackNavigationProp<BottomTabParamList>>();

  return (
    <ScrollView>
      <View style={styles.header}>  
      <View style={styles.headerLeft}>
      <Text style={[styles.text, {fontSize: 30, marginTop: 5} ]}>👋🏻Hi Thùy Trang</Text>
        </View>
        <View style={styles.headerRight} >
          <TouchableOpacity onPress={() => navigationMain.navigate('SettingStack', { screen: 'SettingScreen' })}>
        <Image 
        style={styles.imgProfile}
        source={require('../../assets/avatar.jpg')}
      />       </TouchableOpacity>
       </View>
        </View>
          <TouchableOpacity style = {styles.boxFeature} onPress={() => navigation.navigate('HealthProfile')}>
          <Text style={[styles.text, styles.boxTitle]}>Hồ sơ sức khỏe</Text>
          <Image 
        style={styles.boxImg}
        source={require('../../assets/pf.png')}
      />  
       </TouchableOpacity>
       
       <TouchableOpacity style = {styles.boxFeature} onPress={() => navigation.navigate('Medicine')}> 
          <Text style={[styles.text, styles.boxTitle]}>Thuốc</Text>
          <Image
        style={styles.boxImg}
        source={require('../../assets/medicine.png')}
      />  
       </TouchableOpacity>
       <TouchableOpacity style = {styles.boxFeature} onPress={() => navigation.navigate('Schedule')}> 
          <Text style={[styles.text, styles.boxTitle]}>Lịch</Text>
          <Image
        style={styles.boxImg}
        source={require('../../assets/lich.png')}
      />  
       </TouchableOpacity>
       <TouchableOpacity style = {styles.boxFeature} onPress={() => navigation.navigate('EatingDiary')}> 
          <Text style={[styles.text, styles.boxTitle]}>Nhật ký ăn uống</Text>
          <Image
        style={styles.boxImg}
        source={require('../../assets/food_diary.png')}
      />  
       </TouchableOpacity>
       <TouchableOpacity style = {styles.boxFeature} onPress={() => navigation.navigate('Nutrition')}> 
          <Text style={[styles.text, styles.boxTitle]}>Dinh dưỡng</Text>
          <Image
        style={styles.boxImg}
        source={require('../../assets/nutrition.png')}
      />  
       </TouchableOpacity>
       <TouchableOpacity style = {styles.boxFeature} onPress={() => navigation.navigate('MedicalHistory')}> 
          <Text style={[styles.text, styles.boxTitle]}>Lịch sử y tế</Text>
          <Image
        style={styles.boxImg}
        source={require('../../assets/medical_history.png')}
      />  
       </TouchableOpacity>
       <TouchableOpacity style = {[styles.boxFeature, {marginBottom: 10}]} onPress={() => navigation.navigate('EmergencyContact')}> 
          <Text style={[styles.text, styles.boxTitle]}>Liên hệ khẩn cấp</Text>
          <Image
        style={styles.boxImg}
        source={require('../../assets/warning.png')}
      />  
       </TouchableOpacity>
       
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between'
  },
  text: {
    fontSize: 25,
    fontFamily: 'Roboto',
    color: '#432c81',
    fontWeight: 'bold',
  
  },
  headerLeft: {
    marginLeft: 10,
    marginTop: 5,
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
  boxFeature: {
    flexDirection: 'row',
    width: 'auto',
    height: 140,
    backgroundColor: '#e0dee7',
    marginHorizontal: 10,
    borderRadius: 10,
    marginTop: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boxTitle: {
    marginLeft: 25,
  },
  boxImg: {
      width: 120,
      height: 120,
      marginRight: 30,
  }
});
export default HomeScreen;
