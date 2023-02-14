import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { LoginScreen, HomeScreen, RegistrationScreen, SettingsScreen, RecordDataScreen, ConnectDeviceScreen, ViewExportDataScreen} from './src/screens'
import {decode, encode} from 'base-64'
import { firebase } from './src/firebase/config'
if (!global.btoa) {  global.btoa = encode }
if (!global.atob) { global.atob = decode }

const Stack = createStackNavigator();

export default function App() {

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  
  useEffect(() => {
    const usersRef = firebase.firestore().collection('users');
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        usersRef
          .doc(user.uid)
          .get()
          .then((document) => {
            const userData = document.data()
            setUser(userData)
            setLoading(false)
          })
          .catch((error) => {
            setLoading(false)
          });
      } else {
        setLoading(false)
      }
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
      { user ? (
        <>
          <Stack.Screen name="Home">
            {props => <HomeScreen {...props} extraData={user} />}
          </Stack.Screen>
          <Stack.Screen name="Settings">
            {props => <SettingsScreen {...props} extraData={user} />}
          </Stack.Screen>
          <Stack.Screen name="Record Data">
            {props => <RecordDataScreen {...props} extraData={user} />}
          </Stack.Screen>
          <Stack.Screen name="Connect Your Device">
            {props => <ConnectDeviceScreen {...props} extraData={user} />}
          </Stack.Screen>
          <Stack.Screen name="Stored Data">
            {props => <ViewExportDataScreen {...props} extraData={user} />}
          </Stack.Screen>
        </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Record Data" component={RecordDataScreen} />
            <Stack.Screen name="Connect Your Device" component={ConnectDeviceScreen} />
            <Stack.Screen name="Stored Data" component={ViewExportDataScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}