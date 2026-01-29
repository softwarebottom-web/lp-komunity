import { auth, db, discordProvider, signInWithRedirect, getRedirectResult, signOut, doc, setDoc, getDoc } from './firebase-config.js';

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
                title: title, description: description, color: color,
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
    // Alert ini muncul di HP untuk konfirmasi tombol berfungsi
    alert("Menghubungkan ke Discord... Mohon tunggu.");
    
    try {
        await signInWithRedirect(auth, discordProvider);
    } catch (error) {
        alert("Gagal Memulai Login: " + error.message);
        console.error(error);
    }
};

// ==========================================
// 2. CEK HASIL LOGIN (Setelah Redirect)
// ==========================================
async function checkLoginRedirect() {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            const user = result.user;
            
            // Cek/Simpan User ke Firestore
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // User Baru
                await setDoc(userRef, {
                    username: user.displayName,
                    email: user.email,
                    role: "Member",
                    joinedAt: new Date(),
                    photoURL: user.photoURL
                });
                window.sendDiscordLog('login', 'New User', `Welcome **${user.displayName}** to LP Zone!`, 65280);
            } else {
                // User Lama
                window.sendDiscordLog('login', 'User Login', `**${user.displayName}** has logged in.`, 3447003);
            }

            alert("Login Berhasil! Mengalihkan...");
            window.location.href = "dashboard.html";
        }
    } catch (error) {
        console.error("Redirect Error:", error);
        // Jangan alert error disini jika null (artinya user baru buka halaman biasa)
        if (error.code !== 'auth/popup-closed-by-user') {
           // alert("Error Auth: " + error.message);
        }
    }
}

// Jalankan cek redirect setiap halaman dimuat
checkLoginRedirect();

// ==========================================
// 3. FUNGSI LOGOUT
// ==========================================
window.logoutUser = () => {
    const user = auth.currentUser;
    if(user) window.sendDiscordLog('login', 'Logout', `**${user.displayName}** logged out.`, 15158332);
    
    signOut(auth).then(() => {
        window.location.href = "login.html"; // Balik ke login.html, bukan index
    });
};
