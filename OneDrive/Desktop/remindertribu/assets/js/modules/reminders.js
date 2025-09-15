// assets/js/modules/reminders.js
(function () {
  'use strict';

  // -------------------- UTILS --------------------
  const DAY = 24 * 60 * 60 * 1000;

  function ensureStylesOnce() {
    if (document.getElementById('reminders-inline-styles')) return;
    const css = `
      .rt-toolbar{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;margin:.75rem 0;}
      .rt-toolbar .right{margin-left:auto;display:flex;gap:.5rem;align-items:center}
      .rt-input,.rt-select,.rt-textarea{padding:.5rem .6rem;border-radius:.5rem;border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.15);color:#fff}
      .rt-textarea{min-height:120px;resize:vertical;width:100%}
      .rt-btn{padding:.45rem .7rem;border-radius:.6rem;border:0;background:#2f7ddc;color:#fff;cursor:pointer}
      .rt-btn.secondary{background:#3c4658}
      .rt-btn.danger{background:#c23b3b}
      .rt-switch{appearance:none;width:42px;height:24px;background:#6b7280;border-radius:999px;position:relative;cursor:pointer;outline:none;border:0}
      .rt-switch:checked{background:#22c55e}
      .rt-switch:before{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;border-radius:999px;transition:all .2s}
      .rt-switch:checked:before{left:21px}
      .card{background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px}
      .page-grid{display:grid;gap:.9rem;grid-template-columns: 1fr}
      .rt-table{width:100%;border-collapse:separate;border-spacing:0;margin-top:.25rem}
      .rt-table th,.rt-table td{padding:.55rem .65rem;border-bottom:1px solid rgba(255,255,255,.08)}
      .muted{opacity:.75}
      .small{font-size:.9rem}
      .chip{display:inline-block;padding:.2rem .45rem;border-radius:999px;font-size:.8rem}
      .chip.ok{background:#1f8a46;color:#fff}
      .chip.warn{background:#a97a1f;color:#fff}
      .chip.err{background:#b43333;color:#fff}
      .grid{display:grid;gap:.7rem}
      .grid.cols-2{grid-template-columns:1fr 1fr}
      @media (max-width: 980px){ .grid.cols-2{grid-template-columns:1fr} }
      .pill{padding:.25rem .5rem;border-radius:999px;background:#374151;font-size:.8rem}
    `;
    const el = document.createElement('style');
    el.id = 'reminders-inline-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function parseDateMaybe(v) {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (v && typeof v === 'object' && typeof v.toDate === 'function') {
      try { return v.toDate(); } catch {}
    }
    const s = String(v).trim();
    const iso = new Date(s);
    if (!Number.isNaNaN?.(iso.getTime()) ? Number.isNaN(iso.getTime()) : isNaN(iso.getTime())) return null;
    return iso;
  }
  function daysLeftFromToday(d) {
    if (!d) return null;
    const today = new Date();
    const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.floor((b - a) / DAY);
  }
  function formatISO(d) {
    if (!d) return '';
    const z = new Date(d);
    const yyyy = z.getFullYear();
    const mm = String(z.getMonth() + 1).padStart(2, '0');
    const dd = String(z.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function pickName(m)  { return m?.fullName || m?.name || m?.nome || ''; }
  function pickPhone(m) { return m?.whatsapp || m?.phone || m?.telefono || ''; }
  function pickExpiry(m){ return m?.scadenza || m?.expiryDate || m?.expiry || m?.nextRenewal || null; }

  function compileTemplate(tplText, member) {
    const nome = (pickName(member) || '').split(' ')[0] || '';
    const expiry = parseDateMaybe(pickExpiry(member));
    const giorni = daysLeftFromToday(expiry);
    const scadenza = expiry ? formatISO(expiry) : '';
    return (tplText || '')
      .replaceAll('{nome}', nome)
      .replaceAll('{giorni}', (giorni ?? ''))
      .replaceAll('{scadenza}', scadenza);
  }

  function sendWhatsApp(phone, message) {
    if (window.WhatsAppModule?.sendText) {
      return window.WhatsAppModule.sendText(phone, message);
    }
    if (window.TribuApp?.sendWhatsAppMessage) {
      return window.TribuApp.sendWhatsAppMessage(phone, message);
    }
    alert('Modulo WhatsApp non disponibile.');
    return Promise.resolve(false);
  }

  // -------------------- STORAGE wrappers --------------------
  async function listReminders(s) {
    if (typeof s.getReminders === 'function') return s.getReminders() || [];
    if (typeof s.getRemindersCached === 'function') return s.getRemindersCached() || [];
    if (s.firebase?.db) {
      const qs = await s.firebase.db.collection('reminders').get();
      return qs.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return [];
  }
  async function saveReminder(s, r) {
    if (typeof s.saveReminder === 'function') return s.saveReminder(r);
    if (typeof s.updateReminder === 'function') return s.updateReminder(r.id, r);
    if (s.firebase?.db) {
      const id = r.id || (r.name || 'reminder').toLowerCase().replace(/\s+/g,'-');
      return s.firebase.db.collection('reminders').doc(id).set({ ...r, id }, { merge: true });
    }
    throw new Error('API salvataggio reminder non disponibile');
  }
  async function deleteReminder(s, id) {
    if (typeof s.deleteReminder === 'function') return s.deleteReminder(id);
    if (s.firebase?.db) return s.firebase.db.collection('reminders').doc(id).delete();
    throw new Error('API eliminazione reminder non disponibile');
  }

  // -------------------- PREVIEW / RUN --------------------
  function buildCandidates(members, rule) {
    // rule: { target: 'expired'|'expiring'|'all', daysAhead:number }
    const now = new Date();
    const scope = rule?.target || 'expired';
    const daysAhead = Number(rule?.daysAhead ?? 7);

    return members.filter(m => {
      const expiry = parseDateMaybe(pickExpiry(m));
      const dl = daysLeftFromToday(expiry);
      if (dl == null) return false;
      if (scope === 'expired')  return dl < 0;
      if (scope === 'expiring') return dl >= 0 && dl <= daysAhead;
      return true; // all
    });
  }

  async function previewRun(reminder, members, templateText) {
    const cands = buildCandidates(members, reminder.rule || { target: 'expired', daysAhead: 7 });
    return cands.map(m => ({
      id: m.id,
      phone: pickPhone(m),
      daysLeft: daysLeftFromToday(parseDateMaybe(pickExpiry(m))),
      message: compileTemplate(templateText, m)
    }));
  }

  async function sendNow(reminder, members, templateText) {
    const batch = await previewRun(reminder, members, templateText);
    let ok = 0, fail = 0;
    for (const x of batch) {
      if (!x.phone) { fail++; continue; }
      try {
        await sendWhatsApp(x.phone, x.message);
        ok++;
      } catch (e) {
        console.error('send error', e);
        fail++;
      }
      await new Promise(r => setTimeout(r, 120));
    }
    return { total: batch.length, ok, fail };
  }

  // -------------------- UI --------------------
  function statCard(icon, label, value) {
    return `
      <div class="card" style="display:flex;align-items:center;gap:.75rem">
        <div class="pill"><i class="${icon}"></i></div>
        <div>
          <div class="small muted">${label}</div>
          <div style="font-size:1.35rem;font-weight:700">${value}</div>
        </div>
      </div>
    `;
  }

  function renderList(container, state, actions) {
    const { reminders, templates } = state;
    const stats = {
      active: reminders.filter(r => !!r.active).length,
      sent: reminders.reduce((a, r) => a + (Number(r.stats?.sent || 0)), 0),
      next: reminders.filter(r => !!r.active).length // placeholder count
    };

    container.innerHTML = `
      <section class="page-grid">
        <div class="grid cols-2">
          ${statCard('fa-regular fa-clock', 'Reminder Attivi', stats.active)}
          ${statCard('fa-regular fa-paper-plane', 'Messaggi inviati', stats.sent)}
        </div>

        <div class="rt-toolbar">
          <button id="btn-new" class="rt-btn"><i class="fa-solid fa-plus"></i> Nuovo Reminder</button>
          <div class="right">
            <button id="btn-reload" class="rt-btn secondary"><i class="fa-solid fa-rotate"></i> Ricarica</button>
          </div>
        </div>

        <div class="card">
          <table class="rt-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Template</th>
                <th>Target</th>
                <th>Orario</th>
                <th>Attivo</th>
                <th style="text-align:right">Azioni</th>
              </tr>
            </thead>
            <tbody id="r-rows">
              ${reminders.length ? '' : `<tr><td colspan="6">Nessun reminder. Crea il primo.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;

    const rows = container.querySelector('#r-rows');
    for (const r of reminders) {
      const tpl = templates.find(t => t.id === r.templateId);
      const targetStr = r.rule?.target === 'expiring'
        ? `In scadenza ≤${r.rule?.daysAhead ?? 7}gg`
        : (r.rule?.target === 'all' ? 'Tutti' : 'Scaduti');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.name || r.id}</td>
        <td>${tpl ? (tpl.name || tpl.id) : '—'}</td>
        <td>${targetStr}</td>
        <td>${r.time || '09:00'} <span class="muted small">${r.tz || 'Europe/Rome'}</span></td>
        <td><input type="checkbox" class="rt-switch" data-act="toggle" data-id="${r.id}" ${r.active ? 'checked' : ''}></td>
        <td style="text-align:right">
          <button class="rt-btn secondary" data-act="preview" data-id="${r.id}"><i class="fa-regular fa-eye"></i> Preview</button>
          <button class="rt-btn" data-act="run" data-id="${r.id}"><i class="fa-regular fa-paper-plane"></i> Invia ora</button>
          <button class="rt-btn secondary" data-act="edit" data-id="${r.id}"><i class="fa-regular fa-pen-to-square"></i></button>
          <button class="rt-btn danger" data-act="del" data-id="${r.id}"><i class="fa-regular fa-trash-can"></i></button>
        </td>
      `;
      rows.appendChild(tr);
    }

    container.querySelector('#btn-new').onclick = actions.newReminder;
    container.querySelector('#btn-reload').onclick = actions.reload;

    rows?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      if (btn.dataset.act === 'edit')    actions.edit(id);
      if (btn.dataset.act === 'del')     actions.remove(id);
      if (btn.dataset.act === 'preview') actions.preview(id);
      if (btn.dataset.act === 'run')     actions.runNow(id);
    });

    rows?.addEventListener('change', async (e) => {
      const sw = e.target.closest('input[data-act="toggle"]');
      if (!sw) return;
      const id = sw.getAttribute('data-id');
      actions.toggle(id, sw.checked);
    });
  }

  function renderEditor(container, state, actions) {
    const r = state.editing;
    const tpls = state.templates;

    container.innerHTML = `
      <section class="page-grid">
        <div class="card">
          <div class="rt-toolbar">
            <div class="small muted">${r.id ? `ID: ${r.id}` : 'Nuovo reminder'}</div>
            <div class="right">
              <button id="btn-cancel" class="rt-btn secondary">Annulla</button>
              <button id="btn-save" class="rt-btn"><i class="fa-regular fa-floppy-disk"></i> Salva</button>
            </div>
          </div>

          <div class="grid cols-2">
            <div>
              <label class="small muted">Nome</label>
              <input id="f-name" class="rt-input" value="${r.name || ''}" placeholder="Es. Promemoria rinnovo">
            </div>
            <div>
              <label class="small muted">Template</label>
              <select id="f-template" class="rt-select">
                <option value="">— scegli —</option>
                ${tpls.map(t => `<option value="${t.id}" ${r.templateId===t.id?'selected':''}>${t.name || t.id}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="small muted">Target</label>
              <select id="f-target" class="rt-select">
                <option value="expired" ${(!r.rule || r.rule.target==='expired')?'selected':''}>Scaduti</option>
                <option value="expiring" ${(r.rule?.target==='expiring')?'selected':''}>In scadenza</option>
                <option value="all" ${(r.rule?.target==='all')?'selected':''}>Tutti</option>
              </select>
            </div>
            <div>
              <label class="small muted">Giorni (solo per "In scadenza")</label>
              <input id="f-daysAhead" type="number" min="1" max="60" class="rt-input" value="${Number(r.rule?.daysAhead ?? 7)}">
            </div>

            <div>
              <label class="small muted">Orario</label>
              <input id="f-time" type="time" class="rt-input" value="${r.time || '09:00'}">
            </div>
            <div>
              <label class="small muted">Timezone</label>
              <input id="f-tz" class="rt-input" value="${r.tz || 'Europe/Rome'}">
            </div>

            <div>
              <label class="small muted">Cooldown giorni (evita doppioni ravvicinati)</label>
              <input id="f-cooldown" type="number" min="0" max="60" class="rt-input" value="${Number(r.cooldownDays ?? 7)}">
            </div>
            <div>
              <label class="small muted">Attivo</label><br>
              <input id="f-active" type="checkbox" class="rt-switch" ${r.active ? 'checked' : ''}>
            </div>
          </div>

          <div class="rt-toolbar">
            <div class="small muted">Suggerimento: usa variabili nel template {nome}, {giorni}, {scadenza}</div>
            <div class="right">
              <button id="btn-preview" class="rt-btn secondary"><i class="fa-regular fa-eye"></i> Preview</button>
            </div>
          </div>

          <div id="preview-box" class="card" style="display:none"></div>
        </div>
      </section>
    `;

    container.querySelector('#btn-cancel').onclick = actions.cancel;
    container.querySelector('#btn-save').onclick = async () => {
      const payload = {
        id: r.id || (container.querySelector('#f-name').value || 'reminder').toLowerCase().replace(/\s+/g,'-'),
        name: container.querySelector('#f-name').value.trim(),
        templateId: container.querySelector('#f-template').value,
        rule: {
          target: container.querySelector('#f-target').value,
          daysAhead: Number(container.querySelector('#f-daysAhead').value || 7)
        },
        time: container.querySelector('#f-time').value || '09:00',
        tz: container.querySelector('#f-tz').value || 'Europe/Rome',
        cooldownDays: Number(container.querySelector('#f-cooldown').value || 7),
        active: container.querySelector('#f-active').checked,
        updatedAt: Date.now()
      };
      if (!payload.templateId) return alert('Seleziona un template.');
      if (!payload.name) return alert('Inserisci il nome.');
      await actions.save(payload);
    };

    container.querySelector('#btn-preview').onclick = actions.previewEditing;
  }

  // -------------------- MODULE --------------------
  const RemindersModule = {
    _reminders: [],
    _templates: [],
    _members: [],
    _editing: null,

    async init() {
      console.log('⏱️ [Automazione] init…');
      ensureStylesOnce();

      const s = window.Storage_Instance;
      if (!s) return;

      if (!s.isInitialized) try { await s.init(); } catch {}

      try { await s.refreshMembers?.(); } catch {}
      try { await s.refreshTemplates?.(); } catch {}
      try { await s.refreshReminders?.(); } catch {}

      this._members   = s.getMembersCached?.() || [];
      this._templates = (s.getTemplates?.() || []).map(x => ({ id: x.id || x.key, ...x }));
      this._reminders = await listReminders(s);

      return true;
    },

    async mount(container) {
      const s = window.Storage_Instance;
      if (!s) {
        container.innerHTML = `<section class="empty-state"><h2>Storage non disponibile</h2></section>`;
        return;
      }

      // refresh dati rapidi
      this._members   = s.getMembersCached?.() || this._members;
      this._templates = (s.getTemplates?.() || this._templates).map(x => ({ id: x.id || x.key, ...x }));
      this._reminders = await listReminders(s);

      if (this._editing) {
        renderEditor(container, { editing: this._editing, templates: this._templates }, {
          cancel: () => { this._editing = null; this.mount(container); },
          save: async (payload) => {
            try {
              await saveReminder(s, payload);
              await s.refreshReminders?.();
              this._reminders = await listReminders(s);
              this._editing = null;
              window.App?._updateBadges?.();
              this.mount(container);
            } catch (e) {
              console.error('saveReminder error', e);
              alert('Errore salvataggio reminder.');
            }
          },
          previewEditing: async () => {
            const editor = container;
            const tplId = editor.querySelector('#f-template').value;
            const tpl = this._templates.find(t => t.id === tplId);
            if (!tpl) return alert('Seleziona un template.');
            const rule = {
              target: editor.querySelector('#f-target').value,
              daysAhead: Number(editor.querySelector('#f-daysAhead').value || 7)
            };
            const r = { rule };
            const cands = await previewRun(r, this._members, tpl.text);
            const box = editor.querySelector('#preview-box');
            box.style.display = 'block';
            box.innerHTML = `
              <div class="small muted">Anteprima (dry-run): ${cands.length} destinatari</div>
              <ul class="small" style="margin:.5rem 0 0 1rem;max-height:260px;overflow:auto">
                ${cands.slice(0,20).map(x => `<li>${x.phone || '—'} — <span class="muted">${(x.message||'').slice(0,90)}${(x.message||'').length>90?'…':''}</span></li>`).join('')}
              </ul>
              ${cands.length>20?`<div class="muted small">+ ${cands.length-20} altri…</div>`:''}
            `;
          }
        });
        return;
      }

      renderList(container, { reminders: this._reminders, templates: this._templates }, {
        newReminder: () => {
          this._editing = {
            id: '',
            name: '',
            templateId: '',
            rule: { target: 'expired', daysAhead: 7 },
            time: '09:00',
            tz: 'Europe/Rome',
            cooldownDays: 7,
            active: true
          };
          this.mount(container);
        },
        reload: async () => {
          try { await s.refreshReminders?.(); } catch {}
          this._reminders = await listReminders(s);
          this.mount(container);
        },
        edit: (id) => {
          const r = this._reminders.find(x => x.id === id);
          this._editing = r ? { ...r } : null;
          this.mount(container);
        },
        remove: async (id) => {
          if (!confirm('Eliminare questo reminder?')) return;
          try {
            await deleteReminder(s, id);
            await s.refreshReminders?.();
            this._reminders = await listReminders(s);
            window.App?._updateBadges?.();
            this.mount(container);
          } catch (e) {
            console.error('deleteReminder error', e);
            alert('Errore eliminazione reminder.');
          }
        },
        toggle: async (id, active) => {
          const r = this._reminders.find(x => x.id === id);
          if (!r) return;
          try {
            await saveReminder(s, { ...r, active, updatedAt: Date.now() });
            await s.refreshReminders?.();
            this._reminders = await listReminders(s);
          } catch (e) {
            console.error('toggle error', e);
            alert('Errore aggiornamento stato.');
          }
        },
        preview: async (id) => {
          const r = this._reminders.find(x => x.id === id);
          if (!r) return;
          const tpl = this._templates.find(t => t.id === r.templateId);
          if (!tpl) return alert('Template non trovato.');
          const cands = await previewRun(r, this._members, tpl.text);
          (window.Toast?.show || alert)(`Preview: ${cands.length} destinatari`);
          console.log('Preview', { id, candidates: cands });
        },
        runNow: async (id) => {
          const r = this._reminders.find(x => x.id === id);
          if (!r) return;
          const tpl = this._templates.find(t => t.id === r.templateId);
          if (!tpl) return alert('Template non trovato.');
          if (!confirm('Inviare ora i messaggi ai destinatari trovati?')) return;
          const res = await sendNow(r, this._members, tpl.text);
          (window.Toast?.show || alert)(`Inviati: ${res.ok}/${res.total} (KO: ${res.fail})`);
          // aggiorna contatore locale
          try {
            await saveReminder(s, { ...r, stats: { ...(r.stats||{}), sent: Number(r.stats?.sent||0) + res.ok }, lastRunAt: Date.now() });
            await s.refreshReminders?.();
            this._reminders = await listReminders(s);
            this.mount(container);
          } catch (e) {
            console.warn('aggiornamento stats fallito', e);
          }
        }
      });
    }
  };

  window.RemindersModule = RemindersModule;
})();
