import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, OAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// --- CONFIG BARU (LPZONE) ---
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 1. FUNGSI AUTHENTICATION
// ==========================================

const handleDiscordLogin = async () => {
    // Pastikan di Firebase Console > Auth > Sign-in method
    // Lu udah Add Provider > OpenID Connect > kasih nama "discord"
    const provider = new OAuthProvider('oidc.discord'); 
    
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Simpan Data User ke Firestore
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
            await setDoc(userRef, {
                name: user.displayName,
                email: user.email,
                role: "MEMBER",
                status: "ACTIVE",
                photo: user.photoURL,
                uid: user.uid,
                createdAt: serverTimestamp()
            });
        }
        
        window.location.href = "/"; 
    } catch (e) {
        alert("Gagal Login Discord: " + e.message);
        console.error(e);
    }
};

const handleEmailLogin = async (e) => {
    e.preventDefault(); 
    const email = document.getElementById('email-input').value;
    const pass = document.getElementById('password-input').value;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        window.location.href = "/";
    } catch (error) {
        alert("Login Gagal: " + error.message);
    }
};

const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/auth/portal";
};

// ==========================================
// 2. EVENT LISTENER (PENYADAP TOMBOL)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const btnDiscord = document.getElementById('btn-login-discord');
    if (btnDiscord) btnDiscord.addEventListener('click', handleDiscordLogin);

    const formLogin = document.getElementById('login-form');
    if (formLogin) formLogin.addEventListener('submit', handleEmailLogin);
});

// ==========================================
// 3. NAVIGASI & PROTEKSI HALAMAN
// ==========================================
const navContainer = document.getElementById('dynamic-nav');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        
        if (snap.exists()) {
            const data = snap.data();

            if (data.status === "BANNED") {
                alert("AKUN ANDA DIBEKUKAN!");
                await signOut(auth);
                window.location.href = "/auth/portal";
                return;
            }

            if (navContainer) {
                let links = `
                    <a href="/">Home</a>
                    <a href="/media">Media</a>
                    <a href="/general/hub">Chat</a>
                `;
                
                if (data.role === "FOUNDER") links += `<a href="/vault/a7b2x" style="color:#ef4444">Owner</a>`;
                if (["FOUNDER", "ADMIN"].includes(data.role)) links += `<a href="/core/z9p3m" style="color:#3b82f6">Admin</a>`;
                if (["FOUNDER", "ADMIN", "MARGA"].includes(data.role)) links += `<a href="/sector/n1o4c" style="color:#a855f7">Noctyra</a>`;
                
                links += `<a href="#" id="btn-logout-nav">Keluar</a>`;
                navContainer.innerHTML = links;

                document.getElementById('btn-logout-nav').addEventListener('click', handleLogout);
            }
        }
    } else {
        if (navContainer) {
            navContainer.innerHTML = `<a href="/">Home</a><a href="/auth/portal">Login</a>`;
        }
    }
});

// ==========================================
// 4. FITUR MEDIA & CHAT
// ==========================================
const mediaContainer = document.getElementById('media-gallery');
if (mediaContainer) {
    const q = query(collection(db, "media_logs"), orderBy("time", "desc"));
    onSnapshot(q, (snap) => {
        mediaContainer.innerHTML = "";
        snap.forEach(d => {
            const data = d.data();
            mediaContainer.innerHTML += `
                <div class="glass-card animate-up">
                    <span>● ${data.type}</span>
                    <h4>${data.title}</h4>
                    <a href="${data.url}" target="_blank" class="btn-primary">Tonton</a>
                </div>`;
        });
    });
}

const chatBox = document.getElementById('chat-box');
if (chatBox) {
    const qChat = query(collection(db, "global_chat"), orderBy("time", "asc"));
    onSnapshot(qChat, (snap) => {
        chatBox.innerHTML = "";
        snap.forEach(d => {
            const msg = d.data();
            const isMe = auth.currentUser && msg.uid === auth.currentUser.uid;
            chatBox.innerHTML += `
                <div class="chat-bubble ${isMe ? 'me' : 'other'}">
                    <small>${msg.sender}</small>
                    <p>${msg.text}</p>
                </div>`;
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// Security
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = (e) => {
    if(e.keyCode == 123 || (e.ctrlKey && e.keyCode==85)) return false;
};

export { auth, db };
