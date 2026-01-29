// --- 1. CONFIGURATION & INITIALIZATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDLX4gTNGw_IQSdhXtSBl3utqCKFiwR2Hk",
    authDomain: "lpzone.firebaseapp.com",
    projectId: "lpzone",
    storageBucket: "lpzone.firebasestorage.app",
    messagingSenderId: "709883143619",
    appId: "1:709883143619:web:eab5fde631abdf7b548976"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// LINK BACKEND RAILWAY LU (Dah Active on Port 8080)
const BACKEND_URL = "https://beck-production-6c7d.up.railway.app"; 

// --- 2. AUTH & LOGIN LOGS ---
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (user && nav) {
        // Ambil Data User & Role
        const userDoc = await db.collection("users").doc(user.uid).get();
        const role = userDoc.data()?.role || "MEMBER";

        // Kirim Log Login ke Backend (Discord Webhook)
        await fetch(`${BACKEND_URL}/api/log-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: user.displayName, email: user.email })
        });

        // Navigasi Dinamis Berdasarkan Role
        let menu = `<a href="/">HOME</a><a href="/media">MEDIA</a>`;
        if (role === "FOUNDER") menu += `<a href="/vault/a7b2x" style="color:#ff0000">OWNER AREA</a>`;
        if (["MARGA", "ADMIN", "FOUNDER"].includes(role)) menu += `<a href="/sector/n1o4c" style="color:#a855f7">MARGA SECTOR</a>`;
        menu += `<a href="#" onclick="auth.signOut()">OUT</a>`;
        nav.innerHTML = menu;
    } else if (nav) {
        nav.innerHTML = `<a href="/">HOME</a><a href="/auth/portal">LOGIN</a>`;
    }
});

// --- 3. PUBLISH PROJECT (FOUNDER PANEL) ---
// Fungsi ini dipanggil dari form upload di Owner Area
async function postProject() {
    const judul = document.getElementById('inp-judul').value;
    const desc = document.getElementById('inp-desc').value;
    const fileInput = document.getElementById('inp-file-project');
    const btn = document.getElementById('btn-publish');

    if (!judul || !desc || !fileInput.files[0]) return alert("Lengkapi data project!");

    btn.innerText = "Processing...";
    btn.disabled = true;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('judul', judul);
    formData.append('desc', desc);
    formData.append('author', auth.currentUser.displayName || "Founder");

    try {
        // Menembak ke Endpoint Railway (Firestore + Drive + Discord)
        const response = await fetch(`${BACKEND_URL}/api/publish-project`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.status === "success") {
            alert("🔥 Project Berhasil Ditayangkan!");
            window.location.href = "/announcement";
        } else {
            alert("Gagal: " + result.msg);
        }
    } catch (err) {
        console.error("Error upload:", err);
        alert("Server Railway lu lagi sibuk atau down!");
    } finally {
        btn.innerText = "Publish Project";
        btn.disabled = false;
    }
}

// --- 4. MARGA SECTOR GATEKEEPER ---
const btnMarga = document.getElementById('btn-marga');
if (btnMarga) {
    btnMarga.onclick = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("Login dulu Wak!");
            window.location.href = "/auth/portal";
            return;
        }

        const snap = await db.collection("users").doc(user.uid).get();
        const role = snap.data()?.role || "MEMBER";

        if (["MARGA", "ADMIN", "FOUNDER"].includes(role)) {
            // Berhasil: Masuk ke Sector (Dihandle oleh vercel.json rewrites)
            window.location.href = "/sector/n1o4c";
        } else {
            alert("⛔ AKSES DITOLAK: Lu bukan bagian dari Marga Noctyra!");
        }
    };
}

// --- 5. CYBER SECURITY (ANTI-INSPECT & F12) ---
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = (e) => {
    // Blokir F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (e.keyCode == 123 || 
        (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode)) || 
        (e.ctrlKey && e.keyCode == 85)) {
        return false;
    }
};
