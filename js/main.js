/**
 * Main Application Script for Riddhi Siddhi Art
 * Secure, performant, and accessible
 */

(function() {
    'use strict';

    // Wait for security module
    const Security = window.AppSecurity;

    // DOM Elements (cached for performance)
    const DOM = {
        productsGrid: null,
        filterBtns: null,
        mobileMenuBtn: null,
        nav: null,
        modal: null,
        closeModal: null,
        inquiryForm: null,
        submitBtn: null,
        header: null
    };

    // Initialize DOM references
    function initDOM() {
        DOM.productsGrid = document.getElementById('productsGrid');
        DOM.filterBtns = document.querySelectorAll('.filter-btn');
        DOM.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        DOM.nav = document.getElementById('nav');
        DOM.modal = document.getElementById('productModal');
        DOM.closeModal = document.querySelector('.close-modal');
        DOM.inquiryForm = document.getElementById('inquiryForm');
        DOM.submitBtn = document.getElementById('submitBtn');
        DOM.header = document.querySelector('.header');
    }

    // Format category name safely
    function formatCategory(category) {
        const categories = {
            'ganesh': 'Ganesh Ji',
            'radha-krishna': 'Radha Krishna',
            'temple': 'Temple Work',
            'jain': 'Jain Murti'
        };
        return categories[category] || Security.Sanitizer.escapeHtml(category);
    }

    // Render Products Securely
    function renderProducts(filter = 'all') {
        if (!DOM.productsGrid || !window.productsData) return;

        // Rate limit check
        if (!Security.RateLimiter.checkLimit()) {
            console.warn('Rate limited');
            return;
        }

        // Clear existing content safely
        DOM.productsGrid.innerHTML = '';

        const filteredProducts = filter === 'all'
            ? window.productsData
            : window.productsData.filter(p => p.category === filter);

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();

        filteredProducts.forEach(product => {
            const card = document.createElement('article');
            card.className = 'product-card';
            card.setAttribute('data-id', Security.Sanitizer.escapeHtml(String(product.id)));
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `View ${Security.Sanitizer.escapeHtml(product.name)}`);

            // Create image element safely
            const img = document.createElement('img');
            img.className = 'product-image';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.src = window.getProductImage(product);
            img.alt = Security.Sanitizer.escapeHtml(product.alt || product.name);
            img.onerror = function() {
                this.onerror = null; // Prevent infinite loop
                // Use category-specific placeholder on error
                const placeholders = window.placeholderImages || {};
                this.src = placeholders[product.category] || 'https://via.placeholder.com/400x300/1a5f4a/ffffff?text=Riddhi+Siddhi+Art';
            };

            // Create info section safely
            const info = document.createElement('div');
            info.className = 'product-info';

            const title = Security.ContentSecurity.createSafeElement('h3', product.name);
            const category = Security.ContentSecurity.createSafeElement('p', formatCategory(product.category), 'category');
            const price = Security.ContentSecurity.createSafeElement('p', product.price, 'price');

            info.appendChild(title);
            info.appendChild(category);
            info.appendChild(price);

            card.appendChild(img);
            card.appendChild(info);

            // Event listeners
            card.addEventListener('click', () => openModal(product));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openModal(product);
                }
            });

            fragment.appendChild(card);
        });

        DOM.productsGrid.appendChild(fragment);
    }

    // Filter Products
    function initFilters() {
        DOM.filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                DOM.filterBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                this.classList.add('active');
                this.setAttribute('aria-selected', 'true');
                renderProducts(this.dataset.filter);
            });
        });
    }

    // Mobile Menu
    function initMobileMenu() {
        if (!DOM.mobileMenuBtn || !DOM.nav) return;

        DOM.mobileMenuBtn.addEventListener('click', function() {
            const isExpanded = DOM.nav.classList.toggle('active');
            this.setAttribute('aria-expanded', isExpanded);
            
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });

        // Close on link click
        document.querySelectorAll('.nav-list a').forEach(link => {
            link.addEventListener('click', () => {
                DOM.nav.classList.remove('active');
                DOM.mobileMenuBtn.setAttribute('aria-expanded', 'false');
                const icon = DOM.mobileMenuBtn.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            });
        });
    }

    // Modal Functions
    function openModal(product) {
        if (!DOM.modal) return;

        const modalImage = document.getElementById('modalImage');
        const modalTitle = document.getElementById('modalTitle');
        const modalCategory = document.getElementById('modalCategory');
        const modalDescription = document.getElementById('modalDescription');

        modalImage.src = window.getProductImage(product);
        modalImage.alt = Security.Sanitizer.escapeHtml(product.name);
        modalImage.onerror = function() {
            this.onerror = null;
            this.src = 'https://via.placeholder.com/400x300/1a5f4a/ffffff?text=Riddhi+Siddhi+Art';
        };
        Security.ContentSecurity.setTextContent(modalTitle, product.name);
        Security.ContentSecurity.setTextContent(modalCategory, formatCategory(product.category));
        Security.ContentSecurity.setTextContent(modalDescription, product.description);

        DOM.modal.classList.add('active');
        DOM.modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Focus trap
        DOM.closeModal.focus();
    }

    function closeModalHandler() {
        if (!DOM.modal) return;
        DOM.modal.classList.remove('active');
        DOM.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function initModal() {
        if (DOM.closeModal) {
            DOM.closeModal.addEventListener('click', closeModalHandler);
        }

        if (DOM.modal) {
            DOM.modal.addEventListener('click', (e) => {
                if (e.target === DOM.modal) {
                    closeModalHandler();
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && DOM.modal.classList.contains('active')) {
                    closeModalHandler();
                }
            });
        }
    }

    // Form Handling with Security
    function initForm() {
        if (!DOM.inquiryForm) return;

        // Real-time validation
        const inputs = DOM.inquiryForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            input.addEventListener('input', function() {
                // Clear error on input
                const errorMsg = this.parentElement.querySelector('.error-msg');
                if (errorMsg) errorMsg.textContent = '';
                this.classList.remove('invalid');
            });
        });

        DOM.inquiryForm.addEventListener('submit', handleFormSubmit);
    }

    function validateField(field) {
        const errorMsg = field.parentElement.querySelector('.error-msg');
        let result = { valid: true };

        switch (field.name) {
            case 'name':
                result = Security.FormValidator.validateName(field.value);
                break;
            case 'phone':
                result = Security.FormValidator.validatePhone(field.value);
                break;
            case 'email':
                result = Security.FormValidator.validateEmail(field.value);
                break;
            case 'message':
                result = Security.FormValidator.validateMessage(field.value);
                break;
        }

        if (!result.valid) {
            field.classList.add('invalid');
            if (errorMsg) errorMsg.textContent = result.message;
        } else {
            field.classList.remove('invalid');
            if (errorMsg) errorMsg.textContent = '';
        }

        return result.valid;
    }

    function handleFormSubmit(e) {
        e.preventDefault();

        // Bot detection
        if (Security.BotDetector.checkHoneypot()) {
            console.warn('Bot detected via honeypot');
            return;
        }

        const botCheck = Security.BotDetector.isLikelyBot();
        if (botCheck.isBot) {
            console.warn('Bot detected:', botCheck.reason);
            alert('Please interact with the page before submitting.');
            return;
        }

        // Rate limiting
        const rateCheck = Security.RateLimiter.checkFormLimit();
        if (!rateCheck.allowed) {
            alert(rateCheck.message);
            return;
        }

        // Get and validate form data
        const nameField = document.getElementById('userName');
        const phoneField = document.getElementById('userPhone');
        const emailField = document.getElementById('userEmail');
        const messageField = document.getElementById('userMessage');

        // Validate all fields
        const isNameValid = validateField(nameField);
        const isPhoneValid = validateField(phoneField);
        const isEmailValid = validateField(emailField);
        const isMessageValid = validateField(messageField);

        if (!isNameValid || !isPhoneValid || !isEmailValid || !isMessageValid) {
            return;
        }

        // Sanitize inputs
        const name = Security.Sanitizer.sanitizeInput(nameField.value);
        const phone = Security.Sanitizer.sanitizePhone(phoneField.value);
        const email = Security.Sanitizer.sanitizeInput(emailField.value);
        const message = Security.Sanitizer.sanitizeInput(messageField.value);

        // Check for malicious content
        if (Security.Sanitizer.containsMaliciousContent(name) ||
            Security.Sanitizer.containsMaliciousContent(message) ||
            Security.Sanitizer.containsMaliciousContent(email)) {
            alert('Invalid input detected. Please check your entries.');
            return;
        }

        // Disable submit button
        DOM.submitBtn.disabled = true;
        DOM.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        // Build WhatsApp message
        const whatsappMessage = `*New Inquiry from Website*
------------------------
*Name:* ${name}
*Phone:* ${phone}
*Email:* ${email || 'Not provided'}
*Message:* ${message}`;

        // Open WhatsApp
        const whatsappUrl = `https://wa.me/919321045468?text=${encodeURIComponent(whatsappMessage)}`;
        
        // Use noopener for security
        const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        
        // Reset form
        setTimeout(() => {
            DOM.inquiryForm.reset();
            DOM.submitBtn.disabled = false;
            DOM.submitBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Send via WhatsApp';
            Security.CSRFProtection.setToken(); // Regenerate token
        }, 1000);
    }

    // Smooth Scroll
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = DOM.header ? DOM.header.offsetHeight : 0;
                    const targetPosition = target.offsetTop - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Scroll Effects (throttled for performance)
    function initScrollEffects() {
        let ticking = false;

        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    updateActiveNav();
                    updateHeaderShadow();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    function updateActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                document.querySelectorAll('.nav-list a').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    function updateHeaderShadow() {
        if (DOM.header) {
            if (window.scrollY > 50) {
                DOM.header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
            } else {
                DOM.header.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            }
        }
    }

    // Initialize Application
    function init() {
        initDOM();
        initFilters();
        initMobileMenu();
        initModal();
        initForm();
        initSmoothScroll();
        initScrollEffects();
        renderProducts();

        console.log('Application initialized');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
