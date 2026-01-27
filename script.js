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

// --- 1. NAVIGASI DINAMIS & CEK BAN ---
const navContainer = document.getElementById('dynamic-nav');
if (navContainer) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);
            
            // LOGIKA BAN USER
            if (snap.exists() && snap.data().status === "BANNED") {
                alert("AKUN ANDA DIBEKUKAN OLEH OWNER.");
                await signOut(auth);
                window.location.href = "form.html";
                return;
            }

            const role = snap.exists() ? snap.data().role : "MEMBER";
            
            let links = `
                <a href="index.html">Home</a>
                <a href="media.html">Media</a>
                <a href="general.html">Chat</a>
            `;
            
            if (role === "FOUNDER") links += `<a href="ownerarea.html" style="color:#ef4444">Owner</a>`;
            if (["FOUNDER", "ADMIN"].includes(role)) links += `<a href="adminarea.html" style="color:#3b82f6">Admin</a>`;
            if (["FOUNDER", "ADMIN", "MARGA"].includes(role)) links += `<a href="margaarea.html" style="color:#a855f7">Noctyra</a>`;
            
            links += `<a href="#" id="btn-logout">Keluar</a>`;
            navContainer.innerHTML = links;
            
            setTimeout(() => {
                document.getElementById('btn-logout').onclick = () => signOut(auth).then(() => window.location.href = "form.html");
            }, 500);
        } else {
            navContainer.innerHTML = `<a href="index.html">Home</a><a href="form.html">Login</a>`;
        }
    });
}

// --- 2. MEDIA LOGS RENDERER (Khusus media.html) ---
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

// --- 3. EXPORT UNTUK DIGUNAKAN DI HTML ---
export { auth, db, doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot };
