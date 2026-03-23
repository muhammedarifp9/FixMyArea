/*************************************************
 * 1. FIREBASE CONFIGURATION
 *************************************************/
const firebaseConfig = {
    apiKey: "AIzaSyBmCi3y9OwTsMNGLaiOSOTjX3L3wNqUJ0Y",
    authDomain: "fixmyarea10.firebaseapp.com",
    projectId: "fixmyarea10",
    storageBucket: "fixmyarea10.firebasestorage.app",
    messagingSenderId: "659265017360",
    appId: "1:659265017360:web:30d21eb2cbdc5366f95c95",
    measurementId: "G-C662JRQXY9"
};

// Initialize Firebase
let app, auth, db, storage;
if (firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE") {
    try {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        // Check if storage is available (since some pages might miss the SDK)
        if (typeof firebase.storage === 'function') {
            storage = firebase.storage();
        } else {
            console.warn("Firebase Storage SDK not loaded. Storage features will be unavailable.");
        }
    } catch (err) {
        console.error("Firebase Initialization Error:", err);
    }
}

/*************************************************
 * 2. GLOBAL STATE & HELPERS
 *************************************************/
let currentRole = null;
let currentUserUID = null;
let dbIssues = [];
let issueToResolve = null;
let leafletMap = null;
let currentMarkers = [];
let mapInitialized = false;

const translations = {
    en: {
        dashboard: "Dashboard",
        profile: "My Profile",
        settings: "App Settings",
        about: "About Us",
        connect: "Join Volunteer",
        signOut: "Sign Out",
        reportIssue: "Report Issue",
        trackProgress: "Track Progress",
        howItWorks: "How FixMyArea Works",
        report: "Report",
        track: "Track & Verify",
        resolve: "Resolve",
        totalIssues: "Total Issues",
        mostReported: "Most Reported",
        mostCritical: "Most Critical",
        latestActivity: "Latest Activity",
        latestNews: "Live Updates & News",
        viewFullFeed: "View Full Feed",
        allCategories: "All Categories",
        allStatuses: "All Statuses",
        highestPriority: "Highest Priority",
        mostRecent: "Most Recent",
        welcomeGuest: "Welcome Guest",
        signIn: "Sign In",
        register: "Register Account",
        searchPlaceholder: "Search issues, locations, descriptions...",
        appearance: "Appearance",
        theme: "Application Theme",
        light: "Light Theme",
        dark: "Dark Theme",
        localization: "Localization",
        language: "Language Preference",
        save: "Save Preferences",
        saved: "Preferences Saved Successfully!",
        legendPending: "Pending",
        legendInProgress: "In Progress",
        legendReview: "Needs Review",
        legendResolved: "Resolved",
        legendReopened: "Reopened",
        locateMe: "Locate Me",
        resetView: "Reset View",
        heroBadge: "✨ Kozhikode Civic Initiative",
        heroTitle: "Empowering Citizens.<br>Transforming Kozhikode.",
        heroSub: "Report issues, track resolutions, and build a better community together through transparency and action.",
        howItWorksSub: "Simple steps to a cleaner and better city.",
        step1Desc: "Snap a photo and pin the location of any civic issue. It's fast, easy, and impactful.",
        step2Desc: "Monitor progress in real-time. Upvote critical issues to ensure they get the attention they deserve.",
        step3Desc: "Verify the fix once completed. We close the loop together with the local authorities.",
        liveUpdatesSub: "Stay informed about local civic actions."
    },
    ml: {
        dashboard: "ഡാഷ്ബോർഡ്",
        profile: "എന്റെ പ്രൊഫൈൽ",
        settings: "ആപ്പ് ക്രമീകരണങ്ങൾ",
        about: "ഞങ്ങളെക്കുറിച്ച്",
        connect: "വളന്റിയറാകൂ",
        signOut: "പുറത്തുകടക്കുക",
        reportIssue: "പ്രശ്നം റിപ്പോർട്ട് ചെയ്യുക",
        trackProgress: "പുരോഗതി ട്രാക്ക് ചെയ്യുക",
        howItWorks: "ഫിക്സ് മൈ ഏരിയ എങ്ങനെ പ്രവർത്തിക്കുന്നു",
        report: "1. റിപ്പോർട്ട്",
        track: "2. ട്രാക്ക്",
        resolve: "3. പരിഹാരം",
        totalIssues: "ആകെ പരാതികൾ",
        mostReported: "കൂടുതൽ റിപ്പോർട്ട് ചെയ്തത്",
        mostCritical: "ഏറ്റവും പ്രധാനം",
        latestActivity: "അവസാനത്തെ പ്രവർത്തനം",
        latestNews: "തത്സമയ അപ്‌ഡേറ്റുകൾ",
        viewFullFeed: "ഫീഡ് കാണുക",
        allCategories: "എല്ലാ വിഭാഗങ്ങളും",
        allStatuses: "എല്ലാ അവസ്ഥകളും",
        highestPriority: "ഏറ്റവും പ്രധാനം",
        mostRecent: "ഏറ്റവും പുതിയത്",
        welcomeGuest: "സ്വാഗതം ഗസ്റ്റ്",
        signIn: "ലോഗിൻ ചെയ്യുക",
        register: "അക്കൗണ്ട് തുടങ്ങുക",
        searchPlaceholder: "തിരയുക...",
        appearance: "രൂപഭാവം",
        theme: "ആപ്പ് തീം",
        light: "ലൈറ്റ് തീം",
        dark: "ഡാർക്ക് തീം",
        localization: "ഭാഷ തിരഞ്ഞെടുക്കുക",
        language: "ഭാഷ",
        save: "സേവ് ചെയ്യുക",
        saved: "വിജയകരമായി സേവ് ചെയ്തു!",
        legendPending: "തീർച്ചപ്പെടുത്തിയിട്ടില്ല",
        legendInProgress: "പുരോഗതിയിൽ",
        legendReview: "പരിശോധനയിൽ",
        legendResolved: "പരിഹരിച്ചു",
        legendReopened: "വീണ്ടും തുറന്നു",
        locateMe: "എന്റെ ലൊക്കേഷൻ",
        resetView: "റീസെറ്റ് വ്യൂ",
        heroBadge: "✨ കോഴിക്കോട് സിവിക് ഇനിഷ്യേറ്റീവ്",
        heroTitle: "പൗരന്മാരെ ശാക്തീകരിക്കുന്നു.<br>കോഴിക്കോടിനെ മാറ്റുന്നു.",
        heroSub: "പ്രശ്നങ്ങൾ റിപ്പോർട്ട് ചെയ്യുക, പരിഹാരങ്ങൾ ട്രാക്ക് ചെയ്യുക, സുതാര്യതയിലൂടെയും പ്രവർത്തനത്തിലൂടെയും മികച്ചൊരു സമൂഹം ഒരുമിച്ച് കെട്ടിപ്പടുക്കുക.",
        howItWorksSub: "വൃത്തിയുള്ളതും മെച്ചപ്പെട്ടതുമായ നഗരത്തിലേക്കുള്ള ലളിതമായ ഘട്ടങ്ങൾ.",
        step1Desc: "ഏതെങ്കിലും സിവിക് പ്രശ്നത്തിന്റെ ഫോട്ടോ എടുത്ത് ലൊക്കേഷൻ പിൻ ചെയ്യുക. ഇത് വേഗതയുള്ളതും എളുപ്പവുമാണ്.",
        step2Desc: "തത്സമയം പുരോഗതി നിരീക്ഷിക്കുക. അവശ്യ പ്രശ്നങ്ങൾക്ക് അർഹമായ ശ്രദ്ധ ലഭിക്കുന്നുവെന്ന് ഉറപ്പാക്കാൻ അവ വോട്ട് ചെയ്യുക.",
        step3Desc: "പൂർത്തിയായ പ്രശ്നങ്ങൾ പരിഹരിച്ചുവെന്ന് പരിശോധിക്കുക. പ്രാദേശിക അധികാരികളോടൊപ്പം ഞങ്ങൾ ഇത് പൂർത്തിയാക്കുന്നു.",
        liveUpdatesSub: "പ്രാദേശിക സിവിക് പ്രവർത്തനങ്ങളെക്കുറിച്ച് അറിയുക."
    }
};

const categoryIcons = {
    "Roads": "fa-road",
    "Waste": "fa-trash",
    "Drainage": "fa-water",
    "Utilities": "fa-lightbulb",
    "Toilets": "fa-restroom"
};

function applyLanguage(lang) {
    const t = translations[lang] || translations.en;
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (t[key]) {
            if (el.tagName === "INPUT" && (el.type === "search" || el.type === "text")) {
                el.placeholder = t[key];
            } else if (t[key].includes("<br>")) {
                el.innerHTML = t[key];
            } else {
                el.innerText = t[key];
            }
        }
    });
    // Handle attributes like title and aria-label
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
        const key = el.getAttribute("data-i18n-title");
        if (t[key]) el.title = t[key];
    });
    document.querySelectorAll("[data-i18n-label]").forEach(el => {
        const key = el.getAttribute("data-i18n-label");
        if (t[key]) el.setAttribute("aria-label", t[key]);
    });
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

// Bridge for settings.html
function applyThemePreference(theme) {
    applyTheme(theme);
}

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
    // 1. Initialize UI Preferences Immediately (Independent of Firebase)
    const currentTheme = localStorage.getItem("fixmyarea_theme") || "light";
    const currentLang = localStorage.getItem("fixmyarea_lang") || "en";
    applyTheme(currentTheme);
    applyLanguage(currentLang);

    if (!app) {
        console.warn("App core not initialized. Some features may be limited.");
        return;
    }

    // 2. Setup Events
    setupEventListeners();

    // 3. Firebase Auth Listener
    auth.onAuthStateChanged(async user => {
        if (user) {
            try {
                let doc = await db.collection("users").doc(user.uid).get();
                let role = "citizen";
                let name = user.displayName || "Anonymous";
                
                if (doc.exists) {
                    role = doc.data().role || "citizen";
                    name = doc.data().name || name;
                }
                
                handleSuccessfulLogin(user, role, name);
            } catch(e) { 
                handleSuccessfulLogin(user, "citizen", "User");
            }
        } else {
            handleLogoutUI();
        }
    });

    // Storage Event for Multi-tab Sync
    window.addEventListener('storage', (e) => {
        if (e.key === 'fixmyarea_theme') applyTheme(e.newValue);
        if (e.key === 'fixmyarea_lang') applyLanguage(e.newValue);
    });
});

function setupEventListeners() {
    const reportBtn = document.getElementById("btnOpenReport");
    if(reportBtn) reportBtn.addEventListener("click", () => {
        if(!currentUserUID) window.location.href = 'login.html';
        else showModal("reportModal");
    });

    // Special handling for report.html guest view
    if(window.location.pathname.includes('report.html')) {
        const guestView = document.getElementById("guestReportView");
        const userView = document.getElementById("reportForm");
        if(guestView && userView) {
            if(currentUserUID) {
                guestView.style.display = "none";
                userView.style.display = "block";
            } else {
                guestView.style.display = "block";
                userView.style.display = "none";
            }
        }
    }
    
    document.querySelectorAll(".close").forEach(btn => {
        btn.addEventListener("click", (e) => hideModal(e.target.closest(".modal").id));
    });

    const searchInput = document.getElementById("searchInput");
    if(searchInput) searchInput.addEventListener("input", renderIssues);

    // Dropdowns
    document.querySelectorAll(".custom-dropdown-container").forEach(container => {
        const btn = container.querySelector(".custom-dropdown-btn");
        if(!btn) return;
        const hiddenInput = container.querySelector("input[type='hidden']");
        const selectedText = container.querySelector(".dropdown-selected-text");
        
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            document.querySelectorAll(".custom-dropdown-container").forEach(c => {
                if(c !== container) c.classList.remove("active");
            });
            container.classList.toggle("active");
        });
        
        container.querySelectorAll(".dropdown-item").forEach(item => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                selectedText.innerText = item.innerText;
                hiddenInput.value = item.getAttribute("data-value");
                container.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("selected"));
                item.classList.add("selected");
                container.classList.remove("active");
                renderIssues();
            });
        });
    });

    const profileBtn = document.getElementById("btnProfileToggle");
    if(profileBtn) {
        profileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            document.getElementById("userProfile").classList.toggle("active");
        });
    }

    document.addEventListener("click", () => {
        document.querySelectorAll(".custom-dropdown-container, .profile-dropdown-container").forEach(c => c.classList.remove("active"));
    });

    const reportForm = document.getElementById("reportForm");
    if(reportForm) reportForm.addEventListener("submit", handleReportSubmit);
    
    const adminForm = document.getElementById("adminForm");
    if(adminForm) adminForm.addEventListener("submit", handleAdminSubmit);
}

function handleSuccessfulLogin(user, role, name) {
    currentUserUID = user.uid;
    currentRole = role;

    // Sync with common.js
    localStorage.setItem('fixmyarea_user', JSON.stringify({ uid: user.uid, role, name }));
    if (typeof initNavigation === "function") initNavigation();

    // Update UI elements for report.html
    const guestView = document.getElementById("guestReportView");
    const userView = document.getElementById("reportForm");
    if(guestView && userView) {
        guestView.style.display = "none";
        userView.style.display = "block";
    }
    const loginOverlay = document.getElementById("loginOverlay");
    if(loginOverlay) loginOverlay.style.display = "none";
    
    const appContainer = document.getElementById("appContainer");
    if(appContainer) appContainer.style.display = "block";

    const navLinks = document.getElementById("desktopNavLinks");
    if(navLinks) navLinks.style.display = "flex";

    const profileNameEl = document.getElementById("profileName");
    if(profileNameEl) profileNameEl.innerText = name;
    
    const navUserNameEl = document.getElementById("navUserName");
    if(navUserNameEl) navUserNameEl.innerText = name;

    const initialsEl = document.getElementById("profileAvatarInitials");
    if(initialsEl) {
        initialsEl.innerText = name.substring(0, 1).toUpperCase();
        initialsEl.style.background = "var(--primary)";
        initialsEl.style.color = "white";
    }

    const reportBtn = document.getElementById("btnOpenReport");
    if(reportBtn) reportBtn.style.display = currentRole === "admin" ? "none" : "inline-flex";

    if (!mapInitialized) initMap();
    else if(leafletMap) leafletMap.invalidateSize();

    listenToIssues();
}

function handleLogoutUI() {
    currentUserUID = null;
    currentRole = null;
    
    // Sync with common.js
    localStorage.removeItem('fixmyarea_user');
    if (typeof initNavigation === "function") initNavigation();

    // Some pages might require redirect if not logged in
    const restrictedPages = ['profile.html', 'settings.html', 'report.html'];
    const currentPage = window.location.pathname.split('/').pop();
    if(restrictedPages.includes(currentPage)) {
        window.location.href = 'login.html';
        return;
    }

    // On index.html, just update UI
    const navLinks = document.getElementById("desktopNavLinks");
    if(navLinks) navLinks.style.display = "none";
    
    const initialsEl = document.getElementById("profileAvatarInitials");
    if(initialsEl) initialsEl.innerHTML = '<i class="fa-solid fa-user"></i>';
    
    const profileNameEl = document.getElementById("profileName");
    if(profileNameEl) profileNameEl.innerText = "Sign In";

    if (!mapInitialized) initMap();
    listenToIssues(); // Guest mode

    // Update UI elements for report.html guest view
    const guestView = document.getElementById("guestReportView");
    const userView = document.getElementById("reportForm");
    if(guestView && userView) {
        guestView.style.display = "block";
        userView.style.display = "none";
    }
}

function logout() {
    auth.signOut().then(() => {
        localStorage.removeItem("fixmyarea_user");
        window.location.href = "index.html";
    });
}

/*************************************************
 * 5. DATABASE OPERATIONS
 *************************************************/
function listenToIssues() {
    const spinner = document.getElementById("loadingSpinner");
    if(spinner) spinner.style.display = "block";

    db.collection("issues").onSnapshot((snapshot) => {
        if(spinner) spinner.style.display = "none";
        dbIssues = [];
        snapshot.forEach((doc) => {
            dbIssues.push({ id: doc.id, ...doc.data() });
        });
        renderIssues();
    });
}

function upvoteIssue(id, event) {
    if (event) event.stopPropagation();
    if (!currentUserUID) { window.location.href = 'login.html'; return; }
    
    const issueRef = db.collection("issues").doc(id);
    db.runTransaction(async (transaction) => {
        const doc = await transaction.get(issueRef);
        if (doc.exists) {
            transaction.update(issueRef, { votes: (doc.data().votes || 0) + 1 });
        }
    });
}

async function handleReportSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("btnReportSubmit");
    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading Files...';
    submitBtn.disabled = true;

    try {
        const issueFile = document.getElementById("issueFile").files[0];
        const proofFile = document.getElementById("proofFile").files[0];
        const category = document.getElementById("issueCategory").value;
        const street1 = document.getElementById("loc_street1").value;
        const street2 = document.getElementById("loc_street2").value;
        const city = document.getElementById("loc_city").value;
        const state = document.getElementById("loc_state").value;
        const zip = document.getElementById("loc_zip").value;
        const country = document.getElementById("loc_country").value;
        const addrTypeInput = document.querySelector('input[name="addr_type"]:checked');
        const addrType = addrTypeInput ? addrTypeInput.value : "new";
        const description = document.getElementById("issueDescription").value;

        if(!category) throw new Error("Please select a category");

        // 1. Upload Issue Photo
        const issueFileRef = storage.ref(`issues/${Date.now()}_issue_${issueFile.name}`);
        const issueUploadTask = await issueFileRef.put(issueFile);
        const imageUrl = await issueUploadTask.ref.getDownloadURL();

        // 2. Upload Address Proof
        const proofFileRef = storage.ref(`proofs/${Date.now()}_proof_${proofFile.name}`);
        const proofUploadTask = await proofFileRef.put(proofFile);
        const proofUrl = await proofUploadTask.ref.getDownloadURL();

        const lat = 11.25 + (Math.random() * 0.02);
        const lng = 75.77 + (Math.random() * 0.02);

        await db.collection("issues").add({
            category,
            location: `${street1}, ${city}`, // For backward compatibility with listing UI
            locationDetail: {
                street1, street2, city, state, zip, country, addrType
            },
            description,
            beforeImg: imageUrl,
            proofImg: proofUrl,
            afterImg: null,
            status: "Pending",
            votes: 0,
            timestamp: new Date().toISOString(),
            uid: currentUserUID,
            lat, lng
        });

        // Show success and redirect
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Submitted Successfully!';
        submitBtn.style.background = "var(--secondary)";
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (err) {
        alert("Report Submission Failed: " + err.message);
        submitBtn.innerHTML = originalBtnHtml;
        submitBtn.disabled = false;
    }
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
 * 6. RENDERING LOGIC
 *************************************************/
function renderIssues() {
    const grid = document.getElementById("issuesGrid");
    if(!grid) return;
    grid.innerHTML = "";

    let filtered = dbIssues;

    const queryEl = document.getElementById("searchInput");
    const query = queryEl ? queryEl.value.toLowerCase() : "";
    if (query) {
        filtered = filtered.filter(i =>
            i.description.toLowerCase().includes(query) ||
            i.location.toLowerCase().includes(query) ||
            i.category.toLowerCase().includes(query)
        );
    }

    const catFilter = document.getElementById("categoryFilter");
    const cat = catFilter ? catFilter.value : "All";
    if (cat !== "All") filtered = filtered.filter(i => i.category === cat);

    const statFilter = document.getElementById("statusFilter");
    const stat = statFilter ? statFilter.value : "All";
    if (stat !== "All") filtered = filtered.filter(i => i.status === stat);

    const sortFilter = document.getElementById("sortFilter");
    const sort = sortFilter ? sortFilter.value : "priority";
    if (sort === "priority") filtered.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    else filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const maxVotes = Math.max(...dbIssues.map(i => i.votes || 0), 0);

    filtered.forEach(issue => {
        const priorityInfo = getPriority(issue.votes || 0);
        const isCritical = (issue.votes || 0) === maxVotes && (issue.votes || 0) > 0;
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
                        <i class="fa-solid fa-arrow-up"></i> ${issue.votes || 0}
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
 * 7. MAP & MODAL UI
 *************************************************/
function initMap() {
    const mapEl = document.getElementById('map');
    if(!mapEl || mapInitialized) return;
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
    const stEl = document.getElementById("statTotal");
    if(stEl) stEl.innerText = dbIssues.length;
    
    const catFreq = {};
    let maxCat = "-", maxCount = 0;
    dbIssues.forEach(i => {
        catFreq[i.category] = (catFreq[i.category] || 0) + 1;
        if (catFreq[i.category] > maxCount) {
            maxCount = catFreq[i.category];
            maxCat = i.category;
        }
    });
    const stCatEl = document.getElementById("statCommonCategory");
    if(stCatEl) stCatEl.innerText = maxCat;

    const highestVoted = dbIssues.reduce((prev, current) => ((prev.votes || 0) > (current.votes || 0)) ? prev : current, { votes: -1 });
    const stCritEl = document.getElementById("statCritical");
    if(stCritEl) stCritEl.innerText = highestVoted.votes > -1 ? (highestVoted.location || "-").split(',')[0] : "-";
}

function openDetails(id) {
    const issue = dbIssues.find(i => i.id === id);
    if (!issue) return;

    const priorityInfo = getPriority(issue.votes || 0);
    let statusClass = "status-pending";
    if (issue.status === "In Progress") statusClass = "status-progress";
    if (issue.status === "Review") statusClass = "status-review";
    if (issue.status === "Resolved") statusClass = "status-resolved";
    if (issue.status === "Reopened") statusClass = "status-reopened";

    let actionButtons = '';
    if (currentRole === "admin") {
        if (issue.status === "Pending" || issue.status === "Reopened") {
            actionButtons = `<button class="btn btn-primary" onclick="markInProgress('${issue.id}'); hideModal('detailsModal')"><i class="fa-solid fa-hammer"></i> Pick Up Issue</button>`;
        } else if (issue.status === "In Progress") {
            actionButtons = `<button class="btn btn-success" onclick="openAdminModal('${issue.id}'); hideModal('detailsModal')"><i class="fa-solid fa-camera"></i> Provide Fix Proof</button>`;
        }
    } else {
        if (issue.status === "Review") {
            actionButtons = `
                <button class="btn btn-danger" onclick="verifyFix('${issue.id}', false)"><i class="fa-solid fa-xmark"></i> Reject</button>
                <button class="btn btn-success" onclick="verifyFix('${issue.id}', true)"><i class="fa-solid fa-check"></i> Confirm Fix</button>
            `;
        }
    }

    const html = `
        <div class="details-header">
            <div>
                <h2>${issue.category}</h2>
                <div style="font-size: 1rem; color: var(--text-main); margin-bottom: 1rem;"><i class="fa-solid fa-location-dot"></i> ${issue.locationDetail ? `${issue.locationDetail.street1}, ${issue.locationDetail.city}, ${issue.locationDetail.zip}` : issue.location}</div>
                <div class="details-badges">
                    <span class="badge ${statusClass}">${issue.status === "Review" ? "Needs Verification" : issue.status}</span>
                    <span class="badge" style="background:#4F46E5;"><i class="fa-regular fa-clock"></i> ${timeAgo(issue.timestamp)}</span>
                    <span class="badge" style="background:transparent; border:1px solid #E2E8F0; color:#0F172A;"><i class="fa-solid fa-fire" style="color:#EF4444;"></i> ${priorityInfo.level} Priority</span>
                </div>
            </div>
            <button class="upvote-btn" onclick="upvoteIssue('${issue.id}', event); hideModal('detailsModal'); setTimeout(()=>openDetails('${issue.id}'),200)">
                <i class="fa-solid fa-arrow-up"></i> ${issue.votes || 0}
            </button>
        </div>
        <p style="font-size: 1.125rem; color: #475569; margin-bottom: 2rem;">${issue.description}</p>
        <div class="media-comparison">
            <div class="media-side"><h4>Problem Reported</h4><img src="${issue.beforeImg}"></div>
            ${issue.proofImg ? `<div class="media-side"><h4>Address Proof</h4><img src="${issue.proofImg}"></div>` : ''}
            ${issue.afterImg ? `<div class="media-side"><h4>Resolution Proof</h4><img src="${issue.afterImg}"></div>` : ''}
        </div>
        <div class="details-actions">${actionButtons || '<span style="color:#64748B;">No actions available.</span>'}</div>
    `;
    document.getElementById("detailsModalBody").innerHTML = html;
    showModal("detailsModal");
}

function showModal(id) { document.getElementById(id).style.display = "flex"; }
function hideModal(id) { document.getElementById(id).style.display = "none"; }
function markInProgress(id) { db.collection("issues").doc(id).update({ status: "In Progress" }); }
function verifyFix(id, isConfirmed) { db.collection("issues").doc(id).update({ status: isConfirmed ? "Resolved" : "Reopened" }); hideModal("detailsModal"); }
function openAdminModal(id) { issueToResolve = id; showModal("adminModal"); }

/*************************************************
 * 8. AUTHENTICATION (Login / Register)
 *************************************************/
async function loginUser(type) {
    const errorDiv = document.getElementById(type === 'citizen' ? "citError" : "admError");
    if(errorDiv) errorDiv.style.display = "none";
    
    const email = document.getElementById(type === 'citizen' ? "citEmail" : "admEmail").value.trim();
    const password = document.getElementById(type === 'citizen' ? "citPassword" : "admPassword").value;
    
    if (!email || !password) {
        if(errorDiv) { errorDiv.innerText = "Please fill in all credentials."; errorDiv.style.display = "block"; }
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        window.location.href = "index.html";
    } catch (err) {
        if(errorDiv) { errorDiv.innerText = err.message; errorDiv.style.display = "block"; }
    }
}

async function registerUser(type) {
    const errorDiv = document.getElementById(type === 'citizen' ? "citError" : "admError");
    if(errorDiv) errorDiv.style.display = "none";
    
    let email, password, name, phone, ward;
    
    if (type === 'citizen') {
        email = document.getElementById("regEmail").value.trim();
        password = document.getElementById("regPassword").value;
        name = document.getElementById("regName").value.trim();
        phone = document.getElementById("regPhone").value.trim();
        ward = document.getElementById("regWard").value.trim();
    } else {
        email = document.getElementById("admRegEmail").value.trim();
        password = document.getElementById("admRegPassword").value;
        name = document.getElementById("admRegName").value.trim();
        phone = ""; 
        ward = document.getElementById("admRegDept").value.trim(); // Mapping Dept to Ward for simplicity in users collection
    }
    
    if (!email || !password || !name || !ward) {
        if(errorDiv) { errorDiv.innerText = "Please fill in all required fields."; errorDiv.style.display = "block"; }
        return;
    }

    try {
        const { user } = await auth.createUserWithEmailAndPassword(email, password);
        const role = type;
        await db.collection("users").doc(user.uid).set({ role, name, phone, ward });
        window.location.href = "index.html";
    } catch (err) {
        if(errorDiv) { errorDiv.innerText = err.message; errorDiv.style.display = "block"; }
    }
}

async function saveProfile() {
    if (!currentUserUID) return;
    const name = document.getElementById("profName").value.trim();
    const phone = document.getElementById("profPhone").value.trim();
    const ward = document.getElementById("profWard").value.trim();
    
    try {
        await db.collection("users").doc(currentUserUID).set({ name, phone, ward }, { merge: true });
        const success = document.getElementById("profSuccess");
        if(success) {
            success.style.display = "block";
            setTimeout(() => { success.style.display = "none"; }, 3000);
        }
        // Update local UI
        const navUserNameEl = document.getElementById("navUserName");
        if(navUserNameEl) navUserNameEl.innerText = name;
        const profileNameEl = document.getElementById("profileName");
        if(profileNameEl) profileNameEl.innerText = name;
    } catch (err) {
        alert("Failed to update profile: " + err.message);
    }
}

function saveSettings() {
    const theme = document.getElementById("themeSelect").value;
    const lang = document.getElementById("langSelect").value;
    
    localStorage.setItem("fixmyarea_theme", theme);
    localStorage.setItem("fixmyarea_lang", lang);
    
    applyTheme(theme);
    applyLanguage(lang);
    
    const toast = document.getElementById("settingsToast");
    if(toast) {
        toast.style.display = "block";
        setTimeout(() => { toast.style.display = "none"; }, 3000);
    }
}

async function handleForgotPassword(type) {
    const emailInput = document.getElementById(type === 'citizen' ? "citEmail" : "admEmail");
    const email = emailInput.value.trim();
    
    if (!email) {
        alert("Please enter your email address first so we can send a reset link.");
        emailInput.focus();
        return;
    }

    if (confirm(`Send password reset email to ${email}?`)) {
        try {
            await auth.sendPasswordResetEmail(email);
            alert("Success! Please check your inbox for the password reset link.");
        } catch (err) {
            alert("Failed to send reset email: " + err.message);
        }
    }
}

