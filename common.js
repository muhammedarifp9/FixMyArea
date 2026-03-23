/**
 * FixMyArea - Common Utilities & Navigation
 */

// 1. Instant Theme Loader (to be called manually if not using inline script)
function loadTheme() {
    const theme = localStorage.getItem('fixmyarea_theme');
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

// 2. Navigation & Auth UI
function initNavigation() {
    const user = JSON.parse(localStorage.getItem('fixmyarea_user'));
    const isLogined = !!user;

    // Toggle items based on data-auth attribute
    document.querySelectorAll('[data-auth]').forEach(el => {
        const requirement = el.getAttribute('data-auth');
        
        let displayObj = 'block';
        if (el.tagName === 'A') displayObj = 'inline-flex';
        if (el.classList.contains('menu-item') || el.classList.contains('nav-actions')) displayObj = 'flex';
        if (el.hasAttribute('data-display')) displayObj = el.getAttribute('data-display');

        if (requirement === 'user') {
            el.style.display = isLogined ? displayObj : 'none';
        } else if (requirement === 'guest') {
            el.style.display = isLogined ? 'none' : displayObj;
        }
    });


    // Update profile-specific elements if they exist
    const navName = document.getElementById('navUserName');
    if (navName && user) {
        navName.innerText = user.name || (user.role === 'admin' ? 'Authority' : 'Citizen');
    }

    // Highlight active link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// 3. Global Logout
function logout() {
    // Check if Supabase auth is available (from app.js)
    if (typeof supabase !== 'undefined' && supabase.auth) {
        supabase.auth.signOut().then(() => {
            localStorage.removeItem('fixmyarea_user');
            window.location.href = 'index.html';
        }).catch(err => {
            console.error("Supabase signout error:", err);
            localStorage.removeItem('fixmyarea_user');
            window.location.href = 'index.html';
        });
    } else {
        localStorage.removeItem('fixmyarea_user');
        window.location.href = 'index.html';
    }
}

// 4. Reveal Animations
function initScrollReveal() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    initNavigation();
    initScrollReveal();

    // Listen for storage changes (for multi-tab sync)
    window.addEventListener('storage', (e) => {
        if (e.key === 'fixmyarea_theme') loadTheme();
        if (e.key === 'fixmyarea_user') initNavigation();
    });
});
