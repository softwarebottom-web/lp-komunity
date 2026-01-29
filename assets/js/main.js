import { 
    auth, 
    db, 
    discordProvider, 
    signInWithRedirect, 
    getRedirectResult, 
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

// --- HELPER LOG KE DISCORD ---
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
// 1. FUNGSI LOGIN (Redirect Mode)
// ==========================================
window.loginWithDiscord = async () => {
    // Alert untuk konfirmasi di HP bahwa tombol ditekan
    alert("Menghubungkan ke Discord... Mohon tunggu.");
    
    try {
        // Menggunakan OIDC Provider yang sudah diset di config
        await signInWithRedirect(auth, discordProvider);
    } catch (error) {
        alert("Gagal Memulai Login: " + error.message);
        console.error("Login Error:", error);
    }
};

// ==========================================
// 2. CEK HASIL LOGIN (Otomatis jalan setelah Redirect)
// ==========================================
async function checkLoginRedirect() {
    try {
        // Cek apakah user baru saja kembali dari halaman Discord
        const result = await getRedirectResult(auth);
        
        if (result) {
            const user = result.user;
            
            // Cek data user di Firestore
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // --- USER BARU ---
                await setDoc(userRef, {
                    username: user.displayName || "User",
                    email: user.email,
                    role: "Member", // Default Role
                    joinedAt: new Date(),
                    photoURL: user.photoURL
                });
                // Log ke Discord (Warna Hijau)
                window.sendDiscordLog('login', 'New User Joined', `Welcome **${user.displayName}** to LP Zone!`, 65280);
            } else {
                // --- USER LAMA ---
                // Log ke Discord (Warna Biru)
                window.sendDiscordLog('login', 'User Login', `**${user.displayName}** has logged in.`, 3447003);
            }

            // Redirect ke Dashboard
            window.location.href = "dashboard.html";
        }
    } catch (error) {
        console.error("Redirect Check Error:", error);
        // Abaikan error 'popup-closed' atau null result (artinya user buka web biasa)
        if (error.code && error.code !== 'auth/popup-closed-by-user') {
           // alert("Debug Auth: " + error.message);
        }
    }
}

// Jalankan fungsi pengecekan setiap halaman dimuat
checkLoginRedirect();

// ==========================================
// 3. FUNGSI LOGOUT
// ==========================================
window.logoutUser = () => {
    const user = auth.currentUser;
    if(user) {
        window.sendDiscordLog('login', 'Logout', `**${user.displayName}** logged out.`, 15158332);
    }
    
    signOut(auth).then(() => {
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
};

// ==========================================
// 4. TAB SWITCHING (Untuk Dashboard)
// ==========================================
window.switchTab = (tabId) => {
    // Sembunyikan semua section
    document.querySelectorAll('.dashboard-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('bg-cyan-500/10', 'text-cyan-400'));
    
    // Tampilkan yang dipilih
    const target = document.getElementById(tabId);
    if (target) {
        target.classList.remove('hidden');
        
        // Highlight tombol sidebar (Cari tombol yang punya onclick ke tabId ini)
        const activeBtns = document.querySelectorAll(`button[onclick="switchTab('${tabId}')"]`);
        activeBtns.forEach(btn => btn.classList.add('bg-cyan-500/10', 'text-cyan-400'));
    }
};
