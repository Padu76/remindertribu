// assets/js/modules/marketing.js
(function () {
  'use strict';

  // ------------------ Utils comuni ------------------
  const DAY = 24 * 60 * 60 * 1000;

  function ensureStylesOnce() {
    if (document.getElementById('marketing-inline-styles')) return;
    const css = `
      .rt-tabs{display:flex;gap:.5rem;border-bottom:1px solid rgba(255,255,255,.1);margin:.5rem 0 1rem}
      .rt-tab{padding:.5rem .8rem;border-radius:.6rem .6rem 0 0;background:transparent;color:#fff;cursor:pointer}
      .rt-tab.active{background:rgba(0,0,0,.18)}
      .rt-toolbar{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;margin:.75rem 0;}
      .rt-toolbar .right{margin-left:auto;display:flex;gap:.5rem;align-items:center}
      .rt-input,.rt-select,.rt-textarea{padding:.5rem .6rem;border-radius:.5rem;border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.15);color:#fff;width:100%}
      .rt-textarea{min-height:120px;resize:vertical}
      .rt-btn{padding:.45rem .7rem;border-radius:.6rem;border:0;background:#2f7ddc;color:#fff;cursor:pointer}
      .rt-btn.secondary{background:#3c4658}
      .rt-btn.danger{background:#c23b3b}
      .grid{display:grid;gap:.75rem}
      .grid.cols-2{grid-template-columns: 1fr 1fr}
      .card{background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px}
      .rt-table{width:100%;border-collapse:separate;border-spacing:0;margin-top:.25rem}
      .rt-table th,.rt-table td{padding:.55rem .65rem;border-bottom:1px solid rgba(255,255,255,.08)}
      .rt-chip{display:inline-block;padding:.2rem .45rem;border-radius:999px;font-size:.8rem}
      .rt-chip.gray{background:#5a6473}
      .muted{opacity:.75}
      .small{font-size:.9rem}
      .mono{font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;}
      @media (max-width: 920px){ .grid.cols-2{grid-template-columns: 1fr} }
    `;
    const el = document.createElement('style');
    el.id = 'marketing-inline-styles';
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
    if (!Number.isNaN(iso.getTime())) return iso;
    const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (m) {
      const d = Number(m[1]), mo = Number(m[2]) - 1, y = Number(m[3]);
      const dt = new Date(Date.UTC(y, mo, d, 12, 0, 0));
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
    return null;
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

  function pickPhone(m) { return m?.whatsapp || m?.phone || m?.telefono || ''; }
  function pickName(m)  { return m?.fullName || m?.name || m?.nome || ''; }
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

  // ------------------ Storage helpers (robusti) ------------------
  function normalizeTemplates(tpls) {
    // accetta sia array che oggetto
    if (!tpls) return [];
    if (Array.isArray(tpls)) {
      return tpls.map(x => ({ id: x.id || x.key || x.name, ...x })).filter(Boolean);
    }
    return Object.entries(tpls).map(([id, v]) => ({ id, ...(v || {}) }));
  }

  async function upsertTemplate(storage, tpl) {
    // preferenze: saveTemplate -> updateTemplate -> set on firestore
    if (typeof storage.saveTemplate === 'function') return storage.saveTemplate(tpl);
    if (typeof storage.updateTemplate === 'function') return storage.updateTemplate(tpl.id || tpl.key, tpl);
    if (storage.firebase?.db) {
      const id = tpl.id || tpl.key || (tpl.name || 'tpl').toLowerCase().replace(/\s+/g,'-');
      return storage.firebase.db.collection('templates').doc(id).set(tpl, { merge: true });
    }
    throw new Error('API salvataggio template non disponibile');
  }

  async function deleteTemplate(storage, id) {
    if (typeof storage.deleteTemplate === 'function') return storage.deleteTemplate(id);
    if (storage.firebase?.db) return storage.firebase.db.collection('templates').doc(id).delete();
    throw new Error('API eliminazione template non disponibile');
  }

  // ------------------ UI render ------------------
  function renderTabs(container, active) {
    container.innerHTML = `
      <div class="rt-tabs">
        <button class="rt-tab ${active==='templates'?'active':''}" data-tab="templates">
          <i class="fa-regular fa-pen-to-square"></i> Template
        </button>
        <button class="rt-tab ${active==='send'?'active':''}" data-tab="send">
          <i class="fa-regular fa-paper-plane"></i> Invii
        </button>
      </div>
      <div id="mkt-tab-content"></div>
    `;
  }

  function renderTemplatesView(rootEl, state, actions) {
    const { templates, editing } = state;

    const options = [
      { id: 'motivazionale', label: 'Motivazionale' },
      { id: 'upsell',        label: 'Upsell / PastoSano' },
      { id: 'promemoria',    label: 'Promemoria rinnovo' }
    ];

    const listHTML = templates.length
      ? templates.map(t => `
          <tr data-id="${t.id}">
            <td><span class="rt-chip gray">${t.category || '—'}</span></td>
            <td>${t.name || t.id}</td>
            <td class="muted small mono">${(t.updatedAt && new Date(t.updatedAt).toLocaleString()) || '—'}</td>
            <td style="text-align:right">
              <button class="rt-btn secondary" data-act="edit" data-id="${t.id}"><i class="fa-regular fa-pen-to-square"></i></button>
              <button class="rt-btn danger" data-act="del" data-id="${t.id}"><i class="fa-regular fa-trash-can"></i></button>
            </td>
          </tr>
        `).join('')
      : `<tr><td colspan="4">Nessun template. Creane uno qui a destra.</td></tr>`;

    rootEl.innerHTML = `
      <div class="grid cols-2">
        <div class="card">
          <div class="rt-toolbar">
            <div class="small muted">Totale: ${templates.length}</div>
            <div class="right">
              <button id="tpl-reload" class="rt-btn secondary"><i class="fa-solid fa-rotate"></i> Ricarica</button>
              <button id="tpl-new" class="rt-btn"><i class="fa-solid fa-plus"></i> Nuovo</button>
            </div>
          </div>
          <table class="rt-table">
            <thead><tr><th>Categoria</th><th>Nome</th><th>Aggiornato</th><th></th></tr></thead>
            <tbody id="tpl-rows">${listHTML}</tbody>
          </table>
        </div>

        <div class="card" id="tpl-editor">
          ${editing ? '' : '<div class="muted">Seleziona un template o clicca "Nuovo".</div>'}
        </div>
      </div>
    `;

    // Editor (se in editing)
    if (editing) {
      const e = editing;
      const editor = rootEl.querySelector('#tpl-editor');
      editor.innerHTML = `
        <div class="grid" style="gap:.6rem">
          <div>
            <label class="small muted">Nome</label>
            <input id="f-name" class="rt-input" value="${e.name || ''}">
          </div>
          <div>
            <label class="small muted">Categoria</label>
            <select id="f-cat" class="rt-select">
              ${options.map(o => `<option value="${o.id}" ${e.category===o.id?'selected':''}>${o.label}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="small muted">Testo (variabili: {nome}, {giorni}, {scadenza})</label>
            <textarea id="f-text" class="rt-textarea" placeholder="Scrivi il messaggio...">${e.text || ''}</textarea>
          </div>
          <div class="rt-toolbar">
            <div class="muted small">ID: <span class="mono">${e.id || '—'}</span></div>
            <div class="right">
              <button id="f-cancel" class="rt-btn secondary">Annulla</button>
              <button id="f-save" class="rt-btn"><i class="fa-regular fa-floppy-disk"></i> Salva</button>
            </div>
          </div>
        </div>
      `;

      editor.querySelector('#f-cancel').onclick = actions.cancelEdit;
      editor.querySelector('#f-save').onclick = async () => {
        const payload = {
          id: e.id || (editor.querySelector('#f-name').value || '').toLowerCase().replace(/\s+/g,'-'),
          name: editor.querySelector('#f-name').value.trim(),
          category: editor.querySelector('#f-cat').value,
          text: editor.querySelector('#f-text').value,
          updatedAt: Date.now()
        };
        await actions.saveTemplate(payload);
      };
    }

    // Listeners lista
    rootEl.querySelector('#tpl-new').onclick = actions.newTemplate;
    rootEl.querySelector('#tpl-reload').onclick = actions.reloadTemplates;

    rootEl.querySelector('#tpl-rows')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      const tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      const id = tr.getAttribute('data-id');
      if (btn?.dataset.act === 'edit') actions.editTemplate(id);
      if (btn?.dataset.act === 'del')  actions.deleteTemplate(id);
    });
  }

  function renderSendView(rootEl, state, actions) {
    const { members, templates, filter, q, selectedIds, tplId, previewText, testPhone } = state;

    const list = members
      .filter(m => {
        if (filter === 'active')   return m.status === 'active';
        if (filter === 'expiring') return m.status === 'expiring';
        if (filter === 'expired')  return m.status === 'expired';
        return true;
      })
      .filter(m => {
        if (!q) return true;
        const qq = q.toLowerCase();
        return (m.name||'').toLowerCase().includes(qq) || (m.phone||'').toLowerCase().includes(qq);
      });

    rootEl.innerHTML = `
      <div class="grid cols-2">
        <div class="card">
          <div class="rt-toolbar">
            <select id="s-filter" class="rt-select" style="min-width:160px">
              <option value="all"${filter==='all'?' selected':''}>Tutti</option>
              <option value="active"${filter==='active'?' selected':''}>Attivi</option>
              <option value="expiring"${filter==='expiring'?' selected':''}>In scadenza ≤30gg</option>
              <option value="expired"${filter==='expired'?' selected':''}>Scaduti</option>
            </select>
            <div class="right">
              <input id="s-search" class="rt-input" placeholder="Cerca per nome o telefono…" value="${q || ''}">
              <button id="s-select-all" class="rt-btn secondary">Seleziona tutti</button>
              <button id="s-clear" class="rt-btn secondary">Pulisci</button>
            </div>
          </div>

          <table class="rt-table">
            <thead><tr><th style="width:28px"></th><th>Nome</th><th>Telefono</th><th>Scadenza</th><th>Giorni</th></tr></thead>
            <tbody id="s-rows">
              ${
                list.length ? '' : `<tr><td colspan="5">Nessun contatto trovato.</td></tr>`
              }
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="grid">
            <div>
              <label class="small muted">Template</label>
              <select id="t-select" class="rt-select">
                <option value="">— scegli —</option>
                ${templates.map(t => `<option value="${t.id}" ${tplId===t.id?'selected':''}>${t.name || t.id}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="small muted">Anteprima</label>
              <textarea id="t-preview" class="rt-textarea" placeholder="Seleziona un template e un contatto per vedere l’anteprima…">${previewText || ''}</textarea>
            </div>
            <div class="rt-toolbar">
              <input id="test-phone" class="rt-input" placeholder="Numero test (es. +39347...)" value="${testPhone || ''}" style="max-width:240px">
              <div class="right">
                <button id="btn-send-test" class="rt-btn secondary"><i class="fa-regular fa-paper-plane"></i> Invia test</button>
                <button id="btn-send" class="rt-btn"><i class="fa-regular fa-paper-plane"></i> Invia ai selezionati</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Popola righe contatti
    const tbody = rootEl.querySelector('#s-rows');
    for (const m of list) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" data-id="${m.id}" ${selectedIds.has(m.id)?'checked':''}></td>
        <td>${m.name || ''}</td>
        <td>${m.phone || ''}</td>
        <td>${m.expiry ? formatISO(m.expiry) : '—'}</td>
        <td>${m.daysLeft ?? '—'}</td>
      `;
      tbody.appendChild(tr);
    }

    // Listeners
    const $filter = rootEl.querySelector('#s-filter');
    const $search = rootEl.querySelector('#s-search');
    const $selAll = rootEl.querySelector('#s-select-all');
    const $clear  = rootEl.querySelector('#s-clear');
    const $tplSel = rootEl.querySelector('#t-select');
    const $prev   = rootEl.querySelector('#t-preview');
    const $test   = rootEl.querySelector('#test-phone');
    const $send   = rootEl.querySelector('#btn-send');
    const $sendT  = rootEl.querySelector('#btn-send-test');

    $filter.onchange = () => actions.updateFilter($filter.value);
    let t; $search.oninput = () => { clearTimeout(t); t=setTimeout(()=>actions.updateQuery($search.value),150); };
    $selAll.onclick = () => actions.selectAll(list.map(x=>x.id));
    $clear.onclick  = () => actions.clearSelection();

    tbody.addEventListener('change', (e) => {
      const cb = e.target.closest('input[type="checkbox"][data-id]');
      if (!cb) return;
      actions.toggleSelection(cb.getAttribute('data-id'), cb.checked);
    });

    $tplSel.onchange = () => actions.chooseTemplate($tplSel.value);
    $prev.oninput    = () => actions.updatePreview($prev.value);
    $test.oninput    = () => actions.updateTestPhone($test.value);

    $send.onclick  = () => actions.sendToSelected();
    $sendT.onclick = () => actions.sendTest();
  }

  // ------------------ Modulo ------------------
  const MarketingModule = {
    _tab: 'templates',
    _templates: [],
    _editing: null,

    _members: [],
    _vmMembers: [],
    _filter: 'all',
    _q: '',
    _selected: new Set(),
    _tplId: '',
    _previewText: '',
    _testPhone: '',

    async init() {
      console.log('📣 [Marketing] init');
      ensureStylesOnce();

      const s = window.Storage_Instance;
      if (!s) return;

      if (!s.isInitialized) try { await s.init(); } catch {}
      // Carica dati base
      try { await s.refreshMembers?.(); } catch {}
      try { await s.refreshTemplates?.(); } catch {}

      this._members = (s.getMembersCached?.() || []).map(m => {
        const expiry = parseDateMaybe(pickExpiry(m));
        return {
          id: m.id,
          name: pickName(m),
          phone: pickPhone(m),
          expiry,
          daysLeft: daysLeftFromToday(expiry),
          status: (() => {
            const dl = daysLeftFromToday(expiry);
            if (dl == null) return 'unknown';
            if (dl < 0) return 'expired';
            if (dl <= 30) return 'expiring';
            return 'active';
          })(),
          raw: m
        };
      });

      this._templates = normalizeTemplates(s.getTemplates?.() || []);
      return true;
    },

    async mount(container) {
      const s = window.Storage_Instance;
      if (!s) {
        container.innerHTML = `<section class="empty-state"><h2>Storage non disponibile</h2></section>`;
        return;
      }

      // sync sempre fresco
      this._members   = (s.getMembersCached?.() || []).map(m => {
        const expiry = parseDateMaybe(pickExpiry(m));
        return {
          id: m.id,
          name: pickName(m),
          phone: pickPhone(m),
          expiry,
          daysLeft: daysLeftFromToday(expiry),
          status: (() => {
            const dl = daysLeftFromToday(expiry);
            if (dl == null) return 'unknown';
            if (dl < 0) return 'expired';
            if (dl <= 30) return 'expiring';
            return 'active';
          })(),
          raw: m
        };
      });
      this._templates = normalizeTemplates(s.getTemplates?.() || []);

      renderTabs(container, this._tab);
      const content = container.querySelector('#mkt-tab-content');

      const actionsCommon = {
        switchTab: (tab) => { this._tab = tab; this.mount(container); }
      };

      // --- TEMPLATES ---
      if (this._tab === 'templates') {
        const actionsTpl = {
          ...actionsCommon,
          newTemplate: () => { this._editing = { id:'', name:'', category:'motivazionale', text:'' }; this.mount(container); },
          cancelEdit: () => { this._editing = null; this.mount(container); },
          editTemplate: (id) => {
            const t = this._templates.find(x => x.id === id);
            this._editing = t ? { ...t } : null;
            this.mount(container);
          },
          deleteTemplate: async (id) => {
            if (!confirm('Eliminare questo template?')) return;
            try {
              await deleteTemplate(s, id);
              await s.refreshTemplates?.();
              this._templates = normalizeTemplates(s.getTemplates?.() || []);
              window.App?._updateBadges?.();
              this._editing = null;
              this.mount(container);
            } catch (e) {
              console.error('deleteTemplate error', e);
              alert('Errore eliminazione template.');
            }
          },
          saveTemplate: async (tpl) => {
            try {
              await upsertTemplate(s, tpl);
              await s.refreshTemplates?.();
              this._templates = normalizeTemplates(s.getTemplates?.() || []);
              window.App?._updateBadges?.();
              this._editing = null;
              this.mount(container);
            } catch (e) {
              console.error('saveTemplate error', e);
              alert('Errore salvataggio template.');
            }
          },
          reloadTemplates: async () => {
            try { await s.refreshTemplates?.(); } catch {}
            this._templates = normalizeTemplates(s.getTemplates?.() || []);
            window.App?._updateBadges?.();
            this.mount(container);
          }
        };

        renderTemplatesView(content, { templates: this._templates, editing: this._editing }, actionsTpl);

        // top tabs click
        container.querySelectorAll('.rt-tab').forEach(b => {
          b.onclick = () => actionsTpl.switchTab(b.dataset.tab);
        });
        return;
      }

      // --- SEND ---
      const actionsSend = {
        ...actionsCommon,
        updateFilter: (v) => { this._filter = v; this.mount(container); },
        updateQuery:  (v) => { this._q = v;      this.mount(container); },
        selectAll: (ids) => { ids.forEach(id => this._selected.add(id)); this.mount(container); },
        clearSelection: () => { this._selected.clear(); this.mount(container); },
        toggleSelection: (id, checked) => {
          if (checked) this._selected.add(id); else this._selected.delete(id);
        },
        chooseTemplate: (id) => {
          this._tplId = id;
          // genera anteprima sul primo selezionato (se c'è), altrimenti primo in lista filtrata
          const tpl = this._templates.find(t => t.id === id);
          const base = this._members[0];
          this._previewText = tpl && base ? compileTemplate(tpl.text, base.raw) : (tpl?.text || '');
          this.mount(container);
        },
        updatePreview: (txt) => { this._previewText = txt; },
        updateTestPhone: (v) => { this._testPhone = v; },
        sendTest: async () => {
          if (!this._previewText?.trim()) return alert('Anteprima vuota.');
          if (!this._testPhone?.trim())  return alert('Inserisci un numero di test.');
          try {
            await sendWhatsApp(this._testPhone.trim(), this._previewText.trim());
            (window.Toast?.show || alert)('Messaggio di test inviato.');
          } catch (e) {
            console.error('sendTest error', e);
            alert('Errore invio test.');
          }
        },
        sendToSelected: async () => {
          if (!this._tplId) return alert('Seleziona un template.');
          const tpl = this._templates.find(t => t.id === this._tplId);
          if (!tpl) return alert('Template non valido.');
          const ids = Array.from(this._selected);
          if (!ids.length) return alert('Seleziona almeno un contatto.');
          const map = new Map(this._members.map(x => [x.id, x.raw]));
          let ok = 0, fail = 0;
          for (const id of ids) {
            const m = map.get(id);
            if (!m) { fail++; continue; }
            const phone = pickPhone(m);
            if (!phone) { fail++; continue; }
            const msg = compileTemplate(tpl.text, m);
            try { await sendWhatsApp(phone, msg); ok++; }
            catch(e){ console.error('send error', e); fail++; }
            // piccola pausa per non aprire troppe finestre wa.me insieme
            await new Promise(r => setTimeout(r, 120));
          }
          (window.Toast?.show || alert)(`Invio completato. OK: ${ok}, KO: ${fail}`);
        }
      };

      renderSendView(content, {
        members: this._members,
        templates: this._templates,
        filter: this._filter,
        q: this._q,
        selectedIds: this._selected,
        tplId: this._tplId,
        previewText: this._previewText,
        testPhone: this._testPhone
      }, actionsSend);

      container.querySelectorAll('.rt-tab').forEach(b => {
        b.onclick = () => actionsSend.switchTab(b.dataset.tab);
      });
    }
  };

  window.MarketingModule = MarketingModule;
})();
