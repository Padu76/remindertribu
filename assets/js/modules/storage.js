// assets/js/modules/storage.js
(function () {
  'use strict';

  const log = (...a) => console.log('[Storage]', ...a);
  const warn = (...a) => console.warn('[Storage]', ...a);
  const err = (...a) => console.error('[Storage]', ...a);

  class StorageModule {
    constructor() {
      this.firebase = {
        enabled: !!(window.AppConfig?.firebase?.enabled),
        config: window.AppConfig?.firebase?.config || null,
      };
      this.useFirebase = this.firebase.enabled;
      this.db = null;
      this._fs = null; // firestore module (collection, doc, getDocs, ...)
      this.isInitialized = false;

      this.cache = {
        members: [],
        membersById: new Map(),
        reminders: [],
        templates: null, // se abiliti collezione templates
        stats: null,
        profile: null,
      };
    }

    /* ----------------- INIT & DB ----------------- */
    async init() {
      if (this.isInitialized) return true;
      try {
        if (this.useFirebase) {
          await this._ensureDb();
        }
        // Pre-carico members + reminders (non blocca la UI se fallisce)
        await Promise.allSettled([this.refreshMembers(), this.refreshReminders()]);
        this.isInitialized = true;
        log('initialized', { useFirebase: this.useFirebase });
      } catch (e) {
        warn('init failed (continuo in local only):', e?.message || e);
      }
      return true;
    }

    async _ensureDb() {
      // usa preferibilmente la connessione già aperta
      if (window.Firebase_Instance?.db) {
        this.db = window.Firebase_Instance.db;
        if (!this._fs) {
          // prova a caricare funzioni firestore (collection, addDoc, ...)
          this._fs = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        }
        return this.db;
      }

      // fallback: inizializza qui
      const FB = window.Firebase || {};
      if (!FB.initializeApp || !FB.getFirestore) {
        throw new Error('Firebase SDK non disponibile in window.Firebase');
      }
      if (!window.__RT_FIREBASE_APP) {
        try { window.__RT_FIREBASE_APP = FB.initializeApp(this.firebase.config); }
        catch(_) { /* app già inizializzata */ }
      }
      this.db = FB.getFirestore(window.__RT_FIREBASE_APP);
      this._fs = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      return this.db;
    }

    /* ----------------- HELPERS ----------------- */
    _mapMember(data, id) {
      const fullName = data.fullName || [data.nome, data.cognome].filter(Boolean).join(' ').trim();
      const phone = data.whatsapp || data.phone || data.telefono || '';
      const email = data.email || '';
      const status = data.status || data.stato || 'active';
      const createdAt = data.createdAt || data.created_at || null;
      return { id, ...data, fullName, phone, email, status, createdAt };
    }
    _indexMembers(list) {
      this.cache.membersById.clear();
      for (const m of list) this.cache.membersById.set(m.id, m);
    }

    _normalizeE164(raw) {
      if (!raw) return null;
      const digits = String(raw).replace(/[^\d+]/g, '');
      if (digits.startsWith('+')) return digits;
      if (digits.startsWith('00')) return '+' + digits.slice(2);
      const just = digits.replace(/\D/g, '');
      if (/^3\d{8,9}$/.test(just)) return `+39${just}`;
      if (/^39\d{8,10}$/.test(just)) return `+${just}`;
      return null;
    }

    /* ----------------- MEMBERS ----------------- */
    async refreshMembers() {
      if (!this.useFirebase) return this.cache.members;
      try {
        await this._ensureDb();
        const { collection, getDocs } = this._fs;
        const snap = await getDocs(collection(this.db, 'members'));
        const list = snap.docs.map(d => this._mapMember(d.data(), d.id));
        this.cache.members = list;
        this._indexMembers(list);
        log(`members refreshed: ${list.length}`);
      } catch (e) {
        warn('refreshMembers failed:', e?.message || e);
      }
      return this.cache.members;
    }

    async getMembers() {
      if (this.cache.members?.length) return this.cache.members;
      return this.refreshMembers();
    }

    async addMember(data) {
      if (!this.useFirebase) throw new Error('Firebase non abilitato');
      await this._ensureDb();
      const payload = { ...data };
      const { collection, addDoc } = this._fs;
      const ref = await addDoc(collection(this.db, 'members'), payload);
      await this.refreshMembers();
      return { id: ref.id };
    }

    async updateMember(id, updates) {
      if (!this.useFirebase) throw new Error('Firebase non abilitato');
      await this._ensureDb();
      const { doc, setDoc } = this._fs;
      await setDoc(doc(this.db, 'members', id), updates, { merge: true });
      await this.refreshMembers();
      return { ok: true };
    }

    async deleteMember(id) {
      if (!this.useFirebase) throw new Error('Firebase non abilitato');
      await this._ensureDb();
      const { doc, deleteDoc } = this._fs;
      await deleteDoc(doc(this.db, 'members', id));
      await this.refreshMembers();
      return { ok: true };
    }

    getMemberById(id) {
      return this.cache.membersById.get(id) || null;
    }

    /* ------ Alias compat: Contacts ------ */
    async getContacts() {
      const members = await this.getMembers();
      return members.map(m => ({
        id: m.id,
        name: m.fullName || m.name || '',
        phone: m.phone || '',
        email: m.email || '',
        tags: m.tags || [],
        status: m.status || 'active'
      }));
    }

    async addContact(data) {
      // mappa campi comuni verso members
      const payload = { ...data };
      if (data.name && !payload.fullName) payload.fullName = data.name;
      if (data.phone && !payload.whatsapp) payload.whatsapp = this._normalizeE164(data.phone) || data.phone;
      return this.addMember(payload);
    }

    async updateContact(id, updates) {
      const patch = { ...updates };
      if (updates.name) patch.fullName = updates.name;
      if (updates.phone) patch.whatsapp = this._normalizeE164(updates.phone) || updates.phone;
      return this.updateMember(id, patch);
    }

    async deleteContact(id) {
      return this.deleteMember(id);
    }

    /* ----------------- REMINDERS ----------------- */
    async refreshReminders() {
      if (!this.useFirebase) return this.cache.reminders;
      try {
        await this._ensureDb();
        const { collection, getDocs } = this._fs;
        const snap = await getDocs(collection(this.db, 'reminders'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        this.cache.reminders = list;
        log(`reminders refreshed: ${list.length}`);
      } catch (e) {
        warn('refreshReminders failed:', e?.message || e);
      }
      return this.cache.reminders;
    }

    getReminders() {
      // molti moduli si aspettano che sia sync: ritorno cache attuale
      return this.cache.reminders || [];
    }

    async addReminder(data) {
      if (!this.useFirebase) throw new Error('Firebase non abilitato');
      await this._ensureDb();
      const { collection, addDoc } = this._fs;
      const ref = await addDoc(collection(this.db, 'reminders'), { ...data });
      await this.refreshReminders();
      return { id: ref.id };
    }

    async updateReminder(id, updates) {
      if (!this.useFirebase) throw new Error('Firebase non abilitato');
      await this._ensureDb();
      const { doc, setDoc } = this._fs;
      await setDoc(doc(this.db, 'reminders', id), updates, { merge: true });
      await this.refreshReminders();
      return { ok: true };
    }

    async deleteReminder(id) {
      if (!this.useFirebase) throw new Error('Firebase non abilitato');
      await this._ensureDb();
      const { doc, deleteDoc } = this._fs;
      await deleteDoc(doc(this.db, 'reminders', id));
      await this.refreshReminders();
      return { ok: true };
    }

    /* ----------------- PROFILE & STATS ----------------- */
    getUserProfile() {
      if (this.cache.profile) return this.cache.profile;
      try {
        const raw = localStorage.getItem('rt_user_profile');
        if (raw) {
          this.cache.profile = JSON.parse(raw);
          return this.cache.profile;
        }
      } catch {}
      // nessun mock: se non c'è, ritorno oggetto minimale
      this.cache.profile = { businessName: 'Tribu Studio', senderName: 'Tribu', timezone: 'Europe/Rome' };
      return this.cache.profile;
    }

    setUserProfile(profile) {
      const p = { ...(profile || {}) };
      this.cache.profile = p;
      try { localStorage.setItem('rt_user_profile', JSON.stringify(p)); } catch {}
      return { ok: true };
    }

    getUserStats() {
      if (this.cache.stats) return this.cache.stats;
      // calcolo minimo dai reminders in cache (niente mock)
      const r = this.getReminders();
      const stats = {
        members: this.cache.members?.length || 0,
        reminders: r.length,
      };
      this.cache.stats = stats;
      return stats;
    }

    setUserStats(stats) {
      this.cache.stats = { ...(stats || {}) };
      try { localStorage.setItem('rt_user_stats', JSON.stringify(this.cache.stats)); } catch {}
      return { ok: true };
    }

    /* ----------------- (Opzionale) Templates Automazione -----------------
       Se hai una collezione 'templates' su Firestore, questi metodi li leggeranno.
       Altrimenti torneranno [] senza mock.
    ---------------------------------------------------------------------- */
    async getTemplates(category) {
      if (!this.useFirebase) return [];
      await this._ensureDb();
      try {
        const { collection, getDocs, query, where } = this._fs;
        const col = collection(this.db, 'templates');
        const q = category ? query(col, where('category', '==', category)) : col;
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        warn('getTemplates failed:', e?.message || e);
        return [];
      }
    }

    async addTemplate(data) {
      if (!this.useFirebase) throw new Error('Firebase non abilitato');
      await this._ensureDb();
      const { collection, addDoc } = this._fs;
      const ref = await addDoc(collection(this.db, 'templates'), { ...data });
      return { id: ref.id };
    }

    async updateTemplate(id, updates) {
      if (!this.useFirebase) throw new Error('Firebase non abilitato');
      await this._ensureDb();
      const { doc, setDoc } = this._fs;
      await setDoc(doc(this.db, 'templates', id), updates, { merge: true });
      return { ok: true };
    }

    async deleteTemplate(id) {
      if (!this.useFirebase) throw new Error('Firebase non abilitato');
      await this._ensureDb();
      const { doc, deleteDoc } = this._fs;
      await deleteDoc(doc(this.db, 'templates', id));
      return { ok: true };
    }
  }

  // Esponi singleton compat
  const instance = new StorageModule();
  window.Storage_Instance = instance;
  if (typeof window.App === 'object' && window.App.modules) {
    window.App.modules.storage = instance;
  }
})();
