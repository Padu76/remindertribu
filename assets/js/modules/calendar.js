// assets/js/modules/calendar.js
(function () {
  'use strict';

  class CalendarModule {
    constructor() {
      const now = new Date();
      this.year = now.getFullYear();
      this.month = now.getMonth(); // 0-11
      this.eventsByDate = {}; // 'YYYY-MM-DD' => [{type,title,meta}]
    }

    async init() {
      console.log('📅 [Calendar] init…');
      console.log('✅ [Calendar] initialized');
    }

    getPageContent() {
      return `
        <section style="padding:1rem">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:.8rem;">
            <h2 style="margin:0;"><i class="fas fa-calendar-alt"></i> Calendario</h2>
            <div style="display:flex;gap:.5rem;">
              <button id="calPrev" class="btn btn-outline"><i class="fas fa-chevron-left"></i></button>
              <div id="calTitle" class="badge" style="align-self:center;"></div>
              <button id="calNext" class="btn btn-outline"><i class="fas fa-chevron-right"></i></button>
              <button id="calToday" class="btn btn-outline">Oggi</button>
            </div>
          </div>
          <div id="calGrid"></div>
          <div id="calList" style="margin-top:1rem;"></div>
        </section>

        <style>
          .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
          .cal-cell{border:1px solid #243041;border-radius:10px;min-height:92px;padding:6px;background:var(--glass-bg)}
          .cal-cell .day{font-weight:700;opacity:.9}
          .cal-cell .dot{display:inline-block;min-width:18px;padding:.05rem .35rem;border-radius:8px;border:1px solid #243041; font-size:.75rem;margin-right:4px}
          .cal-cell.today{outline:2px solid #3b82f6;}
          .cal-head{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px;opacity:.8}
          .cal-head div{padding:6px 4px}
          .event-list{border:1px solid #243041;border-radius:12px;padding:10px}
          .evt{display:flex;gap:.5rem;align-items:center;border-bottom:1px dashed #243041;padding:.35rem 0}
          .evt:last-child{border-bottom:none}
          .evt-badge{border:1px solid #243041;border-radius:8px;padding:.05rem .35rem;font-size:.75rem}
        </style>
      `;
    }

    initializePage() {
      document.getElementById('calPrev')?.addEventListener('click', () => this._shift(-1));
      document.getElementById('calNext')?.addEventListener('click', () => this._shift(1));
      document.getElementById('calToday')?.addEventListener('click', () => {
        const now = new Date();
        this.year = now.getFullYear(); this.month = now.getMonth();
        this._render();
      });
      this._render();
    }

    _shift(delta) {
      this.month += delta;
      if (this.month < 0) { this.month = 11; this.year--; }
      if (this.month > 11) { this.month = 0; this.year++; }
      this._render();
    }

    _render() {
      const s = window.App?.modules?.storage || window.Storage_Instance;
      this._collectEvents(s);

      const title = new Date(this.year, this.month, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
      document.getElementById('calTitle').textContent = title.charAt(0).toUpperCase() + title.slice(1);

      const head = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
      const calHeadHtml = `<div class="cal-head">${head.map(d=>`<div>${d}</div>`).join('')}</div>`;

      // calcolo griglia
      const first = new Date(this.year, this.month, 1);
      const startDay = (first.getDay()+6)%7; // 0=Lun ... 6=Dom
      const daysInMonth = new Date(this.year, this.month+1, 0).getDate();

      const cells = [];
      for (let i = 0; i < startDay; i++) cells.push(null);
      for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(this.year, this.month, d));

      const grid = document.getElementById('calGrid');
      if (!grid) return;
      grid.className = 'cal-grid';
      grid.innerHTML = calHeadHtml + `<div class="cal-grid">${cells.map(date => this._cellHTML(date)).join('')}</div>`;

      // click day
      grid.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
        cell.addEventListener('click', () => {
          const iso = cell.getAttribute('data-date');
          this._renderList(iso);
        });
      });

      // pre-seleziona oggi se mese corrente
      const now = new Date();
      if (now.getFullYear() === this.year && now.getMonth() === this.month) {
        const iso = this._iso(now);
        this._renderList(iso);
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

    _collectEvents(storage) {
      this.eventsByDate = {};
      // Scadenze tesserati
      const members = storage?.getMembersCached?.() || [];
      for (const m of members) {
        if (!m.dataScadenza) continue;
        const d = new Date(m.dataScadenza); if (isNaN(d)) continue;
        if (d.getFullYear() !== this.year || d.getMonth() !== this.month) continue;
        this._pushEvt(this._iso(d), { type:'Scadenza', title:`Tesseramento: ${m.fullName || m.nome || ''}` });
      }

      // Reminders (se hanno data)
      const rems = storage?.getRemindersCached?.() || [];
      for (const r of rems) {
        const ts = r.sendAt || r.scheduledAt || r.dueAt || r.date || null;
        if (!ts) continue;
        const d = new Date(ts); if (isNaN(d)) continue;
        if (d.getFullYear() !== this.year || d.getMonth() !== this.month) continue;
        this._pushEvt(this._iso(d), { type:'Reminder', title:(r.name || r.title || 'Reminder') });
      }
    }

    _pushEvt(iso, evt) {
      if (!this.eventsByDate[iso]) this.eventsByDate[iso] = [];
      this.eventsByDate[iso].push(evt);
    }

    _iso(d) { const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; }
    _isSameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
    _esc(s){return (s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
  }

  window.CalendarModule = new CalendarModule();
})();
