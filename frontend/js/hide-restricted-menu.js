// Hide restricted menu items for non-admin users
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        const session = localStorage.getItem('darquran_session');
        
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                
                // If user is not admin, hide restricted menu items
                if (sessionData.role !== 'admin') {
                    const restrictedItems = document.querySelectorAll('[data-restricted="true"]');
                    restrictedItems.forEach(item => {
                        item.style.display = 'none';
                    });
                    
                    console.log('[Menu] Hidden ' + restrictedItems.length + ' restricted items for user role');
                }
            } catch (e) {
                console.error('[Menu] Error parsing session:', e);
            }
        }
    });
})();
