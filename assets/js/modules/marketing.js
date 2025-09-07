// assets/js/modules/marketing.js
(function () {
  'use strict';

  class MarketingModule {
    constructor() {
      this.tab = 'segments';
      this.segmentKey = 'active';
      this.templateKey = '';
    }

    async init() {
      console.log('📣 [Marketing] init…');
      console.log('✅ [Marketing] initialized');
    }

    getPageContent() {
      return `
        <section class="page-container" style="padding:1rem">
          <div class="page-header">
            <div>
              <h1 class="page-title"><i class="fas fa-bullhorn"></i> Marketing</h1>
              <p class="page-subtitle">Segmenti, campagne, link tracciati e libreria motivazionale</p>
            </div>
            <div class="quick-actions">
              <button id="mkRefresh" class="btn btn-outline"><i class="fas fa-rotate-right"></i> Aggiorna</button>
            </div>
          </div>

          <div class="card" style="padding:8px;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${this._tabBtn('segments','Segmenti')}
              ${this._tabBtn('campaigns','Campagne')}
              ${this._tabBtn('links','Link & Shortlink')}
              ${this._tabBtn('motivation','Template motivazionali')}
            </div>
          </div>

          <div id="mkContent" style="margin-top:12px"></div>
        </section>
      `;
    }

    initializePage() {
      document.getElementById('mkRefresh')?.addEventListener('click', async () => {
        const s = window.App?.modules?.storage || window.Storage_Instance;
        await Promise.allSettled([s.refreshMembers(), s.refreshReminders()]);
        this._renderTab();
      });

      // tab switch
      document.querySelectorAll('[data-mk-tab]').forEach(b =>
        b.addEventListener('click', (e) => {
          const t = e.currentTarget.getAttribute('data-mk-tab');
          this.tab = t;
          document.querySelectorAll('[data-mk-tab]').forEach(x => x.classList.remove('btn-primary'));
          e.currentTarget.classList.add('btn-primary');
          this._renderTab();
        })
      );

      this._renderTab();
    }

    // ---------- Tabs ----------
    _renderTab() {
      const wrap = document.getElementById('mkContent');
      if (!wrap) return;

      if (this.tab === 'segments') return this._renderSegments(wrap);
      if (this.tab === 'campaigns') return this._renderCampaigns(wrap);
      if (this.tab === 'links') return this._renderLinks(wrap);
      if (this.tab === 'motivation') return this._renderMotivation(wrap);
    }

    // ========== SEGMENTI ==========
    _renderSegments(wrap) {
      const s = window.App?.modules?.storage || window.Storage_Instance;
      const members = s.getMembersCached();
      const seg = this._computeSegments(members);

      const templates = s.getTemplates ? s.getTemplates() : {};
      const keys = Object.keys(templates);

      wrap.innerHTML = `
        <div class="card">
          <h3 style="margin-top:0">Segmenti rapidi</h3>
          <div class="kpi-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:8px;">
            ${this._segCard('active','Attivi', seg.active.length, 'fa-circle-check')}
            ${this._segCard('expiring','In scadenza ≤30gg', seg.expiring.length, 'fa-hourglass-half')}
            ${this._segCard('expired','Scaduti', seg.expired.length, 'fa-triangle-exclamation')}
            ${this._segCard('pasto','Pasto Sano (tag)', seg.pasto.length, 'fa-bowl-food')}
            ${this._segCard('vip','VIP (tag)', seg.vip.length, 'fa-star')}
          </div>
        </div>

        <div class="card" style="margin-top:12px">
          <h3 style="margin-top:0">Broadcast manuale</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
            <div>
              <label>Segmento</label>
              <select id="mkSegment" class="form-control">
                <option value="active">Attivi (${seg.active.length})</option>
                <option value="expiring">In scadenza ≤30gg (${seg.expiring.length})</option>
                <option value="expired">Scaduti (${seg.expired.length})</option>
                <option value="pasto">Pasto Sano (tag) (${seg.pasto.length})</option>
                <option value="vip">VIP (tag) (${seg.vip.length})</option>
              </select>
            </div>
            <div>
              <label>Template</label>
              <select id="mkTemplate" class="form-control">
                ${keys.length ? keys.map(k=>`<option value="${this._attr(k)}">${this._esc(templates[k].title || k)}</option>`).join('') : `<option value="">— Nessun template salvato —</option>`}
              </select>
            </div>
            <div style="display:flex;align-items:flex-end;gap:8px;">
              <button id="mkPreview" class="btn btn-outline"><i class="fas fa-eye"></i> Anteprima</button>
              <button id="mkSend" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Invia ora</button>
            </div>
          </div>
          <div id="mkPreviewBox" class="empty" style="margin-top:10px;display:none"></div>
        </div>
      `;

      wrap.querySelectorAll('[data-seg-key]').forEach(card => {
        card.addEventListener('click', () => {
          this.segmentKey = card.getAttribute('data-seg-key');
          wrap.querySelector('#mkSegment').value = this.segmentKey;
        });
      });

      wrap.querySelector('#mkPreview')?.addEventListener('click', () => {
        const key = (wrap.querySelector('#mkTemplate')?.value || '');
        const t = templates[key] || {};
        const sample = seg[this.segmentKey][0];
        const msg = this._renderTemplate(t.body || '', sample);
        const box = wrap.querySelector('#mkPreviewBox');
        box.style.display = 'block';
        box.innerHTML = `<div><strong>Template:</strong> ${this._esc(t.title || key)}</div><div style="margin-top:.5rem;white-space:pre-wrap">${this._esc(msg || '(vuoto)')}</div>`;
      });

      wrap.querySelector('#mkSend')?.addEventListener('click', async () => {
        const segKey = wrap.querySelector('#mkSegment')?.value || this.segmentKey;
        const tplKey = wrap.querySelector('#mkTemplate')?.value || '';
        if (!tplKey) { alert('Seleziona un template'); return; }

        const t = templates[tplKey] || {};
        const list = seg[segKey] || [];
        if (!list.length) { alert('Segmento vuoto'); return; }

        const ok = confirm(`Inviare ${list.length} messaggi via WhatsApp (apertura tab)?`);
        if (!ok) return;

        await this._broadcastManual(list, t);
      });
    }

    _computeSegments(members) {
      const hasTag = (m, tag) => Array.isArray(m.tags) && m.tags.map(x=>String(x).toLowerCase()).includes(tag);
      const out = { active:[], expiring:[], expired:[], pasto:[], vip:[] };
      for (const m of members) {
        const n = typeof m.daysTillExpiry === 'number' ? m.daysTillExpiry : null;
        if (n === null || n > 30) out.active.push(m);
        else if (n < 0) out.expired.push(m);
        else out.expiring.push(m);
        if (hasTag(m, 'pasto sano') || hasTag(m, 'pasto_sano')) out.pasto.push(m);
        if (hasTag(m, 'vip')) out.vip.push(m);
      }
      return out;
    }

    async _broadcastManual(list, template) {
      const WA = window.App?.modules?.whatsapp || window.WhatsAppModule || {};
      const openOne = async (m) => {
        const msg = this._renderTemplate(template.body || '', m);
        const phone = m.whatsapp || m.telefono || m.phone || '';
        if (WA.send) return WA.send(phone, msg);
        if (window.TribuApp?.sendWhatsAppMessage) return window.TribuApp.sendWhatsAppMessage(phone, msg);
        // fallback wa.me
        const digits = String(phone).replace(/[^\d+]/g,''); const e164 = digits.startsWith('+')?digits:('+'+digits);
        const url = `https://wa.me/${e164.replace('+','')}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
      };

      let sent = 0;
      for (const m of list) {
        await openOne(m);
        sent++;
        await new Promise(r=>setTimeout(r, 700)); // throttle
      }
      alert(`Apertura WhatsApp completata per ${sent} contatti`);
    }

    _segCard(key, label, value, icon) {
      return `
        <div class="kpi-card" data-seg-key="${this._attr(key)}" style="border:1px solid #243041;border-radius:12px;padding:1rem;background:var(--glass-bg);cursor:pointer">
          <div style="display:flex;align-items:center;gap:.6rem;">
            <div class="kpi-ico" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:10px;border:1px solid #243041;background:#0b1220;">
              <i class="fas ${icon}"></i>
            </div>
            <div style="flex:1">
              <div style="font-size:1.4rem;font-weight:700">${value}</div>
              <div style="opacity:.75">${label}</div>
            </div>
          </div>
        </div>
      `;
    }

    // ========== CAMPAGNE ==========
    _renderCampaigns(wrap) {
      const s = window.App?.modules?.storage || window.Storage_Instance;
      const campaigns = s.getCampaignsCached ? s.getCampaignsCached() : [];

      wrap.innerHTML = `
        <div class="card">
          <h3 style="margin-top:0">Nuova campagna (bozza)</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
            <input id="cgName" class="form-control" placeholder="Nome campagna (es. Reminder scaduti)">
            <select id="cgSegment" class="form-control">
              <option value="active">Attivi</option>
              <option value="expiring">In scadenza ≤30gg</option>
              <option value="expired">Scaduti</option>
              <option value="pasto">Pasto Sano (tag)</option>
              <option value="vip">VIP (tag)</option>
            </select>
            <select id="cgTemplate" class="form-control">
              ${Object.entries(s.getTemplates?.()||{}).map(([k,v])=>`<option value="${this._attr(k)}">${this._esc(v.title||k)}</option>`).join('')}
            </select>
          </div>
          <div style="margin-top:8px;display:flex;gap:8px;">
            <button id="cgCreate" class="btn btn-primary"><i class="fas fa-plus"></i> Crea bozza</button>
          </div>
        </div>

        <div class="card" style="margin-top:12px">
          <h3 style="margin-top:0">Campagne</h3>
          ${campaigns.length ? `
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>Nome</th><th>Tipo</th><th>Segmento</th><th>Template</th><th>Stato</th><th>Creato</th></tr></thead>
                <tbody>
                  ${campaigns.map(c=>`
                    <tr>
                      <td>${this._esc(c.name)}</td>
                      <td>${c.type||'broadcast'}</td>
                      <td>${this._esc(c.segmentKey||'—')}</td>
                      <td>${this._esc(c.templateKey||'—')}</td>
                      <td>${this._esc(c.status||'bozza')}</td>
                      <td>${c.createdAt ? new Date(c.createdAt).toLocaleString('it-IT') : '—'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>` : `<div class="empty">Nessuna campagna</div>`}
        </div>
      `;

      wrap.querySelector('#cgCreate')?.addEventListener('click', async () => {
        const name = (wrap.querySelector('#cgName')?.value||'').trim();
        const segmentKey = wrap.querySelector('#cgSegment')?.value || 'active';
        const templateKey = wrap.querySelector('#cgTemplate')?.value || '';
        if (!name || !templateKey) { alert('Nome e template sono obbligatori'); return; }
        const payload = { name, type:'broadcast', segmentKey, templateKey, status:'bozza' };
        const res = await s.createCampaign?.(payload);
        if (res?.id) { alert('Bozza creata'); this._renderCampaigns(wrap); }
        else alert('Creazione fallita');
      });
    }

    // ========== LINK ==========
    _renderLinks(wrap) {
      const s = window.App?.modules?.storage || window.Storage_Instance;
      const links = s.getLinksCached ? s.getLinksCached() : [];

      wrap.innerHTML = `
        <div class="card">
          <h3 style="margin-top:0">Nuovo shortlink</h3>
          <div style="display:grid;grid-template-columns:2fr 1fr;gap:10px;">
            <input id="lnkTarget" class="form-control" placeholder="https://… target">
            <input id="lnkCampaign" class="form-control" placeholder="Nome campagna (opzionale)">
          </div>
          <div style="margin-top:8px;">
            <button id="lnkCreate" class="btn btn-primary"><i class="fas fa-link"></i> Crea shortlink</button>
          </div>
        </div>

        <div class="card" style="margin-top:12px">
          <h3 style="margin-top:0">Link esistenti</h3>
          ${links.length ? `
          <div class="table-wrap"><table class="table">
            <thead><tr><th>Short</th><th>Target</th><th>Campagna</th><th>Click</th><th>Creato</th></tr></thead>
            <tbody>
              ${links.map(l=>`
                <tr>
                  <td><a href="/api/r/${l.id}" target="_blank">/api/r/${l.id}</a></td>
                  <td style="max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this._esc(l.urlTarget)}</td>
                  <td>${this._esc(l.campaign||'')}</td>
                  <td>${l.clicks||0}</td>
                  <td>${l.createdAt?new Date(l.createdAt).toLocaleString('it-IT'):'—'}</td>
                </tr>`).join('')}
            </tbody></table></div>` : `<div class="empty">Nessun shortlink</div>`}
        </div>
      `;

      wrap.querySelector('#lnkCreate')?.addEventListener('click', async () => {
        const url = (wrap.querySelector('#lnkTarget')?.value||'').trim();
        if (!/^https?:\/\//i.test(url)) { alert('Inserisci un URL valido (http/https)'); return; }
        const campaign = (wrap.querySelector('#lnkCampaign')?.value||'').trim() || null;
        const res = await s.createLink?.({ urlTarget:url, campaign });
        if (res?.id) { alert(`Creato: /api/r/${res.id}`); this._renderLinks(wrap); }
        else alert('Creazione fallita');
      });
    }

    // ========== MOTIVAZIONALI ==========
    _renderMotivation(wrap) {
      const s = window.App?.modules?.storage || window.Storage_Instance;
      const ensureBtn = `
        <button id="mtEnsure" class="btn btn-primary"><i class="fas fa-book-open"></i> Carica raccolta motivazionale</button>
      `;

      const list = Object.entries(s.getTemplates?.()||{})
        .filter(([k]) => k.startsWith('motivazione_'))
        .map(([k,v]) => `<li><strong>${this._esc(v.title||k)}:</strong> <span class="text-soft">${this._esc((v.body||'').slice(0,120))}${(v.body||'').length>120?'…':''}</span></li>`)
        .join('');

      wrap.innerHTML = `
        <div class="card">
          <h3 style="margin-top:0">Template motivazionali</h3>
          <p class="text-soft">Una raccolta pronta con variabili (es. <code>{nome}</code>) per messaggi di motivazione e abitudini.</p>
          ${ensureBtn}
          <div style="margin-top:10px;">
            ${list ? `<ul style="margin-left:1rem">${list}</ul>` : `<div class="empty">Nessun template motivazionale presente.</div>`}
          </div>
        </div>
      `;

      wrap.querySelector('#mtEnsure')?.addEventListener('click', () => {
        this._ensureMotivationalTemplates();
        alert('Raccolta salvata. Vai in Automazione per modificarli.');
        this._renderMotivation(wrap);
      });
    }

    _ensureMotivationalTemplates() {
      const s = window.App?.modules?.storage || window.Storage_Instance;
      const add = (key, title, body) => {
        const existing = s.getTemplates?.() || {};
        if (!existing[key]) s.saveTemplate?.(key, { title, body, category:'Motivazione', updatedAt:new Date().toISOString() });
      };

      add('motivazione_buongiorno',
        'Buongiorno carico 💥',
        'Ciao {nome}! Oggi puntiamo a fare 1% meglio di ieri. Piccolo allenamento o una scelta sana a tavola: scegli ora e scrivimi cosa farai 💪');

      add('motivazione_post_allenamento',
        'Dopo allenamento 🔥',
        'Grande {nome}! Allenamento fatto = vittoria messa in cassaforte. Idratati e scegli una cena proteica. Domani continuiamo!');

      add('motivazione_ricaduta',
        'Capita a tutti 😉',
        'Ehi {nome}, uno sgarro non rovina il percorso. Ripartiamo dal prossimo pasto: acqua + proteine + verdure. Ci sei?');

      add('motivazione_settimana',
        'Settimana che spacca 🚀',
        'Nuova settimana, nuova energia! Fissa 2 allenamenti e 3 pasti “Pasto Sano”. Rispondi con ✅ quando hai scelto i giorni.');

      add('motivazione_scadenza',
        'Tesseramento & Focus',
        '{nome}, il tuo tesseramento è vicino alla scadenza ({scadenza}). Rinnova e continuiamo a progredire insieme 💚 Ti mando i dettagli?');

      add('motivazione_abitudine',
        'Piccole abitudini 🙌',
        'Scegli oggi un’abitudine semplice: 10k passi, 2lt acqua o 15’ di mobilità. Scrivimi quale fai oggi, ti tengo il conto!');

      add('motivazione_pasto_sano',
        'Pasto Sano pronto 🥗',
        '{nome}, vuoi prenotare i tuoi pasti per la settimana? Scelta rapida = meno stress e più risultati. Ti mando il menu aggiornato.');

      add('motivazione_ritorno',
        'Ti aspetto in studio 💪',
        'Ciao {nome}, manchi da un po’. Torniamo in pista? Ti propongo una sessione leggera di rientro. Quando ti va?');
    }

    // ---------- helpers ----------
    _tabBtn(key, label) {
      const cls = this.tab===key ? 'btn btn-primary' : 'btn btn-outline';
      return `<button class="${cls}" data-mk-tab="${this._attr(key)}">${label}</button>`;
    }
    _renderTemplate(body, m) {
      if (!body) return '';
      const repl = {
        '{nome}': (m?.nome || m?.fullName || '').split(' ')[0] || '',
        '{cognome}': (m?.cognome || '').trim(),
        '{scadenza}': m?.dataScadenza ? new Date(m.dataScadenza).toLocaleDateString('it-IT') : '',
        '{giorni_rimanenti}': (typeof m?.daysTillExpiry==='number') ? m.daysTillExpiry : ''
      };
      let out = body;
      for (const [k,v] of Object.entries(repl)) out = out.replaceAll(k, String(v));
      return out;
    }
    _esc(s){return (s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
    _attr(s){return (s??'').replace(/"/g,'&quot;')}
  }

  window.MarketingModule = new MarketingModule();
})();
