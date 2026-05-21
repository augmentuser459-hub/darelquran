// Auth Guard - Protect all pages
// This script runs immediately before page loads

(function() {
    'use strict';
    
    console.log('[Auth Guard] 🔒 Checking authentication...');
    console.log('[Auth Guard] Current path:', window.location.pathname);
    
    // Restricted pages for regular users
    const RESTRICTED_PAGES = [
        'teacher-salaries.html',
        'treasury.html',
        'reports.html'
    ];
    
    // Check if this is the login page
    const isLoginPage = window.location.pathname.includes('login.html');
    
    if (isLoginPage) {
        console.log('[Auth Guard] On login page');
        // On login page, check if already logged in
        const session = localStorage.getItem('darquran_session');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                const now = new Date().getTime();
                
                if (sessionData.expiry && now < sessionData.expiry) {
                    // Already logged in, redirect to dashboard
                    console.log('[Auth Guard] Already logged in, redirecting to dashboard');
                    window.location.replace('/index.html');
                    return;
                }
            } catch (e) {
                // Invalid session, stay on login page
                console.log('[Auth Guard] Invalid session on login page');
            }
        }
        return;
    }
    
    // For all other pages, check authentication
    console.log('[Auth Guard] Checking session...');
    const session = localStorage.getItem('darquran_session');
    
    if (!session) {
        // Not logged in, redirect to login
        console.log('[Auth Guard] ❌ No session found, redirecting to login');
        window.location.replace('/login.html');
        return;
    }
    
    try {
        const sessionData = JSON.parse(session);
        const now = new Date().getTime();
        
        console.log('[Auth Guard] Session data:', sessionData);
        console.log('[Auth Guard] Current time:', now);
        console.log('[Auth Guard] Session expiry:', sessionData.expiry);
        
        // Check if session is still valid
        if (!sessionData.expiry || now >= sessionData.expiry) {
            // Session expired
            console.log('[Auth Guard] ❌ Session expired, redirecting to login');
            localStorage.removeItem('darquran_session');
            window.location.replace('/login.html');
            return;
        }
        
        // Check page access for non-admin users
        const currentPage = window.location.pathname.split('/').pop();
        const isRestricted = RESTRICTED_PAGES.some(page => currentPage.includes(page));
        
        if (isRestricted && sessionData.role !== 'admin') {
            console.log('[Auth Guard] ⛔ Access denied to restricted page');
            localStorage.setItem('access_denied', 'true');
            window.location.replace('/index.html');
            return;
        }
        
        // Session valid, allow page to load
        console.log('[Auth Guard] ✅ Session valid, allowing page load');
        
    } catch (e) {
        // Invalid session data
        console.error('[Auth Guard] ❌ Invalid session data:', e);
        localStorage.removeItem('darquran_session');
        window.location.replace('/login.html');
    }
})();

// Logout function - Available globally
function logout() {
    console.log('[Auth] 🚪 Logging out...');
    localStorage.removeItem('darquran_session');
    console.log('[Auth] Session cleared');
    window.location.href = '/login.html';
}
