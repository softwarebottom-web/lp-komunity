// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyDLX4gTNGw_IQSdhXtSBl3utqCKFiwR2Hk",
    authDomain: "lpzone.firebaseapp.com",
    projectId: "lpzone",
    storageBucket: "lpzone.firebasestorage.app",
    messagingSenderId: "709883143619",
    appId: "1:709883143619:web:eab5fde631abdf7b548976"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// URL Backend Railway Lu
const BACKEND_URL = "https://lpzone-backend-production.up.railway.app"; 

// --- 1. GATEKEEPER TOMBOL MARGA ---
const btnMarga = document.getElementById('btn-marga');
if (btnMarga) {
    btnMarga.onclick = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("⚠️ AKSES DITOLAK: Silahkan Login Terlebih Dahulu!");
            window.location.href = "/auth/portal";
            return;
        }

        try {
            // Cek Role di Firestore
            const doc = await db.collection("users").doc(user.uid).get();
            const role = doc.data()?.role || "MEMBER";

            if (["MARGA", "ADMIN", "FOUNDER"].includes(role)) {
                // Berhasil: Masuk ke Sector (Dihandle oleh vercel.json rewrites)
                window.location.href = "/sector/n1o4c";
            } else {
                alert("⛔ BUKAN OTORITAS LU! Marga Noctyra Only.");
            }
        } catch (err) {
            console.error("Auth Error:", err);
            alert("Gagal memvalidasi otoritas.");
        }
    };
}

// --- 2. NAVIGASI DINAMIS & LOGIN LOG ---
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (user) {
        const doc = await db.collection("users").doc(user.uid).get();
        const role = doc.data()?.role || "MEMBER";

        let menu = `<a href="/">HOME</a><a href="/media">MEDIA</a><a href="/announcement">NEWS</a>`;
        
        // Menu Admin/Founder Area
        if (role === "FOUNDER") menu += `<a href="/vault/a7b2x" style="color:red">VAULT</a>`;
        if (["ADMIN", "FOUNDER"].includes(role)) menu += `<a href="/core/z9p3m" style="color:cyan">CORE</a>`;
        
        menu += `<a href="#" id="logout-btn">OUT</a>`;
        nav.innerHTML = menu;

        document.getElementById('logout-btn').onclick = () => auth.signOut().then(() => location.reload());
    } else {
        nav.innerHTML = `<a href="/">HOME</a><a href="/auth/portal">LOGIN</a>`;
    }
});

// --- 3. CYBER SECURITY (Anti-F12 / Anti-Inspect) ---
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = (e) => {
    // Blokir F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (e.keyCode == 123 || 
        (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode)) || 
        (e.ctrlKey && e.keyCode == 85)) {
        return false;
    }
};
