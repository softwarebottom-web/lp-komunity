// --- CONFIG ---
const URL_LAB = "https://link-lab-lu.com"; 
const URL_STORE = "https://link-store-lu.com";

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
const BACKEND_URL = "https://beck-production-6c7d.up.railway.app"; // URL RAILWAY LU

// --- 1. NAVIGASI & AUTH CHECK ---
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if (!nav) return;

    let role = "GUEST";
    
    if (user) {
        // Log Login (Sekali per sesi)
        if (!sessionStorage.getItem('logged')) {
            fetch(`${BACKEND_URL}/api/log-login`, {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ name: user.displayName, email: user.email, uid: user.uid })
            });
            sessionStorage.setItem('logged', 'true');
        }

        try {
            const snap = await db.collection("users").doc(user.uid).get();
            role = snap.data()?.role || "MEMBER";
            
            // CEK BANNED
            if(role === "BANNED") {
                alert("AKSES DITOLAK: Akun anda telah di-BANNED.");
                auth.signOut();
                window.location.href = "index.html";
                return;
            }
        } catch (e) { console.log("Role error"); }
    }

    // RENDER MENU
    let menu = `
        <a href="index.html" class="nav-brand">ZANE<span style="color:#a855f7">DEV</span></a>
        <div class="nav-links">
            <a href="general.html">CHAT</a>
            <a href="media.html">MEDIA</a>
            <a href="announcement.html">NEWS</a>
    `;

    if (user) {
        if (["MARGA", "FOUNDER"].includes(role)) menu += `<a href="margaarea.html" style="color:#00f2ea">MARGA HQ</a>`;
        if (["FOUNDER"].includes(role)) menu += `<a href="ownerarea.html" style="color:#ff4d4d">OWNER</a>`;
        menu += `<a href="#" onclick="logout()" style="color:#666; font-size:12px; margin-left:20px">LOGOUT</a></div>`;
    } else {
        menu += `<a href="portal.html" class="btn-login" style="margin-left:20px">LOGIN</a></div>`;
    }
    nav.innerHTML = menu;
});

// --- 2. LOGIN DISCORD (FIX NAME) ---
window.loginDiscord = () => {
    const provider = new firebase.auth.OAuthProvider('discord.com');
    provider.addScope('identify'); 
    
    auth.signInWithPopup(provider).then((res) => {
        const profile = res.additionalUserInfo.profile;
        const discordName = profile.username || profile.global_name || res.user.displayName; 

        db.collection("users").doc(res.user.uid).set({
            name: discordName, 
            email: res.user.email,
            role: "MEMBER", 
            margaRank: "HOMIES",
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => {
            window.location.href = "index.html";
        });
    }).catch(err => alert("Error: " + err.message));
};

// Login Email Manual (Opsional)
window.handleEmailLogin = (e) => {
    e.preventDefault();
    auth.signInWithEmailAndPassword(document.getElementById('signin-email').value, document.getElementById('signin-password').value)
        .then(() => window.location.href="index.html")
        .catch(err => alert(err.message));
};

window.logout = () => auth.signOut().then(() => window.location.href="index.html");

// --- 3. POST CONTENT (LINK SYSTEM) ---
window.postContent = async () => {
    const title = document.getElementById('inp-title').value;
    const url = document.getElementById('inp-url').value;
    const platform = document.getElementById('inp-platform').value;
    const type = document.getElementById('inp-type').value;
    const desc = document.getElementById('inp-desc').value;

    if (!title) return alert("Isi Judul!");
    
    try {
        await fetch(`${BACKEND_URL}/api/publish`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, desc, url, platform, type, author: auth.currentUser.displayName })
        });
        alert("Published!"); location.reload();
    } catch (e) { alert("Error Backend"); }
};

// --- 4. MARGA LOGIC (STRUCTURE & ARCHIVE) ---
async function renderStructure() {
    const container = document.getElementById('structure-tree');
    if (!container) return;

    const snap = await db.collection("users").where("role", "in", ["MARGA", "FOUNDER"]).get();
    const users = snap.docs.map(d => d.data());

    const renderCard = (name, rank, color) => `
        <div class="glass-card" style="border:1px solid ${color}; padding:10px; margin:5px; text-align:center; min-width:120px;">
            <strong style="color:${color}; display:block; font-size:14px;">${rank.toUpperCase()}</strong>
            <span style="font-size:12px;">${name}</span>
        </div>`;
    
    // Filter Rank
    const godfather = users.find(u => u.role === "FOUNDER") || {name: "Zane Nocytra"};
    const underboss = users.filter(u => u.margaRank === "Under Boss");
    const resident = users.filter(u => u.margaRank === "Resident");
    const elcapo = users.filter(u => u.margaRank === "El Capo");
    const capo = users.filter(u => u.margaRank === "Capo");
    const homies = users.filter(u => u.role === "MARGA" && (!u.margaRank || u.margaRank === "HOMIES"));

    container.innerHTML = `
        <div style="display:flex; justify-content:center; margin-bottom:20px;">${renderCard(godfather.name, "GODFATHER", "#ff0000")}</div>
        <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">${underboss.map(u => renderCard(u.name, "Under Boss", "#ff4d4d")).join('')}</div>
        <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:10px;">
            ${resident.map(u => renderCard(u.name, "Resident", "#a855f7")).join('')}
            ${elcapo.map(u => renderCard(u.name, "El Capo", "#3b82f6")).join('')}
            ${capo.map(u => renderCard(u.name, "Capo", "#00f2ea")).join('')}
        </div>
        <div style="margin-top:20px; border-top:1px solid #333; padding-top:10px;">
            <h4 style="text-align:center; color:#888;">NOCYTRA HOMIES</h4>
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(100px, 1fr)); gap:10px;">
                ${homies.map(u => `<div style="background:#111; padding:5px; text-align:center; font-size:12px; border-radius:4px;">${u.name}</div>`).join('')}
            </div>
        </div>
    `;
}

window.postArchive = async () => {
    const title = document.getElementById('arc-title').value;
    const url = document.getElementById('arc-url').value;
    const desc = document.getElementById('arc-desc').value;
    await fetch(`${BACKEND_URL}/api/post-archive`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ title, url, desc, author: auth.currentUser.displayName })
    });
    alert("Archived!"); location.reload();
};

if(window.location.href.includes("margaarea.html")) window.onload = renderStructure;

// --- 5. OWNER CONTROL (UPDATE/BAN) ---
window.updateRank = async () => {
    const uid = document.getElementById('target-uid').value;
    const rankVal = document.getElementById('target-rank').value;
    
    let newRole = "MEMBER"; 
    let newRank = null;

    if (rankVal === "BANNED") { newRole = "BANNED"; }
    else if (["HOMIES", "Capo", "El Capo", "Resident", "Under Boss"].includes(rankVal)) { newRole = "MARGA"; newRank = rankVal; }
    
    const btn = event.target; btn.innerText = "...";
    try {
        await fetch(`${BACKEND_URL}/api/update-user`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ targetUid: uid, newRole, newRank, adminName: auth.currentUser.displayName })
        });
        alert("Updated!");
    } catch(e) { alert("Error"); }
    btn.innerText = "APPLY";
};

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
