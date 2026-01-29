// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, DiscordAuthProvider, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// KONFIGURASI ASLI DARI ZANE
const firebaseConfig = {
  apiKey: "AIzaSyDLX4gTNGw_IQSdhXtSBl3utqCKFiwR2Hk",
  authDomain: "lpzone.firebaseapp.com",
  databaseURL: "https://lpzone-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lpzone",
  storageBucket: "lpzone.firebasestorage.app",
  messagingSenderId: "709883143619",
  appId: "1:709883143619:web:eab5fde631abdf7b548976",
  measurementId: "G-GLR30SRDEL"
};

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Provider Setup
const discordProvider = new DiscordAuthProvider();
const googleProvider = new GoogleAuthProvider();

// Export agar bisa dipakai di main.js
export { auth, db, discordProvider, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, getDoc, setDoc };
