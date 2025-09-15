/**
 * Modal Component
 * Handles modal dialogs across the application
 */

class ModalComponent {
    constructor() {
        this.activeModals = [];
        this.currentModalId = null;
    }
    
    init() {
        console.log('🪟 Modal system initialized');
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModalId) {
                this.hide(this.currentModalId);
            }
        });
        
        // Close modal on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') && this.currentModalId) {
                this.hide(this.currentModalId);
            }
        });
    }
    
    show(content, options = {}) {
        const modalId = this.generateId();
        const modal = this.createModal(modalId, content, options);
        
        // Add to DOM
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.style.display = 'flex';
            modal.classList.add('show');
        }, 10);
        
        this.currentModalId = modalId;
        this.activeModals.push(modalId);
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        
        return modalId;
    }
    
    hide(modalId = null) {
        const targetId = modalId || this.currentModalId;
        if (!targetId) return;
        
        const modal = document.getElementById(targetId);
        if (!modal) return;
        
        // Hide modal
        modal.classList.remove('show');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
        
        // Update state
        this.activeModals = this.activeModals.filter(id => id !== targetId);
        this.currentModalId = this.activeModals[this.activeModals.length - 1] || null;
        
        // Restore body scrolling if no modals left
        if (this.activeModals.length === 0) {
            document.body.style.overflow = '';
        }
    }
    
    hideAll() {
        this.activeModals.forEach(modalId => {
            this.hide(modalId);
        });
    }
    
    createModal(modalId, content, options = {}) {
        const {
            size = 'medium',
            closable = true,
            className = ''
        } = options;
        
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = `modal ${className}`;
        
        const sizeClass = {
            small: 'modal-sm',
            medium: '',
            large: 'modal-lg',
            fullscreen: 'modal-fullscreen'
        }[size] || '';
        
        // Add CSS if not present
        this.ensureStyles();
        
        modal.innerHTML = `
            <div class="modal-content ${sizeClass}">
                ${closable ? `
                    <button class="modal-close" onclick="window.App.modules.modal.hide('${modalId}')">&times;</button>
                ` : ''}
                ${content}
            </div>
        `;
        
        return modal;
    }
    
    ensureStyles() {
        if (document.getElementById('modal-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                z-index: 2000;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .modal.show {
                opacity: 1;
            }
            
            .modal-content {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 2rem;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
                transform: scale(0.9);
                transition: transform 0.3s ease;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            }
            
            .modal.show .modal-content {
                transform: scale(1);
            }
            
            .modal-content.modal-sm {
                max-width: 400px;
            }
            
            .modal-content.modal-lg {
                max-width: 800px;
            }
            
            .modal-content.modal-fullscreen {
                max-width: 95vw;
                max-height: 95vh;
            }
            
            .modal-close {
                position: absolute;
                top: 15px;
                right: 20px;
                background: none;
                border: none;
                font-size: 2rem;
                cursor: pointer;
                color: #7f8c8d;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s;
                z-index: 10;
            }
            
            .modal-close:hover {
                background: rgba(0, 0, 0, 0.1);
                color: #e74c3c;
                transform: rotate(90deg);
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            }
            
            .modal-title {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--dark, #2c3e50);
                margin: 0;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .modal-body {
                color: var(--dark, #2c3e50);
                line-height: 1.6;
            }
            
            .modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
                margin-top: 2rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(0, 0, 0, 0.1);
            }
            
            @media (max-width: 768px) {
                .modal-content {
                    width: 95%;
                    padding: 1.5rem;
                }
                
                .modal-footer {
                    flex-direction: column;
                    gap: 0.8rem;
                }
                
                .modal-footer .btn {
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    confirm(message, options = {}) {
        const {
            title = 'Conferma',
            confirmText = 'Conferma',
            cancelText = 'Annulla',
            confirmClass = 'btn-primary',
            onConfirm = null,
            onCancel = null
        } = options;
        
        const confirmId = this.generateId();
        
        const content = `
            <div class="modal-header">
                <h3 class="modal-title">
                    <i class="fas fa-question-circle"></i> ${title}
                </h3>
            </div>
            <div class="modal-body">
                <p style="font-size: 1.1rem; margin: 0;">${message}</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="window.App.modules.modal.handleConfirmCancel('${confirmId}')">
                    ${cancelText}
                </button>
                <button type="button" class="btn ${confirmClass}" onclick="window.App.modules.modal.handleConfirmOk('${confirmId}')">
                    ${confirmText}
                </button>
            </div>
        `;
        
        const modalId = this.show(content, { size: 'small', closable: false });
        
        // Store callbacks
        this.confirmCallbacks = this.confirmCallbacks || {};
        this.confirmCallbacks[confirmId] = { modalId, onConfirm, onCancel };
        
        return modalId;
    }
    
    handleConfirmOk(confirmId) {
        const callbacks = this.confirmCallbacks && this.confirmCallbacks[confirmId];
        if (callbacks) {
            if (callbacks.onConfirm) {
                callbacks.onConfirm();
            }
            this.hide(callbacks.modalId);
            delete this.confirmCallbacks[confirmId];
        }
    }
    
    handleConfirmCancel(confirmId) {
        const callbacks = this.confirmCallbacks && this.confirmCallbacks[confirmId];
        if (callbacks) {
            if (callbacks.onCancel) {
                callbacks.onCancel();
            }
            this.hide(callbacks.modalId);
            delete this.confirmCallbacks[confirmId];
        }
    }
    
    alert(message, options = {}) {
        const {
            title = 'Attenzione',
            buttonText = 'OK',
            type = 'info'
        } = options;
        
        const icons = {
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle',
            success: 'fas fa-check-circle'
        };
        
        const content = `
            <div class="modal-header">
                <h3 class="modal-title">
                    <i class="${icons[type] || icons.info}"></i> ${title}
                </h3>
            </div>
            <div class="modal-body">
                <p style="font-size: 1.1rem; margin: 0;">${message}</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" onclick="window.App.modules.modal.hide()">
                    ${buttonText}
                </button>
            </div>
        `;
        
        return this.show(content, { size: 'small' });
    }
    
    generateId() {
        return 'modal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Create global instance to avoid conflicts
if (!window.ModalComponent) {
    window.ModalComponent = ModalComponent;
}