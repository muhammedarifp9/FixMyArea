// TimeAgo Helper
function timeAgo(dateString) {
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

// Map helper icons
const categoryIcons = {
    "Roads": "fa-road",
    "Waste": "fa-trash",
    "Drainage": "fa-water",
    "Utilities": "fa-lightbulb",
    "Toilets": "fa-restroom"
};

// Hackathon Mock Data for Kozhikode
let issues = [
    {
        id: 1,
        category: "Roads",
        location: "SM Street",
        description: "Large pothole causing traffic slowdowns and potential damage.",
        beforeImg: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400",
        afterImg: null,
        status: "Pending",
        votes: 14,
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours
        lat: 11.2514,
        lng: 75.7802
    },
    {
        id: 2,
        category: "Waste",
        location: "Kozhikode Beach",
        description: "Overflowing garbage bins near the beach walkway not cleared for 3 days.",
        beforeImg: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400",
        afterImg: null,
        status: "In Progress",
        votes: 8,
        timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day
        lat: 11.2618,
        lng: 75.7667
    },
    {
        id: 3,
        category: "Utilities",
        location: "Mananchira Square",
        description: "Street light flickering constantly, makes the park very dark at night.",
        beforeImg: "https://images.unsplash.com/photo-1494541707248-be08cbde51a9?auto=format&fit=crop&q=80&w=400",
        afterImg: "https://images.unsplash.com/photo-1498612753354-772a3068e64c?auto=format&fit=crop&q=80&w=400",
        status: "Review",
        votes: 38, // High priority
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days
        lat: 11.2554,
        lng: 75.7766
    },
    {
        id: 4,
        category: "Drainage",
        location: "Mavoor Road",
        description: "Severe water logging after recent rains. Drainage is clogged.",
        beforeImg: "https://images.unsplash.com/photo-1584812301548-7323861fb16e?auto=format&fit=crop&q=80&w=400",
        afterImg: null,
        status: "Pending",
        votes: 4, // Low priority
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours
        lat: 11.2582,
        lng: 75.7850
    },
    {
        id: 5,
        category: "Toilets",
        location: "Thondayad Bypass",
        description: "Public toilet door broken and no running water.",
        beforeImg: "https://images.unsplash.com/photo-1620306138139-4ad3c14d2ba7?auto=format&fit=crop&q=80&w=400",
        afterImg: "https://images.unsplash.com/photo-1584812301548-7323861fb16e?auto=format&fit=crop&q=80&w=400",
        status: "Resolved",
        votes: 12,
        timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days
        lat: 11.2680,
        lng: 75.8078
    }
];

// Global State
let currentRole = null; // null until logged in. "citizen" | "admin"
let issueToResolve = null;
let leafletMap = null;
let currentMarkers = [];
let mapInitialized = false;

// Init
document.addEventListener("DOMContentLoaded", () => {
    // The login overlay covers everything initially
    document.getElementById("loginOverlay").style.display = "flex";
    document.getElementById("appContainer").style.display = "none";
    
    setupEventListeners();
});

// Authentication Handlers
function loginAs(role) {
    currentRole = role;
    document.getElementById("loginOverlay").style.display = "none";
    document.getElementById("appContainer").style.display = "block";
    
    // UI Updates based on Role
    document.getElementById("profileName").innerHTML = currentRole === "admin" ? 
        '<i class="fa-solid fa-shield-halved" style="color:var(--primary);"></i> Authority Portal' : 
        '<i class="fa-solid fa-user" style="color:var(--primary);"></i> Citizen Portal';
    
    document.getElementById("btnOpenReport").style.display = currentRole === "admin" ? "none" : "inline-flex";

    // Simulate loading for demo effect
    document.getElementById("loadingSpinner").style.display = "block";
    document.getElementById("issuesGrid").innerHTML = "";
    
    setTimeout(() => {
        document.getElementById("loadingSpinner").style.display = "none";
        if (!mapInitialized) {
            initMap();
        } else {
            leafletMap.invalidateSize(); // Fix map render issue if container was hidden
        }
        renderIssues();
    }, 500);
}

function logout() {
    currentRole = null;
    document.getElementById("appContainer").style.display = "none";
    document.getElementById("loginOverlay").style.display = "flex";
}

// Setup Listeners
function setupEventListeners() {
    document.getElementById("btnOpenReport").addEventListener("click", () => showModal("reportModal"));
    
    document.querySelectorAll(".close").forEach(btn => {
        btn.addEventListener("click", (e) => hideModal(e.target.closest(".modal").id));
    });

    // Filters
    document.getElementById("searchInput").addEventListener("input", renderIssues);
    document.getElementById("categoryFilter").addEventListener("change", renderIssues);
    document.getElementById("statusFilter").addEventListener("change", renderIssues);
    document.getElementById("sortFilter").addEventListener("change", renderIssues);

    // Forms
    document.getElementById("reportForm").addEventListener("submit", handleReportSubmit);
    document.getElementById("adminForm").addEventListener("submit", handleAdminSubmit);
}

// Modal Helpers
function showModal(id) { document.getElementById(id).classList.add("active"); }
function hideModal(id) { document.getElementById(id).classList.remove("active"); }

// Priorities
function getPriority(votes) {
    if (votes > 10) return { level: "High", badge: "🔥 High" };
    if (votes >= 5) return { level: "Medium", badge: "⚡ Med" };
    return { level: "Low", badge: "🧊 Low" };
}

// Render
function renderIssues() {
    if (!currentRole) return; // safety
    
    const grid = document.getElementById("issuesGrid");
    grid.innerHTML = "";
    
    let filtered = issues;

    // Search Filter
    const query = document.getElementById("searchInput").value.toLowerCase();
    if (query) {
        filtered = filtered.filter(i => 
            i.description.toLowerCase().includes(query) || 
            i.location.toLowerCase().includes(query) ||
            i.category.toLowerCase().includes(query)
        );
    }
    
    // Category & Status
    const cat = document.getElementById("categoryFilter").value;
    if (cat !== "All") filtered = filtered.filter(i => i.category === cat);
    
    const stat = document.getElementById("statusFilter").value;
    if (stat !== "All") filtered = filtered.filter(i => i.status === stat);

    // Sort Filter
    const sort = document.getElementById("sortFilter").value;
    if (sort === "priority") filtered.sort((a, b) => b.votes - a.votes);
    else filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const maxVotes = Math.max(...issues.map(i => i.votes));

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
                    <button class="upvote-btn" onclick="upvoteIssue(${issue.id}, event)">
                        <i class="fa-solid fa-arrow-up"></i> ${issue.votes}
                    </button>
                    <button class="btn btn-outline" onclick="openDetails(${issue.id})">View Details</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    updateMap(filtered);
    updateInsights();
}

// Insights logic
function updateInsights() {
    document.getElementById("statTotal").innerText = issues.length;
    
    const catFreq = {};
    let maxCat = "-", maxCount = 0;
    issues.forEach(i => {
        catFreq[i.category] = (catFreq[i.category] || 0) + 1;
        if(catFreq[i.category] > maxCount) {
            maxCount = catFreq[i.category];
            maxCat = i.category;
        }
    });
    document.getElementById("statCommonCategory").innerText = maxCat;

    const highestVoted = issues.reduce((prev, current) => (prev.votes > current.votes) ? prev : current, {votes: -1});
    document.getElementById("statCritical").innerText = highestVoted.votes > -1 ? highestVoted.location.split(',')[0] : "-";
    
    // Recent handling correctly
    document.getElementById("statRecent").innerText = issues.length > 0 ? timeAgo(issues[Math.max(0, issues.length-1)].timestamp) : "-";
}

// Actions
function upvoteIssue(id, event) {
    if(event) event.stopPropagation();
    const issue = issues.find(i => i.id === id);
    if(issue) {
        issue.votes++;
        renderIssues();
    }
}

// Detail Modal & Verification
function openDetails(id) {
    const issue = issues.find(i => i.id === id);
    if(!issue) return;

    const priorityInfo = getPriority(issue.votes);
    let statusClass = "status-pending";
    if (issue.status === "In Progress") statusClass = "status-progress";
    if (issue.status === "Review") statusClass = "status-review";
    if (issue.status === "Resolved") statusClass = "status-resolved";
    if (issue.status === "Reopened") statusClass = "status-reopened";

    const isCitizen = currentRole === "citizen";
    let actionButtons = '';
    
    if (currentRole === "admin") {
        if (issue.status === "Pending" || issue.status === "Reopened") {
            actionButtons = `<button class="btn btn-primary" onclick="markInProgress(${issue.id}); hideModal('detailsModal')"><i class="fa-solid fa-hammer"></i> Pick Up Issue (In Progress)</button>`;
        } else if (issue.status === "In Progress") {
            actionButtons = `<button class="btn btn-success" onclick="openAdminModal(${issue.id}); hideModal('detailsModal')"><i class="fa-solid fa-camera"></i> Provide Fix Proof</button>`;
        }
    } else {
        if (issue.status === "Review") {
            actionButtons = `
                <button class="btn btn-danger" onclick="verifyFix(${issue.id}, false)"><i class="fa-solid fa-xmark"></i> Reject & Reopen</button>
                <button class="btn btn-success" onclick="verifyFix(${issue.id}, true)"><i class="fa-solid fa-check"></i> Confirm Fixed</button>
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
            <button class="upvote-btn" onclick="upvoteIssue(${issue.id}, event); hideModal('detailsModal'); setTimeout(()=>openDetails(${issue.id}),50)">
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

function verifyFix(id, isConfirmed) {
    const issue = issues.find(i => i.id === id);
    if(issue) {
        issue.status = isConfirmed ? "Resolved" : "Reopened";
        hideModal("detailsModal");
        renderIssues();
    }
}

function markInProgress(id) {
    const issue = issues.find(i => i.id === id);
    if(issue) issue.status = "In Progress";
    renderIssues();
}

function openAdminModal(id) {
    issueToResolve = id;
    showModal("adminModal");
}

function handleAdminSubmit(e) {
    e.preventDefault();
    const issue = issues.find(i => i.id === issueToResolve);
    if(issue) {
        // Mocking resolution image for demo
        issue.afterImg = "https://images.unsplash.com/photo-1584812301548-7323861fb16e?auto=format&fit=crop&q=80&w=400";
        issue.status = "Review";
        hideModal("adminModal");
        renderIssues();
    }
}

function handleReportSubmit(e) {
    e.preventDefault();
    // Simulate coordinates within Kozhikode roughly
    const lat = 11.25 + (Math.random() * 0.02);
    const lng = 75.77 + (Math.random() * 0.02);

    const newIssue = {
        id: Date.now(),
        category: document.getElementById("issueCategory").value,
        location: document.getElementById("issueLocation").value,
        description: document.getElementById("issueDescription").value,
        beforeImg: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400", // Sample img
        afterImg: null,
        status: "Pending",
        votes: 0,
        timestamp: new Date().toISOString(),
        lat: lat,
        lng: lng
    };
    issues.unshift(newIssue);
    hideModal("reportModal");
    e.target.reset();
    renderIssues();
}

// Map Logic (Kozhikode Focus)
function initMap() {
    leafletMap = L.map('map').setView([11.2588, 75.7804], 14); // Kozhikode centered properly
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(leafletMap);
    mapInitialized = true;
}

function updateMap(filteredList) {
    if(!leafletMap) return;
    // Clear old
    currentMarkers.forEach(m => leafletMap.removeLayer(m));
    currentMarkers = [];

    // Add new
    filteredList.forEach(issue => {
        if(issue.lat && issue.lng) {
            let color = "#F59E0B";
            if(issue.status === "In Progress") color = "#3B82F6";
            if(issue.status === "Review") color = "#8B5CF6";
            if(issue.status === "Resolved") color = "#10B981";

            const markerHtml = `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`;
            const icon = L.divIcon({ html: markerHtml, className: 'custom-leaflet-marker', iconSize: [16, 16], iconAnchor: [8, 8] });
            
            const marker = L.marker([issue.lat, issue.lng], {icon}).addTo(leafletMap);
            marker.on('click', () => openDetails(issue.id));
            currentMarkers.push(marker);
        }
    });
}
