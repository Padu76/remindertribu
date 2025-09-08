// assets/js/modules/calendar.js
(function () {
  'use strict';

  class CalendarModule {
    constructor() {
      const now = new Date();
      this.year = now.getFullYear();
      this.month = now.getMonth(); // 0..11
      this.eventsByDate = {}; // iso -> [{type,title}]
      this.gcalEnabled = false;
      this.view = 'app'; // 'app' | 'iframe'
    }

    async init() {
      console.log('📅 [Calendar] init…');
      console.log('✅ [Calendar] initialized');
    }

    getPageContent() {
      const hasIframe = !!(window.AppConfig?.GOOGLE_CALENDAR_EMBED_URL);
      return `
        <section class="page-container" style="padding:1rem">
          <div class="page-header">
            <div>
              <h1 class="page-title"><i class="fas fa-calendar-alt"></i> Calendario</h1>
              <p class="page-subtitle">Scadenze, promemoria e appuntamenti ufficiali</p>
            </div>
            <div class="quick-actions">
              <button class="btn ${this.view==='app'?'btn-primary':'btn-outline'}" data-calview="app"><i class="fas fa-table"></i> Vista mese (app)</button>
              <button class="btn ${this.view==='iframe'?'btn-primary':'btn-outline'}" data-calview="iframe" ${hasIframe?'':'disabled'} title="${hasIframe?'':'Imposta GOOGLE_CALENDAR_ID / CALENDAR_TZ su Vercel'}">
                <i class="fab fa-google"></i> Vista Google (iframe)
              </button>
            </div>
          </div>

          <div id="calAppWrap"></div>
          <div id="calIframeWrap" style="display:none"></div>

          <style>
            .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
            .cal-cell{border:1px solid #243041;border-radius:10px;min-height:78px;padding:6px;background:var(--glass-bg)}
            .cal-cell .day{font-weight:700;opacity:.9}
            .cal-cell .dot{display:inline-block;min-width:18px;padding:.05rem .35rem;border-radius:8px;border:1px solid #243041;font-size:.75rem;margin-right:4px}
            .cal-cell.today{outline:2px solid #3b82f6;}
            .cal-head{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px;opacity:.8}
            .cal-head div{padding:6px 4px}
            .event-list{border:1px solid #243041;border-radius:12px;padding:10px}
            .evt{display:flex;gap:.5rem;align-items:center;border-bottom:1px dashed #243041;padding:.35rem 0}
            .evt:last-child{border-bottom:none}
            .evt-badge{border:1px solid #243041;border-radius:8px;padding:.05rem .35rem;font-size:.75rem}
            .gcal-iframe{
              width:100%; height:75vh; min-height:600px; border:1px solid #243041;
              border-radius:12px; background:#0b1220; box-shadow:0 6px 18px rgba(0,0,0,.18);
            }
          </style>
        </section>
      `;
    }

    initializePage() {
      // toggle vista
      document.querySelectorAll('[data-calview]').forEach(btn=>{
        btn.addEventListener('click', (e)=>{
          const v = e.currentTarget.getAttribute('data-calview');
          if (v === 'iframe' && !window.AppConfig?.GOOGLE_CALENDAR_EMBED_URL) return;
          this.view = v;
          this._renderView();
        });
      });

      this._renderView();
    }

    async _renderView() {
      // attiva/deattiva pulsanti
      document.querySelectorAll('[data-calview]').forEach(b=>{
        const v = b.getAttribute('data-calview');
        b.classList.toggle('btn-primary', v===this.view);
        b.classList.toggle('btn-outline', v!==this.view);
      });

      const appWrap = document.getElementById('calAppWrap');
      const iframeWrap = document.getElementById('calIframeWrap');

      if (this.view === 'iframe') {
        appWrap.style.display = 'none';
        iframeWrap.style.display = 'block';
        const url = window.AppConfig?.GOOGLE_CALENDAR_EMBED_URL;
        iframeWrap.innerHTML = url
          ? `<iframe class="gcal-iframe" src="${url}" loading="lazy"></iframe>`
          : `<div class="empty">Imposta GOOGLE_CALENDAR_ID e (opzionale) CALENDAR_TZ su Vercel.</div>`;
        return;
      }

      // Vista app
      iframeWrap.style.display = 'none';
      appWrap.style.display = 'block';
      appWrap.innerHTML = `
        <div class="page-header" style="padding:0 0 .75rem">
          <div class="badge" id="calTitle"></div>
          <div class="quick-actions">
            <span id="calConnBadge" class="badge">GCAL: —</span>
            <button id="calPrev" class="btn btn-outline"><i class="fas fa-chevron-left"></i></button>
            <button id="calNext" class="btn btn-outline"><i class="fas fa-chevron-right"></i></button>
            <button id="calToday" class="btn btn-outline">Oggi</button>
          </div>
        </div>
        <div id="calGrid"></div>
        <div id="calList" style="margin-top:1rem;"></div>
      `;

      document.getElementById('calPrev')?.addEventListener('click', () => this._shift(-1));
      document.getElementById('calNext')?.addEventListener('click', () => this._shift(1));
      document.getElementById('calToday')?.addEventListener('click', () => {
        const now = new Date();
        this.year = now.getFullYear(); this.month = now.getMonth();
        this._renderApp();
      });

      await this._renderApp();
    }

    _shift(delta) {
      this.month += delta;
      if (this.month < 0) { this.month = 11; this.year--; }
      if (this.month > 11) { this.month = 0; this.year++; }
      this._renderApp();
    }

    async _renderApp() {
      const s = window.App?.modules?.storage || window.Storage_Instance;
      await this._collectEvents(s); // include fetch Google

      const title = new Date(this.year, this.month, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
      document.getElementById('calTitle').textContent = title.charAt(0).toUpperCase() + title.slice(1);
      document.getElementById('calConnBadge').textContent = `GCAL: ${this.gcalEnabled ? 'connesso' : 'non connesso'}`;

      const head = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
      const calHeadHtml = `<div class="cal-head">${head.map(d=>`<div>${d}</div>`).join('')}</div>`;

      const first = new Date(this.year, this.month, 1);
      const startDay = (first.getDay()+6)%7; // 0=Lun
      const daysInMonth = new Date(this.year, this.month+1, 0).getDate();

      const cells = [];
      for (let i = 0; i < startDay; i++) cells.push(null);
      for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(this.year, this.month, d));

      const grid = document.getElementById('calGrid');
      if (!grid) return;
      grid.className = 'cal-grid';
      grid.innerHTML = calHeadHtml + `<div class="cal-grid">${cells.map(date => this._cellHTML(date)).join('')}</div>`;

      grid.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
        cell.addEventListener('click', () => {
          const iso = cell.getAttribute('data-date');
          this._renderList(iso);
        });
      });

      const now = new Date();
      if (now.getFullYear() === this.year && now.getMonth() === this.month) {
        this._renderList(this._iso(now));
      } else {
        document.getElementById('calList').innerHTML = `<div class="event-list"><em>Seleziona un giorno per vedere i dettagli.</em></div>`;
      }
    }

    _cellHTML(date) {
      if (!date) return `<div></div>`;
      const iso = this._iso(date);
      const evts = this.eventsByDate[iso] || [];
      const isToday = this._isSameDay(date, new Date());
      const dots = evts.length ? `<span class="dot">${evts.length}</span>` : '';
      return `
        <div class="cal-cell ${isToday?'today':''}" data-date="${iso}">
          <div class="day">${date.getDate()}</div>
          <div class="evts">${dots}</div>
        </div>
      `;
    }

    _renderList(iso) {
      const list = document.getElementById('calList');
      const evts = this.eventsByDate[iso] || [];
      const human = iso.split('-').reverse().join('/');
      if (!evts.length) {
        list.innerHTML = `<div class="event-list"><strong>${human}</strong><div style="opacity:.7">Nessun evento.</div></div>`;
        return;
      }
      list.innerHTML = `
        <div class="event-list">
          <strong>${human}</strong>
          <div style="margin-top:.4rem;">
            ${evts.map(e => `
              <div class="evt">
                <span class="evt-badge">${e.type}</span>
                <div>${this._esc(e.title)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    async _collectEvents(storage) {
      this.eventsByDate = {};

      // 1) Scadenze tesserati
      const members = storage?.getMembersCached?.() || [];
      for (const m of members) {
        if (!m.dataScadenza) continue;
        const d = new Date(m.dataScadenza); if (isNaN(d)) continue;
        if (d.getFullYear() !== this.year || d.getMonth() !== this.month) continue;
        this._pushEvt(this._iso(d), { type:'Scadenza', title:`Tesseramento: ${m.fullName || m.nome || ''}` });
      }

      // 2) Reminders datati
      const rems = storage?.getRemindersCached?.() || [];
      for (const r of rems) {
        const ts = r.sendAt || r.scheduledAt || r.dueAt || r.date || null;
        if (!ts) continue;
        const d = new Date(ts); if (isNaN(d)) continue;
        if (d.getFullYear() !== this.year || d.getMonth() !== this.month) continue;
        this._pushEvt(this._iso(d), { type:'Reminder', title:(r.name || r.title || 'Reminder') });
      }

      // 3) Google Calendar (serverless)
      try {
        const fromIso = this._iso(new Date(this.year, this.month, 1));
        const toIso = this._iso(new Date(this.year, this.month + 1, 1));
        const resp = await fetch(`/api/calendar?from=${fromIso}&to=${toIso}`);
        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();
        this.gcalEnabled = !!data.ok;

        const events = Array.isArray(data.events) ? data.events : [];
        for (const e of events) {
          const span = this._expandSpanDays(e.start, e.end);
          for (const iso of span) {
            const d = this._parseISODate(iso);
            if (d.getFullYear() !== this.year || d.getMonth() !== this.month) continue;
            this._pushEvt(iso, { type:'Evento', title: e.title || '(Senza titolo)' });
          }
        }
      } catch (e) {
        console.warn('Google Calendar non connesso o errore:', e.message || e);
        this.gcalEnabled = false;
      }
    }

    _expandSpanDays(start, end) {
      const s = this._parseISODate(start);
      let e = this._parseISODate(end);
      if (/^\d{4}-\d{2}-\d{2}$/.test(end)) e = new Date(e.getTime() - 86400000);
      const out = [];
      if (isNaN(s) || isNaN(e)) return out;
      const cur = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      const last = new Date(e.getFullYear(), e.getMonth(), e.getDate());
      while (cur <= last) { out.push(this._iso(cur)); cur.setDate(cur.getDate() + 1); }
      return out;
    }

    _pushEvt(iso, evt) {
      if (!this.eventsByDate[iso]) this.eventsByDate[iso] = [];
      this.eventsByDate[iso].push(evt);
    }

    _iso(d) { const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; }
    _isSameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
    _esc(s){return (s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
    _parseISODate(x){
      if (!x) return new Date('invalid');
      if (/^\d{4}-\d{2}-\d{2}$/.test(x)) return new Date(`${x}T00:00:00`);
      return new Date(x);
    }
  }

  window.CalendarModule = new CalendarModule();
})();
