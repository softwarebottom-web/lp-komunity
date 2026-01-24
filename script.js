import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCshVgfvU3OGL9ZuLOYsJZxLACxdVDDZYk",
    authDomain: "lpsquad-e4aad.firebaseapp.com",
    projectId: "lpsquad-e4aad",
    storageBucket: "lpsquad-e4aad.firebasestorage.app",
    messagingSenderId: "390296155151",
    appId: "1:390296155151:web:59775d3ce079c36b021f7a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- AUTH LOGIC ---
const loginBtn = document.getElementById('login-btn');
loginBtn.onclick = () => signInWithPopup(auth, new GoogleAuthProvider());
document.getElementById('logout-btn').onclick = () => signOut(auth);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-dashboard').classList.remove('hidden');
        await syncUserAccount(user);
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('main-dashboard').classList.add('hidden');
    }
});

// --- ROLE MANAGEMENT ---
async function syncUserAccount(user) {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    let userData;

    if (!snap.exists()) {
        userData = { name: user.displayName, email: user.email, role: "MEMBER", photo: user.photoURL };
        await setDoc(userRef, userData);
    } else {
        userData = snap.data();
    }

    // Update UI
    document.getElementById('user-display-name').innerText = userData.name;
    document.getElementById('user-photo').src = userData.photo;
    const badge = document.getElementById('user-role-badge');
    badge.innerText = userData.role;
    badge.className = `badge badge-${userData.role.toLowerCase()}`;

    setupSidebar(userData.role);
    initGlobalChat(userData);
}

function setupSidebar(role) {
    const menu = document.getElementById('sidebar-menu');
    let items = `<div class="nav-item active" onclick="location.reload()"><i class="fas fa-comments"></i> Global Chat</div>`;

    if (role === "FOUNDER") {
        items += `<div class="nav-item"><i class="fas fa-user-shield"></i> Owner Area</div>`;
        items += `<div class="nav-item"><i class="fas fa-tools"></i> Admin Panel</div>`;
    } else if (role === "ADMIN") {
        items += `<div class="nav-item"><i class="fas fa-tools"></i> Admin Panel</div>`;
    }

    if (["FOUNDER", "ADMIN", "MARGA"].includes(role)) {
        items += `<div class="nav-item" onclick="alert('Welcome to Noctyra Base')"><i class="fas fa-fort-awesome"></i> Marga Area</div>`;
        items += `<a href="https://discord.gg/NOCTYRA_PRIVATE" target="_blank" class="nav-item"><i class="fab fa-discord"></i> Discord Marga</a>`;
    } else {
        items += `<a href="https://discord.gg/LPZONE_PUBLIC" target="_blank" class="nav-item"><i class="fab fa-discord"></i> Discord Fans</a>`;
    }

    menu.innerHTML = items;
}

// --- GLOBAL CHAT LOGIC ---
function initGlobalChat(user) {
    const q = query(collection(db, "global_chat"), orderBy("time", "asc"), limit(50));
    const chatBox = document.getElementById('chat-messages');

    onSnapshot(q, (snapshot) => {
        chatBox.innerHTML = "";
        snapshot.forEach(doc => {
            const m = doc.data();
            chatBox.innerHTML += `
                <div class="msg-bubble">
                    <span class="badge badge-${m.role.toLowerCase()}">${m.role}</span>
                    <b style="color:#60a5fa">${m.name}:</b> <span>${m.text}</span>
                </div>`;
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    document.getElementById('send-btn').onclick = async () => {
        const input = document.getElementById('msg-input');
        if (!input.value.trim()) return;
        await addDoc(collection(db, "global_chat"), {
            name: user.name,
            role: user.role,
            text: input.value,
            time: serverTimestamp()
        });
        input.value = "";
    };
}
