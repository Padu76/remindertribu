/**
 * Billing Module
 * Handles subscription management, payments, and plan upgrades
 */

class BillingModule {
    constructor() {
        this.currentPlan = 'starter';
        this.usage = {
            messages: 0,
            contacts: 0,
            reminders: 0
        };
        this.isInitialized = false;
    }
    
    async init() {
        try {
            console.log('💰 Initializing Billing module...');
            this.loadUsageData();
            this.isInitialized = true;
            console.log('✅ Billing module initialized');
        } catch (error) {
            console.error('❌ Billing module initialization failed:', error);
        }
    }
    
    loadUsageData() {
        const storage = window.App?.modules?.storage;
        if (!storage) return;
        
        const stats = storage.getUserStats();
        const profile = storage.getUserProfile();
        
        this.usage = {
            messages: stats?.messagesSent || 0,
            contacts: storage.getContacts().length || 0,
            reminders: storage.getReminders().length || 0
        };
        
        this.currentPlan = profile?.plan || 'starter';
    }
    
    async upgradePlan(planType) {
        try {
            if (!window.AppConfig?.stripe?.enabled) {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.warning('Sistema di pagamento non disponibile in demo mode');
                }
                return;
            }
            
            const plan = window.AppConfig.stripe.plans[planType];
            if (!plan) {
                throw new Error('Piano non valido');
            }
            
            if (planType === this.currentPlan) {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.info('Sei già iscritto a questo piano');
                }
                return;
            }
            
            if (!confirm(`Vuoi effettuare l'upgrade al piano ${plan.name} per €${plan.price}/mese?`)) {
                return;
            }
            
            if (window.App) {
                window.App.showLoading && window.App.showLoading('Reindirizzamento al pagamento...');
            }
            
            // Initialize Stripe if needed
            if (!window.App?.modules?.stripe || !window.App.modules.stripe.isReady()) {
                const stripeConfig = new window.StripeConfig();
                await stripeConfig.init();
                if (window.App?.modules) {
                    window.App.modules.stripe = stripeConfig;
                }
            }
            
            // Create checkout session
            const currentUser = window.App?.modules?.auth?.getCurrentUser();
            await window.App.modules.stripe.createCheckoutSession(planType, currentUser?.uid);
            
        } catch (error) {
            if (window.App) {
                window.App.hideLoading && window.App.hideLoading();
            }
            
            console.error('Upgrade failed:', error);
            if (window.App?.modules?.toast) {
                window.App.modules.toast.error('Errore durante l\'upgrade: ' + error.message);
            }
        }
    }
    
    async cancelSubscription() {
        try {
            if (!confirm('Sei sicuro di voler cancellare il tuo abbonamento? Perderai l\'accesso alle funzionalità premium.')) {
                return;
            }
            
            if (window.App) {
                window.App.showLoading && window.App.showLoading('Cancellazione abbonamento...');
            }
            
            // In production, call your backend API to cancel subscription
            const response = await fetch('/api/cancel-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: window.App?.modules?.auth?.getCurrentUser()?.uid
                })
            });
            
            if (!response.ok) {
                throw new Error('Errore nella cancellazione');
            }
            
            // Update local plan
            this.currentPlan = 'starter';
            
            const storage = window.App?.modules?.storage;
            if (storage) {
                const profile = storage.getUserProfile();
                if (profile) {
                    profile.plan = 'starter';
                    localStorage.setItem('remindpro_profile', JSON.stringify(profile));
                }
            }
            
            if (window.App) {
                window.App.hideLoading && window.App.hideLoading();
            }
            
            if (window.App?.modules?.toast) {
                window.App.modules.toast.success('Abbonamento cancellato. Manterrai l\'accesso fino alla fine del periodo di fatturazione.');
            }
            
            // Refresh billing page
            this.refreshBillingInfo();
            
        } catch (error) {
            if (window.App) {
                window.App.hideLoading && window.App.hideLoading();
            }
            
            console.error('Cancellation failed:', error);
            if (window.App?.modules?.toast) {
                window.App.modules.toast.error('Errore nella cancellazione dell\'abbonamento');
            }
        }
    }
    
    refreshBillingInfo() {
        this.loadUsageData();
        
        if (window.App && window.App.currentPage === 'billing') {
            this.updateBillingUI();
        }
    }
    
    updateBillingUI() {
        // Update plan display
        const currentPlanEl = document.getElementById('currentPlanDisplay');
        if (currentPlanEl) {
            const planInfo = window.AppConfig?.stripe?.plans[this.currentPlan];
            currentPlanEl.textContent = planInfo ? planInfo.name : 'Starter';
        }
        
        // Update usage displays
        const messagesUsedEl = document.getElementById('messagesUsedDisplay');
        if (messagesUsedEl) {
            messagesUsedEl.textContent = this.usage.messages;
        }
        
        const contactsUsedEl = document.getElementById('contactsUsedDisplay');
        if (contactsUsedEl) {
            contactsUsedEl.textContent = this.usage.contacts;
        }
        
        const remindersUsedEl = document.getElementById('remindersUsedDisplay');
        if (remindersUsedEl) {
            remindersUsedEl.textContent = this.usage.reminders;
        }
        
        // Update usage limits
        this.updateUsageLimits();
    }
    
    updateUsageLimits() {
        const plan = window.AppConfig?.stripe?.plans[this.currentPlan];
        if (!plan) return;
        
        // Messages limit
        const messagesLimitEl = document.getElementById('messagesLimit');
        if (messagesLimitEl) {
            const limit = plan.features.messagesPerMonth;
            messagesLimitEl.textContent = limit === 'unlimited' ? 'illimitati' : `su ${limit} disponibili`;
        }
        
        // Contacts limit
        const contactsLimitEl = document.getElementById('contactsLimit');
        if (contactsLimitEl) {
            const limit = plan.features.contacts;
            contactsLimitEl.textContent = limit === 'unlimited' ? 'illimitati' : `su ${limit} disponibili`;
        }
        
        // Update progress bars if present
        this.updateUsageProgress();
    }
    
    updateUsageProgress() {
        const plan = window.AppConfig?.stripe?.plans[this.currentPlan];
        if (!plan) return;
        
        // Messages progress
        const messagesProgress = document.getElementById('messagesProgress');
        if (messagesProgress && plan.features.messagesPerMonth !== 'unlimited') {
            const percentage = Math.min((this.usage.messages / plan.features.messagesPerMonth) * 100, 100);
            messagesProgress.style.width = `${percentage}%`;
            
            // Add warning color if near limit
            if (percentage > 80) {
                messagesProgress.style.background = 'var(--warning)';
            } else if (percentage > 95) {
                messagesProgress.style.background = 'var(--danger)';
            } else {
                messagesProgress.style.background = 'var(--primary)';
            }
        }
        
        // Contacts progress
        const contactsProgress = document.getElementById('contactsProgress');
        if (contactsProgress && plan.features.contacts !== 'unlimited') {
            const percentage = Math.min((this.usage.contacts / plan.features.contacts) * 100, 100);
            contactsProgress.style.width = `${percentage}%`;
            
            if (percentage > 80) {
                contactsProgress.style.background = 'var(--warning)';
            } else if (percentage > 95) {
                contactsProgress.style.background = 'var(--danger)';
            } else {
                contactsProgress.style.background = 'var(--primary)';
            }
        }
    }
    
    isFeatureAvailable(feature) {
        const plan = window.AppConfig?.stripe?.plans[this.currentPlan];
        return plan && plan.features[feature];
    }
    
    checkUsageLimit(type) {
        const plan = window.AppConfig?.stripe?.plans[this.currentPlan];
        if (!plan) return true;
        
        switch (type) {
            case 'messages':
                return plan.features.messagesPerMonth === 'unlimited' || 
                       this.usage.messages < plan.features.messagesPerMonth;
            case 'contacts':
                return plan.features.contacts === 'unlimited' || 
                       this.usage.contacts < plan.features.contacts;
            default:
                return true;
        }
    }
    
    getPageContent() {
        const plan = window.AppConfig?.stripe?.plans[this.currentPlan];
        
        return `
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-credit-card"></i> 
                    Fatturazione e Abbonamento
                </h1>
                <p class="page-subtitle">Gestisci il tuo piano e i pagamenti</p>
            </div>

            <div class="billing-section card">
                <div class="card-header">
                    <div>
                        <div class="plan-badge">Piano Attuale: <span id="currentPlanDisplay">${plan ? plan.name : 'Starter'}</span></div>
                        ${this.currentPlan !== 'starter' ? 
                            `<p style="margin-top: 0.5rem; opacity: 0.8;">€${plan.price}/mese - Rinnovo automatico</p>` : 
                            '<p style="margin-top: 0.5rem; opacity: 0.8;">Piano gratuito</p>'
                        }
                    </div>
                    ${this.currentPlan !== 'starter' ? 
                        `<button class="btn btn-secondary" onclick="window.App.modules.billing.cancelSubscription()">
                            <i class="fas fa-times"></i> Cancella Abbonamento
                        </button>` : ''
                    }
                </div>
                
                <div class="billing-usage">
                    <h4 style="margin-bottom: 1.5rem;">
                        <i class="fas fa-chart-bar"></i> Utilizzo Corrente
                    </h4>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                        <div class="usage-card">
                            <h5>Messaggi Utilizzati</h5>
                            <div class="usage-value">
                                <span id="messagesUsedDisplay">${this.usage.messages}</span>
                            </div>
                            <div class="usage-limit" id="messagesLimit">
                                ${plan && plan.features.messagesPerMonth === 'unlimited' ? 'illimitati' : `su ${plan?.features.messagesPerMonth || 500} disponibili`}
                            </div>
                            <div class="progress">
                                <div class="progress-bar" id="messagesProgress" style="width: 0%"></div>
                            </div>
                        </div>
                        
                        <div class="usage-card">
                            <h5>Contatti</h5>
                            <div class="usage-value">
                                <span id="contactsUsedDisplay">${this.usage.contacts}</span>
                            </div>
                            <div class="usage-limit" id="contactsLimit">
                                ${plan && plan.features.contacts === 'unlimited' ? 'illimitati' : `su ${plan?.features.contacts || 100} disponibili`}
                            </div>
                            <div class="progress">
                                <div class="progress-bar" id="contactsProgress" style="width: 0%"></div>
                            </div>
                        </div>
                        
                        <div class="usage-card">
                            <h5>Reminder Attivi</h5>
                            <div class="usage-value">
                                <span id="remindersUsedDisplay">${this.usage.reminders}</span>
                            </div>
                            <div class="usage-limit">
                                illimitati
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${this.currentPlan === 'starter' ? this.getUpgradeCTA() : ''}
            
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-history"></i> Storico Fatturazione</h3>
                </div>
                
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Piano</th>
                                <th>Importo</th>
                                <th>Status</th>
                                <th>Fattura</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${new Date().toLocaleDateString('it-IT')}</td>
                                <td>${plan ? plan.name : 'Starter'}</td>
                                <td>€${plan ? plan.price : 0},00</td>
                                <td><span class="badge badge-success">Attivo</span></td>
                                <td>${this.currentPlan === 'starter' ? '-' : '<a href="#" class="btn btn-secondary btn-sm">Scarica</a>'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-shield-alt"></i> Confronta Piani</h3>
                </div>
                
                ${this.getPlansComparison()}
            </div>
        `;
    }
    
    getUpgradeCTA() {
        return `
            <div class="upgrade-cta">
                <h3 style="color: white; margin-bottom: 1rem;">
                    <i class="fas fa-rocket"></i> Sblocca Tutto il Potenziale
                </h3>
                <p style="color: rgba(255,255,255,0.9); margin-bottom: 2rem;">
                    Passa al piano Professional per contatti illimitati, 10.000 messaggi/mese e funzionalità avanzate
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="window.App.modules.billing.upgradePlan('professional')" style="background: white; color: var(--accent);">
                        <i class="fas fa-arrow-up"></i> Upgrade a Professional - €29/mese
                    </button>
                    <button class="btn btn-secondary" onclick="window.App.modules.billing.upgradePlan('enterprise')" style="border-color: white; color: white;">
                        <i class="fas fa-crown"></i> Piano Enterprise - €99/mese
                    </button>
                </div>
            </div>
        `;
    }
    
    getPlansComparison() {
        const plans = window.AppConfig?.stripe?.plans || {};
        
        return `
            <div class="plans-comparison">
                <div class="plans-grid">
                    ${Object.entries(plans).map(([key, plan]) => `
                        <div class="plan-card ${key === this.currentPlan ? 'current-plan' : ''}">
                            <div class="plan-header">
                                <h4>${plan.name}</h4>
                                <div class="plan-price">
                                    ${plan.price === 0 ? 'Gratuito' : `€${plan.price}/mese`}
                                </div>
                            </div>
                            <div class="plan-features">
                                <div class="feature">
                                    <i class="fas fa-users"></i>
                                    ${plan.features.contacts === 'unlimited' ? 'Contatti illimitati' : `${plan.features.contacts} contatti`}
                                </div>
                                <div class="feature">
                                    <i class="fas fa-paper-plane"></i>
                                    ${plan.features.messagesPerMonth === 'unlimited' ? 'Messaggi illimitati' : `${plan.features.messagesPerMonth} messaggi/mese`}
                                </div>
                                <div class="feature">
                                    <i class="fas fa-chart-line"></i>
                                    Analytics ${plan.features.analytics}
                                </div>
                                <div class="feature">
                                    <i class="fas fa-headset"></i>
                                    Supporto ${plan.features.support}
                                </div>
                                ${plan.features.abTesting ? '<div class="feature"><i class="fas fa-vial"></i> A/B Testing</div>' : ''}
                                ${plan.features.whiteLabel ? '<div class="feature"><i class="fas fa-tag"></i> White Label</div>' : ''}
                                ${plan.features.api ? '<div class="feature"><i class="fas fa-code"></i> API Access</div>' : ''}
                            </div>
                            <div class="plan-action">
                                ${key === this.currentPlan 
                                    ? '<span class="badge badge-primary">Piano Attuale</span>'
                                    : `<button class="btn btn-primary" onclick="window.App.modules.billing.upgradePlan('${key}')">
                                        ${plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                                    </button>`
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    async initializePage() {
        this.loadUsageData();
        this.updateBillingUI();
        
        // Add billing-specific styles
        if (!document.getElementById('billing-styles')) {
            const styles = document.createElement('style');
            styles.id = 'billing-styles';
            styles.textContent = `
                .billing-section {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 15px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                }
                
                .plan-badge {
                    display: inline-block;
                    background: var(--primary);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                }
                
                .upgrade-cta {
                    background: var(--gradient-secondary);
                    border-radius: 15px;
                    padding: 2rem;
                    text-align: center;
                    margin: 2rem 0;
                }
                
                .billing-usage {
                    margin-top: 2rem;
                }
                
                .usage-card {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 1.5rem;
                    text-align: center;
                }
                
                .usage-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--primary);
                    margin: 0.5rem 0;
                }
                
                .usage-limit {
                    opacity: 0.8;
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                }
                
                .plans-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                }
                
                .plan-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 15px;
                    padding: 1.5rem;
                    transition: transform 0.3s;
                }
                
                .plan-card:hover {
                    transform: translateY(-5px);
                }
                
                .plan-card.current-plan {
                    border-color: var(--primary);
                    background: rgba(37, 211, 102, 0.1);
                }
                
                .plan-header {
                    text-align: center;
                    margin-bottom: 1.5rem;
                }
                
                .plan-price {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--primary);
                    margin: 0.5rem 0;
                }
                
                .plan-features {
                    margin-bottom: 1.5rem;
                }
                
                .plan-features .feature {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin: 0.8rem 0;
                    font-size: 0.9rem;
                }
                
                .plan-features .feature i {
                    color: var(--primary);
                    width: 16px;
                }
                
                .plan-action {
                    text-align: center;
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Update usage progress after a delay to show animation
        setTimeout(() => {
            this.updateUsageProgress();
        }, 500);
    }
}

window.BillingModule = BillingModule;