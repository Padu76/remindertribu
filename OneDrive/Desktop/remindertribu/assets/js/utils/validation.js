/**
 * Validation Utilities
 * Form validation functions and rules
 */

window.AppValidation = {
    
    // Core validation functions
    required(value, message = 'Questo campo è obbligatorio') {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            return message;
        }
        return null;
    },
    
    email(value, message = 'Inserisci un indirizzo email valido') {
        if (!value) return null; // Optional field
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : message;
    },
    
    phone(value, message = 'Inserisci un numero di telefono valido') {
        if (!value) return null; // Optional field
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
        return phoneRegex.test(cleanPhone) && cleanPhone.length >= 8 ? null : message;
    },
    
    minLength(value, min, message = null) {
        if (!value) return null; // Optional field
        const actualMessage = message || `Minimo ${min} caratteri richiesti`;
        return value.length >= min ? null : actualMessage;
    },
    
    maxLength(value, max, message = null) {
        if (!value) return null; // Optional field
        const actualMessage = message || `Massimo ${max} caratteri consentiti`;
        return value.length <= max ? null : actualMessage;
    },
    
    pattern(value, regex, message = 'Formato non valido') {
        if (!value) return null; // Optional field
        return regex.test(value) ? null : message;
    },
    
    // Composite validation functions
    validateContact(contactData) {
        const errors = {};
        
        // Name validation
        const nameError = this.required(contactData.name, 'Il nome è obbligatorio');
        if (nameError) errors.name = nameError;
        
        const nameMinError = this.minLength(contactData.name, 2, 'Il nome deve essere almeno 2 caratteri');
        if (nameMinError) errors.name = nameMinError;
        
        // Phone validation
        const phoneError = this.required(contactData.phone, 'Il numero di telefono è obbligatorio');
        if (phoneError) errors.phone = phoneError;
        
        const phoneValidError = this.phone(contactData.phone);
        if (phoneValidError) errors.phone = phoneValidError;
        
        // Email validation (optional but must be valid if provided)
        const emailError = this.email(contactData.email);
        if (emailError) errors.email = emailError;
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },
    
    validateReminder(reminderData) {
        const errors = {};
        
        // Name validation
        const nameError = this.required(reminderData.name, 'Il nome del reminder è obbligatorio');
        if (nameError) errors.name = nameError;
        
        const nameMinError = this.minLength(reminderData.name, 3, 'Il nome deve essere almeno 3 caratteri');
        if (nameMinError) errors.name = nameMinError;
        
        // Date validation
        const dateError = this.required(reminderData.date, 'La data è obbligatoria');
        if (dateError) errors.date = dateError;
        
        // Check if date is not in the past
        if (reminderData.date) {
            const reminderDate = new Date(reminderData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (reminderDate < today) {
                errors.date = 'La data non può essere nel passato';
            }
        }
        
        // Time validation
        const timeError = this.required(reminderData.time, 'L\'ora è obbligatoria');
        if (timeError) errors.time = timeError;
        
        // Message validation
        const messageError = this.required(reminderData.message, 'Il messaggio è obbligatorio');
        if (messageError) errors.message = messageError;
        
        const messageMinError = this.minLength(reminderData.message, 10, 'Il messaggio deve essere almeno 10 caratteri');
        if (messageMinError) errors.message = messageMinError;
        
        const messageMaxError = this.maxLength(reminderData.message, 1000, 'Il messaggio non può superare 1000 caratteri');
        if (messageMaxError) errors.message = messageMaxError;
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },
    
    validateLogin(loginData) {
        const errors = {};
        
        // Email validation
        const emailError = this.required(loginData.email, 'L\'email è obbligatoria');
        if (emailError) errors.email = emailError;
        
        const emailValidError = this.email(loginData.email);
        if (emailValidError) errors.email = emailValidError;
        
        // Password validation
        const passwordError = this.required(loginData.password, 'La password è obbligatoria');
        if (passwordError) errors.password = passwordError;
        
        const passwordMinError = this.minLength(loginData.password, 6, 'La password deve essere almeno 6 caratteri');
        if (passwordMinError) errors.password = passwordMinError;
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },
    
    validateProfile(profileData) {
        const errors = {};
        
        // Company validation
        const companyError = this.required(profileData.company, 'Il nome dell\'azienda è obbligatorio');
        if (companyError) errors.company = companyError;
        
        // Name validation
        const nameError = this.required(profileData.name, 'Il tuo nome è obbligatorio');
        if (nameError) errors.name = nameError;
        
        // Email validation (optional but must be valid)
        const emailError = this.email(profileData.email);
        if (emailError) errors.email = emailError;
        
        // Phone validation (optional but must be valid)
        const phoneError = this.phone(profileData.phone);
        if (phoneError) errors.phone = phoneError;
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },
    
    // Form field validation helpers
    showFieldError(fieldId, errorMessage) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        // Add error class to field
        field.classList.add('error');
        
        // Find or create error element
        let errorElement = field.parentNode.querySelector('.form-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
    },
    
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        // Remove error class
        field.classList.remove('error');
        
        // Hide error message
        const errorElement = field.parentNode.querySelector('.form-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    },
    
    clearAllErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        // Remove all error classes
        const errorFields = form.querySelectorAll('.form-control.error');
        errorFields.forEach(field => field.classList.remove('error'));
        
        // Hide all error messages
        const errorMessages = form.querySelectorAll('.form-error');
        errorMessages.forEach(error => error.style.display = 'none');
    },
    
    showFormErrors(formId, errors) {
        this.clearAllErrors(formId);
        
        Object.entries(errors).forEach(([field, message]) => {
            this.showFieldError(field, message);
        });
    },
    
    // Real-time validation setup
    setupRealTimeValidation(formId, validationRules) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        Object.entries(validationRules).forEach(([fieldId, rules]) => {
            const field = document.getElementById(fieldId);
            if (!field) return;
            
            field.addEventListener('blur', () => {
                this.validateField(fieldId, field.value, rules);
            });
            
            field.addEventListener('input', () => {
                // Clear error on input
                this.clearFieldError(fieldId);
            });
        });
    },
    
    validateField(fieldId, value, rules) {
        for (let rule of rules) {
            const error = rule(value);
            if (error) {
                this.showFieldError(fieldId, error);
                return false;
            }
        }
        
        this.clearFieldError(fieldId);
        return true;
    },
    
    // Common validation rule sets
    rules: {
        contactName: [
            (value) => window.AppValidation.required(value, 'Il nome è obbligatorio'),
            (value) => window.AppValidation.minLength(value, 2, 'Il nome deve essere almeno 2 caratteri')
        ],
        
        contactPhone: [
            (value) => window.AppValidation.required(value, 'Il numero di telefono è obbligatorio'),
            (value) => window.AppValidation.phone(value)
        ],
        
        contactEmail: [
            (value) => window.AppValidation.email(value)
        ],
        
        reminderName: [
            (value) => window.AppValidation.required(value, 'Il nome del reminder è obbligatorio'),
            (value) => window.AppValidation.minLength(value, 3, 'Il nome deve essere almeno 3 caratteri')
        ],
        
        reminderMessage: [
            (value) => window.AppValidation.required(value, 'Il messaggio è obbligatorio'),
            (value) => window.AppValidation.minLength(value, 10, 'Il messaggio deve essere almeno 10 caratteri'),
            (value) => window.AppValidation.maxLength(value, 1000, 'Il messaggio non può superare 1000 caratteri')
        ],
        
        loginEmail: [
            (value) => window.AppValidation.required(value, 'L\'email è obbligatoria'),
            (value) => window.AppValidation.email(value)
        ],
        
        loginPassword: [
            (value) => window.AppValidation.required(value, 'La password è obbligatoria'),
            (value) => window.AppValidation.minLength(value, 6, 'La password deve essere almeno 6 caratteri')
        ]
    }
};

// Make validation globally available
window.$validate = window.AppValidation;