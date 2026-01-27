import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, OAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

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

// --- 1. FITUR LOGIN DISCORD (OIDC) ---
export const loginDiscord = async () => {
    const provider = new OAuthProvider('oidc.discord'); 
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        
        if (!snap.exists()) {
            await setDoc(userRef, {
                name: user.displayName,
                email: user.email,
                role: "MEMBER",
                photo: user.photoURL
            });
        }
        window.location.href = "index.html";
    } catch (error) {
        console.error(error);
        alert("Gagal Login Discord: " + error.message + "\n(Pastikan OIDC sudah disetting di Firebase Console)");
    }
};

// --- 2. SECURITY SYSTEM (ANTI-COPY, ANTI-F12, & ANTI-SELECT) ---
document.addEventListener('contextmenu', event => event.preventDefault()); // Blokir Klik Kanan
document.addEventListener('selectstart', event => event.preventDefault()); // Blokir Seleksi Teks

document.onkeydown = function(e) {
    if (e.keyCode == 123) { return false; } // Blokir F12
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) { return false; } // Blokir Ctrl+Shift+I
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) { return false; } // Blokir Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) { return false; } // Blokir Ctrl+Shift+J
    if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) { return false; } // Blokir Ctrl+U (View Source)
}

// --- 3. NAVIGASI DINAMIS & URL OBFUSCATION ---
// Map untuk menyamarkan URL dengan ID acak
const pageMap = { "ownerarea": "a7b2x", "adminarea": "z9p3m", "margaarea": "n1o4c" };

const navContainer = document.getElementById('dynamic-nav');
if (navContainer) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const snap = await getDoc(doc(db, "users", user.uid));
            const role = snap.exists() ? snap.data().role : "MEMBER";
            
            let links = `<a href="index.html">Dashboard</a><a href="general.html">Chat</a>`;
            
            // Menggunakan hash sederhana untuk menyamarkan navigasi
            if (role === "FOUNDER") links += `<a href="ownerarea.html?id=${pageMap.ownerarea}" class="text-red">Owner</a>`;
            if (["FOUNDER", "ADMIN"].includes(role)) links += `<a href="adminarea.html?id=${pageMap.adminarea}" class="text-blue">Admin</a>`;
            if (["FOUNDER", "ADMIN", "MARGA"].includes(role)) links += `<a href="margaarea.html?id=${pageMap.margaarea}" class="text-purple">Marga</a>`;
            
            links += `<a href="#" id="btn-logout">Logout</a>`;
            navContainer.innerHTML = links;

            document.getElementById('btn-logout').onclick = () => {
                signOut(auth).then(() => window.location.href = "form.html");
            };
        } else {
            navContainer.innerHTML = `<a href="index.html">Home</a><a href="form.html" class="btn-login-nav">Login Area</a>`;
        }
    });
}

// --- 4. MEDIA LOGS RENDERER (Dinamis ke Index) ---
// Mengambil data video terbaru dari Firestore untuk ditampilkan di Index
const logsContainer = document.getElementById('media-logs-container');
if (logsContainer) {
    const q = query(collection(db, "media_logs"), orderBy("time", "desc"), limit(4));
    onSnapshot(q, (snap) => {
        logsContainer.innerHTML = "";
        if (snap.empty) {
            logsContainer.innerHTML = `<p class="text-gray text-xs italic">Belum ada pembaruan media.</p>`;
            return;
        }
        snap.forEach(doc => {
            const data = doc.data();
            logsContainer.innerHTML += `
                <div class="glass-card border-red">
                    <p class="text-xs text-red font-bold">${data.type || 'Media'}</p>
                    <h4 style="margin: 5px 0;">${data.title}</h4>
                    <a href="${data.url}" target="_blank" class="text-blue text-xs">Watch Link &rarr;</a>
                </div>`;
        });
    });
}

export { auth, db };
