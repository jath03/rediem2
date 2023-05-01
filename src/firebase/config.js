// Import the functions you need from the SDKs you need
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
// Import the functions you need from the SDKs you need
import {initializeApp} from 'firebase/app';
import {getAnalytics} from 'firebase/analytics';
import {getAuth} from 'firebase/auth';
import {initializeFirestore} from 'firebase/firestore';
import {getStorage ,ref } from 'firebase/storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAjwAHoVWe-jYj_rzct57eUoVVc1uLYXNI',
  authDomain: 'rediem-2.firebaseapp.com',
  projectId: 'rediem-2',
  storageBucket: 'rediem-2.appspot.com',
  messagingSenderId: '279480449522',
  appId: '1:279480449522:web:082a9cbe2d15094365536b',
  measurementId: 'G-J167H8B7Z4',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const storage = getStorage(app);

export {firebase, db, storage };
