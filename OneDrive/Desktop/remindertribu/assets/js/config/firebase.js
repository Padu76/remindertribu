// assets/js/config/firebase.js
(function () {
  'use strict';

  const log = (...args) => console.log('[Firebase]', ...args);
  const warn = (...args) => console.warn('[Firebase]', ...args);
  const err = (...args) => console.error('[Firebase]', ...args);

  // Inizializzazione sicura con fallback
  function initFirebase() {
    // Legge la configurazione da window.AppConfig (generata da inject-env.cjs)
    const appConfig = window.AppConfig || {};
    
    // Supporta sia FIREBASE che firebase (minuscolo) per retrocompatibilità
    const firebaseSection = appConfig.FIREBASE || appConfig.firebase || {};
    const fbEnabled = firebaseSection.enabled !== false && !!firebaseSection.config;
    const fbConfig = firebaseSection.config || null;

    log('🔥 Initializing Firebase for ReminderTribù...');
    
    // Verifica se Firebase è abilitato
    if (!fbEnabled || !fbConfig) {
      warn('⚠️ Firebase is disabled or not configured');
      warn('Check your environment variables on Vercel');
      window.FirebaseModule = { 
        ready: false,
        error: 'Firebase not configured'
      };
      return false;
    }

    // Verifica che Firebase SDK sia caricato
    if (!window.firebase || typeof window.firebase.initializeApp !== 'function') {
      err('❌ Firebase SDK not loaded. Check index.html includes Firebase scripts');
      window.FirebaseModule = { 
        ready: false,
        error: 'Firebase SDK not loaded'
      };
      return false;
    }

    // Validazione della configurazione
    const requiredFields = ['apiKey', 'projectId', 'authDomain'];
    const missingFields = requiredFields.filter(field => !fbConfig[field]);
    
    if (missingFields.length > 0) {
      err('❌ Missing required Firebase config fields:', missingFields);
      window.FirebaseModule = { 
        ready: false,
        error: `Missing config: ${missingFields.join(', ')}`
      };
      return false;
    }

    try {
      // Evita doppia inizializzazione
      let app;
      if (window.firebase.apps && window.firebase.apps.length > 0) {
        app = window.firebase.app();
        log('✅ Using existing Firebase app');
      } else {
        app = window.firebase.initializeApp(fbConfig);
        log('✅ Firebase app initialized');
      }

      // Inizializza Firestore
      const db = window.firebase.firestore();
      
      // Configurazione Firestore
      if (db.settings && typeof db.settings === 'function') {
        db.settings({ 
          ignoreUndefinedProperties: true,
          merge: true 
        });
      }

      log('✅ Firebase initialized successfully');
      log('📊 Connected to project:', fbConfig.projectId);

      // API Functions
      async function getMembers() {
        try {
          const snapshot = await db.collection('members').get();
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (error) {
          err('Error fetching members:', error);
          throw error;
        }
      }

      async function getMember(id) {
        try {
          const doc = await db.collection('members').doc(id).get();
          if (!doc.exists) return null;
          return { id: doc.id, ...doc.data() };
        } catch (error) {
          err('Error fetching member:', error);
          throw error;
        }
      }

      async function createMember(data) {
        try {
          const docRef = await db.collection('members').add({
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          return docRef.id;
        } catch (error) {
          err('Error creating member:', error);
          throw error;
        }
      }

      async function updateMember(id, update) {
        try {
          await db.collection('members').doc(id).set({
            ...update,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          return true;
        } catch (error) {
          err('Error updating member:', error);
          throw error;
        }
      }

      async function deleteMember(id) {
        try {
          await db.collection('members').doc(id).delete();
          return true;
        } catch (error) {
          err('Error deleting member:', error);
          throw error;
        }
      }

      async function getTemplates(collectionName = 'templates') {
        try {
          const snapshot = await db.collection(collectionName).get();
          const templates = {};
          
          snapshot.forEach(doc => {
            const data = doc.data() || {};
            templates[doc.id] = {
              key: doc.id,
              name: data.name || doc.id,
              body: data.body || '',
              category: data.category || 'general',
              updatedAt: data.updatedAt || null
            };
          });
          
          // Fallback to whatsapp_templates if empty
          if (Object.keys(templates).length === 0 && collectionName === 'templates') {
            return getTemplates('whatsapp_templates');
          }
          
          return templates;
        } catch (error) {
          err('Error fetching templates:', error);
          return {};
        }
      }

      async function saveTemplate(key, payload) {
        try {
          const data = {
            ...payload,
            name: payload.name || key,
            updatedAt: new Date().toISOString()
          };
          await db.collection('templates').doc(key).set(data, { merge: true });
          return true;
        } catch (error) {
          err('Error saving template:', error);
          throw error;
        }
      }

      async function getReminders() {
        try {
          const snapshot = await db.collection('reminders').get();
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (error) {
          err('Error fetching reminders:', error);
          return [];
        }
      }

      async function saveReminder(data) {
        try {
          const docRef = await db.collection('reminders').add({
            ...data,
            createdAt: new Date().toISOString()
          });
          return docRef.id;
        } catch (error) {
          err('Error saving reminder:', error);
          throw error;
        }
      }

      // Export module
      window.FirebaseModule = {
        ready: true,
        app,
        db,
        // Members
        getMembers,
        getMember,
        createMember,
        updateMember,
        deleteMember,
        // Templates
        getTemplates,
        saveTemplate,
        // Reminders
        getReminders,
        saveReminder,
        // Utils
        timestamp: () => window.firebase.firestore.Timestamp.now(),
        serverTimestamp: () => window.firebase.firestore.FieldValue.serverTimestamp()
      };

      log('✅ FirebaseModule ready with all methods');
      return true;

    } catch (error) {
      err('❌ Firebase initialization failed:', error);
      window.FirebaseModule = {
        ready: false,
        error: error.message || 'Unknown error'
      };
      return false;
    }
  }

  // Attendi che il DOM e la configurazione siano pronti
  function waitForConfig() {
    if (window.AppConfig) {
      initFirebase();
    } else {
      // Riprova dopo 100ms se AppConfig non è ancora disponibile
      setTimeout(waitForConfig, 100);
    }
  }

  // Inizia il processo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForConfig);
  } else {
    waitForConfig();
  }

})();