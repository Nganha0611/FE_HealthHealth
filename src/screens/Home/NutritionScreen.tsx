import { NavigationProp } from '@react-navigation/native';
import React from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

type Props = {
    
    navigation: NavigationProp<any>;
  };
  const NutritionScreen : React.FC<Props> = ({ navigation }) => {
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
            <Text style={[styles.text, {fontSize: 30, marginTop: 5} ]}>Dinh dưỡng</Text>
              </View>
              <View style={styles.headerRight}>
              <Image
              style={styles.imgProfile}
              source={require('../../assets/avatar.jpg')}
            />       
             </View>
              </View>
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
export default NutritionScreen ;
