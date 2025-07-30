/**
 * Analytics Module - Complete Implementation
 * Handles advanced analytics, reporting, and performance metrics
 */

class AnalyticsModule {
    constructor() {
        this.isInitialized = false;
        this.currentPeriod = '30days';
        this.chartInstances = {};
    }
    
    async init() {
        try {
            console.log('📊 Initializing Analytics module...');
            this.isInitialized = true;
            console.log('✅ Analytics module initialized');
        } catch (error) {
            console.error('❌ Analytics module initialization failed:', error);
        }
    }
    
    generateMockData(period = '30days') {
        const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
        const data = {
            messagesSent: [],
            openRates: [],
            clickRates: [],
            responseRates: [],
            contactGrowth: [],
            revenueGenerated: [],
            topPerformingMessages: [],
            contactSegments: [],
            hourlyActivity: [],
            deviceTypes: []
        };
        
        // Generate daily data
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Messages sent (trending up)
            const baseMessages = Math.floor(Math.random() * 50) + 20;
            const trendMultiplier = 1 + (days - i) / days * 0.5; // Growing trend
            data.messagesSent.push({
                date: dateStr,
                value: Math.floor(baseMessages * trendMultiplier)
            });
            
            // Open rates (fluctuating around 85%)
            data.openRates.push({
                date: dateStr,
                value: Math.floor(Math.random() * 20 + 75) // 75-95%
            });
            
            // Click rates (around 15%)
            data.clickRates.push({
                date: dateStr,
                value: Math.floor(Math.random() * 10 + 10) // 10-20%
            });
            
            // Response rates (around 25%)
            data.responseRates.push({
                date: dateStr,
                value: Math.floor(Math.random() * 15 + 20) // 20-35%
            });
            
            // Contact growth
            data.contactGrowth.push({
                date: dateStr,
                value: Math.floor(Math.random() * 5 + 1) // 1-6 new contacts per day
            });
            
            // Revenue generated (€)
            data.revenueGenerated.push({
                date: dateStr,
                value: Math.floor(Math.random() * 200 + 50) // €50-250 per day
            });
        }
        
        // Top performing messages
        data.topPerformingMessages = [
            { message: "Offerta speciale: 20% di sconto!", openRate: 94, clickRate: 23, responses: 45 },
            { message: "Nuovo prodotto disponibile", openRate: 89, clickRate: 18, responses: 32 },
            { message: "Promemoria appuntamento", openRate: 96, clickRate: 8, responses: 67 },
            { message: "Sondaggio soddisfazione cliente", openRate: 82, clickRate: 35, responses: 28 },
            { message: "Newsletter mensile", openRate: 78, clickRate: 12, responses: 15 }
        ];
        
        // Contact segments
        data.contactSegments = [
            { segment: 'Clienti Attivi', count: 45, percentage: 35, growth: '+12%' },
            { segment: 'Prospect Qualificati', count: 32, percentage: 25, growth: '+8%' },
            { segment: 'Lead Freddi', count: 28, percentage: 22, growth: '-3%' },
            { segment: 'VIP/Premium', count: 15, percentage: 12, growth: '+25%' },
            { segment: 'Inattivi', count: 8, percentage: 6, growth: '-15%' }
        ];
        
        // Hourly activity
        for (let hour = 0; hour < 24; hour++) {
            let activity;
            if (hour >= 9 && hour <= 18) {
                activity = Math.floor(Math.random() * 40 + 60); // High activity during business hours
            } else if (hour >= 19 && hour <= 22) {
                activity = Math.floor(Math.random() * 30 + 40); // Medium activity evening
            } else {
                activity = Math.floor(Math.random() * 20 + 5); // Low activity night/early morning
            }
            
            data.hourlyActivity.push({
                hour: hour.toString().padStart(2, '0') + ':00',
                messages: activity,
                responses: Math.floor(activity * 0.3)
            });
        }
        
        // Device types
        data.deviceTypes = [
            { type: 'Mobile', count: 89, percentage: 72 },
            { type: 'Desktop', count: 28, percentage: 23 },
            { type: 'Tablet', count: 6, percentage: 5 }
        ];
        
        return data;
    }
    
    changePeriod(period) {
        this.currentPeriod = period;
        
        // Update period selector
        document.querySelectorAll('.period-selector .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`)?.classList.add('active');
        
        // Refresh all charts and data
        this.refreshAnalytics();
        
        if (window.App?.modules?.toast) {
            const periodLabels = {
                '7days': '7 giorni',
                '30days': '30 giorni',
                '90days': '90 giorni'
            };
            window.App.modules.toast.info(`Periodo aggiornato: ${periodLabels[period]}`);
        }
    }
    
    refreshAnalytics() {
        this.updateKPICards();
        this.renderMessagesChart();
        this.renderPerformanceChart();
        this.renderContactGrowthChart();
        this.renderRevenueChart();
        this.updateTopMessages();
        this.updateContactSegments();
        this.renderHourlyActivityChart();
        this.renderDeviceChart();
    }
    
    updateKPICards() {
        const data = this.generateMockData(this.currentPeriod);
        
        // Calculate totals
        const totalMessages = data.messagesSent.reduce((sum, item) => sum + item.value, 0);
        const avgOpenRate = Math.floor(data.openRates.reduce((sum, item) => sum + item.value, 0) / data.openRates.length);
        const avgClickRate = Math.floor(data.clickRates.reduce((sum, item) => sum + item.value, 0) / data.clickRates.length);
        const totalRevenue = data.revenueGenerated.reduce((sum, item) => sum + item.value, 0);
        const totalContacts = data.contactGrowth.reduce((sum, item) => sum + item.value, 0);
        const avgResponseRate = Math.floor(data.responseRates.reduce((sum, item) => sum + item.value, 0) / data.responseRates.length);
        
        // Update KPI displays
        this.updateKPICard('totalMessagesKPI', totalMessages, '+15%');
        this.updateKPICard('openRateKPI', avgOpenRate + '%', '+2%');
        this.updateKPICard('clickRateKPI', avgClickRate + '%', '+8%');
        this.updateKPICard('responseRateKPI', avgResponseRate + '%', '+5%');
        this.updateKPICard('revenueKPI', '€' + totalRevenue, '+22%');
        this.updateKPICard('contactsKPI', '+' + totalContacts, '+18%');
    }
    
    updateKPICard(elementId, value, trend) {
        const element = document.getElementById(elementId);
        if (element) {
            const valueEl = element.querySelector('.kpi-value');
            const trendEl = element.querySelector('.kpi-trend');
            
            if (valueEl) valueEl.textContent = value;
            if (trendEl) {
                trendEl.textContent = trend;
                trendEl.className = 'kpi-trend ' + (trend.startsWith('+') ? 'positive' : 'negative');
            }
        }
    }
    
    renderMessagesChart() {
        const canvas = document.getElementById('messagesChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.generateMockData(this.currentPeriod);
        
        // Destroy existing chart
        if (this.chartInstances.messages) {
            this.chartInstances.messages.destroy();
        }
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(37, 211, 102, 0.8)');
        gradient.addColorStop(1, 'rgba(37, 211, 102, 0.1)');
        
        this.chartInstances.messages = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.messagesSent.map(item => new Date(item.date).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Messaggi Inviati',
                    data: data.messagesSent.map(item => item.value),
                    borderColor: '#25d366',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#25d366',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
    }
    
    renderPerformanceChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.generateMockData(this.currentPeriod);
        
        if (this.chartInstances.performance) {
            this.chartInstances.performance.destroy();
        }
        
        this.chartInstances.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.openRates.map(item => new Date(item.date).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Tasso di Apertura',
                        data: data.openRates.map(item => item.value),
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        tension: 0.4
                    },
                    {
                        label: 'Tasso di Click',
                        data: data.clickRates.map(item => item.value),
                        borderColor: '#f39c12',
                        backgroundColor: 'rgba(243, 156, 18, 0.1)',
                        borderWidth: 2,
                        tension: 0.4
                    },
                    {
                        label: 'Tasso di Risposta',
                        data: data.responseRates.map(item => item.value),
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
    }
    
    renderContactGrowthChart() {
        const canvas = document.getElementById('contactGrowthChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.generateMockData(this.currentPeriod);
        
        if (this.chartInstances.contactGrowth) {
            this.chartInstances.contactGrowth.destroy();
        }
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(155, 89, 182, 0.8)');
        gradient.addColorStop(1, 'rgba(155, 89, 182, 0.1)');
        
        this.chartInstances.contactGrowth = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.contactGrowth.map(item => new Date(item.date).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Nuovi Contatti',
                    data: data.contactGrowth.map(item => item.value),
                    backgroundColor: gradient,
                    borderColor: '#9b59b6',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
    }
    
    renderRevenueChart() {
        const canvas = document.getElementById('revenueChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.generateMockData(this.currentPeriod);
        
        if (this.chartInstances.revenue) {
            this.chartInstances.revenue.destroy();
        }
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(46, 204, 113, 0.8)');
        gradient.addColorStop(1, 'rgba(46, 204, 113, 0.1)');
        
        this.chartInstances.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.revenueGenerated.map(item => new Date(item.date).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Fatturato Generato',
                    data: data.revenueGenerated.map(item => item.value),
                    borderColor: '#2ecc71',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2ecc71',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            callback: function(value) {
                                return '€' + value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
    }
    
    renderHourlyActivityChart() {
        const canvas = document.getElementById('hourlyActivityChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.generateMockData(this.currentPeriod);
        
        if (this.chartInstances.hourlyActivity) {
            this.chartInstances.hourlyActivity.destroy();
        }
        
        this.chartInstances.hourlyActivity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.hourlyActivity.map(item => item.hour),
                datasets: [
                    {
                        label: 'Messaggi Inviati',
                        data: data.hourlyActivity.map(item => item.messages),
                        backgroundColor: 'rgba(52, 152, 219, 0.7)',
                        borderColor: '#3498db',
                        borderWidth: 1
                    },
                    {
                        label: 'Risposte Ricevute',
                        data: data.hourlyActivity.map(item => item.responses),
                        backgroundColor: 'rgba(231, 76, 60, 0.7)',
                        borderColor: '#e74c3c',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
    }
    
    renderDeviceChart() {
        const canvas = document.getElementById('deviceChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.generateMockData(this.currentPeriod);
        
        if (this.chartInstances.device) {
            this.chartInstances.device.destroy();
        }
        
        this.chartInstances.device = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.deviceTypes.map(item => item.type),
                datasets: [{
                    data: data.deviceTypes.map(item => item.percentage),
                    backgroundColor: [
                        '#3498db',
                        '#e74c3c',
                        '#f39c12'
                    ],
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            padding: 20
                        }
                    }
                }
            }
        });
    }
    
    updateTopMessages() {
        const container = document.getElementById('topMessagesList');
        if (!container) return;
        
        const data = this.generateMockData(this.currentPeriod);
        
        container.innerHTML = data.topPerformingMessages.map((msg, index) => `
            <div class="top-message-item">
                <div class="message-rank">#${index + 1}</div>
                <div class="message-content">
                    <div class="message-text">${msg.message}</div>
                    <div class="message-metrics">
                        <span class="metric">
                            <i class="fas fa-eye"></i> ${msg.openRate}% aperture
                        </span>
                        <span class="metric">
                            <i class="fas fa-click"></i> ${msg.clickRate}% click
                        </span>
                        <span class="metric">
                            <i class="fas fa-reply"></i> ${msg.responses} risposte
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    updateContactSegments() {
        const container = document.getElementById('contactSegmentsList');
        if (!container) return;
        
        const data = this.generateMockData(this.currentPeriod);
        
        container.innerHTML = data.contactSegments.map(segment => `
            <div class="segment-item">
                <div class="segment-info">
                    <div class="segment-name">${segment.segment}</div>
                    <div class="segment-count">${segment.count} contatti</div>
                </div>
                <div class="segment-metrics">
                    <div class="segment-percentage">${segment.percentage}%</div>
                    <div class="segment-growth ${segment.growth.startsWith('+') ? 'positive' : 'negative'}">
                        ${segment.growth}
                    </div>
                </div>
                <div class="segment-bar">
                    <div class="segment-progress" style="width: ${segment.percentage}%"></div>
                </div>
            </div>
        `).join('');
    }
    
    exportReport() {
        const data = this.generateMockData(this.currentPeriod);
        
        // Calculate summary
        const totalMessages = data.messagesSent.reduce((sum, item) => sum + item.value, 0);
        const avgOpenRate = Math.floor(data.openRates.reduce((sum, item) => sum + item.value, 0) / data.openRates.length);
        const totalRevenue = data.revenueGenerated.reduce((sum, item) => sum + item.value, 0);
        
        const report = `
REMINDPRO ENTERPRISE - REPORT ANALYTICS
=======================================
Periodo: ${this.currentPeriod}
Data generazione: ${new Date().toLocaleDateString('it-IT')}

METRICHE PRINCIPALI
-------------------
Messaggi inviati: ${totalMessages}
Tasso apertura medio: ${avgOpenRate}%
Fatturato generato: €${totalRevenue}

TOP MESSAGGI PERFORMANTI
------------------------
${data.topPerformingMessages.map((msg, i) => 
    `${i+1}. "${msg.message}" - ${msg.openRate}% aperture, ${msg.responses} risposte`
).join('\n')}

SEGMENTAZIONE CONTATTI
----------------------
${data.contactSegments.map(segment => 
    `${segment.segment}: ${segment.count} contatti (${segment.percentage}%) - Crescita: ${segment.growth}`
).join('\n')}

---
Report generato automaticamente da RemindPro Enterprise
        `.trim();
        
        const blob = new Blob([report], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `remindpro_analytics_${this.currentPeriod}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        if (window.App?.modules?.toast) {
            window.App.modules.toast.success('Report analytics esportato!');
        }
    }
    
    getPageContent() {
        return `
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-chart-line"></i> 
                    Analytics Avanzate
                </h1>
                <p class="page-subtitle">Metriche e performance dettagliate delle tue campagne</p>
            </div>

            <div class="analytics-controls">
                <div class="period-selector">
                    <button class="btn btn-outline-light" data-period="7days" onclick="window.App.modules.analytics.changePeriod('7days')">
                        <i class="fas fa-calendar-day"></i> 7 giorni
                    </button>
                    <button class="btn btn-outline-light active" data-period="30days" onclick="window.App.modules.analytics.changePeriod('30days')">
                        <i class="fas fa-calendar-week"></i> 30 giorni
                    </button>
                    <button class="btn btn-outline-light" data-period="90days" onclick="window.App.modules.analytics.changePeriod('90days')">
                        <i class="fas fa-calendar-alt"></i> 90 giorni
                    </button>
                </div>
                <div class="analytics-actions">
                    <button class="btn btn-primary" onclick="window.App.modules.analytics.exportReport()">
                        <i class="fas fa-download"></i> Esporta Report
                    </button>
                </div>
            </div>

            <div class="kpi-grid">
                <div class="kpi-card" id="totalMessagesKPI">
                    <div class="kpi-icon">
                        <i class="fas fa-paper-plane"></i>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value">1,247</div>
                        <div class="kpi-label">Messaggi Inviati</div>
                        <div class="kpi-trend positive">+15%</div>
                    </div>
                </div>
                
                <div class="kpi-card" id="openRateKPI">
                    <div class="kpi-icon">
                        <i class="fas fa-eye"></i>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value">87%</div>
                        <div class="kpi-label">Tasso Apertura</div>
                        <div class="kpi-trend positive">+2%</div>
                    </div>
                </div>
                
                <div class="kpi-card" id="clickRateKPI">
                    <div class="kpi-icon">
                        <i class="fas fa-mouse-pointer"></i>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value">16%</div>
                        <div class="kpi-label">Tasso Click</div>
                        <div class="kpi-trend positive">+8%</div>
                    </div>
                </div>
                
                <div class="kpi-card" id="responseRateKPI">
                    <div class="kpi-icon">
                        <i class="fas fa-reply"></i>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value">28%</div>
                        <div class="kpi-label">Tasso Risposta</div>
                        <div class="kpi-trend positive">+5%</div>
                    </div>
                </div>
                
                <div class="kpi-card" id="revenueKPI">
                    <div class="kpi-icon">
                        <i class="fas fa-euro-sign"></i>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value">€3,420</div>
                        <div class="kpi-label">Fatturato Generato</div>
                        <div class="kpi-trend positive">+22%</div>
                    </div>
                </div>
                
                <div class="kpi-card" id="contactsKPI">
                    <div class="kpi-icon">
                        <i class="fas fa-user-plus"></i>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value">+89</div>
                        <div class="kpi-label">Nuovi Contatti</div>
                        <div class="kpi-trend positive">+18%</div>
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-card">
                    <div class="chart-header">
                        <h3><i class="fas fa-paper-plane"></i> Messaggi Inviati</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="messagesChart"></canvas>
                    </div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-header">
                        <h3><i class="fas fa-chart-line"></i> Performance Messaggi</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="performanceChart"></canvas>
                    </div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-header">
                        <h3><i class="fas fa-users"></i> Crescita Contatti</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="contactGrowthChart"></canvas>
                    </div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-header">
                        <h3><i class="fas fa-euro-sign"></i> Fatturato Generato</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="analytics-details">
                <div class="detail-card">
                    <div class="card-header">
                        <h3><i class="fas fa-trophy"></i> Top Messaggi Performanti</h3>
                    </div>
                    <div id="topMessagesList">
                        <!-- Will be populated by JavaScript -->
                    </div>
                </div>
                
                <div class="detail-card">
                    <div class="card-header">
                        <h3><i class="fas fa-layer-group"></i> Segmentazione Contatti</h3>
                    </div>
                    <div id="contactSegmentsList">
                        <!-- Will be populated by JavaScript -->
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-card">
                    <div class="chart-header">
                        <h3><i class="fas fa-clock"></i> Attività per Ora</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="hourlyActivityChart"></canvas>
                    </div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-header">
                        <h3><i class="fas fa-mobile-alt"></i> Dispositivi Utilizzati</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="deviceChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-lightbulb"></i> Insights e Raccomandazioni</h3>
                </div>
                
                <div class="insights-grid">
                    <div class="insight-card positive">
                        <div class="insight-icon">
                            <i class="fas fa-arrow-up"></i>
                        </div>
                        <div class="insight-content">
                            <h4>Crescita Costante</h4>
                            <p>Il tuo tasso di apertura è aumentato del 15% nell'ultimo mese. Continua con questa strategia!</p>
                        </div>
                    </div>
                    
                    <div class="insight-card warning">
                        <div class="insight-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="insight-content">
                            <h4>Orario Ottimale</h4>
                            <p>I messaggi inviati tra le 10:00 e le 16:00 hanno il 23% di aperture in più. Programma i tuoi invii!</p>
                        </div>
                    </div>
                    
                    <div class="insight-card info">
                        <div class="insight-icon">
                            <i class="fas fa-mobile-alt"></i>
                        </div>
                        <div class="insight-content">
                            <h4>Focus Mobile</h4>
                            <p>Il 72% dei tuoi contatti apre i messaggi da mobile. Ottimizza i contenuti per i dispositivi mobili.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Dashboard integration method
    getDashboardContent() {
        const data = this.generateMockData('7days');
        const totalMessages = data.messagesSent.reduce((sum, item) => sum + item.value, 0);
        const avgOpenRate = Math.floor(data.openRates.reduce((sum, item) => sum + item.value, 0) / data.openRates.length);
        const totalRevenue = data.revenueGenerated.reduce((sum, item) => sum + item.value, 0);
        
        return {
            title: 'Analytics Panoramica',
            stats: [
                { 
                    label: 'Messaggi 7gg', 
                    value: totalMessages,
                    trend: '+15%',
                    icon: 'fas fa-paper-plane'
                },
                { 
                    label: 'Tasso Apertura', 
                    value: avgOpenRate + '%',
                    trend: '+2%',
                    icon: 'fas fa-eye'
                },
                { 
                    label: 'Fatturato', 
                    value: '€' + totalRevenue,
                    trend: '+22%',
                    icon: 'fas fa-euro-sign'
                }
            ],
            chartData: data
        };
    }
    
    async initializePage() {
        // Load Chart.js if not already loaded
        if (!window.Chart) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
            script.onload = () => {
                this.refreshAnalytics();
            };
            document.head.appendChild(script);
        } else {
            this.refreshAnalytics();
        }
    }
}

window.AnalyticsModule = AnalyticsModule;