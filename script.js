const firebaseConfig = { /* CONFIG LU TETAP SAMA */ };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const BACKEND_URL = "https://beck-production-6c7d.up.railway.app";

// --- NAVIGASI ---
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (!nav) return;
    let menu = '<a href="index.html">HOME</a><a href="media.html">MEDIA</a>';
    
    if (user) {
        const snap = await db.collection("users").doc(user.uid).get();
        const role = snap.data()?.role || "MEMBER";
        // Roleplay dikurangi, jadi Admin Area
        if (["FOUNDER", "ADMIN"].includes(role)) menu += '<a href="ownerarea.html" style="color:cyan">ADMIN AREA</a>';
        menu += '<a href="#" onclick="auth.signOut()">LOGOUT</a>';
    } else {
        menu += '<a href="portal.html">LOGIN</a>';
    }
    nav.innerHTML = menu;
});

// --- POSTING SYSTEM (LINK BASED) ---
window.postContent = async () => {
    const title = document.getElementById('inp-title').value;
    const desc = document.getElementById('inp-desc').value;
    const url = document.getElementById('inp-url').value;
    const platform = document.getElementById('inp-platform').value;
    const type = document.getElementById('inp-type').value; // SOCIAL atau SYSTEM

    if (!title || !url) return alert("Judul dan Link wajib diisi!");

    const btn = document.getElementById('btn-post');
    btn.innerText = "SENDING...";
    btn.disabled = true;

    try {
        const res = await fetch(`${BACKEND_URL}/api/publish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title, desc, url, platform, type,
                author: auth.currentUser.displayName || "Admin"
            })
        });
        const result = await res.json();
        if (result.status === "success") {
            alert("✅ Terposting!");
            location.reload();
        } else {
            alert("Gagal: " + result.msg);
        }
    } catch (e) {
        alert("Server Error!");
    } finally {
        btn.innerText = "PUBLISH";
        btn.disabled = false;
    }
};

// --- LOAD MEDIA ---
async function loadMedia() {
    const grid = document.getElementById('media-grid');
    if (!grid) return;
    
    // Ambil data dari koleksi 'posts'
    const snap = await db.collection("posts").where("type", "==", "SOCIAL").orderBy("timestamp", "desc").get();
    
    grid.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        let badgeColor = "#333";
        if(d.platform === "YOUTUBE") badgeColor = "#ff0000";
        if(d.platform === "TIKTOK") badgeColor = "#00f2ea";
        if(d.platform === "INSTAGRAM") badgeColor = "#E1306C";

        return `
            <div class="glass-card">
                <span style="background:${badgeColor}; padding:2px 8px; font-size:10px; border-radius:4px;">${d.platform}</span>
                <h4 style="margin:10px 0">${d.title}</h4>
                <a href="${d.url}" target="_blank" style="color:cyan; font-size:12px;">🔗 OPEN LINK</a>
                <p style="font-size:12px; color:#aaa; margin-top:5px;">${d.desc}</p>
            </div>
        `;
    }).join('');
}
window.onload = loadMedia;
