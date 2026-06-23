
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyANUdkKuYHcs_4eS2EmR9ZD9YtW7-M3JwM',
  authDomain: 'mk-clients.firebaseapp.com',
  projectId: 'mk-clients',
  storageBucket: 'mk-clients.firebasestorage.app',
  messagingSenderId: '1060309066308',
  appId: '1:1060309066308:web:9438b3bc6162025f801211',
  measurementId: 'G-5SBLC4LDQC'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
