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

const API_GOOGLE_SCRIPT = "https://script.google.com/macros/s/AKfycbxbPNp_7oEsSEh3v2s6tznJHKLvN4A-v4tVBanXjLtebcjxTenw_M_N79gVO59cRLGecA/exec";

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
            if (!data.lastLogin || (now - data.lastLogin) > 300000) {
                sendDiscordLog(WH_LOGIN, "🔐 USER LOGIN", `**${user.displayName}** has entered the zone.`, 3447003);
            }
            await updateDoc(userRef, { lastLogin: now });
        }
        window.location.href = "/";
    } catch (e) { alert("Login Error: " + e.message); }
};

// Sign In Manual
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

// Sign Up Manual
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
async function uploadToDrive(file, judul) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const payload = { 
                nama: auth.currentUser.displayName, 
                filename: file.name, 
                file: reader.result,
                judul: judul
            };
            try {
                const res = await fetch(API_GOOGLE_SCRIPT, { method: "POST", body: JSON.stringify(payload) });
                const data = await res.json();
                if(data.status === "sukses") resolve(data.url);
                else reject(data.msg);
            } catch (err) { reject(err); }
        };
    });
}

if (window.location.pathname.includes("ownerarea") || window.location.pathname.includes("a7b2x")) {
    const btnPost = document.getElementById('btn-post-project');
    if (btnPost) {
        btnPost.addEventListener('click', async () => {
            const judul = document.getElementById('inp-judul').value;
            const deskripsi = document.getElementById('inp-desc').value;
            const fileInput = document.getElementById('inp-file-project');
            if(!judul || !deskripsi) { alert("Isi Judul & Deskripsi!"); return; }
            btnPost.innerText = "Uploading...";
            try {
                let imageUrl = fileInput.files.length > 0 ? await uploadToDrive(fileInput.files[0], judul) : "";
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
            const cat = document.getElementById('sosmed-cat').value;
            const title = document.getElementById('sosmed-title').value;
            const url = document.getElementById('sosmed-url').value;
            try {
                await addDoc(collection(db, "external_links"), { 
                    category: cat, title, url, 
                    updatedBy: auth.currentUser.displayName, 
                    timestamp: serverTimestamp() 
                });
                sendDiscordLog(WH_SOSMED, "🔗 LINK UPDATED", `${cat}: ${title}\n${url}`, 10181046);
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
            snap.forEach(d => {
                const data = d.data();
                const id = d.id;
                let btnHapus = auth.currentUser && (auth.currentUser.uid === "OWNER_ID_DISINI" || true) ? `<button onclick="deleteContent('${id}')" style="background:red; color:white; border:none; padding:5px; border-radius:5px; margin-top:10px;">HAPUS</button>` : "";
                
                container.innerHTML += data.type === "PROJECT" ? `
                    <div class="glass-card project-card animate">
                        <div class="badge">🔥 PROJECT UPDATE</div>
                        <img src="${data.image}" class="project-img">
                        <h3>${data.title}</h3><p>${data.content}</p><small>By ${data.author}</small>
                        ${btnHapus}
                    </div>` : `
                    <div class="glass-card info-card animate">
                        <div class="badge-info">📢 INFO</div>
                        <h3>${data.title}</h3><p>${data.content}</p><small>${data.author}</small>
                        ${btnHapus}
                    </div>`;
            });
        });
    }
}

window.deleteContent = async (id) => {
    if(confirm("Hapus konten ini?")) {
        await deleteDoc(doc(db, "announcements", id));
        alert("Terhapus!");
    }
};

// ==========================================
// 6. CHAT ROOM (MARGA AREA & GLOBAL)
// ==========================================
const margaChatBox = document.getElementById('marga-chat');
if (margaChatBox) {
    onSnapshot(query(collection(db, "marga_chat"), orderBy("time", "asc")), (snap) => {
        margaChatBox.innerHTML = "";
        snap.forEach(d => {
            const m = d.data();
            margaChatBox.innerHTML += `<div class="chat-msg"><b>${m.sender}:</b> ${m.text}</div>`;
        });
        margaChatBox.scrollTop = margaChatBox.scrollHeight;
    });

    document.getElementById('form-marga-chat').onsubmit = async (e) => {
        e.preventDefault();
        const input = document.getElementById('marga-msg');
        await addDoc(collection(db, "marga_chat"), {
            text: input.value, sender: auth.currentUser.displayName, time: serverTimestamp()
        });
        input.value = "";
    };
}

// ==========================================
// 7. ADMIN AREA
// ==========================================
if (window.location.pathname.includes("adminarea") || window.location.pathname.includes("z9p3m")) {
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
                        <td>${u.role !== 'FOUNDER' ? `<button onclick="toggleBan('${u.uid}', ${isBanned}, '${u.name}')" class="btn-sm ${isBanned ? 'btn-green' : 'btn-red'}">${isBanned ? 'UNBAN' : 'BAN'}</button>` : 'BOSS'}</td>
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
            if (data.status === "BANNED") { await signOut(auth); location.href = "/auth/portal.html"; return; }
            
            if (window.location.pathname.includes("margaarea") && !["MARGA", "ADMIN", "FOUNDER"].includes(data.role)) {
                alert("KHUSUS MARGA!"); window.location.href = "/index.html"; return;
            }

            if (nav) {
                let links = `<a href="/index.html">Home</a><a href="/media.html">Media</a><a href="/general/hub.html">Chat</a><a href="/announcement.html">News</a>`;
                if (["MARGA", "ADMIN", "FOUNDER"].includes(data.role)) links += `<a href="/margaarea.html" style="color:#a855f7">Marga</a>`;
                if (data.role === "FOUNDER") links += `<a href="/vault/a7b2x.html" style="color:#ef4444">Owner</a>`;
                links += `<a href="#" id="logout-btn">Keluar</a>`;
                nav.innerHTML = links;
                document.getElementById('logout-btn').onclick = async () => { await signOut(auth); location.href = "/auth/portal.html"; };
            }
        }
    } else if(nav) { nav.innerHTML = `<a href="/index.html">Home</a><a href="/auth/portal.html">Login</a>`; }
});

// ==========================================
// 9. SECURITY SYSTEM
// ==========================================
const enableSecurity = () => {
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.onkeydown = function(e) {
        if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && [73, 67, 74].includes(e.keyCode)) || (e.ctrlKey && e.keyCode == 85)) return false;
    };
    document.addEventListener('copy', e => e.preventDefault());
};

document.addEventListener("DOMContentLoaded", () => {
    enableSecurity();
    const btnIn = document.getElementById('btn-login-discord-in');
    const btnUp = document.getElementById('btn-login-discord-up');
    if (btnIn) btnIn.addEventListener('click', handleDiscordLogin);
    if (btnUp) btnUp.addEventListener('click', handleDiscordLogin);
});

export { auth, db };
