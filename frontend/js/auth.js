// Authentication JavaScript
console.log('[Auth] 🔐 Initializing...');

// Users database (in production, this should be in a secure backend)
const USERS = {
    'admin': {
        password: 'darquran2026',
        role: 'admin',
        name: 'المدير'
    },
    'user': {
        password: 'user123',
        role: 'user',
        name: 'مستخدم'
    }
};

const SESSION_KEY = 'darquran_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Restricted pages for regular users
const RESTRICTED_PAGES = [
    'teacher-salaries.html',
    'treasury.html',
    'reports.html'
];

// Check if already logged in
function checkAuth() {
    const session = localStorage.getItem(SESSION_KEY);
    
    if (session) {
        try {
            const sessionData = JSON.parse(session);
            const now = new Date().getTime();
            
            // Check if session is still valid
            if (sessionData.expiry && now < sessionData.expiry) {
                console.log('[Auth] ✅ Valid session found');
                return sessionData;
            } else {
                console.log('[Auth] ⏰ Session expired');
                localStorage.removeItem(SESSION_KEY);
                return null;
            }
        } catch (e) {
            console.error('[Auth] ❌ Invalid session data');
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
    }
    
    return null;
}

// Check if user has access to current page
function checkPageAccess() {
    const session = checkAuth();
    if (!session) return false;
    
    // Admin has access to everything
    if (session.role === 'admin') return true;
    
    // Check if current page is restricted
    const currentPage = window.location.pathname.split('/').pop();
    const isRestricted = RESTRICTED_PAGES.some(page => currentPage.includes(page));
    
    if (isRestricted) {
        console.log('[Auth] ⛔ Access denied to restricted page');
        return false;
    }
    
    return true;
}

// Get current user info
function getCurrentUser() {
    return checkAuth();
}

// Redirect if already logged in
function redirectIfLoggedIn() {
    const session = checkAuth();
    if (session) {
        console.log('[Auth] 🔄 Redirecting to dashboard...');
        window.location.href = './index.html';
    }
}

// Handle login
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    
    // Hide previous errors
    errorMessage.classList.remove('show');
    
    // Disable button
    loginBtn.disabled = true;
    loginBtnText.innerHTML = '<span class="spinner"></span> جاري التحقق...';
    
    // Simulate network delay for better UX
    setTimeout(() => {
        // Validate credentials
        const user = USERS[username];
        
        if (user && user.password === password) {
            console.log('[Auth] ✅ Login successful');
            
            // Create session
            const sessionData = {
                username: username,
                role: user.role,
                name: user.name,
                loginTime: new Date().getTime(),
                expiry: new Date().getTime() + SESSION_DURATION
            };
            
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
            
            // Show success message
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: `مرحباً ${user.name}!`,
                    text: 'تم تسجيل الدخول بنجاح',
                    timer: 1500,
                    showConfirmButton: false,
                    didClose: () => {
                        window.location.href = './index.html';
                    }
                });
            } else {
                window.location.href = './index.html';
            }
        } else {
            console.log('[Auth] ❌ Invalid credentials');
            
            // Show error
            errorText.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
            errorMessage.classList.add('show');
            
            // Re-enable button
            loginBtn.disabled = false;
            loginBtnText.innerHTML = 'تسجيل الدخول <i class="fas fa-sign-in-alt"></i>';
            
            // Clear password
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
            
            // Show error alert
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ في تسجيل الدخول',
                    text: 'اسم المستخدم أو كلمة المرور غير صحيحة',
                    confirmButtonText: 'حاول مرة أخرى',
                    confirmButtonColor: '#2c5f2d'
                });
            }
        }
    }, 800);
}

// Toggle password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('togglePassword');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Logout function
function logout() {
    console.log('[Auth] 🚪 Logging out...');
    localStorage.removeItem(SESSION_KEY);
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'تم تسجيل الخروج',
            text: 'نراك قريباً',
            timer: 1500,
            showConfirmButton: false,
            didClose: () => {
                window.location.href = './login.html';
            }
        });
    } else {
        window.location.href = './login.html';
    }
}

// Protect page (call this on protected pages)
function requireAuth() {
    const session = checkAuth();
    if (!session) {
        console.log('[Auth] ⛔ Unauthorized access, redirecting to login...');
        window.location.href = './login.html';
        return false;
    }
    
    // Check page access for non-admin users
    if (!checkPageAccess()) {
        console.log('[Auth] ⛔ Access denied to this page');
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'غير مصرح',
                text: 'ليس لديك صلاحية للوصول إلى هذه الصفحة',
                confirmButtonText: 'العودة للرئيسية',
                confirmButtonColor: '#2c5f2d'
            }).then(() => {
                window.location.href = '../index.html';
            });
        } else {
            alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
            window.location.href = '../index.html';
        }
        return false;
    }
    
    return true;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Auth] ✅ Script loaded');
    
    // If on login page, check if already logged in
    if (window.location.pathname.includes('login.html')) {
        redirectIfLoggedIn();
    }
});

console.log('[Auth] ✅ Auth module ready');
