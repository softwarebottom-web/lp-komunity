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
const BACKEND_URL = "https://beck-production-6c7d.up.railway.app";

// --- 1. BOTTOM NAVIGASI & AUTH CHECK ---
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    const statusText = document.getElementById('user-status');
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
            
            if(role === "BANNED") {
                alert("AKSES DITOLAK: Akun anda telah di-BANNED.");
                auth.signOut();
                window.location.href = "index.html";
                return;
            }
            if(statusText) statusText.innerText = `Identity: ${user.displayName} [${role}]`;
        } catch (e) { console.log("Role error"); }
    } else {
        if(statusText) statusText.innerText = "Login to access secure channels.";
    }

    // RENDER BOTTOM NAV BERJEJER (MOBILE STYLE)
    let menu = `
        <a href="index.html"><span>🏠</span>HOME</a>
        <a href="media.html"><span>📸</span>MEDIA</a>
        <a href="announcement.html"><span>📢</span>NEWS</a>
        <a href="general.html"><span>💬</span>CHAT</a>
    `;

    if (user) {
        if (["MARGA", "FOUNDER"].includes(role)) menu += `<a href="margaarea.html"><span>🩸</span>HQ</a>`;
        if (["FOUNDER"].includes(role)) menu += `<a href="ownerarea.html"><span>👑</span>OWNER</a>`;
        menu += `<a href="#" onclick="logout()"><span>🚪</span>OUT</a>`;
    } else {
        menu += `<a href="portal.html"><span>🔑</span>LOGIN</a>`;
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

window.logout = () => auth.signOut().then(() => {
    sessionStorage.clear();
    window.location.href="index.html";
});

// --- 3. POST CONTENT (LINK SYSTEM) ---
window.postContent = async () => {
    const title = document.getElementById('inp-title').value;
    const url = document.getElementById('inp-url').value;
    const platform = document.getElementById('inp-platform').value;
    const type = document.getElementById('inp-type').value;
    const desc = document.getElementById('inp-desc').value;

    if (!title || !url) return alert("Isi Judul & Link!");
    
    const btn = event.target;
    btn.innerText = "PUBLISHING...";
    btn.disabled = true;

    try {
        await fetch(`${BACKEND_URL}/api/publish`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, desc, url, platform, type, author: auth.currentUser.displayName })
        });
        alert("Published & Logged to Discord!"); 
        location.reload();
    } catch (e) { alert("Error Backend Railway!"); }
    finally { btn.innerText = "PUBLISH"; btn.disabled = false; }
};

// --- 4. LOAD CONTENT (MEDIA & NEWS) ---
async function loadAllContent() {
    const mediaGrid = document.getElementById('media-grid');
    const newsFeed = document.getElementById('news-feed');

    if (mediaGrid || newsFeed) {
        const snap = await db.collection("posts").orderBy("timestamp", "desc").limit(20).get();
        if(mediaGrid) mediaGrid.innerHTML = "";
        if(newsFeed) newsFeed.innerHTML = "";

        snap.forEach(doc => {
            const d = doc.data();
            if (mediaGrid && d.type === 'SOCIAL') {
                let badgeColor = d.platform === "YOUTUBE" ? "#ff0000" : (d.platform === "TIKTOK" ? "#00f2ea" : "#E1306C");
                mediaGrid.innerHTML += `
                    <div class="glass-card">
                        <span style="background:${badgeColor}; padding:2px 8px; font-size:10px; border-radius:4px;">${d.platform}</span>
                        <h4 style="margin:10px 0">${d.title}</h4>
                        <a href="${d.url}" target="_blank" style="color:cyan; font-size:12px;">🔗 OPEN LINK</a>
                        <p style="font-size:12px; color:#aaa; margin-top:5px;">${d.desc}</p>
                    </div>`;
            }
            if (newsFeed && d.type === 'SYSTEM') {
                newsFeed.innerHTML += `
                    <div class="glass-card">
                        <h3 style="color:#3b82f6;">${d.title}</h3>
                        <p style="font-size:14px; margin:10px 0;">${d.desc}</p>
                        ${d.url ? `<a href="${d.url}" target="_blank" style="color:cyan; font-size:12px;">[See Reference]</a>` : ''}
                        <hr style="border:0; border-top:1px solid #333; margin:10px 0;">
                        <small style="color:#666;">By: ${d.author}</small>
                    </div>`;
            }
        });
    }
}
window.addEventListener('DOMContentLoaded', loadAllContent);

// --- 5. MARGA & OWNER LOGIC ---
window.updateRank = async () => {
    const uid = document.getElementById('target-uid').value;
    const rankVal = document.getElementById('target-rank').value;
    let newRole = (rankVal === "BANNED") ? "BANNED" : (rankVal === "MEMBER" ? "MEMBER" : "MARGA");
    let newRank = (newRole === "MARGA") ? rankVal : null;

    try {
        await fetch(`${BACKEND_URL}/api/update-user`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ targetUid: uid, newRole, newRank, adminName: auth.currentUser.displayName })
        });
        alert("Updated & Logged!");
    } catch(e) { alert("Error"); }
};
:absolute; top:10px; right:10px; padding:2px 8px; font-size:10px; border-radius:4px; font-weight:bold;">${d.platform}</span>
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
