import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDHwLTQ-E7NAh_AFwgLEOb_vmk2wwqYhmI",
    authDomain: "pickle-stats.firebaseapp.com",
    projectId: "pickle-stats",
    storageBucket: "pickle-stats.appspot.com",
    messagingSenderId: "669279375370",
    appId: "1:669279375370:web:41a0fc3dc717de293fcff3",
    measurementId: "G-FSNZ57NFRW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app };