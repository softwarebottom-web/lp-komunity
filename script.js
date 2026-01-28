import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, OAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
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

// --- 1. NAVIGASI DINAMIS & CEK BAN (SINKRON DENGAN VERCEL.JSON) ---
const navContainer = document.getElementById('dynamic-nav');

const renderNav = (role, status) => {
    if (!navContainer) return;

    if (status === "BANNED") {
        navContainer.innerHTML = `<a href="/">Home</a><a href="/auth/portal">Login</a>`;
        return;
    }

    // Menggunakan path bersih sesuai vercel.json
    let links = `
        <a href="/">Home</a>
        <a href="/media/list">Media</a>
        <a href="/general/hub">Chat</a>
    `;
    
    if (role === "FOUNDER") links += `<a href="/vault/a7b2x" style="color:#ef4444">Owner</a>`;
    if (["FOUNDER", "ADMIN"].includes(role)) links += `<a href="/core/z9p3m" style="color:#3b82f6">Admin</a>`;
    if (["FOUNDER", "ADMIN", "MARGA"].includes(role)) links += `<a href="/sector/n1o4c" style="color:#a855f7">Noctyra</a>`;
    
    links += `<a href="#" id="btn-logout">Keluar</a>`;
    navContainer.innerHTML = links;

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            signOut(auth).then(() => window.location.href = "/auth/portal");
        };
    }
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        
        if (snap.exists()) {
            const userData = snap.data();
            if (userData.status === "BANNED") {
                alert("AKUN ANDA DIBEKUKAN OLEH OWNER.");
                await signOut(auth);
                window.location.href = "/auth/portal";
                return;
            }
            renderNav(userData.role, userData.status);
        } else {
            renderNav("MEMBER", "ACTIVE");
        }
    } else {
        if (navContainer) {
            navContainer.innerHTML = `<a href="/">Home</a><a href="/auth/portal">Login</a>`;
        }
    }
});

// --- 2. MEDIA LOGS RENDERER ---
const logsContainer = document.getElementById('media-gallery');
if (logsContainer) {
    const q = query(collection(db, "media_logs"), orderBy("time", "desc"));
    onSnapshot(q, (snap) => {
        logsContainer.innerHTML = "";
        snap.forEach(doc => {
            const data = doc.data();
            logsContainer.innerHTML += `
                <div class="glass-card animate-up">
                    <span style="font-size:0.7rem; color:${data.type==='TikTok'?'#ff0050':'#ff0000'}">● ${data.type}</span>
                    <h4 style="margin:10px 0">${data.title}</h4>
                    <a href="${data.url}" target="_blank" class="btn-primary" style="font-size:0.8rem; display:inline-block">Tonton Video</a>
                </div>`;
        });
    });
}

// --- 3. SECURITY SYSTEM ---
document.addEventListener('contextmenu', event => event.preventDefault()); 
document.addEventListener('selectstart', event => event.preventDefault());

document.onkeydown = function(e) {
    if (e.keyCode == 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 67 || e.keyCode == 74)) ||
        (e.ctrlKey && e.keyCode == 85)) {
        return false;
    }
}

export { auth, db, doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot };
