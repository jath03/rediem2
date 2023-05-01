import React from 'react';
import {Image, Text, TouchableOpacity, View, StyleSheet,ScrollView, Button} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import styles from './styles';

const Separator = () => <View style={styles.separator} />;

export default function HelpScreen({navigation}) {
  return (
    // <View>
    //   <Text style={style.text}>Help Screen</Text>
    //   <Separator />
    //   <Text style={style.text}>Contact Us: +919001255255</Text>
      
    // </View>
    <ScrollView>
      <View style={style.container}>
       
        <Image
        source={{
          uri: 'https://uxwing.com/wp-content/themes/uxwing/download/communication-chat-call/help-message-icon.png',
        }}
        style={style.image}
      />
        <Text style={style.title}>Welcome to the Help Page</Text>
        <Text style={style.description}>If you need assistance, please contact our support team.</Text>
        <Text style={style.description}>+91 9001 555 555</Text>
        <Text style={style.description}>Happy to help You !!!</Text>
      </View>
    </ScrollView>
  );
}

const style = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    image: {
      width: 200,
      height: 200,
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    description: {
      fontSize: 16,
      marginBottom: 20,
    },
  });