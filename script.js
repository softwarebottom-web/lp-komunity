const firebaseConfig = { /* Pake Config Lu */ };
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); const db = firebase.firestore();
const BACKEND_URL = "https://beck-production-6c7d.up.railway.app";

// NAVIGASI TANPA DRAMA
auth.onAuthStateChanged(async (user) => {
    const nav = document.getElementById('dynamic-nav');
    if(!nav) return;
    let menu = '<a href="index.html">HOME</a><a href="media.html">MEDIA</a><a href="announcement.html">NEWS</a>';
    if(user){
        const snap = await db.collection("users").doc(user.uid).get();
        const role = snap.data()?.role || "MEMBER";
        if(role === "FOUNDER") menu += '<a href="ownerarea.html" style="color:red">OWNER</a>';
        if(role === "MARGA") menu += '<a href="margaarea.html" style="color:purple">MARGA</a>';
        menu += '<a href="#" onclick="auth.signOut()">OUT</a>';
    } else { menu += '<a href="portal.html">LOGIN</a>'; }
    nav.innerHTML = menu;
});

// FUNGSI POST TERPISAH
window.postContent = async (category) => {
    const title = category === 'SOCIAL' ? document.getElementById('soc-title').value : document.getElementById('sys-title').value;
    const desc = category === 'SYSTEM' ? document.getElementById('sys-desc').value : "";
    const fileInput = category === 'SOCIAL' ? document.getElementById('soc-file') : document.getElementById('sys-file');
    
    if(!title || !fileInput.files[0]) return alert("Data belum lengkap!");

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('judul', title);
    formData.append('desc', desc);
    formData.append('type', category);

    try {
        const res = await fetch(`${BACKEND_URL}/api/publish-project`, { method: "POST", body: formData });
        const result = await res.json();
        if(result.status === "success"){
            await db.collection("announcements").add({ title, content: desc, type: category, image: result.url, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            alert("Berhasil!"); location.reload();
        }
    } catch(e) { alert("Gagal konek ke Railway!"); }
};

// AUTO-LOAD CONTENT
async function initPages() {
    const mediaGrid = document.getElementById('media-grid');
    const newsFeed = document.getElementById('news-feed');

    if (mediaGrid || newsFeed) {
        const snap = await db.collection("announcements").orderBy("timestamp", "desc").get();
        snap.forEach(doc => {
            const data = doc.data();
            if (mediaGrid && data.type === 'SOCIAL') {
                mediaGrid.innerHTML += `<img src="${data.image}" style="width:100%; border-radius:5px; border:1px solid #333;">`;
            }
            if (newsFeed && data.type === 'SYSTEM') {
                newsFeed.innerHTML += `
                    <div class="glass-card">
                        <h3 style="color:#3b82f6;">${data.title}</h3>
                        <p>${data.content}</p>
                        ${data.image ? `<img src="${data.image}" style="width:100%; margin-top:10px;">` : ''}
                    </div>`;
            }
        });
    }
}

// GANGSTER TALK (MARGA ONLY)
window.sendMessage = async () => {
    const msg = document.getElementById('chat-msg').value;
    if(!msg) return;
    await db.collection("marga_chats").add({
        user: auth.currentUser.displayName,
        text: msg,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('chat-msg').value = "";
};

// LOAD CHAT REALTIME
if(document.getElementById('chat-box')) {
    db.collection("marga_chats").orderBy("timestamp", "asc").onSnapshot(snap => {
        const box = document.getElementById('chat-box');
        box.innerHTML = snap.docs.map(d => `<p><b>${d.data().user}:</b> ${d.data().text}</p>`).join('');
        box.scrollTop = box.scrollHeight;
    });
}

window.onload = initPages;

