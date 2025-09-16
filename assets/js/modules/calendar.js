// assets/js/modules/calendar.js
(function() {
  'use strict';

  const CalendarModule = {
    initialized: false,
    
    async init() {
      console.log('📅 [Calendar] init');
      this.initialized = true;
      
      if (window.updatePageTitle) {
        window.updatePageTitle('Calendario');
      }
      
      return true;
    },
    
    async mount(container) {
      // Calendario Google di Tribù - EMAIL CORRETTA
      const calendarId = 'tribupersonalstudio@gmail.com';
      const calendarSrc = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=Europe/Rome&mode=MONTH&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0&hl=it`;
      
      container.innerHTML = `
        <style>
          .calendar-container {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            border: 1px solid #e5e5e5;
            height: calc(100vh - 180px);
            min-height: 600px;
          }
          
          .calendar-header {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e5e5e5;
          }
          
          .calendar-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .calendar-iframe {
            width: 100%;
            height: calc(100% - 60px);
            border: none;
            border-radius: 8px;
          }
          
          .calendar-info {
            background: #fafafa;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.875rem;
            color: #525252;
            border: 1px solid #e5e5e5;
          }
          
          .calendar-info i {
            color: #ff6b35;
            margin-right: 0.5rem;
          }
          
          .btn-external {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.625rem 1.25rem;
            background: #000;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 0.875rem;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s;
          }
          
          .btn-external:hover {
            background: #262626;
          }
        </style>
        
        <div class="calendar-container">
          <div class="calendar-header">
            <h2 class="calendar-title">
              <i class="fas fa-calendar-days"></i>
              Calendario Tribù Personal Studio
            </h2>
          </div>
          
          <div class="calendar-info">
            <i class="fas fa-info-circle"></i>
            Questo calendario mostra tutti gli appuntamenti e le scadenze di Tribù Personal Studio.
          </div>
          
          <iframe 
            class="calendar-iframe"
            src="${calendarSrc}"
            frameborder="0" 
            scrolling="no"
          ></iframe>
          
          <div style="margin-top: 1rem;">
            <a href="https://calendar.google.com/calendar/u/0?cid=${encodeURIComponent(calendarId)}" 
               target="_blank" 
               class="btn-external">
              <i class="fas fa-external-link-alt"></i>
              Apri in Google Calendar
            </a>
          </div>
        </div>
      `;
    }
  };
  
  window.CalendarModule = CalendarModule;
})();