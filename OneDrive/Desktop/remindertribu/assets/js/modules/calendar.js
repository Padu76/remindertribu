// assets/js/modules/calendar.js
(function () {
  'use strict';

  /**
   * CalendarModule
   * - Viste: month | week | day | agenda | iframe
   * - Click evento: apre htmlLink (se presente) altrimenti apre il giorno su Google Calendar
   * - "Vista Google" mostra l'iframe + link "Apri in Google Calendar"
   */
  class CalendarModule {
    constructor() {
      const now = new Date();
      this.view = 'week';              // default: settimana (lista)
      this.cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      this.eventsByDate = {};          // { 'YYYY-MM-DD': [ evt, ... ] }
      this.gcalEnabled = false;
      this._lastRange = null;
    }

    async init() {
      console.log('📅 [Calendar] init');
      console.log('✅ [Calendar] ready');
    }

    // ---------- UI skeleton ----------
    getPageContent() {
      const hasIframe = !!(window.AppConfig?.GOOGLE_CALENDAR_EMBED_URL);
      return `
        <section class="page-container" style="padding:1rem">
          <div class="page-header">
            <div>
              <h1 class="page-title"><i class="fas fa-calendar-alt"></i> Calendario</h1>
              <p class="page-subtitle">Scadenze, promemoria e appuntamenti ufficiali</p>
            </div>
            <div class="quick-actions" style="gap:.35rem;flex-wrap:wrap">
              <button class="btn btn-outline" data-calview="month"><i class="far fa-calendar"></i> Mese</button>
              <button class="btn btn-outline" data-calview="week"><i class="fas fa-stream"></i> Settimana</button>
              <button class="btn btn-outline" data-calview="day"><i class="far fa-calendar-check"></i> Giorno</button>
              <button class="btn btn-outline" data-calview="agenda"><i class="fas fa-list"></i> Agenda</button>
              <button class="btn ${hasIframe?'btn-outline':''}" data-calview="iframe" ${hasIframe?'':'disabled'} title="${hasIframe?'':'Configura GOOGLE_CALENDAR_ID su Vercel'}">
                <i class="fab fa-google"></i> Vista Google
              </button>
            </div>
          </div>

          <div class="page-header" style="padding:.25rem 0 .75rem">
            <div class="badge" id="calTitle">—</div>
            <div class="quick-actions" style="gap:.35rem;flex-wrap:wrap">
              <span id="calConnBadge" class="badge">GCAL: —</span>
              <button id="calPrev" class="btn btn-outline"><i class="fas fa-chevron-left"></i></button>
              <button id="calToday" class="btn btn-outline">Oggi</button>
              <button id="calNext" class="btn btn-outline"><i class="fas fa-chevron-right"></i></button>
            </div>
          </div>

          <!-- contenitori viste -->
          <div id="calMonth" style="display:none"></div>
          <div id="calWeek" style="display:none"></div>
          <div id="calDay" style="display:none"></div>
          <div id="calAgenda" style="display:none"></div>
          <div id="calIframe" style="display:none"></div>

          <style>
            .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
            .cal-head{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px;opacity:.8}
            .cal-head div{padding:6px 4px}
            .cal-cell{border:1px solid #243041;border-radius:10px;min-height:120px;padding:6px;background:var(--glass-bg);display:flex;flex-direction:column}
            .cal-cell .day{font-weight:700;opacity:.95;margin-bottom:.25rem}
            .cal-cell.today{outline:2px solid #3b82f6}
            .cal-cell .list{overflow:auto;flex:1;display:flex;flex-direction:column;gap:4px}
            .evt-chip{display:flex;gap:.35rem;align-items:center;border:1px solid #243041;border-radius:8px;padding:.15rem .4rem;font-size:.8rem;cursor:pointer}
            .evt-chip:hover{background:#0b1220c7}
            .evt-time{font-variant-numeric:tabular-nums;opacity:.85}
            .evt-type{opacity:.8;border:1px dashed #243041;border-radius:6px;padding:0 .3rem;font-size:.7rem}
            .event-list{border:1px solid #243041;border-radius:12px;padding:10px}
            .evt-row{display:flex;gap:.5rem;align-items:center;padding:.35rem 0;border-bottom:1px dashed #243041}
            .evt-row:last-child{border-bottom:none}
            .badge-link{margin-left:auto}
            .gcal-iframe{width:100%;height:76vh;min-height:600px;border:1px solid #243041;border-radius:12px;background:#0b1220;box-shadow:0 6px 18px rgba(0,0,0,.18)}
          </style>
        </section>
      `;
    }

    initializePage() {
      // bind view buttons
      document.querySelectorAll('[data-calview]').forEach(btn=>{
        btn.addEventListener('click', (e)=>{
          const v = e.currentTarget.getAttribute('data-calview');
          if (v==='iframe' && !window.AppConfig?.GOOGLE_CALENDAR_EMBED_URL) return;
          this.view = v;
          this.render();
        });
      });
      // nav
      document.getElementById('calPrev')?.addEventListener('click', ()=> this._shift(-1));
      document.getElementById('calNext')?.addEventListener('click', ()=> this._shift(1));
      document.getElementById('calToday')?.addEventListener('click', ()=> { this.cursor = new Date(); this.render(); });

      this.render();
    }

    // ---------- Render orchestrator ----------
    async render() {
      // set buttons state
      document.querySelectorAll('[data-calview]').forEach(b=>{
        const v = b.getAttribute('data-calview');
        b.classList.toggle('btn-primary', v===this.view);
        b.classList.toggle('btn-outline', v!==this.view);
      });

      // show proper container
      const box = {
        month: document.getElementById('calMonth'),
        week: document.getElementById('calWeek'),
        day: document.getElementById('calDay'),
        agenda: document.getElementById('calAgenda'),
        iframe: document.getElementById('calIframe'),
      };
      Object.values(box).forEach(el=> el && (el.style.display='none'));

      // compute range + fetch
      const {from, to, title} = this._rangeForView(this.view, this.cursor);
      this._lastRange = {from, to};
      document.getElementById('calTitle').textContent = title;
      await this._collectEvents(from, to);

      document.getElementById('calConnBadge').textContent = `GCAL: ${this.gcalEnabled ? 'connesso' : 'non connesso'}`;

      if (this.view === 'iframe') return this._renderIframe(box.iframe);

      if (this.view === 'month') { box.month.style.display='block'; return this._renderMonth(box.month, from, to); }
      if (this.view === 'week')  { box.week.style.display='block';  return this._renderWeek(box.week, from, to); }
      if (this.view === 'day')   { box.day.style.display='block';   return this._renderDay(box.day, from); }
      if (this.view === 'agenda'){ box.agenda.style.display='block';return this._renderAgenda(box.agenda, from, to); }
    }

    _shift(delta) {
      const c = new Date(this.cursor);
      if (this.view === 'month') c.setMonth(c.getMonth() + delta);
      else if (this.view === 'week' || this.view === 'agenda') c.setDate(c.getDate() + (7*delta));
      else c.setDate(c.getDate() + delta); // day
      this.cursor = c;
      this.render();
    }

    _rangeForView(view, cur) {
      const d = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate());
      let from, to, title;

      if (view === 'month') {
        from = new Date(d.getFullYear(), d.getMonth(), 1);
        to   = new Date(d.getFullYear(), d.getMonth()+1, 1);
        title = new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('it-IT', {month:'long',year:'numeric'});
        title = title.charAt(0).toUpperCase()+title.slice(1);
      } else if (view === 'week' || view === 'agenda') {
        // lun -> dom
        const wd = (d.getDay()+6)%7;
        from = new Date(d); from.setDate(d.getDate() - wd);
        to   = new Date(from); to.setDate(from.getDate()+7);
        const f = from.toLocaleDateString('it-IT'); const t = new Date(to.getTime()-86400000).toLocaleDateString('it-IT');
        title = `Settimana ${f} → ${t}`;
      } else if (view === 'day') {
        from = new Date(d); to = new Date(d); to.setDate(d.getDate()+1);
        title = d.toLocaleDateString('it-IT', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
        title = title.charAt(0).toUpperCase()+title.slice(1);
      } else { // fallback
        from = new Date(d); to = new Date(d); to.setDate(d.getDate()+1);
        title = 'Giorno';
      }
      return {from, to, title};
    }

    // ---------- Data collection ----------
    async _collectEvents(from, to) {
      this.eventsByDate = {};

      // 1) Scadenze tesserati
      const s = window.App?.modules?.storage || window.Storage_Instance;
      const members = s?.getMembersCached?.() || [];
      for (const m of members) {
        if (!m.dataScadenza) continue;
        const dt = new Date(m.dataScadenza); if (isNaN(dt)) continue;
        if (dt < from || dt >= to) continue;
        this._pushEvt(this._iso(dt), { type:'Scadenza', title:`Tesseramento: ${m.fullName||m.nome||''}`, start: dt, end: dt, isAllDay: true, link: null });
      }

      // 2) Reminders
      const rems = s?.getRemindersCached?.() || [];
      for (const r of rems) {
        const ts = r.sendAt || r.scheduledAt || r.dueAt || r.date || null;
        if (!ts) continue;
        const dt = new Date(ts); if (isNaN(dt)) continue;
        if (dt < from || dt >= to) continue;
        this._pushEvt(this._iso(dt), { type:'Reminder', title:(r.name||r.title||'Reminder'), start: dt, end: dt, isAllDay: false, link: null });
      }

      // 3) Google Calendar
      try {
        const fromIso = this._iso(from).slice(0,10);
        const toIso   = this._iso(to).slice(0,10);
        const resp = await fetch(`/api/calendar?from=${fromIso}&to=${toIso}`);
        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();
        this.gcalEnabled = !!data.ok;

        const evs = Array.isArray(data.events) ? data.events : [];
        for (const e of evs) {
          const start = this._parseISODate(e.start);
          const end   = this._parseISODate(e.end);
          const isAllDay = /^\d{4}-\d{2}-\d{2}$/.test(e.start);
          const link = e.htmlLink || null;
          const title = e.title || '(Senza titolo)';

          // espande eventi "all-day" su più giorni
          const span = this._expandSpanDays(e.start, e.end);
          if (span.length === 0) {
            if (start >= from && start < to) this._pushEvt(this._iso(start), { type:'Evento', title, start, end, isAllDay, link });
          } else {
            for (const iso of span) {
              const d = this._parseISODate(iso);
              if (d >= from && d < to) this._pushEvt(iso, { type:'Evento', title, start: d, end: d, isAllDay:true, link });
            }
          }
        }
      } catch (e) {
        console.warn('Google Calendar non connesso / errore:', e.message||e);
        this.gcalEnabled = false;
      }
    }

    _pushEvt(iso, evt) {
      if (!this.eventsByDate[iso]) this.eventsByDate[iso] = [];
      this.eventsByDate[iso].push(evt);
    }

    // ---------- Renders ----------
    _renderMonth(container, from, to) {
      const head = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
      const first = new Date(from.getFullYear(), from.getMonth(), 1);
      const startDay = (first.getDay()+6)%7; // 0 = lun
      const daysInMonth = new Date(from.getFullYear(), from.getMonth()+1, 0).getDate();

      const cells = [];
      for (let i=0;i<startDay;i++) cells.push(null);
      for (let d=1; d<=daysInMonth; d++) cells.push(new Date(from.getFullYear(), from.getMonth(), d));

      const headHtml = `<div class="cal-head">${head.map(d=>`<div>${d}</div>`).join('')}</div>`;
      container.innerHTML = headHtml + `<div class="cal-grid">${cells.map(date => this._monthCellHTML(date)).join('')}</div>`;

      container.querySelectorAll('.evt-chip').forEach(chip=>{
        chip.addEventListener('click', (e)=>{
          const href = e.currentTarget.getAttribute('data-href');
          if (href) window.open(href, '_blank');
        });
      });
    }
    _monthCellHTML(date) {
      if (!date) return `<div></div>`;
      const iso = this._iso(date).slice(0,10);
      const evts = this.eventsByDate[iso] || [];
      const isToday = this._isSameDay(date, new Date());

      // mostra TUTTI gli eventi con scroll interno
      const items = evts
        .sort((a,b)=> (a.isAllDay?0:1) - (b.isAllDay?0:1) || (a.start-b.start))
        .map(e => this._eventChipHTML(e))
        .join('');

      return `
        <div class="cal-cell ${isToday?'today':''}" data-date="${iso}">
          <div class="day">${date.getDate()}</div>
          <div class="list">${items || '<span style="opacity:.6">—</span>'}</div>
        </div>
      `;
    }

    _renderWeek(container, from, to) {
      // lista per giorno (7 giorni)
      let html = '';
      for (let i=0;i<7;i++){
        const d = new Date(from); d.setDate(from.getDate()+i);
        const iso = this._iso(d).slice(0,10);
        const title = d.toLocaleDateString('it-IT',{weekday:'long', day:'numeric', month:'short'});
        const evts = (this.eventsByDate[iso]||[])
          .sort((a,b)=> (a.isAllDay?0:1) - (b.isAllDay?0:1) || (a.start-b.start))
          .map(e => this._eventRowHTML(e))
          .join('');
        html += `
          <div class="event-list" style="margin-bottom:.6rem">
            <div style="display:flex;align-items:center;gap:.5rem">
              <strong>${title.charAt(0).toUpperCase()+title.slice(1)}</strong>
              ${this._googleDayLinkBtn(d)}
            </div>
            <div style="margin-top:.35rem">${evts || '<em style="opacity:.7">Nessun evento</em>'}</div>
          </div>`;
      }
      container.innerHTML = html;
      this._bindRowClicks(container);
    }

    _renderDay(container, day) {
      const iso = this._iso(day).slice(0,10);
      const evts = (this.eventsByDate[iso]||[])
        .sort((a,b)=> (a.isAllDay?0:1) - (b.isAllDay?0:1) || (a.start-b.start))
        .map(e => this._eventRowHTML(e))
        .join('');
      const title = day.toLocaleDateString('it-IT',{weekday:'long', day:'numeric', month:'long', year:'numeric'});
      container.innerHTML = `
        <div class="event-list">
          <div style="display:flex;align-items:center;gap:.5rem">
            <strong>${title.charAt(0).toUpperCase()+title.slice(1)}</strong>
            ${this._googleDayLinkBtn(day)}
          </div>
          <div style="margin-top:.35rem">${evts || '<em style="opacity:.7">Nessun evento</em>'}</div>
        </div>`;
      this._bindRowClicks(container);
    }

    _renderAgenda(container, from, to) {
      // lista lineare di tutto il range
      const days = [];
      for (let d=new Date(from); d<to; d.setDate(d.getDate()+1)) {
        days.push(new Date(d));
      }
      let html = '';
      for (const d of days) {
        const iso = this._iso(d).slice(0,10);
        const evts = (this.eventsByDate[iso]||[])
          .sort((a,b)=> (a.isAllDay?0:1) - (b.isAllDay?0:1) || (a.start-b.start))
          .map(e => this._eventRowHTML(e))
          .join('');
        const t = d.toLocaleDateString('it-IT',{weekday:'short', day:'numeric', month:'short'});
        html += `
          <div class="event-list" style="margin-bottom:.6rem">
            <div style="display:flex;align-items:center;gap:.5rem">
              <strong>${t.charAt(0).toUpperCase()+t.slice(1)}</strong>
              ${this._googleDayLinkBtn(d)}
            </div>
            <div style="margin-top:.35rem">${evts || '<em style="opacity:.7">—</em>'}</div>
          </div>`;
      }
      container.innerHTML = html;
      this._bindRowClicks(container);
    }

    _renderIframe(container) {
      const url = window.AppConfig?.GOOGLE_CALENDAR_EMBED_URL || '';
      const openUrl = this._googleOpenUrl();
      container.style.display='block';
      container.innerHTML = `
        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-bottom:.5rem">
          <a class="btn btn-outline" href="${openUrl}" target="_blank" rel="noopener">
            <i class="fab fa-google"></i> Apri in Google Calendar
          </a>
        </div>
        <iframe class="gcal-iframe" src="${url}" loading="lazy"></iframe>
      `;
    }

    // ---------- Templates helpers ----------
    _eventChipHTML(e){
      const when = e.isAllDay ? 'Tutto il giorno' : this._fmtTime(e.start);
      const href = e.link || this._googleDayUrl(e.start);
      return `<div class="evt-chip" data-href="${href}">
        <span class="evt-time">${when}</span>
        <span class="evt-type">${e.type}</span>
        <span>${this._esc(e.title||'')}</span>
      </div>`;
    }
    _eventRowHTML(e){
      const when = e.isAllDay ? 'Tutto il giorno' : `${this._fmtTime(e.start)}${e.end?`–${this._fmtTime(e.end)}`:''}`;
      const href = e.link || this._googleDayUrl(e.start);
      return `<div class="evt-row" data-href="${href}">
        <span class="evt-type">${e.type}</span>
        <span class="evt-time">${when}</span>
        <div>${this._esc(e.title||'')}</div>
        <a class="badge badge-link" href="${href}" target="_blank" rel="noopener">Apri</a>
      </div>`;
    }
    _bindRowClicks(container){
      container.querySelectorAll('[data-href]').forEach(el=>{
        el.addEventListener('click', (ev)=>{
          const a = ev.target.closest('a'); // se clic sul link, lascia default
          if (a) return;
          const href = el.getAttribute('data-href');
          if (href) window.open(href, '_blank');
        });
      });
    }

    _googleDayLinkBtn(date){
      const href = this._googleDayUrl(date);
      return `<a class="badge" href="${href}" target="_blank" rel="noopener" title="Apri il giorno in Google Calendar">Apri</a>`;
    }
    _googleDayUrl(date){
      // fallback: apri vista giorno vicino alla data
      const d = new Date(date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const dd = String(d.getDate()).padStart(2,'0');
      const base = 'https://calendar.google.com/calendar/u/0/r/day';
      const src = this._extractCalIdFromEmbed() || '';
      const cid = src ? `&cid=${encodeURIComponent(src)}` : '';
      return `${base}/${yyyy}/${mm}/${dd}?pli=1${cid}`;
    }
    _googleOpenUrl(){
      const src = this._extractCalIdFromEmbed() || '';
      return `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(src)}`;
    }
    _extractCalIdFromEmbed(){
      try{
        const url = new URL(window.AppConfig?.GOOGLE_CALENDAR_EMBED_URL||'', 'https://x');
        return url.searchParams.get('src') || '';
      }catch{return '';}
    }

    // ---------- Utils ----------
    _expandSpanDays(start, end) {
      // per eventi all-day (end esclusivo)
      const s = this._parseISODate(start);
      let e = this._parseISODate(end);
      if (/^\d{4}-\d{2}-\d{2}$/.test(end)) e = new Date(e.getTime() - 86400000);
      const out = [];
      if (isNaN(s) || isNaN(e)) return out;
      const cur = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      const last = new Date(e.getFullYear(), e.getMonth(), e.getDate());
      while (cur <= last) { out.push(this._iso(cur).slice(0,10)); cur.setDate(cur.getDate() + 1); }
      return out;
    }

    _fmtTime(d){ const x=new Date(d); return x.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}); }
    _iso(d){ const x=new Date(d); return x.toISOString(); }
    _parseISODate(x){ if(!x) return new Date('invalid'); if(/^\d{4}-\d{2}-\d{2}$/.test(x)) return new Date(`${x}T00:00:00`); return new Date(x); }
    _isSameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
    _esc(s){return (s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
  }

  window.CalendarModule = new CalendarModule();
})();
