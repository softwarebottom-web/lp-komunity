import { 
    auth, 
    db, 
    discordProvider, 
    signInWithRedirect, 
    onAuthStateChanged, // <--- KITA PAKAI INI SEKARANG
    signOut, 
    doc, 
    setDoc, 
    getDoc 
} from './firebase-config.js';

// --- CONFIG WEBHOOKS ---
const WEBHOOKS = {
    login: "https://discord.com/api/webhooks/1466147147056676916/qrbAgOSZv6EIHEvGn5YS73YAmvB5muFnK-n4NgpSD-HZdLWml_BPLYAJGTIkqNob6YmV",
    media: "https://discord.com/api/webhooks/1466147843923509432/A32z0_DHEAklvKPkgjrB0n9E15AnpucRusbAY0LKynr2K6VBIN_YKdB97ud34CXndx47",
    project: "https://discord.com/api/webhooks/1466148143593689152/1De2_JryP0RGIZyxPPig6v2UlLiKtY9G2peYlOqW-AmGtIEKEC_MkJU6x58KBU30ADz2",
    ban: "https://discord.com/api/webhooks/1466148412524069077/xa7iEdKbgiIfvXcNNINE-1MTh5ZAmJ1Am-G8S6BsySOqV4gkWoB24HGDlzeC-8rSIIF9"
};

// --- HELPER LOG ---
window.sendDiscordLog = (type, title, description, color = 3447003) => {
    const url = WEBHOOKS[type];
    if (!url) return;
    
    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: "LP Zone System",
            avatar_url: "https://i.imgur.com/AfFp7pu.png",
            embeds: [{
                title: title, 
                description: description, 
                color: color,
                footer: { text: "LP Zone • By Zane Developer" },
                timestamp: new Date().toISOString()
            }]
        })
    }).catch(err => console.error("Webhook Error:", err));
};

// ==========================================
// 1. FUNGSI LOGIN (TOMBOL DIKLIK)
// ==========================================
window.loginWithDiscord = async () => {
    // Alert biar user tau proses jalan
    alert("Membuka Discord...");
    try {
        await signInWithRedirect(auth, discordProvider);
    } catch (error) {
        alert("Gagal Login: " + error.message);
    }
};

// ==========================================
// 2. PEMANTAU STATUS (INI KUNCINYA)
// ==========================================
// Fungsi ini jalan OTOMATIS setiap kali web dibuka/refresh
// Jika user sudah login (balik dari discord), dia langsung kerja
onAuthStateChanged(auth, async (user) => {
    
    // Cek apakah kita ada di halaman login.html
    if (window.location.pathname.includes("login.html") || window.location.pathname === "/") {
        
        if (user) {
            console.log("User terdeteksi login:", user.displayName);
            // alert("Login Terdeteksi! Memproses data..."); // Debugging (boleh dihapus nanti)

            try {
                // Cek Database
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    // --- USER BARU (Save & Webhook) ---
                    await setDoc(userRef, {
                        username: user.displayName || "User",
                        email: user.email,
                        role: "Member",
                        joinedAt: new Date(),
                        photoURL: user.photoURL
                    });
                    
                    // Webhook User Baru
                    window.sendDiscordLog('login', 'New User Joined', `Welcome **${user.displayName}** to LP Zone!`, 65280);
                    
                } else {
                    // --- USER LAMA ---
                    // Opsional: Update 'lastLogin'
                     await setDoc(userRef, { lastLogin: new Date() }, { merge: true });
                }

                // Redirect ke Dashboard
                console.log("Redirecting to dashboard...");
                window.location.href = "dashboard.html";

            } catch (error) {
                console.error("Database Error:", error);
                alert("Gagal simpan database: " + error.message + "\nCek Rules Firestore!");
            }
        }
    } 
    
    // Logic untuk halaman Dashboard (Proteksi)
    else if (window.location.pathname.includes("dashboard.html")) {
        if (!user) {
            // Kalau gak ada user tapi nekat masuk dashboard, tendang keluar
            window.location.href = "login.html";
        }
    }
});


// ==========================================
// 3. FUNGSI LOGOUT
// ==========================================
window.logoutUser = () => {
    const user = auth.currentUser;
    if(user) window.sendDiscordLog('login', 'Logout', `**${user.displayName}** logged out.`, 15158332);
    
    signOut(auth).then(() => {
        window.location.href = "login.html";
    });
};

// ==========================================
// 4. TAB SWITCHING
// ==========================================
window.switchTab = (tabId) => {
    document.querySelectorAll('.dashboard-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('bg-cyan-500/10', 'text-cyan-400'));
    
    const target = document.getElementById(tabId);
    if (target) {
        target.classList.remove('hidden');
        const activeBtns = document.querySelectorAll(`button[onclick="switchTab('${tabId}')"]`);
        activeBtns.forEach(btn => btn.classList.add('bg-cyan-500/10', 'text-cyan-400'));
    }
};
                            
