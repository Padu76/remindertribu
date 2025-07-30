/**
 * Forms Component
 * Handles form validation, submission, and user interactions
 */

class FormsComponent {
    constructor() {
        this.forms = new Map();
        this.validators = new Map();
    }
    
    init() {
        console.log('📝 Forms component initialized');
        this.setupGlobalFormHandlers();
        this.registerDefaultValidators();
    }
    
    setupGlobalFormHandlers() {
        // Handle all form submissions globally
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.hasAttribute('data-ajax-form')) {
                e.preventDefault();
                this.handleAjaxForm(form);
            }
        });
        
        // Real-time validation
        document.addEventListener('input', (e) => {
            const field = e.target;
            if (field.hasAttribute('data-validate')) {
                this.validateField(field);
            }
        });
    }
    
    registerDefaultValidators() {
        // Email validator
        this.registerValidator('email', (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        });
        
        // Phone validator (FIXED)
        this.registerValidator('phone', (value) => {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
            return phoneRegex.test(cleanPhone) && cleanPhone.length >= 8;
        });
        
        // Required validator
        this.registerValidator('required', (value) => {
            return value && value.toString().trim().length > 0;
        });
        
        // Min length validator
        this.registerValidator('minLength', (value, minLength) => {
            return value && value.toString().length >= parseInt(minLength);
        });
        
        // Max length validator
        this.registerValidator('maxLength', (value, maxLength) => {
            return !value || value.toString().length <= parseInt(maxLength);
        });
        
        // Number validator
        this.registerValidator('number', (value) => {
            return !isNaN(value) && isFinite(value);
        });
        
        // URL validator
        this.registerValidator('url', (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        });
    }
    
    registerValidator(name, validatorFn) {
        this.validators.set(name, validatorFn);
    }
    
    validateField(field) {
        const validators = field.getAttribute('data-validate').split('|');
        const value = field.value;
        let isValid = true;
        let errorMessage = '';
        
        for (const validatorStr of validators) {
            const [validatorName, ...params] = validatorStr.split(':');
            const validator = this.validators.get(validatorName);
            
            if (validator) {
                const result = validator(value, ...params);
                if (!result) {
                    isValid = false;
                    errorMessage = this.getErrorMessage(validatorName, field.name || field.id, params);
                    break;
                }
            }
        }
        
        this.showFieldValidation(field, isValid, errorMessage);
        return isValid;
    }
    
    getErrorMessage(validatorName, fieldName, params = []) {
        const messages = {
            'required': `Il campo ${fieldName} è obbligatorio`,
            'email': 'Inserisci un indirizzo email valido',
            'phone': 'Inserisci un numero di telefono valido',
            'minLength': `Il campo deve avere almeno ${params[0]} caratteri`,
            'maxLength': `Il campo deve avere massimo ${params[0]} caratteri`,
            'number': 'Inserisci un numero valido',
            'url': 'Inserisci un URL valido'
        };
        
        return messages[validatorName] || `Valore non valido per ${fieldName}`;
    }
    
    showFieldValidation(field, isValid, errorMessage) {
        // Remove existing validation classes
        field.classList.remove('is-valid', 'is-invalid');
        
        // Add appropriate class
        field.classList.add(isValid ? 'is-valid' : 'is-invalid');
        
        // Handle error message display
        const errorElement = field.parentElement.querySelector('.field-error');
        
        if (!isValid && errorMessage) {
            if (errorElement) {
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block';
            } else {
                const newErrorElement = document.createElement('div');
                newErrorElement.className = 'field-error';
                newErrorElement.textContent = errorMessage;
                newErrorElement.style.color = '#dc3545';
                newErrorElement.style.fontSize = '0.875rem';
                newErrorElement.style.marginTop = '0.25rem';
                field.parentElement.appendChild(newErrorElement);
            }
        } else {
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
    }
    
    validateForm(form) {
        const fields = form.querySelectorAll('[data-validate]');
        let isFormValid = true;
        
        fields.forEach(field => {
            const isFieldValid = this.validateField(field);
            if (!isFieldValid) {
                isFormValid = false;
            }
        });
        
        return isFormValid;
    }
    
    async handleAjaxForm(form) {
        const isValid = this.validateForm(form);
        
        if (!isValid) {
            if (window.App?.modules?.toast) {
                window.App.modules.toast.error('Correggi gli errori nel modulo');
            }
            return;
        }
        
        const formData = new FormData(form);
        const url = form.action || form.getAttribute('data-action');
        const method = form.method || 'POST';
        
        try {
            // Show loading state
            const submitBtn = form.querySelector('[type="submit"]');
            const originalText = submitBtn?.textContent;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Invio...';
            }
            
            const response = await fetch(url, {
                method: method,
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.success(result.message || 'Operazione completata');
                }
                
                // Reset form if specified
                if (form.hasAttribute('data-reset-on-success')) {
                    form.reset();
                    this.clearValidation(form);
                }
                
                // Trigger custom success event
                const successEvent = new CustomEvent('formSuccess', { 
                    detail: { form, result } 
                });
                form.dispatchEvent(successEvent);
            } else {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.error(result.message || 'Errore durante l\'invio');
                }
            }
            
            // Restore button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            
            if (window.App?.modules?.toast) {
                window.App.modules.toast.error('Errore di connessione');
            }
            
            // Restore button state
            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Invia';
            }
        }
    }
    
    clearValidation(form) {
        const fields = form.querySelectorAll('.is-valid, .is-invalid');
        fields.forEach(field => {
            field.classList.remove('is-valid', 'is-invalid');
        });
        
        const errorElements = form.querySelectorAll('.field-error');
        errorElements.forEach(element => {
            element.style.display = 'none';
        });
    }
    
    // Utility methods
    serializeForm(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }
    
    fillForm(form, data) {
        for (const [key, value] of Object.entries(data)) {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = field.value === value;
                } else {
                    field.value = value;
                }
            }
        }
    }
    
    // Create dynamic forms
    createContactForm() {
        return `
            <form class="contact-form" data-ajax-form data-reset-on-success>
                <div class="form-group">
                    <label for="contactName">Nome *</label>
                    <input 
                        type="text" 
                        id="contactName" 
                        name="name" 
                        class="form-control" 
                        data-validate="required"
                        placeholder="Nome completo"
                        required
                    >
                </div>
                
                <div class="form-group">
                    <label for="contactPhone">Telefono *</label>
                    <input 
                        type="tel" 
                        id="contactPhone" 
                        name="phone" 
                        class="form-control" 
                        data-validate="required|phone"
                        placeholder="+39 347 123 4567"
                        required
                    >
                </div>
                
                <div class="form-group">
                    <label for="contactEmail">Email</label>
                    <input 
                        type="email" 
                        id="contactEmail" 
                        name="email" 
                        class="form-control" 
                        data-validate="email"
                        placeholder="email@esempio.com"
                    >
                </div>
                
                <div class="form-group">
                    <label for="contactTags">Tag (separati da virgola)</label>
                    <input 
                        type="text" 
                        id="contactTags" 
                        name="tags" 
                        class="form-control" 
                        placeholder="cliente, vip, roma"
                    >
                </div>
                
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Salva Contatto
                </button>
            </form>
        `;
    }
    
    createReminderForm() {
        return `
            <form class="reminder-form" data-ajax-form data-reset-on-success>
                <div class="form-group">
                    <label for="reminderTitle">Titolo *</label>
                    <input 
                        type="text" 
                        id="reminderTitle" 
                        name="title" 
                        class="form-control" 
                        data-validate="required"
                        placeholder="Nome del reminder"
                        required
                    >
                </div>
                
                <div class="form-group">
                    <label for="reminderMessage">Messaggio *</label>
                    <textarea 
                        id="reminderMessage" 
                        name="message" 
                        class="form-control" 
                        data-validate="required|minLength:10"
                        placeholder="Il messaggio da inviare"
                        rows="3"
                        required
                    ></textarea>
                </div>
                
                <div class="form-group">
                    <label for="reminderDate">Data e Ora *</label>
                    <input 
                        type="datetime-local" 
                        id="reminderDate" 
                        name="datetime" 
                        class="form-control" 
                        data-validate="required"
                        required
                    >
                </div>
                
                <div class="form-group">
                    <label for="reminderRecurring">Ricorrenza</label>
                    <select id="reminderRecurring" name="recurring" class="form-control">
                        <option value="none">Una tantum</option>
                        <option value="daily">Giornaliera</option>
                        <option value="weekly">Settimanale</option>
                        <option value="monthly">Mensile</option>
                    </select>
                </div>
                
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Crea Reminder
                </button>
            </form>
        `;
    }
    
    // Form validation helpers
    static formatPhoneNumber(phoneInput) {
        let value = phoneInput.value.replace(/\D/g, '');
        
        if (value.length >= 10) {
            if (!value.startsWith('39') && value.length === 10) {
                value = '39' + value;
            }
            
            // Format: +39 347 123 4567
            const formatted = '+' + value.slice(0, 2) + ' ' + 
                             value.slice(2, 5) + ' ' + 
                             value.slice(5, 8) + ' ' + 
                             value.slice(8);
            
            phoneInput.value = formatted;
        }
    }
    
    // Initialize form enhancements
    enhanceFormFields() {
        // Phone number formatting
        document.querySelectorAll('input[type="tel"]').forEach(phoneInput => {
            phoneInput.addEventListener('input', () => {
                FormsComponent.formatPhoneNumber(phoneInput);
            });
        });
        
        // Auto-resize textareas
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            });
        });
        
        // Character counters
        document.querySelectorAll('[data-maxlength]').forEach(field => {
            const maxLength = field.getAttribute('data-maxlength');
            const counter = document.createElement('div');
            counter.className = 'char-counter';
            counter.style.fontSize = '0.875rem';
            counter.style.color = '#666';
            counter.style.textAlign = 'right';
            counter.style.marginTop = '0.25rem';
            
            field.parentElement.appendChild(counter);
            
            const updateCounter = () => {
                const remaining = maxLength - field.value.length;
                counter.textContent = `${field.value.length}/${maxLength}`;
                counter.style.color = remaining < 10 ? '#dc3545' : '#666';
            };
            
            field.addEventListener('input', updateCounter);
            updateCounter();
        });
    }
}

// Global instance
window.FormsComponent = FormsComponent;