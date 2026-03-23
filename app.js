/*************************************************
 * 1. FIREBASE CONFIGURATION
 *************************************************/
// TODO: Replace this empty object with your project configuration from console.firebase.google.com
const firebaseConfig = {
    apiKey: "AIzaSyBmCi3y9OwTsMNGLaiOSOTjX3L3wNqUJ0Y",
    authDomain: "fixmyarea10.firebaseapp.com",
    projectId: "fixmyarea10",
    storageBucket: "fixmyarea10.firebasestorage.app",
    messagingSenderId: "659265017360",
    appId: "1:659265017360:web:30d21eb2cbdc5366f95c95",
    measurementId: "G-C662JRQXY9"
};

// Initialize Firebase only if the user has provided the API Key
let app, auth, db, storage;
if (firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE") {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
}

/*************************************************
 * 2. GLOBAL STATE & HELPERS
 *************************************************/
let currentRole = null;
let currentUserUID = null;
let dbIssues = []; // Realtime mirror of Firestore
let issueToResolve = null;
let leafletMap = null;
let currentMarkers = [];
let mapInitialized = false;

// Map helper icons
const categoryIcons = {
    "Roads": "fa-road",
    "Waste": "fa-trash",
    "Drainage": "fa-water",
    "Utilities": "fa-lightbulb",
    "Toilets": "fa-restroom"
};

function timeAgo(dateString) {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

function getPriority(votes) {
    if (votes > 10) return { level: "High", badge: "🔥 High" };
    if (votes >= 5) return { level: "Medium", badge: "⚡ Med" };
    return { level: "Low", badge: "🧊 Low" };
}

/*************************************************
 * 3. INITIALIZATION & LISTENERS
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {
    if (!app) {
        document.getElementById("firebaseWarning").style.display = "flex";
        return;
    }

    // Standard DOM Listeners
    setupEventListeners();

    // Listen to Firebase Auth State (Persists login across reloads)
    auth.onAuthStateChanged(async user => {
        if (user) {
            try {
                let doc = await db.collection("users").doc(user.uid).get();
                let role = "citizen";
                if (doc.exists && doc.data().role) {
                    role = doc.data().role;
                } else {
                    role = (user.email === "admin@fixmyarea.com" || user.email.includes("admin")) ? "admin" : "citizen";
                    try { await db.collection("users").doc(user.uid).set({ role }); } catch(err){}
                }
                handleSuccessfulLogin(user, role);
            } catch(e) { 
                console.error("Error fetching user role", e); 
                handleSuccessfulLogin(user, "citizen"); // Fallback for hackathon
            }
        } else {
            if (typeof showAuthView === 'function') showAuthView('selection');
            document.getElementById("loginOverlay").style.display = "flex";
            document.getElementById("appContainer").style.display = "none";
        }
    });
});

function setupEventListeners() {
    // Modals

    // Modals
    document.getElementById("btnOpenReport").addEventListener("click", () => showModal("reportModal"));
    document.querySelectorAll(".close").forEach(btn => {
        btn.addEventListener("click", (e) => hideModal(e.target.closest(".modal").id));
    });

    // Filtering
    document.getElementById("searchInput").addEventListener("input", renderIssues);
    document.getElementById("categoryFilter").addEventListener("change", renderIssues);
    document.getElementById("statusFilter").addEventListener("change", renderIssues);
    document.getElementById("sortFilter").addEventListener("change", renderIssues);

    // Form Submissions
    document.getElementById("reportForm").addEventListener("submit", handleReportSubmit);
    document.getElementById("adminForm").addEventListener("submit", handleAdminSubmit);
}

/*************************************************
 * 4. AUTHENTICATION (Login / Logout)
 *************************************************/
function showAuthView(viewName) {
    document.getElementById("viewSelection").style.display = "none";
    document.getElementById("viewCitizen").style.display = "none";
    document.getElementById("viewAdmin").style.display = "none";
    
    if(viewName === 'citizen') document.getElementById("viewCitizen").style.display = "block";
    else if(viewName === 'admin') document.getElementById("viewAdmin").style.display = "block";
    else document.getElementById("viewSelection").style.display = "block";
}

async function registerCitizen() {
    const errorDiv = document.getElementById("citError");
    errorDiv.style.display = "none";
    const email = document.getElementById("citEmail").value.trim();
    const password = document.getElementById("citPassword").value;
    if (!email || !password) {
        errorDiv.innerText = "Please fill in both your email and password.";
        errorDiv.style.display = "block"; return;
    }
    try {
        const { user } = await auth.createUserWithEmailAndPassword(email, password);
        const role = (user.email.includes("admin")) ? "admin" : "citizen";
        try { await db.collection("users").doc(user.uid).set({ role }); } catch(err) {} 
    } catch (err) {
        errorDiv.innerText = err.message;
        errorDiv.style.display = "block";
    }
}

async function loginCitizen() {
    const errorDiv = document.getElementById("citError");
    errorDiv.style.display = "none";
    const email = document.getElementById("citEmail").value.trim();
    const password = document.getElementById("citPassword").value;
    if (!email || !password) {
        errorDiv.innerText = "Please fill in both your email and password.";
        errorDiv.style.display = "block"; return;
    }
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
        errorDiv.innerText = err.message;
        errorDiv.style.display = "block";
    }
}

async function loginAdmin() {
    const errorDiv = document.getElementById("admError");
    errorDiv.style.display = "none";
    const email = document.getElementById("admEmail").value.trim();
    const password = document.getElementById("admPassword").value;
    if (!email || !password) {
        errorDiv.innerText = "Please enter official credentials.";
        errorDiv.style.display = "block"; return;
    }
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
        errorDiv.innerText = err.message;
        errorDiv.style.display = "block";
    }
}

function handleSuccessfulLogin(user, role) {
    currentUserUID = user.uid;
    currentRole = role;

    document.getElementById("loginOverlay").style.display = "none";
    document.getElementById("appContainer").style.display = "block";
    
    const navLinks = document.getElementById("desktopNavLinks");
    if(navLinks) navLinks.style.display = "flex";

    document.getElementById("profileName").innerHTML = currentRole === "admin" ?
        '<i class="fa-solid fa-shield-halved" style="color:var(--primary);"></i> Authority Portal' :
        '<i class="fa-solid fa-user" style="color:var(--primary);"></i> Citizen Portal';

    document.getElementById("btnOpenReport").style.display = currentRole === "admin" ? "none" : "inline-flex";

    if (!mapInitialized) initMap();
    else leafletMap.invalidateSize();

    // Start Realtime Firestore Listener
    listenToIssues();
}

function logout() {
    auth.signOut();
}

/*************************************************
 * 5. DATABASE OPERATIONS (Cloud Sync)
 *************************************************/
function listenToIssues() {
    document.getElementById("loadingSpinner").style.display = "block";

    db.collection("issues").onSnapshot((snapshot) => {
        document.getElementById("loadingSpinner").style.display = "none";
        dbIssues = [];
        snapshot.forEach((doc) => {
            dbIssues.push({ id: doc.id, ...doc.data() });
        });
        renderIssues();
    });
}

function upvoteIssue(id, event) {
    if (event) event.stopPropagation();
    const issueRef = db.collection("issues").doc(id);
    db.runTransaction(async (transaction) => {
        const doc = await transaction.get(issueRef);
        if (doc.exists) {
            transaction.update(issueRef, { votes: doc.data().votes + 1 });
        }
    }).catch(console.error);
}

function markInProgress(id) {
    db.collection("issues").doc(id).update({ status: "In Progress" });
}

function verifyFix(id, isConfirmed) {
    db.collection("issues").doc(id).update({
        status: isConfirmed ? "Resolved" : "Reopened"
    });
    hideModal("detailsModal");
}

/*************************************************
 * 6. CLOUD STORAGE (Actual File Uploads)
 *************************************************/
async function handleReportSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("btnReportSubmit");
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
    submitBtn.disabled = true;

    try {
        const file = document.getElementById("issueFile").files[0];
        const category = document.getElementById("issueCategory").value;
        const location = document.getElementById("issueLocation").value;
        const description = document.getElementById("issueDescription").value;

        // Upload to Firebase Storage
        const fileRef = storage.ref(`issues/${Date.now()}_${file.name}`);
        const uploadTask = await fileRef.put(file);
        const imageUrl = await uploadTask.ref.getDownloadURL();

        // Save metadata to Firestore
        const lat = 11.25 + (Math.random() * 0.02); // Simulated mapping
        const lng = 75.77 + (Math.random() * 0.02);

        await db.collection("issues").add({
            category, location, description,
            beforeImg: imageUrl,
            afterImg: null,
            status: "Pending",
            votes: 0,
            timestamp: new Date().toISOString(),
            uid: currentUserUID,
            lat, lng
        });

        hideModal("reportModal");
        e.target.reset();
    } catch (err) {
        alert("Upload Failed: " + err.message);
    } finally {
        submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Upload & Submit Report';
        submitBtn.disabled = false;
    }
}

function openAdminModal(id) {
    issueToResolve = id;
    showModal("adminModal");
}

async function handleAdminSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("btnAdminSubmit");
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    try {
        const file = document.getElementById("adminFile").files[0];
        const fileRef = storage.ref(`resolution/${Date.now()}_${file.name}`);
        const uploadTask = await fileRef.put(file);
        const imageUrl = await uploadTask.ref.getDownloadURL();

        await db.collection("issues").doc(issueToResolve).update({
            afterImg: imageUrl,
            status: "Review"
        });

        hideModal("adminModal");
        e.target.reset();
    } catch (err) {
        alert("Failure: " + err.message);
    } finally {
        submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Upload Fix Proof';
        submitBtn.disabled = false;
    }
}

/*************************************************
 * 7. RENDERING LOGIC (Updated to map dbIssues)
 *************************************************/
function renderIssues() {
    if (!currentRole) return;
    const grid = document.getElementById("issuesGrid");
    grid.innerHTML = "";

    let filtered = dbIssues;

    const query = document.getElementById("searchInput").value.toLowerCase();
    if (query) {
        filtered = filtered.filter(i =>
            i.description.toLowerCase().includes(query) ||
            i.location.toLowerCase().includes(query) ||
            i.category.toLowerCase().includes(query)
        );
    }

    const cat = document.getElementById("categoryFilter").value;
    if (cat !== "All") filtered = filtered.filter(i => i.category === cat);

    const stat = document.getElementById("statusFilter").value;
    if (stat !== "All") filtered = filtered.filter(i => i.status === stat);

    const sort = document.getElementById("sortFilter").value;
    if (sort === "priority") filtered.sort((a, b) => b.votes - a.votes);
    else filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const maxVotes = Math.max(...dbIssues.map(i => i.votes), 0);

    filtered.forEach(issue => {
        const priorityInfo = getPriority(issue.votes);
        const isCritical = issue.votes === maxVotes && issue.votes > 0;
        const card = document.createElement("div");
        card.className = `issue-card ${priorityInfo.level === 'High' ? 'priority-high' : ''}`;

        let statusClass = "status-pending";
        if (issue.status === "In Progress") statusClass = "status-progress";
        if (issue.status === "Review") statusClass = "status-review";
        if (issue.status === "Resolved") statusClass = "status-resolved";
        if (issue.status === "Reopened") statusClass = "status-reopened";

        const iconClass = categoryIcons[issue.category] || "fa-triangle-exclamation";

        card.innerHTML = `
            <div class="card-image-wrap">
                <img src="${issue.beforeImg}" alt="Issue" class="card-image">
                <span class="top-badge"><i class="fa-regular fa-clock"></i> ${timeAgo(issue.timestamp)}</span>
                ${isCritical ? '<span class="top-badge critical-badge">🔥 MOST CRITICAL</span>' : ''}
                <span class="status-badge ${statusClass}">${issue.status}</span>
            </div>
            <div class="card-content">
                <div class="card-meta">
                    <span class="category-text"><i class="fa-solid ${iconClass}"></i> ${issue.category}</span>
                    <span class="priority-tag ${priorityInfo.level}">${priorityInfo.badge}</span>
                </div>
                <div class="card-location"><i class="fa-solid fa-location-dot"></i> ${issue.location}</div>
                <p class="card-desc">${issue.description}</p>
                
                <div class="card-footer">
                    <button class="upvote-btn" onclick="upvoteIssue('${issue.id}', event)">
                        <i class="fa-solid fa-arrow-up"></i> ${issue.votes}
                    </button>
                    <button class="btn btn-outline" onclick="openDetails('${issue.id}')">View Details</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    updateMap(filtered);
    updateInsights();
}

/*************************************************
 * 8. MAP & UI LOGIC
 *************************************************/
function initMap() {
    leafletMap = L.map('map').setView([11.2588, 75.7804], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(leafletMap);
    mapInitialized = true;
}

function updateMap(filteredList) {
    if (!leafletMap) return;
    currentMarkers.forEach(m => leafletMap.removeLayer(m));
    currentMarkers = [];

    filteredList.forEach(issue => {
        if (issue.lat && issue.lng) {
            let color = "#F59E0B";
            if (issue.status === "In Progress") color = "#3B82F6";
            if (issue.status === "Review") color = "#8B5CF6";
            if (issue.status === "Resolved") color = "#10B981";

            const markerHtml = `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`;
            const icon = L.divIcon({ html: markerHtml, className: 'custom-leaflet-marker', iconSize: [16, 16], iconAnchor: [8, 8] });

            const marker = L.marker([issue.lat, issue.lng], { icon }).addTo(leafletMap);
            marker.on('click', () => openDetails(issue.id));
            currentMarkers.push(marker);
        }
    });
}

function updateInsights() {
    document.getElementById("statTotal").innerText = dbIssues.length;
    const catFreq = {};
    let maxCat = "-", maxCount = 0;
    dbIssues.forEach(i => {
        catFreq[i.category] = (catFreq[i.category] || 0) + 1;
        if (catFreq[i.category] > maxCount) {
            maxCount = catFreq[i.category];
            maxCat = i.category;
        }
    });
    document.getElementById("statCommonCategory").innerText = maxCat;

    const highestVoted = dbIssues.reduce((prev, current) => (prev.votes > current.votes) ? prev : current, { votes: -1 });
    document.getElementById("statCritical").innerText = highestVoted.votes > -1 ? highestVoted.location.split(',')[0] : "-";
    document.getElementById("statRecent").innerText = dbIssues.length > 0 ? timeAgo(dbIssues[Math.max(0, dbIssues.length - 1)].timestamp) : "-";
}

function openDetails(id) {
    const issue = dbIssues.find(i => i.id === id);
    if (!issue) return;

    const priorityInfo = getPriority(issue.votes);
    let statusClass = "status-pending";
    if (issue.status === "In Progress") statusClass = "status-progress";
    if (issue.status === "Review") statusClass = "status-review";
    if (issue.status === "Resolved") statusClass = "status-resolved";
    if (issue.status === "Reopened") statusClass = "status-reopened";

    let actionButtons = '';

    if (currentRole === "admin") {
        if (issue.status === "Pending" || issue.status === "Reopened") {
            actionButtons = `<button class="btn btn-primary" onclick="markInProgress('${issue.id}'); hideModal('detailsModal')"><i class="fa-solid fa-hammer"></i> Pick Up Issue (In Progress)</button>`;
        } else if (issue.status === "In Progress") {
            actionButtons = `<button class="btn btn-success" onclick="openAdminModal('${issue.id}'); hideModal('detailsModal')"><i class="fa-solid fa-camera"></i> Provide Fix Proof</button>`;
        }
    } else {
        if (issue.status === "Review") {
            actionButtons = `
                <button class="btn btn-danger" onclick="verifyFix('${issue.id}', false)"><i class="fa-solid fa-xmark"></i> Reject & Reopen</button>
                <button class="btn btn-success" onclick="verifyFix('${issue.id}', true)"><i class="fa-solid fa-check"></i> Confirm Fixed</button>
            `;
        }
    }

    const html = `
        <div class="details-header">
            <div>
                <h2>${issue.category} at ${issue.location}</h2>
                <div class="details-badges">
                    <span class="badge ${statusClass}">${issue.status === "Review" ? "Needs Verification" : issue.status}</span>
                    <span class="badge" style="background:#4F46E5;"><i class="fa-regular fa-clock"></i> Reported ${timeAgo(issue.timestamp)}</span>
                    <span class="badge" style="background:transparent; border:1px solid #E2E8F0; color:#0F172A;"><i class="fa-solid fa-fire text-red-500"></i> ${priorityInfo.level} Priority</span>
                </div>
            </div>
            <button class="upvote-btn" onclick="upvoteIssue('${issue.id}', event); hideModal('detailsModal'); setTimeout(()=>openDetails('${issue.id}'),200)">
                <i class="fa-solid fa-arrow-up"></i> ${issue.votes}
            </button>
        </div>
        
        <p style="font-size: 1.125rem; color: #475569; margin-bottom: 2rem;">${issue.description}</p>
        
        <div class="media-comparison">
            <div class="media-side">
                <h4><i class="fa-solid fa-image"></i> Problem Reported</h4>
                <img src="${issue.beforeImg}" alt="Before">
            </div>
            ${issue.afterImg ? `
            <div class="media-side">
                <h4><i class="fa-solid fa-image"></i> Resolution Proof</h4>
                <img src="${issue.afterImg}" alt="After">
            </div>
            ` : ''}
        </div>
        
        <div class="details-actions">
            ${actionButtons || '<span style="color:#64748B; font-weight:500; font-size:0.875rem;">No actions available for your role at this stage.</span>'}
        </div>
    `;

    document.getElementById("detailsModalBody").innerHTML = html;
    showModal("detailsModal");
}
