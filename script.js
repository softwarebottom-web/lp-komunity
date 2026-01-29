// --- 1. CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDLX4gTNGw_IQSdhXtSBl3utqCKFiwR2Hk",
    authDomain: "lpzone.firebaseapp.com",
    projectId: "lpzone",
    storageBucket: "lpzone.firebasestorage.app",
    messagingSenderId: "709883143619",
    appId: "1:709883143619:web:eab5fde631abdf7b548976"
};

// GANTI LINK DI BAWAH INI DENGAN LINK WEBSITE LU YANG ASLI
const URL_LAB = "https://www.laboratorium-project.web.id/";   // Masukin Link Lab
const URL_STORE = "https://www.digital-store-fikri.biz.id/"; // Masukin Link Store

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const BACKEND_URL = "https://beck-production-6c7d.up.railway.app";

// --- 2. NAVIGASI LENGKAP ---
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (!nav) return;

    // Menu Dasar (Selalu Muncul)
    let menu = `
        <a href="index.html">HOME</a>
        <a href="media.html">MEDIA</a>
        <a href="announcement.html">NEWS</a>
        <a href="${URL_LAB}" target="_blank" style="color:#3b82f6">LAB</a>
        <a href="${URL_STORE}" target="_blank" style="color:#a855f7">STORE</a>
    `;
    
    // Menu Khusus Login
    if (user) {
        try {
            const snap = await db.collection("users").doc(user.uid).get();
            const role = snap.data()?.role || "MEMBER";
            
            // Cuma FOUNDER/ADMIN yang bisa masuk panel Admin
            if (["FOUNDER", "ADMIN"].includes(role)) {
                menu += `<a href="ownerarea.html" style="color:red; font-weight:900;">ADMIN</a>`;
            }
            menu += `<a href="#" onclick="handleLogout()">LOGOUT</a>`;
        } catch (e) {
            menu += `<a href="#" onclick="handleLogout()">LOGOUT</a>`;
        }
    } else {
        menu += `<a href="portal.html">LOGIN</a>`;
    }
    nav.innerHTML = menu;
});

// --- 3. FUNGSI LOGOUT ---
window.handleLogout = () => {
    auth.signOut().then(() => { location.href = "index.html"; });
};

// --- 4. POST CONTENT (LINK SYSTEM - NO UPLOAD) ---
window.postContent = async () => {
    const title = document.getElementById('inp-title').value;
    const url = document.getElementById('inp-url').value;
    const platform = document.getElementById('inp-platform').value;
    const type = document.getElementById('inp-type').value;
    const desc = document.getElementById('inp-desc').value;

    if (!title || !url) return alert("Judul dan Link wajib diisi!");

    const btn = document.getElementById('btn-post');
    btn.innerText = "PUBLISHING...";
    btn.disabled = true;

    try {
        const res = await fetch(`${BACKEND_URL}/api/publish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title, desc, url, platform, type,
                author: auth.currentUser.displayName || "Zane Admin"
            })
        });

        const result = await res.json();
        if (result.status === "success") {
            alert("✅ Webhook Sent & Data Saved!");
            location.reload();
        } else {
            alert("Gagal: " + result.msg);
        }
    } catch (e) {
        alert("Backend Error! Cek Railway.");
    } finally {
        btn.innerText = "PUBLISH";
        btn.disabled = false;
    }
};

// --- 5. LOAD CONTENT (MEDIA & NEWS) ---
async function loadContent() {
    const mediaGrid = document.getElementById('media-grid');
    const newsFeed = document.getElementById('news-feed');

    if (mediaGrid || newsFeed) {
        // Tarik data dari koleksi 'posts'
        const snap = await db.collection("posts").orderBy("timestamp", "desc").limit(20).get();
        
        snap.forEach(doc => {
            const d = doc.data();
            
            // RENDER MEDIA (YOUTUBE, TIKTOK, IG)
            if (mediaGrid && d.type === 'SOCIAL') {
                let badgeColor = "#333";
                if(d.platform === "YOUTUBE") badgeColor = "#ff0000";
                if(d.platform === "TIKTOK") badgeColor = "#00f2ea";
                if(d.platform === "INSTAGRAM") badgeColor = "#E1306C";

                mediaGrid.innerHTML += `
                    <div class="glass-card" style="position:relative; overflow:hidden;">
                        <span style="background:${badgeColor}; position:absolute; top:10px; right:10px; padding:2px 8px; font-size:10px; border-radius:4px; font-weight:bold;">${d.platform}</span>
                        <h4 style="margin-top:20px; color:white;">${d.title}</h4>
                        <p style="font-size:12px; color:#aaa; margin-bottom:10px;">${d.desc}</p>
                        <a href="${d.url}" target="_blank" class="btn-purple" style="display:block; text-align:center; text-decoration:none; padding:8px; font-size:12px;">OPEN LINK 🔗</a>
                    </div>
                `;
            }

            // RENDER NEWS/CHANGELOGS
            if (newsFeed && d.type === 'SYSTEM') {
                newsFeed.innerHTML += `
                    <div class="glass-card">
                        <h3 style="color:#3b82f6;">${d.title}</h3>
                        <p style="font-size:14px; margin:10px 0;">${d.desc}</p>
                        ${d.url ? `<a href="${d.url}" target="_blank" style="color:cyan; font-size:12px;">[See Reference]</a>` : ''}
                        <hr style="border:0; border-top:1px solid #333; margin:10px 0;">
                        <small style="color:#666;">Posted by: ${d.author}</small>
                    </div>
                `;
            }
        });
    }
}
window.onload = loadContent;
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
