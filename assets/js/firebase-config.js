// --- KITA GANTI VERSI JADI 10.13.0 AGAR LEBIH STABIL ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
    getAuth, 
    signInWithRedirect,   
    getRedirectResult,    
    DiscordAuthProvider, // Ini yang tadi error, di versi 10.13.0 harusnya aman
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    arrayUnion 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// KONFIGURASI KAMU (TIDAK BERUBAH)
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
discordProvider.addScope('identify');
discordProvider.addScope('email');

// Export
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
