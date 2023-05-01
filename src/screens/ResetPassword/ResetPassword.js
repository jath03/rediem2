import React, {useState} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Button,
  StyleSheet,
  Alert,
} from 'react-native';
import styles from './styles';
import { db, firebase } from './../../firebase/config.js'
export default function ResetPassword(props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // const [currentPassword, setCurrentPassword] = useState('');
  

  const handleResetPassword = () => {
    if (password == '' || confirmPassword == '') {
      Alert.alert('Please Enter Password');
    } else if (password != confirmPassword) {
      console.log('password changed');
      Alert.alert('Please Enter Same Password');
    } else {
      // Update the user's password
      const user = firebase.auth().currentUser;
      user
        .updatePassword(password)
        .then(() => {
          Alert.alert('password changed');
          setPassword('');
      setConfirmPassword('');
          console.log('Password updated successfully');
        })
        .catch(error => {
          console.log(error.message);
        });
      
      
      
      // setCurrentPassword('');
    }
  };

  return (
    <View style={style.container}>
      {/* <Text style={style.title}>Current Password:</Text>
      <TextInput
        style={style.description}
        onChangeText={text => setCurrentPassword(text)}
        value={currentPassword}
        placeholder="Current Password"
      /> */}
      <Text style={style.title}>New Password:</Text>
      <TextInput
        style={style.description}
        placeholder="New Password"
        onChangeText={text => setPassword(text)}
        value={password}
      />
      <Text style={style.title}>Confirm New Password:</Text>
      <TextInput
        style={style.description}
        placeholder="Confirm Password"
        onChangeText={text => setConfirmPassword(text)}
        value={confirmPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonTitle}>Reset Password</Text>
      </TouchableOpacity>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
    padding: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'black',
  },
  description: {
    fontSize: 16,
    borderColor: 'gray', borderWidth: 1,
    marginBottom: 10,
  },
});