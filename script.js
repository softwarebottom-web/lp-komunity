// --- 1. FIREBASE CONFIG ---
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

// --- 2. LOGIC NAVIGASI (SATPAM MENU) ---
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (!nav) return; // Biar gak error kalau element nav gak ada

    if (user) {
        try {
            // Ambil Role dengan Timeout biar gak nunggu kelamaan
            const userDoc = await db.collection("users").doc(user.uid).get();
            const role = userDoc.data()?.role || "MEMBER";

            let menu = `
                <a href="/">HOME</a>
                <a href="/media">MEDIA</a>
                <a href="/announcement">NEWS</a>
            `;

            if (role === "FOUNDER") {
                menu += `<a href="/vault/a7b2x" style="color:#ff4747; font-weight:bold;">OWNER</a>`;
            }
            if (["MARGA", "ADMIN", "FOUNDER"].includes(role)) {
                menu += `<a href="/sector/n1o4c" style="color:#a855f7;">MARGA</a>`;
            }

            menu += `<a href="#" onclick="logout()">OUT</a>`;
            nav.innerHTML = menu;

            // Kirim Log Login ke Railway (Silent)
            fetch(`${BACKEND_URL}/api/log-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: user.displayName, email: user.email })
            }).catch(e => console.log("Backend offline, log skipped."));

        } catch (err) {
            // Jika Firestore error, tampilin menu basic aja biar gak kosong
            nav.innerHTML = `<a href="/">HOME</a><a href="/media">MEDIA</a><a href="#" onclick="logout()">OUT (Error Load Role)</a>`;
        }
    } else {
        nav.innerHTML = `<a href="/">HOME</a><a href="/auth/portal">LOGIN</a>`;
    }
});

// --- 3. FUNGSI LOGOUT ---
function logout() {
    auth.signOut().then(() => {
        window.location.href = "/";
    });
}

// --- 4. LOGIC UPLOAD (FOUNDER PANEL) ---
async function postProject() {
    const judul = document.getElementById('inp-judul')?.value;
    const desc = document.getElementById('inp-desc')?.value;
    const fileInput = document.getElementById('inp-file-project');
    const btn = document.getElementById('btn-publish');

    if (!judul || !desc || !fileInput.files[0]) {
        return alert("Lengkapi data project (Judul, Deskripsi, & Foto)!");
    }

    btn.innerText = "UPLOADING...";
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
            alert("🔥 BERHASIL! Project mendarat di Drive & Firestore.");
            location.reload();
        } else {
            alert("Error: " + result.msg);
        }
    } catch (err) {
        alert("Gagal konek ke Railway. Cek apakah server Railway lu Active?");
    } finally {
        btn.innerText = "PUBLISH PROJECT";
        btn.disabled = false;
    }
}

// --- 5. KEAMANAN (ANTI-INSPECT) ---
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = (e) => {
    if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode)) || (e.ctrlKey && e.keyCode == 85)) {
        return false;
    }
};
