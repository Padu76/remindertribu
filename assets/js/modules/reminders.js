// assets/js/modules/reminders.js
(function () {
  'use strict';

  class RemindersModule {
    constructor() {
      this.templates = {};
      this.currentKey = '';
    }

    async init() {
      console.log('⏱️ [Automazione] init…');
      console.log('✅ [Automazione] initialized');
    }

    getPageContent() {
      const s = window.App?.modules?.storage || window.Storage_Instance;
      this.templates = (s?.getTemplates?.() || {});
      const keys = Object.keys(this.templates);

      // KPI semplici (reali)
      const members = s?.getMembersCached?.() || [];
      const reminders = s?.getRemindersCached?.() || [];
      const statsHtml = `
        <div class="stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:1rem;">
          ${this._kpi('Tesserati', members.length, 'fa-users')}
          ${this._kpi('Reminders', reminders.length, 'fa-bell')}
          ${this._kpi('Template', keys.length, 'fa-file-pen')}
        </div>
      `;

      const sidebar = `
        <div class="side" style="border:1px solid #243041;border-radius:12px;padding:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;">
            <strong>Template</strong>
            <button id="tplNew" class="btn btn-outline btn-sm"><i class="fas fa-plus"></i> Nuovo</button>
          </div>
          <div id="tplList">
            ${keys.length ? keys.map(k => this._tplItem(k)).join('') : `<div class="empty">Nessun template salvato.</div>`}
          </div>
        </div>
      `;

      const editor = `
        <div class="editor" style="border:1px solid #243041;border-radius:12px;padding:10px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <label>Key</label>
              <input id="tplKey" class="form-control" placeholder="es. reminder_scadenza">
            </div>
            <div>
              <label>Titolo</label>
              <input id="tplTitle" class="form-control" placeholder="Titolo leggibile">
            </div>
          </div>
          <div style="margin-top:10px;">
            <label>Corpo messaggio</label>
            <textarea id="tplBody" class="form-control" rows="8" placeholder="Usa variabili tipo {nome}, {scadenza}…"></textarea>
          </div>
          <div style="display:flex;gap:.6rem;margin-top:10px;">
            <button id="tplSave" class="btn btn-primary"><i class="fas fa-save"></i> Salva</button>
            <button id="tplReset" class="btn btn-outline"><i class="fas fa-undo"></i> Reset</button>
          </div>
        </div>
      `;

      const tips = `
        <div style="opacity:.75;font-size:.9rem;margin-top:.75rem;">
          <i class="fas fa-lightbulb"></i> Suggerimento: variabili disponibili comuni
          <code>{nome}</code>, <code>{cognome}</code>, <code>{scadenza}</code>, <code>{giorni_rimanenti}</code>.
        </div>
      `;

      return `
        <section style="padding:1rem">
          <h2><i class="fas fa-robot"></i> Automazione</h2>
          ${statsHtml}
          <div class="grid" style="display:grid;grid-template-columns:280px 1fr;gap:12px;">
            ${sidebar}
            ${editor}
          </div>
          ${tips}
        </section>
      `;
    }

    initializePage() {
      const s = window.App?.modules?.storage || window.Storage_Instance;
      this.templates = (s?.getTemplates?.() || {});
      this._bindUI();
    }

    _bindUI() {
      const list = document.getElementById('tplList');
      const btnNew = document.getElementById('tplNew');
      const btnSave = document.getElementById('tplSave');
      const btnReset = document.getElementById('tplReset');

      list?.addEventListener('click', (e) => {
        const item = e.target.closest('[data-key]');
        if (!item) return;
        const key = item.getAttribute('data-key');
        this._loadKey(key);
      });

      btnNew?.addEventListener('click', () => {
        this._loadEditor({ key:'', title:'', body:'' });
      });

      btnSave?.addEventListener('click', () => this._save());
      btnReset?.addEventListener('click', () => {
        if (this.currentKey && this.templates[this.currentKey]) {
          this._loadKey(this.currentKey);
        } else {
          this._loadEditor({ key:'', title:'', body:'' });
        }
      });

      // Carica il primo disponibile
      const firstKey = Object.keys(this.templates)[0] || '';
      if (firstKey) this._loadKey(firstKey);
    }

    _tplItem(key) {
      const t = this.templates[key] || {};
      return `
        <div class="tpl-item" data-key="${this._attr(key)}" style="padding:.5rem;border-radius:8px;border:1px solid #243041;background:#0b1220;margin-bottom:.5rem;cursor:pointer;">
          <div style="font-weight:600">${this._esc(t.title || key)}</div>
          <div style="opacity:.7;font-size:.85rem">${this._esc(key)}</div>
        </div>
      `;
    }

    _loadKey(key) {
      const t = this.templates[key] || {};
      this.currentKey = key;
      this._loadEditor({ key, title: t.title || '', body: t.body || '' });
    }

    _loadEditor({key, title, body}) {
      const $ = (id) => document.getElementById(id);
      $('tplKey').value = key || '';
      $('tplTitle').value = title || '';
      $('tplBody').value = body || '';
    }

    _save() {
      const s = window.App?.modules?.storage || window.Storage_Instance;
      const key = (document.getElementById('tplKey').value || '').trim();
      const title = (document.getElementById('tplTitle').value || '').trim();
      const body = (document.getElementById('tplBody').value || '').trim();

      if (!key) { alert('Key obbligatoria'); return; }
      const payload = { title, body, updatedAt: new Date().toISOString() };
      const ok = s?.saveTemplate?.(key, payload);
      if (ok) {
        this.templates[key] = payload;
        this.currentKey = key;
        // refresh lista
        const list = document.getElementById('tplList');
        if (list) list.innerHTML = Object.keys(this.templates).map(k => this._tplItem(k)).join('') || `<div class="empty">Nessun template salvato.</div>`;
        alert('Template salvato.');
      } else {
        alert('Salvataggio fallito.');
      }
    }

    _kpi(label, value, icon) {
      return `
        <div style="border:1px solid #243041;border-radius:10px;padding:.75rem;background:var(--glass-bg);">
          <div style="display:flex;align-items:center;gap:.6rem;">
            <div style="width:32px;height:32px;border:1px solid #243041;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#0b1220;">
              <i class="fas ${icon}"></i>
            </div>
            <div><div style="font-size:1.25rem;font-weight:700">${value}</div><div style="opacity:.75">${label}</div></div>
          </div>
        </div>
      `;
    }

    _esc(s){return (s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
    _attr(s){return (s??'').replace(/"/g,'&quot;')}
  }

  window.RemindersModule = new RemindersModule();
})();
