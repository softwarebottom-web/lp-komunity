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

// URL RAILWAY LU (ACTIVE PORT 8080)
const BACKEND_URL = "https://beck-production-6c7d.up.railway.app";

// --- 2. RENDER NAVIGASI & BANNED CHECK ---
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (!nav) return;

    let menu = `<a href="/">HOME</a><a href="/media">MEDIA</a><a href="/announcement">NEWS</a>`;

    if (user) {
        try {
            const snap = await db.collection("users").doc(user.uid).get();
            const userData = snap.data();
            const role = userData?.role || "MEMBER";

            // PROTEKSI BANNED
            if (role === "BANNED") {
                alert("⛔ AKSES DITOLAK: Akun lu telah diblacklist!");
                auth.signOut();
                window.location.href = "/auth/portal";
                return;
            }

            if (role === "FOUNDER") menu += `<a href="/vault/a7b2x" style="color:#ff4d4d">OWNER</a>`;
            if (["MARGA", "ADMIN", "FOUNDER"].includes(role)) menu += `<a href="/sector/n1o4c" style="color:#a855f7">MARGA</a>`;
            
            menu += `<a href="#" onclick="auth.signOut()">OUT</a>`;
            
            // Log Login Silent
            fetch(`${BACKEND_URL}/api/log-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: user.displayName, email: user.email })
            }).catch(() => {});

        } catch (e) {
            menu += `<a href="#" onclick="auth.signOut()">OUT</a>`;
        }
    } else {
        menu += `<a href="/auth/portal">LOGIN</a>`;
    }
    nav.innerHTML = menu;
});

// --- 3. FUNGSI POSTING (PROJECT, ANNOUNCEMENT, CHANGELOGS) ---
async function postProject() {
    const btn = document.getElementById('btn-publish');
    const type = document.getElementById('post-type')?.value || "PROJECT";
    const judul = document.getElementById('inp-judul')?.value;
    const desc = document.getElementById('inp-desc')?.value;
    const fileInput = document.getElementById('inp-file-project');

    if (!judul || !fileInput.files[0]) return alert("Judul dan Foto wajib ada!");

    btn.innerText = "UPLOADING...";
    btn.disabled = true;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('judul', judul);
    formData.append('desc', desc);
    formData.append('type', type);
    formData.append('author', auth.currentUser.displayName || "Founder");

    try {
        const response = await fetch(`${BACKEND_URL}/api/publish-project`, {
            method: "POST",
            body: formData
        });
        const result = await response.json();

        if (result.status === "success") {
            // Save metadata ke Firestore
            await db.collection("announcements").add({
                title: judul,
                content: desc,
                type: type,
                image: result.url,
                author: auth.currentUser.displayName,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert(`🔥 ${type} BERHASIL DIPUBLISH!`);
            location.reload();
        }
    } catch (err) {
        alert("Gagal konek ke Railway!");
    } finally {
        btn.innerText = "PUBLISH PROJECT";
        btn.disabled = false;
    }
}

// --- 4. AUTHORITY CONTROL (BAN, PROMOTE, UPDATE ROLE) ---
async function updateUserRole() {
    const uid = document.getElementById('target-uid')?.value;
    const role = document.getElementById('target-role')?.value;
    
    if(!uid) return alert("UID-nya mana Wak?");
    
    try {
        await db.collection("users").doc(uid).update({ role: role });
        alert(`Berhasil! Status User telah diupdate ke: ${role}`);
        
        // Log Admin Action
        fetch(`${BACKEND_URL}/api/log-admin`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ action: "ROLE_CHANGE", target: uid, newRole: role, actor: auth.currentUser.email })
        }).catch(() => {});
    } catch (e) {
        alert("Gagal update! Cek UID lagi.");
    }
}

// --- 5. AUTO-LOAD CONTENT (NEWS & MEDIA) ---
async function loadContent() {
    const newsFeed = document.getElementById('news-feed-container');
    const mediaGrid = document.getElementById('media-grid');

    if (newsFeed || mediaGrid) {
        const snap = await db.collection("announcements").orderBy("timestamp", "desc").get();
        const docs = snap.docs.map(doc => doc.data());

        if (newsFeed) {
            newsFeed.innerHTML = docs.map(data => `
                <div class="panel-box" style="text-align:left; margin-bottom:20px;">
                    <span style="color:#a855f7; font-size:12px; font-weight:bold;">[${data.type}]</span>
                    <h3>${data.title}</h3>
                    <p>${data.content}</p>
                    ${data.image ? `<img src="${data.image}" style="width:100%; border-radius:4px; margin-top:10px;">` : ''}
                </div>
            `).join('');
        }

        if (mediaGrid) {
            mediaGrid.innerHTML = docs.filter(d => d.image).map(data => `
                <div class="media-card">
                    <img src="${data.image}" style="width:100%; height:200px; object-fit:cover; border-radius:4px; border:1px solid #333;">
                    <p style="font-size:12px; margin-top:5px;">${data.title}</p>
                </div>
            `).join('');
        }
    }
}

// Jalankan load content saat window terbuka
window.onload = loadContent;

// --- 6. ANTI-INSPECT ---
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = (e) => {
    if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode)) || (e.ctrlKey && e.keyCode == 85)) return false;
};
