// assets/js/modules/contacts.js
(function () {
  'use strict';

  /**
   * ContactsModule (Tesserati CSEN)
   * - Elenco completo tesserati con filtri (tutti/attivi/in scadenza/scaduti/recenti) + ricerca
   * - Azioni per riga: WhatsApp, Rinnova (datepicker), Elimina
   * - Azioni bulk: WA, Rinnova (datepicker), Elimina
   * - Badge "Appena rinnovato" se lastRenewalAt (o simili) <= 7 giorni
   * - Montaggio robusto: mai pagina vuota in caso di errori
   */
  class ContactsModule {
    constructor() {
      this.filter = 'all';  // all|active|expiring|expired|recent
      this.query = '';
      this.selected = new Set();
      this._mounted = false;
    }

    async init() {
      console.log('👥 [Tesserati] init');
      return true;
    }

    // ---- UI skeleton ----
    getPageContent() {
      return `
      <section class="page-container" style="padding:1rem">
        <div class="page-header">
          <div>
            <h1 class="page-title"><i class="fas fa-id-card"></i> Tesserati CSEN</h1>
            <p class="page-subtitle">Gestisci iscritti, rinnovi e comunicazioni</p>
          </div>
          <div class="quick-actions" style="gap:.5rem;flex-wrap:wrap">
            <select id="ctFilter" class="form-control">
              <option value="all">Tutti</option>
              <option value="active">Attivi</option>
              <option value="expiring">In scadenza ≤30gg</option>
              <option value="expired">Scaduti</option>
              <option value="recent">Rinnovati ≤7gg</option>
            </select>
            <input id="ctSearch" class="form-control" placeholder="Cerca nome/telefono…"/>
          </div>
        </div>

        <div class="card" style="padding:.5rem">
          <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center">
            <button id="ctBulkWa" class="btn btn-outline"><i class="fab fa-whatsapp"></i> Invia WA (selezionati)</button>
            <button id="ctBulkRenew" class="btn btn-outline"><i class="fas fa-rotate"></i> Segna rinnovati</button>
            <button id="ctBulkDel" class="btn btn-danger"><i class="fas fa-trash"></i> Elimina</button>
            <span class="badge" id="ctSelCount">0 selezionati</span>
          </div>
        </div>

        <div class="card" style="margin-top:.75rem">
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th style="width:36px"><input type="checkbox" id="ctAll"/></th>
                  <th>Nome</th>
                  <th>Telefono</th>
                  <th>Scadenza</th>
                  <th>Stato</th>
                  <th>Giorni</th>
                  <th style="width:260px">Azioni</th>
                </tr>
              </thead>
              <tbody id="ctBody"><tr><td colspan="7"><div class="empty">Caricamento…</div></td></tr></tbody>
            </table>
          </div>
        </div>
      </section>`;
    }

    // ---- Mount sicuro ----
    async initializePage() {
      if (this._mounted) return;
      try {
        await this._waitStorageReady(3000);

        document.getElementById('ctFilter')?.addEventListener('change', e => { this.filter = e.target.value; this.renderRows(); });
        document.getElementById('ctSearch')?.addEventListener('input', e => { this.query = e.target.value.trim().toLowerCase(); this.renderRows(); });

        document.getElementById('ctAll')?.addEventListener('change', (e) => {
          const box = e.target.checked;
          document.querySelectorAll('[data-ct-id]').forEach(row => {
            const id = row.getAttribute('data-ct-id');
            row.querySelector('input[type=checkbox]').checked = box;
            if (box) this.selected.add(id); else this.selected.delete(id);
          });
          this._updateSelCount();
        });

        document.getElementById('ctBulkWa')?.addEventListener('click', () => this._bulkSend());
        document.getElementById('ctBulkRenew')?.addEventListener('click', () => this._bulkRenew());
        document.getElementById('ctBulkDel')?.addEventListener('click', () => this._bulkDelete());

        this.renderRows();
        this._mounted = true;
        console.log('✅ [Tesserati] mounted');
      } catch (err) {
        console.error('❌ [Tesserati] mount error:', err);
        const body = document.getElementById('ctBody');
        if (body) body.innerHTML = `<tr><td colspan="7"><div class="empty">Errore nel modulo Tesserati: ${this._esc(err.message||err)}</div></td></tr>`;
      }
    }

    // ---- Data ----
    _storage() { return (window.App?.modules?.storage || window.Storage_Instance); }

    _isRecentlyRenewed(m) {
      // accetta più possibili nomi campo, tutti ISO o date parseable
      const src = m.lastRenewalAt || m.lastRenewalDate || m.renewedAt || m.renewalAt;
      if (!src) return false;
      const dt = new Date(src);
      if (isNaN(dt)) return false;
      const now = new Date();
      const diffDays = Math.floor((now - dt) / 86400000);
      return diffDays >= 0 && diffDays <= 7;
    }

    _getList() {
      const s = this._storage();
      const list = s.getMembersCached();

      let arr = (list || []).filter(m => {
        if (this.filter === 'recent') return this._isRecentlyRenewed(m);
        if (this.filter === 'all') return true;
        return m.status === this.filter;
      });

      // ricerca
      arr = arr.filter(m => {
        if (!this.query) return true;
        const phone = (m.whatsapp||m.telefono||m.phone||'');
        return (m.fullName||'').toLowerCase().includes(this.query) || String(phone).includes(this.query);
      });

      // ordinamento: se "recent", per data rinnovo desc; altrimenti alfabetico
      if (this.filter === 'recent') {
        arr.sort((a, b) => {
          const ad = new Date(a.lastRenewalAt || a.lastRenewalDate || a.renewedAt || 0).getTime();
          const bd = new Date(b.lastRenewalAt || b.lastRenewalDate || b.renewedAt || 0).getTime();
          return bd - ad;
        });
      } else {
        arr.sort((a,b) => (a.fullName||'').localeCompare(b.fullName||''));
      }
      return arr;
    }

    // ---- Render ----
    renderRows() {
      const body = document.getElementById('ctBody');
      if (!body) return;

      let list = [];
      try { list = this._getList(); } catch (e) { console.warn('[Tesserati] lista non disponibile:', e); }

      if (!Array.isArray(list) || list.length === 0) {
        const msg = this.filter==='recent' ? 'Nessun rinnovo negli ultimi 7 giorni' : 'Nessun tesserato';
        body.innerHTML = `<tr><td colspan="7"><div class="empty">${msg}</div></td></tr>`;
        this.selected.clear();
        this._updateSelCount();
        return;
      }

      body.innerHTML = list.map(m => {
        const id = m.id;
        const d = m.dataScadenza ? new Date(m.dataScadenza) : null;
        const dStr = d ? d.toLocaleDateString('it-IT') : '—';
        const phone = m.whatsapp||m.telefono||m.phone||'';
        const stBadge = m.status==='expired' ? 'danger' : (m.status==='expiring'?'warn':'ok');

        const recent = this._isRecentlyRenewed(m);
        const recentBadge = recent ? `<span class="badge badge-ok" title="Rinnovo negli ultimi 7 giorni">Appena rinnovato</span>` : '';

        return `
          <tr data-ct-id="${this._esc(id)}">
            <td><input type="checkbox" data-ct-sel="${this._esc(id)}"/></td>
            <td>
              <div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap">
                <span>${this._esc(m.fullName||'')}</span>
                ${recentBadge}
              </div>
            </td>
            <td>${this._esc(phone)}</td>
            <td>${dStr}</td>
            <td><span class="badge badge-${stBadge}">${m.status}</span></td>
            <td>${Number.isFinite(m.daysTillExpiry)?m.daysTillExpiry:'—'}</td>
            <td>
              <div style="display:flex;gap:.35rem;flex-wrap:wrap">
                <button class="btn btn-outline" data-ct-wa="${this._esc(id)}"><i class="fab fa-whatsapp"></i> WA</button>
                <button class="btn btn-primary" data-ct-renew="${this._esc(id)}"><i class="fas fa-rotate"></i> Rinnova</button>
                <button class="btn btn-danger" data-ct-del="${this._esc(id)}"><i class="fas fa-trash"></i></button>
              </div>
            </td>
          </tr>`;
      }).join('');

      // bind
      body.querySelectorAll('[data-ct-sel]').forEach(cb=>{
        cb.addEventListener('change', (e)=>{
          const id = e.currentTarget.getAttribute('data-ct-sel');
          if (e.currentTarget.checked) this.selected.add(id); else this.selected.delete(id);
          this._updateSelCount();
        });
      });
      body.querySelectorAll('[data-ct-wa]').forEach(btn=>{
        btn.addEventListener('click', (e)=> this._sendOne(e.currentTarget.getAttribute('data-ct-wa')));
      });
      body.querySelectorAll('[data-ct-renew]').forEach(btn=>{
        btn.addEventListener('click', (e)=> this._renewOne(e.currentTarget.getAttribute('data-ct-renew')));
      });
      body.querySelectorAll('[data-ct-del]').forEach(btn=>{
        btn.addEventListener('click', (e)=> this._deleteOne(e.currentTarget.getAttribute('data-ct-del')));
      });

      this._updateSelCount();
    }

    _updateSelCount(){ const el=document.getElementById('ctSelCount'); if(el) el.textContent = `${this.selected.size} selezionati`; }

    // ---- Azioni singole ----
    async _sendOne(id){
      try{
        const s = this._storage();
        const m = s.getMembersCached().find(x=>x.id===id); if(!m) return;
        const msg = this._composeReminderMessage(m);
        const phone = m.whatsapp || m.telefono || m.phone || '';
        const WA = window.App?.modules?.whatsapp || window.WhatsAppModule || {};
        if (WA.send) return WA.send(phone, msg);
        if (window.TribuApp?.sendWhatsAppMessage) return window.TribuApp.sendWhatsAppMessage(phone, msg);
        const e164 = String(phone).replace(/[^\d+]/g,''); window.open(`https://wa.me/${e164.replace('+','')}?text=${encodeURIComponent(msg)}`,'_blank');
      }catch(e){ console.error('[Tesserati] sendOne error:', e); alert('Invio WhatsApp non riuscito.'); }
    }

    async _renewOne(id){
      try{
        const s = this._storage();
        const m = s.getMembersCached().find(x=>x.id===id); if(!m) return;
        const chosen = await this._openDateModal({
          title: `Rinnovo per ${m.fullName || ''}`,
          subtitle: 'Scegli la data di rinnovo (la scadenza sarà +1 anno).',
          defaultDate: this._yyyyMMdd(new Date())
        });
        if (!chosen) return;
        await s.markMemberRenewed(id, {startDate: chosen});
        await s.refreshMembers();
        this.renderRows();
        window.Toast_Instance?.show?.('Rinnovo salvato','success');
      }catch(e){ console.error('[Tesserati] renewOne error:', e); alert('Errore nel salvataggio del rinnovo.'); }
    }

    async _deleteOne(id){
      try{
        const s = this._storage();
        const m = s.getMembersCached().find(x=>x.id===id); if(!m) return;
        if (!confirm(`Eliminare ${m.fullName}?`)) return;
        await s.deleteMember(id);
        await s.refreshMembers();
        this.selected.delete(id);
        this.renderRows();
      }catch(e){ console.error('[Tesserati] deleteOne error:', e); alert('Eliminazione non riuscita.'); }
    }

    // ---- Azioni bulk ----
    async _bulkSend(){
      if (!this.selected.size) return alert('Seleziona almeno un contatto');
      const s = this._storage();
      const list = s.getMembersCached().filter(x=>this.selected.has(x.id));
      const ok = confirm(`Inviare ${list.length} messaggi WhatsApp?`);
      if (!ok) return;
      for (const m of list){
        await this._sendOne(m.id);
        await new Promise(r=>setTimeout(r,700));
      }
    }

    async _bulkRenew(){
      if (!this.selected.size) return alert('Seleziona almeno un contatto');
      const chosen = await this._openDateModal({
        title: `Rinnovo di ${this.selected.size} contatti`,
        subtitle: 'Scegli la data di rinnovo per tutti (la scadenza sarà +1 anno).',
        defaultDate: this._yyyyMMdd(new Date())
      });
      if (!chosen) return;
      const s = this._storage();
      for (const id of this.selected){ await s.markMemberRenewed(id, {startDate: chosen}); }
      await s.refreshMembers();
      this.renderRows();
      window.Toast_Instance?.show?.('Rinnovi salvati','success');
    }

    async _bulkDelete(){
      if (!this.selected.size) return alert('Seleziona almeno un contatto');
      if (!confirm(`Eliminare ${this.selected.size} contatti?`)) return;
      const s = this._storage();
      for (const id of this.selected){ await s.deleteMember(id); }
      await s.refreshMembers();
      this.selected.clear();
      this.renderRows();
    }

    // ---- Messaggi ----
    _composeReminderMessage(m){
      const s = this._storage();
      const tpls = s.getTemplates?.() || {};
      const tpl = tpls['rinnovo_csen'];
      const days = (typeof m.daysTillExpiry==='number') ? m.daysTillExpiry : null;
      const stato = days===null ? 'senza data' : (days<0?'scaduto':'in scadenza');

      if (tpl && tpl.body) return this._renderTemplate(tpl.body, m);

      const d = m.dataScadenza ? new Date(m.dataScadenza).toLocaleDateString('it-IT') : '—';
      const delta = (days===null)? '' : (days<0 ? `, da ${Math.abs(days)} giorno/i` : `, tra ${days} giorno/i`);
      return `${(m.fullName||'').split(' ')[0]}, promemoria: il tuo tesseramento è ${stato} (${d}${delta}). Vuoi rinnovare oggi? 💪`;
    }

    _renderTemplate(body, m) {
      const repl = {
        '{nome}': (m?.fullName||m?.nome||'').split(' ')[0] || '',
        '{cognome}': (m?.cognome||'').trim(),
        '{scadenza}': m?.dataScadenza ? new Date(m.dataScadenza).toLocaleDateString('it-IT') : '',
        '{giorni_rimanenti}': (typeof m?.daysTillExpiry==='number') ? m.daysTillExpiry : ''
      };
      let out = String(body||'');
      for (const [k,v] of Object.entries(repl)) out = out.replaceAll(k, String(v));
      return out;
    }

    // ---- Modale DatePicker (no deps) ----
    async _openDateModal({ title, subtitle, defaultDate }) {
      return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position:fixed;inset:0;background:rgba(0,0,0,.5);
          display:flex;align-items:center;justify-content:center;z-index:9999;
        `;
        const card = document.createElement('div');
        card.style.cssText = `
          width:min(520px, 94vw); background:#0b1220; color:#e7edf8;
          border:1px solid #243041; border-radius:16px; padding:18px;
          box-shadow:0 12px 30px rgba(0,0,0,.35);
        `;
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin-bottom:.5rem">
            <h3 style="margin:0;font-size:1.1rem">${this._esc(title||'Rinnovo')}</h3>
            <button id="dpClose" class="btn btn-outline" style="padding:.2rem .5rem"><i class="fas fa-times"></i></button>
          </div>
          <p style="opacity:.8;margin:.2rem 0 1rem">${this._esc(subtitle||'')}</p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;align-items:center">
            <label for="dpDate">Data rinnovo</label>
            <input id="dpDate" type="date" class="form-control" value="${this._esc(defaultDate||'')}" />

            <div>Nuova scadenza ( +1 anno )</div>
            <div id="dpPreview" class="badge">—</div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
            <button id="dpCancel" class="btn btn-outline">Annulla</button>
            <button id="dpOk" class="btn btn-primary"><i class="fas fa-check"></i> Conferma</button>
          </div>
        `;
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        const dateInput = card.querySelector('#dpDate');
        const preview = card.querySelector('#dpPreview');
        const btnOk = card.querySelector('#dpOk');
        const btnCancel = card.querySelector('#dpCancel');
        const btnClose = card.querySelector('#dpClose');

        const updatePreview = () => {
          const val = dateInput.value;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) { preview.textContent = '—'; return; }
          const [yy,mm,dd] = val.split('-').map(n=>+n);
          const base = new Date(yy, mm-1, dd);
          if (isNaN(base)) { preview.textContent = '—'; return; }
          const end = new Date(base); end.setFullYear(end.getFullYear()+1);
          preview.textContent = end.toLocaleDateString('it-IT');
        };
        updatePreview();

        const close = (ret=null) => { document.body.removeChild(overlay); resolve(ret); };

        btnOk.addEventListener('click', () => {
          const val = dateInput.value;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) { alert('Seleziona una data valida (YYYY-MM-DD)'); return; }
          close(val);
        });
        btnCancel.addEventListener('click', () => close(null));
        btnClose.addEventListener('click', () => close(null));

        const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(null); } };
        document.addEventListener('keydown', onKey, { once:true });

        overlay.addEventListener('click', (e)=> { if (e.target === overlay) close(null); });
      });
    }

    // ---- Utils ----
    async _waitStorageReady(timeoutMs = 3000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const s = this._storage();
        if (s && s.isInitialized && Array.isArray(s.getMembersCached?.())) return true;
        await new Promise(r => setTimeout(r, 100));
      }
      throw new Error('Storage non inizializzato');
    }
    _yyyyMMdd(d){ const x=new Date(d); const y=x.getFullYear(); const m=String(x.getMonth()+1).padStart(2,'0'); const dd=String(x.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; }
    _esc(s){return (s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
  }

  window.ContactsModule = new ContactsModule();
})();
