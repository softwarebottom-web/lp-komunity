import { auth, db, discordProvider, signInWithPopup, signOut, doc, setDoc, getDoc } from './firebase-config.js';

// --- CONFIG WEBHOOKS (SESUAI REQUEST) ---
const WEBHOOKS = {
    login: "https://discord.com/api/webhooks/1466147147056676916/qrbAgOSZv6EIHEvGn5YS73YAmvB5muFnK-n4NgpSD-HZdLWml_BPLYAJGTIkqNob6YmV",
    media: "https://discord.com/api/webhooks/1466147843923509432/A32z0_DHEAklvKPkgjrB0n9E15AnpucRusbAY0LKynr2K6VBIN_YKdB97ud34CXndx47",
    project: "https://discord.com/api/webhooks/1466148143593689152/1De2_JryP0RGIZyxPPig6v2UlLiKtY9G2peYlOqW-AmGtIEKEC_MkJU6x58KBU30ADz2",
    ban: "https://discord.com/api/webhooks/1466148412524069077/xa7iEdKbgiIfvXcNNINE-1MTh5ZAmJ1Am-G8S6BsySOqV4gkWoB24HGDlzeC-8rSIIF9"
};

// --- FUNGSI KIRIM LOG KE DISCORD ---
window.sendDiscordLog = (type, title, description, color = 3447003) => {
    const url = WEBHOOKS[type];
    if (!url) return console.error("Webhook type not found");

    const payload = {
        username: "LP Zone System",
        avatar_url: "https://i.imgur.com/AfFp7pu.png", // Bisa diganti logo LP Zone
        embeds: [{
            title: title,
            description: description,
            color: color,
            footer: { text: "LP Zone • By Zane Developer" },
            timestamp: new Date().toISOString()
        }]
    };

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
};

// --- FUNGSI LOGIN DENGAN DISCORD ---
window.loginWithDiscord = async () => {
    try {
        const result = await signInWithPopup(auth, discordProvider);
        const user = result.user;
        
        // Cek apakah user baru atau lama (Simpan ke Firestore)
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // User Baru Join
            await setDoc(userRef, {
                username: user.displayName,
                email: user.email,
                role: "Member", // Default role
                joinedAt: new Date(),
                photoURL: user.photoURL
            });
            // Kirim Log ke Channel "Project Update" (Member Baru) atau Login? 
            // Kita pakai Login log sesuai request
            window.sendDiscordLog('login', 'New User Registered', `Welcome **${user.displayName}** to LP Zone!`, 65280); 
        } else {
            // User Lama Login
            window.sendDiscordLog('login', 'User Login', `User **${user.displayName}** has logged in.`, 3447003);
        }

        window.location.href = "dashboard.html";

    } catch (error) {
        console.error(error);
        alert("Login Gagal: " + error.message);
    }
};

// --- FUNGSI LOGOUT ---
window.logoutUser = () => {
    const user = auth.currentUser;
    if(user) {
        window.sendDiscordLog('login', 'User Logout', `User **${user.displayName}** has logged out.`, 15158332);
    }
    signOut(auth).then(() => {
        window.location.href = "index.html";
    });
};

// --- TAB SWITCHING DASHBOARD ---
window.switchTab = (tabId) => {
    document.querySelectorAll('.dashboard-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('bg-cyan-500/10', 'text-cyan-400'));
    
    document.getElementById(tabId).classList.remove('hidden');
    
    // Highlight sidebar
    // Cari button yang memanggil fungsi ini (perlu penyesuaian di HTML sedikit agar pas)
    const btns = document.querySelectorAll('.nav-btn');
    btns.forEach(btn => {
        if(btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('bg-cyan-500/10', 'text-cyan-400');
        }
    });
};
