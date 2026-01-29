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
const BACKEND_URL = "https://beck-production-6c7d.up.railway.app";

// --- 2. RENDER NAVIGASI (SAFE MODE) ---
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (!nav) return;

    // Menu Default (Muncul duluan biar gak kosong)
    let menu = `
        <a href="index.html">HOME</a>
        <a href="media.html">MEDIA</a>
        <a href="announcement.html">NEWS</a>
    `;

    if (user) {
        try {
            // Ambil Role User
            const snap = await db.collection("users").doc(user.uid).get();
            const role = snap.exists ? snap.data().role : "MEMBER";

            if (role === "FOUNDER") {
                menu += `<a href="ownerarea.html" style="color:#ff4d4d">OWNER</a>`;
            }
            if (["MARGA", "ADMIN", "FOUNDER"].includes(role)) {
                menu += `<a href="margaarea.html" style="color:#a855f7">MARGA</a>`;
            }
            menu += `<a href="#" onclick="handleLogout()">OUT</a>`;
        } catch (e) {
            console.log("Nav Error:", e);
            menu += `<a href="#" onclick="handleLogout()">OUT</a>`;
        }
    } else {
        menu += `<a href="portal.html">LOGIN</a>`;
    }
    nav.innerHTML = menu;
});

// --- 3. FUNGSI LOGOUT ---
window.handleLogout = function() {
    auth.signOut().then(() => { window.location.href = "index.html"; });
};

// --- 4. FUNGSI POSTING (DUAL CATEGORY) ---
window.postContent = async (category) => {
    const btn = event.target; // Ambil tombol yang diklik
    const title = category === 'SOCIAL' ? document.getElementById('soc-title').value : document.getElementById('sys-title').value;
    const desc = category === 'SYSTEM' ? document.getElementById('sys-desc').value : "";
    const fileInput = category === 'SOCIAL' ? document.getElementById('soc-file') : document.getElementById('sys-file');
    
    if (!title || !fileInput.files[0]) return alert("Data belum lengkap!");

    btn.innerText = "UPLOADING...";
    btn.disabled = true;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('judul', title);
    formData.append('desc', desc);
    formData.append('type', category);
    formData.append('author', auth.currentUser.displayName || "Founder");

    try {
        const res = await fetch(`${BACKEND_URL}/api/publish-project`, { method: "POST", body: formData });
        const result = await res.json();
        
        if (result.status === "success") {
            // Simpan ke Firestore
            await db.collection("announcements").add({
                title, content: desc, type: category, image: result.url,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("🔥 Berhasil di-Publish!");
            location.reload();
        }
    } catch (e) {
        alert("Gagal konek ke Railway! Cek dashboard Railway lu.");
    } finally {
        btn.innerText = category === 'SOCIAL' ? "POST TO MEDIA" : "UPDATE SYSTEM";
        btn.disabled = false;
    }
};

// --- 5. USER ROLE CONTROL ---
window.updateUserRole = async () => {
    const uid = document.getElementById('target-uid').value;
    const role = document.getElementById('target-role').value;
    if(!uid) return alert("UID mana?");
    
    try {
        await db.collection("users").doc(uid).update({ role: role });
        alert("Role Berhasil Diupdate!");
    } catch (e) { alert("Error: UID tidak ditemukan."); }
};
