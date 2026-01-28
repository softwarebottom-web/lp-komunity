import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { 
    getAuth, onAuthStateChanged, signOut, OAuthProvider, signInWithPopup, 
    signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, 
    addDoc, serverTimestamp, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// --- 1. KONFIGURASI FIREBASE & API ---
const firebaseConfig = {
    apiKey: "AIzaSyDLX4gTNGw_IQSdhXtSBl3utqCKFiwR2Hk",
    authDomain: "lpzone.firebaseapp.com",
    projectId: "lpzone",
    storageBucket: "lpzone.firebasestorage.app",
    messagingSenderId: "709883143619",
    appId: "1:709883143619:web:eab5fde631abdf7b548976"
};

const API_GOOGLE_SCRIPT = "https://script.google.com/macros/s/AKfycby-23cLw-mEEdNoaSQ7f_4Ocect4t5hPOizd_ehIpQQlTfs8xR5AZDQnu-0Y2ECJgga/exec";

// URL WEBHOOKS
const WH_LOGIN   = "https://discord.com/api/webhooks/1466147147056676916/qrbAgOSZv6EIHEvGn5YS73YAmvB5muFnK-n4NgpSD-HZdLWml_BPLYAJGTIkqNob6YmV";
const WH_SOSMED  = "https://discord.com/api/webhooks/1466147843923509432/A32z0_DHEAklvKPkgjrB0n9E15AnpucRusbAY0LKynr2K6VBIN_YKdB97ud34CXndx47";
const WH_PROJECT = "https://discord.com/api/webhooks/1466148143593689152/1De2_JryP0RGIZyxPPig6v2UlLiKtY9G2peYlOqW-AmGtIEKEC_MkJU6x58KBU30ADz2";
const WH_BAN     = "https://discord.com/api/webhooks/1466148412524069077/xa7iEdKbgiIfvXcNNINE-1MTh5ZAmJ1Am-G8S6BsySOqV4gkWoB24HGDlzeC-8rSIIF9";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 2. FUNGSI LOG DISCORD (Anti-Spam Ready)
// ==========================================
async function sendDiscordLog(webhookUrl, title, message, color) {
    if (!webhookUrl) return;
    const payload = {
        embeds: [{
            title: title, description: message, color: color,
            footer: { text: "L.P ZONE SYSTEM" }, timestamp: new Date().toISOString()
        }]
    };
    try {
        await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } catch (e) { console.error("Webhook Error", e); }
}

// ==========================================
// 3. AUTHENTICATION (Login & Sign Up)
// ==========================================
const handleDiscordLogin = async () => {
    const provider = new OAuthProvider('oidc.discord'); 
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        const now = Date.now();

        if (!snap.exists()) {
            await setDoc(userRef, {
                name: user.displayName, email: user.email, role: "MEMBER",
                status: "ACTIVE", photo: user.photoURL, uid: user.uid,
                createdAt: serverTimestamp(), lastLogin: now
            });
            sendDiscordLog(WH_LOGIN, "🆕 NEW MEMBER JOINED", `Welcome **${user.displayName}** via Discord!`, 5763719);
        } else {
            const data = snap.data();
            if (data.status === "BANNED") {
                await signOut(auth);
                alert("ACCESS DENIED: Banned.");
                return;
            }
            // Anti-Spam: Kirim log hanya jika login terakhir > 5 menit lalu
            if (!data.lastLogin || (now - data.lastLogin) > 300000) {
                sendDiscordLog(WH_LOGIN, "🔐 USER LOGIN", `**${user.displayName}** has entered the zone.`, 3447003);
            }
            await updateDoc(userRef, { lastLogin: now });
        }
        window.location.href = "/";
    } catch (e) { alert("Login Error: " + e.message); }
};

// Sign In Manual (Email)
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const pass = document.getElementById('signin-password').value;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            window.location.href = "/";
        } catch (e) { alert("Invalid Credentials"); }
    });
}

// Sign Up Manual (Email)
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const pass = document.getElementById('signup-password').value;
        try {
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(res.user, { displayName: name });
            await setDoc(doc(db, "users", res.user.uid), {
                name, email, role: "MEMBER", status: "ACTIVE", uid: res.user.uid, createdAt: serverTimestamp()
            });
            alert("Account Created! Please Sign In.");
            location.reload();
        } catch (e) { alert(e.message); }
    });
}

// ==========================================
// 4. OWNER AREA (Project & Sosmed)
// ==========================================
async function uploadToDrive(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const payload = { nama: auth.currentUser.displayName, filename: file.name, file: reader.result };
            try {
                const res = await fetch(API_GOOGLE_SCRIPT, { method: "POST", body: JSON.stringify(payload) });
                const data = await res.json();
                if(data.status === "sukses") resolve(data.url);
                else reject(data.msg);
            } catch (err) { reject(err); }
        };
    });
}

if (window.location.pathname.includes("ownerarea")) {
    const btnPost = document.getElementById('btn-post-project');
    if (btnPost) {
        btnPost.addEventListener('click', async () => {
            const judul = document.getElementById('inp-judul').value;
            const deskripsi = document.getElementById('inp-desc').value;
            const fileInput = document.getElementById('inp-file-project');
            if(!judul || !deskripsi) { alert("Isi Judul & Deskripsi!"); return; }
            btnPost.innerText = "Uploading...";
            try {
                let imageUrl = fileInput.files.length > 0 ? await uploadToDrive(fileInput.files[0]) : "";
                await addDoc(collection(db, "announcements"), {
                    type: imageUrl ? "PROJECT" : "INFO",
                    title: judul, content: deskripsi, image: imageUrl,
                    timestamp: serverTimestamp(), author: auth.currentUser.displayName
                });
                let msg = `**${judul}**\n${deskripsi}\n` + (imageUrl ? `[View Project](${imageUrl})` : "");
                sendDiscordLog(WH_PROJECT, "🚀 PROJECT UPDATE", msg, 16766720);
                alert("Published!");
                window.location.href = "/announcement.html";
            } catch (e) { alert(e.message); } finally { btnPost.innerText = "Kirim Sekarang"; }
        });
    }

    const btnSosmed = document.getElementById('btn-save-sosmed');
    if (btnSosmed) {
        btnSosmed.addEventListener('click', async () => {
            const tiktok = document.getElementById('link-tiktok').value;
            const ig = document.getElementById('link-ig').value;
            const yt = document.getElementById('link-yt').value;
            try {
                await setDoc(doc(db, "settings", "social_media"), { tiktok, instagram: ig, youtube: yt, updatedBy: auth.currentUser.displayName, updatedAt: serverTimestamp() });
                sendDiscordLog(WH_SOSMED, "📲 SOSMED UPDATED", `TikTok: ${tiktok}\nIG: ${ig}\nYT: ${yt}`, 10181046);
                alert("Saved!");
            } catch(e) { alert("Error"); }
        });
    }
}

// ==========================================
// 5. ANNOUNCEMENT FEED
// ==========================================
if (window.location.pathname.includes("announcement")) {
    const container = document.getElementById('announcement-feed');
    if (container) {
        onSnapshot(query(collection(db, "announcements"), orderBy("timestamp", "desc")), (snap) => {
            container.innerHTML = "";
            snap.forEach(doc => {
                const data = doc.data();
                container.innerHTML += data.type === "PROJECT" ? `
                    <div class="glass-card project-card animate">
                        <div class="badge">🔥 PROJECT UPDATE</div>
                        <img src="${data.image}" class="project-img">
                        <h3>${data.title}</h3><p>${data.content}</p><small>By ${data.author}</small>
                    </div>` : `
                    <div class="glass-card info-card animate">
                        <div class="badge-info">📢 INFO</div>
                        <h3>${data.title}</h3><p>${data.content}</p><small>${data.author}</small>
                    </div>`;
            });
        });
    }
}

// ==========================================
// 6. CHAT ROOM
// ==========================================
const chatBox = document.getElementById('chat-box');
if (chatBox) {
    onSnapshot(query(collection(db, "global_chat"), orderBy("time", "asc")), (snap) => {
        chatBox.innerHTML = "";
        snap.forEach(d => {
            const msg = d.data();
            const isMe = auth.currentUser && msg.uid === auth.currentUser.uid;
            let rColor = msg.role === "FOUNDER" ? "#ef4444" : msg.role === "ADMIN" ? "#3b82f6" : "#fff";
            chatBox.innerHTML += `
                <div class="chat-bubble ${isMe ? 'me' : 'other'} animate">
                    <small style="color:${rColor}; font-weight:bold">${msg.sender}</small>
                    <p>${msg.text}</p>
                </div>`;
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    const formChat = document.getElementById('chat-form');
    if(formChat) {
        formChat.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('msg-input');
            if(!input.value.trim()) return;
            const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
            await addDoc(collection(db, "global_chat"), {
                text: input.value, sender: auth.currentUser.displayName,
                uid: auth.currentUser.uid, role: userSnap.data().role, time: serverTimestamp()
            });
            input.value = "";
        });
    }
}

// ==========================================
// 7. ADMIN AREA
// ==========================================
if (window.location.pathname.includes("adminarea")) {
    const tableBody = document.getElementById('member-list-body');
    if (tableBody) {
        onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")), (snap) => {
            tableBody.innerHTML = "";
            snap.forEach(d => {
                const u = d.data();
                const isBanned = u.status === "BANNED";
                tableBody.innerHTML += `
                    <tr>
                        <td>${u.name}</td><td>${u.role}</td>
                        <td>${isBanned ? '🔴 BANNED' : '🟢 ACTIVE'}</td>
                        <td>${u.role !== 'FOUNDER' ? `<button onclick="toggleBan('${u.uid}', ${isBanned}, '${u.name}')" class="btn-sm ${isBanned ? 'btn-green' : 'btn-red'}">${isBanned ? 'UNBAN' : 'BAN AXE'}</button>` : 'BOSS'}</td>
                    </tr>`;
            });
        });
    }
}

window.toggleBan = async (uid, isBanned, name) => {
    const newStatus = isBanned ? "ACTIVE" : "BANNED";
    await updateDoc(doc(db, "users", uid), { status: newStatus });
    sendDiscordLog(WH_BAN, newStatus === "BANNED" ? "⛔ BAN HAMMER" : "✅ UNBANNED", `User: **${name}**`, newStatus === "BANNED" ? 15548997 : 5763719);
};

// ==========================================
// 8. NAVIGASI
// ==========================================
onAuthStateChanged(auth, async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
            const data = snap.data();
            if (data.status === "BANNED") { await signOut(auth); location.href = "/auth/portal"; return; }
            if (nav) {
                let links = `<a href="/">Home</a><a href="/media">Media</a><a href="/general/hub">Chat</a><a href="/announcement.html">News</a>`;
                if (data.role === "FOUNDER") links += `<a href="/vault/a7b2x" style="color:#ef4444">Owner</a>`;
                if (["FOUNDER", "ADMIN"].includes(data.role)) links += `<a href="/core/z9p3m" style="color:#3b82f6">Admin</a>`;
                links += `<a href="#" id="btn-logout-nav">Keluar</a>`;
                nav.innerHTML = links;
                document.getElementById('btn-logout-nav').onclick = async () => { await signOut(auth); location.href = "/auth/portal"; };
            }
        }
    } else if(nav) { nav.innerHTML = `<a href="/">Home</a><a href="/auth/portal">Login</a>`; }
});

// ==========================================
// 9. SECURITY SYSTEM (BLOKIR INSPECT & COPY)
// ==========================================
const enableSecurity = () => {
    // 1. Blokir Klik Kanan
    document.addEventListener('contextmenu', e => e.preventDefault());

    // 2. Blokir Shortcuts (F12, Ctrl+Shift+I, Ctrl+U, dll)
    document.onkeydown = function(e) {
        if (e.keyCode == 123) return false; // F12
        if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false; // Ctrl+Shift+I
        if (e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) return false; // Ctrl+Shift+C
        if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false; // Ctrl+Shift+J
        if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false; // Ctrl+U
    };

    // 3. Blokir Copy-Paste (Optional, aktifkan jika mau)
    document.addEventListener('copy', e => e.preventDefault());
    
    // 4. Mencegah Drag Gambar
    document.addEventListener('dragstart', e => e.preventDefault());
};

document.addEventListener("DOMContentLoaded", () => {
    enableSecurity(); // Jalankan Keamanan
    
    const btnIn = document.getElementById('btn-login-discord-in');
    const btnUp = document.getElementById('btn-login-discord-up');
    if (btnIn) btnIn.addEventListener('click', handleDiscordLogin);
    if (btnUp) btnUp.addEventListener('click', handleDiscordLogin);
});

export { auth, db };
