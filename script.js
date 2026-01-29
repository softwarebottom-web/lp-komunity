// --- 1. CONFIG FIREBASE (PAKE DATA LU) ---
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

// Init pake gaya Compat biar nyambung ama HTML lu
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const BACKEND_URL = "https://beck-production-6c7d.up.railway.app";

// --- 2. LOGIKA LOGIN & REGISTER ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signin-email').value;
            const pass = document.getElementById('signin-password').value;
            try {
                const userCred = await auth.signInWithEmailAndPassword(email, pass);
                // Kirim log login ke Discord via Backend
                fetch(`${BACKEND_URL}/api/log-login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: userCred.user.displayName || "User", email: email })
                });
                window.location.href = "index.html";
            } catch (err) { alert("Login Gagal: " + err.message); }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const pass = document.getElementById('signup-password').value;
            try {
                const res = await auth.createUserWithEmailAndPassword(email, pass);
                await res.user.updateProfile({ displayName: name });
                // Simpan user ke Firestore biar ada Role-nya
                await db.collection("users").doc(res.user.uid).set({
                    uid: res.user.uid,
                    displayName: name,
                    email: email,
                    role: "MEMBER", 
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert("Berhasil Daftar!");
                location.reload();
            } catch (err) { alert("Daftar Gagal: " + err.message); }
        });
    }
});

// --- 3. NAVIGASI DINAMIS ---
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (!nav) return;

    let menu = '<a href="index.html">HOME</a><a href="media.html">MEDIA</a><a href="announcement.html">NEWS</a>';
    
    if (user) {
        try {
            const snap = await db.collection("users").doc(user.uid).get();
            const userData = snap.data();
            const role = userData?.role || "MEMBER";
            
            if (role === "FOUNDER" || role === "ADMIN") {
                menu += '<a href="ownerarea.html" style="color:red">OWNER</a>';
            }
            menu += `<a href="#" onclick="logoutUser()">OUT (${user.displayName || 'User'})</a>`;
        } catch (e) {
            menu += '<a href="#" onclick="logoutUser()">OUT</a>';
        }
    } else {
        menu += '<a href="portal.html">LOGIN</a>';
    }
    nav.innerHTML = menu;
});

window.logoutUser = () => {
    auth.signOut().then(() => { window.location.href = "portal.html"; });
};

// --- 4. FUNGSI POST (LEWAT BACKEND KE GOOGLE DRIVE) ---
window.postContent = async (category) => {
    if (!auth.currentUser) return alert("Login dulu!");

    const title = category === 'SOCIAL' ? document.getElementById('soc-title').value : document.getElementById('sys-title').value;
    const desc = category === 'SYSTEM' ? document.getElementById('sys-desc').value : "";
    const fileInput = category === 'SOCIAL' ? document.getElementById('soc-file') : document.getElementById('sys-file');
    const file = fileInput.files[0];

    if (!title || !file) return alert("Lengkapi data!");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('judul', title);
    formData.append('desc', desc);
    formData.append('type', category);
    formData.append('author', auth.currentUser.displayName || "Owner");

    try {
        const res = await fetch(`${BACKEND_URL}/api/publish-project`, {
            method: "POST",
            body: formData
        });

        if (res.ok) {
            alert("BERHASIL POST KE DRIVE & DISCORD!");
            location.reload();
        } else {
            alert("Gagal Upload!");
        }
    } catch (e) { alert("Backend Mati!"); }
};
