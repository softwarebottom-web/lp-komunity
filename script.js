import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, OAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// --- 1. KONFIGURASI FIREBASE & API ---
const firebaseConfig = {
    apiKey: "AIzaSyDLX4gTNGw_IQSdhXtSBl3utqCKFiwR2Hk",
    authDomain: "lpzone.firebaseapp.com",
    projectId: "lpzone",
    storageBucket: "lpzone.firebasestorage.app",
    messagingSenderId: "709883143619",
    appId: "1:709883143619:web:eab5fde631abdf7b548976"
};

// URL Apps Script Terbaru Lu (FIXED)
const API_GOOGLE = "https://script.google.com/macros/s/AKfycbyD57jIehuUdWFzmO6Oivn-mZI637QcDNDKILB8k9LXrmbp2VS7Z1l1Q6pgyUujKJJOxQ/exec";

// URL WEBHOOKS DISCORD
const WH_LOGIN   = "https://discord.com/api/webhooks/1466147147056676916/qrbAgOSZv6EIHEvGn5YS73YAmvB5muFnK-n4NgpSD-HZdLWml_BPLYAJGTIkqNob6YmV";
const WH_PROJECT = "https://discord.com/api/webhooks/1466148143593689152/1De2_JryP0RGIZyxPPig6v2UlLiKtY9G2peYlOqW-AmGtIEKEC_MkJU6x58KBU30ADz2";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 2. FUNGSI LOG DISCORD ---
async function sendDiscordLog(webhookUrl, title, message, color) {
    if (!webhookUrl) return;
    const payload = {
        embeds: [{ title, description: message, color, timestamp: new Date().toISOString() }]
    };
    try {
        await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } catch (e) { console.error("WH Error", e); }
}

// --- 3. AUTHENTICATION LOGIC (FIXED FOR FIREFOX) ---
const handleDiscordLogin = async () => {
    const provider = new OAuthProvider('oidc.discord');
    try {
        // Jika di Firefox bermasalah, pastikan pop-up tidak diblokir
        const result = await signInWithPopup(auth, provider);
        window.location.href = "/";
    } catch (e) { 
        alert("Login Gagal: Pastikan Pop-up diizinkan dan Tracking Protection Firefox dimatikan."); 
    }
};

// --- 4. OWNER AREA (UPLOAD ENGINE FIXED) ---
async function uploadToDrive(file, judul) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const payload = { 
                nama: auth.currentUser.displayName || "Owner", 
                filename: file.name, 
                file: reader.result, 
                judul: judul 
            };
            try {
                const response = await fetch(API_GOOGLE, { method: "POST", body: JSON.stringify(payload) });
                const data = await response.json(); // Mengambil respon JSON asli
                if(data.status === "sukses") resolve(data.url);
                else reject(data.msg);
            } catch (e) { reject("Gagal koneksi ke server Apps Script."); }
        };
    });
}

// Logic Posting di Owner Area
const btnPost = document.getElementById('btn-post-project');
if (btnPost) {
    btnPost.onclick = async () => {
        const judul = document.getElementById('inp-judul').value;
        const desc = document.getElementById('inp-desc').value;
        const fileInput = document.getElementById('inp-file-project');
        if(!judul || !desc) return alert("Isi Judul & Deskripsi!");
        
        btnPost.innerText = "Processing...";
        try {
            let img = fileInput.files.length > 0 ? await uploadToDrive(fileInput.files[0], judul) : "";
            await addDoc(collection(db, "announcements"), {
                title: judul, content: desc, image: img,
                type: img ? "PROJECT" : "INFO",
                author: auth.currentUser.displayName, timestamp: serverTimestamp()
            });
            sendDiscordLog(WH_PROJECT, "🚀 PROJECT PUBLISHED", `**${judul}**\n${desc}`, 16766720);
            alert("Berhasil!"); window.location.href = "/announcement";
        } catch (e) { alert("Error: " + e); btnPost.innerText = "Ulangi"; }
    };
}

// --- 5. NAVIGASI CLEAN URL & SECURITY GATE ---
onAuthStateChanged(auth, async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
            const data = snap.data();
            const role = data.role || "MEMBER";
            const path = window.location.pathname;

            // KICK JIKA BUKAN OTORITAS
            if (path.includes("/sector/n1o4c") && !["MARGA", "ADMIN", "FOUNDER"].includes(role)) {
                window.location.href = "/"; return;
            }

            if (nav) {
                let links = `<a href="/">Home</a><a href="/media">Media</a><a href="/general/hub">Chat</a><a href="/announcement">News</a>`;
                if (["MARGA", "ADMIN", "FOUNDER"].includes(role)) links += `<a href="/sector/n1o4c" style="color:#a855f7">Marga</a>`;
                if (["ADMIN", "FOUNDER"].includes(role)) links += `<a href="/core/z9p3m" style="color:#3b82f6">Admin</a>`;
                if (role === "FOUNDER") links += `<a href="/vault/a7b2x" style="color:#ef4444">Owner</a>`;

                links += `<a href="#" id="out-btn">Out</a>`;
                nav.innerHTML = links;
                document.getElementById('out-btn').onclick = () => { signOut(auth).then(() => { window.location.href = "/auth/portal"; }); };
            }
        }
    } else if (nav) {
        nav.innerHTML = `<a href="/">Home</a><a href="/auth/portal">Login</a>`;
    }
});

// --- 6. CYBER SECURITY (ANTI-INSPECT) ---
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = (e) => {
    if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && [73, 67, 74].includes(e.keyCode)) || (e.ctrlKey && e.keyCode == 85)) return false;
};

export { auth, db };
