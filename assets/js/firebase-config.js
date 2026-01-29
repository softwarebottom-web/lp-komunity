// GANTI VERSI KE 10.13.1 (STABIL)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { 
    getAuth, 
    signInWithRedirect,   
    getRedirectResult,    
    OAuthProvider, // <--- KITA PAKAI INI UNTUK OIDC
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// KONFIGURASI KAMU (TETAP)
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

// --- SETUP KHUSUS OIDC (Sesuai Screenshot Anda) ---
// Provider ID diambil dari screenshot Anda: 'oidc.discord'
const discordProvider = new OAuthProvider('oidc.discord');
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
