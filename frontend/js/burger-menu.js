/**
 * Burger Menu Controller for Mobile Navigation
 * Handles sidebar toggle on mobile devices
 */

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        initBurgerMenu();
    });
    
    function initBurgerMenu() {
        // Create burger menu button
        const burgerButton = document.createElement('button');
        burgerButton.className = 'burger-menu';
        burgerButton.setAttribute('aria-label', 'فتح القائمة');
        burgerButton.innerHTML = `
            <div class="burger-icon">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        
        // Add to body
        document.body.appendChild(burgerButton);
        document.body.appendChild(overlay);
        
        // Get sidebar
        const sidebar = document.getElementById('sidebar');
        
        if (!sidebar) {
            console.error('Sidebar element not found');
            return;
        }
        
        // Toggle sidebar function
        function toggleSidebar() {
            const isActive = sidebar.classList.contains('active');
            
            if (isActive) {
                closeSidebar();
            } else {
                openSidebar();
            }
        }
        
        function openSidebar() {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            burgerButton.classList.add('active');
            overlay.style.display = 'block';
            document.body.classList.add('sidebar-open');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        }
        
        function closeSidebar() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            burgerButton.classList.remove('active');
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                if (!overlay.classList.contains('active')) {
                    overlay.style.display = 'none';
                }
            }, 300);
            
            document.body.classList.remove('sidebar-open');
            document.body.style.overflow = ''; // Restore scrolling
            document.body.style.position = '';
            document.body.style.width = '';
        }
        
        // Event listeners
        burgerButton.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', closeSidebar);
        
        // Close sidebar when clicking on a menu link (mobile only)
        const menuLinks = sidebar.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                // Only close on mobile
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            });
        });
        
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                // Close sidebar if window is resized to desktop
                if (window.innerWidth > 768) {
                    closeSidebar();
                }
            }, 250);
        });
        
        // Handle escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                closeSidebar();
            }
        });
        
        console.log('[Burger Menu] Initialized successfully');
    }
})();
