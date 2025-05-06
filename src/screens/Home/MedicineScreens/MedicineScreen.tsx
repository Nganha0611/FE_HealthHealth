import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { BottomTabParamList } from '../../../navigation/BottomTabs';
import { useTranslation } from 'react-i18next';

type Props = {
  navigation: NavigationProp<any>;
};

const MedicineScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
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
          <Text style={[styles.text, { fontSize: 30, marginTop: 5 }]}>{t('medicine')}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('MedicineManager')}>
        <Text style={[styles.text, styles.boxTitle]}>{t('medicineManager')}</Text>
        <Image style={styles.boxImg} source={require('../../../assets/medicine.png')} />
      </TouchableOpacity>
      {/* <TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('Prescription')}>
        <Text style={[styles.text, styles.boxTitle]}>{t('prescriptionList')}</Text>
        <Image style={styles.boxImg} source={require('../../../assets/prescription.png')} />
      </TouchableOpacity> */}
      <TouchableOpacity style={styles.boxFeature} onPress={() => navigation.navigate('MedicineHistory')}>
        <Text style={[styles.text, styles.boxTitle]}>{t('medicineHistory')}</Text>
        <Image style={styles.boxImg} source={require('../../../assets/history.png')} />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
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
    borderRadius: 30,
  },
  boxFeature: {
    flexDirection: 'row',
    width: 'auto',
    height: 100,
    backgroundColor: '#e0dee7',
    marginHorizontal: 10,
    borderRadius: 10,
    marginTop: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boxTitle: {
    marginLeft: 10,
    fontSize: 23,
  },
  boxImg: {
    width: 80,
    height: 80,
    marginRight: 30,
  },
});

export default MedicineScreen;