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
// 2. FUNGSI LOG DISCORD
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
// 3. AUTHENTICATION
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

// ==========================================
// 4. OWNER AREA (Upload Fixed)
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

// Logic Owner Post
if (window.location.pathname.includes("vault/a7b2x") || window.location.pathname.includes("ownerarea")) {
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
                sendDiscordLog(WH_PROJECT, "🚀 PROJECT UPDATE", `**${judul}**\n${deskripsi}`, 16766720);
                alert("Published!");
                window.location.href = "/announcement"; 
            } catch (e) { alert(e.message); } finally { btnPost.innerText = "Kirim Sekarang"; }
        });
    }
}

// ==========================================
// 8. NAVIGASI CLEAN URL & MOBILE FIX
// ==========================================
onAuthStateChanged(auth, async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
            const data = snap.data();
            const role = data.role;
            const path = window.location.pathname;

            // PROTEKSI HALAMAN (Kick Member Nakal)
            if (path.includes("/sector/n1o4c") && !["MARGA", "ADMIN", "FOUNDER"].includes(role)) {
                alert("KHUSUS MARGA!"); window.location.href = "/"; return;
            }
            if (path.includes("/core/z9p3m") && !["ADMIN", "FOUNDER"].includes(role)) {
                alert("KHUSUS ADMIN!"); window.location.href = "/"; return;
            }

            if (data.status === "BANNED") { await signOut(auth); location.href = "/auth/portal"; return; }

            if (nav) {
                // Link Clean (Sesuai vercel.json)
                let links = `
                    <a href="/">Home</a>
                    <a href="/media">Media</a>
                    <a href="/general/hub">Chat</a>
                    <a href="/announcement">News</a>
                `;
                
                if (["MARGA", "ADMIN", "FOUNDER"].includes(role)) {
                    links += `<a href="/sector/n1o4c" style="color:#a855f7">Marga</a>`;
                }
                if (["ADMIN", "FOUNDER"].includes(role)) {
                    links += `<a href="/core/z9p3m" style="color:#3b82f6">Admin</a>`;
                }
                if (role === "FOUNDER") {
                    links += `<a href="/vault/a7b2x" style="color:#ef4444">Owner</a>`;
                }

                links += `<a href="#" id="logout-btn">Out</a>`;
                nav.innerHTML = links;
                
                document.getElementById('logout-btn').onclick = async () => { 
                    await signOut(auth); 
                    window.location.href = "/auth/portal"; 
                };
            }
        }
    } else if(nav) { 
        nav.innerHTML = `<a href="/">Home</a><a href="/auth/portal">Login</a>`; 
    }
});

// ==========================================
// 9. SECURITY & INITIALIZATION
// ==========================================
const enableSecurity = () => {
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.onkeydown = function(e) {
        if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && [73, 67, 74].includes(e.keyCode)) || (e.ctrlKey && e.keyCode == 85)) return false;
    };
};

document.addEventListener("DOMContentLoaded", () => {
    enableSecurity();
    const btnIn = document.getElementById('btn-login-discord-in');
    const btnUp = document.getElementById('btn-login-discord-up');
    if (btnIn) btnIn.addEventListener('click', handleDiscordLogin);
    if (btnUp) btnUp.addEventListener('click', handleDiscordLogin);
});

export { auth, db };
