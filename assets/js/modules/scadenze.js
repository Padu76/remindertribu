// assets/js/modules/scadenze.js
(function () {
  'use strict';

  const DAY = 24 * 60 * 60 * 1000;

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
  function formatISO(d) {
    const z = new Date(d);
    const yyyy = z.getFullYear();
    const mm = String(z.getMonth() + 1).padStart(2, '0');
    const dd = String(z.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  function addYears(d, n) { const x = new Date(d.getTime()); x.setFullYear(x.getFullYear() + (n||1)); return x; }
  function daysLeftFromToday(d) {
    if (!d) return null;
    const today = new Date();
    const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.floor((b - a) / DAY);
  }
  function computeStatus(daysLeft) {
    if (daysLeft == null) return 'unknown';
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'expiring';
    return 'active';
  }
  function pickPhone(m) { return m?.whatsapp || m?.phone || m?.telefono || ''; }
  function pickName(m)  { return m?.fullName || m?.name || m?.nome || ''; }
  function pickExpiry(m){ return m?.scadenza || m?.expiryDate || m?.expiry || m?.nextRenewal || null; }

  function vmFromMember(m) {
    const expiry = parseDateMaybe(pickExpiry(m));
    const daysLeft = daysLeftFromToday(expiry);
    const status = computeStatus(daysLeft);
    return { id: m.id, name: pickName(m), phone: pickPhone(m), expiry, daysLeft, status, raw: m };
  }

  function chip(st) {
    const map = {
      expiring: { c:'badge-amber', t:'In scadenza' },
      expired:  { c:'badge-red',   t:'Scaduto' }
    };
    const x = map[st] || { c:'badge-gray', t:'—' };
    return `<span class="chip ${x.c}">${x.t}</span>`;
  }

  function ensureStylesOnce() {
    if (document.getElementById('scadenze-inline-styles')) return;
    const css = `
      .rt-toolbar{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;margin:.75rem 0;}
      .rt-toolbar .right{margin-left:auto;display:flex;gap:.5rem;align-items:center}
      .rt-input,.rt-select{padding:.5rem .6rem;border-radius:.5rem;border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.15);color:#fff}
      .rt-btn{padding:.45rem .7rem;border-radius:.6rem;border:0;background:#2f7ddc;color:#fff;cursor:pointer}
      .rt-btn.secondary{background:#3c4658}
      .rt-btn.danger{background:#c23b3b}
      .rt-table{width:100%;border-collapse:separate;border-spacing:0;margin-top:.25rem}
      .rt-table th,.rt-table td{padding:.55rem .65rem;border-bottom:1px solid rgba(255,255,255,.08)}
      .chip{display:inline-block;padding:.2rem .45rem;border-radius:999px;font-size:.8rem;line-height:1}
      .badge-amber{background:#a97a1f;color:#fff}
      .badge-red{background:#b43333;color:#fff}
      .rt-actions{display:flex;gap:.35rem;flex-wrap:wrap}
      .rt-pop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);z-index:9999}
      .rt-pop .box{min-width:280px;max-width:92vw;background:#1f2937;color:#fff;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:16px;box-shadow:0 12px 38px rgba(0,0,0,.35)}
      .rt-pop h3{margin:.2rem 0 1rem;font-size:1.05rem}
      .rt-row{display:flex;gap:.5rem;align-items:center;margin:.35rem 0}
    `;
    const style = document.createElement('style');
    style.id = 'scadenze-inline-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function askDate(defaultISO) {
    return new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'rt-pop';
      wrap.innerHTML = `
        <div class="box">
          <h3>Imposta nuova scadenza</h3>
          <div class="rt-row">
            <input type="date" id="rt-renew-date" class="rt-input" value="${defaultISO}" />
          </div>
          <div class="rt-row" style="justify-content:flex-end">
            <button class="rt-btn secondary" data-act="cancel">Annulla</button>
            <button class="rt-btn" data-act="ok">Salva</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      const onClose = (val) => { wrap.remove(); resolve(val); };
      wrap.addEventListener('click', (e) => { if (e.target === wrap) onClose(null); });
      wrap.querySelector('[data-act="cancel"]').onclick = () => onClose(null);
      wrap.querySelector('[data-act="ok"]').onclick = () => {
        const v = wrap.querySelector('#rt-renew-date').value;
        onClose(v || null);
      };
    });
  }

  async function renewMember(member, storage) {
    const current = parseDateMaybe(pickExpiry(member)) || new Date();
    const suggested = addYears(current, 1);
    const val = await askDate(formatISO(suggested));
    if (!val) return false;

    const payload = { scadenza: val };
    try {
      if (typeof storage.updateMemberRenewal === 'function') {
        await storage.updateMemberRenewal(member.id, val);
      } else if (typeof storage.updateMember === 'function') {
        await storage.updateMember(member.id, payload);
      } else if (typeof storage.saveMember === 'function') {
        await storage.saveMember(member.id, payload);
      } else if (storage.firebase?.db) {
        await storage.firebase.db.collection('members').doc(member.id).set(payload, { merge: true });
      } else {
        alert('Aggiornamento non disponibile.');
        return false;
      }
      await storage.refreshMembers?.();
      window.App?._updateBadges?.();
      return true;
    } catch (e) {
      console.error('renewMember error:', e);
      alert('Errore nel salvataggio.');
      return false;
    }
  }

  async function deleteMember(member, storage) {
    if (!confirm(`Eliminare "${pickName(member)}"?`)) return false;
    try {
      if (typeof storage.deleteMember === 'function') {
        await storage.deleteMember(member.id);
      } else if (typeof storage.removeMember === 'function') {
        await storage.removeMember(member.id);
      } else if (storage.firebase?.db) {
        await storage.firebase.db.collection('members').doc(member.id).delete();
      } else {
        alert('Eliminazione non disponibile.');
        return false;
      }
      await storage.refreshMembers?.();
      window.App?._updateBadges?.();
      return true;
    } catch (e) {
      console.error('deleteMember error:', e);
      alert('Errore nell’eliminazione.');
      return false;
    }
  }

  function sendWhatsApp(phone, message) {
    if (window.WhatsAppModule?.sendText) {
      return window.WhatsAppModule.sendText(phone, message);
    }
    if (window.TribuApp?.sendWhatsAppMessage) {
      return window.TribuApp.sendWhatsAppMessage(phone, message);
    }
    alert('Modulo WhatsApp non disponibile.');
  }

  function render(container, vms, q = '') {
    let list = vms.filter(x => x.status === 'expired' || x.status === 'expiring');
    if (q) {
      const qq = q.toLowerCase();
      list = list.filter(x => (x.name||'').toLowerCase().includes(qq) || (x.phone||'').toLowerCase().includes(qq));
    }

    container.innerHTML = `
      <section class="page-block">
        <div class="rt-toolbar">
          <div class="right">
            <input id="s-search" class="rt-input" placeholder="Cerca…" value="${q || ''}">
            <button id="s-reload" class="rt-btn secondary"><i class="fa-solid fa-rotate"></i> Ricarica</button>
          </div>
        </div>

        <div class="card">
          <table class="rt-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefono</th>
                <th>Scadenza</th>
                <th>Stato</th>
                <th>Giorni</th>
                <th style="width:260px">Azioni</th>
              </tr>
            </thead>
            <tbody id="s-rows">
              ${list.length ? '' : `<tr><td colspan="6">Nessun tesserato in scadenza.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;

    const tbody = container.querySelector('#s-rows');
    for (const vm of list) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${vm.name || ''}</td>
        <td>${vm.phone || ''}</td>
        <td>${vm.expiry ? formatISO(vm.expiry) : '—'}</td>
        <td>${chip(vm.status)}</td>
        <td>${vm.daysLeft == null ? '—' : `${vm.daysLeft} gg`}</td>
        <td>
          <div class="rt-actions">
            <button class="rt-btn secondary" data-act="wa" data-id="${vm.id}">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp
            </button>
            <button class="rt-btn" data-act="renew" data-id="${vm.id}">
              <i class="fa-solid fa-check"></i> Rinnova
            </button>
            <button class="rt-btn danger" data-act="del" data-id="${vm.id}">
              <i class="fa-solid fa-trash"></i> Elimina
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  const ScadenzeModule = {
    _vms: [],
    _q: '',

    async init() {
      console.log('⏰ [Scadenze] init');
      ensureStylesOnce();

      const s = window.Storage_Instance;
      if (!s) return;

      if (!s.isInitialized) try { await s.init(); } catch {}
      if (typeof s.getMembersCached === 'function' && s.getMembersCached().length === 0) {
        try { await s.refreshMembers(); } catch {}
      }

      const members = s.getMembersCached?.() || [];
      this._vms = members.map(vmFromMember);
      return true;
    },

    async mount(container) {
      const s = window.Storage_Instance;
      if (!s) {
        container.innerHTML = `<section class="empty-state"><h2>Storage non disponibile</h2></section>`;
        return;
      }

      // ricostruisci VM dal cache corrente
      const members = s.getMembersCached?.() || [];
      this._vms = members.map(vmFromMember);

      render(container, this._vms, this._q);

      const $search = container.querySelector('#s-search');
      const $reload = container.querySelector('#s-reload');
      const $tbody  = container.querySelector('#s-rows');

      let t;
      $search?.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          this._q = $search.value;
          render(container, this._vms, this._q);
        }, 150);
      });

      $reload?.addEventListener('click', async () => {
        $reload.disabled = true;
        try {
          await s.refreshMembers?.();
          const again = s.getMembersCached?.() || [];
          this._vms = again.map(vmFromMember);
          render(container, this._vms, this._q);
          window.App?._updateBadges?.();
        } finally {
          $reload.disabled = false;
        }
      });

      $tbody?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-act]');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        const vm = this._vms.find(x => x.id === id);
        if (!vm) return;

        if (btn.dataset.act === 'wa') {
          const msg = `${vm.name?.split(' ')[0] || ''}, promemoria: la tua tessera ${vm.status==='expired'?'è scaduta':'è in scadenza'} ${vm.daysLeft!=null?`(${vm.daysLeft} gg)`:''}. Vuoi rinnovarla? 💪`;
          sendWhatsApp(vm.phone, msg);
        }
        if (btn.dataset.act === 'renew') {
          const ok = await renewMember(vm.raw, s);
          if (ok) {
            const again = s.getMembersCached?.() || [];
            this._vms = again.map(vmFromMember);
            render(container, this._vms, this._q);
          }
        }
        if (btn.dataset.act === 'del') {
          const ok = await deleteMember(vm.raw, s);
          if (ok) {
            const again = s.getMembersCached?.() || [];
            this._vms = again.map(vmFromMember);
            render(container, this._vms, this._q);
          }
        }
      });
    }
  };

  window.ScadenzeModule = ScadenzeModule;
})();
