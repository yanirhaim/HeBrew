import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAXL_ah-CuT0H7bn_Rm5Gg9BijnJEBEtdA",
  authDomain: "he-brew.firebaseapp.com",
  projectId: "he-brew",
  storageBucket: "he-brew.firebasestorage.app",
  messagingSenderId: "663967305396",
  appId: "1:663967305396:web:b79af1e59dac72bcdf51e1"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };
