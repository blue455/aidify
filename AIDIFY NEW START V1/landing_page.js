// AIDIFY Landing Page JavaScript Functionality

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    startAnimations();
});

// Initialize Page
function initializePage() {
    // Start countdown timer
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    // Initialize statistics counter animation
    animateStatistics();
    
    // Setup intersection observer for animations
    setupIntersectionObserver();
    
    // Check for saved language preference
    loadLanguagePreference();
}

// Setup Event Listeners
function setupEventListeners() {
    // Newsletter form submission
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }
    
    // Pre-signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handlePreSignup);
    }
    
    // Language switcher
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', handleLanguageChange);
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Header scroll effect
    window.addEventListener('scroll', handleHeaderScroll);
    
    // Modal close functionality
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeSignup();
            }
        });
    }
}

// Countdown Timer
function updateCountdown() {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;
    
    const now = new Date().getTime();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const distance = midnight.getTime() - now;
    
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    countdownElement.innerHTML = 
        String(hours).padStart(2, '0') + ':' + 
        String(minutes).padStart(2, '0') + ':' + 
        String(seconds).padStart(2, '0');
}

// Statistics Counter Animation
function animateStatistics() {
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach(item => {
        const numberElement = item.querySelector('.stat-number');
        const target = parseInt(numberElement.getAttribute('data-target'));
        let current = 0;
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            numberElement.textContent = Math.floor(current).toLocaleString();
        }, 16);
    });
}

// Intersection Observer for Animations
function setupIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.style.transition = 'all 0.6s ease';
            }
        });
    }, observerOptions);
    
    // Observe all animated elements
    const animatedElements = document.querySelectorAll('.feature-card, .testimonial, .category-tile, .stat-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
}

// Newsletter Subscription
function handleNewsletterSubmit(e) {
    e.preventDefault();
    const emailInput = document.getElementById('newsletterEmail');
    const email = emailInput.value.trim();
    
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Simulate API call
    simulateApiCall('newsletter', email)
        .then(() => {
            showNotification('🎉 Thank you for subscribing to our newsletter!', 'success');
            emailInput.value = '';
        })
        .catch(() => {
            showNotification('❌ Something went wrong. Please try again.', 'error');
        });
}

// Pre-signup Form
function handlePreSignup(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name') || '';
    const email = formData.get('email') || '';
    
    if (!name.trim() || !validateEmail(email)) {
        showNotification('Please fill in all fields correctly', 'error');
        return;
    }
    
    // Simulate API call
    simulateApiCall('presignup', { name, email })
        .then(() => {
            showNotification('🎉 Thank you for pre-signing up! We\'ll be in touch soon.', 'success');
            closeSignup();
            e.target.reset();
        })
        .catch(() => {
            showNotification('❌ Something went wrong. Please try again.', 'error');
        });
}

// Language Switcher
function handleLanguageChange(e) {
    const selectedLang = e.target.value;
    saveLanguagePreference(selectedLang);
    
    // Show language change notification
    showNotification(`Language changed to ${selectedLang}`, 'info');
    
    // Here you would typically load language files or update content
    // For demo purposes, we'll just show a notification
}

function saveLanguagePreference(lang) {
    localStorage.setItem('aidify_language', lang);
}

function loadLanguagePreference() {
    const savedLang = localStorage.getItem('aidify_language');
    if (savedLang) {
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = savedLang;
        }
    }
}

// Header Scroll Effect
function handleHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
        header.style.boxShadow = 'var(--shadow-md)';
    } else {
        header.style.background = 'white';
        header.style.backdropFilter = 'none';
        header.style.boxShadow = 'var(--shadow-sm)';
    }
}

// Modal Functions
function openSignup() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeSignup() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Navigation Functions
function navigateToCategory(category) {
    showNotification(`Navigating to ${category} category...`, 'info');
    // In a real implementation, this would redirect to the category page
}

function startShopping() {
    showNotification('🛍️ Welcome to AIDIFY Shopping!', 'success');
    // In a real implementation, this would redirect to the shopping page
}

function openStore() {
    showNotification('🏪 Opening your store dashboard...', 'success');
    // In a real implementation, this would redirect to the seller dashboard
}

// Utility Functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 500;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 1rem;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#44bba4',
        error: '#ff5a5f',
        info: '#3797a4',
        warning: '#ffc107'
    };
    notification.style.background = colors[type] || colors.info;
    
    // Add close button styles
    const closeBtn = notification.querySelector('button');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        margin: 0;
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// Simulate API Call (for demo purposes)
function simulateApiCall(endpoint, data) {
    return new Promise((resolve, reject) => {
        // Simulate network delay
        setTimeout(() => {
            // 90% success rate for demo
            if (Math.random() > 0.1) {
                console.log(`API call to ${endpoint} successful:`, data);
                resolve({ success: true, message: 'Operation completed successfully' });
            } else {
                console.log(`API call to ${endpoint} failed:`, data);
                reject({ success: false, message: 'Network error' });
            }
        }, 1000);
    });
}

// Start Animations
function startAnimations() {
    // Add floating animation to specific elements
    const floatingElements = document.querySelectorAll('.floating');
    floatingElements.forEach(el => {
        el.style.animation = 'floating 3s ease-in-out infinite';
    });
    
    // Add hover effects to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = 'var(--shadow-lg)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'var(--shadow-md)';
        });
    });
    
    // Add image hover effects
    const images = document.querySelectorAll('.image-stack img');
    images.forEach(img => {
        img.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05) rotate(2deg)';
        });
        
        img.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0)';
        });
    });
}

// Keyboard Navigation Support
document.addEventListener('keydown', function(e) {
    // Close modal on ESC key
    if (e.key === 'Escape') {
        closeSignup();
    }
    
    // Focus trap for modal
    const modal = document.getElementById('signupModal');
    if (modal && modal.style.display === 'block') {
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    }
});

// Performance Optimization
// Debounce scroll events
let scrollTimeout;
window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleHeaderScroll, 100);
});

// Lazy loading for images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Export functions for global access
window.openSignup = openSignup;
window.closeSignup = closeSignup;
window.startShopping = startShopping;
window.openStore = openStore;
window.navigateToCategory = navigateToCategory;

// Initialize when page loads
window.onload = initializePage;
