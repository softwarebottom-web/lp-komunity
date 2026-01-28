import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, OAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCshVgfvU3OGL9ZuLOYsJZxLACxdVDDZYk",
    authDomain: "lpsquad-e4aad.firebaseapp.com",
    projectId: "lpsquad-e4aad",
    storageBucket: "lpsquad-e4aad.firebasestorage.app",
    appId: "1:390296155151:web:59775d3ce079c36b021f7a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 1. FUNGSI AUTHENTICATION (LOGIN/LOGOUT)
// ==========================================

// Fungsi Login Discord
const handleDiscordLogin = async () => {
    // Pastikan Provider ID sesuai dengan di Firebase Console kamu
    // Kalau pakai Native Discord Auth: 'discord.com'
    // Kalau pakai OIDC Custom: 'oidc.discord' (Pakai yg ini sesuai script lama lu)
    const provider = new OAuthProvider('oidc.discord'); 
    
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Cek/Buat User di Database
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
            await setDoc(userRef, {
                name: user.displayName,
                email: user.email,
                role: "MEMBER",
                status: "ACTIVE",
                photo: user.photoURL,
                uid: user.uid
            });
        }
        
        window.location.href = "/"; // Redirect ke Home
    } catch (e) {
        alert("Gagal Login Discord: " + e.message);
        console.error(e);
    }
};

// Fungsi Login Email/Password (Untuk Admin/Owner biasanya)
const handleEmailLogin = async (e) => {
    e.preventDefault(); // Biar gak reload halaman
    const email = document.getElementById('email-input').value;
    const pass = document.getElementById('password-input').value;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        window.location.href = "/";
    } catch (error) {
        alert("Login Gagal: " + error.message);
    }
};

// Fungsi Logout
const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/auth/portal";
};


// ==========================================
// 2. EVENT LISTENER (PENYADAP TOMBOL)
// ==========================================
// Ini pengganti onclick di HTML. Script akan mencari ID tombol dan memasang fungsi.

document.addEventListener("DOMContentLoaded", () => {
    
    // Cari tombol Discord
    const btnDiscord = document.getElementById('btn-login-discord');
    if (btnDiscord) {
        btnDiscord.addEventListener('click', handleDiscordLogin);
    }

    // Cari Form Login Email
    const formLogin = document.getElementById('login-form');
    if (formLogin) {
        formLogin.addEventListener('submit', handleEmailLogin);
    }

    // Cari tombol Logout
    // (Kita pasang di dalam observer di bawah karena tombolnya dinamis)
});


// ==========================================
// 3. NAVIGASI & PROTEKSI HALAMAN
// ==========================================
const navContainer = document.getElementById('dynamic-nav');

onAuthStateChanged(auth, async (user) => {
    // A. JIKA USER LOGIN
    if (user) {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        
        if (snap.exists()) {
            const data = snap.data();

            // Cek Banned
            if (data.status === "BANNED") {
                alert("AKUN ANDA DIBEKUKAN!");
                await signOut(auth);
                window.location.href = "/auth/portal";
                return;
            }

            // Render Navigasi
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

                // Pasang Event Listener Logout (karena tombol baru muncul)
                document.getElementById('btn-logout-nav').addEventListener('click', handleLogout);
            }
        }
    } 
    // B. JIKA TIDAK LOGIN
    else {
        if (navContainer) {
            navContainer.innerHTML = `<a href="/">Home</a><a href="/auth/portal">Login</a>`;
        }
    }
});


// ==========================================
// 4. FITUR HALAMAN LAIN (MEDIA & CHAT)
// ==========================================

// Media Gallery
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

// Global Chat
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
    if(e.keyCode == 123 || (e.ctrlKey && e.shiftKey && [73,74,67].includes(e.keyCode)) || (e.ctrlKey && e.keyCode==85)) return false;
};

// Export (Opsional, tapi bagus buat masa depan)
export { auth, db };
