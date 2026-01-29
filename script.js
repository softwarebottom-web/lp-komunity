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

// URL RAILWAY LU (LANGSUNG TEMBAK)
const BACKEND_URL = "https://beck-production-6c7d.up.railway.app";

// --- 2. NAVIGASI STANDAR (TANPA REWRITE) ---
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (!nav) return;

    // Link langsung ke file .html asli biar gak 404
    let menu = `
        <a href="index.html">HOME</a>
        <a href="media.html">MEDIA</a>
        <a href="announcement.html">NEWS</a>
    `;

    if (user) {
        try {
            const snap = await db.collection("users").doc(user.uid).get();
            const role = snap.data()?.role || "MEMBER";

            if (role === "FOUNDER") {
                menu += `<a href="ownerarea.html" style="color:#ff4d4d">OWNER</a>`;
            }
            if (["MARGA", "FOUNDER"].includes(role)) {
                menu += `<a href="margaarea.html" style="color:#a855f7">MARGA</a>`;
            }
            menu += `<a href="#" onclick="auth.signOut()">OUT</a>`;
        } catch (e) {
            menu += `<a href="#" onclick="auth.signOut()">OUT</a>`;
        }
    } else {
        menu += `<a href="portal.html">LOGIN</a>`;
    }
    nav.innerHTML = menu;
});

// --- 3. FUNGSI POSTING (KEMBALI KE ASAL) ---
window.postProject = async () => {
    const btn = document.getElementById('btn-publish');
    const judul = document.getElementById('inp-judul')?.value;
    const desc = document.getElementById('inp-desc')?.value;
    const fileInput = document.getElementById('inp-file-project');

    if (!judul || !fileInput.files[0]) return alert("Lengkapi data!");

    btn.innerText = "UPLOADING...";
    btn.disabled = true;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('judul', judul);
    formData.append('desc', desc);
    formData.append('author', auth.currentUser.displayName || "Founder");

    try {
        const res = await fetch(`${BACKEND_URL}/api/publish-project`, {
            method: "POST",
            body: formData
        });
        const result = await res.json();
        if (result.status === "success") {
            alert("GAS! Berhasil.");
            location.reload();
        }
    } catch (e) {
        alert("Railway Lu Bermasalah!");
    } finally {
        btn.innerText = "PUBLISH PROJECT";
        btn.disabled = false;
    }
};
