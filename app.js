// Mock Data Initial State
let issues = [
    {
        id: 1,
        category: "Roads",
        location: "5th Avenue, cross 42nd St",
        description: "Large pothole causing traffic slowdowns and potential car damage.",
        beforeImg: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400",
        afterImg: null,
        status: "Pending", // Pending, In Progress, Review, Resolved, Reopened
        votes: 42,
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: 2,
        category: "Waste",
        location: "Central Park Entrance",
        description: "Overflowing garbage bins not cleared for 3 days.",
        beforeImg: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400",
        afterImg: null,
        status: "In Progress",
        votes: 115,
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
        id: 3,
        category: "Utilities",
        location: "Elm St",
        description: "Street light flickering and broken.",
        beforeImg: "https://images.unsplash.com/photo-1494541707248-be08cbde51a9?auto=format&fit=crop&q=80&w=400",
        afterImg: "https://images.unsplash.com/photo-1498612753354-772a3068e64c?auto=format&fit=crop&q=80&w=400",
        status: "Review",
        votes: 88,
        timestamp: new Date(Date.now() - 86400000 * 10).toISOString()
    }
];

// Global State
let currentRole = "citizen"; // "citizen" | "admin"
let issueToVerify = null;
let issueToResolve = null;

// DOM Elements
const roleToggle = document.getElementById("roleToggle");
const roleLabel = document.getElementById("roleLabel");

const reportModal = document.getElementById("reportModal");
const adminModal = document.getElementById("adminModal");
const verifyModal = document.getElementById("verifyModal");

const btnOpenReport = document.getElementById("btnOpenReport");
const closeModals = document.querySelectorAll(".close");

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    renderIssues();
    updateStats();
    setupEventListeners();
});

function setupEventListeners() {
    // Role Toggle
    roleToggle.addEventListener("change", (e) => {
        currentRole = e.target.checked ? "admin" : "citizen";
        roleLabel.innerText = currentRole === "admin" ? "Admin View" : "Citizen View";
        document.body.classList.toggle("admin-mode", currentRole === "admin");
        
        // Hide/Show Report button
        btnOpenReport.style.display = currentRole === "admin" ? "none" : "inline-flex";
        
        renderIssues(); // Re-render correct buttons
    });

    // Modals open/close
    btnOpenReport.addEventListener("click", () => showModal(reportModal));
    
    closeModals.forEach(btn => {
        btn.addEventListener("click", (e) => {
            hideModal(e.target.closest(".modal"));
        });
    });

    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal")) {
            hideModal(e.target);
        }
    });

    // Filters
    document.getElementById("categoryFilter").addEventListener("change", renderIssues);
    document.getElementById("statusFilter").addEventListener("change", renderIssues);
    document.getElementById("sortFilter").addEventListener("change", renderIssues);

    // Form Submissions & Verification Actions
    document.getElementById("reportForm").addEventListener("submit", handleReportSubmit);
    document.getElementById("adminForm").addEventListener("submit", handleAdminSubmit);
    document.getElementById("btnConfirmFix").addEventListener("click", () => verifyFix(true));
    document.getElementById("btnRejectFix").addEventListener("click", () => verifyFix(false));
}

function showModal(modalElement) {
    modalElement.classList.add("active");
}

function hideModal(modalElement) {
    modalElement.classList.remove("active");
}

// Render Functions
function renderIssues() {
    const grid = document.getElementById("issuesGrid");
    grid.innerHTML = ""; // Clear existing

    let filteredIssues = issues;

    // Apply category filter
    const catFilter = document.getElementById("categoryFilter").value;
    if (catFilter !== "All") {
        filteredIssues = filteredIssues.filter(i => i.category === catFilter);
    }

    // Apply status filter
    const statFilter = document.getElementById("statusFilter").value;
    if (statFilter !== "All") {
        filteredIssues = filteredIssues.filter(i => i.status === statFilter);
    }

    // Apply sort filter
    const sortFilter = document.getElementById("sortFilter").value;
    if (sortFilter === "priority") {
        filteredIssues.sort((a, b) => b.votes - a.votes);
    } else {
        filteredIssues.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Generate HTML for each issue
    filteredIssues.forEach(issue => {
        const card = document.createElement("div");
        card.className = "issue-card";
        
        // Map status to CSS class
        let statusClass = "status-pending";
        if (issue.status === "In Progress") statusClass = "status-progress";
        else if (issue.status === "Review") statusClass = "status-review";
        else if (issue.status === "Resolved") statusClass = "status-resolved";
        else if (issue.status === "Reopened") statusClass = "status-reopened";

        // Action Buttons HTML
        let actionsHtml = `<button class="upvote-btn" onclick="upvoteIssue(${issue.id})"><i class="fa-solid fa-arrow-up"></i> ${issue.votes}</button>`;
        
        if (currentRole === "admin") {
            if (issue.status === "Pending" || issue.status === "Reopened") {
                actionsHtml += `<button class="btn btn-primary" onclick="markInProgress(${issue.id})">Start</button>`;
            } else if (issue.status === "In Progress") {
                actionsHtml += `<button class="btn btn-success" onclick="openAdminModal(${issue.id})">Provide Fix Proof</button>`;
            }
        } else {
            // Citizen view actions
            if (issue.status === "Review") {
                actionsHtml += `<button class="btn btn-primary" onclick="openVerifyModal(${issue.id})">Verify Fix</button>`;
            }
        }

        card.innerHTML = `
            <div class="card-image-wrap">
                <img src="${issue.beforeImg}" alt="Issue Image" class="card-image">
                <span class="badge ${statusClass}">${issue.status === "Review" ? "Needs Verification" : issue.status}</span>
            </div>
            <div class="card-content">
                <div class="card-header">
                    <span class="category-tag">${issue.category}</span>
                    <span class="date-tag" style="font-size:0.75rem; color:#64748B;">${new Date(issue.timestamp).toLocaleDateString()}</span>
                </div>
                <div class="card-location">
                    <i class="fa-solid fa-location-dot"></i> ${issue.location}
                </div>
                <p class="card-description">${issue.description}</p>
                <div class="card-footer">
                    ${actionsHtml}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    updateStats();
}

function updateStats() {
    document.getElementById("statTotal").innerText = issues.length;
    document.getElementById("statPending").innerText = issues.filter(i => i.status === "Review").length;
    document.getElementById("statResolved").innerText = issues.filter(i => i.status === "Resolved").length;
}

// Interactions and Workflows
function upvoteIssue(id) { 
    const issue = issues.find(i => i.id === id);
    if(issue) {
        issue.votes++;
        renderIssues();
    }
}

function handleReportSubmit(e) {
    e.preventDefault();
    const newIssue = {
        id: Date.now(),
        category: document.getElementById("issueCategory").value,
        location: document.getElementById("issueLocation").value,
        description: document.getElementById("issueDescription").value,
        beforeImg: document.getElementById("issueImage").value,
        afterImg: null,
        status: "Pending",
        votes: 0,
        timestamp: new Date().toISOString()
    };
    issues.unshift(newIssue);
    hideModal(document.getElementById("reportModal"));
    e.target.reset();
    renderIssues();
}

function markInProgress(id) { 
    const issue = issues.find(i => i.id === id);
    if(issue) {
        issue.status = "In Progress";
        renderIssues();
    }
}

function openAdminModal(id) { 
    issueToResolve = id;
    showModal(document.getElementById("adminModal"));
}

function handleAdminSubmit(e) {
    e.preventDefault();
    const issue = issues.find(i => i.id === issueToResolve);
    if(issue) {
        issue.afterImg = document.getElementById("adminAfterImage").value;
        issue.status = "Review";
        hideModal(document.getElementById("adminModal"));
        e.target.reset();
        renderIssues();
    }
}

function openVerifyModal(id) { 
    issueToVerify = id;
    const issue = issues.find(i => i.id === id);
    if(issue) {
        document.getElementById("verifyBeforeImg").src = issue.beforeImg;
        document.getElementById("verifyAfterImg").src = issue.afterImg;
        showModal(document.getElementById("verifyModal"));
    }
}

function verifyFix(isConfirmed) {
    const issue = issues.find(i => i.id === issueToVerify);
    if(issue) {
        issue.status = isConfirmed ? "Resolved" : "Reopened";
        hideModal(document.getElementById("verifyModal"));
        renderIssues();
    }
}
