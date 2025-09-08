// assets/js/modules/scadenze.js
(function () {
  'use strict';

  /**
   * ScadenzeModule
   * - Elenca solo tesserati con status "expiring" o "expired"
   * - Azioni per riga: WhatsApp, Rinnova (oggi+1 anno o data scelta), Elimina
   * - Azioni bulk: WA, Rinnova, Elimina
   * - Montaggio "safe": se qualcosa va storto mostra un messaggio, NON lascia pagina vuota
   */
  class ScadenzeModule {
    constructor() {
      this.filter = 'all';  // all | expiring | expired
      this.query = '';
      this.selected = new Set();
      this._mounted = false;
    }

    async init() {
      console.log('⏰ [Scadenze] init');
      return true;
    }

    // ---- UI skeleton (nessun accesso a DOM qui) ----
    getPageContent() {
      return `
        <section class="page-container" style="padding:1rem">
          <div class="page-header">
            <div>
              <h1 class="page-title"><i class="fas fa-exclamation-triangle"></i> Scadenze</h1>
              <p class="page-subtitle">Tesseramenti in scadenza e scaduti. Invia reminder e gestisci rinnovi.</p>
            </div>
            <div class="quick-actions">
              <select id="sdFilter" class="form-control">
                <option value="all">Tutti</option>
                <option value="expiring">In scadenza ≤30gg</option>
                <option value="expired">Scaduti</option>
              </select>
              <input id="sdSearch" class="form-control" placeholder="Cerca nome/telefono…"/>
            </div>
          </div>

          <div class="card" style="padding:.5rem">
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center">
              <button id="sdBulkWa" class="btn btn-outline"><i class="fab fa-whatsapp"></i> Invia WA (selezionati)</button>
              <button id="sdBulkRenew" class="btn btn-outline"><i class="fas fa-rotate"></i> Segna rinnovati</button>
              <button id="sdBulkDel" class="btn btn-danger"><i class="fas fa-trash"></i> Elimina</button>
              <span class="badge" id="sdSelCount">0 selezionati</span>
            </div>
          </div>

          <div class="card" style="margin-top:.75rem">
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th style="width:36px"><input type="checkbox" id="sdAll"/></th>
                    <th>Nome</th>
                    <th>Telefono</th>
                    <th>Scadenza</th>
                    <th>Stato</th>
                    <th>Giorni</th>
                    <th style="width:260px">Azioni</th>
                  </tr>
                </thead>
                <tbody id="sdBody">
                  <tr><td colspan="7"><div class="empty">Caricamento…</div></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      `;
    }

    // ---- Mount sicuro sul DOM ----
    async initializePage() {
      if (this._mounted) return;
      try {
        // Attendi che lo storage sia pronto (max 3s)
        await this._waitStorageReady(3000);

        // Bind controlli
        document.getElementById('sdFilter')?.addEventListener('change', e => {
          this.filter = e.target.value; this.renderRows();
        });
        document.getElementById('sdSearch')?.addEventListener('input', e => {
          this.query = e.target.value.trim().toLowerCase(); this.renderRows();
        });
        document.getElementById('sdAll')?.addEventListener('change', (e) => {
          const box = e.target.checked;
          document.querySelectorAll('[data-sd-id]').forEach(row => {
            const id = row.getAttribute('data-sd-id');
            row.querySelector('input[type=checkbox]').checked = box;
            if (box) this.selected.add(id); else this.selected.delete(id);
          });
          this._updateSelCount();
        });

        document.getElementById('sdBulkWa')?.addEventListener('click', () => this._bulkSend());
        document.getElementById('sdBulkRenew')?.addEventListener('click', () => this._bulkRenew());
        document.getElementById('sdBulkDel')?.addEventListener('click', () => this._bulkDelete());

        // Prima render
        this.renderRows();
        this._mounted = true;
        console.log('✅ [Scadenze] mounted');
      } catch (err) {
        console.error('❌ [Scadenze] mount error:', err);
        const body = document.getElementById('sdBody');
        if (body) body.innerHTML = `<tr><td colspan="7"><div class="empty">Errore nel modulo Scadenze: ${this._esc(err.message||err)}</div></td></tr>`;
      }
    }

    // ---- Data helpers ----
    _storage() { return (window.App?.modules?.storage || window.Storage_Instance); }

    _getList() {
      const s = this._storage();
      const all = (s?.getMembersCached?.() || []).filter(m => m.status === 'expiring' || m.status === 'expired');
      return all
        .filter(m => (this.filter === 'all') ? true : (m.status === this.filter))
        .filter(m => {
          if (!this.query) return true;
          const phone = (m.whatsapp || m.telefono || m.phone || '');
          return (m.fullName || '').toLowerCase().includes(this.query) || String(phone).includes(this.query);
        })
        .sort((a, b) => (a.daysTillExpiry || 0) - (b.daysTillExpiry || 0));
    }

    // ---- Render tabella ----
    renderRows() {
      const body = document.getElementById('sdBody');
      if (!body) return;

      let list = [];
      try {
        list = this._getList();
      } catch (e) {
        console.warn('[Scadenze] lista non disponibile:', e);
      }

      if (!Array.isArray(list) || list.length === 0) {
        body.innerHTML = `<tr><td colspan="7"><div class="empty">Nessuna scadenza trovata.</div></td></tr>`;
        this.selected.clear();
        this._updateSelCount();
        return;
      }

      body.innerHTML = list.map(m => {
        const id = m.id;
        const d = m.dataScadenza ? new Date(m.dataScadenza) : null;
        const dStr = d ? d.toLocaleDateString('it-IT') : '—';
        const phone = m.whatsapp || m.telefono || m.phone || '';
        const stBadge = m.status === 'expired' ? 'danger' : 'warn';
        return `
          <tr data-sd-id="${this._esc(id)}">
            <td><input type="checkbox" data-sd-sel="${this._esc(id)}"/></td>
            <td>${this._esc(m.fullName || '')}</td>
            <td>${this._esc(phone)}</td>
            <td>${dStr}</td>
            <td><span class="badge badge-${stBadge}">${m.status}</span></td>
            <td>${Number.isFinite(m.daysTillExpiry) ? m.daysTillExpiry : '—'}</td>
            <td>
              <div style="display:flex;gap:.35rem;flex-wrap:wrap">
                <button class="btn btn-outline" data-sd-wa="${this._esc(id)}"><i class="fab fa-whatsapp"></i> WA</button>
                <button class="btn btn-primary" data-sd-renew="${this._esc(id)}"><i class="fas fa-rotate"></i> Rinnova</button>
                <button class="btn btn-danger" data-sd-del="${this._esc(id)}"><i class="fas fa-trash"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Bind riga → selezione
      body.querySelectorAll('[data-sd-sel]').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const id = e.currentTarget.getAttribute('data-sd-sel');
          if (e.currentTarget.checked) this.selected.add(id); else this.selected.delete(id);
          this._updateSelCount();
        });
      });

      // Bind azioni
      body.querySelectorAll('[data-sd-wa]').forEach(btn => {
        btn.addEventListener('click', (e) => this._sendOne(e.currentTarget.getAttribute('data-sd-wa')));
      });
      body.querySelectorAll('[data-sd-renew]').forEach(btn => {
        btn.addEventListener('click', (e) => this._renewOne(e.currentTarget.getAttribute('data-sd-renew')));
      });
      body.querySelectorAll('[data-sd-del]').forEach(btn => {
        btn.addEventListener('click', (e) => this._deleteOne(e.currentTarget.getAttribute('data-sd-del')));
      });

      this._updateSelCount();
    }

    _updateSelCount() {
      const el = document.getElementById('sdSelCount');
      if (el) el.textContent = `${this.selected.size} selezionati`;
    }

    // ---- Azioni singole ----
    async _sendOne(id) {
      try {
        const s = this._storage();
        const m = s.getMembersCached().find(x => x.id === id);
        if (!m) return;

        const msg = this._composeReminderMessage(m);
        const phone = m.whatsapp || m.telefono || m.phone || '';

        const WA = window.App?.modules?.whatsapp || window.WhatsAppModule || {};
        if (WA.send) return WA.send(phone, msg);
        if (window.TribuApp?.sendWhatsAppMessage) return window.TribuApp.sendWhatsAppMessage(phone, msg);

        // fallback diretto
        const e164 = String(phone).replace(/[^\d+]/g, '');
        window.open(`https://wa.me/${e164.replace('+','')}?text=${encodeURIComponent(msg)}`, '_blank');
      } catch (e) {
        console.error('[Scadenze] sendOne error:', e);
        alert('Invio WhatsApp non riuscito.');
      }
    }

    async _renewOne(id) {
      try {
        const s = this._storage();
        const m = s.getMembersCached().find(x => x.id === id);
        if (!m) return;

        const today = new Date(); const def = today.toISOString().slice(0,10);
        const start = prompt(`Data di rinnovo per ${m.fullName} (YYYY-MM-DD)`, def);
        if (!start) return;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) { alert('Formato data non valido'); return; }

        await s.markMemberRenewed(id, { startDate: start });
        await s.refreshMembers();
        this.renderRows();
        window.Toast_Instance?.show?.('Rinnovo salvato', 'success');
      } catch (e) {
        console.error('[Scadenze] renewOne error:', e);
        alert('Errore nel salvataggio del rinnovo.');
      }
    }

    async _deleteOne(id) {
      try {
        const s = this._storage();
        const m = s.getMembersCached().find(x => x.id === id);
        if (!m) return;
        if (!confirm(`Eliminare ${m.fullName}?`)) return;

        await s.deleteMember(id);
        await s.refreshMembers();
        this.selected.delete(id);
        this.renderRows();
      } catch (e) {
        console.error('[Scadenze] deleteOne error:', e);
        alert('Eliminazione non riuscita.');
      }
    }

    // ---- Azioni bulk ----
    async _bulkSend() {
      if (!this.selected.size) return alert('Seleziona almeno un contatto');
      const s = this._storage();
      const list = s.getMembersCached().filter(x => this.selected.has(x.id));
      const ok = confirm(`Inviare ${list.length} messaggi WhatsApp?`);
      if (!ok) return;
      for (const m of list) {
        await this._sendOne(m.id);
        await new Promise(r => setTimeout(r, 700));
      }
    }

    async _bulkRenew() {
      if (!this.selected.size) return alert('Seleziona almeno un contatto');
      const today = new Date(); const def = today.toISOString().slice(0,10);
      const start = prompt(`Data di rinnovo (YYYY-MM-DD) per ${this.selected.size} contatti`, def);
      if (!start) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) { alert('Formato data non valido'); return; }

      const s = this._storage();
      for (const id of this.selected) {
        await s.markMemberRenewed(id, { startDate: start });
      }
      await s.refreshMembers();
      this.renderRows();
      window.Toast_Instance?.show?.('Rinnovi salvati', 'success');
    }

    async _bulkDelete() {
      if (!this.selected.size) return alert('Seleziona almeno un contatto');
      if (!confirm(`Eliminare ${this.selected.size} contatti?`)) return;
      const s = this._storage();
      for (const id of this.selected) { await s.deleteMember(id); }
      await s.refreshMembers();
      this.selected.clear();
      this.renderRows();
    }

    // ---- Messaggi ----
    _composeReminderMessage(m) {
      const s = this._storage();
      const tpls = s.getTemplates?.() || {};
      const tpl = tpls['rinnovo_csen'];
      const days = (typeof m.daysTillExpiry === 'number') ? m.daysTillExpiry : null;
      const stato = (days === null) ? 'senza data' : (days < 0 ? 'scaduto' : 'in scadenza');

      if (tpl && tpl.body) return this._renderTemplate(tpl.body, m);

      const d = m.dataScadenza ? new Date(m.dataScadenza).toLocaleDateString('it-IT') : '—';
      const delta = (days === null) ? '' : (days < 0 ? `, da ${Math.abs(days)} giorno/i` : `, tra ${days} giorno/i`);
      return `${(m.fullName || '').split(' ')[0]}, promemoria: il tuo tesseramento è ${stato} (${d}${delta}). Vuoi rinnovare oggi? 💪`;
    }

    _renderTemplate(body, m) {
      const repl = {
        '{nome}': (m?.fullName || m?.nome || '').split(' ')[0] || '',
        '{cognome}': (m?.cognome || '').trim(),
        '{scadenza}': m?.dataScadenza ? new Date(m.dataScadenza).toLocaleDateString('it-IT') : '',
        '{giorni_rimanenti}': (typeof m?.daysTillExpiry === 'number') ? m.daysTillExpiry : ''
      };
      let out = String(body || '');
      for (const [k, v] of Object.entries(repl)) out = out.replaceAll(k, String(v));
      return out;
    }

    // ---- Util ----
    async _waitStorageReady(timeoutMs = 3000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const s = this._storage();
        if (s && s.isInitialized && Array.isArray(s.getMembersCached?.())) return true;
        await new Promise(r => setTimeout(r, 100));
      }
      throw new Error('Storage non inizializzato');
    }
    _esc(s) { return (s ?? '').replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])); }
  }

  // export globale
  window.ScadenzeModule = new ScadenzeModule();
})();
