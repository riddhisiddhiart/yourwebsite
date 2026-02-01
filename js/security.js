/**
 * Security Module for Riddhi Siddhi Art Website
 * Provides XSS protection, rate limiting, input validation, and bot detection
 */

(function() {
    'use strict';

    // Security Configuration
    const SecurityConfig = {
        RATE_LIMIT_WINDOW: 60000, // 1 minute
        MAX_REQUESTS_PER_WINDOW: 30,
        MAX_FORM_SUBMISSIONS: 3,
        FORM_COOLDOWN: 60000, // 1 minute between submissions
        SUSPICIOUS_PATTERNS: [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /data:/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
            /eval\s*\(/gi,
            /expression\s*\(/gi,
            /url\s*\(/gi
        ],
        SQL_INJECTION_PATTERNS: [
            /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi,
            /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
            /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
            /((\%27)|(\'))union/gi
        ]
    };

    // Rate Limiter
    const RateLimiter = {
        requests: [],
        formSubmissions: [],
        lastFormSubmit: 0,

        checkLimit: function() {
            const now = Date.now();
            this.requests = this.requests.filter(time => now - time < SecurityConfig.RATE_LIMIT_WINDOW);
            
            if (this.requests.length >= SecurityConfig.MAX_REQUESTS_PER_WINDOW) {
                console.warn('Rate limit exceeded');
                return false;
            }
            
            this.requests.push(now);
            return true;
        },

        checkFormLimit: function() {
            const now = Date.now();
            
            // Check cooldown
            if (now - this.lastFormSubmit < SecurityConfig.FORM_COOLDOWN) {
                const waitTime = Math.ceil((SecurityConfig.FORM_COOLDOWN - (now - this.lastFormSubmit)) / 1000);
                return { allowed: false, message: `Please wait ${waitTime} seconds before submitting again` };
            }

            // Check submission count
            this.formSubmissions = this.formSubmissions.filter(time => now - time < SecurityConfig.RATE_LIMIT_WINDOW * 5);
            
            if (this.formSubmissions.length >= SecurityConfig.MAX_FORM_SUBMISSIONS) {
                return { allowed: false, message: 'Too many submissions. Please try again later.' };
            }

            this.formSubmissions.push(now);
            this.lastFormSubmit = now;
            return { allowed: true };
        }
    };

    // Input Sanitizer
    const Sanitizer = {
        // Escape HTML entities
        escapeHtml: function(str) {
            if (typeof str !== 'string') return '';
            const htmlEntities = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '/': '&#x2F;',
                '`': '&#x60;',
                '=': '&#x3D;'
            };
            return str.replace(/[&<>"'`=\/]/g, char => htmlEntities[char]);
        },

        // Sanitize input for display
        sanitizeInput: function(input) {
            if (typeof input !== 'string') return '';
            
            // Remove null bytes
            let sanitized = input.replace(/\0/g, '');
            
            // Escape HTML
            sanitized = this.escapeHtml(sanitized);
            
            // Trim and limit length
            sanitized = sanitized.trim().substring(0, 10000);
            
            return sanitized;
        },

        // Validate and sanitize phone number
        sanitizePhone: function(phone) {
            if (typeof phone !== 'string') return '';
            return phone.replace(/[^\d]/g, '').substring(0, 10);
        },

        // Validate email format
        isValidEmail: function(email) {
            if (!email) return true; // Optional field
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            return emailRegex.test(email) && email.length <= 254;
        },

        // Check for malicious patterns
        containsMaliciousContent: function(input) {
            if (typeof input !== 'string') return false;
            
            for (const pattern of SecurityConfig.SUSPICIOUS_PATTERNS) {
                if (pattern.test(input)) {
                    console.warn('Suspicious pattern detected');
                    return true;
                }
            }
            
            for (const pattern of SecurityConfig.SQL_INJECTION_PATTERNS) {
                if (pattern.test(input)) {
                    console.warn('SQL injection pattern detected');
                    return true;
                }
            }
            
            return false;
        }
    };

    // Bot Detection
    const BotDetector = {
        startTime: Date.now(),
        interactions: 0,
        mouseMovements: 0,
        keystrokes: 0,

        init: function() {
            document.addEventListener('mousemove', () => this.mouseMovements++, { passive: true });
            document.addEventListener('keydown', () => this.keystrokes++, { passive: true });
            document.addEventListener('click', () => this.interactions++, { passive: true });
            document.addEventListener('scroll', () => this.interactions++, { passive: true });
        },

        isLikelyBot: function() {
            const timeOnPage = Date.now() - this.startTime;
            
            // Too fast submission (less than 3 seconds)
            if (timeOnPage < 3000) {
                return { isBot: true, reason: 'submission_too_fast' };
            }

            // No mouse movements and no keystrokes (likely automated)
            if (this.mouseMovements === 0 && this.keystrokes === 0 && this.interactions < 2) {
                return { isBot: true, reason: 'no_human_interaction' };
            }

            return { isBot: false };
        },

        checkHoneypot: function() {
            const honeypot = document.getElementById('honeypot');
            const faxField = document.querySelector('input[name="fax_number"]');
            
            if ((honeypot && honeypot.value) || (faxField && faxField.value)) {
                return true; // Bot detected
            }
            return false;
        }
    };

    // CSRF Token Generator (client-side, for additional layer)
    const CSRFProtection = {
        generateToken: function() {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        },

        setToken: function() {
            const token = this.generateToken();
            const csrfInput = document.getElementById('csrfToken');
            if (csrfInput) {
                csrfInput.value = token;
            }
            sessionStorage.setItem('csrf_token', token);
            return token;
        },

        validateToken: function(token) {
            const storedToken = sessionStorage.getItem('csrf_token');
            return token && storedToken && token === storedToken;
        }
    };

    // Form Validator
    const FormValidator = {
        validateName: function(name) {
            if (!name || name.length < 2) {
                return { valid: false, message: 'Name must be at least 2 characters' };
            }
            if (name.length > 100) {
                return { valid: false, message: 'Name is too long' };
            }
            // Allow letters, spaces, and Hindi characters
            if (!/^[a-zA-Z\s\u0900-\u097F]+$/.test(name)) {
                return { valid: false, message: 'Name contains invalid characters' };
            }
            return { valid: true };
        },

        validatePhone: function(phone) {
            if (!phone) {
                return { valid: false, message: 'Phone number is required' };
            }
            const cleanPhone = phone.replace(/[^\d]/g, '');
            if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
                return { valid: false, message: 'Enter valid 10-digit mobile number' };
            }
            return { valid: true };
        },

        validateEmail: function(email) {
            if (!email) return { valid: true }; // Optional
            if (!Sanitizer.isValidEmail(email)) {
                return { valid: false, message: 'Enter a valid email address' };
            }
            return { valid: true };
        },

        validateMessage: function(message) {
            if (!message || message.length < 10) {
                return { valid: false, message: 'Message must be at least 10 characters' };
            }
            if (message.length > 1000) {
                return { valid: false, message: 'Message is too long (max 1000 characters)' };
            }
            return { valid: true };
        }
    };

    // Content Security
    const ContentSecurity = {
        // Safe way to set text content
        setTextContent: function(element, text) {
            if (element && typeof text === 'string') {
                element.textContent = Sanitizer.sanitizeInput(text);
            }
        },

        // Safe way to create elements with text
        createSafeElement: function(tag, text, className) {
            const element = document.createElement(tag);
            if (className) element.className = className;
            if (text) element.textContent = Sanitizer.sanitizeInput(text);
            return element;
        },

        // Safe image loading
        loadImage: function(imgElement, src, alt) {
            if (!imgElement) return;
            
            // Validate image source
            const allowedProtocols = ['https:', 'data:', 'blob:'];
            const allowedDomains = ['localhost', window.location.hostname, 'images.unsplash.com', 'via.placeholder.com'];
            
            try {
                const url = new URL(src, window.location.origin);
                const isAllowedProtocol = allowedProtocols.includes(url.protocol);
                const isAllowedDomain = allowedDomains.some(domain => url.hostname.includes(domain)) || url.protocol === 'data:';
                const isRelative = src.startsWith('/') || src.startsWith('./') || !src.includes('://');
                
                if (isRelative || (isAllowedProtocol && isAllowedDomain)) {
                    imgElement.src = src;
                    imgElement.alt = Sanitizer.escapeHtml(alt || '');
                } else {
                    console.warn('Blocked image from untrusted source:', src);
                    imgElement.src = 'images/placeholder.jpg';
                    imgElement.alt = 'Image unavailable';
                }
            } catch (e) {
                // Relative path
                imgElement.src = src;
                imgElement.alt = Sanitizer.escapeHtml(alt || '');
            }
        }
    };

    // Initialize security measures
    function initSecurity() {
        BotDetector.init();
        CSRFProtection.setToken();
        
        // Set current year safely
        const yearElement = document.getElementById('currentYear');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }

        // Disable right-click on images (optional, basic protection)
        document.addEventListener('contextmenu', function(e) {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
            }
        });

        console.log('Security module initialized');
    }

    // Export to global scope
    window.AppSecurity = {
        RateLimiter,
        Sanitizer,
        BotDetector,
        CSRFProtection,
        FormValidator,
        ContentSecurity,
        init: initSecurity
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSecurity);
    } else {
        initSecurity();
    }

})();
