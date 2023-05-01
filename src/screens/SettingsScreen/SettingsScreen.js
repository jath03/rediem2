import React, {useState} from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import styles from './styles';
import {storage, storageRef} from './../../firebase/config.js';
import {uploadString, uploadBytes, ref} from 'firebase/storage';
import {Buffer} from 'buffer';

import {v4} from 'uuid';
import * as Progress from 'react-native-progress';
//import storage from '@react-native-firebase/storage';

const ImagePicker = require('react-native-image-picker');

const Separator = () => <View style={styles.separator} />;

export default function SettingsScreen({navigation}) {
  const [profilePic, setProfilePic] = useState(null);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [transferred, setTransferred] = useState(0);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          onPress: () => {
            const user = firebase.auth().currentUser;
            user
              .delete()
              .then(() => {
                Alert.alert('User account deleted successfully.');
                navigation.navigate('Login');
              })
              .catch(error => {
                console.error(error);
              });
          },
        },
      ],
    );
  };
  const handleLogout = () => {
    Alert.alert(
      'Logout Account',
      'Are you sure you want to Logout  your account?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Logout', onPress: () => navigation.navigate('Login')},
      ],
    );
  };

  const handleChoosePhoto = () => {
    const options = {
      maxWidth: 2000,
      maxHeight: 2000,
      includeBase64: true,
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };
    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        const source = {uri: response.assets[0].uri};
        setImage(response.assets[0]);
        const {uri} = source;
        const filename = uri.substring(uri.lastIndexOf('/') + 1);
        const uploadUri =
          Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
        setUploading(true);
        setTransferred(0);
        const storageRef = ref(storage, filename);

        fetch(uri).then(response => {
          return response.blob().then(blob => {
            uploadBytes(storageRef, blob).then(snapshot => {
              setUploading(false);
              Alert.alert(
                'Photo uploaded!',
                'Your photo has been uploaded to Firebase Cloud Storage!',
              );
            });
          });
        });
        // var message = 'data:image/jpg;base64,' + response.assets[0].base64;
        // uploadString(storageRef, message, 'data_url', {
        //   contentType: 'image/jpeg',
        // }).then(snapshot => {
        //   setUploading(false);
        //   Alert.alert(
        //     'Photo uploaded!',
        //     'Your photo has been uploaded to Firebase Cloud Storage!',
        //   );
        // });

        // const task = storage.ref(filename).putFile(uploadUri);
        // // set progress state
        // task.on('state_changed', snapshot => {
        //   // setTransferred(
        //   //   Math.round(snapshot.bytesTransferred / snapshot.totalBytes) * 10000
        //   // );
        // });
      }
    });
  };

  // const handleChoosePhoto = () => {

  //   const options = {
  //     noData: true,
  //   };
  //   ImagePicker.launchImageLibrary(options, response => {
  //     debugger;
  //     if (response) {
  //       const imageRef = ref(
  //         storage,
  //         `images/${response.assets[0].fileName+ v4()}`,
  //       );
  //       //convert image to array of bytes
  //     const img =  fetch(response.assets[0].uri);
  //     const bytes =  img.blob();

  //       uploadBytes(imageRef, bytes).then(snapshot => {
  //         getDownloadURL(snapshot.ref).then(url => {
  //           setProfilePic(url);
  //           console.log(url);
  //         });
  //       });
  //     }
  //   });
  // };

  return (
    <View>
      <Text style={style.text}>My Profile</Text>

      <Image
        source={{
          uri:
            image == null
              ? 'https://www.pngfind.com/pngs/m/468-4686427_profile-demo-hd-png-download.png'
              : image.uri,
        }}
        style={{
          width: 400,
          height: 400,
          borderRadius: 60,
          height: 120,
          marginBottom: 10,
          width: 120,
          marginLeft: '35%',
        }}
      />

      {/* {uploading ? (
          <View style={styles.progressBarContainer}>
            <Progress.Bar progress={transferred} width={300} />
          </View>
        ) : ""} */}

      <Separator />

      <TouchableOpacity style={styles.button} onPress={handleChoosePhoto}>
        <Text style={styles.buttonTitle}>Change Profile Picture</Text>
      </TouchableOpacity>
      <Separator />

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          navigation.navigate('Reset Password');
        }}>
        <Text style={styles.buttonTitle}>Change Password</Text>
      </TouchableOpacity>
      <Separator />
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          navigation.navigate('Help Screen');
        }}>
        <Text style={styles.buttonTitle}>Help</Text>
      </TouchableOpacity>
      <Separator />
      <TouchableOpacity style={styles.button} onPress={handleDeleteAccount}>
        <Text style={styles.buttonTitle}>Delete Account</Text>
      </TouchableOpacity>
      <Separator />
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonTitle}>Log out</Text>
      </TouchableOpacity>
      <Separator />

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          navigation.navigate('Add Primary Care Physician');
        }}
      >
        <Text style={styles.buttonTitle}>Add Primary care physician</Text>
      </TouchableOpacity>
      <Separator />
    </View>
  );
}

const style = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    color: 'black',
  },
  text: {
    marginLeft: '42%',
    color: 'black',
    marginBottom: '5%',
    marginTop: '5%',
  },
});
