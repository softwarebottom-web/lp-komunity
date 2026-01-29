// --- 1. FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyDLX4gTNGw_IQSdhXtSBl3utqCKFiwR2Hk",
    authDomain: "lpzone.firebaseapp.com",
    projectId: "lpzone",
    storageBucket: "lpzone.firebasestorage.app",
    messagingSenderId: "709883143619",
    appId: "1:709883143619:web:eab5fde631abdf7b548976"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// URL BACKEND RAILWAY LU
const BACKEND_URL = "https://beck-production-6c7d.up.railway.app";

// --- 2. RENDER NAVIGASI & LOG LOGIN ---
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (!nav) return;

    let menu = `
        <a href="index.html">HOME</a>
        <a href="media.html">MEDIA</a>
        <a href="announcement.html">NEWS</a>
    `;

    if (user) {
        try {
            // Ambil Data Role
            const snap = await db.collection("users").doc(user.uid).get();
            const userData = snap.data();
            const role = userData?.role || "MEMBER";

            // Kirim Log Login ke Discord (Hanya sekali per sesi)
            if (!sessionStorage.getItem('logged_in')) {
                fetch(`${BACKEND_URL}/api/log-login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: user.displayName || user.email, email: user.email })
                });
                sessionStorage.setItem('logged_in', 'true');
            }

            if (role === "FOUNDER") {
                menu += `<a href="ownerarea.html" style="color:#ff4d4d">OWNER</a>`;
            }
            if (["MARGA", "FOUNDER"].includes(role)) {
                menu += `<a href="margaarea.html" style="color:#a855f7">MARGA</a>`;
            }
            menu += `<a href="#" onclick="handleLogout()">OUT</a>`;
        } catch (e) {
            menu += `<a href="#" onclick="handleLogout()">OUT</a>`;
        }
    } else {
        menu += `<a href="portal.html">LOGIN</a>`;
    }
    nav.innerHTML = menu;
});

// --- 3. FUNGSI POSTING TERPISAH (SOSIAL VS SYSTEM) ---
window.postContent = async (category) => {
    const btn = event.target;
    const judul = category === 'SOCIAL' ? document.getElementById('soc-title').value : document.getElementById('sys-title').value;
    const desc = category === 'SYSTEM' ? document.getElementById('sys-desc').value : "";
    const fileInput = category === 'SOCIAL' ? document.getElementById('soc-file') : document.getElementById('sys-file');

    if (!judul || !fileInput.files[0]) return alert("Lengkapi judul dan file!");

    btn.innerText = "UPLOADING...";
    btn.disabled = true;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('judul', judul);
    formData.append('desc', desc);
    formData.append('type', category); // Ini yang nentuin Webhook mana di Backend
    formData.append('author', auth.currentUser.displayName || "Founder");

    try {
        const res = await fetch(`${BACKEND_URL}/api/publish-project`, {
            method: "POST",
            body: formData
        });
        const result = await res.json();
        
        if (result.status === "success") {
            alert("✅ Berhasil di-Publish ke " + category);
            location.reload();
        } else {
            alert("Error: " + result.msg);
        }
    } catch (e) {
        alert("Gagal konek ke Backend Railway!");
    } finally {
        btn.innerText = category === 'SOCIAL' ? "POST TO MEDIA" : "UPDATE SYSTEM";
        btn.disabled = false;
    }
};

// --- 4. USER CONTROL & BAN LOG ---
window.updateUserRole = async () => {
    const uid = document.getElementById('target-uid').value;
    const role = document.getElementById('target-role').value;
    if (!uid) return alert("UID wajib diisi!");

    try {
        await db.collection("users").doc(uid).update({ role: role });
        
        // Jika role diubah ke BANNED, kirim log ke Discord
        if (role === "BANNED") {
            fetch(`${BACKEND_URL}/api/log-ban`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetName: uid,
                    reason: "Pelanggaran Komunitas",
                    adminName: auth.currentUser.displayName || "Founder"
                })
            });
        }
        alert("Role User Berhasil Diupdate!");
    } catch (e) {
        alert("Gagal update role. Pastikan UID benar.");
    }
};

// --- 5. LOGOUT ---
window.handleLogout = () => {
    auth.signOut().then(() => {
        sessionStorage.clear();
        window.location.href = "index.html";
    });
};

// --- 6. AUTO LOAD CONTENT (MEDIA & NEWS) ---
async function loadContent() {
    const mediaGrid = document.getElementById('media-grid');
    const newsFeed = document.getElementById('news-feed');

    if (mediaGrid || newsFeed) {
        try {
            const snap = await db.collection("announcements").orderBy("timestamp", "desc").limit(20).get();
            if (mediaGrid) mediaGrid.innerHTML = "";
            if (newsFeed) newsFeed.innerHTML = "";

            snap.forEach(doc => {
                const data = doc.data();
                if (mediaGrid && data.type === 'SOCIAL') {
                    mediaGrid.innerHTML += `
                        <div class="glass-card" style="padding:10px">
                            <img src="${data.image}" style="width:100%; border-radius:5px;">
                            <p style="font-size:12px; margin-top:5px;">${data.title}</p>
                        </div>`;
                }
                if (newsFeed && data.type === 'SYSTEM') {
                    newsFeed.innerHTML += `
                        <div class="glass-card">
                            <h3 style="color:var(--secondary)">${data.title}</h3>
                            <p style="font-size:14px; color:#ccc; margin:10px 0;">${data.content}</p>
                            <img src="${data.image}" style="width:100%; border-radius:5px; opacity:0.8">
                            <small style="color:#555">Posted by: ${data.author}</small>
                        </div>`;
                }
            });
        } catch (e) { console.error("Load Error:", e); }
    }
}

// Jalankan load content saat window terbuka
window.addEventListener('DOMContentLoaded', loadContent);
