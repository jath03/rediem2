import React, { useState } from 'react'
import { Alert, Image, Text, TextInput, TouchableOpacity,Switch, View,StyleSheet } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './styles';
//import { firebase } from 'C:/Users/blake/OneDrive/Desktop/rediem2/src/firebase/config.js'
import { db, firebase } from './../../firebase/config.js'
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore";

import { useNetInfo } from "@react-native-community/netinfo";

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => {
    setIsEnabled(previousState => !previousState);
    isEnabled ? async () => {
                try {
                  await AsyncStorage.setItem('email', email,);
                  await AsyncStorage.setItem('password', password,);
                } catch (error) {
                  alert("error")
                }
                } : "";
  }

    const onFooterLinkPress = () => {
        navigation.navigate('Registration')
    }

    const onLoginPress = () => {
        firebase
            .auth()
            .signInWithEmailAndPassword(email, password)
            .then((response) => {
               
                const userid = response.user.uid;
                const path = doc(db, "users", userid);
                getDoc(path)
                    .then((firestoreDocument) => {
                        if (!firestoreDocument.exists) {
                            alert("User does not exist anymore.")
                            return;
                        }
                        const user = firestoreDocument.data()
                        navigation.navigate('Home', { user: user })
                        if(!isEnabled){
                        setEmail('');
                        setPassword('')}
                    })
                    .catch((err) => {
                        alert(err)
                    });

                // const uid = response.user.uid
                // const usersRef = firebase.firestore().collection('users')
                // usersRef
                //     .doc(uid)
                //     .get()
                //     .then(firestoreDocument => {
                //         if (!firestoreDocument.exists) {
                //             alert("User does not exist anymore.")
                //             return;
                //         }
                //         const user = firestoreDocument.data()
                //         navigation.navigate('Home', { user: user })
                //     })
                //     .catch(error => {
                //         debugger
                //         alert(error)
                //     });
            })
            .catch(error => {
                alert(error)
            })
    }

    return (
        <View style={styles.container}>
            <KeyboardAwareScrollView
                style={{ flex: 1, width: '100%' }}
                keyboardShouldPersistTaps="always">
                <Image
                    style={styles.logo}
                    source={require('./REDIEMLOGO.png')}
                />
                <TextInput
                    style={styles.input}
                    placeholder='E-mail'
                    placeholderTextColor="#aaaaaa"
                    onChangeText={(text) => setEmail(text)}
                    value={email}
                    underlineColorAndroid="transparent"
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholderTextColor="#aaaaaa"
                    secureTextEntry
                    placeholder='Password'
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    underlineColorAndroid="transparent"
                    autoCapitalize="none"
                />

     <View style={style.container}>
        <Text > Remember me</Text>
        <Switch
            trackColor={{false: '#767577', true: '#81b0ff'}}
            thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => onLoginPress()}>
                    <Text style={styles.buttonTitle}>Log in</Text>
                </TouchableOpacity>
                <View style={styles.footerView}>
                    <Text style={styles.footerText}>Don't have an account? <Text onPress={onFooterLinkPress} style={styles.footerLink}>Sign up</Text></Text>
                </View>
            </KeyboardAwareScrollView>
        </View>
    )
}

const style = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });