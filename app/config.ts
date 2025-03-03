// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAOPKQANtySno7zfBdqn2w8SxtESVJMC9g",
    authDomain: "homecooks-c24cf.firebaseapp.com",
    projectId: "homecooks-c24cf",
    storageBucket: "homecooks-c24cf.firebasestorage.app",
    messagingSenderId: "153506454064",
    appId: "1:153506454064:web:d122632498bdc9d8ceebf5",
    measurementId: "G-N2ZEGMZ10K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);