import { NavigationProp } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Colors } from 'react-native/Libraries/NewAppScreen';
// import SamsungHealth from 'react-native-samsung-health';

type Props = {
    
    navigation: NavigationProp<any>;
  };
//   type SamsungHealthResponse = {
//     startDate: string;
//     endDate: string;
//     value: number;
//   };
const HealthProfileScreen : React.FC<Props> = ({ navigation }) => {
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

const steps = 6114;
const minutes = 60;
const calories = 384
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
          <Text style={[styles.text, {fontSize: 30, marginTop: 5} ]}>Hồ sơ sức khỏe</Text>
            </View>
            <View style={styles.headerRight}>
            <Image
            style={styles.imgProfile}
            source={require('../../assets/avatar.jpg')}
          />       
           </View>
            </View>
            <View style={styles.mainIf}>

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
  },
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
