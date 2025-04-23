import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { View, Text, Button, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { BottomTabParamList } from '../../../navigation/BottomTabs';

type Props = {
  navigation: NavigationProp<any>;
};
const MedicineHistoryScreen: React.FC<Props> = ({ navigation }) => {
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
          <Text style={[styles.text, { fontSize: 30, marginTop: 5 }]}>Danh sách đơn thuốc</Text>
        </View>
        {/* <View style={styles.headerRight}>
           <TouchableOpacity onPress={() => navigationMain.navigate('SettingStack', { screen: 'Account' })}>
             <Image
               style={styles.imgProfile}
               source={require('../../assets/avatar.jpg')}
             />
           </TouchableOpacity>
         </View> */}
      </View>
      <TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('Medicine')}>
        <Text style={[styles.text, styles.boxTitle]}>Today</Text>
        <Text style={styles.note}>Trạng thái: Missing</Text>
        <Text style={styles.note}>Note: Quên uống</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('Medicine')}>
        <Text style={[styles.text, styles.boxTitle]}>Today</Text>
        <Text style={styles.note}>Trạng thái: Missing</Text>
        <Text style={styles.note}>Note: Quên uống</Text>


      </TouchableOpacity><TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('Medicine')}>
        <Text style={[styles.text, styles.boxTitle]}>Today</Text>
        <Text style={styles.note}>Trạng thái: Missing</Text>
        <Text style={styles.note}>Note: Quên uống</Text>


      </TouchableOpacity><TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('Medicine')}>
        <Text style={[styles.text, styles.boxTitle]}>Today</Text>
        <Text style={styles.note}>Trạng thái: Missing</Text>
        <Text style={styles.note}>Note: Quên uống</Text>


      </TouchableOpacity><TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('Medicine')}>
        <Text style={[styles.text, styles.boxTitle]}>Today</Text>
        <Text style={styles.note}>Trạng thái: Missing</Text>
        <Text style={styles.note}>Note: Quên uống</Text>


      </TouchableOpacity><TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('Medicine')}>
        <Text style={[styles.text, styles.boxTitle]}>Today</Text>
        <Text style={styles.note}>Trạng thái: Missing</Text>
        <Text style={styles.note}>Note: Quên uống</Text>


      </TouchableOpacity><TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('Medicine')}>
        <Text style={[styles.text, styles.boxTitle]}>Today</Text>
        <Text style={styles.note}>Trạng thái: Missing</Text>
        <Text style={styles.note}>Note: Quên uống</Text>


      </TouchableOpacity><TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('Medicine')}>
        <Text style={[styles.text, styles.boxTitle]}>Today</Text>
        <Text style={styles.note}>Trạng thái: Missing</Text>
        <Text style={styles.note}>Note: Quên uống</Text>


      </TouchableOpacity><TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('Medicine')}>
        <Text style={[styles.text, styles.boxTitle]}>Today</Text>
        <Text style={styles.note}>Trạng thái: Missing</Text>
        <Text style={styles.note}>Note: Quên uống</Text>


      </TouchableOpacity><TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('Medicine')}>
        <Text style={[styles.text, styles.boxTitle]}>Today</Text>
        <Text style={styles.note}>Trạng thái: Missing</Text>
        <Text style={styles.note}>Note: Quên uống</Text>


      </TouchableOpacity><TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('Medicine')}>
        <Text style={[styles.text, styles.boxTitle]}>Today</Text>
        <Text style={styles.note}>Trạng thái: Missing</Text>
        <Text style={styles.note}>Note: Quên uống</Text>


      </TouchableOpacity>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
    marginBottom: 20,
    
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
  boxFeature: {
    flexDirection: 'column',
    width: 'auto',
    height: 100,
    backgroundColor: '#e0dee7',
    marginHorizontal: 10,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'flex-start',
    // alignItems: 'center',
  },
  boxTitle: {
    marginLeft: 10,
    fontSize: 23,
  },
  note: {
    marginLeft: 10,
    fontSize: 17,
    color: '#432c81',
  },

  boxImg: {
    width: 80,
    height: 80,
    marginRight: 30,
  }
})
export default MedicineHistoryScreen;
