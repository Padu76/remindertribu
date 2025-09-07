// assets/js/modules/import.js
(function () {
  'use strict';

  class ImportCSVModule {
    constructor() {
      this.rows = [];
      this.headers = [];
      this.mapping = {
        nome: null,
        cognome: null,
        phone: null,
        email: null,
        scadenza: null
      };
      this.previewCount = 20;
    }

    async init() {
      // niente da inizializzare
    }

    getPageContent() {
      return `
        <div class="page-container">
          <div class="page-header">
            <h1 class="page-title"><i class="fas fa-upload"></i> Import CSV</h1>
            <p class="page-subtitle">Carica un CSV per aggiungere nuovi tesserati o aggiornare quelli esistenti</p>
          </div>

          <div class="card" style="padding:1rem;">
            <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap;">
              <input id="csvFileInput" type="file" accept=".csv,text/csv" />
              <label class="checkbox">
                <input id="csvUpdateExisting" type="checkbox"/> Aggiorna anche gli esistenti (campi non vuoti)
              </label>
              <button id="csvClearBtn" class="btn btn-outline"><i class="fas fa-broom"></i> Pulisci</button>
            </div>

            <div id="csvMapBox" class="map-box hidden">
              <h3 style="margin-top:1rem;">Mappa colonne</h3>
              <div class="map-grid">
                ${this._mapSelectHTML('nome','Nome')}
                ${this._mapSelectHTML('cognome','Cognome')}
                ${this._mapSelectHTML('phone','Telefono / WhatsApp')}
                ${this._mapSelectHTML('email','Email')}
                ${this._mapSelectHTML('scadenza','Data scadenza')}
              </div>
            </div>

            <div id="csvPreviewBox" class="table-wrap hidden" style="margin-top:1rem;">
              <table class="table">
                <thead><tr id="csvHeadRow"></tr></thead>
                <tbody id="csvBodyRows"></tbody>
              </table>
            </div>

            <div id="csvSummary" class="hidden" style="margin-top:1rem;"></div>

            <div style="margin-top:1rem;display:flex;gap:.75rem;">
              <button id="csvAnalyzeBtn" class="btn btn-outline" disabled>
                <i class="fas fa-microscope"></i> Analizza
              </button>
              <button id="csvImportBtn" class="btn btn-primary" disabled>
                <i class="fas fa-cloud-upload-alt"></i> Importa
              </button>
            </div>
          </div>
        </div>

        <style>
          .map-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem;margin-top:.5rem}
          .map-item{display:flex;flex-direction:column;gap:.25rem}
          .map-item label{font-size:.9rem;opacity:.8}
          .hidden{display:none}
          .checkbox{display:flex;align-items:center;gap:.5rem}
        </style>
      `;
    }

    initializePage() {
      const fileInput = document.getElementById('csvFileInput');
      const btnAnalyze = document.getElementById('csvAnalyzeBtn');
      const btnImport = document.getElementById('csvImportBtn');
      const btnClear = document.getElementById('csvClearBtn');

      fileInput?.addEventListener('change', (e) => this._handleFile(e));
      btnAnalyze?.addEventListener('click', () => this._analyze());
      btnImport?.addEventListener('click', () => this._import());
      btnClear?.addEventListener('click', () => this._clear());
    }

    _mapSelectHTML(key, label) {
      return `
        <div class="map-item">
          <label>${label}</label>
          <select class="form-control" data-map="${key}" id="map_${key}">
            <option value="">— Seleziona colonna —</option>
          </select>
        </div>
      `;
    }

    _clear() {
      this.rows = [];
      this.headers = [];
      ['csvMapBox','csvPreviewBox','csvSummary'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });
      const head = document.getElementById('csvHeadRow');
      const body = document.getElementById('csvBodyRows');
      if (head) head.innerHTML = '';
      if (body) body.innerHTML = '';
      document.getElementById('csvAnalyzeBtn')?.setAttribute('disabled','true');
      document.getElementById('csvImportBtn')?.setAttribute('disabled','true');
      const fileInput = document.getElementById('csvFileInput');
      if (fileInput) fileInput.value = '';
    }

    _handleFile(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: h => (h || '').trim(),
        complete: (res) => {
          this.headers = res.meta?.fields || [];
          this.rows = (res.data || []).filter(r => Object.values(r).some(v => String(v||'').trim() !== ''));
          this._showMapping();
          this._renderPreview();
          document.getElementById('csvAnalyzeBtn')?.removeAttribute('disabled');
        },
        error: (err) => {
          console.error('CSV parse error:', err);
          alert('Errore nella lettura del CSV.');
        }
      });
    }

    _showMapping() {
      const box = document.getElementById('csvMapBox');
      if (!box) return;
      box.classList.remove('hidden');

      // autopop mapping
      const guess = (name) => {
        const lc = name.toLowerCase();
        return this.headers.find(h => {
          const hl = h.toLowerCase();
          if (name === 'nome')     return /^(nome|first.?name|name)$/.test(hl);
          if (name === 'cognome')  return /^(cognome|last.?name|surname)$/.test(hl);
          if (name === 'phone')    return /^(whatsapp|telefono|phone|cellulare|mobile)$/.test(hl);
          if (name === 'email')    return /^(email|mail)$/.test(hl);
          if (name === 'scadenza') return /(scadenza|expiry|expires?|data.?scadenza|valid(ità)?)/.test(hl);
          return false;
        }) || '';
      };

      this.mapping.nome = guess('nome') || '';
      this.mapping.cognome = guess('cognome') || '';
      this.mapping.phone = guess('phone') || '';
      this.mapping.email = guess('email') || '';
      this.mapping.scadenza = guess('scadenza') || '';

      ['nome','cognome','phone','email','scadenza'].forEach(k => {
        const sel = document.getElementById(`map_${k}`);
        if (!sel) return;
        sel.innerHTML = `<option value="">— Seleziona colonna —</option>` +
          this.headers.map(h => `<option value="${this._esc(h)}" ${h===this.mapping[k]?'selected':''}>${this._esc(h)}</option>`).join('');
        sel.addEventListener('change', () => { this.mapping[k] = sel.value || ''; });
      });
    }

    _renderPreview() {
      const head = document.getElementById('csvHeadRow');
      const body = document.getElementById('csvBodyRows');
      const box  = document.getElementById('csvPreviewBox');
      if (!head || !body || !box) return;

      head.innerHTML = this.headers.map(h => `<th>${this._esc(h)}</th>`).join('');
      const preview = this.rows.slice(0, this.previewCount);
      body.innerHTML = preview.map(r =>
        `<tr>${this.headers.map(h => `<td>${this._esc(r[h])}</td>`).join('')}</tr>`
      ).join('');
      box.classList.remove('hidden');
    }

    _mapRows() {
      const m = this.mapping;
      const get = (row, key) => m[key] ? String(row[m[key]] || '').trim() : '';
      const parseDate = (s) => {
        if (!s) return null;
        const t = s.trim();
        // dd/mm/yyyy
        const m1 = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (m1) {
          const d = Number(m1[1]), mo = Number(m1[2]) - 1, y = Number(m1[3]);
          const dt = new Date(y, mo, d);
          return isNaN(dt) ? null : dt.toISOString();
        }
        // yyyy-mm-dd
        const m2 = t.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
        if (m2) {
          const y = Number(m2[1]), mo = Number(m2[2]) - 1, d = Number(m2[3]);
          const dt = new Date(y, mo, d);
          return isNaN(dt) ? null : dt.toISOString();
        }
        const dt = new Date(t);
        return isNaN(dt) ? null : dt.toISOString();
      };

      return this.rows.map(r => ({
        nome: get(r,'nome'),
        cognome: get(r,'cognome'),
        phone: get(r,'phone'),
        email: get(r,'email'),
        dataScadenza: parseDate(get(r,'scadenza'))
      })).filter(x => (x.nome || x.cognome) && (x.phone || x.email)); // criteri minimi
    }

    _analyze() {
      const mapped = this._mapRows();
      if (!mapped.length) {
        alert('Nessuna riga valida trovata.');
        return;
      }
      const storage = window.App?.modules?.storage || window.Storage_Instance;
      if (!storage) return alert('Storage non disponibile');

      const existing = storage.getMembersCached();
      const seen = {
        ids: new Set(existing.map(m => m.id).filter(Boolean)),
        phones: new Set(existing.map(m => storage.normalizePhoneE164?.(m.whatsapp || m.telefono || m.phone) || '').filter(Boolean)),
        emails: new Set(existing.map(m => (m.email || '').toLowerCase()).filter(Boolean))
      };

      let newCount = 0, potentialUpdates = 0, invalids = 0;
      for (const x of mapped) {
        const phone = storage.normalizePhoneE164?.(x.phone) || '';
        const email = (x.email || '').toLowerCase();
        if (!x.nome && !x.cognome) { invalids++; continue; }
        if (!phone && !email) { invalids++; continue; }
        if (phone && seen.phones.has(phone)) { potentialUpdates++; continue; }
        if (email && seen.emails.has(email)) { potentialUpdates++; continue; }
        newCount++;
      }

      document.getElementById('csvSummary').classList.remove('hidden');
      document.getElementById('csvSummary').innerHTML = `
        <div class="empty">
          <strong>${mapped.length}</strong> righe valide pronte.
          <ul style="margin:.5rem 0 0 1rem;">
            <li><strong>Nuovi da inserire:</strong> ${newCount}</li>
            <li><strong>Possibili aggiornamenti:</strong> ${potentialUpdates}</li>
            <li><strong>Invalidi (scartati):</strong> ${invalids}</li>
          </ul>
        </div>
      `;
      document.getElementById('csvImportBtn')?.removeAttribute('disabled');
    }

    async _import() {
      const mapped = this._mapRows();
      if (!mapped.length) return alert('Nessuna riga valida.');
      const updateExisting = !!document.getElementById('csvUpdateExisting')?.checked;
      const btn = document.getElementById('csvImportBtn');
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Import in corso…`;

      const storage = window.App?.modules?.storage || window.Storage_Instance;
      try {
        const report = await storage.upsertMembersFromCSV(mapped, { updateExisting });
        this._showReport(report);
      } catch (e) {
        console.error(e);
        alert('Errore durante l’import.');
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-cloud-upload-alt"></i> Importa`;
      }
    }

    _showReport(rep) {
      const s = document.getElementById('csvSummary');
      if (!s) return;
      s.classList.remove('hidden');
      s.innerHTML = `
        <div class="empty">
          <div><strong>Import completato.</strong></div>
          <ul style="margin:.5rem 0 0 1rem;">
            <li>Inseriti: <strong>${rep.inserted}</strong></li>
            <li>Aggiornati: <strong>${rep.updated}</strong></li>
            <li>Saltati (già presenti): <strong>${rep.skipped}</strong></li>
            <li>Invalidi: <strong>${rep.invalids}</strong></li>
          </ul>
        </div>
      `;
    }

    _esc(s){return (s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
  }

  window.ImportCSVModule = new ImportCSVModule();
})();
