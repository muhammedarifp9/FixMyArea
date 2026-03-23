/*************************************************
 * 1. SUPABASE CONFIGURATION
 *************************************************/
const SUPABASE_URL = "https://jzvroggvpgnbvtmyadxv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GjDs6el6czW7VSOlcp65Rg_RmErMInn";

let supabase;
try {
    supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase initialized successfully.");
} catch (err) {
    console.error("Supabase Initialization Error:", err);
}

// Global state shorthand for compatibility with existing functions
const auth = supabase ? supabase.auth : null;
const db = supabase; 

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
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
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
    const currentTheme = localStorage.getItem("fixmyarea_theme") || "light";
    const currentLang = localStorage.getItem("fixmyarea_lang") || "en";
    applyTheme(currentTheme);
    applyLanguage(currentLang);
    initMap();

    setupEventListeners();

    if (supabase) {
        supabase.auth.onAuthStateChange(async (event, session) => {
            const user = session?.user;
            if (user) {
                try {
                    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
                    const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
                    const role = roleData?.role || "citizen";
                    const name = profile?.full_name || user.email.split('@')[0];
                    handleSuccessfulLogin({ uid: user.id, email: user.email }, role, name);
                } catch(e) { 
                    handleSuccessfulLogin({ uid: user.id, email: user.email }, "citizen", "User");
                }
            } else {
                handleLogoutUI();
            }
        });
    }

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

    if(window.location.pathname.includes('report.html')) {
        const guestView = document.getElementById("guestReportView");
        const userView = document.getElementById("reportForm");
        if(guestView && userView) {
            if(currentUserUID) { guestView.style.display = "none"; userView.style.display = "block"; }
            else { guestView.style.display = "block"; userView.style.display = "none"; }
        }
    }
    
    document.querySelectorAll(".close").forEach(btn => {
        btn.addEventListener("click", (e) => hideModal(e.target.closest(".modal").id));
    });

    const searchInput = document.getElementById("searchInput");
    if(searchInput) searchInput.addEventListener("input", renderIssues);

    document.querySelectorAll(".custom-dropdown-container").forEach(container => {
        const btn = container.querySelector(".custom-dropdown-btn");
        if(!btn) return;
        const hiddenInput = container.querySelector("input[type='hidden']");
        const selectedText = container.querySelector(".dropdown-selected-text");
        btn.addEventListener("click", (e) => { e.stopPropagation(); container.classList.toggle("active"); });
        container.querySelectorAll(".dropdown-item").forEach(item => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                selectedText.innerText = item.innerText;
                hiddenInput.value = item.getAttribute("data-value");
                container.classList.remove("active");
                renderIssues();
            });
        });
    });

    const profileBtn = document.getElementById("btnProfileToggle");
    if(profileBtn) profileBtn.addEventListener("click", (e) => { e.stopPropagation(); document.getElementById("userProfile").classList.toggle("active"); });
    document.addEventListener("click", () => document.querySelectorAll(".custom-dropdown-container, .profile-dropdown-container").forEach(c => c.classList.remove("active")));

    const reportForm = document.getElementById("reportForm");
    if(reportForm) reportForm.addEventListener("submit", handleReportSubmit);
    const adminForm = document.getElementById("adminForm");
    if(adminForm) adminForm.addEventListener("submit", handleAdminSubmit);
}

function handleSuccessfulLogin(user, role, name) {
    currentUserUID = user.uid;
    currentRole = role;
    localStorage.setItem('fixmyarea_user', JSON.stringify({ uid: user.uid, role, name }));
    if (typeof initNavigation === "function") initNavigation();

    const profileNameEl = document.getElementById("profileName");
    if(profileNameEl) profileNameEl.innerText = name;
    const initialsEl = document.getElementById("profileAvatarInitials");
    if(initialsEl) {
        initialsEl.innerText = name.substring(0, 1).toUpperCase();
        initialsEl.style.background = "var(--primary)";
    }
    listenToIssues();
}

function handleLogoutUI() {
    currentUserUID = null;
    currentRole = null;
    localStorage.removeItem('fixmyarea_user');
    if (typeof initNavigation === "function") initNavigation();
    listenToIssues();
}

/*************************************************
 * 4. AUTH OPERATIONS
 *************************************************/
async function registerUser(portalType) {
    const email = portalType === 'citizen' ? document.getElementById('regEmail').value : document.getElementById('admRegEmail').value;
    const password = portalType === 'citizen' ? document.getElementById('regPassword').value : document.getElementById('admRegPassword').value;
    const fullName = portalType === 'citizen' ? document.getElementById('regName').value : document.getElementById('admRegName').value;
    const phone = portalType === 'citizen' ? document.getElementById('regPhone').value : "";
    const ward = portalType === 'citizen' ? document.getElementById('regWard').value : document.getElementById('admRegDept').value;
    const errorEl = portalType === 'citizen' ? document.getElementById('citError') : document.getElementById('admError');

    try {
        const { data, error } = await supabase.auth.signUp({
            email, password, options: { data: { full_name: fullName, phone, ward } }
        });
        if (error) throw error;
        alert("Success! Check email for verification.");
        window.location.href = 'login.html';
    } catch (err) {
        if (errorEl) { errorEl.innerText = err.message; errorEl.style.display = 'block'; }
    }
}

async function loginUser(portalType) {
    const email = portalType === 'citizen' ? document.getElementById('citEmail').value : document.getElementById('admEmail').value;
    const password = portalType === 'citizen' ? document.getElementById('citPassword').value : document.getElementById('admPassword').value;
    const errorEl = portalType === 'citizen' ? document.getElementById('citError') : document.getElementById('admError');

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (err) {
        if (errorEl) { errorEl.innerText = err.message; errorEl.style.display = 'block'; }
    }
}

async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem("fixmyarea_user");
    window.location.href = "index.html";
}

/*************************************************
 * 5. DATABASE OPERATIONS
 *************************************************/
async function listenToIssues() {
    const { data, error } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
    if (error) return;
    dbIssues = data.map(i => ({
        id: i.id, category: i.category, location: i.location_text, description: i.description,
        beforeImg: i.before_image_url, afterImg: i.after_image_url, 
        status: mapSupabaseStatusToUI(i.status), votes: i.votes_count, timestamp: i.created_at,
        lat: i.latitude, lng: i.longitude
    }));
    renderIssues();
}

function mapSupabaseStatusToUI(status) {
    const m = { 'pending_moderation': 'Moderation', 'pending': 'Pending', 'in_progress': 'In Progress', 'review': 'Review', 'resolved': 'Resolved' };
    return m[status] || status;
}

async function upvoteIssue(id, event) {
    if (event) event.stopPropagation();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { window.location.href = 'login.html'; return; }
    try {
        await supabase.from('issue_votes').insert([{ issue_id: id, user_id: user.id }]);
        const { data } = await supabase.from('issues').select('votes_count').eq('id', id).single();
        await supabase.from('issues').update({ votes_count: (data.votes_count || 0) + 1 }).eq('id', id);
        listenToIssues();
    } catch (e) { console.error(e); }
}

async function handleReportSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("btnReportSubmit");
    submitBtn.disabled = true;
    try {
        const file = document.getElementById("issueFile").files[0];
        const fileName = `${Date.now()}_${file.name}`;
        await supabase.storage.from('issue-images').upload(`before/${fileName}`, file);
        const { data: { publicUrl } } = supabase.storage.from('issue-images').getPublicUrl(`before/${fileName}`);

        await supabase.from('issues').insert([{
            reporter_id: (await supabase.auth.getUser()).data.user.id,
            category: document.getElementById("issueCategory").value,
            description: document.getElementById("issueDescription").value,
            location_text: document.getElementById("loc_street1").value,
            before_image_url: publicUrl,
            status: 'pending'
        }]);
        window.location.href = 'index.html';
    } catch (err) { alert(err.message); submitBtn.disabled = false; }
}

async function handleAdminSubmit(e) {
    e.preventDefault();
    const file = document.getElementById("adminFile").files[0];
    const fileName = `${Date.now()}_${file.name}`;
    await supabase.storage.from('issue-images').upload(`after/${fileName}`, file);
    const { data: { publicUrl } } = supabase.storage.from('issue-images').getPublicUrl(`after/${fileName}`);
    await supabase.from('issues').update({ after_image_url: publicUrl, status: 'review' }).eq('id', issueToResolve);
    hideModal("adminModal");
    listenToIssues();
}

async function markInProgress(id) { await supabase.from('issues').update({ status: 'in_progress' }).eq('id', id); listenToIssues(); }
async function verifyFix(id, ok) { await supabase.from('issues').update({ status: ok ? 'resolved' : 'pending' }).eq('id', id); listenToIssues(); }

/*************************************************
 * 6. UI RENDERING
 *************************************************/
function renderIssues() {
    const grid = document.getElementById("issuesGrid");
    if(!grid) return;
    grid.innerHTML = "";
    dbIssues.forEach(issue => {
        const card = document.createElement("div");
        card.className = "issue-card";
        card.innerHTML = `
            <div class="card-image-wrap"><img src="${issue.beforeImg}" class="card-image"></div>
            <div class="card-content">
                <div class="category-text">${issue.category}</div>
                <div class="card-location">${issue.location}</div>
                <p class="card-desc">${issue.description}</p>
                <div class="card-footer">
                    <button class="upvote-btn" onclick="upvoteIssue('${issue.id}', event)"><i class="fa-solid fa-arrow-up"></i> ${issue.votes}</button>
                    <button class="btn btn-outline" onclick="openDetails('${issue.id}')">Details</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    updateMap(dbIssues);
}

function initMap() {
    const el = document.getElementById('map');
    if(!el || mapInitialized) return;
    leafletMap = L.map('map').setView([11.25, 75.77], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap);
    mapInitialized = true;
}

function updateMap(list) {
    if(!leafletMap) return;
    currentMarkers.forEach(m => leafletMap.removeLayer(m));
    list.forEach(i => {
        if(i.lat && i.lng) {
            const m = L.marker([i.lat, i.lng]).addTo(leafletMap).on('click', () => openDetails(i.id));
            currentMarkers.push(m);
        }
    });
}

function openDetails(id) {
    const issue = dbIssues.find(i => i.id === id);
    if(!issue) return;
    issueToResolve = id;
    let actions = '';
    if(currentRole === 'admin') {
        if(issue.status === 'Pending') actions = `<button class="btn btn-primary" onclick="markInProgress('${id}')">Pick Up</button>`;
        else if(issue.status === 'In Progress') actions = `<button class="btn btn-success" onclick="showModal('adminModal')">Resolve</button>`;
    } else if(issue.status === 'Review') {
        actions = `<button class="btn btn-success" onclick="verifyFix('${id}', true)">Confirm</button> <button class="btn btn-danger" onclick="verifyFix('${id}', false)">Reject</button>`;
    }
    document.getElementById("detailsModalBody").innerHTML = `<h3>${issue.category}</h3><p>${issue.description}</p><div>${actions}</div>`;
    showModal("detailsModal");
}

function showModal(id) { document.getElementById(id).style.display = "flex"; }
function hideModal(id) { document.getElementById(id).style.display = "none"; }

async function saveProfile() {
    const user = (await supabase.auth.getUser()).data.user;
    await supabase.from('profiles').upsert({
        user_id: user.id,
        full_name: document.getElementById("profName").value,
        phone: document.getElementById("profPhone").value,
        ward: document.getElementById("profWard").value
    });
    alert("Profile Saved!");
}

function saveSettings() {
    localStorage.setItem("fixmyarea_theme", document.getElementById("themeSelect").value);
    localStorage.setItem("fixmyarea_lang", document.getElementById("langSelect").value);
    location.reload();
}
