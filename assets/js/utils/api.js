/**
 * API Communication Module
 * Handles HTTP requests and external API communications
 */

window.AppAPI = {
    
    baseURL: window.AppConfig?.environment?.apiUrl || '/api',
    
    // HTTP request wrapper
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        const config = {
            ...defaultOptions,
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
            
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    },
    
    // HTTP Methods
    async get(endpoint, params = null) {
        let url = endpoint;
        if (params) {
            const searchParams = new URLSearchParams(params);
            url += `?${searchParams.toString()}`;
        }
        
        return this.request(url, { method: 'GET' });
    },
    
    async post(endpoint, data = null) {
        return this.request(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : null
        });
    },
    
    async put(endpoint, data = null) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : null
        });
    },
    
    async patch(endpoint, data = null) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : null
        });
    },
    
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    // File upload
    async upload(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type for FormData
        });
    },
    
    // WhatsApp API simulation
    whatsapp: {
        async sendMessage(phone, message, contactName = null) {
            // This simulates sending via WhatsApp Web automation
            const command = {
                type: 'send_message',
                phone: phone,
                message: message,
                contactName: contactName,
                timestamp: new Date().toISOString()
            };
            
            // Store command for WhatsApp automation script to pick up
            const existingCommands = JSON.parse(localStorage.getItem('remindpro_whatsapp_commands') || '[]');
            existingCommands.push(command);
            localStorage.setItem('remindpro_whatsapp_commands', JSON.stringify(existingCommands));
            
            return {
                success: true,
                messageId: window.AppHelpers.generateId('msg'),
                status: 'queued'
            };
        },
        
        async getStatus() {
            const status = JSON.parse(localStorage.getItem('remindpro_whatsapp_status') || '{"connected": false}');
            const isConnected = status.connected && (Date.now() - (status.timestamp || 0)) < 30000;
            
            return {
                connected: isConnected,
                lastSeen: status.timestamp ? new Date(status.timestamp).toISOString() : null,
                version: status.version || null
            };
        },
        
        async getLogs(limit = 50) {
            const logs = JSON.parse(localStorage.getItem('remindpro_whatsapp_logs') || '[]');
            return logs.slice(0, limit);
        }
    },
    
    // External APIs
    external: {
        // EmailJS integration
        async sendEmail(templateId, templateParams) {
            if (!window.emailjs || !window.AppConfig.emailjs.enabled) {
                console.warn('EmailJS not available');
                return { success: false, error: 'EmailJS not configured' };
            }
            
            try {
                const response = await window.emailjs.send(
                    window.AppConfig.emailjs.serviceId,
                    templateId,
                    templateParams,
                    window.AppConfig.emailjs.publicKey
                );
                
                return { success: true, response };
            } catch (error) {
                console.error('EmailJS error:', error);
                return { success: false, error: error.message };
            }
        },
        
        // Stripe integration
        async createPaymentIntent(amount, currency = 'eur') {
            try {
                return await window.AppAPI.post('/payments/create-intent', {
                    amount: amount * 100, // Convert to cents
                    currency
                });
            } catch (error) {
                console.error('Payment intent creation failed:', error);
                throw error;
            }
        },
        
        // Webhook simulation for demo
        async simulateWebhook(eventType, data) {
            console.log(`🔗 Webhook simulation: ${eventType}`, data);
            
            // Simulate webhook processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return {
                success: true,
                eventType,
                processed: true,
                timestamp: new Date().toISOString()
            };
        }
    },
    
    // Analytics and tracking
    analytics: {
        async track(eventName, properties = {}) {
            const event = {
                name: eventName,
                properties: {
                    ...properties,
                    timestamp: new Date().toISOString(),
                    userId: window.App?.modules?.auth?.getCurrentUser()?.uid || 'anonymous',
                    sessionId: this.getSessionId()
                }
            };
            
            // Store locally for demo
            const events = JSON.parse(localStorage.getItem('remindpro_analytics_events') || '[]');
            events.push(event);
            
            // Keep only last 1000 events
            if (events.length > 1000) {
                events.splice(0, events.length - 1000);
            }
            
            localStorage.setItem('remindpro_analytics_events', JSON.stringify(events));
            
            console.log('📊 Analytics event tracked:', event);
            return event;
        },
        
        async getEvents(limit = 100) {
            const events = JSON.parse(localStorage.getItem('remindpro_analytics_events') || '[]');
            return events.slice(-limit);
        },
        
        getSessionId() {
            let sessionId = sessionStorage.getItem('remindpro_session_id');
            if (!sessionId) {
                sessionId = window.AppHelpers.generateId('session');
                sessionStorage.setItem('remindpro_session_id', sessionId);
            }
            return sessionId;
        }
    },
    
    // Error handling utilities
    handleError(error, context = 'API') {
        console.error(`${context} Error:`, error);
        
        let userMessage = 'Si è verificato un errore imprevisto';
        
        if (error.message.includes('404')) {
            userMessage = 'Risorsa non trovata';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            userMessage = 'Accesso non autorizzato';
        } else if (error.message.includes('500')) {
            userMessage = 'Errore del server';
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            userMessage = 'Errore di connessione';
        }
        
        // Show toast if available
        if (window.App?.modules?.toast) {
            window.App.modules.toast.error(userMessage);
        }
        
        return {
            success: false,
            error: userMessage,
            originalError: error.message
        };
    },
    
    // Retry mechanism
    async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                
                if (i < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
                }
            }
        }
        
        throw lastError;
    },
    
    // Rate limiting (simple implementation)
    rateLimiter: {
        requests: new Map(),
        
        isAllowed(key, limit = 10, windowMs = 60000) {
            const now = Date.now();
            const windowStart = now - windowMs;
            
            if (!this.requests.has(key)) {
                this.requests.set(key, []);
            }
            
            const requests = this.requests.get(key);
            
            // Remove old requests outside the window
            const validRequests = requests.filter(time => time > windowStart);
            this.requests.set(key, validRequests);
            
            if (validRequests.length < limit) {
                validRequests.push(now);
                return true;
            }
            
            return false;
        }
    }
};

// Make API globally available
window.$api = window.AppAPI;