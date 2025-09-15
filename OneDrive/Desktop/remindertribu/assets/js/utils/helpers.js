/**
 * Helper Utilities
 * Common utility functions used across the application
 */

window.AppHelpers = {
    
    // Date and Time Utilities
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        return dateObj.toLocaleDateString('it-IT', formatOptions);
    },
    
    formatDateTime(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        return dateObj.toLocaleString('it-IT', formatOptions);
    },
    
    getRelativeTime(date) {
        const now = new Date();
        const targetDate = typeof date === 'string' ? new Date(date) : date;
        const diffTime = targetDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Oggi';
        } else if (diffDays === 1) {
            return 'Domani';
        } else if (diffDays === -1) {
            return 'Ieri';
        } else if (diffDays > 1 && diffDays <= 7) {
            return `Tra ${diffDays} giorni`;
        } else if (diffDays < -1 && diffDays >= -7) {
            return `${Math.abs(diffDays)} giorni fa`;
        } else {
            return this.formatDate(targetDate);
        }
    },
    
    // String Utilities
    truncate(text, maxLength = 50, suffix = '...') {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + suffix;
    },
    
    slugify(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },
    
    capitalizeFirst(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },
    
    // Number Utilities
    formatNumber(num, locale = 'it-IT') {
        return new Intl.NumberFormat(locale).format(num);
    },
    
    formatCurrency(amount, currency = 'EUR', locale = 'it-IT') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    formatPercentage(value, decimals = 1) {
        return `${Number(value).toFixed(decimals)}%`;
    },
    
    // Phone Number Utilities
    formatPhone(phone) {
        if (!phone) return '';
        
        // Remove all non-numeric characters except +
        let cleaned = phone.replace(/[^\d+]/g, '');
        
        // Format Italian mobile numbers
        if (cleaned.startsWith('+39')) {
            const number = cleaned.substring(3);
            if (number.length === 10) {
                return `+39 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
            }
        }
        
        return phone;
    },
    
    validatePhone(phone) {
        if (!phone) return false;
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        return phoneRegex.test(cleanPhone) && cleanPhone.length >= 8;
    },
    
    // Email Utilities
    validateEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Array Utilities
    unique(array) {
        return [...new Set(array)];
    },
    
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(item);
            return groups;
        }, {});
    },
    
    sortBy(array, key, direction = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (direction === 'desc') {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
    },
    
    // Object Utilities
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    isEmpty(obj) {
        if (!obj) return true;
        if (Array.isArray(obj)) return obj.length === 0;
        return Object.keys(obj).length === 0;
    },
    
    // DOM Utilities
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        
        return element;
    },
    
    // Local Storage Utilities
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Storage get error:', error);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        }
    },
    
    // URL Utilities
    getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },
    
    buildQueryString(params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                searchParams.append(key, value);
            }
        });
        return searchParams.toString();
    },
    
    // Random Utilities
    generateId(prefix = 'id') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${prefix}_${timestamp}_${random}`;
    },
    
    randomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // Animation Utilities
    smoothScrollTo(element, offset = 0) {
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    },
    
    fadeIn(element, duration = 300) {
        element.style.opacity = 0;
        element.style.display = 'block';
        
        const start = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    },
    
    fadeOut(element, duration = 300) {
        const start = performance.now();
        const startOpacity = parseFloat(window.getComputedStyle(element).opacity);
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = startOpacity * (1 - progress);
            
            if (progress >= 1) {
                element.style.display = 'none';
            } else {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    },
    
    // Debug Utilities
    log(message, data = null, type = 'info') {
        if (!window.AppConfig.environment.isDevelopment) return;
        
        const styles = {
            info: 'color: #3498db',
            success: 'color: #2ecc71',
            warning: 'color: #f39c12',
            error: 'color: #e74c3c'
        };
        
        console.log(`%c[RemindPro] ${message}`, styles[type] || styles.info, data || '');
    }
};

// Make helpers globally available
window.$ = window.AppHelpers;