const firebaseConfig = {
    apiKey: "AIzaSyDLX4gTNGw_IQSdhXtSBl3utqCKFiwR2Hk",
    authDomain: "lpzone.firebaseapp.com",
    projectId: "lpzone",
    storageBucket: "lpzone.firebasestorage.app",
    messagingSenderId: "709883143619",
    appId: "1:709883143619:web:eab5fde631abdf7b548976"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const BACKEND_URL = "https://beck-production-6c7d.up.railway.app";

// --- RENDER NAVIGASI AMAN ---
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (!nav) return;

    // 1. Munculin menu basic dulu biar gak kosong melompong
    let menu = `<a href="/">HOME</a><a href="/media">MEDIA</a><a href="/announcement">NEWS</a>`;

    if (user) {
        try {
            // 2. Ambil data role dengan aman
            const snap = await db.collection("users").doc(user.uid).get();
            const role = snap.exists ? snap.data().role : "MEMBER";

            if (role === "FOUNDER") {
                menu += `<a href="/vault/a7b2x" style="color:#ff4d4d; font-weight:bold;">OWNER</a>`;
            }
            if (["MARGA", "ADMIN", "FOUNDER"].includes(role)) {
                menu += `<a href="/sector/n1o4c" style="color:#a855f7;">MARGA</a>`;
            }
            menu += `<a href="#" onclick="handleLogout()">OUT</a>`;

            // 3. Kirim Log Login (Silent, gak bakal ganggu UI)
            fetch(`${BACKEND_URL}/api/log-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: user.displayName, email: user.email })
            }).catch(() => console.log("Backend Offline"));

        } catch (e) {
            console.error("Gagal load role:", e);
            menu += `<a href="#" onclick="handleLogout()">OUT (Role Error)</a>`;
        }
    } else {
        menu += `<a href="/auth/portal">LOGIN</a>`;
    }
    
    // 4. Update tampilan navbar
    nav.innerHTML = menu;
});

// --- FUNGSI LOGOUT ---
window.handleLogout = function() {
    auth.signOut().then(() => { window.location.href = "/"; });
};

// --- GATEKEEPER TOMBOL MARGA ---
const btnMarga = document.getElementById('btn-marga');
if (btnMarga) {
    btnMarga.onclick = async () => {
        const user = auth.currentUser;
        if (!user) return alert("Login dulu Wak!");

        try {
            const snap = await db.collection("users").doc(user.uid).get();
            const role = snap.data()?.role || "MEMBER";

            if (["MARGA", "ADMIN", "FOUNDER"].includes(role)) {
                window.location.href = "/sector/n1o4c";
            } else {
                alert("⛔ AKSES DITOLAK: Khusus Marga Noctyra!");
            }
        } catch (err) {
            alert("Terjadi kesalahan sistem.");
        }
    };
}

// --- ANTI-INSPECT ---
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = (e) => {
    if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode))) return false;
};
