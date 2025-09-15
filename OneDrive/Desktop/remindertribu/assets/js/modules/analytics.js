// assets/js/modules/analytics.js
(function () {
  'use strict';

  // ---------- utils ----------
  const DAY = 24 * 60 * 60 * 1000;

  function ensureStylesOnce() {
    if (document.getElementById('analytics-inline-styles')) return;
    const css = `
      .dash-grid{display:grid;gap:.9rem;grid-template-columns:repeat(4,1fr)}
      @media (max-width: 1200px){ .dash-grid{grid-template-columns:repeat(2,1fr)} }
      @media (max-width: 720px){  .dash-grid{grid-template-columns:1fr} }
      .card{background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:16px}
      .kpi{display:flex;gap:.85rem;align-items:center;cursor:pointer}
      .kpi .icon{width:40px;height:40px;display:grid;place-items:center;border-radius:10px;background:#243447}
      .kpi .big{font-size:1.7rem;font-weight:800;letter-spacing:.3px}
      .muted{opacity:.75}.small{font-size:.9rem}
      .toolbar{display:flex;gap:.5rem;align-items:center;margin:.75rem 0}
      .toolbar .right{margin-left:auto;display:flex;gap:.5rem}
      .btn{padding:.45rem .7rem;border-radius:.6rem;border:0;background:#2f7ddc;color:#fff;cursor:pointer}
      .btn.secondary{background:#3c4658}
      table.rt{width:100%;border-collapse:separate;border-spacing:0}
      table.rt th,table.rt td{padding:.55rem .65rem;border-bottom:1px solid rgba(255,255,255,.08)}
      .chip{display:inline-block;padding:.2rem .45rem;border-radius:999px;font-size:.8rem}
      .chip.green{background:#1f8a46}
      .chip.amber{background:#a97a1f}
      .chip.red{background:#b43333}
      .chip.gray{background:#5a6473}
    `;
    const el = document.createElement('style');
    el.id = 'analytics-inline-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function parseDateMaybe(v) {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (v && typeof v === 'object' && typeof v.toDate === 'function') {
      try { return v.toDate(); } catch {}
    }
    const d = new Date(String(v));
    return isNaN(d) ? null : d;
  }
  function daysLeftFromToday(d) {
    if (!d) return null;
    const today = new Date();
    const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.floor((b - a) / DAY);
  }
  function statusOf(m) {
    const expiry = parseDateMaybe(m?.scadenza || m?.expiryDate || m?.expiry || m?.nextRenewal);
    const dl = daysLeftFromToday(expiry);
    if (dl == null) return 'unknown';
    if (dl < 0) return 'expired';
    if (dl <= 30) return 'expiring';
    return 'active';
  }
  function badge(st) {
    const map = { active:'green', expiring:'amber', expired:'red', unknown:'gray' };
    const lab = { active:'Attivo', expiring:'In scadenza', expired:'Scaduto', unknown:'—' };
    const c = map[st] || 'gray';
    const t = lab[st] || '—';
    return `<span class="chip ${c}">${t}</span>`;
  }
  function fmtISO(d) {
    if (!d) return '—';
    const z = new Date(d);
    const yyyy = z.getFullYear();
    const mm = String(z.getMonth()+1).padStart(2,'0');
    const dd = String(z.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // ---------- module ----------
  const AnalyticsModule = {
    async init() {
      console.log('📊 [Analytics] init…');
      ensureStylesOnce();

      // warm storage (non blocca se già pronto)
      const s = window.Storage_Instance;
      if (!s) return true;
      try {
        if (!s.isInitialized && typeof s.init === 'function') await s.init();
        if (typeof s.getMembersCached === 'function' && s.getMembersCached().length === 0) {
          await s.refreshMembers?.();
        }
        // templates / reminders solo per KPI
        await Promise.allSettled([ s.refreshTemplates?.(), s.refreshReminders?.() ]);
      } catch (_) {}
      console.log('✅ [Analytics] initialized');
      return true;
    },

    async mount(container) {
      const s = window.Storage_Instance;
      const members = (s?.getMembersCached?.() || []);
      const templatesObj = (s?.getTemplates?.() || {});
      const reminders = (s?.getRemindersCached?.() || []);

      // KPI
      const total = members.length;
      const expired  = members.filter(m => statusOf(m) === 'expired').length;
      const expiring = members.filter(m => statusOf(m) === 'expiring').length;
      const active   = members.filter(m => statusOf(m) === 'active').length;
      const templatesCount = Array.isArray(templatesObj)
        ? templatesObj.length
        : Object.keys(templatesObj).length;
      const remindersCount = reminders.length;

      // Top 10 in scadenza prossimi (solo visual)
      const soon = members
        .map(m => {
          const ex = parseDateMaybe(m?.scadenza || m?.expiryDate || m?.expiry || m?.nextRenewal);
          const dl = daysLeftFromToday(ex);
          return { id:m.id, name:(m.fullName||m.name||m.nome||''), phone:(m.whatsapp||m.phone||m.telefono||''), expiry:ex, daysLeft:dl, status:statusOf(m) };
        })
        .filter(x => x.daysLeft != null && x.daysLeft >= 0)
        .sort((a,b) => a.daysLeft - b.daysLeft)
        .slice(0, 10);

      container.innerHTML = `
        <section class="toolbar">
          <div class="small muted">KPI aggiornati dai dati in cache</div>
          <div class="right">
            <button id="dash-reload" class="btn secondary"><i class="fa-solid fa-rotate"></i> Ricarica</button>
          </div>
        </section>

        <section class="dash-grid">
          <div class="card kpi" data-go="tesserati">
            <div class="icon"><i class="fa-solid fa-users"></i></div>
            <div>
              <div class="small muted">Tesserati totali</div>
              <div class="big">${total}</div>
              <div class="small muted">Attivi ${active} • In scadenza ${expiring} • Scaduti ${expired}</div>
            </div>
          </div>

          <div class="card kpi" data-go="scadenze">
            <div class="icon"><i class="fa-regular fa-bell"></i></div>
            <div>
              <div class="small muted">Da contattare</div>
              <div class="big">${expiring + expired}</div>
              <div class="small muted">Apri elenco scadenze</div>
            </div>
          </div>

          <div class="card kpi" data-go="marketing">
            <div class="icon"><i class="fa-regular fa-message"></i></div>
            <div>
              <div class="small muted">Template disponibili</div>
              <div class="big">${templatesCount}</div>
              <div class="small muted">Gestisci i messaggi</div>
            </div>
          </div>

          <div class="card kpi" data-go="automazione">
            <div class="icon"><i class="fa-regular fa-clock"></i></div>
            <div>
              <div class="small muted">Reminder automatici</div>
              <div class="big">${remindersCount}</div>
              <div class="small muted">Configura invii</div>
            </div>
          </div>
        </section>

        <section class="card" style="margin-top:1rem">
          <div class="small muted" style="margin-bottom:.5rem">Prossime scadenze (10)</div>
          <table class="rt">
            <thead><tr><th>Nome</th><th>Telefono</th><th>Scadenza</th><th>Giorni</th><th>Stato</th></tr></thead>
            <tbody id="soon-rows">
              ${soon.length ? '' : `<tr><td colspan="5">Nessuna scadenza imminente.</td></tr>`}
            </tbody>
          </table>
        </section>
      `;

      // righe prossime scadenze
      const tbody = container.querySelector('#soon-rows');
      for (const r of soon) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r.name || ''}</td>
          <td>${r.phone || ''}</td>
          <td>${fmtISO(r.expiry)}</td>
          <td>${r.daysLeft ?? '—'}</td>
          <td>${badge(r.status)}</td>
        `;
        tbody.appendChild(tr);
      }

      // nav
      container.querySelectorAll('[data-go]').forEach(el => {
        el.addEventListener('click', () => {
          const p = el.getAttribute('data-go');
          window.App?.renderPage?.(p);
        });
      });

      // ricarica
      const btnReload = container.querySelector('#dash-reload');
      btnReload?.addEventListener('click', async () => {
        btnReload.disabled = true;
        try {
          await Promise.allSettled([
            s?.refreshMembers?.(),
            s?.refreshTemplates?.(),
            s?.refreshReminders?.()
          ]);
          window.App?._updateBadges?.();
          await this.mount(container); // rerender
        } finally {
          btnReload.disabled = false;
        }
      });
    }
  };

  window.AnalyticsModule = AnalyticsModule;
})();
