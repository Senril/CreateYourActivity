import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBQmSJN6ZolDPj4KQmDf15PW_1ru-UrCCY",
  authDomain: "createyouractivity.firebaseapp.com",
  projectId: "createyouractivity",
  storageBucket: "createyouractivity.firebasestorage.app",
  messagingSenderId: "147987423174",
  appId: "1:147987423174:web:2f4f0fd15afbb243311cc7",
  measurementId: "G-8XVGM7LEFW"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Экспорт нужных сервисов
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();