/**
 * Stripe Configuration Module
 * Handles Stripe initialization and payment processing
 */

class StripeConfig {
    constructor() {
        this.stripe = null;
        this.initialized = false;
    }
    
    async init() {
        try {
            if (!window.AppConfig.stripe.enabled) {
                console.log('💳 Stripe disabled in configuration');
                return false;
            }
            
            if (!window.Stripe) {
                console.warn('💳 Stripe SDK not loaded');
                return false;
            }
            
            // Initialize Stripe
            this.stripe = window.Stripe(window.AppConfig.stripe.publishableKey);
            
            this.initialized = true;
            console.log('✅ Stripe configuration initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Stripe initialization failed:', error);
            return false;
        }
    }
    
    async createCheckoutSession(planType, userId) {
        if (!this.initialized) {
            throw new Error('Stripe not initialized');
        }
        
        const plan = window.AppConfig.stripe.plans[planType];
        if (!plan || !plan.priceId) {
            throw new Error('Invalid plan type');
        }
        
        try {
            // In production, you would create a checkout session on your backend
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: plan.priceId,
                    userId: userId,
                    planType: planType
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }
            
            const session = await response.json();
            
            // Redirect to Stripe Checkout
            const result = await this.stripe.redirectToCheckout({
                sessionId: session.id
            });
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
            return result;
            
        } catch (error) {
            console.error('Checkout session creation failed:', error);
            throw error;
        }
    }
    
    async createPaymentMethod(cardElement) {
        if (!this.initialized) {
            throw new Error('Stripe not initialized');
        }
        
        try {
            const result = await this.stripe.createPaymentMethod({
                type: 'card',
                card: cardElement
            });
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
            return result.paymentMethod;
            
        } catch (error) {
            console.error('Payment method creation failed:', error);
            throw error;
        }
    }
    
    getStripe() {
        return this.stripe;
    }
    
    isReady() {
        return this.initialized;
    }
}

window.StripeConfig = StripeConfig;