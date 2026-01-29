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

// URL RAILWAY LU YANG ACTIVE ON PORT 8080
const BACKEND_URL = "https://beck-production-6c7d.up.railway.app";

// --- 2. RENDER NAVIGASI AMAN ---
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (!nav) return;

    // Menu dasar (supaya gak kosong pas loading)
    let menu = `<a href="/">HOME</a><a href="/media">MEDIA</a><a href="/announcement">NEWS</a>`;

    if (user) {
        try {
            const snap = await db.collection("users").doc(user.uid).get();
            const role = snap.data()?.role || "MEMBER";

            if (role === "FOUNDER") menu += `<a href="/vault/a7b2x" style="color:#ff4d4d">OWNER</a>`;
            if (["MARGA", "ADMIN", "FOUNDER"].includes(role)) menu += `<a href="/sector/n1o4c" style="color:#a855f7">MARGA</a>`;
            
            menu += `<a href="#" onclick="auth.signOut()">OUT</a>`;
            
            // Log Login ke Discord via Railway
            fetch(`${BACKEND_URL}/api/log-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: user.displayName, email: user.email })
            }).catch(() => console.log("Backend Railway offline"));

        } catch (e) {
            menu += `<a href="#" onclick="auth.signOut()">OUT</a>`;
        }
    } else {
        menu += `<a href="/auth/portal">LOGIN</a>`;
    }
    nav.innerHTML = menu;
});

// --- 3. FUNGSI UPLOAD PROJECT (FOUNDER PANEL) ---
async function postProject() {
    const btn = document.getElementById('btn-publish');
    const judul = document.getElementById('inp-judul')?.value;
    const desc = document.getElementById('inp-desc')?.value;
    const fileInput = document.getElementById('inp-file-project');

    if (!judul || !fileInput.files[0]) return alert("Judul dan Foto wajib ada!");

    btn.innerText = "UPLOADING TO DRIVE...";
    btn.disabled = true;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('judul', judul);
    formData.append('desc', desc);
    formData.append('author', auth.currentUser.displayName || "Founder");

    try {
        const response = await fetch(`${BACKEND_URL}/api/publish-project`, {
            method: "POST",
            body: formData
        });
        const result = await response.json();

        if (result.status === "success") {
            alert("🔥 BERHASIL! Project tayang di News & Drive.");
            location.reload();
        } else {
            alert("Gagal: " + result.msg);
        }
    } catch (err) {
        alert("Gagal konek ke Backend Railway!");
    } finally {
        btn.innerText = "PUBLISH PROJECT";
        btn.disabled = false;
    }
}

// --- 4. ANTI-INSPECT ---
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = (e) => {
    if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode))) return false;
};
