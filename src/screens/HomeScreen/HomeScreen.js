import React, { useEffect, useState } from 'react'
import { FlatList, Keyboard, Text, TextInput, TouchableOpacity, View, Image } from 'react-native'
import styles from './styles';
import { firebase } from '../../firebase/config'

export default function HomeScreen({navigation}) {

    const onSettingsLinkPress = () => {
        navigation.navigate('Settings')
    }

    const onRecordDataLinkPress = () => {
        navigation.navigate('Record Data')
    }

    const onConnectDeviceLinkPress = () => {
        navigation.navigate('Connect Your Device')
    }

    const Separator = () => <View style={styles.separator} />;

    return (
        <View style={styles.container}>
        <Separator />
        <Text style={styles.title}>Welcome back, User</Text>
        <Separator />
        <Image source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/1200px-Default_pfp.svg.png'}}
        style={
            {
            width: 400, 
            height: 400, 
            borderRadius: 60,
            height: 120,
            marginBottom: 10,
            width: 120
            }} />

        <Separator />







         <TouchableOpacity style={styles.button} onPress={() => onRecordDataLinkPress()}>
                    <Text style={styles.buttonText}>Record Data</Text>
         </TouchableOpacity>
         <Separator />
         <TouchableOpacity style={styles.button} onPress={() => onConnectDeviceLinkPress()}>
                    <Text style={styles.buttonText}>Connect your Device</Text>
         </TouchableOpacity>
         <Separator />
         <TouchableOpacity style={styles.buttonSettings} onPress={() => onSettingsLinkPress()}>
                    <Text style={styles.buttonText}>Settings</Text>
         </TouchableOpacity>

       
        </View>

        
    )
}