// Import Firebase SDK via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithRedirect,   // <--- PENTING BUAT HP
    getRedirectResult,    // <--- PENTING BUAT NANGKAP HASIL LOGIN
    DiscordAuthProvider, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    arrayUnion 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// KONFIGURASI KAMU
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
const discordProvider = new DiscordAuthProvider();

// Tambahkan Scopes (Opsional, biar data lengkap)
discordProvider.addScope('identify');
discordProvider.addScope('email');

// Export semua yang dibutuhkan
export { 
    auth, 
    db, 
    discordProvider, 
    signInWithRedirect, 
    getRedirectResult, 
    signOut, 
    onAuthStateChanged, 
    doc, 
    getDoc, 
    setDoc 
};
