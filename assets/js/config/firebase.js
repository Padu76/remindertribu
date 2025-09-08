// assets/js/config/firebase.js
(function () {
  'use strict';

  const log = (...a) => console.log.apply(console, a);
  const warn = (...a) => console.warn.apply(console, a);
  const err  = (...a) => console.error.apply(console, a);

  const cfgRoot = (window.AppConfig && (window.AppConfig.FIREBASE || window.AppConfig.firebase)) || {};
  const fbEnabled = !!(cfgRoot && (cfgRoot.enabled || cfgRoot.config));
  const fbConfig = (cfgRoot && cfgRoot.config) || null;

  log('🔥 Initializing Firebase for TribuReminder...');
  if (!fbEnabled || !fbConfig) {
    warn('🔥 Firebase disabled in configuration');
    window.FirebaseModule = { ready: false };
    return;
  }

  // compat check
  const compat = (window.firebase && typeof window.firebase.initializeApp === 'function');
  if (!compat) {
    warn('⚠️ Firebase compat SDK non trovato. Assicurati di includere lo script compat prima di questo file.');
    window.FirebaseModule = { ready: false };
    return;
  }

  try {
    // evita doppia init
    const app = window.firebase.apps && window.firebase.apps.length
      ? window.firebase.app()
      : window.firebase.initializeApp(fbConfig);

    const db = window.firebase.firestore();

    // test veloce
    db.settings && typeof db.settings === 'function' && db.settings({ ignoreUndefinedProperties: true });
    log('✅ Firebase initialized successfully');
    log('📊 Connected to project:', fbConfig.projectId);

    async function getMembers() {
      const snap = await db.collection('members').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    async function updateMember(id, update) {
      await db.collection('members').doc(id).set(update, { merge: true });
      return true;
    }

    async function deleteMember(id) {
      await db.collection('members').doc(id).delete();
      return true;
    }

    async function getTemplates(collectionName) {
      const coll = collectionName || 'templates';
      const snap = await db.collection(coll).get();
      if (!snap.empty) {
        const out = {};
        snap.forEach(d => {
          const v = d.data() || {};
          const key = d.id;
          out[key] = { key, name: v.name || key, body: v.body || '', updatedAt: v.updatedAt || null };
        });
        return out;
      }
      // fallback
      if (!collectionName) return getTemplates('whatsapp_templates');
      return {};
    }

    async function saveTemplate(key, payload) {
      const data = Object.assign({}, payload, { name: payload.name || key, updatedAt: new Date().toISOString() });
      await db.collection('templates').doc(key).set(data, { merge: true });
      return true;
    }

    window.FirebaseModule = {
      ready: true,
      app,
      db,
      getMembers,
      updateMember,
      deleteMember,
      getTemplates,
      saveTemplate
    };
  } catch (e) {
    err('❌ Firebase init error:', e);
    window.FirebaseModule = { ready: false, error: e };
  }
})();
