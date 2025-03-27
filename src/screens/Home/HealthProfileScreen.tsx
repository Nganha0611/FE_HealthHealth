import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { BottomTabParamList } from '../../navigation/BottomTabs';
// import SamsungHealth from 'react-native-samsung-health';

type Props = {

  navigation: NavigationProp<any>;
};
//   type SamsungHealthResponse = {
//     startDate: string;
//     endDate: string;
//     value: number;
//   };
const HealthProfileScreen: React.FC<Props> = ({ navigation }) => {
  //   const [stepData, setStepData] = useState<any[]>([]);

  //   useEffect(() => {
  //     SamsungHealth.authorize([SamsungHealth.STEP_COUNT], (err: any, res: boolean) => {
  //       if (res) {
  //         console.log('✅ Đã cấp quyền Samsung Health!');

  //         // Gọi dữ liệu bước chân sau khi cấp quyền
  //         let options = {
  //           startDate: new Date(new Date().setDate(new Date().getDate() - 7)), // 7 ngày trước
  //           endDate: new Date(),
  //         };

  //         SamsungHealth.getDailyStepCountSamples(options, (err: any, result: SamsungHealthResponse[]) => {
  //           if (err) {
  //             console.error('Lỗi khi lấy dữ liệu bước chân:', err);
  //           } else {
  //             console.log('📊 Dữ liệu bước chân:', result);
  //             setStepData(result); // Cập nhật state để hiển thị trên UI
  //           }
  //         });
  //       } else {
  //         console.log('❌ Lỗi khi yêu cầu quyền:', err);
  //       }
  //     });
  //   }, []);

  const steps = 8114;
  const minutes = 60;
  const calories = 384;
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
              <Image style={[styles.icon, { width: 23, height: 23, marginLeft: 3, marginRight: 8 }]} source={require('../../assets/time.png')} />
              <Text style={[styles.number, { color: '#1E90FF' }]}>{minutes} phút</Text>
            </View>
          </View>
          <View style={styles.textContainer}>
            <View style={styles.row}>
              <Image style={[styles.icon, { width: 23, height: 23, marginLeft: 3, marginRight: 8 }]} source={require('../../assets/calo.png')} />
              <Text style={[styles.number, { color: '#de46a0' }]}>{calories} {"kcal"}</Text> 
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
              stroke="#1E90FF" strokeWidth="9"
              fill="none"
              strokeDasharray="282.6"
              strokeDashoffset="90"
              strokeLinecap="round"
            />

            <Circle
              cx="60" cy="60" r="35"
              stroke="#de46a0" strokeWidth="9"
              fill="none"
              strokeDasharray="219.2"
              strokeDashoffset="78"
              strokeLinecap="round"
            />
          </Svg>
        </View>



      </View>
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
    borderRadius: 10,
    marginTop: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  row: {
    flexDirection: 'row',  // Hiển thị nội dung trên một hàng ngang
    alignItems: 'center',  // Căn giữa hình ảnh với chữ
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
    // fontFamily: 'Roboto',
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
})
export default HealthProfileScreen;
