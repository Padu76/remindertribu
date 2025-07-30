/**
 * Toast Notifications Component
 * Handles success, error, warning, and info messages with animations
 */

class ToastComponent {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.defaultDuration = 5000;
    }
    
    init() {
        this.createContainer();
        console.log('🍞 Toast system initialized');
    }
    
    createContainer() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        
        document.body.appendChild(this.container);
    }
    
    show(message, type = 'info', options = {}) {
        const {
            duration = this.defaultDuration,
            persistent = false,
            actions = null
        } = options;
        
        const toastId = this.generateId();
        const toast = this.createToast(toastId, message, type, actions, persistent);
        
        // Add to container
        this.container.appendChild(toast);
        this.toasts.set(toastId, toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto remove
        if (!persistent) {
            setTimeout(() => {
                this.hide(toastId);
            }, duration);
        }
        
        return toastId;
    }
    
    createToast(id, message, type, actions, persistent) {
        const toast = document.createElement('div');
        toast.id = `toast-${id}`;
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const colors = {
            success: '#2ecc71',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        
        toast.style.cssText = `
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-left: 4px solid ${colors[type]};
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 0.5rem;
            min-width: 300px;
            max-width: 500px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            transform: translateX(400px);
            transition: all 0.3s ease;
            opacity: 0;
            pointer-events: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
        `;
        
        const icon = document.createElement('div');
        icon.textContent = icons[type];
        icon.style.cssText = `
            font-size: 1.2rem;
            flex-shrink: 0;
            margin-top: 2px;
        `;
        
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            flex: 1;
            color: #2c3e50;
            font-size: 0.9rem;
            line-height: 1.4;
        `;
        messageDiv.textContent = message;
        
        content.appendChild(icon);
        content.appendChild(messageDiv);
        
        if (!persistent) {
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #7f8c8d;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
                margin-left: 0.5rem;
                flex-shrink: 0;
            `;
            
            closeBtn.onmouseover = () => {
                closeBtn.style.backgroundColor = 'rgba(0,0,0,0.1)';
                closeBtn.style.color = '#2c3e50';
            };
            
            closeBtn.onmouseout = () => {
                closeBtn.style.backgroundColor = 'transparent';
                closeBtn.style.color = '#7f8c8d';
            };
            
            closeBtn.onclick = () => this.hide(id);
            content.appendChild(closeBtn);
        }
        
        toast.appendChild(content);
        
        if (actions && actions.length > 0) {
            const actionsDiv = document.createElement('div');
            actionsDiv.style.cssText = `
                margin-top: 0.75rem;
                padding-top: 0.75rem;
                border-top: 1px solid rgba(0,0,0,0.1);
                display: flex;
                gap: 0.5rem;
                justify-content: flex-end;
            `;
            
            actions.forEach(action => {
                const btn = document.createElement('button');
                btn.textContent = action.label;
                btn.style.cssText = `
                    background: ${action.primary ? colors[type] : 'transparent'};
                    color: ${action.primary ? 'white' : colors[type]};
                    border: 1px solid ${colors[type]};
                    border-radius: 6px;
                    padding: 0.4rem 0.8rem;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                `;
                
                btn.onmouseover = () => {
                    if (action.primary) {
                        btn.style.transform = 'translateY(-1px)';
                    } else {
                        btn.style.backgroundColor = colors[type];
                        btn.style.color = 'white';
                    }
                };
                
                btn.onmouseout = () => {
                    btn.style.transform = 'translateY(0)';
                    if (!action.primary) {
                        btn.style.backgroundColor = 'transparent';
                        btn.style.color = colors[type];
                    }
                };
                
                btn.onclick = () => {
                    if (action.handler) {
                        action.handler();
                    }
                    this.hide(id);
                };
                
                actionsDiv.appendChild(btn);
            });
            
            toast.appendChild(actionsDiv);
        }
        
        // Add show class styles
        const showStyles = `
            .toast.show {
                transform: translateX(0);
                opacity: 1;
            }
        `;
        
        if (!document.getElementById('toast-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'toast-styles';
            styleSheet.textContent = showStyles;
            document.head.appendChild(styleSheet);
        }
        
        return toast;
    }
    
    hide(toastId) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;
        
        toast.style.transform = 'translateX(400px)';
        toast.style.opacity = '0';
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(toastId);
        }, 300);
    }
    
    hideAll() {
        this.toasts.forEach((toast, id) => {
            this.hide(id);
        });
    }
    
    // Convenience methods
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }
    
    error(message, options = {}) {
        return this.show(message, 'error', options);
    }
    
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }
    
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }
    
    // Progress toast
    progress(message, progress = 0) {
        const toastId = this.generateId();
        const toast = this.createProgressToast(toastId, message, progress);
        
        this.container.appendChild(toast);
        this.toasts.set(toastId, toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        return {
            id: toastId,
            updateProgress: (newProgress, newMessage = null) => {
                this.updateProgressToast(toastId, newProgress, newMessage);
            },
            complete: (successMessage = null) => {
                this.completeProgressToast(toastId, successMessage);
            },
            error: (errorMessage) => {
                this.errorProgressToast(toastId, errorMessage);
            }
        };
    }
    
    createProgressToast(id, message, progress) {
        const toast = document.createElement('div');
        toast.id = `toast-${id}`;
        toast.className = 'toast toast-progress';
        
        toast.style.cssText = `
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-left: 4px solid #3498db;
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 0.5rem;
            min-width: 300px;
            max-width: 500px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            transform: translateX(400px);
            transition: all 0.3s ease;
            opacity: 0;
            pointer-events: auto;
        `;
        
        toast.innerHTML = `
            <div style="color: #2c3e50; font-size: 0.9rem; margin-bottom: 0.75rem;">
                ${message}
            </div>
            <div style="background: #ecf0f1; border-radius: 10px; height: 6px; overflow: hidden;">
                <div class="progress-bar" style="background: #3498db; height: 100%; width: ${progress}%; transition: width 0.3s ease; border-radius: 10px;"></div>
            </div>
            <div class="progress-text" style="text-align: center; font-size: 0.8rem; color: #7f8c8d; margin-top: 0.5rem;">
                ${Math.round(progress)}%
            </div>
        `;
        
        return toast;
    }
    
    updateProgressToast(toastId, progress, message = null) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;
        
        const progressBar = toast.querySelector('.progress-bar');
        const progressText = toast.querySelector('.progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
        
        if (message) {
            const messageDiv = toast.querySelector('div');
            if (messageDiv) {
                messageDiv.textContent = message;
            }
        }
    }
    
    completeProgressToast(toastId, successMessage = null) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;
        
        const progressBar = toast.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.background = '#2ecc71';
            progressBar.style.width = '100%';
        }
        
        if (successMessage) {
            const messageDiv = toast.querySelector('div');
            if (messageDiv) {
                messageDiv.textContent = successMessage;
            }
        }
        
        toast.style.borderLeftColor = '#2ecc71';
        
        setTimeout(() => {
            this.hide(toastId);
        }, 2000);
    }
    
    errorProgressToast(toastId, errorMessage) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;
        
        const progressBar = toast.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.background = '#e74c3c';
        }
        
        const messageDiv = toast.querySelector('div');
        if (messageDiv) {
            messageDiv.textContent = errorMessage;
        }
        
        toast.style.borderLeftColor = '#e74c3c';
        
        setTimeout(() => {
            this.hide(toastId);
        }, 3000);
    }
    
    generateId() {
        return 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Create global instance to avoid conflicts
if (!window.ToastComponent) {
    window.ToastComponent = ToastComponent;
}