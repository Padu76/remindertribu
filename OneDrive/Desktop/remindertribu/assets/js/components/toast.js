/**
 * Toast Component
 * Handles notifications and user feedback messages
 */

window.AppToast = class {
    constructor() {
        this.container = null;
        this.activeToasts = [];
        this.maxToasts = 5;
    }
    
    init() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            console.warn('Toast container not found');
            return false;
        }
        
        console.log('Toast system initialized');
        return true;
    }
    
    show(message, type = 'info', duration = 4000) {
        if (!this.container) {
            console.warn('Toast container not available');
            return;
        }
        
        // Limit number of simultaneous toasts
        if (this.activeToasts.length >= this.maxToasts) {
            this.removeOldestToast();
        }
        
        const toast = this.createToast(message, type, duration);
        this.container.appendChild(toast);
        this.activeToasts.push(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 100);
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }
        
        return toast;
    }
    
    createToast(message, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getIcon(type);
        const progressBar = duration > 0 ? this.createProgressBar(duration) : '';
        
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${icon} toast-icon"></i>
                <span class="toast-message">${this.sanitizeMessage(message)}</span>
                <button class="toast-close" onclick="window.AppToast.removeToast(this.parentElement.parentElement)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ${progressBar}
        `;
        
        // Add click to dismiss
        toast.addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        return toast;
    }
    
    createProgressBar(duration) {
        return `
            <div class="toast-progress">
                <div class="toast-progress-bar" style="animation-duration: ${duration}ms;"></div>
            </div>
        `;
    }
    
    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        return icons[type] || icons.info;
    }
    
    sanitizeMessage(message) {
        // Basic HTML sanitization
        const div = document.createElement('div');
        div.textContent = message;
        return div.innerHTML;
    }
    
    removeToast(toast) {
        if (!toast || !toast.parentElement) return;
        
        toast.classList.add('toast-hide');
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
            
            // Remove from active toasts array
            const index = this.activeToasts.indexOf(toast);
            if (index > -1) {
                this.activeToasts.splice(index, 1);
            }
        }, 300);
    }
    
    removeOldestToast() {
        if (this.activeToasts.length > 0) {
            this.removeToast(this.activeToasts[0]);
        }
    }
    
    clearAll() {
        this.activeToasts.forEach(toast => {
            this.removeToast(toast);
        });
    }
    
    // Convenience methods
    success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration = 6000) {
        return this.show(message, 'error', duration);
    }
    
    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }
    
    // Persistent toast (doesn't auto-hide)
    persistent(message, type = 'info') {
        return this.show(message, type, 0);
    }
    
    // Loading toast with spinner
    loading(message = 'Caricamento...') {
        const toast = this.show(message, 'info', 0);
        toast.classList.add('toast-loading');
        
        // Add loading spinner
        const icon = toast.querySelector('.toast-icon');
        if (icon) {
            icon.className = 'fas fa-spinner fa-spin toast-icon';
        }
        
        return toast;
    }
    
    // Update existing toast
    update(toast, message, type) {
        if (!toast) return;
        
        const messageEl = toast.querySelector('.toast-message');
        const iconEl = toast.querySelector('.toast-icon');
        
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        if (iconEl && type) {
            iconEl.className = `fas ${this.getIcon(type)} toast-icon`;
            toast.className = `toast toast-${type} toast-show`;
        }
    }
    
    // Show confirmation toast with callback
    confirm(message, onConfirm, onCancel) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-confirm';
        
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-question-circle toast-icon"></i>
                <span class="toast-message">${this.sanitizeMessage(message)}</span>
            </div>
            <div class="toast-actions">
                <button class="toast-btn toast-btn-confirm">
                    <i class="fas fa-check"></i> Conferma
                </button>
                <button class="toast-btn toast-btn-cancel">
                    <i class="fas fa-times"></i> Annulla
                </button>
            </div>
        `;
        
        // Add event listeners
        const confirmBtn = toast.querySelector('.toast-btn-confirm');
        const cancelBtn = toast.querySelector('.toast-btn-cancel');
        
        confirmBtn.addEventListener('click', () => {
            if (onConfirm) onConfirm();
            this.removeToast(toast);
        });
        
        cancelBtn.addEventListener('click', () => {
            if (onCancel) onCancel();
            this.removeToast(toast);
        });
        
        this.container.appendChild(toast);
        this.activeToasts.push(toast);
        
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 100);
        
        return toast;
    }
};

// Initialize toast system
window.Toast_Instance = new window.AppToast();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Toast_Instance.init();
    });
} else {
    window.Toast_Instance.init();
}